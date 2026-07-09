# src/domains/ater/embeddings_linker.py

import os
import re
import gc
import numpy as np
# Imports for onnxruntime and transformers are moved inside load_model() to optimize cold-start
from typing import List, Dict, Any, Tuple
from pathlib import Path

def mean_pooling(model_output, attention_mask):
    """
    Mean Pooling utility to compute sentence embeddings from token embeddings.
    """
    token_embeddings = model_output[0]  # First element of model_output contains all token embeddings
    input_mask_expanded = np.expand_dims(attention_mask, -1).astype(float)
    sum_embeddings = np.sum(token_embeddings * input_mask_expanded, 1)
    sum_mask = np.clip(input_mask_expanded.sum(1), a_min=1e-9, a_max=None)
    return sum_embeddings / sum_mask

class EmbeddingsLinker:
    _instance = None
    _session = None
    _tokenizer = None
    _load_failed = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EmbeddingsLinker, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    @classmethod
    def _get_model_paths(cls) -> Tuple[Path, Path]:
        """Resolves the directory path and model.onnx file path for the ONNX model."""
        import sys
        env_model_dir = os.environ.get("ATER_ONNX_MODEL_DIR")
        if env_model_dir:
            model_dir = Path(env_model_dir).expanduser().resolve()
            if model_dir.exists():
                return model_dir, model_dir / "model.onnx"

        if getattr(sys, 'frozen', False):
            # In a PyInstaller bundle, resolve relative to the sidecar executable
            exe_path = Path(sys.executable)
            
            # Windows: check resources subdirectory first, then alongside executable
            potential_dir = exe_path.parent / "resources" / "onnx_model"
            if potential_dir.exists():
                return potential_dir, potential_dir / "model.onnx"
                
            potential_dir = exe_path.parent / "onnx_model"
            if potential_dir.exists():
                return potential_dir, potential_dir / "model.onnx"
                
            # macOS: Tauri bundles resources in Ater.app/Contents/Resources
            if sys.platform == "darwin":
                potential_dir = exe_path.parent.parent / "Resources" / "onnx_model"
                if potential_dir.exists():
                    return potential_dir, potential_dir / "model.onnx"
                    
            # Fallback to CWD just in case
            model_dir = Path("onnx_model").resolve()
            return model_dir, model_dir / "model.onnx"
        else:
            current_dir = Path(__file__).resolve().parent
            api_root = current_dir.parent.parent.parent  # apps/api
            model_dir = api_root / "onnx_model"
            if not model_dir.exists():
                model_dir = Path("onnx_model").resolve()
            return model_dir, model_dir / "model.onnx"

    @classmethod
    def load_model(cls):
        """Loads tokenizer and ONNX inference session as a lazy-loaded Singleton."""
        if cls._load_failed:
            raise RuntimeError("EmbeddingsLinker: Previous model load attempt failed. Skipping to prevent crash.")

        if cls._session is None or cls._tokenizer is None:
            try:
                import onnxruntime as ort
                if getattr(ort, "__spec__", None) is None:
                    from importlib.machinery import ModuleSpec
                    ort.__spec__ = ModuleSpec("onnxruntime", loader=None)
                from transformers import AutoTokenizer
                model_dir, model_path = cls._get_model_paths()
                if not model_path.exists():
                    raise FileNotFoundError(f"ONNX model not found at {model_path}")

                print(f"[EmbeddingsLinker] Lazy-loading AutoTokenizer from {model_dir}...")
                cls._tokenizer = AutoTokenizer.from_pretrained(str(model_dir))

                print(f"[EmbeddingsLinker] Lazy-loading ONNX session from {model_path}...")
                # Add logging for robustness
                cls._session = ort.InferenceSession(str(model_path))
            except Exception as e:
                cls._load_failed = True
                print(f"[EmbeddingsLinker] FATAL: Failed to load ONNX model components: {e}")
                raise RuntimeError(f"Failed to initialize ONNX embeddings engine: {e}")

        return cls._session, cls._tokenizer

    @classmethod
    def unload(cls):
        """Releases the tokenizer and ONNX session to free memory resources."""
        print("[EmbeddingsLinker] Unloading model components from memory...")
        cls._session = None
        cls._tokenizer = None
        gc.collect()

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Computes 384-dimensional dense vectors for input texts.
        Returns normalized embeddings of shape (N, 384).
        """
        if not texts:
            return np.empty((0, 384))

        try:
            session, tokenizer = self.load_model()

            # Tokenize input texts
            encoded_input = tokenizer(texts, padding=True, truncation=True, return_tensors="np")

            # Prepare inputs for ONNX session
            onnx_inputs = {
                "input_ids": encoded_input["input_ids"].astype(np.int64),
                "attention_mask": encoded_input["attention_mask"].astype(np.int64)
            }
            if "token_type_ids" in encoded_input:
                onnx_inputs["token_type_ids"] = encoded_input["token_type_ids"].astype(np.int64)

            # Run ONNX Runtime inference
            outputs = session.run(None, onnx_inputs)

            # Apply mean pooling
            embeddings = mean_pooling(outputs, encoded_input["attention_mask"])

            # Normalize to unit vectors (ensures dot product is exactly cosine similarity)
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms = np.clip(norms, a_min=1e-9, a_max=None)
            return embeddings / norms
        except Exception as e:
            print(f"[EmbeddingsLinker] get_embeddings failed: {e}. Returning zero vectors.")
            return np.zeros((len(texts), 384))

    def get_concept_offset(self, title: str, full_text: str) -> int:
        """Calculates the character offset of the first appearance of a concept in textbook text."""
        if not full_text:
            return 999999
        readable = title.replace("_", " ").lower()
        pos = full_text.lower().find(readable)
        if pos != -1:
            return pos
        pos = full_text.lower().find(title.lower())
        if pos != -1:
            return pos
        return 999999

    def map_prerequisites(self, notes: List[Dict[str, Any]], full_text: str = "") -> List[Dict[str, Any]]:
        """
        Calculates Cosine Similarity Matrix and establishes Semantic & Explicit Prerequisite links.
        Also runs loop breaking and synthesis clustering.
        """
        if not notes:
            return notes

        from .validator import AterValidator

        # 1. Title Normalization & Payload generation
        for note in notes:
            note["title"] = AterValidator.sanitize_title(note.get("title", ""))
            
        texts = [f"{note['title']}: {note.get('description', '')}" for note in notes]

        # 2. Compute Embeddings & Similarity Matrix
        try:
            embeddings = self.get_embeddings(texts)
            sim_matrix = np.dot(embeddings, embeddings.T)
        except Exception as e:
            print(f"[EmbeddingsLinker] Failed to calculate embeddings: {e}. Fallback to identity similarity.")
            sim_matrix = np.eye(len(notes))

        # Helper to retrieve minimum page number
        def get_min_page(note_dict):
            pages = note_dict.get("source_pages", []) or []
            return min((int(p) for p in pages if str(p).isdigit()), default=9999)

        # Map semantic and explicit links
        title_to_idx = {note["title"]: idx for idx, note in enumerate(notes)}

        for idx_b, note_b in enumerate(notes):
            note_b["title"]
            prereqs_set = set(note_b.get("prerequisites", []) or [])
            min_page_b = get_min_page(note_b)
            desc_b = (note_b.get("description", "") or "").lower()

            for idx_a, note_a in enumerate(notes):
                if idx_a == idx_b:
                    continue
                title_a = note_a["title"]
                min_page_a = get_min_page(note_a)

                if min_page_a == min_page_b:
                    continue

                # A. Semantic Bridge: Cosine Similarity > 0.65 and earlier page number (no tie-breaking edge)
                similarity = sim_matrix[idx_a, idx_b]
                if similarity > 0.65 and min_page_a < min_page_b:
                    prereqs_set.add(f"[[{title_a}]]")

                # B. Explicit Cross-Reference: Case-insensitive regex with escaping and word boundaries
                escaped_title = re.escape(title_a)
                pattern_str = escaped_title.replace(r'\_', r'[\s_]+').replace('_', r'[\s_]+')
                pattern = re.compile(rf'\b{pattern_str}\b', re.IGNORECASE)
                if pattern.search(desc_b) and min_page_a < min_page_b:
                    prereqs_set.add(f"[[{title_a}]]")

            # Clean and sanitize list
            note_b["prerequisites"] = AterValidator.sanitize_prerequisites(list(prereqs_set))

        # 3. Circular Dependency Breaking (Tarjan / DFS-backtrack weakest edge deletion)
        notes = self.break_cycles(notes, sim_matrix, title_to_idx)

        # 4. Single-Linkage Synthesis Clustering (threshold > 0.75)
        notes = self.cluster_synthesis_notes(notes, sim_matrix)

        # 5. Kahn's Topological Sorting
        notes = self.topological_sort(notes, full_text)

        return notes

    def break_cycles(self, notes: List[Dict[str, Any]], sim_matrix: np.ndarray, title_to_idx: Dict[str, int]) -> List[Dict[str, Any]]:
        """
        Detects circular dependencies in the prerequisite graph and resolves them
        by programmatically deleting the edge with the lowest cosine similarity.
        """
        edges = []
        for idx_v, note_v in enumerate(notes):
            prereqs = note_v.get("prerequisites", []) or []
            for p in prereqs:
                title_u = p.replace("[[", "").replace("]]", "").strip()
                if title_u in title_to_idx:
                    idx_u = title_to_idx[title_u]
                    weight = sim_matrix[idx_u, idx_v]
                    edges.append((idx_u, idx_v, weight))

        def find_cycle(adj):
            visited = {}  # node -> state (0=unvisited, 1=visiting, 2=visited)
            parent = {}

            for u in adj:
                visited[u] = 0

            def dfs(u):
                visited[u] = 1
                for v in adj[u]:
                    if visited.get(v, 0) == 0:
                        parent[v] = u
                        cycle = dfs(v)
                        if cycle:
                            return cycle
                    elif visited.get(v, 0) == 1:
                        path = [v]
                        curr = u
                        while curr != v:
                            path.append(curr)
                            curr = parent.get(curr, v)
                        path.reverse()
                        path.append(v)
                        return path
                visited[u] = 2
                return None

            for u in adj:
                if visited.get(u, 0) == 0:
                    cycle = dfs(u)
                    if cycle:
                        return cycle
            return None

        while True:
            adj = {i: [] for i in range(len(notes))}
            for u, v, w in edges:
                adj[u].append(v)

            cycle = find_cycle(adj)
            if not cycle:
                break

            cycle_edges = []
            for i in range(len(cycle) - 1):
                u_c, v_c = cycle[i], cycle[i+1]
                for edge_idx, (u_e, v_e, w_e) in enumerate(edges):
                    if u_e == u_c and v_e == v_c:
                        cycle_edges.append((edge_idx, u_e, v_e, w_e))
                        break

            if cycle_edges:
                weakest_edge = min(cycle_edges, key=lambda x: x[3])
                # Remove it
                edges.pop(weakest_edge[0])
                print(f"[EmbeddingsLinker] Circular dependency: {' -> '.join(notes[n]['title'] for n in cycle)}. Breaking loop by deleting weaker link: {notes[weakest_edge[1]]['title']} -> {notes[weakest_edge[2]]['title']} (similarity: {weakest_edge[3]:.4f})")

        # Write clean edges back to notes
        for idx_v, note_v in enumerate(notes):
            new_prereqs = []
            for p in (note_v.get("prerequisites", []) or []):
                title_u = p.replace("[[", "").replace("]]", "").strip()
                if title_u in title_to_idx:
                    idx_u = title_to_idx[title_u]
                    if any(u_e == idx_u and v_e == idx_v for u_e, v_e, _ in edges):
                        new_prereqs.append(p)
                else:
                    new_prereqs.append(p)
            note_v["prerequisites"] = new_prereqs

        return notes

    def cluster_synthesis_notes(self, notes: List[Dict[str, Any]], sim_matrix: np.ndarray) -> List[Dict[str, Any]]:
        """
        Connected Component Single-Linkage Clustering for concepts with similarity > 0.75.
        Generates and appends a Tier 2 Synthesis Framework note plan for each cluster >= 2.
        """
        n = len(notes)
        adj = {i: [] for i in range(n)}
        for i in range(n):
            for j in range(i + 1, n):
                if sim_matrix[i, j] > 0.75:
                    adj[i].append(j)
                    adj[j].append(i)

        visited = [False] * n
        clusters = []
        for i in range(n):
            if not visited[i]:
                component = []
                queue = [i]
                visited[i] = True
                while queue:
                    u = queue.pop(0)
                    component.append(u)
                    for v in adj[u]:
                        if not visited[v]:
                            visited[v] = True
                            queue.append(v)
                if len(component) >= 2:
                    clusters.append(component)

        if not clusters:
            return notes

        from .validator import AterValidator

        new_synthesis_notes = []
        for cluster in clusters:
            member_titles = sorted([notes[idx]["title"] for idx in cluster])
            
            # Title: alphabetized joined by underscores. Max 3 titles, else append _And_Others_Synthesis
            if len(member_titles) <= 3:
                synth_title = "_".join(member_titles) + "_Synthesis"
            else:
                synth_title = "_".join(member_titles[:3]) + "_And_Others_Synthesis"
                
            synth_title = AterValidator.sanitize_title(synth_title)

            # Check if this synthesis note already exists in our plans
            if any(note["title"] == synth_title for note in notes) or any(note["title"] == synth_title for note in new_synthesis_notes):
                continue

            # Build Description
            member_descriptions = [f"{t}: {notes[idx].get('description', '')}" for idx, t in zip(cluster, [notes[idx]['title'] for idx in cluster])]
            synth_desc = f"Synthesis framework for {', '.join(member_titles)}. Combines: " + " | ".join(member_descriptions)

            # Union page numbers while preserving priority order
            source_pages = []
            seen_pages = set()
            for idx in cluster:
                for p in notes[idx].get("source_pages", []):
                    if str(p).isdigit():
                        p_int = int(p)
                        if p_int not in seen_pages:
                            seen_pages.add(p_int)
                            source_pages.append(p_int)

            # Merged source context
            contexts = []
            for idx in cluster:
                ctx = notes[idx].get("source_context", "").strip()
                if ctx:
                    contexts.append(ctx)
            source_context = "\n\n".join(contexts)

            # Inherit mode
            mode = notes[cluster[0]].get("mode", "")

            synthesis_note = {
                "title": synth_title,
                "description": synth_desc,
                "source_context": source_context,
                "source_pages": source_pages,
                "prerequisites": AterValidator.sanitize_prerequisites([f"[[{t}]]" for t in member_titles]),
                "concept_modality": "Comparative",
                "mode": mode,
            }
            new_synthesis_notes.append(synthesis_note)
            print(f"[EmbeddingsLinker] Formed Tier 2 Synthesis Note Plan: [[{synth_title}]] mapping components: {member_titles}")

        return notes + new_synthesis_notes

    def topological_sort(self, notes: List[Dict[str, Any]], full_text: str = "") -> List[Dict[str, Any]]:
        """
        Sorts the planned notes in strict dependency order (topological sort).
        Tie-breaks co-requisites and nodes without prerequisites using minimum page numbers,
        and falls back to character offset in raw text source.
        """
        title_to_note = {n["title"]: n for n in notes}
        offsets = {n["title"]: self.get_concept_offset(n["title"], full_text) for n in notes}

        def get_min_page(n):
            pages = n.get("source_pages", []) or []
            return min((int(p) for p in pages if str(p).isdigit()), default=9999)

        adj = {n["title"]: [] for n in notes}
        in_degree = {n["title"]: 0 for n in notes}

        for n in notes:
            title_v = n["title"]
            prereqs = n.get("prerequisites", []) or []
            for p in prereqs:
                title_u = p.replace("[[", "").replace("]]", "").strip()
                if title_u in title_to_note:
                    adj[title_u].append(title_v)
                    in_degree[title_v] += 1

        ready = [title for title, deg in in_degree.items() if deg == 0]

        def sort_key(title):
            note = title_to_note[title]
            return (get_min_page(note), offsets[title], title)

        sorted_titles = []
        while ready:
            ready.sort(key=sort_key)
            u = ready.pop(0)
            sorted_titles.append(u)

            for v in adj[u]:
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    ready.append(v)

        if len(sorted_titles) < len(notes):
            remaining = [n["title"] for n in notes if n["title"] not in sorted_titles]
            remaining.sort(key=sort_key)
            sorted_titles.extend(remaining)

        return [title_to_note[t] for t in sorted_titles]
