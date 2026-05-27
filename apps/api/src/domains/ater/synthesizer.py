import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from .academic_db import AcademicDB
from src.domains.ai.factory import ModelFactory
from langchain_core.messages import SystemMessage, HumanMessage

class DocumentSynthesizer:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.db = AcademicDB(self.vault_path)

    def find_overlap_clusters(self, threshold: float = 0.80) -> List[Dict[str, Any]]:
        """Finds pairs/clusters of notes that share high semantic similarities."""
        all_embs = self.db.get_all_embeddings()
        if not all_embs or len(all_embs) < 2:
            return []
            
        note_paths = list(all_embs.keys())
        vectors = np.array([all_embs[p] for p in note_paths])
        
        # Norms are already 1.0 (from EmbeddingsLinker), so dot product is cosine similarity
        sim_matrix = np.dot(vectors, vectors.T)
        
        clusters = []
        visited = set()
        
        for i in range(len(note_paths)):
            if i in visited:
                continue
            group = [note_paths[i]]
            for j in range(i + 1, len(note_paths)):
                if j not in visited and sim_matrix[i, j] >= threshold:
                    group.append(note_paths[j])
                    visited.add(j)
            if len(group) > 1:
                clusters.append({
                    "notes": group,
                    "avg_similarity": float(np.mean([sim_matrix[note_paths.index(x), note_paths.index(y)] for x in group for y in group if x != y]))
                })
                visited.add(i)
                
        return clusters

    async def generate_synthesis(self, note_paths: List[str], secrets: Any) -> str:
        """Generates a comprehensive comparative synthesis note comparing notes content."""
        contents = []
        for path in note_paths:
            full_path = self.vault_path / path
            if full_path.exists():
                with open(full_path, "r", encoding="utf-8") as f:
                    contents.append(f"### CONCEPT: {Path(path).stem}\n{f.read()}")
                    
        if not contents:
            return "No content to synthesize."
            
        system = """You are Ater's Synthesis Engine. Compare and contrast the following concept notes. 
Output a beautiful academic markdown synthesis that:
1. Compares their definitions and core mechanics.
2. Explains how they interact or relate (prerequisites, extensions, contradictions).
3. Provides a unified table summarizing key characteristics, trade-offs, and typical use cases.
Output clean markdown formatting only."""

        user = "\n\n".join(contents)
        
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.3
        )
        
        res = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=user)])
        return res.content.strip() if hasattr(res, 'content') else str(res)
