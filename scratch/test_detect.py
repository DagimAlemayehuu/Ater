import sys
import os
import asyncio
from pathlib import Path

sys.path.append(os.path.join(os.getcwd(), "src"))

from src.domains.oka.service import OkaService
from src.api.deps import AppSecrets

async def main():
    secrets = AppSecrets(
        notion_key="dummy",
        gemini_key="dummy",
        ai_provider="google",
        ai_key="dummy",
        ai_model="gemini-2.0-flash",
        planner_provider="google",
        planner_key="dummy",
        planner_model="gemini-2.0-flash",
        utility_provider="google",
        utility_key="dummy",
        utility_model="gemini-1.5-flash",
        vault_path="/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault",
        inbox_path="",
        academic_path="1-Academic",
        auto_deploy=False
    )
    service = OkaService(secrets)
    try:
        res = await service.detect_curriculum("/Users/dabodestroyer/code/Antigravity/LifeOs/Pdfs/Lecture_Slides/Chapter 5.Pdf")
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
