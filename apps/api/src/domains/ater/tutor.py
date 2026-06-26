import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from .academic_db import AcademicDB
from src.domains.ai.factory import ModelFactory

class SocraticTutor:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.db = AcademicDB(self.vault_path)

    async def chat(self, note_path: str, user_message: str, session_id: Optional[str] = None, secrets: Any = None) -> Dict[str, Any]:
        """
        Runs Socratic learning dialogue anchored on a note content.
        Maintains history in SQLite db.
        """
        if not session_id:
            session_id = f"tutor_{uuid.uuid4().hex[:8]}"
            
        session = self.db.get_tutor_session(session_id)
        if session:
            history = session["history"]
        else:
            history = []
            
        # Read target note content
        full_note_path = self.vault_path / note_path
        note_content = ""
        if full_note_path.exists():
            with open(full_note_path, "r", encoding="utf-8") as f:
                note_content = f.read()
                
        # Socratic System Persona
        system_prompt = f"""You are Ater's Socratic Tutor. Your goal is to guide the student towards understanding the academic concept of the note: '{Path(note_path).stem}'.
DO NOT give direct answers immediately. Instead:
1. Ask clarifying, guiding questions.
2. Break complex problems into smaller, digestible components.
3. Validate student reasoning and gently point out flaws without giving them the correction directly.
4. Keep responses concise and focused on the note content below:

NOTE MATERIAL:
{note_content}"""

        messages = [SystemMessage(content=system_prompt)]
        
        # Load history
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
                
        # Append user message
        messages.append(HumanMessage(content=user_message))
        history.append({"role": "user", "content": user_message})
        
        # Call LLM
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.7
        )
        
        res = await llm.ainvoke(messages)
        assistant_resp = res.content.strip() if hasattr(res, 'content') else str(res)
        
        history.append({"role": "assistant", "content": assistant_resp})
        
        self.db.save_tutor_session(session_id, note_path, history)
        
        return {
            "session_id": session_id,
            "response": assistant_resp,
            "history": history
        }
