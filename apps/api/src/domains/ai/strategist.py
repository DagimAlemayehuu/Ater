from typing import List, Dict, Any, Optional
from src.api.deps import AppSecrets
from src.domains.ai.agents.orchestrator import Orchestrator

class Strategist:
    """
    Life OS Strategist - Powered by LangChain.
    Now acts as a wrapper for the Multi-Agent Orchestrator.
    """

    def __init__(self, secrets: AppSecrets, notion_key: Optional[str] = None, vault_path: Optional[str] = None):
        self._orchestrator = Orchestrator(secrets, notion_key, vault_path)
        # Exposure for tool definitions for main app if needed
        self.tools = self._orchestrator.tools

    async def _search_vault_backend(self, query: str):
        # Kept for direct tool access if needed
        from src.domains.rag.vector_store import ChromaManager
        chroma = ChromaManager()
        results = chroma.query(query, n_results=15)
        if not results: return "No relevant notes found."
        output = "Search Results:\n"
        for r in results:
            source = r.get("metadata", {}).get("filename", "Unknown")
            output += f"--- [File: {source}] ---\n{r['content']}\n\n"
        return output

    async def brainstorm(self, query: str, context: Optional[str] = None, system_prompt: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None, file_uri: Optional[str] = None) -> str:
        """
        Delegates the brainstorming to the Multi-Agent Orchestrator.
        """
        return await self._orchestrator.brainstorm(query, context=context, history=history)
