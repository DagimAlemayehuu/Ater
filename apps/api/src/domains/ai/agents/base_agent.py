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

    def log(self, message: str):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        self.status["logs"].append(f"[{now}] {message}")
        if len(self.status["logs"]) > 20:
            self.status["logs"].pop(0)

    async def run(self, input_text: str, history: Optional[List[Dict[str, str]]] = None, max_iterations: int = 12) -> str:
        """Standard Agent Loop (ReAct)"""
        self.status["current_prompt"] = input_text
        self.status["stage"] = "reasoning"
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
            self.status["stage"] = f"iteration_{i+1}"
            response = await self.llm_with_tools.ainvoke(messages)
            messages.append(response)

            if not response.tool_calls:
                self.status["stage"] = "completed"
                self.status["next_agent"] = "None"
                self.log(f"{self.name} finished task.")
                return response.content

            for tool_call in response.tool_calls:
                t_name = tool_call["name"]
                t_args = tool_call["args"]
                
                tool = next((t for t in self.tools if t.name == t_name), None)
                if tool:
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
        
        self.status["stage"] = "failed"
        return f"[{self.name}] I've reached my thinking limit."
