import asyncio
import os
from pathlib import Path
from src.domains.oka.service import OkaService

class MockSecrets:
    def __init__(self):
        self.ai_provider = os.getenv("AI_PROVIDER", "openrouter")
        self.ai_model = "meta-llama/llama-4-scout-17b-16e-instruct"
        self.ai_key = os.getenv("AI_KEY")
        self.planner_provider = self.ai_provider
        self.planner_key = self.ai_key
        self.planner_model = self.ai_model
        self.vault_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault"
        self.academic_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/2-Academic"
        self.inbox_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/1-Meta/Inbox"
        self.auto_deploy = True

async def main():
    secrets = MockSecrets()
    if not secrets.ai_key:
        print("Error: AI_KEY not found in environment.")
        return

    service = OkaService(secrets)
    pdf_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/5-Pdf Store/Chapter 5.pdf"
    
    print(f"\n--- Phase 1: Metadata Detection ---")
    with open(pdf_path, "rb") as f:
        # We need a small slice of text for detection
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(pdf_path)
        pages = loader.load_and_split()
        sample_text = "\n".join([p.page_content for p in pages[:5]])
    
    metadata = await service._detect_metadata_with_ai(sample_text)
    print(f"Detected Metadata: {metadata}")
    
    # Force curriculum lock for consistency in test
    curriculum = {
        "course": "Computer Programming",
        "semester": "Autumn 2025",
        "unit": "5",
        "hub_title": "Modular Programming",
        "primary_language": metadata.get("primary_language", "C++")
    }
    
    print(f"\n--- Phase 2: Chunked Planning ---")
    si_path = OkaService.resolve_si_path()
    plan_result = await service.generate_plan(pdf_path, str(si_path), curriculum)
    session_id = plan_result["session_id"]
    print(f"Plan Generated. Total Batches: {len(plan_result['plan_structured']['batches'])}")
    print(f"Notes to generate: {plan_result['plan_structured']['notes']}")

    print(f"\n--- Phase 3: Execution Loop ---")
    while True:
        status = await service.confirm_plan(session_id)
        current = status["current_batch"]
        total = status["total_batches"]
        print(f"Deployed Batch {current}/{total}: {status['results']}")
        
        if not status["has_more"]:
            break
            
    print("\n--- Pipeline Test Complete ---")

if __name__ == "__main__":
    async def run():
        # Set environment variables for the test if needed
        # os.environ["AI_KEY"] = "your_key_here" 
        await main()
    asyncio.run(main())
