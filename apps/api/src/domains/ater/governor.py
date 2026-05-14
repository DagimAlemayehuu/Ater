import time
import asyncio
import sqlite3
import json
import hashlib
from pathlib import Path
from collections import deque

class DailyLimitExceededException(Exception):
    pass

class TokenGovernor:
    """
    Intelligent Air Traffic Controller for LLM traffic.
    Uses a sliding window (deque) for high-performance in-memory pacing
    and SQLite for persistent usage tracking.
    """
    def __init__(self, db_path: str = None):
        if not db_path:
            db_path = str(Path.home() / ".ater" / "ater" / "governor.db")
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path
        self._init_db()
        self._lock = asyncio.Lock()
        self._slot_event = asyncio.Event()
        self._slot_event.set()  # Initially unblocked

        # Groq Free Tier limits (llama-4-scout-17b)
        self.max_tpm = 30000
        self.max_rpm = 30
        self.max_tpd = 500000
        self.max_rpd = 5000
        self.safety_margin = 0.70  # Conservative margin for Free Tier stability
        
        # 60-second sliding windows
        self.request_window: deque = deque()   # request timestamps
        self.token_window: deque = deque()     # (timestamp, tokens) tuples

        # Dynamic concurrency
        self.active_slots = 0
        self.max_concurrency = 3   # Support parallel generation for massive throughput
        self.min_concurrency = 1
        self.current_concurrency_limit = 1

        # Telemetry
        self.current_pressure = 0.0
        self.last_throttle_event = None
        self.cooldown_until = 0.0
        
        # API Key management
        self._current_key_hash = "default"

    def get_valid_api_key(self, api_keys_str: str, expected_tokens: int = 2000, expected_requests: int = 1) -> str:
        """Selects the first API key from a comma-separated list that hasn't exceeded daily limits."""
        if not api_keys_str:
            return ""
        
        keys = [k.strip() for k in api_keys_str.split(",") if k.strip()]
        if not keys:
            return ""
            
        if len(keys) == 1:
            self.set_api_key(keys[0])
            return keys[0]

        cutoff_24h = time.time() - (24 * 3600)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                for k in keys:
                    key_hash = hashlib.sha256(k.encode()).hexdigest()[:16]
                    cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND api_key_hash = ?', (cutoff_24h, key_hash))
                    row = cursor.fetchone()
                    used_tpd = (row[0] or 0) + expected_tokens
                    used_rpd = (row[1] or 0) + expected_requests
                    
                    if used_tpd < self.max_tpd and used_rpd < self.max_rpd:
                        self.set_api_key(k)
                        return k
        except Exception as e:
            print(f"[Governor] DB Error picking valid key: {e}")

        # Fallback to first key if all fail or DB error
        self.set_api_key(keys[0])
        return keys[0]

    def set_api_key(self, api_key: str) -> None:
        """
        Register the active API key with the governor.
        Called on startup and every time the user swaps keys in Settings.
        Resets in-memory sliding windows so the new key starts with a
        fresh rate-limit budget instead of inheriting the old key's state.
        """
        if not api_key:
            return
        new_hash = hashlib.sha256(api_key.strip().encode()).hexdigest()[:16]
        if new_hash == self._current_key_hash:
            return  # Same key — nothing to do

        old_hash = self._current_key_hash
        self._current_key_hash = new_hash
        # Reset in-memory windows — they're per-key at the API level
        self.request_window.clear()
        self.token_window.clear()
        self.cooldown_until = 0.0
        self.current_concurrency_limit = self.min_concurrency
        print(
            f"[Governor] 🔑 API key changed ({old_hash} → {new_hash}). "
            f"In-memory windows reset. Daily quota tracked independently per key."
        )

    def get_key_status(self) -> dict:
        """Returns daily usage stats for the currently active key."""
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND api_key_hash = ?',
                    (cutoff_24h, self._current_key_hash)
                )
                row = cursor.fetchone()
                used_tpd = row[0] or 0
                used_rpd = row[1] or 0
                return {
                    "key_hash": self._current_key_hash,
                    "used_tpd": used_tpd,
                    "max_tpd": self.max_tpd,
                    "used_rpd": used_rpd,
                    "max_rpd": self.max_rpd,
                    "tpd_pct": round((used_tpd / self.max_tpd) * 100, 1),
                    "rpd_pct": round((used_rpd / self.max_rpd) * 100, 1),
                    "exhausted": used_tpd >= self.max_tpd or used_rpd >= self.max_rpd,
                }
        except Exception as e:
            return {"key_hash": self._current_key_hash, "error": str(e)}

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL,
                    tokens INTEGER,
                    requests INTEGER,
                    api_key_hash TEXT DEFAULT 'default'
                )
            ''')
            try:
                conn.execute("ALTER TABLE usage ADD COLUMN api_key_hash TEXT DEFAULT 'default'")
            except sqlite3.OperationalError:
                pass
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON usage(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_key_ts ON usage(api_key_hash, timestamp)")
            conn.commit()

    def _clear_old_windows(self, now: float):
        cutoff = now - 60.0
        while self.request_window and self.request_window[0] < cutoff:
            self.request_window.popleft()
        while self.token_window and self.token_window[0][0] < cutoff:
            self.token_window.popleft()

    def _tpm_wait_seconds(self, expected_tokens: int, now: float) -> float:
        """
        Calculates EXACT seconds until enough token budget expires from the window.
        Walks oldest entries until the freed budget satisfies the request.
        Returns 0.0 if budget is already available.
        """
        tpm_limit = self.max_tpm * self.safety_margin
        tpm_used = sum(t for _, t in self.token_window)
        if tpm_used + expected_tokens <= tpm_limit:
            return 0.0
        # Walk oldest → newest, accumulate freed tokens
        freed = 0
        for ts, tok in self.token_window:
            freed += tok
            if tpm_used - freed + expected_tokens <= tpm_limit:
                return max(0.0, (ts + 60.0) - now + 0.05)  # +50ms buffer
        # Entire window must expire
        if self.token_window:
            return max(0.0, (self.token_window[0][0] + 60.0) - now + 0.05)
        return 0.0

    def _rpm_wait_seconds(self, now: float) -> float:
        """
        Calculates EXACT seconds until an RPM slot opens.
        Returns 0.0 if already within limit.
        """
        rpm_limit = self.max_rpm * self.safety_margin
        if len(self.request_window) < rpm_limit:
            return 0.0
        if self.request_window:
            return max(0.0, (self.request_window[0] + 60.0) - now + 0.05)
        return 0.0

    def _check_daily_limits_sync(self, expected_tokens: int, expected_requests: int) -> tuple[bool, str]:
        """Synchronous check of daily limits against SQLite DB for the current API key."""
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND api_key_hash = ?', (cutoff_24h, self._current_key_hash))
                row = cursor.fetchone()
                used_tpd = (row[0] or 0) + expected_tokens
                used_rpd = (row[1] or 0) + expected_requests
                
                if used_tpd >= self.max_tpd:
                    return False, f"Daily Token Limit reached ({int(used_tpd)}/{self.max_tpd} TPD for this key)"
                if used_rpd >= self.max_rpd:
                    return False, f"Daily Request Limit reached ({int(used_rpd)}/{self.max_rpd} RPD for this key)"
                return True, ""
        except Exception as e:
            print(f"[Governor] DB Error checking daily limit: {e}")
            return True, ""

    async def get_permit(self, expected_tokens: int = 2000, expected_requests: int = 1):
        """
        Precision Pacing: grants permits immediately when budget is available,
        sleeps the EXACT duration needed when the window is full.
        No fixed-time spin loops.
        """
        # First, ensure we haven't blown the daily budget for this specific key
        is_ok, err_msg = await asyncio.to_thread(self._check_daily_limits_sync, expected_tokens, expected_requests)
        if not is_ok:
            raise DailyLimitExceededException(err_msg)

        async with self._lock:
            while True:
                now = time.time()

                # Hard cooldown — triggered by external 429 detection
                if now < self.cooldown_until:
                    wait_remaining = self.cooldown_until - now
                    self.last_throttle_event = f"Cooling down ({wait_remaining:.1f}s)..."
                    print(f"[Governor] ⏳ Cooldown active. Waiting {wait_remaining:.1f}s...")
                    await asyncio.sleep(wait_remaining + 0.1)
                    continue

                self._clear_old_windows(now)

                tpm_used = sum(t for _, t in self.token_window)
                rpm_used = len(self.request_window)

                tpm_ratio = tpm_used / (self.max_tpm * self.safety_margin)
                rpm_ratio = rpm_used / (self.max_rpm * self.safety_margin)
                pressure = max(tpm_ratio, rpm_ratio)
                self.current_pressure = pressure

                # Dynamic concurrency scaling based on pressure
                if pressure < 0.30 and self.current_concurrency_limit < self.max_concurrency:
                    self.current_concurrency_limit = min(self.current_concurrency_limit + 1, self.max_concurrency)
                    print(f"[Governor] 🚀 Pressure low ({pressure:.2f}). Scaling UP → {self.current_concurrency_limit} workers")
                elif pressure > 0.75 and self.current_concurrency_limit > self.min_concurrency:
                    self.current_concurrency_limit = max(self.current_concurrency_limit - 1, self.min_concurrency)
                    print(f"[Governor] 🚦 Pressure high ({pressure:.2f}). Scaling DOWN → {self.current_concurrency_limit} workers")

                # Calculate precise wait
                tpm_wait = self._tpm_wait_seconds(expected_tokens, now)
                rpm_wait = self._rpm_wait_seconds(now)
                wait = max(tpm_wait, rpm_wait)

                if wait <= 0.0:
                    # ✅ Permit granted
                    self.last_throttle_event = None
                    self.request_window.append(now)
                    self.token_window.append((now, expected_tokens))
                    self._record_usage_db(expected_tokens, expected_requests)
                    return True

                self.last_throttle_event = (
                    f"Pacing {wait:.1f}s "
                    f"(TPM: {int(tpm_used)}/{self.max_tpm}, RPM: {rpm_used}/{self.max_rpm})"
                )
                print(f"[Governor] ⏱  Precise wait {wait:.1f}s "
                      f"(TPM: {int(tpm_used)}/{self.max_tpm})")
                await asyncio.sleep(wait)

    async def acquire_slot(self):
        """Event-driven slot acquisition — no 0.5s polling spin."""
        while True:
            async with self._lock:
                if self.active_slots < self.current_concurrency_limit:
                    self.active_slots += 1
                    return True
            # Block until release_slot fires the event
            self._slot_event.clear()
            await self._slot_event.wait()

    async def release_slot(self):
        """Release a concurrency slot and wake any blocked acquire_slot callers."""
        async with self._lock:
            self.active_slots = max(0, self.active_slots - 1)
        self._slot_event.set()

    def _record_usage_db_sync(self, tokens: int, requests: int):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    'INSERT INTO usage (timestamp, tokens, requests, api_key_hash) VALUES (?, ?, ?, ?)',
                    (time.time(), tokens, requests, self._current_key_hash)
                )
                conn.commit()
        except Exception as e:
            print(f"[Governor] Failed to record usage: {e}")

    def _record_usage_db(self, tokens: int, requests: int):
        # Fire and forget database write off the main event loop
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(asyncio.to_thread(self._record_usage_db_sync, tokens, requests))
        except RuntimeError:
            self._record_usage_db_sync(tokens, requests)

    def report_error(self, wait_seconds: float = 10.0):
        """Force a hard cooldown on 429 detection from any agent."""
        now = time.time()
        self.cooldown_until = now + wait_seconds
        self.current_concurrency_limit = self.min_concurrency
        # Inject moderate token/request penalty
        for _ in range(3):
            self.request_window.append(now)
        self.token_window.append((now, int(self.max_tpm * 0.50)))
        print(f"[Governor] 💥 429 received. Dropping to {self.min_concurrency} worker. "
              f"Hard cooldown for {wait_seconds}s...")
        self._slot_event.set()  # Wake blocked workers so they re-evaluate

    @property
    def current_tpm(self) -> int:
        now = time.time()
        cutoff = now - 60.0
        return sum(t for ts, t in self.token_window if ts >= cutoff)

    @property
    def current_rpm(self) -> int:
        now = time.time()
        cutoff = now - 60.0
        return sum(1 for ts in self.request_window if ts >= cutoff)

# Global singleton — shared across all agents and the service
governor = TokenGovernor()
