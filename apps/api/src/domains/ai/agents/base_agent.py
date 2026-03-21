import datetime
from typing import List, Dict, Any, Optional
from src.domains.ai.factory import ModelFactory
from src.api.deps import AppSecrets
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import BaseTool

class BaseAgent:
    """
    Standard Base for all specialized agents in the Life OS Workforce.
    Each agent has its own persona, tools, and reasoning loop.
    """

    def __init__(self, secrets: AppSecrets, persona: str, tools: List[BaseTool], name: str = "Specialist"):
        self.secrets = secrets
        self.persona = persona
        self.tools = tools
        self.name = name
        self.status: Dict[str, Any] = {
            "current_prompt": "",
            "current_plan": "",
            "active_agents": [],
            "stage": "idle",
            "next_agent": "None",
            "logs": []
        }
        
        # Instantiate model
        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.1
        )
        self.llm_with_tools = self.llm.bind_tools(self.tools)

    def log(self, message: str, level: str = "INFO"):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{now}] [{level}] {message}"
        self.status["logs"].append(log_entry)
        if len(self.status["logs"]) > 30:
            self.status["logs"].pop(0)
        print(f"[Agent Log] {self.name}: {log_entry}") # Also log to terminal

    async def run(self, input_text: str, history: Optional[List[Dict[str, str]]] = None, max_iterations: int = 12) -> str:
        """Standard Agent Loop (ReAct)"""
        self.status["current_prompt"] = input_text
        self.status["stage"] = "Initializing"
        self.log(f"{self.name} starting mission.")
        
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        system_msg = SystemMessage(content=f"{self.persona}\n\nCurrent Time: {now}\nName: {self.name}")
        messages: List[Any] = [system_msg]
        
        if history:
            for msg in history:
                if msg["role"] == "user": messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant": messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=input_text))

        for i in range(max_iterations):
            self.status["stage"] = "Synthesizing" if i > 0 else "Thinking"
            response = await self.llm_with_tools.ainvoke(messages)
            messages.append(response)

            # Extra: Extract Strategic Plan if present for status monitoring
            if "STRATEGIC PLAN" in response.content.upper():
                import re
                plan_match = re.search(r"STRATEGIC PLAN[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)", response.content, re.DOTALL | re.IGNORECASE)
                if plan_match:
                    self.status["current_plan"] = plan_match.group(1).strip()
                    self.log(f"Plan updated: {self.status['current_plan'][:50]}...")

            if not response.tool_calls:
                self.status["stage"] = "Completed"
                self.status["next_agent"] = "None"
                self.log(f"{self.name} finished task.")
                return response.content

            for tool_call in response.tool_calls:
                t_name = tool_call["name"]
                t_args = tool_call["args"]
                
                tool = next((t for t in self.tools if t.name == t_name), None)
                if tool:
                    self.status["stage"] = f"Using {t_name.replace('delegate_to_', '').replace('_', ' ').title()}"
                    self.log(f"Executing Tool: {t_name}")
                    if "delegate_to_" in t_name:
                        agent_name = t_name.replace("delegate_to_", "").replace("_", " ").title()
                        self.status["active_agents"].append(agent_name)
                        self.status["next_agent"] = agent_name
                    
                    output = await tool.ainvoke(t_args)
                    messages.append(ToolMessage(content=str(output), tool_call_id=tool_call["id"]))
                    
                    if "delegate_to_" in t_name:
                        agent_name = t_name.replace("delegate_to_", "").replace("_", " ").title()
                        if agent_name in self.status["active_agents"]:
                            self.status["active_agents"].remove(agent_name)
                else:
                    self.log(f"Error: Tool '{t_name}' not found.")
                    messages.append(ToolMessage(content=f"Error: Tool '{t_name}' not found.", tool_call_id=tool_call["id"]))
        
        self.status["stage"] = "Failed"
        return f"[{self.name}] I've reached my thinking limit."
