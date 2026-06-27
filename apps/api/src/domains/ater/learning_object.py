import re
import datetime
import json
from pathlib import Path
import frontmatter
from src.domains.ater.vault_manager import VaultManager

def normalize_title(title: str) -> str:
    """Normalizes titles by replacing spaces/underscores with a single underscore,
    and capitalizing the first letter of each word (TitleCase)."""
    if not title:
        return ""
    title = re.sub(r'[\\/:*?"<>|]', '_', title)
    cleaned = re.sub(r'[\s_]+', ' ', title).strip()
    words = cleaned.split(' ')
    capitalized_words = [w[0].upper() + w[1:] if w else "" for w in words]
    return "_".join(capitalized_words)

def get_hub_path(topic: str, semester: str = None, course: str = None, unit: str = None) -> str:
    """Resolves the Learning Hub path. Self-study hubs go to 'database/learning paths/',
    while coursework hubs go to 'database/study planner/'."""
    norm_topic = normalize_title(topic)
    filename = f"{norm_topic}_Hub.md"
    if semester or course or unit:
        return f"database/study planner/{filename}"
    else:
        return f"database/learning paths/{filename}"

def get_chapter_path(topic: str, chapter_title: str, order: int, semester: str = None, course: str = None, unit: str = None) -> str:
    """Resolves Chapter file paths for self-study and coursework."""
    norm_topic = normalize_title(topic)
    norm_chapter = normalize_title(chapter_title)
    padded_order = f"{order:02d}"
    chapter_folder = f"{padded_order}_{norm_chapter}"
    filename = f"Chapter_{padded_order}_{norm_chapter}.md"
    
    if semester or course or unit:
        norm_sem = normalize_title(semester or "")
        norm_course = normalize_title(course or "")
        norm_unit = normalize_title(unit or "")
        return f"database/{norm_sem}/{norm_course}/{norm_unit}/{chapter_folder}/{filename}"
    else:
        return f"database/General/{norm_topic}/{chapter_folder}/{filename}"

def get_note_path(topic: str, chapter_title: str = None, order: int = None, note_title: str = "", semester: str = None, course: str = None, unit: str = None) -> str:
    """Resolves Atomic Note paths for self-study and coursework."""
    norm_topic = normalize_title(topic)
    norm_note = normalize_title(note_title)
    filename = f"{norm_note}.md"
    
    if semester or course or unit:
        norm_sem = normalize_title(semester or "")
        norm_course = normalize_title(course or "")
        norm_unit = normalize_title(unit or "")
        if chapter_title and order is not None:
            norm_chapter = normalize_title(chapter_title)
            padded_order = f"{order:02d}"
            chapter_folder = f"{padded_order}_{norm_chapter}"
            return f"database/{norm_sem}/{norm_course}/{norm_unit}/{chapter_folder}/{filename}"
        else:
            return f"database/{norm_sem}/{norm_course}/{norm_unit}/{filename}"
    else:
        norm_chapter = normalize_title(chapter_title or "")
        padded_order = f"{order:02d}" if order is not None else "00"
        chapter_folder = f"{padded_order}_{norm_chapter}"
        return f"database/General/{norm_topic}/{chapter_folder}/{filename}"

def get_lesson_variant_path(note_title: str, variant: str) -> str:
    """Builds the deterministic filename for a lesson variant."""
    return f"lessons/{normalize_title(note_title)}.{variant}.html"

def get_artifact_pack_path(note_path: str) -> str:
    """Builds the deterministic path for an artifact pack relative to the vault root."""
    note_path_obj = Path(note_path)
    norm_stem = normalize_title(note_path_obj.stem)
    return (note_path_obj.parent / "artifacts" / f"{norm_stem}.artifacts.json").as_posix()

def build_hub_content(topic: str, learning_mode: str, chapters: list[str], chapter_notes: dict[str, list[str]] | None = None, prompt: str | None = None) -> str:
    """Constructs Learning Hub markdown frontmatter and body."""
    cleaned_chapters = []
    for ch in chapters:
        c = re.sub(r"[\[\]]+", "", ch).strip()
        cleaned_chapters.append(c)
    
    meta = {
        "type": "Learning Hub",
        "topic": topic,
        "learning_mode": learning_mode,
        "chapters": cleaned_chapters
    }
    if prompt:
        meta["prompt"] = prompt
    
    vm = VaultManager(".")
    yaml_part = vm.dump_obsidian_yaml(meta)
    
    body_lines = [f"# {normalize_title(topic)} Hub\n", "## Curriculum Map\n"]
    is_first_note = True
    for ch in cleaned_chapters:
        body_lines.append(f"- [[{ch}]]")
        for note in (chapter_notes or {}).get(ch, []):
            clean_note = re.sub(r"[\[\]]+", "", str(note)).strip()
            if clean_note:
                if is_first_note:
                    body_lines.append(f"  - [[{clean_note}]]")
                    is_first_note = False
                else:
                    body_lines.append(f"  - [[{clean_note}|🔒 {clean_note.replace('_', ' ')}]]")
    
    return f"---\n{yaml_part}---\n\n" + "\n".join(body_lines) + "\n"


def build_chapter_content(hub_title: str, order: int, atomic_notes: list[str], chapter_title: str = "") -> str:
    """Constructs Chapter markdown frontmatter and body."""
    hub_cleaned = re.sub(r"[\[\]]+", "", hub_title).strip()
    notes_cleaned = []
    for note in atomic_notes:
        notes_cleaned.append(re.sub(r"[\[\]]+", "", note).strip())
    
    meta = {
        "type": "Chapter",
        "hub": hub_cleaned,
        "order": order,
        "atomic_notes": notes_cleaned
    }
    
    vm = VaultManager(".")
    yaml_part = vm.dump_obsidian_yaml(meta)
    
    heading = chapter_title.replace("_", " ") if chapter_title else f"Chapter {order}"
    body_lines = [f"# {heading}\n", "## Atomic Notes\n"]
    for note in notes_cleaned:
        body_lines.append(f"- [[{note}]]")
    
    return f"---\n{yaml_part}---\n\n" + "\n".join(body_lines) + "\n"

def merge_atomic_note_metadata(existing_content: str, chapter_title: str, lesson_variants: dict[str, str], artifact_pack_path: str, hub_title: str = None, sources: list = None) -> str:
    """Merges new learning object properties into Atomic Note frontmatter."""
    from src.domains.ater.assistant import preprocess_frontmatter
    
    try:
        post = frontmatter.loads(preprocess_frontmatter(existing_content))
    except Exception:
        post = frontmatter.Post("")
        post.content = existing_content
        
    post.metadata["type"] = "Atomic Note"
    
    ch_cleaned = re.sub(r"[\[\]]+", "", chapter_title).strip()
    post.metadata["chapter"] = ch_cleaned
    
    if hub_title:
        h_cleaned = re.sub(r"[\[\]]+", "", hub_title).strip()
        post.metadata["hub"] = h_cleaned
        
    post.metadata["lesson_variants"] = lesson_variants
    post.metadata["artifact_pack"] = artifact_pack_path
    
    if sources is not None:
        post.metadata["sources"] = sources
    
    vm = VaultManager(".")
    yaml_part = vm.dump_obsidian_yaml(post.metadata)
    
    body = post.content
    if not body.startswith("\n") and body:
        body = "\n" + body
    return f"---\n{yaml_part}---\n{body}"

def build_minimal_artifact_pack(note_title: str, note_path: str) -> dict:
    """Builds a minimal valid artifact pack dictionary."""
    return {
        "schema_version": 1,
        "note_title": normalize_title(note_title),
        "note_path": note_path,
        "active_version": 1,
        "pinned_artifact_types": [],
        "versions": [
            {
                "version": 1,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "artifacts": []
            }
        ]
    }

def validate_artifact_pack(pack: dict) -> list[str]:
    """Validates the artifact pack against required fields and active version consistency."""
    errors = []
    required_fields = ["schema_version", "note_title", "note_path", "active_version", "pinned_artifact_types", "versions"]
    for rf in required_fields:
        if rf not in pack:
            errors.append(f"Missing required field: '{rf}'")
    
    if "versions" in pack:
        if not isinstance(pack["versions"], list):
            errors.append("'versions' must be a list")
        else:
            if "active_version" in pack:
                version_nums = [v.get("version") for v in pack["versions"] if isinstance(v, dict)]
                if pack["active_version"] not in version_nums:
                    errors.append(f"active_version {pack['active_version']} not found in versions list")
    return errors

def append_artifact_version(pack: dict, version_num: int, active: bool = True, artifacts: list = None) -> dict:
    """Appends a new version to the artifact pack while maintaining active version selection."""
    new_version = {
        "version": version_num,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "artifacts": artifacts if artifacts is not None else []
    }
    if "versions" not in pack:
        pack["versions"] = []
    pack["versions"].append(new_version)
    if active:
        pack["active_version"] = version_num
    return pack

def read_pinned_artifact_types(pack: dict) -> list[str]:
    """Reads pinned artifact types from the pack."""
    return pack.get("pinned_artifact_types", [])

def write_pinned_artifact_types(pack: dict, pinned_types: list[str]) -> dict:
    """Writes pinned artifact types to the pack."""
    pack["pinned_artifact_types"] = pinned_types
    return pack

def lookup_existing_hub(vault_path: str, topic: str) -> dict | None:
    """Recursively searches for existing Hub files in 'database/learning paths/' and 'database/study planner/'."""
    target_norm = normalize_title(topic).lower().replace("_", "")
    
    vault_dir = Path(vault_path)
    search_dirs = [
        (vault_dir / "database" / "learning paths", "self-study"),
        (vault_dir / "database" / "study planner", "coursework")
    ]
    
    for directory, path_type in search_dirs:
        if not directory.exists():
            continue
        for file_path in directory.rglob("*.md"):
            try:
                post = frontmatter.loads(file_path.read_text(encoding="utf-8"))
                meta = post.metadata
                
                # Check for type: Learning Hub
                if meta.get("type") != "Learning Hub":
                    continue
                
                stem = file_path.stem
                stem_norm = stem.lower().replace("_", "").replace("hub", "")
                
                if stem_norm == target_norm:
                    return {"path": Path(file_path.relative_to(vault_dir)).as_posix(), "type": path_type}
                
                meta_topic = meta.get("topic")
                if meta_topic:
                    norm_meta_topic = normalize_title(str(meta_topic)).lower().replace("_", "")
                    if norm_meta_topic == target_norm:
                        return {"path": Path(file_path.relative_to(vault_dir)).as_posix(), "type": path_type}
                        
                aliases = meta.get("aliases")
                if aliases:
                    if isinstance(aliases, list):
                        for alias in aliases:
                            norm_alias = normalize_title(str(alias)).lower().replace("_", "")
                            if norm_alias == target_norm:
                                return {"path": Path(file_path.relative_to(vault_dir)).as_posix(), "type": path_type}
                    elif isinstance(aliases, str):
                        norm_alias = normalize_title(aliases).lower().replace("_", "")
                        if norm_alias == target_norm:
                            return {"path": Path(file_path.relative_to(vault_dir)).as_posix(), "type": path_type}
            except Exception:
                continue
    return None

def validate_learning_objects(vault_path: str, strict: bool = False) -> list[str]:
    """Scans and validates all Hub, Chapter, Atomic Note files and their companion artifact packs."""
    errors = []
    vault_dir = Path(vault_path)
    if not vault_dir.exists():
        return [f"Vault directory does not exist: {vault_path}"]
        
    hubs = {}
    chapters = {}
    notes = {}
    
    for file_path in vault_dir.rglob("*.md"):
        try:
            content = file_path.read_text(encoding="utf-8")
            if not content.startswith("---"):
                continue
            post = frontmatter.loads(content)
            meta = post.metadata
            t = meta.get("type")
            stem = file_path.stem
            
            if t == "Learning Hub":
                hubs[stem] = (file_path, meta)
            elif t == "Chapter":
                chapters[stem] = (file_path, meta)
            elif t == "Atomic Note":
                notes[stem] = (file_path, meta)
        except Exception as e:
            errors.append(f"Failed to parse markdown file {file_path}: {e}")
            
    for hub_stem, (hub_path, hub_meta) in hubs.items():
        ch_list = hub_meta.get("chapters", [])
        if not isinstance(ch_list, list):
            errors.append(f"Hub '{hub_stem}' has invalid chapters format (must be list)")
            continue
        for ch_link in ch_list:
            clean_ch = re.sub(r"[\[\]]+", "", ch_link).strip()
            if clean_ch not in chapters:
                errors.append(f"Hub '{hub_stem}' (at {hub_path}) links to Chapter '{clean_ch}' but the Chapter file does not exist")
                
    for ch_stem, (ch_path, ch_meta) in chapters.items():
        notes_list = ch_meta.get("atomic_notes", [])
        if not isinstance(notes_list, list):
            errors.append(f"Chapter '{ch_stem}' has invalid atomic_notes format (must be list)")
            continue
        for note_link in notes_list:
            clean_note = re.sub(r"[\[\]]+", "", note_link).strip()
            if clean_note not in notes:
                errors.append(f"Chapter '{ch_stem}' (at {ch_path}) links to Atomic Note '{clean_note}' but the Note file does not exist")
                
    for note_stem, (note_path, note_meta) in notes.items():
        ch_link = note_meta.get("chapter")
        if not ch_link:
            errors.append(f"Atomic Note '{note_stem}' (at {note_path}) is missing 'chapter' link")
        else:
            clean_ch = re.sub(r"[\[\]]+", "", ch_link).strip()
            if clean_ch not in chapters:
                errors.append(f"Atomic Note '{note_stem}' (at {note_path}) links to Chapter '{clean_ch}' but the Chapter file does not exist")
                
        # Validate lesson_variants exists and variant HTML files exist on disk
        lesson_variants = note_meta.get("lesson_variants")
        if lesson_variants:
            if not isinstance(lesson_variants, dict):
                errors.append(f"Atomic Note '{note_stem}' (at {note_path}) has invalid 'lesson_variants' format (must be dict)")
            else:
                for variant, variant_path_rel in lesson_variants.items():
                    variant_abs_path = note_path.parent / variant_path_rel
                    if not variant_abs_path.exists():
                        msg = f"Atomic Note '{note_stem}' (at {note_path}) references lesson variant '{variant}' ({variant_path_rel}) but file does not exist on disk"
                        if strict:
                            errors.append(msg)
                        else:
                            import logging
                            logging.getLogger("Ater").warning(f"[WARNING] {msg}")

        art_pack_rel = note_meta.get("artifact_pack")
        if not art_pack_rel:
            errors.append(f"Atomic Note '{note_stem}' (at {note_path}) is missing 'artifact_pack' path")
        else:
            new_path = note_path.parent / "artifacts" / f"{note_stem}.artifacts.json"
            pack_found = False
            pack_path = None
            
            if new_path.exists():
                pack_found = True
                pack_path = new_path
            else:
                # Check legacy paths and migrate if found
                legacy_candidates = [
                    vault_dir / art_pack_rel,
                    vault_dir / "database" / art_pack_rel,
                    note_path.parent / art_pack_rel,
                    vault_dir / "database" / "artifacts" / f"{note_stem}.artifacts.json",
                    vault_dir / "artifacts" / f"{note_stem}.artifacts.json"
                ]
                import shutil
                for cand in legacy_candidates:
                    if cand.resolve() == new_path.resolve():
                        continue
                    if cand.exists():
                        try:
                            new_path.parent.mkdir(parents=True, exist_ok=True)
                            shutil.move(str(cand), str(new_path))
                            import logging
                            logging.getLogger("Ater").info(f"Validator migrated legacy artifact pack from {cand} to {new_path}")
                            pack_found = True
                            pack_path = new_path
                            break
                        except Exception as e:
                            import logging
                            logging.getLogger("Ater").error(f"Validator failed to migrate legacy artifact pack from {cand}: {e}")
            
            if not pack_found:
                errors.append(f"Atomic Note '{note_stem}' (at {note_path}) references artifact_pack '{art_pack_rel}' but file does not exist")
            else:
                try:
                    pack_data = json.loads(pack_path.read_text(encoding="utf-8"))
                    pack_errors = validate_artifact_pack(pack_data)
                    if pack_errors:
                        errors.append(f"Artifact pack at '{pack_path}' is malformed: {'; '.join(pack_errors)}")
                except Exception as e:
                    errors.append(f"Failed to load or parse artifact pack JSON at '{pack_path}': {e}")
                    
    return errors
