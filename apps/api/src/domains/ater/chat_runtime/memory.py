from typing import List, Dict, Any, Optional
from pathlib import Path
from .store import ChatStorage

class MemoryManager:
    def __init__(self, storage: ChatStorage):
        self.storage = storage

    def create_durable_memory(self, content: str, confidence: float = 1.0, source_message_id: Optional[str] = None, status: str = "accepted") -> Dict[str, Any]:
        return self.storage.create_memory(
            scope="durable",
            content=content,
            confidence=confidence,
            source_message_id=source_message_id,
            status=status
        )

    def create_session_memory(self, conversation_id: str, content: str, confidence: float = 1.0, source_message_id: Optional[str] = None, status: str = "accepted") -> Dict[str, Any]:
        return self.storage.create_memory(
            scope="session",
            content=content,
            confidence=confidence,
            conversation_id=conversation_id,
            source_message_id=source_message_id,
            status=status
        )

    def list_memories(self, conversation_id: Optional[str] = None) -> List[Dict[str, Any]]:
        # Returns all enabled memories relevant to the conversation context
        # (durable memories + session memories for this conversation ID)
        all_memories = self.storage.list_memories(conversation_id)
        # Filter enabled and accepted memories
        return [m for m in all_memories if m.get("enabled") == 1 and m.get("status") == "accepted"]

    def extract_memories_from_turn(self, conversation_id: str, user_message: str, assistant_response: str, message_id: str) -> List[Dict[str, Any]]:
        """
        Conservative memory extraction.
        Heuristics / extraction rule:
        - If user explicitly says "remember that I...", "my name is...", "I prefer..."
        - Extract clean declarative facts.
        - Defaults to status='pending' to allow user review unless it's very clear.
        - For tests/mocked scenarios, we can look for specific strings or use simple heuristics.
        """
        extracted = []
        user_lower = user_message.lower()
        
        # Simple heuristics for durable preference extraction
        if "remember that i prefer" in user_lower or "i prefer" in user_lower:
            pref = user_message.split("prefer")[-1].strip(". \n")
            extracted.append(
                self.create_durable_memory(
                    content=f"User prefers {pref}",
                    confidence=0.9,
                    source_message_id=message_id,
                    status="pending"
                )
            )
        elif "my name is" in user_lower:
            name = user_message.split("name is")[-1].strip(". \n")
            extracted.append(
                self.create_durable_memory(
                    content=f"User name is {name}",
                    confidence=0.95,
                    source_message_id=message_id,
                    status="pending"
                )
            )
        # Session memory heuristic: user mentions temporary goal or task
        elif "for this session" in user_lower or "in this chat" in user_lower:
            goal = user_message.split("chat")[-1].split("session")[-1].strip(",. \n")
            extracted.append(
                self.create_session_memory(
                    conversation_id=conversation_id,
                    content=f"Session goal: {goal}",
                    confidence=0.8,
                    source_message_id=message_id,
                    status="accepted" # session memory is usually accepted immediately as it is transient
                )
            )
        return extracted
