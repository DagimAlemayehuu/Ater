from google import genai
from google.genai import types
from typing import List, Dict, Any, Optional
import json
import datetime

from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.vault.client import VaultManager

GOALS_DB_ID = "2a9219ed-7519-815f-ac0f-ebfcd1dcd003"

class Strategist:
    """
    Life OS Strategist - Powered by Google Gemini (New SDK).
    Responsible for high-level reasoning, knowledge synthesis, and brainstorming.
    Equipped with Notion Goal Management and Obsidian Vector Search tools.
    """

    def __init__(self, api_key: str, notion_key: Optional[str] = None, vault_path: Optional[str] = None):
        self.client = genai.Client(api_key=api_key)
        self.api_key = api_key
        self.notion_key = notion_key
        self.vault_path = vault_path

    async def _search_vault(self, query: str):
        """
        Performs a semantic vector search across the Obsidian vault.
        Use this to find relevant information, past thoughts, or specific facts.
        """
        print(f"[Strategist] Tool Call: search_vault ({query})")
        if not self.vault_path: return "Error: Obsidian vault path not configured."
        
        try:
            vault_manager = VaultManager(self.vault_path, self.api_key)
            results = await vault_manager.search(query, limit=5)
            
            if not results: return "No relevant information found in the vault."
            
            summary = []
            for r in results:
                summary.append(f"Source: {r['path']}\nContent: {r['content']}")
            
            return "\n---\n".join(summary)
        except Exception as e:
            return f"Error searching vault: {str(e)}"

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


    async def brainstorm(self, query: str, context: Optional[str] = None, system_prompt: Optional[str] = None, model: str = 'gemini-2.5-flash', history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Brainstorms and potentially executes actions in Notion based on the query.
        """
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Use provided system prompt or fallback to default
        if system_prompt and system_prompt.strip():
            print(f"[Life OS Sidecar] Using provided system_prompt (len: {len(system_prompt)})")
            system_instruction = f"{system_prompt.strip()}\n\n[System Info: Current Time is {now}. Notion Database ID: {GOALS_DB_ID}]"
        else:
            print("[Life OS Sidecar] Using fallback STRATEGIST system prompt")
            system_instruction = f"""
            You are THE STRATEGIST, an AI-driven Chief of Staff and Strategic Orchestrator for Life OS.
            Current System Time: {now}.
            
            ### CORE PHILOSOPHY: THE SHORTEST PATH
            - You calculate and enforce the shortest, most resilient path to goals using a 70% execution consistency threshold for >90% success.
            - You are rigid, objective, and data-driven. No emojis. No fluff. No motivational quotes.
            - Failures are "data points" for system correction, not emotional events.
            - You follow Ray Dalio’s 5-Step Process (Set Goals, Identify Problems, Identify Root Causes, Design Game Plan, Execute).

            ### OPERATIONAL FRAMEWORKS
            - **MV/MEV/MRV**: 
                1. Keystone (Primary Focus - 100% MEV).
                2. Supporting Growth (Calibrated MEV).
                3. Maintenance (Minimum Volume - MV).
                4. Sacrifice (Zero Effort - MRV exceeded).
            - **15-Minute Ignition**: For every major goal, a specific 15-minute, bare-minimum action must exist to maintain momentum on "low discipline" days.
            - **3-1 Cadence**: 3 weeks of progressive intensity followed by 1 "Deload Week" (50% reduction in intensity).

            ### VAULT GROUNDING (The "Brain")
            - You have access to the user's entire Obsidian vault via `search_vault`.
            - **MANDATORY**: Before providing strategic advice or creating new goals, use `search_vault` to find the user's "MASTER PLAN" or "USER PROFILE" to ensure alignment.
            - If no Master Plan is found, your ONLY priority is to guide the user through creating one (Vision, Trinity Pillars, Rhythm, System Rules).

            ### THE BUILDER'S IMPERATIVE
            - Every response MUST conclude with a practical "shippable" next step (a "Binary Input") that the user can execute in < 30 minutes.
            - This is the "15-Minute Ignition" for the current conversation.

            ### NOTION & OBSIDIAN TOOLS
            - list_notion_goals / create_notion_goal / update_notion_goal: Use for tactical execution.
            - search_vault: Use for semantic context and Master Plan alignment.
            - read_obsidian_note / list_obsidian_notes: Use for specific file retrieval.
            """

        # Define tools using simpler declarations for GenAI
        notion_tools = [self._list_notion_goals, self._create_notion_goal, self._update_notion_goal, self._delete_notion_goal]
        obsidian_tools = [self._list_obsidian_notes, self._read_obsidian_note, self._search_vault]
        all_tools = notion_tools + obsidian_tools

        try:
            # Using Chat with automatic tool resolution
            chat = self.client.aio.chats.create(
                model=model,
                history=history,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=all_tools,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False),
                    thinking_config=types.ThinkingConfig(thinking_budget=-1) if "2.5" in model else (
                        types.ThinkingConfig(thinking_level="HIGH") if "3.1" in model else None
                    )
                )
            )

            full_query = f"""
            User Query: {query}
            
            Optional Context from Knowledge Base:
            {context if context else 'No specific context provided.'}
            """

            response = await chat.send_message(full_query)
            return response.text
        except Exception as e:
            print(f"[Life OS Sidecar] Strategist Agent Fail: {e}")
            # Final fallback
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=query,
                config=types.GenerateContentConfig(system_instruction=system_instruction)
            )
            return response.text
