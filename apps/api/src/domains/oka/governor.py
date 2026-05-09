import time
import asyncio
import sqlite3
from pathlib import Path
from collections import deque

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
        
        # Groq Free Tier limits (v30.0 Pantheon Prime)
        self.max_tpm = 60000  # Increased for stability
        self.max_rpm = 30     # Requests Per Minute
        self.safety_margin = 0.95 # Higher margin for less frequent waiting
        
        # Sliding Window for pacing
        self.request_window = deque() # Timestamps of requests in the last 60s
        self.token_window = deque()   # (timestamp, tokens) tuples in the last 60s

        # DYNAMIC CONCURRENCY (v31.0 Singularity)
        self.active_slots = 0
        self.max_concurrency = 5  # Default, will scale
        self.min_concurrency = 1
        self.current_concurrency_limit = 1 
        
        # Real-time Telemetry (v32.0 Oracle)
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
                    requests INTEGER
                )
            ''')
            conn.commit()

    async def get_permit(self, expected_tokens: int = 2000, expected_requests: int = 1):
        """
        Adaptive Pacing: Grants permits instantly under low load,
        throttles intelligently as limits approach.
        """
        async with self._lock:
            while True:
                now = time.time()
                
                # Check for active cooldown (v32.1 Hardening)
                if now < self.cooldown_until:
                    wait_remaining = self.cooldown_until - now
                    self.last_throttle_event = f"Cooling down ({wait_remaining:.1f}s)..."
                    await asyncio.sleep(wait_remaining)
                    continue

                self._clear_old_windows(now)
                
                tpm_used = sum(t for _, t in self.token_window)
                rpm_used = len(self.request_window)
                
                tpm_ratio = tpm_used / (self.max_tpm * self.safety_margin)
                rpm_ratio = rpm_used / (self.max_rpm * self.safety_margin)
                pressure = max(tpm_ratio, rpm_ratio)
                self.current_pressure = pressure

                # DYNAMIC SCALING LOGIC
                if pressure < 0.3 and self.current_concurrency_limit < self.max_concurrency:
                    self.current_concurrency_limit += 1
                    print(f"[Governor] 🚀 Pressure Low ({pressure:.2f}). Scaling UP Concurrency to {self.current_concurrency_limit}")
                elif pressure > 0.7 and self.current_concurrency_limit > self.min_concurrency:
                    self.current_concurrency_limit -= 1
                    print(f"[Governor] 🚦 Pressure High ({pressure:.2f}). Scaling DOWN Concurrency to {self.current_concurrency_limit}")

                tpm_ok = (tpm_used + expected_tokens) < (self.max_tpm * self.safety_margin)
                rpm_ok = (rpm_used + expected_requests) < (self.max_rpm * self.safety_margin)
                
                if tpm_ok and rpm_ok:
                    # Permit Granted
                    self.last_throttle_event = None
                    self.request_window.append(now)
                    self.token_window.append((now, expected_tokens))
                    self._record_usage_db(expected_tokens, expected_requests)
                    return True
                
                # Calculation of wait time based on pressure
                wait_time = 1.5 if not tpm_ok else 1.0
                self.last_throttle_event = f"Waiting {wait_time}s (TPM: {tpm_used}/{self.max_tpm})"
                print(f"[Governor] 🚦 Pressure Detected: {tpm_used}/{self.max_tpm} TPM. Waiting {wait_time}s...")
                await asyncio.sleep(wait_time)

    async def acquire_slot(self):
        """Wait until a concurrency slot is available."""
        while True:
            async with self._lock:
                if self.active_slots < self.current_concurrency_limit:
                    self.active_slots += 1
                    return True
            await asyncio.sleep(0.5)

    async def release_slot(self):
        """Release a concurrency slot."""
        async with self._lock:
            self.active_slots = max(0, self.active_slots - 1)

    def _clear_old_windows(self, now: float):
        cutoff = now - 60
        while self.request_window and self.request_window[0] < cutoff:
            self.request_window.popleft()
        while self.token_window and self.token_window[0][0] < cutoff:
            self.token_window.popleft()

    def _record_usage_db(self, tokens: int, requests: int):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('INSERT INTO usage (timestamp, tokens, requests) VALUES (?, ?, ?)',
                             (time.time(), tokens, requests))
                conn.commit()
        except Exception: pass # Database lock shouldn't block the permit

    def report_error(self, wait_seconds: float = 5.0):
        """External hook to force a cooldown on 429 detection."""
        now = time.time()
        self.cooldown_until = now + wait_seconds
        self.current_concurrency_limit = self.min_concurrency
        # Inject penalty into the windows to prevent immediate bursts after cooldown
        for _ in range(10):
            self.request_window.append(now)
        self.token_window.append((now, int(self.max_tpm * 0.8)))
        print(f"[Governor] 💥 429 detected. Dropping Concurrency to {self.min_concurrency}. Cooling down for {wait_seconds}s...")

# Global governor instance
governor = TokenGovernor()
