import asyncio
import sys
import os

# Add src to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))

from src.domains.ater.service import AterService
from src.api.deps import AppSecrets

async def test_generate():
    secrets = AppSecrets(
        ai_provider="groq",
        ai_key="dummy",
        ai_model="meta-llama/llama-4-scout-17b-16e-instruct",
        vault_path="/Users/dabodestroyer/code/Antigravity/Ater/Test",
        academic_path="Notes",
        inbox_path="/Users/dabodestroyer/code/Antigravity/Ater/Test/Inbox",
        auto_deploy=True
    )
    service = AterService(secrets)
    hubs = service.list_planner_hubs()
    print("Hubs:", hubs)
    
    if not hubs:
        print("No hubs found.")
        return
        
    hub_id = hubs[0]["id"]
    print(f"Generating for hub: {hub_id}")
    
    # We will simulate the frontend request config
    # In the screenshot, they selected MCQ = 1 question, and selected 23 notes
    notes = service.list_atomic_notes(hub_id)
    selected_notes = [n["id"] for n in notes]
    print(f"Notes list ({len(selected_notes)}):", selected_notes)
    
    config = {
        "hubId": hub_id,
        "selectedAtomicNotes": selected_notes,
        "questionDistribution": {
            "mcq": 1, "true_false": 0, "writing": 0, "fill_in": 0, "matching": 0, "order": 0, "debug": 0, "synthesis": 0, "trace": 0, "calculation": 0, "data_analysis": 0, "scenario": 0, "code": 0
        },
        "difficulty": "Mixed",
        "gradingStrictness": "Lenient",
        "distractorPlausibility": "High",
        "injectTrickAnswers": False,
        "prioritizeWeaknesses": False,
        "progressionGatekeeper": False,
        "enableProgressiveHints": False,
        "requireConfidenceWager": False,
        "globalTimeLimitMinutes": None,
        "perQuestionTimeLimitSeconds": None,
        "timeBoundDays": None
    }
    
    from src.domains.ater.schemas import AdvancedPracticeConfig
    try:
        parsed = AdvancedPracticeConfig(**config)
        print("Pydantic Validation Succeeded!")
    except Exception as err:
        print("Pydantic Validation FAILED:", err)

    
    try:
        res = await service.generate_practice(hub_id, config)
        print("Success generate output:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_generate())
