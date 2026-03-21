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
            self.status["stage"] = "Synthesizing" if i > 0 else "Generating Plan"
            response = await self.llm_with_tools.ainvoke(messages)
            messages.append(response)

            content = response.content or ""
            has_explicit_plan = "STRATEGIC PLAN" in content.upper()
            
            # Only the Orchestrator is REQUIRED to plan first. 
            # Specialists should be allowed to act immediately (i=0 with tool_calls).
            is_orchestrator = self.name == "Orchestrator"
            
            # Check if this is a plan-only response that needs a push to execute
            if is_orchestrator and has_explicit_plan and not response.tool_calls:
                import re
                plan_match = re.search(r"STRATEGIC PLAN[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)", content, re.DOTALL | re.IGNORECASE)
                if plan_match:
                    self.status["current_plan"] = plan_match.group(1).strip()
                    self.log(f"Plan identified: {self.status['current_plan'][:80]}...")
                
                self.status["stage"] = "Delegating"
                messages.append(HumanMessage(content=(
                    "Plan acknowledged. Execute the plan NOW by calling the necessary tools. "
                    "Do NOT explain further. Just call the tools."
                )))
                continue

            if not response.tool_calls:
                # If no tools are called and we aren't forcing a plan transition, this is the end.
                self.status["stage"] = "Completed"
                self.status["next_agent"] = "None"
                self.log(f"{self.name} completed task.")
                return content

            # Execute all tool calls in this response
            for tool_call in response.tool_calls:
                t_name = tool_call["name"]
                t_args = tool_call["args"]
                
                tool = next((t for t in self.tools if t.name == t_name), None)
                if tool:
                    self.status["stage"] = f"Calling: {t_name.replace('delegate_to_', '').replace('_', ' ').title()}"
                    self.log(f"Executing Tool: {t_name}")
                    if "delegate_to_" in t_name:
                        agent_label = t_name.replace("delegate_to_", "").replace("_", " ").title()
                        self.status["active_agents"].append(agent_label)
                        self.status["next_agent"] = agent_label
                    
                    try:
                        output = await tool.ainvoke(t_args)
                    except Exception as tool_err:
                        output = f"[Tool Error] {t_name}: {str(tool_err)}"
                        self.log(f"Tool error: {t_name} — {tool_err}", level="ERROR")

                    messages.append(ToolMessage(content=str(output), tool_call_id=tool_call["id"]))
                    
                    # After tool execution, give a nudge to continue or finish
                    messages.append(HumanMessage(content=(
                        f"Tool {t_name} returned results. "
                        "Process this data and either take the NEXT step in your plan "
                        "or provide your FINAL synthesis if the task is complete."
                    )))

                    if "delegate_to_" in t_name:
                        agent_label = t_name.replace("delegate_to_", "").replace("_", " ").title()
                        if agent_label in self.status["active_agents"]:
                            self.status["active_agents"].remove(agent_label)
                else:
                    self.log(f"Error: Tool '{t_name}' not found.")
                    messages.append(ToolMessage(content=f"Error: Tool '{t_name}' not found.", tool_call_id=tool_call["id"]))
        
        self.status["stage"] = "Limit Reached"
        return f"[{self.name}] Reached iteration limit after {max_iterations} steps. Partial results may be in the conversation history."

