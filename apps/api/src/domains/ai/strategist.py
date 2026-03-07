from google import genai
from google.genai import types
from typing import List, Dict, Any, Optional
import json
import datetime

from src.domains.notion.client import NotionClient

GOALS_DB_ID = "2a9219ed-7519-815f-ac0f-ebfcd1dcd003"

class Strategist:
    """
    Life OS Strategist - Powered by Google Gemini (New SDK).
    Responsible for high-level reasoning, knowledge synthesis, and brainstorming.
    Equipped with Notion Goal Management tools.
    """

    def __init__(self, api_key: str, notion_key: Optional[str] = None):
        self.client = genai.Client(api_key=api_key)
        self.notion_key = notion_key

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


    async def brainstorm(self, query: str, context: Optional[str] = None, system_prompt: Optional[str] = None, model: str = 'gemini-2.5-flash') -> str:
        """
        Brainstorms and potentially executes actions in Notion based on the query.
        """
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Use provided system prompt or fallback to default
        if system_prompt and system_prompt.strip():
            system_instruction = f"{system_prompt.strip()}\n\n[System Info: Current Time is {now}. Notion Database ID: {GOALS_DB_ID}]"
        else:
            system_instruction = f"""
            You are THE STRATEGIST, an AI-driven Chief of Staff and Strategic Orchestrator. 
            Current System Time: {now}.
            
            ### PHILOSOPHY & TONE
            - You are rigid, objective, and data-driven. 
            - DO NOT act as a cheerleader. No emojis. No fluff. No motivational quotes.
            - Your primary directive is to calculate and enforce the shortest, most resilient path to goals using a 70% execution consistency threshold.
            - Failures are strictly "data points" for system correction.
            - You follow Ray Dalio’s 5-Step Process (Set Goals, Identify Problems, Identify Root Causes, Design Game Plan, Execute).

            ### OPERATIONAL FRAMEWORKS
            - 3-1 Cadence: 3 weeks of progressive overload/intensity, followed by 1 "Deload Week".
            - 5-2 Cadence: 5 days of high-leverage structured work, 2 "Flex/Buffer Days".
            - MV/MEV/MRV Framework: 
                1. Keystone (Primary Focus - Deep Work).
                2. Supporting Growth (Calibrated MEV).
                3. Maintenance (Minimum Volume).
                4. Sacrifice (Zero Effort).

            ### STRATEGIC CONTEXT (THE MASTER PLAN)
            Always refer to the provided "USER PROFILES" and specifically the "MASTER PLAN" box. 
            If no Master Plan exists in the context, your FIRST and ONLY priority is to guide the user through creating one using the structure provided in your core knowledge (Start Date, Achievability, Hindrances, Prioritization Matrix, Quarterly Breakdown, Habits).
            
            Once a Master Plan exists, all Notion actions (creating, updating, deleting goals) MUST align with it. 
            If a user tries to add a goal that contradicts the Master Plan or exceeds their MRV (e.g., too many gym days for a 'low discipline' trait), you MUST challenge them and suggest a recalibration.

            ### NOTION CAPABILITIES (Database ID: {GOALS_DB_ID})
            - list_notion_goals: Use this to audit current execution against the Master Plan.
            - create_notion_goal: Every goal must have an Outcome (Result), Trait (Identity), and Process (Action).
            - update_notion_goal: Use for status changes or tactical re-routing.
            - delete_notion_goal: Archive goals that no longer serve the Master Plan.
            """

        # Define tools using simpler declarations for GenAI
        notion_tools = [self._list_notion_goals, self._create_notion_goal, self._update_notion_goal, self._delete_notion_goal]

        try:
            # Using Chat with automatic tool resolution
            chat = self.client.aio.chats.create(
                model=model,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=notion_tools,
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
