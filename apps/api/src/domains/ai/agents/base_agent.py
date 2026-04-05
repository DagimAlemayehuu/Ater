import datetime
from typing import List, Dict, Any, Optional
from src.domains.ai.factory import ModelFactory
from src.api.deps import AppSecrets
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import BaseTool

class BaseAgent:
    """
    Standard Base for all specialized agents in the Life OS Workforce.
    Now supports Tiered Reasoning to optimize for free-tier rate limits.
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
        
        # Level 1: Synthesis/Reasoning - High quality (Groq 70B, GPT-4o)
        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.1
        )
        
        # Level 2: Planning/Routing - Fast & Reliable (Gemini 2.0 Flash)
        self.planner_llm = ModelFactory.get_model(
            provider=secrets.planner_provider,
            model_name=secrets.planner_model,
            api_key=secrets.planner_key,
            temperature=0.0
        )

        # Level 3: Utility/Extraction - Hyper-Fast (Gemini 1.5 Flash-8B, Llama 8B)
        self.utility_llm = ModelFactory.get_model(
            provider=secrets.utility_provider,
            model_name=secrets.utility_model,
            api_key=secrets.utility_key,
            temperature=0.0
        )
        
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.planner_with_tools = self.planner_llm.bind_tools(self.tools)
        self.utility_with_tools = self.utility_llm.bind_tools(self.tools)

    def log(self, message: str, level: str = "INFO"):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{now}] [{level}] {message}"
        self.status["logs"].append(log_entry)
        if len(self.status["logs"]) > 30:
            self.status["logs"].pop(0)
        print(f"[Agent Log] {self.name}: {log_entry}")

    async def run(self, input_text: str, history: Optional[List[Dict[str, str]]] = None, max_iterations: int = 12) -> str:
        """Tiered Reasoning Agent Loop (ReAct)"""
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
            # 3-TIER LOGIC:
            # Iteration 0: Use Utility (Level 3) for initial triage/parsing.
            # Iterations 1 -> (max-2): Use Planner (Level 2) for the heavy lifting/tools.
            # Iterations (max-1) -> End: Use Primary (Level 1) for the final answer.
            if i == 0:
                current_model = self.utility_with_tools
                self.status["stage"] = "Initial Triage (L3)"
            elif i < max_iterations - 2:
                current_model = self.planner_with_tools
                self.status["stage"] = "Executing Plan (L2)"
            else:
                current_model = self.llm_with_tools
                self.status["stage"] = "Final Synthesis (L1)"
            
            response = await current_model.ainvoke(messages)
            messages.append(response)

            content = response.content or ""
            has_explicit_plan = "STRATEGIC PLAN" in content.upper()
            is_orchestrator = self.name == "Orchestrator"
            
            if is_orchestrator and has_explicit_plan and not response.tool_calls:
                import re
                plan_match = re.search(r"STRATEGIC PLAN[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)", content, re.DOTALL | re.IGNORECASE)
                if plan_match:
                    self.status["current_plan"] = plan_match.group(1).strip()
                    self.log(f"Plan identified: {self.status['current_plan'][:80]}...")
                
                self.status["stage"] = "Delegating"
                messages.append(HumanMessage(content=(
                    "Plan acknowledged. Execute the plan NOW by calling the necessary tools. Just call the tools."
                )))
                continue

            if not response.tool_calls:
                self.status["stage"] = "Completed"
                self.status["next_agent"] = "None"
                self.log(f"{self.name} completed task.")
                return content

            # Tool Execution Loop
            for tool_call in response.tool_calls:
                t_name = tool_call["name"]
                t_args = tool_call["args"]
                tool = next((t for t in self.tools if t.name == t_name), None)
                if tool:
                    self.status["stage"] = f"Calling: {t_name.replace('delegate_to_', '').replace('_', ' ').title()}"
                    self.log(f"Executing Tool: {t_name}")
                    try:
                        output = await tool.ainvoke(t_args)
                        messages.append(ToolMessage(content=str(output), tool_call_id=tool_call["id"]))
                    except Exception as tool_err:
                        messages.append(ToolMessage(content=f"Error: {str(tool_err)}", tool_call_id=tool_call["id"]))
                else:
                    messages.append(ToolMessage(content=f"Error: Tool '{t_name}' not found.", tool_call_id=tool_call["id"]))
            
            # Nudge to process the data with the Planner
            messages.append(HumanMessage(content="Data received. If the task is finished, provide the final answer. Otherwise, continue with the next step."))

        return f"[{self.name}] Limit reached."
