import asyncio
import os
import sys
from pathlib import Path

# Add apps/api to sys.path so we can import src
sys.path.append(str(Path("apps/api").absolute()))

from src.domains.oka.service import OkaService

class MockSecrets:
    ai_provider = os.getenv("AI_PROVIDER", "openrouter")
    ai_model = "meta-llama/llama-4-scout-17b-16e-instruct"
    ai_key = os.getenv("AI_KEY", "dummy")
    planner_provider = ai_provider
    planner_key = ai_key
    planner_model = ai_model
    vault_path = str(Path("Obsidian_Vault").absolute())
    academic_path = str(Path("Obsidian_Vault/2-Academic").absolute())
    inbox_path = str(Path("Obsidian_Vault/1-Meta/Inbox").absolute())
    auto_deploy = True

async def run():
    service = OkaService(MockSecrets())
    curriculum = {
        "course": "Computer Programming",
        "semester": "Autumn 2025",
        "unit": "5",
        "hub_title": "Modular Programming"
        # primary_language intentionally missing to see if it causes KeyError
    }
    pdf_path = str(Path("Obsidian_Vault/5-Pdf Store/Chapter 5.pdf").absolute())
    si_path = str(Path(".system/prompts/OKA_System_Instruction.md").absolute())
    try:
        res = await service.generate_plan(pdf_path, si_path, curriculum)
        print("Success!", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
