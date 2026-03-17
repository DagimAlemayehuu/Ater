import os
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from src.domains.obsidian.client import ObsidianClient
from loguru import logger

class Scribe:
    """
    Agent for transcription, formatting, and note consolidation.
    """
    def __init__(self, gemini_key: str, vault_path: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=gemini_key)
        self.obsidian = ObsidianClient(vault_path)
        self.model_id = model

    async def chat(self, query: str, history: Optional[List[Dict[str, Any]]] = None, context: str = "") -> str:
        """Processes a formatting or note consolidation request."""
        
        system_instruction = (
            "You are 'The Scribe', a master of documentation and knowledge architecture. "
            "Your goal is to transform messy logs, voice transcriptions, and raw thoughts into "
            "perfectly structured Obsidian notes. Use clean markdown, appropriate frontmatter, "
            "and logical hierarchies. You have direct access to the user's Obsidian vault."
        )

        contents = []
        if history:
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
        
        prompt = query
        if context:
            prompt = f"Context (Files/Notes):\n{context}\n\nTask: {query}"
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Scribe generation failed: {e}")
            return f"Documentation error: {str(e)}"

    async def save_note(self, path: str, content: str):
        """Saves a processed note to Obsidian."""
        return await self.obsidian.write_file(path, content)
