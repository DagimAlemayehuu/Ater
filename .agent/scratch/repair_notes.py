import os
import re
import json
import asyncio
import sys
from pathlib import Path

# Add the project root to sys.path to import our domains
project_root = Path("/Users/dabodestroyer/code/Antigravity/Ater/apps/api")
sys.path.append(str(project_root / "src"))
sys.path.append(str(project_root))

from src.domains.ater.agents import QuestionAgent, QuizAuditorAgent, DOMAIN_MATRIX
from src.domains.ai.factory import ModelFactory

# Mock secrets class to satisfy ModelFactory if needed, or just use ModelFactory directly
# Based on main.py, it needs provider, model_name, api_key

def get_llm():
    # Attempt to load from .env manually since we are in a scratch script
    env_path = project_root / ".env"
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env_vars[k] = v
    
    # Try OpenRouter first as it's often used for Ater
    api_key = env_vars.get("OPENROUTER_KEY") or os.environ.get("OPENROUTER_KEY")
    if api_key and api_key != "your_openrouter_key_here":
        return ModelFactory.get_model(
            provider="openrouter",
            model_name="anthropic/claude-3.5-sonnet", # High quality for repair
            api_key=api_key,
            temperature=0.0
        )
    
    # Fallback to Gemini
    api_key = env_vars.get("GEMINI_KEY") or os.environ.get("GEMINI_KEY")
    return ModelFactory.get_model(
        provider="google",
        model_name="gemini-1.5-pro",
        api_key=api_key,
        temperature=0.0
    )

async def repair_note(file_path: Path, llm, mode: str = "ECON-MACRO"):
    print(f"--- Repairing: {file_path.name} ---")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Extract Title and Theory
    title_match = re.search(r"^# (.*?)\n", content)
    note_title = title_match.group(1) if title_match else file_path.stem
    
    # Extract everything before Proving Grounds
    parts = re.split(r"(## 6. The Proving Grounds|## Proving Grounds|### Proving Grounds)", content)
    if len(parts) < 2:
        print(f"Skipping {file_path.name}: No Proving Grounds found.")
        return
    
    theory_content = parts[0]
    tail = "".join(parts[1:])
    
    # 2. Generate New Aligned Quiz
    # We'll generate 5 questions: MCQ, T/F, Synthesis, Trace, Order
    q_types = ["mcq", "true_false", "synthesis", "trace", "order"]
    questions = []
    
    for q_type in q_types:
        agent = QuestionAgent(llm, q_type)
        print(f"  Generating {q_type}...")
        q_data = await agent.generate(
            note_title=note_title,
            context=theory_content,
            difficulty="L1",
            persona=DOMAIN_MATRIX[mode]["persona"],
            mode=mode
        )
        questions.append(q_data)

    # Add IDs
    for i, q in enumerate(questions):
        q["id"] = f"q{i+1}"

    quiz_json_str = json.dumps(questions, indent=2)
    
    # 3. Audit the new Quiz
    auditor = QuizAuditorAgent(llm)
    print("  Auditing quiz...")
    audit_res = await auditor.audit(note_title, quiz_json_str, theory_content)
    if not audit_res["passed"]:
        print(f"  Audit FAILED: {audit_res['diagnosis']}. Retrying once...")
        new_questions = []
        for q_type in q_types:
            agent = QuestionAgent(llm, q_type)
            q_data = await agent.generate(
                note_title=note_title,
                context=theory_content + f"\n\n[REPAIR_HINT]: {audit_res['diagnosis']}",
                difficulty="L1",
                persona=DOMAIN_MATRIX[mode]["persona"],
                mode=mode
            )
            new_questions.append(q_data)
        for i, q in enumerate(new_questions): q["id"] = f"q{i+1}"
        quiz_json_str = json.dumps(new_questions, indent=2)

    # 4. Replace the old quiz block
    new_tail = re.sub(
        r"```interactive-quiz\n(.*?)\n```",
        f"```interactive-quiz\n{quiz_json_str}\n```",
        tail,
        flags=re.DOTALL
    )
    
    new_content = theory_content + new_tail
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Successfully repaired {file_path.name}")

async def main():
    llm = get_llm()
    if not llm:
        print("Error: No API key found for repair.")
        return
        
    target_dir = Path("/Users/dabodestroyer/code/Antigravity/Ater/Obsidian_Vault/2-Academic/Winter 2026/Economics/2_Theory_Of_Demand_And_Supply/")
    files = sorted(list(target_dir.glob("*.md")))
    
    # Filter out Hub notes
    files = [f for f in files if "_Hub" not in f.name]
    
    for f in files:
        try:
            await repair_note(f, llm)
        except Exception as e:
            print(f"Failed to repair {f.name}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
