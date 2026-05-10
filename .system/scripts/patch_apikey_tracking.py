import sys

def patch_file(path, patches):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in patches:
        if old not in content:
            print(f"Error: Could not find snippet in {path}\nSnippet:\n{old[:100]}")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {path}")

governor_patches = [
(
r'''    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(\'''
                CREATE TABLE IF NOT EXISTS usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL,
                    tokens INTEGER,
                    requests INTEGER
                )
            \''')
            conn.commit()''',
r'''    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL,
                    tokens INTEGER,
                    requests INTEGER,
                    api_key_hash TEXT DEFAULT 'default'
                )
            """)
            try:
                conn.execute("ALTER TABLE usage ADD COLUMN api_key_hash TEXT DEFAULT 'default'")
            except sqlite3.OperationalError:
                pass
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON usage(timestamp)")
            conn.commit()'''
),
(
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
        is_ok, err_msg = await asyncio.to_thread(self._check_daily_limits_sync, expected_tokens, expected_requests)''',
r'''    def _check_daily_limits_sync(self, expected_tokens: int, expected_requests: int, api_key_hash: str = 'default') -> tuple[bool, str]:
        """Synchronous check of daily limits against SQLite DB."""
        cutoff_24h = time.time() - (24 * 3600)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp >= ? AND api_key_hash = ?', (cutoff_24h, api_key_hash))
                row = cursor.fetchone()
                used_tpd = (row[0] or 0) + expected_tokens
                used_rpd = (row[1] or 0) + expected_requests
                
                if used_tpd >= self.max_tpd:
                    return False, f"Daily Token Limit reached ({int(used_tpd)}/{self.max_tpd} TPD for key {api_key_hash})"
                if used_rpd >= self.max_rpd:
                    return False, f"Daily Request Limit reached ({int(used_rpd)}/{self.max_rpd} RPD for key {api_key_hash})"
                return True, ""
        except Exception as e:
            print(f"[Governor] DB Error checking daily limit: {e}")
            return True, ""

    async def get_permit(self, expected_tokens: int = 2000, expected_requests: int = 1, api_key: str = None):
        """
        Precision Pacing: grants permits immediately when budget is available,
        sleeps the EXACT duration needed when the window is full.
        No fixed-time spin loops.
        """
        import hashlib
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()[:8] if api_key else 'default'

        # First, ensure we haven't blown the daily budget
        is_ok, err_msg = await asyncio.to_thread(self._check_daily_limits_sync, expected_tokens, expected_requests, api_key_hash)'''
),
(
r'''                if wait <= 0.0:
                    # ✅ Permit granted
                    self.last_throttle_event = None
                    self.request_window.append(now)
                    self.token_window.append((now, expected_tokens))
                    self._record_usage_db(expected_tokens, expected_requests)
                    return True''',
r'''                if wait <= 0.0:
                    # ✅ Permit granted
                    self.last_throttle_event = None
                    self.request_window.append(now)
                    self.token_window.append((now, expected_tokens))
                    self._record_usage_db(expected_tokens, expected_requests, api_key_hash)
                    return True'''
),
(
r'''    def _record_usage_db(self, tokens: int, requests: int):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    'INSERT INTO usage (timestamp, tokens, requests) VALUES (?, ?, ?)',
                    (time.time(), tokens, requests)
                )
                conn.commit()
        except Exception:
            pass  # DB contention must never block a permit''',
r'''    def _record_usage_db_sync(self, tokens: int, requests: int, api_key_hash: str):
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
        asyncio.create_task(asyncio.to_thread(self._record_usage_db_sync, tokens, requests, api_key_hash))'''
)
]
patch_file("apps/api/src/domains/oka/governor.py", governor_patches)

service_patches = [
(
r'''                    estimated_tokens = (len(str(current_messages)) // 4) + 4000
                    await self.governor.get_permit(expected_tokens=estimated_tokens)''',
r'''                    estimated_tokens = (len(str(current_messages)) // 4) + 4000
                    await self.governor.get_permit(expected_tokens=estimated_tokens, api_key=self.secrets.ai_key)'''
),
(
r'''                                OkaService._status[session_id] = f"{phase_prefix} Theory: [[{current_note_title}]]..."
                                await self.governor.get_permit(expected_tokens=4000)''',
r'''                                OkaService._status[session_id] = f"{phase_prefix} Theory: [[{current_note_title}]]..."
                                await self.governor.get_permit(expected_tokens=4000, api_key=self.secrets.ai_key)'''
),
(
r'''                                # 2. Micro-Practitioner Pass
                                OkaService._status[session_id] = f"{phase_prefix} Execution: [[{current_note_title}]]..."
                                await self.governor.get_permit(expected_tokens=3000)''',
r'''                                # 2. Micro-Practitioner Pass
                                OkaService._status[session_id] = f"{phase_prefix} Execution: [[{current_note_title}]]..."
                                await self.governor.get_permit(expected_tokens=3000, api_key=self.secrets.ai_key)'''
),
(
r'''                                # 3. Micro-Question Pass (Dynamic Assessment)
                                OkaService._status[session_id] = f"{phase_prefix} Assessment: [[{current_note_title}]]..."
                                await self.governor.get_permit(expected_tokens=3000)''',
r'''                                # 3. Micro-Question Pass (Dynamic Assessment)
                                OkaService._status[session_id] = f"{phase_prefix} Assessment: [[{current_note_title}]]..."
                                await self.governor.get_permit(expected_tokens=3000, api_key=self.secrets.planner_key or self.secrets.ai_key)'''
)
]
patch_file("apps/api/src/domains/oka/service.py", service_patches)
