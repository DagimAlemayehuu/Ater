import asyncio
import os
from src.domains.oka.service import OkaService
from src.api.main import AppSecrets

async def main():
    try:
        secrets = AppSecrets()
        secrets.ai_key = os.environ.get("GROQ_API_KEY", "fake")
        secrets.planner_key = os.environ.get("GROQ_API_KEY", "fake")
        secrets.vault_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault"
        
        service = OkaService(secrets)
        
        # mock planner_llm to avoid actually hitting the API with 'fake'
        class MockLLM:
            async def ainvoke(self, messages):
                class MockResponse:
                    content = '{"question": "test", "answer": "test", "explanation": "test"}'
                return MockResponse()
        
        service.planner_llm = MockLLM()
        service.llm_creative = MockLLM()
        
        res = await service.generate_practice("2_C++_Programming_Fundamentals_Hub.md", {
            "difficulty": "Mixed",
            "questionDistribution": {"mcq": 1}
        })
        print("Success!", res["session_id"])
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
