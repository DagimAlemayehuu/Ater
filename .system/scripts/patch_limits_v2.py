import sys
import re

def patch_file(path, patches):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new, is_regex in patches:
        if is_regex:
            if not re.search(old, content):
                print(f"Error: Could not find regex snippet in {path}\nRegex:\n{old}")
                sys.exit(1)
            content = re.sub(old, new, content)
        else:
            if old not in content:
                print(f"Error: Could not find snippet in {path}\nSnippet:\n{old[:100]}")
                sys.exit(1)
            content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {path}")

# GOVERNOR.PY PATCHES
governor_patches = [
(
r'''from collections import deque

class TokenGovernor:''',
r'''from collections import deque

class DailyLimitExceededException(Exception):
    pass

class TokenGovernor:''',
False
),
(
r'''        # Groq Free Tier limits (llama-4-scout-17b)
        self.max_tpm = 30000
        self.max_rpm = 30
        self.safety_margin = 0.85  # Increased safety margin for Free Tier''',
r'''        # Groq Free Tier limits (llama-4-scout-17b)
        self.max_tpm = 30000
        self.max_rpm = 30
        self.max_tpd = 500000
        self.max_rpd = 1000
        self.safety_margin = 0.85  # Increased safety margin for Free Tier''',
False
),
(
r'''    def _init_db\(self\):.*?conn\.commit\(\)''',
r'''    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL,
                    tokens INTEGER,
                    requests INTEGER
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON usage(timestamp)")
            conn.commit()''',
True
),
(
r'''    async def get_permit\(self, expected_tokens: int = 2000, expected_requests: int = 1\):
        """
        Precision Pacing: grants permits immediately when budget is available,
        sleeps the EXACT duration needed when the window is full.
        No fixed-time spin loops.
        """
        async with self\._lock:
            while True:
                now = time\.time\(\)''',
r'''    def _check_daily_limits_sync(self, expected_tokens: int, expected_requests: int) -> tuple[bool, str]:
        """Synchronous check of daily limits against SQLite DB."""
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ?', (cutoff_24h,))
                row = cursor.fetchone()
                used_tpd = (row[0] or 0) + expected_tokens
                used_rpd = (row[1] or 0) + expected_requests
                
                if used_tpd >= self.max_tpd:
                    return False, f"Daily Token Limit reached ({int(used_tpd)}/{self.max_tpd} TPD)"
                if used_rpd >= self.max_rpd:
                    return False, f"Daily Request Limit reached ({int(used_rpd)}/{self.max_rpd} RPD)"
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
        # First, ensure we haven't blown the daily budget
        is_ok, err_msg = await asyncio.to_thread(self._check_daily_limits_sync, expected_tokens, expected_requests)
        if not is_ok:
            raise DailyLimitExceededException(err_msg)

        async with self._lock:
            while True:
                now = time.time()''',
True
),
(
r'''    def _record_usage_db\(self, tokens: int, requests: int\):
        try:
            with sqlite3\.connect\(self\.db_path\) as conn:
                conn\.execute\(
                    'INSERT INTO usage \(timestamp, tokens, requests\) VALUES \(\?, \?, \?\)',
                    \(time\.time\(\), tokens, requests\)
                \)
                conn\.commit\(\)
        except Exception:
            pass  # DB contention must never block a permit''',
r'''    def _record_usage_db_sync(self, tokens: int, requests: int):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    'INSERT INTO usage (timestamp, tokens, requests) VALUES (?, ?, ?)',
                    (time.time(), tokens, requests)
                )
                conn.commit()
        except Exception as e:
            print(f"[Governor] Failed to record usage: {e}")

    def _record_usage_db(self, tokens: int, requests: int):
        # Fire and forget database write off the main event loop
        asyncio.create_task(asyncio.to_thread(self._record_usage_db_sync, tokens, requests))''',
True
)
]
patch_file("apps/api/src/domains/ater/governor.py", governor_patches)

# SERVICE.PY PATCHES
service_patches = [
(
r'''                while True:
                    # Get permit from governor before EACH chunk request
                    # Estimate tokens: (Current Context / 4) + prompt overhead
                    estimated_tokens = (len(str(current_messages)) // 4) + 1000
                    await self.governor.get_permit(expected_tokens=estimated_tokens)''',
r'''                while True:
                    # Get permit from governor before EACH chunk request
                    # Estimate tokens: (Current Context / 4) + worst-case output buffer
                    estimated_tokens = (len(str(current_messages)) // 4) + 4000
                    await self.governor.get_permit(expected_tokens=estimated_tokens)''',
False
),
(
r'''            except Exception as e:
                last_error = e
                error_str = str(e)
                print(f"[Ater Service] AI Attempt {attempt} failed: {error_str[:200]}")''',
r'''            except Exception as e:
                if type(e).__name__ == "DailyLimitExceededException":
                    print(f"[Ater Service] Daily Limit Hit: {e}")
                    AterService._rate_limited[session_id] = time.time()
                    AterService._status[session_id] = f"Paused (Daily Limit Exceeded): {str(e)}"
                    raise e # Break out completely immediately
                
                last_error = e
                error_str = str(e)
                print(f"[Ater Service] AI Attempt {attempt} failed: {error_str[:200]}")''',
False
)
]
patch_file("apps/api/src/domains/ater/service.py", service_patches)
