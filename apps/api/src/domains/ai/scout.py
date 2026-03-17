from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from loguru import logger

class Scout:
    """
    Agent for web-search enabled research and discovery.
    """
    def __init__(self, gemini_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=gemini_key)
        self.model_id = model

    async def chat(self, query: str, history: Optional[List[Dict[str, Any]]] = None, context: str = "") -> str:
        """Processes a research query with web search capability."""
        
        system_instruction = (
            "You are 'The Scout', an elite digital scout and researcher. Your primary directive is to "
            "surface ground-truth information, discover relevant links, and provide deep insights "
            "into any topic requested. Use high-quality sources and provide citations where possible. "
            "Be efficient, thorough, and objective."
        )

        contents = []
        if history:
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
        
        prompt = query
        if context:
            prompt = f"Context:\n{context}\n\nQuery: {query}"
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

        try:
            # Note: We enable Google Search tool for Scout
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=[types.Tool(google_search=types.GoogleSearchRetrieval())],
                    temperature=0.3
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Scout generation failed: {e}")
            return f"Research error: {str(e)}"
