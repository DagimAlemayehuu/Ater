from src.api.deps import AppSecrets
from src.domains.ai.factory import ModelFactory
from src.domains.rag.vector_store import ChromaManager
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_core.tools import tool, BaseTool
import json
import datetime
from typing import List, Dict, Any, Optional
from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient

from langchain_community.document_loaders import PyPDFLoader
import asyncio
from pathlib import Path

GOALS_DB_ID = "2a9219ed-7519-815f-ac0f-ebfcd1dcd003"

class Strategist:
    """
    Life OS Strategist - Powered by LangChain.
    Responsible for high-level reasoning, knowledge synthesis, and brainstorming.
    Equipped with Notion Goal Management tools.
    """

    def __init__(self, secrets: AppSecrets, notion_key: Optional[str] = None, vault_path: Optional[str] = None):
        self.secrets = secrets
        self.notion_key = notion_key
        self.vault_path = vault_path
        
        # Initialize the LangChain model via Factory
        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key
        )

    async def _list_notion_goals(self):
        """Retrieves all current goals from the Notion database."""
        print("[Strategist] Tool Call: list_notion_goals")
        if not self.notion_key: 
            print("[Strategist] Error: No Notion Key")
            return "Error: Notion key not configured."
        client = NotionClient(self.notion_key)
        try:
            results = await client.query_database(GOALS_DB_ID)
            summary = []
            for page in results:
                props = page.get("properties", {})
                title = "Untitled"
                name_prop = props.get("Name", {}).get("title", [])
                if name_prop: title = name_prop[0].get("plain_text", "Untitled")
                
                # select can be None when no value is chosen
                goal_type_select = props.get("Type of Goal", {}).get("select")
                goal_type = goal_type_select.get("name", "Unknown") if goal_type_select else "Unknown"
                
                priority_select = props.get("Priority", {}).get("select")
                priority = priority_select.get("name", "None") if priority_select else "None"
                
                completed = props.get("Completed", {}).get("checkbox", False)
                summary.append({
                    "id": page["id"],
                    "title": title,
                    "type": goal_type,
                    "priority": priority,
                    "completed": completed
                })
            return json.dumps(summary)
        except Exception as e:
            print(f"[Strategist] Notion Error: {e}")
            return f"Error retrieving goals: {str(e)}"

    async def _create_notion_goal(self, title: str, goal_type: str = "Weekly Goal", priority: str = "Medium", due_date: str = ""):
        """Creates a new goal in the Notion database. due_date should be in YYYY-MM-DD format."""
        print(f"[Strategist] Tool Call: create_notion_goal ({title})")
        if not self.notion_key: return "Error: Notion key not configured."
        client = NotionClient(self.notion_key)
        
        valid_types = ['Weekly Goal', 'Monthly Goal', 'Quarterly Goal', 'Yearly Goal', 'Lifetime Goal']
        if goal_type not in valid_types: goal_type = "Weekly Goal"
        
        properties = {
            "Name": {"title": [{"text": {"content": title}}]},
            "Type of Goal": {"select": {"name": goal_type}},
            "Priority": {"select": {"name": priority}}
        }
        if due_date:
            properties["Due Date"] = {"date": {"start": due_date}}
        try:
            result = await client.create_page_in_database(GOALS_DB_ID, properties)
            return f"Successfully created goal: {title} (ID: {result['id']})"
        except Exception as e:
            return f"Error creating goal: {str(e)}"

    async def _update_notion_goal(self, goal_id: str, title: str = "", goal_type: str = "", priority: str = "", completed: Optional[bool] = None, due_date: str = ""):
        """Updates an existing goal. Only provided fields will be changed. due_date in YYYY-MM-DD format."""
        print(f"[Strategist] Tool Call: update_notion_goal ({goal_id})")
        if not self.notion_key: return "Error: Notion key not configured."
        client = NotionClient(self.notion_key)
        
        properties = {}
        if title:
            properties["Name"] = {"title": [{"text": {"content": title}}]}
        if goal_type:
            properties["Type of Goal"] = {"select": {"name": goal_type}}
        if completed is not None:
            properties["Completed"] = {"checkbox": completed}
        if priority:
            properties["Priority"] = {"select": {"name": priority}}
        if due_date:
            properties["Due Date"] = {"date": {"start": due_date}}
        
        if not properties: return "No properties provided to update."
        
        try:
            await client.update_page_properties(goal_id, properties)
            return f"Updated goal {goal_id} successfully."
        except Exception as e:
            return f"Error updating goal: {str(e)}"

    async def _delete_notion_goal(self, goal_id: str):
        """Archives (deletes) a goal from the Notion database."""
        print(f"[Strategist] Tool Call: delete_notion_goal ({goal_id})")
        if not self.notion_key: return "Error: Notion key not configured."
        client = NotionClient(self.notion_key)
        try:
            await client.archive_page(goal_id)
            return f"Successfully deleted goal {goal_id}."
        except Exception as e:
            return f"Error deleting goal: {str(e)}"

    async def _list_obsidian_notes(self):
        """Lists all markdown files in the local Obsidian vault."""
        print("[Strategist] Tool Call: list_obsidian_notes")
        if not self.vault_path: return "Error: Obsidian vault path not configured."
        client = ObsidianClient(self.vault_path)
        try:
            files = client.list_files()
            # Just return names and relative paths to save tokens
            summary = [{"name": f["name"], "path": f["path"]} for f in files]
            return json.dumps(summary)
        except Exception as e:
            return f"Error listing obsidian notes: {str(e)}"

    async def _read_obsidian_note(self, relative_path: str):
        """Reads the content of a specific Obsidian note."""
        print(f"[Strategist] Tool Call: read_obsidian_note ({relative_path})")
        if not self.vault_path: return "Error: Obsidian vault path not configured."
        client = ObsidianClient(self.vault_path)
        try:
            content = client.read_note(relative_path)
            if content is None: return "File not found."
            return content
        except Exception as e:
            return f"Error reading obsidian note: {str(e)}"


    async def brainstorm(self, query: str, context: Optional[str] = None, system_prompt: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None, file_uri: Optional[str] = None) -> str:
        """
        Brainstorms and potentially executes actions in Notion based on the query.
        """
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # RAG Context Retrieval
        rag_context = ""
        try:
            print(f"[Strategist] Querying local RAG Memory for: '{query}'")
            chroma = ChromaManager()
            # Fetch top 5 most relevant chunks from the Obsidian/Notion Vault
            results = chroma.query(query, n_results=5)
            if results:
                rag_context = "\n--- RELEVANT KNOWLEDGE FROM USER'S VAULT ---\n"
                for i, r in enumerate(results):
                    source = r.get("metadata", {}).get("filename", "Unknown File")
                    rag_context += f"\n[Source: {source}]\n{r['content']}\n"
                rag_context += "\n--------------------------------------------\n"
        except Exception as e:
            print(f"[Strategist] RAG Memory query failed: {e}")

        system_instruction = ""
        if system_prompt and system_prompt.strip():
            system_instruction = f"{system_prompt.strip()}\n\n[System Info: Current Time is {now}. Notion Database ID: {GOALS_DB_ID}]"
            if rag_context:
                system_instruction += f"\n\n{rag_context}"
        
        # Mapping history
        messages = [SystemMessage(content=system_instruction)]
        if history:
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add the current query
        query_content = f"User Query: {query}\n\nContext: {context if context else ''}"
        
        # Process attached file if present
        if file_uri:
            # Check if file_uri is a local path and is a PDF
            f_path = Path(file_uri)
            if f_path.exists() and f_path.suffix.lower() == ".pdf":
                print(f"[Strategist] Extracting PDF context from: {file_uri}")
                try:
                    loader = PyPDFLoader(str(f_path.absolute()))
                    docs = await asyncio.to_thread(loader.load)
                    full_text = "\n\n".join([doc.page_content for doc in docs])
                    query_content += f"\n\n[Attached PDF Content]:\n{full_text}"
                except Exception as ex:
                    print(f"[Strategist] PDF Load Error: {ex}")
                    query_content += f"\n\n[Error reading attached PDF file at {file_uri}]"
            else:
                query_content += f"\n\n[Attached File Context URL]: {file_uri}"
        
        messages.append(HumanMessage(content=query_content))

        try:
            # Simple invocation for now. 
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            print(f"[Life OS Sidecar] Strategist LangChain Fail: {e}")
            return f"Error: {str(e)}"
