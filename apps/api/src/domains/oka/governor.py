import time
import asyncio
import sqlite3
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
            db_path = str(Path.home() / ".lifeos" / "oka" / "governor.db")
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
        self.max_rpd = 1000
        self.safety_margin = 0.85  # Increased safety margin for Free Tier

        # 60-second sliding windows
        self.request_window: deque = deque()   # request timestamps
        self.token_window: deque = deque()     # (timestamp, tokens) tuples

        # Dynamic concurrency
        self.active_slots = 0
        self.max_concurrency = 1   # Forced sequential for Free Tier stability
        self.min_concurrency = 1
        self.current_concurrency_limit = 1   # start strictly sequential

        # Telemetry
        self.current_pressure = 0.0
        self.last_throttle_event = None
        self.cooldown_until = 0.0

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

    def _check_daily_limits_sync(self, expected_tokens: int, expected_requests: int, api_key_hash: str = 'default') -> tuple[bool, str]:
        """Synchronous check of daily limits against SQLite DB for a specific API key."""
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND api_key_hash = ?', (cutoff_24h, api_key_hash))
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

    async def get_permit(self, expected_tokens: int = 2000, expected_requests: int = 1, api_key_hash: str = 'default'):
        """
        Precision Pacing: grants permits immediately when budget is available,
        sleeps the EXACT duration needed when the window is full.
        No fixed-time spin loops.
        """
        # First, ensure we haven't blown the daily budget for this specific key
        is_ok, err_msg = await asyncio.to_thread(self._check_daily_limits_sync, expected_tokens, expected_requests, api_key_hash)
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

    def _record_usage_db_sync(self, tokens: int, requests: int, api_key_hash: str):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    'INSERT INTO usage (timestamp, tokens, requests, api_key_hash) VALUES (?, ?, ?, ?)',
                    (time.time(), tokens, requests, api_key_hash)
                )
                conn.commit()
        except Exception as e:
            print(f"[Governor] Failed to record usage: {e}")

    def _record_usage_db(self, tokens: int, requests: int, api_key_hash: str = 'default'):
        # Fire and forget database write off the main event loop
        asyncio.create_task(asyncio.to_thread(self._record_usage_db_sync, tokens, requests, api_key_hash))

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
