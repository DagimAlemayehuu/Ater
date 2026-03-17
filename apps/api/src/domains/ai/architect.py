import os
import glob
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from loguru import logger

class Architect:
    """
    Agent for technical documentation and system meta-analysis.
    """
    def __init__(self, gemini_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=gemini_key)
        self.model_id = model

    async def chat(self, query: str, history: Optional[List[Dict[str, Any]]] = None, context: str = "") -> str:
        """Processes a technical or architectural query."""
        
        system_instruction = (
            "You are 'The Architect', the meta-intelligence responsible for the structural integrity "
            "and technical evolution of Life OS. Your domain is system design, codebase analysis, "
            "and long-term technical strategy. Provide high-level architectural insights, "
            "design patterns, and maintainability audits. Be precise, abstract, and strategic."
        )

        contents = []
        if history:
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
        
        prompt = query
        if context:
            prompt = f"System Context:\n{context}\n\nArchitectural Query: {query}"
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Architect generation failed: {e}")
            return f"Architectural analysis error: {str(e)}"
