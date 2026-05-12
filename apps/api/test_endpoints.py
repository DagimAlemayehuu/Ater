from fastapi.testclient import TestClient
from src.api.main import app
import os
import sqlite3

client = TestClient(app)

def test_srs_flow():
    # Setup mock inbox path
    inbox_path = "./mock_inbox"
    os.makedirs(inbox_path, exist_ok=True)
    
    headers = {
        "X-Vault-Path": "./mock_vault",
        "X-Inbox-Path": inbox_path
    }
    
    # Clean DB if exists
    db_path = os.path.join(inbox_path, "ater_queue.db")
    if os.path.exists(db_path):
        os.remove(db_path)
        
    # Init DB schema manually since watcher isn't running in TestClient
    conn = sqlite3.connect(db_path)
    conn.execute('''
            CREATE TABLE IF NOT EXISTS practice_log (
                id TEXT PRIMARY KEY,
                note_id TEXT,
                question_type TEXT,
                is_correct BOOLEAN,
                time_taken_seconds INTEGER,
                timestamp TEXT
            )
        ''')
    conn.execute('''
            CREATE TABLE IF NOT EXISTS note_srs (
                note_id TEXT PRIMARY KEY,
                review_count INTEGER,
                consecutive_correct INTEGER,
                easiness_factor REAL,
                interval_days INTEGER,
                next_review_date TEXT
            )
        ''')
    conn.commit()
    conn.close()

    # Log practice 1
    resp1 = client.post("/api/practice/log", json={
        "note_id": "test_note_1",
        "question_type": "synthesis",
        "is_correct": True,
        "time_taken_seconds": 30
    }, headers=headers)
    print("Log 1 Resp:", resp1.json())
    assert resp1.status_code == 200
    
    # Log practice 2
    resp2 = client.post("/api/practice/log", json={
        "note_id": "test_note_2",
        "question_type": "debug",
        "is_correct": False,
        "time_taken_seconds": 45
    }, headers=headers)
    print("Log 2 Resp:", resp2.json())
    assert resp2.status_code == 200
    
    # Get Analytics
    resp_analytics = client.get("/api/practice/analytics", headers=headers)
    print("Analytics Resp:", resp_analytics.json())
    assert resp_analytics.status_code == 200
    assert "modalities" in resp_analytics.json()
    assert "weakest_concepts" in resp_analytics.json()
    
    # Get SRS
    resp_srs = client.get("/api/practice/srs", headers=headers)
    print("SRS Resp:", resp_srs.json())
    assert resp_srs.status_code == 200
    assert "srs" in resp_srs.json()
    
    print("ALL TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_srs_flow()
