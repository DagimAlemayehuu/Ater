import re
import os
from .llm_client import LLMClient
from .cleaner import clean_llm_output
from .deployer import deploy_single_note

class AterOrchestrator:
    def __init__(self, system_prompt_path=".system/scripts/ater_v10/ater_system_prompt.xml"):
        with open(system_prompt_path, "r") as f:
            self.system_prompt = f.read()
        self.llm = LLMClient()
        self.master_plan_text = ""
        self.planned_concepts = []

    def execute_state_1_plan(self, source_text):
        print("\n--- Executing STATE 1: [PLAN] ---")
        template_a = """=== TEMPLATE A: THE PLAN ===
# Knowledge Asset Plan: {Unit_Name}
<hub_note>"[[{Unit_Name}_Hub]]"</hub_note>
<pq_note>"[[{Unit_Name}_Possible_Questions]]"</pq_note>
<atomic_notes>
**Atomic Concepts (In Order of Generation):**
- "[[Concept_1]]" - (Mode: ENGINEER): Primary pages: {P1, P2}.
- "[[Concept_2]]" - (Mode: LOGICIAN): Primary pages: {P3}.
(Continue extracting strictly between 15 and 25 atomic concepts)
</atomic_notes>"""
        prompt = f"Here is the source text: {source_text}.\n\nCRITICAL MANDATE: Extrapolate a Master Plan using EXACTLY the template below. You MUST generate between 15 and 25 atomic concepts. If the textbook chapter is dense, isolate 25 atomic rules. If it is short, break it down granularly to find at least 15.\n\nTEMPLATE:\n{template_a}"
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
        template = """--- START_NOTE ---
---
title: "{{Unit_Name}}_Hub"
type: "Hub"
course: "[[{{Course}}]]"
semester: "[[{{Semester}}]]"
unit: {{Unit_Number}}
source: "[[{{Pdf_Path_From_Context}}]]"
source_pages: []
status: "Not Started"
confidence: null
study_date: null
generated: true
---
# Architectural Overview
(A dense, high-signal blueprint of how the concepts in this unit structurally connect and interact. No generic introductory filler.)

# Core Topologies (Connections)
(Strict Directed Acyclic Graph: Hierarchical indented list of all atomic notes. EVERY NOTE APPEARS ONCE.)

# Assessment Layer
"[[{Unit_Name}_Possible_Questions]]"
--- END_NOTE ---"""
        prompt = f"Here is the Master Plan: {self.master_plan_text}.\n\nCRITICAL MANDATE: You MUST build the Hub Note using EXACTLY the following template. Fill it in accurately based on the MASTER PLAN. DO NOT change the headings.\n\nTEMPLATE:\n{template}"
        response = self.llm.call(self.system_prompt, prompt)
        if response:
            cleaned = clean_llm_output(response)
            deploy_single_note(cleaned)
            return True
        return False

    def execute_state_3_pq(self):
        print("\n--- Executing STATE 3: [PQ] ---")
        template = """--- START_NOTE ---
---
title: "{{Unit_Name}}_Possible_Questions"
type: "Possible Questions"
course: "[[{{Course}}]]"
semester: "[[{{Semester}}]]"
unit: {{Unit_Number}}
hub: "[[{{Unit_Name}}_Hub]]"
parent: "[[{{Parent_Link}}]]"
source: "[[{{Pdf_Path_From_Context}}]]"
score: null
---
# Part I: Atomic Interrogation
## [[Concept_Name_1]]
### Level 1: Sanity Check (Core definition/axiom)
### Level 2: The Crucible (Complex constraints/application)
### Level 3: Edge Case Mastery (Failure states/limits)
(Repeat for ALL concepts in the plan)

# Part II: Synthesis & Architecture
### System Integration Scenario: [Scenario Title]
--- END_NOTE ---"""
        prompt = f"Here is the Master Plan: {self.master_plan_text}.\n\nCRITICAL MANDATE: You MUST build the Possible Questions note using EXACTLY the following template. DO NOT change the headings. Do not truncate.\n\nTEMPLATE:\n{template}"
        response = self.llm.call(self.system_prompt, prompt)
        if response:
            cleaned = clean_llm_output(response)
            deploy_single_note(cleaned)
            return True
        return False

    def execute_state_4_atomic_notes(self):
        print(f"\n--- Executing STATE 4: [ATOMIC_NOTES] ({len(self.planned_concepts)} items) ---")
        template = """--- START_NOTE ---
---
title: "{concept}"
type: "Atomic Note"
mode: "ENGINEER"
course: "[[{{Course}}]]"
semester: "[[{{Semester}}]]"
unit: {{Unit_Number}}
hub: "[[{{Hub_Link}}]]"
parent: "[[{{Parent_Link}}]]"
source: "[[{{Pdf_Path_From_Context}}]]"
source_page: {{Primary_Page}}
source_pages: [{{P1}}, {{P2}}]
---
> **Prerequisite:** Ensure you understand "[[Prerequisite]]" before compiling this context.

# Definition Matrix
(Formal semantic definition + Extreme ELI5 Analogy Hook)

# Structural Mechanics
(Analogous mental model or visualization)
--- START_CODE:mermaid ---
(High-fidelity diagram. MUST BE SPECIFIC and complex)
--- END_CODE:mermaid ---
--- START_CODE:text ---
(Detailed breakdown of the visual output mechanics)
--- END_CODE:text ---

# The Deep Dive ({MODE})
(High-density technical mechanics. Use bullet points, bold tags, and extreme precision. No generic filler.)

# The Execution (Worked Example)
(MANDATORY step-by-step walkthrough. Show the "Perfect Form" execution.)

# Constraint Limits & Trade-offs
(What are the bounds of this concept? When does it fail? What are the alternatives?)

# The Proving Ground
> **Self-Correction & Mastery Test**
> **The Crucible Scenario:** (A brutal edge case or "trick" question based strictly on the content above. Constraint + Scenario synthesis.)
> **Solution:** (Immediate, concise answer highlighting *why* the obvious answer fails based on the mechanics above)

# Knowledge Dependencies
| Concept | Semantic Link | Functional Dependency |
|:---|:---|:---|
| "[[Related_Concept]]" | {extends, bottlenecks, computes} | (Dense, 5-word specific architectural link) |
--- END_NOTE ---"""

        for i, concept in enumerate(self.planned_concepts, 1):
            print(f"\nGenerating concept {i}/{len(self.planned_concepts)}: [[{concept}]]")
            concept_template = template.replace("{concept}", concept)
            prompt = f"Here is the Master Plan: {self.master_plan_text}.\n\nWrite the Atomic Note for the concept: [[{concept}]].\n\nCRITICAL MANDATE: You MUST use EXACTLY the template below. DO NOT change the headings. Heed the <pedagogical_mandates> from the system prompt.\n\nTEMPLATE:\n{concept_template}"
            
            max_retries = 3
            for attempt in range(max_retries):
                response = self.llm.call(self.system_prompt, prompt)
                if response and "--- START_NOTE ---" in response and "--- END_NOTE ---" in response:
                    cleaned = clean_llm_output(response)
                    deploy_single_note(cleaned)
                    break
                else:
                    print(f"⚠️ Validation failed for [[{concept}]] (Attempt {attempt+1}/{max_retries}). Self-healing...")
                    prompt += "\n\nCRITICAL FIX REQUIRED: Your previous response failed structural validation. You MUST include '--- START_NOTE ---' at the very beginning and '--- END_NOTE ---' at the end. DO NOT wrap the output in standard formatting backticks. Re-generate correctly."
            else:
                print(f"❌ Failed to generate valid note for [[{concept}]] after {max_retries} attempts.")

    def run_pipeline(self, source_text):
        if self.execute_state_1_plan(source_text):
            self.execute_state_2_hub()
            self.execute_state_3_pq()
            self.execute_state_4_atomic_notes()
            print("\n✨ Ater v10 Pipeline Complete.")
        else:
            print("❌ Pipeline failed at Step 1.")
