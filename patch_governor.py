import re

with open("apps/api/src/domains/ater/governor.py", "r") as f:
    content = f.read()

# Revert the limits to 500k and 5000
content = content.replace("max_tpd: int = 50000000", "max_tpd: int = 500000")
content = content.replace("max_rpd: int = 100000", "max_rpd: int = 5000")

# Add a get_valid_api_key method to the TokenGovernor class
new_method = """    def get_valid_api_key(self, api_keys_str: str, expected_tokens: int = 2000, expected_requests: int = 1) -> str:
        \"\"\"Selects the first API key from a comma-separated list that hasn't exceeded daily limits.\"\"\"
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

    def set_api_key"""

content = content.replace("    def set_api_key", new_method)

with open("apps/api/src/domains/ater/governor.py", "w") as f:
    f.write(content)
