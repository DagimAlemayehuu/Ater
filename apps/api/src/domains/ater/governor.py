import time
import asyncio
import sqlite3
import hashlib
from pathlib import Path
from collections import deque
from typing import Any
from src.domains.ai.provider_profiles import get_provider_profile

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

        self.provider = "groq"
        self.model = ""
        self.base_url = None
        self.profile = get_provider_profile(self.provider, self.model)
        self.max_tpm = self.profile.max_tpm
        self.max_rpm = self.profile.max_rpm
        self.max_tpd = self.profile.max_tpd
        self.max_rpd = self.profile.max_rpd
        self.safety_margin = self.profile.safety_margin
        
        # 60-second sliding windows
        self.request_window: deque = deque()   # request timestamps
        self.token_window: deque = deque()     # list of dicts: {'ts': float, 'expected': int, 'actual': Optional[int], 'id': str}

        # Dynamic concurrency
        self.active_slots = 0
        self.max_concurrency = self.profile.max_concurrency
        self.min_concurrency = 1
        self.current_concurrency_limit = 1

        # Telemetry
        self.current_pressure = 0.0
        self.last_throttle_event = None
        self.cooldown_until = 0.0
        
        # API Key management
        self._current_key_hash = "default"
        self._current_quota_key = "default"
        self._all_keys = []  # List of all available keys in the pool
        self._active_key = "" # The actual key string currently in use
        self.active_interactive_calls = 0

    def _get_db_conn(self):
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        try:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
        except sqlite3.OperationalError:
            pass
        return conn

    def configure(
        self,
        provider: str,
        model: str,
        *,
        base_url: str = None,
        max_tpm: int = None,
        max_rpm: int = None,
        max_tpd: int = None,
        max_rpd: int = None,
        max_concurrency: int = None,
    ) -> None:
        profile = get_provider_profile(
            provider,
            model,
            max_tpm=max_tpm,
            max_rpm=max_rpm,
            max_tpd=max_tpd,
            max_rpd=max_rpd,
            max_concurrency=max_concurrency,
        )
        changed = (
            self.provider != profile.provider
            or self.model != profile.model
            or self.base_url != base_url
            or self.max_tpm != profile.max_tpm
            or self.max_rpm != profile.max_rpm
            or self.max_tpd != profile.max_tpd
            or self.max_rpd != profile.max_rpd
        )
        self.provider = profile.provider
        self.model = profile.model
        self.base_url = base_url
        self.profile = profile
        self.max_tpm = profile.max_tpm
        self.max_rpm = profile.max_rpm
        self.max_tpd = profile.max_tpd
        self.max_rpd = profile.max_rpd
        self.safety_margin = profile.safety_margin
        self.max_concurrency = profile.max_concurrency
        self.current_concurrency_limit = min(self.current_concurrency_limit, self.max_concurrency)
        if changed:
            self.request_window.clear()
            self.token_window.clear()
            self.cooldown_until = 0.0
            self.current_concurrency_limit = self.min_concurrency
            print(
                f"[Governor] Profile set: {self.provider}/{self.model or '*'} "
                f"(TPM={self.max_tpm}, RPM={self.max_rpm}, TPD={self.max_tpd}, RPD={self.max_rpd}, "
                f"concurrency={self.max_concurrency})"
            )

    def _quota_key_for(self, api_key: str) -> str:
        key_hash = hashlib.sha256((api_key or "").encode()).hexdigest()[:16]
        scope = self.base_url or self.provider
        model = self.model or "*"
        return f"{scope}:{model}:{key_hash}"

    def update_limits_from_provider(self, requests_limit: int = None, tokens_limit: int = None) -> None:
        changed = False
        if tokens_limit and int(tokens_limit) > 0 and int(tokens_limit) != self.max_tpm:
            self.max_tpm = int(tokens_limit)
            changed = True
        if requests_limit and int(requests_limit) > 0 and int(requests_limit) != self.max_rpm:
            self.max_rpm = int(requests_limit)
            changed = True
        if changed:
            self.current_concurrency_limit = self.min_concurrency
            self.request_window.clear()
            self.token_window.clear()
            print(f"[Governor] Learned provider limits: TPM={self.max_tpm}, RPM={self.max_rpm}")

    def get_valid_api_key(self, api_keys_str: str, expected_tokens: int = 2000, expected_requests: int = 1, provider: str = None, model: str = None, base_url: str = None) -> str:
        """Selects the first API key from a comma-separated list that hasn't exceeded daily limits."""
        if provider or model or base_url:
            self.configure(provider or self.provider, model or self.model, base_url=base_url or self.base_url)
        if not api_keys_str:
            return ""
        
        # Strip ALL non-ascii characters first to prevent httpx Header crash
        api_keys_str = api_keys_str.encode('ascii', 'ignore').decode('ascii')
        
        # Strip quotes, 'Bearer ', carriage returns, and newlines aggressively
        keys = []
        for k in api_keys_str.split(","):
            cleaned = k.strip().strip("'\"").strip("\r\n").strip()
            if cleaned.lower().startswith("bearer "):
                cleaned = cleaned[7:].strip().strip("'\"").strip("\r\n").strip()
            if cleaned:
                keys.append(cleaned)
                
        if not keys:
            return ""
        
        # Store for internal rotation
        self._all_keys = keys
            
        if len(keys) == 1:
            self.set_api_key(keys[0])
            return keys[0]

        cutoff_24h = time.time() - (24 * 3600)
        try:
            with self._get_db_conn() as conn:
                cursor = conn.cursor()
                for k in keys:
                    quota_key = self._quota_key_for(k)
                    cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND quota_key = ?', (cutoff_24h, quota_key))
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

    def set_api_key(self, api_key: str, provider: str = None, model: str = None, base_url: str = None) -> None:
        """
        Register the active API key with the governor.
        Called on startup and every time the user swaps keys in Settings.
        Resets in-memory sliding windows so the new key starts with a
        fresh rate-limit budget instead of inheriting the old key's state.
        """
        if not api_key:
            return
        if provider or model or base_url:
            self.configure(provider or self.provider, model or self.model, base_url=base_url or self.base_url)
            
        api_key = api_key.encode('ascii', 'ignore').decode('ascii')
        
        # Support comma-separated pool registration
        if "," in api_key:
            keys = []
            for k in api_key.split(","):
                cleaned = k.strip().strip("'\"").strip("\r\n").strip()
                if cleaned.lower().startswith("bearer "):
                    cleaned = cleaned[7:].strip().strip("'\"").strip("\r\n").strip()
                if cleaned:
                    keys.append(cleaned)
            if keys:
                self._all_keys = keys
                api_key = keys[0] # Use first by default, let get_permit rotate
        else:
            api_key = api_key.strip().strip("'\"").strip("\r\n").strip()
            if api_key.lower().startswith("bearer "):
                api_key = api_key[7:].strip().strip("'\"").strip("\r\n").strip()
            
        new_hash = hashlib.sha256(api_key.encode()).hexdigest()[:16]
        new_quota_key = self._quota_key_for(api_key)
        if new_quota_key == self._current_quota_key:
            return  # Same key — nothing to do

        old_hash = self._current_quota_key
        self._current_key_hash = new_hash
        self._current_quota_key = new_quota_key
        self._active_key = api_key
        # Reset in-memory windows — they're per-key at the API level
        self.request_window.clear()
        self.token_window.clear()
        self.cooldown_until = 0.0
        self.current_concurrency_limit = self.min_concurrency
        print(
            f"[Governor] 🔑 API quota scope changed ({old_hash} → {new_quota_key}). "
            f"In-memory windows reset. Daily quota tracked per provider/model/key."
        )

    def get_key_status(self) -> dict:
        """Returns daily usage stats for the currently active key."""
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with self._get_db_conn() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND quota_key = ?',
                    (cutoff_24h, self._current_quota_key)
                )
                row = cursor.fetchone()
                used_tpd = row[0] or 0
                used_rpd = row[1] or 0
                return {
                    "key_hash": self._current_key_hash,
                    "quota_key": self._current_quota_key,
                    "provider": self.provider,
                    "model": self.model,
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

    def get_aggregated_usage(self, key_hash: str = None, timeframe: str = "day") -> dict:
        """
        Returns aggregated usage for a specific key and timeframe.
        Timeframes: day (24h), week (7d), month (30d), year (365d)
        Use key_hash="all" for system-wide total.
        """
        if not key_hash:
            key_hash = self._current_quota_key
            
        days = {"day": 1, "week": 7, "month": 30, "year": 365}
        d = days.get(timeframe, 1)
        cutoff = time.time() - (d * 24 * 3600)
        
        try:
            with self._get_db_conn() as conn:
                cursor = conn.cursor()
                
                # Total usage
                if key_hash == "all":
                    cursor.execute(
                        'SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ?',
                        (cutoff,)
                    )
                else:
                    cursor.execute(
                        'SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND api_key_hash = ?',
                        (cutoff, key_hash)
                    )
                total_row = cursor.fetchone()
                
                # Daily breakdown for charts
                if timeframe == "day":
                    if key_hash == "all":
                        cursor.execute(
                            "SELECT strftime('%Y-%m-%d %H:00', datetime(timestamp, 'unixepoch')) as hr, SUM(tokens), SUM(requests) "
                            "FROM usage WHERE timestamp >= ? GROUP BY hr ORDER BY hr ASC",
                            (cutoff,)
                        )
                    else:
                        cursor.execute(
                            "SELECT strftime('%Y-%m-%d %H:00', datetime(timestamp, 'unixepoch')) as hr, SUM(tokens), SUM(requests) "
                            "FROM usage WHERE timestamp >= ? AND api_key_hash = ? GROUP BY hr ORDER BY hr ASC",
                            (cutoff, key_hash)
                        )
                else:
                    if key_hash == "all":
                        cursor.execute(
                            "SELECT strftime('%Y-%m-%d', datetime(timestamp, 'unixepoch')) as dt, SUM(tokens), SUM(requests) "
                            "FROM usage WHERE timestamp >= ? GROUP BY dt ORDER BY dt ASC",
                            (cutoff,)
                        )
                    else:
                        cursor.execute(
                            "SELECT strftime('%Y-%m-%d', datetime(timestamp, 'unixepoch')) as dt, SUM(tokens), SUM(requests) "
                            "FROM usage WHERE timestamp >= ? AND api_key_hash = ? GROUP BY dt ORDER BY dt ASC",
                            (cutoff, key_hash)
                        )
                
                breakdown = [{"label": r[0], "tokens": r[1], "requests": r[2]} for r in cursor.fetchall()]
                
                return {
                    "key_hash": key_hash,
                    "timeframe": timeframe,
                    "total_tokens": total_row[0] or 0,
                    "total_requests": total_row[1] or 0,
                    "breakdown": breakdown,
                    "max_tpd": self.max_tpd,
                    "max_rpd": self.max_rpd
                }
        except Exception as e:
            return {"error": str(e)}

    def get_all_keys_usage(self, timeframe: str = "day") -> list:
        """Returns a summary of usage for all keys tracked in the DB."""
        days = {"day": 1, "week": 7, "month": 30, "year": 365}
        d = days.get(timeframe, 1)
        cutoff = time.time() - (d * 24 * 3600)
        
        try:
            with self._get_db_conn() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'SELECT api_key_hash, SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? GROUP BY api_key_hash',
                    (cutoff,)
                )
                return [{
                    "key_hash": r[0],
                    "quota_key": r[0],
                    "used_tpd": r[1] or 0,
                    "used_rpd": r[2] or 0
                } for r in cursor.fetchall()]
        except Exception:
            return []

    def _init_db(self):
        with sqlite3.connect(self.db_path, timeout=30.0) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL,
                    tokens INTEGER,
                    requests INTEGER,
                    api_key_hash TEXT DEFAULT 'default',
                    quota_key TEXT DEFAULT 'default'
                )
            ''')
            try:
                conn.execute("ALTER TABLE usage ADD COLUMN api_key_hash TEXT DEFAULT 'default'")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE usage ADD COLUMN quota_key TEXT DEFAULT 'default'")
            except sqlite3.OperationalError:
                pass
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON usage(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_key_ts ON usage(api_key_hash, timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_quota_ts ON usage(quota_key, timestamp)")
            conn.commit()

    def _clear_old_windows(self, now: float):
        cutoff = now - 60.0
        while self.request_window and self.request_window[0] < cutoff:
            self.request_window.popleft()
        while self.token_window:
            first = self.token_window[0]
            first_ts = first["ts"] if isinstance(first, dict) else first[0]
            if first_ts < cutoff:
                self.token_window.popleft()
            else:
                break

    def _tpm_wait_seconds(self, expected_tokens: int, now: float) -> float:
        """
        Calculates EXACT seconds until enough token budget expires from the window.
        Walks oldest entries until the freed budget satisfies the request.
        Returns 0.0 if budget is already available.
        """
        tpm_limit = self.max_tpm * self.safety_margin
        
        tpm_used = 0
        for entry in self.token_window:
            if isinstance(entry, dict):
                tpm_used += entry["actual"] if entry["actual"] is not None else entry["expected"]
            else:
                tpm_used += entry[1]

        if tpm_used + expected_tokens <= tpm_limit:
            return 0.0
            
        # Walk oldest → newest, accumulate freed tokens
        freed = 0
        for entry in self.token_window:
            if isinstance(entry, dict):
                tok = entry["actual"] if entry["actual"] is not None else entry["expected"]
                ts = entry["ts"]
            else:
                tok = entry[1]
                ts = entry[0]
            freed += tok
            if tpm_used - freed + expected_tokens <= tpm_limit:
                return max(0.0, (ts + 60.0) - now + 0.05)  # +50ms buffer
                
        # Entire window must expire
        if self.token_window:
            first = self.token_window[0]
            first_ts = first["ts"] if isinstance(first, dict) else first[0]
            return max(0.0, (first_ts + 60.0) - now + 0.05)
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
            with self._get_db_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND quota_key = ?', (cutoff_24h, self._current_quota_key))
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
        Precision Pacing: grants permits immediately when budget is available.
        AUTO-ROTATION: If the current key is exhausted, attempts to find a valid key in the pool.
        """
        # 1. First, ensure we haven't blown the daily budget for this specific key
        is_ok, err_msg = await asyncio.to_thread(self._check_daily_limits_sync, expected_tokens, expected_requests)
        
        if not is_ok:
            # Attempt Auto-Rotation if pool exists
            if self._all_keys and len(self._all_keys) > 1:
                print(f"[Governor] 🔄 Key {self._current_key_hash} exhausted. Attempting rotation through pool of {len(self._all_keys)} keys...")
                new_key = self.get_valid_api_key(",".join(self._all_keys), expected_tokens, expected_requests)
                if new_key and self._quota_key_for(new_key) != self._current_quota_key:
                    # Key was swapped! Permit check will now pass on next attempt.
                    # We need to signal the caller (AterService) that the key changed so it can update its LLM client.
                    # For now, we raise a specific error that the Service can catch to rebuild its LLM.
                    raise DailyLimitExceededException("ROTATION_TRIGGERED")
            
            raise DailyLimitExceededException(err_msg)

        wait = 0.0
        req_id = None
        
        async with self._lock:
            now = time.time()

            # Hard cooldown — triggered by external 429 detection
            if now < self.cooldown_until:
                wait_remaining = self.cooldown_until - now
                self.last_throttle_event = f"Cooling down ({wait_remaining:.1f}s)..."
                print(f"[Governor] ⏳ Cooldown active. Waiting {wait_remaining:.1f}s...")
                wait = wait_remaining + 0.1
            else:
                self._clear_old_windows(now)

                tpm_used = sum(
                    (e["actual"] if e["actual"] is not None else e["expected"]) if isinstance(e, dict) else e[1]
                    for e in self.token_window
                )
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
                    req_id = f"req_{now}_{hash(now)}"
                    self.token_window.append({
                        "ts": now,
                        "expected": expected_tokens,
                        "actual": None,
                        "id": req_id
                    })
                    # We no longer aggressively debit the SQLite database with expected tokens here.
                    # This prevents 'ghost tokens' from accumulating during retries or crashes.
                    # The actual token count will be written to SQLite by the Langchain Callback Handler upon completion.
                    return req_id

                self.last_throttle_event = (
                    f"Pacing {wait:.1f}s "
                    f"(TPM: {int(tpm_used)}/{self.max_tpm}, RPM: {rpm_used}/{self.max_rpm})"
                )
                print(f"[Governor] ⏱  Precise wait {wait:.1f}s "
                      f"(TPM: {int(tpm_used)}/{self.max_tpm})")

        # Sleep OUTSIDE the lock
        await asyncio.sleep(wait)
        # Recursively re-evaluate permit (safe and fair)
        return await self.get_permit(expected_tokens, expected_requests)

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
            with self._get_db_conn() as conn:
                conn.execute(
                    'INSERT INTO usage (timestamp, tokens, requests, api_key_hash, quota_key) VALUES (?, ?, ?, ?, ?)',
                    (time.time(), tokens, requests, self._current_key_hash, self._current_quota_key)
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

    def record_actual_usage(self, request_id_or_estimated: Any, actual_tokens: int) -> None:
        """
        Corrects the usage accounting after a real LLM response with known token counts.
        Patches the entry in the in-memory sliding window for pacing.
        Since TrackingCallbackHandler already records the exact actual tokens to SQLite upon completion,
        we do not persist any delta to SQLite here to avoid double-counting.
        """
        if actual_tokens <= 0:
            return
            
        if isinstance(request_id_or_estimated, str):
            # Precision ID-based matching
            for entry in self.token_window:
                if isinstance(entry, dict) and entry.get("id") == request_id_or_estimated:
                    entry["actual"] = actual_tokens
                    break
        else:
            # Fallback to LIFO patching for legacy backward-compatibility
            estimated_tokens = int(request_id_or_estimated or 0)
            delta = actual_tokens - estimated_tokens
            if delta == 0:
                return
            if self.token_window:
                last_entry = self.token_window[-1]
                if isinstance(last_entry, dict):
                    last_entry["actual"] = actual_tokens
                else:
                    try:
                        ts, last_est = self.token_window.pop()
                        self.token_window.append((ts, max(0, last_est + delta)))
                    except Exception:
                        pass

    def get_reset_wait_seconds(self) -> float:
        """
        Returns seconds until the oldest DB record in the 24h window expires,
        freeing quota for a new attempt. Returns 0 if no records or already reset.
        """
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with self._get_db_conn() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'SELECT MIN(timestamp) FROM usage WHERE timestamp >= ? AND api_key_hash = ?',
                    (cutoff_24h, self._current_quota_key)
                )
                row = cursor.fetchone()
                if row and row[0]:
                    oldest_ts = row[0]
                    reset_at = oldest_ts + (24 * 3600)
                    return max(0.0, reset_at - time.time())
        except Exception as e:
            print(f"[Governor] Failed to compute reset wait: {e}")
        return 0.0

    def report_error(self, wait_seconds: float = 10.0):
        """Force a hard cooldown on 429 detection from any agent."""
        now = time.time()
        self.cooldown_until = now + wait_seconds
        self.current_concurrency_limit = self.min_concurrency
        # Inject moderate token/request penalty
        for _ in range(3):
            self.request_window.append(now)
        self.token_window.append({
            "ts": now,
            "expected": int(self.max_tpm * 0.50),
            "actual": None,
            "id": f"err_{now}"
        })
        print(f"[Governor] 💥 429 received. Dropping to {self.min_concurrency} worker. "
              f"Hard cooldown for {wait_seconds}s...")
        self._slot_event.set()  # Wake blocked workers so they re-evaluate

    def get_pressure(self) -> float:
        """Returns the current pressure ratio (0.0 to 1.0+)."""
        return self.current_pressure

    @property
    def current_tpm(self) -> int:
        now = time.time()
        cutoff = now - 60.0
        tpm = 0
        for entry in self.token_window:
            if isinstance(entry, dict):
                if entry["ts"] >= cutoff:
                    tpm += entry["actual"] if entry["actual"] is not None else entry["expected"]
            else:
                if entry[0] >= cutoff:
                    tpm += entry[1]
        return tpm

    @property
    def current_rpm(self) -> int:
        now = time.time()
        cutoff = now - 60.0
        return sum(1 for ts in self.request_window if ts >= cutoff)

# Global singleton — shared across all agents and the service
governor = TokenGovernor()
