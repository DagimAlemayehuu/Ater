import re
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional
from .vault_manager import VaultManager
from .srs import SRSEngine, FSRSCard, fsrs_update

def list_practices(
    vm: VaultManager,
    planner_path: Path,
    academic_root: Path,
    vault_path: Path,
    list_planner_hubs_fn
) -> List[Dict[str, Any]]:
    """Lists all existing practices by scanning known storage locations recursively."""
    hubs = list_planner_hubs_fn()
    practices = []
    
    # 1. Identify all potential practice directories
    search_dirs = []
    
    # Root locations
    roots = [planner_path, academic_root]
    for root in roots:
        if root.exists():
            # Add the root's own Practice folder if it exists
            search_dirs.append(root / "Practice")
            # Find all nested Practice folders
            search_dirs.extend([p for p in root.rglob("Practice") if p.is_dir()])
    
    # Deduplicate and filter existing paths
    unique_dirs = list(set([str(d.absolute()) for d in search_dirs if d.exists()]))
    
    seen_files = set()
    for d_path in unique_dirs:
        pdir = Path(d_path)
        for file in pdir.glob("*.md"):
            if str(file.absolute()) in seen_files:
                continue
            seen_files.add(str(file.absolute()))
            
            try:
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()
                    data, _, err = vm.extract_yaml_and_content(content)
                    
                    if not err and data.get("type") == "practice":
                        h_id = data.get("hub_id")
                        # Normalize hub_id (strip brackets/quotes if present)
                        if h_id:
                            h_id = h_id.replace("[[", "").replace("]]", "").strip("\"'")
                            
                        matching_hub = next((h for h in hubs if h["id"] == h_id), None)
                        
                        # Determine hub title from various sources
                        hub_title = "Unlinked Session"
                        if matching_hub:
                            hub_title = matching_hub.get("title")
                        elif h_id:
                            # Fallback: clean-up the ID itself for a readable title
                            hub_title = h_id.replace(".md", "").replace("_", " ").split("/")[-1]
                            if "Hub" not in hub_title:
                                hub_title += " Hub"

                        # Extract metadata
                        metadata = {
                            "id": file.name,
                            "path": file.relative_to(vault_path).as_posix(),
                            "hub_id": h_id,
                            "date": data.get("date"),
                            "difficulty": data.get("difficulty"),
                            "score": data.get("score"),
                            "completed": data.get("completed", False),
                            "question_types": data.get("question_types", [])
                        }
                        # Add enrichment
                        metadata["hub_title"] = hub_title
                        metadata["course"] = (matching_hub or {}).get("course", "General")
                        practices.append(metadata)
            except Exception as e:
                print(f"[srs_engine] Error reading practice {file.name}: {e}")
    
    # Sort by ID (usually contains timestamp) descending
    practices.sort(key=lambda x: x.get("id", ""), reverse=True)
    return practices

def update_practice_score(practice_path: str, score: int) -> bool:
    """Updates the score of a practice file."""
    p = Path(practice_path)
    if not p.exists():
        return False
    try:
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        if yaml_match:
            import yaml as pyyaml
            data = pyyaml.safe_load(yaml_match.group(1))
            if data:
                data["score"] = score
                data["completed"] = True
                new_yaml = pyyaml.dump(data, sort_keys=False)
                new_content = f"---\n{new_yaml}---\n" + content[yaml_match.end():]
                with open(p, "w", encoding="utf-8") as f:
                    f.write(new_content)
                return True
    except Exception as e:
        print(f"[srs_engine] Error updating practice score {p.name}: {e}")
    return False
