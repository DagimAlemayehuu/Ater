import asyncio
from src.domains.oka.service import OkaService

class MockSecrets:
    ai_provider = "openrouter"
    ai_model = "meta-llama/llama-4-scout-17b-16e-instruct"
    ai_key = "fake_key"
    planner_provider = "openrouter"
    planner_key = "fake_key"
    planner_model = "meta-llama/llama-4-scout-17b-16e-instruct"
    vault_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault"
    academic_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/2-Academic"
    inbox_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/1-Meta/Inbox"
    auto_deploy = True

async def run():
    service = OkaService(MockSecrets())
    curriculum = {
        "course": "Computer Programming",
        "semester": "Autumn 2025",
        "unit": "5",
        "hub_title": "Modular Programming",
        "primary_language": "C++"
    }
    try:
        await service.generate_plan(
            "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/5-Pdf Store/Chapter 5.pdf",
            "/Users/dabodestroyer/code/Antigravity/LifeOs/.system/prompts/OKA_System_Instruction.md",
            curriculum
        )
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(run())
