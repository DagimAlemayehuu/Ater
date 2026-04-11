import re
import os
from .llm_client import LLMClient
from .cleaner import clean_llm_output
from .deployer import deploy_single_note

class OkaOrchestrator:
    def __init__(self, system_prompt_path=".system/scripts/oka_v10/oka_system_prompt.xml"):
        with open(system_prompt_path, "r") as f:
            self.system_prompt = f.read()
        self.llm = LLMClient()
        self.master_plan_text = ""
        self.planned_concepts = []

    def execute_state_1_plan(self, source_text):
        print("\n--- Executing STATE 1: [PLAN] ---")
        prompt = f"Here is the source text: {source_text}. Execute STATE 1: [PLAN]. Output Template A."
        response = self.llm.call(self.system_prompt, prompt)
        
        if response:
            self.master_plan_text = response
            # Extract concepts
            if "**Atomic Concepts (In Order of Generation):**" in response:
                list_part = response.split("**Atomic Concepts (In Order of Generation):**")[1]
                self.planned_concepts = re.findall(r'\[\[(.*?)\]\]', list_part)
                # Filter out metadata links
                self.planned_concepts = [c for n, c in enumerate(self.planned_concepts) 
                                        if "_Hub" not in c and "_Questions" not in c and c not in self.planned_concepts[:n]]
            
            print(f"✅ Plan created with {len(self.planned_concepts)} concepts.")
            return True
        return False

    def execute_state_2_hub(self):
        print("\n--- Executing STATE 2: [HUB] ---")
        prompt = f"Here is the Master Plan: {self.master_plan_text}. Execute STATE 2: [HUB]. CRITICAL RULES: You MUST start your response with --- START_NOTE --- followed by the YAML block. You MUST NOT output anything else."
        response = self.llm.call(self.system_prompt, prompt)
        if response:
            cleaned = clean_llm_output(response)
            deploy_single_note(cleaned)
            return True
        return False

    def execute_state_3_pq(self):
        print("\n--- Executing STATE 3: [PQ] ---")
        prompt = f"Here is the Master Plan: {self.master_plan_text}. Execute STATE 3: [PQ]. CRITICAL RULES: You MUST start your response with --- START_NOTE --- followed by the YAML block. You MUST generate questions for ALL concepts in the plan. Do not truncate."
        response = self.llm.call(self.system_prompt, prompt)
        if response:
            cleaned = clean_llm_output(response)
            deploy_single_note(cleaned)
            return True
        return False

    def execute_state_4_atomic_notes(self):
        print(f"\n--- Executing STATE 4: [ATOMIC_NOTES] ({len(self.planned_concepts)} items) ---")
        for i, concept in enumerate(self.planned_concepts, 1):
            print(f"\nGenerating concept {i}/{len(self.planned_concepts)}: [[{concept}]]")
            prompt = f"Here is the Master Plan: {self.master_plan_text}. Execute STATE 4: [ATOMIC_NOTE] for the concept [[{concept}]]. CRITICAL RULES: 1) You MUST start with --- START_NOTE --- and YAML. 2) You MUST use --- START_CODE:language --- (no standard markdown backticks). 3) Output ONLY this single note."
            response = self.llm.call(self.system_prompt, prompt)
            if response:
                cleaned = clean_llm_output(response)
                deploy_single_note(cleaned)
            else:
                print(f"❌ Failed to generate [[{concept}]]")

    def run_pipeline(self, source_text):
        if self.execute_state_1_plan(source_text):
            self.execute_state_2_hub()
            self.execute_state_3_pq()
            self.execute_state_4_atomic_notes()
            print("\n✨ OKA v10 Pipeline Complete.")
        else:
            print("❌ Pipeline failed at Step 1.")
