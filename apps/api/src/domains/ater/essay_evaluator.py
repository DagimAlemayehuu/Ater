from pathlib import Path
from typing import Dict, Any, List
from .vault_indexer import VaultIndexer
from src.domains.ai.factory import ModelFactory
from langchain_core.messages import SystemMessage, HumanMessage

class EssayEvaluator:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.indexer = VaultIndexer(self.vault_path)

    async def evaluate_essay(self, essay_text: str, course_context: str, secrets: Any) -> Dict[str, Any]:
        """
        Evaluates student essay text by comparing claims against the vault's fact base.
        Returns accuracy, depth, logic flaws, and grade recommendation.
        """
        # Retrieve related facts from the vault via semantic search
        query = essay_text[:500]  # first 500 chars is fine to capture topic
        matches = self.indexer.semantic_search(query, limit=4)
        
        ground_truth = []
        for m in matches:
            full_path = self.vault_path / m["path"]
            if full_path.exists():
                with open(full_path, "r", encoding="utf-8") as f:
                    ground_truth.append(f"### Fact Base: {m['title']}\n{f.read()}")
                    
        ground_truth_str = "\n\n".join(ground_truth) if ground_truth else "No relevant vault notes found."
        
        system = f"""You are Ater's Academic Essay Evaluator. Your goal is to review the student's writing against the ground-truth vault notes.
Evaluate:
1. **Fact Checking**: Highlight any claims in the essay that contradict the Fact Base.
2. **Depth Assessment**: Score conceptual depth (0-100%). Identify key details from the Fact Base that the student omitted.
3. **Writing Quality & Logic**: Find logic gaps or structural flaws.
4. **Grading**: Recommend a grade (A, B, C, D, F) with brief justification.

FACT BASE FROM VAULT NOTES:
{ground_truth_str}

COURSE CONTEXT: {course_context}"""

        user = f"STUDENT ESSAY TEXT:\n{essay_text}"
        
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.3
        )
        
        res = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=user)])
        response_text = res.content.strip() if hasattr(res, 'content') else str(res)
        
        return {
            "evaluation": response_text,
            "references": [m["path"] for m in matches]
        }
