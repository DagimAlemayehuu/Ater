import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class ChatStorage:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False, timeout=30.0)
        conn.execute("PRAGMA foreign_keys = ON")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_connection()
        try:
            with conn:
                # 1. chat_conversations
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_conversations (
                        id TEXT PRIMARY KEY,
                        title TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        archived INTEGER DEFAULT 0,
                        deleted INTEGER DEFAULT 0,
                        metadata TEXT DEFAULT '{}'
                    )
                """)
                # 2. chat_messages
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_messages (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        status TEXT NOT NULL,
                        parent_message_id TEXT,
                        metadata TEXT DEFAULT '{}',
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
                # 3. chat_message_branches
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_message_branches (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        name TEXT,
                        leaf_message_id TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
                # 4. chat_attachments
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_attachments (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT,
                        message_id TEXT,
                        filename TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        file_type TEXT NOT NULL,
                        extracted_text TEXT,
                        chunk_metadata TEXT DEFAULT '[]',
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
                # 5. chat_summaries
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_summaries (
                        conversation_id TEXT PRIMARY KEY,
                        summary TEXT NOT NULL,
                        last_message_id TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
                # 6. chat_memories
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_memories (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT,
                        scope TEXT NOT NULL, -- 'durable' or 'session'
                        content TEXT NOT NULL,
                        confidence REAL DEFAULT 1.0,
                        source_message_id TEXT,
                        enabled INTEGER DEFAULT 1,
                        status TEXT DEFAULT 'accepted', -- 'pending' or 'accepted'
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
                # 7. chat_tool_calls
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_tool_calls (
                        id TEXT PRIMARY KEY,
                        message_id TEXT,
                        run_id TEXT,
                        tool_name TEXT NOT NULL,
                        arguments TEXT,
                        status TEXT NOT NULL,
                        started_at TEXT NOT NULL,
                        finished_at TEXT,
                        result_summary TEXT,
                        error_text TEXT,
                        emitted_actions TEXT DEFAULT '[]',
                        FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
                    )
                """)
                # 8. chat_context_snapshots
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_context_snapshots (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        message_id TEXT NOT NULL,
                        snapshot_data TEXT NOT NULL, -- JSON list of items
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
                # 9. chat_stream_runs
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_stream_runs (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        status TEXT NOT NULL,
                        started_at TEXT NOT NULL,
                        finished_at TEXT,
                        error_text TEXT,
                        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
                    )
                """)
        finally:
            conn.close()

    # --- Conversation CRUD ---
    def create_conversation(self, title: str, conv_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            cid = conv_id or str(uuid.uuid4())
            meta_str = json.dumps(metadata or {})
            with conn:
                conn.execute(
                    "INSERT INTO chat_conversations (id, title, created_at, updated_at, archived, deleted, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (cid, title, now, now, 0, 0, meta_str)
                )
            return {"id": cid, "title": title, "created_at": now, "updated_at": now, "archived": 0, "deleted": 0, "metadata": metadata or {}}
        finally:
            conn.close()

    def get_conversation(self, conv_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            row = conn.execute("SELECT * FROM chat_conversations WHERE id = ? AND deleted = 0", (conv_id,)).fetchone()
            if not row:
                return None
            res = dict(row)
            res["metadata"] = json.loads(res["metadata"] or "{}")
            return res
        finally:
            conn.close()

    def list_conversations(self, include_archived: bool = False) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            query = "SELECT * FROM chat_conversations WHERE deleted = 0"
            params = []
            if not include_archived:
                query += " AND archived = 0"
            query += " ORDER BY updated_at DESC"
            rows = conn.execute(query, params).fetchall()
            res = []
            for r in rows:
                d = dict(r)
                d["metadata"] = json.loads(d["metadata"] or "{}")
                res.append(d)
            return res
        finally:
            conn.close()

    def rename_conversation(self, conv_id: str, new_title: str) -> bool:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            with conn:
                cur = conn.execute(
                    "UPDATE chat_conversations SET title = ?, updated_at = ? WHERE id = ? AND deleted = 0",
                    (new_title, now, conv_id)
                )
                return cur.rowcount > 0
        finally:
            conn.close()

    def update_conversation_metadata(self, conv_id: str, metadata: Dict[str, Any]) -> bool:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            meta_str = json.dumps(metadata)
            with conn:
                cur = conn.execute(
                    "UPDATE chat_conversations SET metadata = ?, updated_at = ? WHERE id = ? AND deleted = 0",
                    (meta_str, now, conv_id)
                )
                return cur.rowcount > 0
        finally:
            conn.close()

    def delete_conversation(self, conv_id: str, hard: bool = False) -> bool:
        conn = self._get_connection()
        try:
            with conn:
                if hard:
                    cur = conn.execute("DELETE FROM chat_conversations WHERE id = ?", (conv_id,))
                else:
                    now = datetime.now().isoformat()
                    cur = conn.execute(
                        "UPDATE chat_conversations SET deleted = 1, updated_at = ? WHERE id = ?",
                        (now, conv_id)
                    )
                return cur.rowcount > 0
        finally:
            conn.close()

    def archive_conversation(self, conv_id: str, archive: bool = True) -> bool:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            val = 1 if archive else 0
            with conn:
                cur = conn.execute(
                    "UPDATE chat_conversations SET archived = ?, updated_at = ? WHERE id = ? AND deleted = 0",
                    (val, now, conv_id)
                )
                return cur.rowcount > 0
        finally:
            conn.close()

    # --- Message CRUD & Branching ---
    def append_message(self, conv_id: str, role: str, content: str, status: str = "completed", parent_message_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, message_id: Optional[str] = None) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            mid = message_id or str(uuid.uuid4())
            meta_str = json.dumps(metadata or {})
            with conn:
                conn.execute(
                    "INSERT INTO chat_messages (id, conversation_id, role, content, status, parent_message_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (mid, conv_id, role, content, status, parent_message_id, meta_str, now)
                )
                conn.execute(
                    "UPDATE chat_conversations SET updated_at = ? WHERE id = ?",
                    (now, conv_id)
                )
            return {
                "id": mid,
                "conversation_id": conv_id,
                "role": role,
                "content": content,
                "status": status,
                "parent_message_id": parent_message_id,
                "metadata": metadata or {},
                "created_at": now
            }
        finally:
            conn.close()

    def update_message_content(self, msg_id: str, content: str, status: str = "completed", metadata: Optional[Dict[str, Any]] = None) -> bool:
        conn = self._get_connection()
        try:
            with conn:
                if metadata is not None:
                    meta_str = json.dumps(metadata)
                    cur = conn.execute(
                        "UPDATE chat_messages SET content = ?, status = ?, metadata = ? WHERE id = ?",
                        (content, status, meta_str, msg_id)
                    )
                else:
                    cur = conn.execute(
                        "UPDATE chat_messages SET content = ?, status = ? WHERE id = ?",
                        (content, status, msg_id)
                    )
                return cur.rowcount > 0
        finally:
            conn.close()

    def get_messages(self, conv_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
                (conv_id,)
            ).fetchall()
            res = []
            for r in rows:
                d = dict(r)
                d["metadata"] = json.loads(d["metadata"] or "{}")
                res.append(d)
            return res
        finally:
            conn.close()

    def get_message(self, msg_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            row = conn.execute("SELECT * FROM chat_messages WHERE id = ?", (msg_id,)).fetchone()
            if not row:
                return None
            d = dict(row)
            d["metadata"] = json.loads(d["metadata"] or "{}")
            return d
        finally:
            conn.close()

    def get_branch_ancestry(self, leaf_msg_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            row = conn.execute("SELECT conversation_id FROM chat_messages WHERE id = ?", (leaf_msg_id,)).fetchone()
            if not row:
                return []
            conv_id = row["conversation_id"]
            all_msgs = {m["id"]: m for m in self.get_messages(conv_id)}
            
            ancestry = []
            curr_id = leaf_msg_id
            while curr_id and curr_id in all_msgs:
                msg = all_msgs[curr_id]
                ancestry.append(msg)
                curr_id = msg["parent_message_id"]
            
            ancestry.reverse()
            return ancestry
        finally:
            conn.close()

    def create_branch(self, conv_id: str, name: str, leaf_message_id: str, branch_id: Optional[str] = None) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            bid = branch_id or str(uuid.uuid4())
            with conn:
                conn.execute(
                    "INSERT INTO chat_message_branches (id, conversation_id, name, leaf_message_id, created_at) VALUES (?, ?, ?, ?, ?)",
                    (bid, conv_id, name, leaf_message_id, now)
                )
            return {"id": bid, "conversation_id": conv_id, "name": name, "leaf_message_id": leaf_message_id, "created_at": now}
        finally:
            conn.close()

    def get_branches(self, conv_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            rows = conn.execute("SELECT * FROM chat_message_branches WHERE conversation_id = ? ORDER BY created_at ASC", (conv_id,)).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    # --- Attachment Storage ---
    def create_attachment(self, conv_id: Optional[str], filename: str, file_path: str, file_type: str, extracted_text: Optional[str] = None, chunk_metadata: Optional[List[Dict[str, Any]]] = None, message_id: Optional[str] = None) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            aid = str(uuid.uuid4())
            chunks_str = json.dumps(chunk_metadata or [])
            with conn:
                conn.execute(
                    "INSERT INTO chat_attachments (id, conversation_id, message_id, filename, file_path, file_type, extracted_text, chunk_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (aid, conv_id, message_id, filename, file_path, file_type, extracted_text, chunks_str, now)
                )
            return {
                "id": aid,
                "conversation_id": conv_id,
                "message_id": message_id,
                "filename": filename,
                "file_path": file_path,
                "file_type": file_type,
                "extracted_text": extracted_text,
                "chunk_metadata": chunk_metadata or [],
                "created_at": now
            }
        finally:
            conn.close()

    def get_attachments(self, conv_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            rows = conn.execute("SELECT * FROM chat_attachments WHERE conversation_id = ?", (conv_id,)).fetchall()
            res = []
            for r in rows:
                d = dict(r)
                d["chunk_metadata"] = json.loads(d["chunk_metadata"] or "[]")
                res.append(d)
            return res
        finally:
            conn.close()

    # --- Summary Storage ---
    def set_summary(self, conv_id: str, summary: str, last_message_id: str) -> bool:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            with conn:
                conn.execute("""
                    INSERT INTO chat_summaries (conversation_id, summary, last_message_id, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(conversation_id) DO UPDATE SET
                        summary=excluded.summary,
                        last_message_id=excluded.last_message_id,
                        updated_at=excluded.updated_at
                """, (conv_id, summary, last_message_id, now))
                return True
        finally:
            conn.close()

    def get_summary(self, conv_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            row = conn.execute("SELECT * FROM chat_summaries WHERE conversation_id = ?", (conv_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    # --- Memory Storage ---
    def create_memory(self, scope: str, content: str, confidence: float = 1.0, conversation_id: Optional[str] = None, source_message_id: Optional[str] = None, status: str = "accepted") -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            mid = str(uuid.uuid4())
            with conn:
                conn.execute(
                    "INSERT INTO chat_memories (id, conversation_id, scope, content, confidence, source_message_id, enabled, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
                    (mid, conversation_id, scope, content, confidence, source_message_id, status, now)
                )
            return {
                "id": mid,
                "conversation_id": conversation_id,
                "scope": scope,
                "content": content,
                "confidence": confidence,
                "source_message_id": source_message_id,
                "enabled": 1,
                "status": status,
                "created_at": now
            }
        finally:
            conn.close()

    def list_memories(self, conversation_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            if conversation_id:
                rows = conn.execute(
                    "SELECT * FROM chat_memories WHERE (scope = 'durable') OR (scope = 'session' AND conversation_id = ?)",
                    (conversation_id,)
                ).fetchall()
            else:
                rows = conn.execute("SELECT * FROM chat_memories").fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def update_memory_status(self, memory_id: str, enabled: bool) -> bool:
        conn = self._get_connection()
        try:
            val = 1 if enabled else 0
            with conn:
                cur = conn.execute("UPDATE chat_memories SET enabled = ? WHERE id = ?", (val, memory_id))
                return cur.rowcount > 0
        finally:
            conn.close()

    def update_memory_approval(self, memory_id: str, status: str) -> bool:
        conn = self._get_connection()
        try:
            with conn:
                cur = conn.execute("UPDATE chat_memories SET status = ? WHERE id = ?", (status, memory_id))
                return cur.rowcount > 0
        finally:
            conn.close()

    def delete_memory(self, memory_id: str) -> bool:
        conn = self._get_connection()
        try:
            with conn:
                cur = conn.execute("DELETE FROM chat_memories WHERE id = ?", (memory_id,))
                return cur.rowcount > 0
        finally:
            conn.close()

    # --- Tool Call Audit ---
    def create_tool_call(self, tool_call_id: str, message_id: Optional[str], run_id: Optional[str], tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            args_str = json.dumps(arguments)
            with conn:
                conn.execute(
                    "INSERT INTO chat_tool_calls (id, message_id, run_id, tool_name, arguments, status, started_at, emitted_actions) VALUES (?, ?, ?, ?, ?, ?, ?, '[]')",
                    (tool_call_id, message_id, run_id, tool_name, args_str, "running", now)
                )
            return {
                "id": tool_call_id,
                "message_id": message_id,
                "run_id": run_id,
                "tool_name": tool_name,
                "arguments": arguments,
                "status": "running",
                "started_at": now
            }
        finally:
            conn.close()

    def update_tool_call(self, tool_call_id: str, status: str, result_summary: Optional[str] = None, error_text: Optional[str] = None, emitted_actions: Optional[List[Dict[str, Any]]] = None) -> bool:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            with conn:
                if emitted_actions is not None:
                    actions_str = json.dumps(emitted_actions)
                    cur = conn.execute(
                        "UPDATE chat_tool_calls SET status = ?, finished_at = ?, result_summary = ?, error_text = ?, emitted_actions = ? WHERE id = ?",
                        (status, now, result_summary, error_text, actions_str, tool_call_id)
                    )
                else:
                    cur = conn.execute(
                        "UPDATE chat_tool_calls SET status = ?, finished_at = ?, result_summary = ?, error_text = ? WHERE id = ?",
                        (status, now, result_summary, error_text, tool_call_id)
                    )
                return cur.rowcount > 0
        finally:
            conn.close()

    def get_tool_calls(self, message_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            rows = conn.execute("SELECT * FROM chat_tool_calls WHERE message_id = ? ORDER BY started_at ASC", (message_id,)).fetchall()
            res = []
            for r in rows:
                d = dict(r)
                d["arguments"] = json.loads(d["arguments"] or "{}")
                d["emitted_actions"] = json.loads(d["emitted_actions"] or "[]")
                res.append(d)
            return res
        finally:
            conn.close()

    # --- Stream Run Storage ---
    def create_stream_run(self, run_id: str, conv_id: str) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            with conn:
                conn.execute(
                    "INSERT INTO chat_stream_runs (id, conversation_id, status, started_at) VALUES (?, ?, ?, ?)",
                    (run_id, conv_id, "running", now)
                )
            return {"id": run_id, "conversation_id": conv_id, "status": "running", "started_at": now}
        finally:
            conn.close()

    def update_stream_run(self, run_id: str, status: str, error_text: Optional[str] = None) -> bool:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            with conn:
                cur = conn.execute(
                    "UPDATE chat_stream_runs SET status = ?, finished_at = ?, error_text = ? WHERE id = ?",
                    (status, now, error_text, run_id)
                )
                return cur.rowcount > 0
        finally:
            conn.close()

    # --- Context Snapshot Storage ---
    def create_context_snapshot(self, snapshot_id: str, conv_id: str, message_id: str, snapshot_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            now = datetime.now().isoformat()
            snap_str = json.dumps(snapshot_data)
            with conn:
                conn.execute(
                    "INSERT INTO chat_context_snapshots (id, conversation_id, message_id, snapshot_data, created_at) VALUES (?, ?, ?, ?, ?)",
                    (snapshot_id, conv_id, message_id, snap_str, now)
                )
            return {"id": snapshot_id, "conversation_id": conv_id, "message_id": message_id, "snapshot_data": snapshot_data, "created_at": now}
        finally:
            conn.close()
