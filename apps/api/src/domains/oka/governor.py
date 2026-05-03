import time
import asyncio
import sqlite3
from pathlib import Path

class TokenGovernor:
    """
    Proactively manages rate limits (Tokens Per Minute / Day) via SQLite to avoid brittle 429s.
    """
    def __init__(self, db_path: str = None):
        if not db_path:
            db_path = str(Path.home() / ".lifeos" / "oka" / "governor.db")
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path
        self._init_db()
        
        # Groq Free Tier limits for meta-llama/llama-4-scout-17b-16e-instruct
        self.max_tpm = 30000  # Tokens Per Minute
        self.max_tpd = 500000 # Tokens Per Day
        self.max_rpm = 30     # Requests per minute

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

    async def acquire(self, expected_tokens: int = 1500, expected_requests: int = 1):
        """
        Wait until we have enough capacity to proceed.
        """
        logged_pacing = False
        while True:
            tpm_usage, rpm_usage = self._get_last_minute_usage()
            tpd_usage = self._get_daily_usage()
            
            if tpd_usage + expected_tokens > self.max_tpd:
                if not logged_pacing:
                    print(f"[TokenGovernor] DAILY LIMIT REACHED ({tpd_usage}/{self.max_tpd}). Pausing 10m...")
                    logged_pacing = True
                await asyncio.sleep(600) # Wait 10 mins and check again
                continue
                
            if tpm_usage + expected_tokens > self.max_tpm or rpm_usage + expected_requests > self.max_rpm:
                # Need to wait out the minute window
                if not logged_pacing:
                    print(f"[TokenGovernor] Waiting for token capacity... ({tpm_usage}/{self.max_tpm} tokens, {rpm_usage}/{self.max_rpm} reqs). Resting...")
                    logged_pacing = True
                await asyncio.sleep(5)
                continue
                
            # If we're good, record the usage and return
            self._record_usage(expected_tokens, expected_requests)
            break

    def _get_last_minute_usage(self):
        cutoff = time.time() - 60
        with sqlite3.connect(self.db_path) as conn:
            c = conn.cursor()
            c.execute('SELECT SUM(tokens), SUM(requests) FROM usage WHERE timestamp > ?', (cutoff,))
            row = c.fetchone()
            return (row[0] or 0, row[1] or 0)

    def _get_daily_usage(self):
        cutoff = time.time() - 86400
        with sqlite3.connect(self.db_path) as conn:
            c = conn.cursor()
            c.execute('SELECT SUM(tokens) FROM usage WHERE timestamp > ?', (cutoff,))
            return c.fetchone()[0] or 0

    def _record_usage(self, tokens: int, requests: int):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('INSERT INTO usage (timestamp, tokens, requests) VALUES (?, ?, ?)',
                         (time.time(), tokens, requests))
            conn.commit()

# Global governor instance
governor = TokenGovernor()
