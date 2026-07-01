"""
Ater Oracle — Comprehensive Tool-Calling Agent (v2)

Tools cover every app feature:
  - Vault: search, tag search, read, write
  - Academic DB: full CRUD on courses, semesters, exams, assignments, planner hubs
  - Practice: generate quiz, list sessions, analytics
  - FSRS: query due cards, override stability, study history
  - Pomodoro: start, pause, stop, set hub, get status  (all via SSE action events)
  - UI navigation: route changes, tab switches, note opens, toast notifications
  - Dynamic UI: render_ui tool wraps data as ater-ui code blocks for rich card rendering
  - App info: get vault stats, list hubs
"""

import re
import json
import logging
import sqlite3
import asyncio
import yaml
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional

import frontmatter
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import StructuredTool

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

from src.api.deps import AppSecrets
from src.domains.obsidian.client import ObsidianClient
from src.domains.ai.factory import ModelFactory
from src.domains.ater.service import AterService
from src.domains.ater.agents import (
    TheoryAgent,
    PractitionerAgent,
    get_persona
)
from src.domains.ater.templates import render_atomic_note, build_dynamic_section_plan
from src.domains.ater.healer import LogicHealer
from src.domains.ater.schemas import AtomicNoteSchema
from src.domains.ater.validator import AterValidator
from src.domains.ater.router import DomainRouter
from src.domains.ater.teaching_quality import (
    TeachingConceptSpec,
    build_default_grounding_context,
    build_deterministic_teaching_note,
    build_deterministic_teaching_quiz,
    ensure_teaching_markdown_quality,
    finalize_teaching_markdown,
    infer_teaching_modality,
    validate_teaching_markdown,
)

logger = logging.getLogger("AterAssistant")

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def to_underscore_title_case(s: str) -> str:
    cleaned = re.sub(r'[\s\-]+', '_', s.strip())
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', cleaned)
    parts = [p.capitalize() for p in cleaned.split('_') if p]
    return '_'.join(parts)


def preprocess_frontmatter(content: str) -> str:
    parts = content.split("---", 2)
    if len(parts) < 3:
        return content
    fm_text = parts[1]
    body_text = parts[2]

    def clean_plain_prop(m):
        key = m.group(1).strip()
        val = m.group(2)
        clean_val = re.sub(r'[\[\]]+', '', val).strip()
        return f'\n{key}: {clean_val}'

    fm_text = re.sub(r'(\n(?:course|semester)):\s*(.*)', clean_plain_prop, "\n" + fm_text, flags=re.IGNORECASE)
    if fm_text.startswith("\n"):
        fm_text = fm_text[1:]

    pattern = r'(\n[a-zA-Z0-9_\-]+:\s*)(?!["\'])(\[\[[^\]]+\]\])(?!["\'])'
    def repl(m):
        prefix = m.group(1)
        wikilink = m.group(2)
        inner = wikilink[2:-2].strip()
        return f'{prefix}"[[{to_underscore_title_case(inner)}]]"'

    fm_text = re.sub(pattern, repl, "\n" + fm_text)
    if fm_text.startswith("\n"):
        fm_text = fm_text[1:]

    return f"--- \n{fm_text}---{body_text}"


def sanitize_note_content(content: str) -> str:
    content = preprocess_frontmatter(content)
    try:
        post = frontmatter.loads(content)
        for key, val in list(post.metadata.items()):
            if key.lower() in ("course", "semester"):
                if isinstance(val, str):
                    post.metadata[key] = re.sub(r'[\[\]]+', '', val).strip()
            elif isinstance(val, str) and val.startswith("[[") and val.endswith("]]"):
                inner = val[2:-2].strip()
                post.metadata[key] = f"[[{to_underscore_title_case(inner)}]]"
        body = post.content
        def wikilink_sub(match):
            inner = match.group(1).strip()
            return f"[[{to_underscore_title_case(inner)}]]"
        body = re.sub(r'\[\[([^\]]+)\]\]', wikilink_sub, body)
        body_lines = body.splitlines()
        cleaned_body = []
        for i, line in enumerate(body_lines):
            stripped = line.strip()
            is_heading = stripped.startswith('#') and ' ' in stripped
            is_code_block = stripped.startswith('```')
            is_table_row = stripped.startswith('|')
            is_hr = stripped == "---"
            if (is_heading or is_code_block or is_table_row or is_hr) and cleaned_body:
                prev = cleaned_body[-1].strip()
                if prev != "":
                    if not (is_table_row and prev.startswith('|')):
                        cleaned_body.append("")
                        if is_hr:
                            cleaned_body.append("")
            cleaned_body.append(line)
            if is_heading and i < len(body_lines) - 1:
                nxt = body_lines[i + 1].strip()
                if nxt != "":
                    cleaned_body.append("")
        post.content = "\n".join(cleaned_body)
        dumped = frontmatter.dumps(post)
        parts = dumped.split("---", 2)
        if len(parts) >= 3:
            fm = parts[1]
            fm = re.sub(r"'\s*(\[\[[^\]]+\]\])\s*'", r'"\1"', fm)
            dumped = f"---{fm}---{parts[2]}"
        return dumped
    except Exception as e:
        logger.warning(f"Failed to parse frontmatter during sanitization: {e}")
        return content


def _learning_runtime_note_markdown(topic: str, note_title: str) -> str:
    """Deterministic fallback content for Teach Anything notes.

    The weak-model path may only produce a curriculum outline. This gives every
    new Atomic Note enough source material for the compiler, tutor, cram mode,
    and artifact pack flow to work immediately while preserving the Markdown as
    the source of truth.
    """
    display_topic = topic.replace("_", " ").strip() or "this topic"
    display_title = note_title.replace("_", " ").strip() or display_topic
    slug = to_underscore_title_case(display_title)
    return f"""## Mental Model
Think of {display_title} as one small control panel inside {display_topic}. You do not need to memorize everything at once. First learn what this idea controls, then learn what changes when you use it, and then test yourself by predicting the next result.

## What You Must Know
{display_title} matters because it explains one action, rule, or relationship that appears again and again while learning {display_topic}. Start by saying the idea in simple words, then connect it to a concrete example, and finally check whether you can use it without looking back at the note.

## Common Mistakes
The most common mistake is treating {display_title} like an isolated definition instead of a working tool. Another common mistake is moving too fast into advanced details before the basic cause and effect is clear.

## The Proving Grounds
```interactive-quiz
[
  {{
    "id": "{slug}_recall",
    "type": "mcq",
    "question": "What should you understand first about {display_title}?",
    "options": {{
      "A": "The core idea in simple words",
      "B": "Only the historical background",
      "C": "Every advanced edge case",
      "D": "A random fact unrelated to {display_topic}"
    }},
    "answer": "A",
    "explanation": "Ater starts with a simple mental model, then builds toward harder use cases."
  }},
  {{
    "id": "{slug}_teach_back",
    "type": "writing",
    "question": "Explain {display_title} in two simple sentences, as if teaching a 12-year-old.",
    "answer": "A good answer names the core idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back reveals whether the idea is actually understood or only recognized."
  }}
]
```
"""


def _ensure_interactive_quiz_block(content: str, topic: str, note_title: str) -> str:
    if "```interactive-quiz" in content:
        return content

    slug = to_underscore_title_case(note_title)
    quiz = [
        {
            "id": f"{slug}_core",
            "type": "mcq",
            "question": f"What is the main job of {note_title}?",
            "options": {
                "A": "To explain the core idea in simple words",
                "B": "To hide the important rule",
                "C": "To skip practice",
                "D": "To memorize unrelated facts",
            },
            "answer": "A",
            "explanation": f"{note_title} should first be understood as a clear, usable idea inside {topic}.",
        },
        {
            "id": f"{slug}_fill",
            "type": "fill_in",
            "question": f"{note_title} is useful because it helps you track the important ______ in {topic}.",
            "textWithBlanks": f"{note_title} is useful because it helps you track the important [[change]] in {topic}.",
            "answer": ["change"],
            "explanation": "Learning becomes useful when you can explain what changes and why it matters.",
        },
        {
            "id": f"{slug}_teach_back",
            "type": "writing",
            "question": f"Explain {note_title} in two simple sentences and give one concrete example.",
            "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
            "explanation": "Teach-back checks whether you can produce the idea from memory.",
        },
    ]
    block = "```interactive-quiz\n" + json.dumps(quiz, indent=2) + "\n```"
    if re.search(r"##\s+The Proving Grounds\b", content, flags=re.IGNORECASE):
        return re.sub(
            r"(##\s+The Proving Grounds\s*\n)[\s\S]*$",
            rf"\1{block}\n",
            content,
            flags=re.IGNORECASE,
        )
    return content.rstrip() + "\n\n## The Proving Grounds\n" + block + "\n"


async def _fetch_web_context(topic: str, note_title: str) -> str:
    """Query DuckDuckGo for the concept and build a grounding context."""
    clean_title = note_title.replace('_', ' ')
    query = f"{topic} {clean_title} explanation definition technical"
    logger.info(f"Querying DuckDuckGo for context: {query}")
    try:
        if DDGS is None:
            return ""
        # Run DDGS in a separate thread to prevent blocking the async loop
        def do_search():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=3))
        results = await asyncio.to_thread(do_search)
        if not results:
            return ""
        context_parts = []
        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")
            context_parts.append(f"Source: {title}\nExcerpt: {body}")
        return "\n\n".join(context_parts)
    except Exception as e:
        logger.warning(f"DuckDuckGo search failed for '{query}': {e}")
        return ""


async def _generate_learning_runtime_note_markdown(
    llm: Any,
    llm_creative: Any,
    topic: str,
    chapter_title: str,
    note_title: str,
    prompt: str,
    all_note_titles: List[str] = None,
    source_context: str = None
) -> str:
    if not llm:
        return ""
        
    if all_note_titles is None:
        all_note_titles = [note_title]

    # 1. Fetch web grounding context
    base_spec = TeachingConceptSpec(
        topic=topic,
        chapter_title=chapter_title,
        note_title=note_title,
        prompt=prompt,
        related_titles=tuple(all_note_titles or ()),
    )
    if not source_context:
        source_context = await _fetch_web_context(topic, note_title)
        if not source_context:
            source_context = build_default_grounding_context(base_spec)

    # 2. Epistemic modality classification
    # Keep this deterministic in Teach Anything Markdown. The model budget is
    # better spent on prose than on classifying note shape.
    modality = infer_teaching_modality(note_title, source_context)

    # 3. Mode/Persona selection
    routed_mode = DomainRouter().route(
        f"{topic}\n{chapter_title}\n{note_title}\n{prompt}\n{source_context[:1200]}",
        course=topic,
    )
    mode = routed_mode if routed_mode != "DOMAIN-UNKNOWN" else "ACADEMIC-GENERAL"
    
    domain = get_persona(mode, modality)
    concept_spec = TeachingConceptSpec(
        topic=topic,
        chapter_title=chapter_title,
        note_title=note_title,
        prompt=prompt,
        mode=mode,
        modality=modality,
        source_context=source_context,
        related_titles=tuple(all_note_titles or ()),
    )
    
    # 4. Instantiate agents
    theory_agent = TheoryAgent(llm_creative or llm, domain)
    practitioner_agent = PractitionerAgent(llm, domain)
    healer = LogicHealer(canonical_titles=set(all_note_titles))
    validator = AterValidator()

    # 5. Build note schema
    note_schema = AtomicNoteSchema(
        title=note_title,
        description=f"Concept: {note_title}",
        source_context=source_context,
        concept_modality=modality,
        mode=mode
    )

    # 6. Generation attempts
    generation_attempts = 0
    max_attempts = 1
    
    # Thin concepts segment
    thin_concepts = ", ".join([f"[[{t}]]" for t in all_note_titles[:15]])

    while generation_attempts < max_attempts:
        generation_attempts += 1
        try:
            # 6.1 Theory Pass
            theory_parts = await theory_agent.generate_micro(
                note_schema=note_schema,
                source_text=source_context,
                all_concepts=thin_concepts,
                used_scenarios=[],
                academic_level="General",
                course_title=topic,
                max_tokens=6000
            )
            # Heal and validate length
            for k in ["mental_model", "core_logic", "formal_model"]:
                if k in theory_parts:
                    theory_parts[k] = healer.heal_all(theory_parts[k], exclude_title=note_title)
                    
            if len(theory_parts.get("mental_model", "")) < 80 or len(theory_parts.get("core_logic", "")) < 30:
                raise ValueError("Analogy or core logic length check failed.")

            # 6.2 Practitioner Pass
            prac_parts = await practitioner_agent.generate_micro(
                note_title=note_title,
                theory_body=theory_parts.get("core_logic", ""),
                primary_language="General",
                mode=mode,
                source_text=source_context,
                academic_level="General",
                course_title=topic,
                max_tokens=8000,
                plain_english=theory_parts.get("mental_model", "")
            )
            if "formal_model" in prac_parts:
                prac_parts["formal_model"] = healer.heal_all(prac_parts["formal_model"], exclude_title=note_title)
                
            # Merge parts
            note_data = {
                "title": note_title,
                "course": topic,
                "unit": "1",
                "semester": "General",
                "mode": mode,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "prerequisites": [],
                "source_pages": [],
                "h1_title": domain.get("h1", "The Core Logic Explained"),
                "h2_title": domain.get("h2", "The Textbook Translation"),
                "artifact_title": domain.get("artifact", "Source Artifact"),
                "artifact_type": domain.get("type", "Markdown Table"),
                "section_plan": build_dynamic_section_plan(domain, modality),
                "hub": f"[[{topic}_Hub]]",
                "source": "Web Research"
            }
            note_data.update(theory_parts)
            note_data.update(prac_parts)
            note_data["dynamic3_content"] = prac_parts.get("limitations", "")

            # 6.3 Assessment Pass
            # Code owns quiz shape for the Markdown path. The weak model should
            # spend its budget on explanatory prose, not fragile JSON.
            quiz_qs = build_deterministic_teaching_quiz(concept_spec)
            note_data["possible_questions"] = "\n```interactive-quiz\n" + json.dumps(quiz_qs, indent=2) + "\n```"

            # 6.4 Assembly and Validation
            body_content = render_atomic_note(note_data, healer=healer)
            body_content = validator.repair_code_fences(body_content)
            body_content = finalize_teaching_markdown(body_content, concept_spec)
            quality_report = validate_teaching_markdown(body_content, concept_spec)
            if not quality_report.ok:
                logger.warning(
                    "Teach quality gate still had issues for '%s' after finalization: %s. Recompiling deterministic slots.",
                    note_title,
                    quality_report.summary(),
                )
                body_content = build_deterministic_teaching_note(concept_spec)
            
            # Check duplication
            if validator.check_section_duplication(body_content):
                logger.warning("Section duplication detected for '%s'. Recompiling deterministic slots.", note_title)
                body_content = build_deterministic_teaching_note(concept_spec)

            # Structure validation
            metadata = {
                "title": note_title,
                "tags": ["atomic-note", mode.lower(), topic.lower().replace(" ", "-")],
                "course": topic,
                "unit": "1",
                "semester": "General",
                "mode": mode,
                "type": "Atomic Note",
                "hub": f"[[{topic}_Hub]]",
                "source": "Web Research",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "prerequisites": [],
                "source_pages": [],
                "generated": True
            }
            yaml_part = yaml.safe_dump(metadata, default_flow_style=False)
            final_markdown = f"---\n{yaml_part}---\n{body_content}"
            
            is_valid, validation_errors = validator.validate_structure(final_markdown, course=topic, mode=mode)
            if not is_valid:
                logger.warning(
                    "Structure validation still had issues for '%s': %s. Recompiling deterministic slots.",
                    note_title,
                    validation_errors,
                )
                body_content = build_deterministic_teaching_note(concept_spec)

            # Return successfully generated markdown body
            return body_content

        except Exception as exc:
            logger.warning(f"Generation attempt {generation_attempts} failed for '{note_title}': {exc}")
            await asyncio.sleep(1)

    # Deterministic compilation if the prose model is unavailable or unusable.
    logger.warning(f"Model prose unavailable for '{note_title}'. Compiling deterministic teaching note.")
    return build_deterministic_teaching_note(concept_spec)


# In-process curriculum cache keyed by topic fingerprint (cleared on lesson start)
_CURRICULUM_CACHE: dict = {}

async def _stream_learning_runtime_lesson(
    messages_history: List[Dict[str, Any]],
    topic: str,
    secrets: AppSecrets,
    request: Optional[Any] = None,
):
    """Run Teach Anything through the new Ater learning-runtime modules.

    Two-phase flow:
    - Phase 1: First call — generate curriculum, stream roadmap preview, cache curriculum.
    - Phase 2: User clicks "Start Lesson" — retrieve cached curriculum, write files, generate
      Note 1 body, compile HTML, stream lesson_created.
    """
    if not secrets.vault_path:
        yield {"type": "error", "message": "Vault path is required for Teach Anything."}
        return

    latest_prompt = ""
    is_start_lesson = False
    original_learning_prompt = ""
    for msg in reversed(messages_history):
        if msg.get("role") == "user":
            latest_prompt = str(msg.get("content") or "")
            if latest_prompt.strip().lower() in ("start lesson", "start"):
                is_start_lesson = True
            break
    for msg in messages_history:
        if msg.get("role") == "user":
            content = str(msg.get("content") or "").strip()
            if content.lower() not in ("start lesson", "start") and content:
                original_learning_prompt = content
                break
    latest_prompt = latest_prompt or f"Teach me {topic}"

    try:
        import asyncio
        from src.domains.ater.compiler_service import AterLessonCompiler
        from src.domains.ater.artifact_service import ArtifactService
        from src.domains.ater import learning_object as lo

        vault_root = Path(secrets.vault_path)
        service = AterService(secrets)

        # ── PHASE 2: "Start Lesson" — retrieve cached curriculum, generate + compile ──
        if is_start_lesson:
            # Find a cached curriculum based on a recent learning topic in history
            cached_curriculum = None
            cache_key = None
            for msg in reversed(messages_history):
                if msg.get("role") == "user":
                    content = str(msg.get("content") or "")
                    if content.strip().lower() not in ("start lesson", "start"):
                        key_candidate = content.strip().lower()[:80]
                        if key_candidate in _CURRICULUM_CACHE:
                            cached_curriculum = _CURRICULUM_CACHE[key_candidate]
                            cache_key = key_candidate
                        break

            if not cached_curriculum:
                # No cache found — generate fresh (fallback)
                yield {"type": "status", "message": "Planning learning path..."}
                try:
                    cached_curriculum = await asyncio.wait_for(
                        service.planner.generate_curriculum(
                            prompt=latest_prompt,
                            existing_chapters=None,
                            learning_mode="learn_from_scratch",
                        ),
                        timeout=20,
                    )
                except asyncio.TimeoutError:
                    fallback_prompt = original_learning_prompt or topic or latest_prompt
                    cached_curriculum = service.planner._build_generic_curriculum(
                        fallback_prompt,
                        "learn_from_scratch",
                    )

            curriculum = cached_curriculum
            curriculum["prompt"] = curriculum.get("prompt") or topic or "learning"

            yield {"type": "status", "message": "Writing Hub, Chapters, and Atomic Notes..."}
            written = service.planner.write_curriculum(curriculum, mode="Progressive")

            compiler = AterLessonCompiler(str(vault_root))
            artifact_service = ArtifactService(vault_path=str(vault_root))
            first_note_path: Optional[Path] = None
            first_lesson_path: Optional[Path] = None

            topic_name = str(curriculum.get("topic") or topic or "Learning Path")
            chapters = curriculum.get("chapters") or []

            all_note_titles = []
            for chapter in chapters:
                for raw_note_title in chapter.get("atomic_notes") or []:
                    all_note_titles.append(str(raw_note_title))

            # Only generate Note 1 of Chapter 1 in Progressive mode
            first_chapter = chapters[0] if chapters else None
            if first_chapter:
                chapter_title = str(first_chapter.get("title") or "Foundations")
                order = int(first_chapter.get("order") or 1)
                first_note_raw = (first_chapter.get("atomic_notes") or [None])[0]
                if first_note_raw:
                    note_title = str(first_note_raw)
                    note_rel = lo.get_note_path(topic_name, chapter_title, order, lo.normalize_title(note_title))
                    note_abs = vault_root / note_rel

                    if note_abs.exists():
                        existing = note_abs.read_text(encoding="utf-8")
                        post = frontmatter.loads(preprocess_frontmatter(existing))
                        is_fallback_body = (
                            "one small control panel inside" in post.content
                            or "Ater starts with a simple mental model" in post.content
                        )
                        lacks_interactive_quiz = "```interactive-quiz" not in post.content
                        if not post.content.strip() or is_fallback_body or lacks_interactive_quiz:
                            yield {"type": "status", "message": f"Generating: {note_title}..."}
                            try:
                                generated_body = await asyncio.wait_for(
                                    _generate_learning_runtime_note_markdown(
                                        llm=getattr(service, "llm", None),
                                        llm_creative=getattr(service, "llm_creative", None),
                                        topic=topic_name,
                                        chapter_title=chapter_title,
                                        note_title=note_title,
                                        prompt=curriculum["prompt"],
                                        all_note_titles=all_note_titles
                                    ),
                                    timeout=60,
                                )
                            except asyncio.TimeoutError:
                                generated_body = None

                            write_spec = TeachingConceptSpec(
                                topic=topic_name,
                                chapter_title=chapter_title,
                                note_title=note_title,
                                prompt=curriculum["prompt"],
                                related_titles=tuple(all_note_titles or ()),
                            )
                            if generated_body:
                                post.content = ensure_teaching_markdown_quality(generated_body, write_spec)
                            else:
                                fallback_body = _ensure_interactive_quiz_block(
                                    _learning_runtime_note_markdown(topic_name, note_title),
                                    topic_name,
                                    note_title,
                                )
                                post.content = ensure_teaching_markdown_quality(fallback_body, write_spec)

                            vm = service.vm
                            yaml_part = vm.dump_obsidian_yaml(post.metadata)
                            body = post.content if post.content.startswith("\n") else f"\n{post.content}"
                            note_abs.write_text(f"---\n{yaml_part}---\n{body}", encoding="utf-8")

                    if note_abs.exists():
                        yield {"type": "status", "message": f"Compiling lesson: {note_title}..."}
                        for variant in ("simple", "deep", "cram", "exam"):
                            out = compiler.compile_lesson(note_abs, variant)
                            if variant == "simple":
                                if first_lesson_path is None:
                                    first_lesson_path = out
                                    first_note_path = note_abs

                        try:
                            note_post = frontmatter.loads(note_abs.read_text(encoding="utf-8"))
                            await artifact_service.generate_artifacts(
                                note_title=note_abs.stem,
                                note_path_rel=note_abs.relative_to(vault_root).as_posix(),
                                frontmatter=note_post.metadata,
                                content=note_post.content,
                            )
                        except Exception as artifact_err:
                            logger.warning(f"[Learning Runtime] Artifact fallback: {artifact_err}")

            if first_lesson_path is None or first_note_path is None:
                raise RuntimeError("Note 1 could not be compiled. Vault file may be missing.")

            first_rel = first_lesson_path.relative_to(vault_root).as_posix()
            from src.domains.ater.lesson_preview import register_ater_lesson_preview
            token = register_ater_lesson_preview(vault_root, first_lesson_path)
            preview_url = f"/api/ater/lesson/preview/{token}"
            if request:
                try:
                    preview_url = str(request.url_for("ater_lesson_preview", token=token))
                except Exception:
                    preview_url = f"/api/ater/lesson/preview/{token}"

            hub_path = written.get("hub_path", "")
            lesson_title = first_note_path.stem.replace("_", " ")
            chapter_count = len(chapters)
            note_count = sum(len(ch.get("atomic_notes") or []) for ch in chapters)

            # Clean cache entry
            if cache_key and cache_key in _CURRICULUM_CACHE:
                del _CURRICULUM_CACHE[cache_key]

            yield {
                "type": "chunk",
                "content": (
                    f"## {topic_name}\n\n"
                    f"Your first lesson is ready! I've created a progressive learning path in your vault:\n\n"
                    f"- **Hub:** `{hub_path}`\n"
                    f"- **Chapters planned:** {chapter_count}\n"
                    f"- **Total atomic notes:** {note_count}\n\n"
                    f"The Skill Tree on the right shows all upcoming lessons — they unlock progressively as you master each one."
                ),
            }
            yield {
                "type": "lesson_created",
                "title": lesson_title,
                "lesson_path": first_rel,
                "note_path": first_note_path.relative_to(vault_root).as_posix(),
                "hub_path": hub_path,
                "preview_url": preview_url,
            }
            return

        # ── PHASE 1: New topic request — generate curriculum, stream roadmap ──
        # Get the actual user topic from the latest message
        topic_prompt = latest_prompt
        cache_key = topic_prompt.strip().lower()[:80]

        yield {"type": "status", "message": "Planning your learning roadmap..."}
        try:
            curriculum = await asyncio.wait_for(
                service.planner.generate_curriculum(
                    prompt=topic_prompt,
                    existing_chapters=None,
                    learning_mode="learn_from_scratch",
                ),
                timeout=60,
            )
        except asyncio.TimeoutError:
            curriculum = service.planner._build_generic_curriculum(
                topic_prompt,
                "learn_from_scratch",
            )
        curriculum["prompt"] = topic_prompt

        # Cache for Phase 2
        _CURRICULUM_CACHE[cache_key] = curriculum

        topic_name = str(curriculum.get("topic") or topic or "Learning Path")
        chapters = curriculum.get("chapters") or []
        total_notes = sum(len(ch.get("atomic_notes") or []) for ch in chapters)


        # Build chapter card roadmap — plain, no emojis, all notes listed
        chapter_cards = []
        for ch_idx, ch in enumerate(chapters):
            ch_title = ch.get("title", "Chapter")
            notes = ch.get("atomic_notes") or []
            notes_lines = "\n".join(
                f"- [ ] {note}" for note in notes
            )
            chapter_cards.append(
                f"**Chapter {ch_idx + 1} — {ch_title}**  "
                f"*({len(notes)} Atomic Notes)*\n\n"
                f"Atomic Notes:\n\n"
                f"{notes_lines}"
            )

        chapters_block = "\n\n---\n\n".join(chapter_cards)

        yield {
            "type": "chunk",
            "content": (
                f"## {topic_name} — Learning Roadmap\n\n"
                f"{len(chapters)} chapters · {total_notes} lessons\n\n"
                f"---\n\n"
                f"{chapters_block}\n\n"
                f"---\n\n"
                f"Click **Start Lesson** to begin — Lesson 1 will be written to your vault."
            ),
        }

    except Exception as e:
        logger.error(f"[Learning Runtime] Teach Anything failed: {e}", exc_info=True)
        yield {"type": "error", "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# Input Schemas
# ─────────────────────────────────────────────────────────────────────────────

class SearchNotesInput(BaseModel):
    query: str = Field(description="Keywords to search for across all markdown notes.")

class SearchVaultByTagInput(BaseModel):
    tag: str = Field(description="Tag to search for (without the '#' prefix).")

class ReadNoteInput(BaseModel):
    path: str = Field(description="Relative vault path or note title to read.")

class WriteNoteInput(BaseModel):
    path: str = Field(description="Relative vault path to write (e.g. 'Notes/My_Note.md').")
    content: str = Field(description="Complete markdown content.")

class CreateAcademicRecordInput(BaseModel):
    record_type: str = Field(description="Type: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")
    title: str = Field(description="Title of the record.")
    properties: Dict[str, Any] = Field(default_factory=dict, description="YAML frontmatter fields to set.")

class UpdateAcademicRecordInput(BaseModel):
    record_type: str = Field(description="Type: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")
    id: str = Field(description="Title or ID of the record to update.")
    properties: Dict[str, Any] = Field(description="Properties to merge into the frontmatter.")

class DeleteAcademicRecordInput(BaseModel):
    record_type: str = Field(description="Type: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")
    id: str = Field(description="Title or ID of the record to delete.")

class QueryAcademicDatabaseInput(BaseModel):
    record_type: str = Field(description="Type to list: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")

class GenerateQuizInput(BaseModel):
    hub_id: str = Field(description="Name/ID of the study hub to generate questions for.")
    count: int = Field(default=5, description="Number of questions (1-15).")
    difficulty: str = Field(default="L1", description="Difficulty: 'L1' (easy), 'L2' (medium), 'L3' (hard).")

class StartGenerationInput(BaseModel):
    file_path: str = Field(description="Absolute path to the inbox file to process for note generation.")
    target_hub_id: Optional[str] = Field(default=None, description="Optional: specific hub ID to anchor the notes to.")

class NavigateToRouteInput(BaseModel):
    route: str = Field(
        description=(
            "App route to navigate to. Exact valid routes: "
            "'/agents?tab=ater' (Oracle AI chat), "
            "'/agents?tab=pipeline' (Ingestion pipeline), "
            "'/obsidian' (Vault browser/note editor), "
            "'/academic?tab=COURSES' (Courses), "
            "'/academic?tab=EXAMS' (Exams), "
            "'/academic?tab=ASSIGNMENTS' (Assignments), "
            "'/academic?tab=PLANNER' (Study planner), "
            "'/academic?tab=PROGRAM' (Program/Semesters/Years), "
            "'/academic?tab=CALENDAR' (Academic calendar), "
            "'/practice' (SRS practice arena), "
            "'/settings' (App settings). "
            "Always use the EXACT route string. Never use '/oracle' — use '/agents?tab=ater' instead."
        )
    )

class NavigateToNoteInput(BaseModel):
    note_path: str = Field(description="Relative vault path or note title to open in the vault viewer.")

class SwitchAcademicTabInput(BaseModel):
    tab: str = Field(description="Tab to switch to: 'courses', 'semesters', 'exams', 'assignments', 'planner', 'program'.")

class TriggerNotificationInput(BaseModel):
    variant: str = Field(description="Toast type: 'success', 'error', 'info', 'warning'.")
    message: str = Field(description="Text to show in the notification.")

class GetSrsCardsInput(BaseModel):
    hub_id: Optional[str] = Field(default=None, description="Filter due cards by hub name. Leave empty for all cards.")
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'cards'.")

class OverrideSrsStabilityInput(BaseModel):
    note_path: str = Field(description="Relative vault path to the note whose FSRS stability should be overridden.")
    manual_stability: float = Field(description="New stability score. Higher = further future review date. Typical range 0.1-30.")

class GetStudyHistoryInput(BaseModel):
    limit: int = Field(default=10, description="Max number of recent sessions to return.")
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'history'.")

class PomodoroStartInput(BaseModel):
    duration_minutes: int = Field(default=25, description="Focus session duration in minutes (5-60). Default is 25.")
    hub_id: Optional[str] = Field(default=None, description="Study hub to focus on during the session.")
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'pomodoro'.")

class PomodoroSetHubInput(BaseModel):
    hub_id: str = Field(description="Study hub name to set as the current focus target.")

class PausePomodoroInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq. Must be 'pomodoro'.")

class StopPomodoroInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq. Must be 'pomodoro'.")

class GetFocusHudInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq. Must be 'hud'.")

class GetAcademicCalendarInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq. Must be 'calendar'.")

class RenderUIInput(BaseModel):
    ui_type: str = Field(
        description=(
            "Type of UI block to render. Options:\n"
            "- 'course_cards': Grid of clickable course cards. data = list of {name, status, semester, credits, grade}.\n"
            "- 'note_cards': List of clickable note cards. data = list of {title, path, tags, snippet}.\n"
            "- 'hub_cards': Study hub cards. data = list of {name, note_count, description}.\n"
            "- 'exam_list': Exam rows. data = list of {name, course, date, weight, status}.\n"
            "- 'assignment_list': Assignment rows. data = list of {name, course, due_date, status, priority}.\n"
            "- 'stats': Summary stats panel. data = {sessions_today, total_notes, due_cards, active_hub, streak}.\n"
            "- 'srs_deck': SRS review cards. data = list of {title, path, due, difficulty, reps}.\n"
            "- 'semester_list': Semester overview cards. data = list of {name, year, status, course_count}.\n"
            "- 'interactive_sandbox': Interactive custom UI block. data = {title, type='math-plotter'|'table-explorer'|'node-graph', equation?, sliders?, headers?, rows?, nodes?, links?}."
        )
    )
    data: Any = Field(description="The data payload for the UI block. Must match the structure described for ui_type.")
    caption: Optional[str] = Field(default=None, description="Short optional caption/header shown above the block.")

class GetVaultStatsInput(BaseModel):
    category: Optional[str] = Field(
        default=None,
        description="Filter to get count only for a specific category (e.g., 'atomic_notes', 'hubs', 'pdfs', 'courses', 'exams', 'assignments', 'semesters', 'years', 'total_notes'). If provided, the tool returns a simple text statement of the count instead of rendering the dashboard grid UI."
    )
    dummy: str = Field(description="Dummy parameter to satisfy Groq. Must be 'stats'.")

class ListHubsInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'hubs'.")

class GetHubNotesInput(BaseModel):
    hub_id: str = Field(description="Name or ID of the study hub (e.g., '1_Understanding_International_Relations_Hub' or '1 Understanding International Relations Hub').")

class RenameNoteInput(BaseModel):
    old_path: str = Field(description="Relative vault path to the existing note.")
    new_path: str = Field(description="New relative vault path or new title.")

class DeleteNoteInput(BaseModel):
    path: str = Field(description="Relative vault path to the note to delete.")

class GetInboxFilesInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'inbox'.")

class GetQueueStatusInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'status'.")

class ToggleAutoDeployInput(BaseModel):
    state: bool = Field(description="True to enable auto-deploy, False to disable.")


class GetAppConfigInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'config'.")


class UpdateAppConfigInput(BaseModel):
    key_values: Dict[str, Any] = Field(
        description=(
            "Key-value pairs to update in settings. "
            "Valid keys: 'display_name', 'obsidian_vault_path', 'inbox_path', 'academic_folder_path', "
            "'auto_deploy', 'show_properties', 'pomodoro_work_duration', 'pomodoro_short_break_duration', "
            "'pomodoro_long_break_duration', 'pomodoro_sessions_before_long_break', 'ai_provider', 'ai_model', 'ai_base_url'."
        )
    )

class FactoryResetInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'reset'.")

class ClearStudyHistoryInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'history'.")

class ValidateFeynmanExplanationInput(BaseModel):
    note_path: str = Field(description="Relative vault path to the note being explained.")
    explanation: str = Field(description="The student's explanation to validate using Feynman method.")

class GenerateCustomPracticeInput(BaseModel):
    hub_id: str = Field(description="Name/ID of the study hub.")
    difficulty: str = Field(default="Mixed", description="Difficulty level ('Easy', 'Medium', 'Hard', 'Mixed').")
    preset: str = Field(default="balanced", description="Practice preset ('balanced', 'mcq_blitz', 'deep_write', 'math_mode', 'recall', 'hard_mode', 'exam_sim').")
    question_distribution: Optional[str] = Field(default=None, description="Optional JSON string specifying custom question distribution, e.g. '{\"mcq\": 7, \"true_false\": 4, \"writing\": 4}'")

class CreateExamInput(BaseModel):
    hub_ids: List[str] = Field(description="List of study hub names/IDs to compile questions from.")
    total_questions: int = Field(default=10, description="Total number of questions in the exam.")
    difficulty: str = Field(default="Mixed", description="Difficulty level ('Easy', 'Medium', 'Hard', 'Mixed').")
    question_types: Optional[Dict[str, int]] = Field(default=None, description="Optional dict specifying number of questions for each type, e.g. {'mcq': 7, 'true_false': 4, 'writing': 4}.")

class GradeExamInput(BaseModel):
    exam_id: str = Field(description="The unique identifier of the exam session being graded.")
    student_answers: Dict[str, Any] = Field(description="A dictionary mapping question IDs to the student's answers, e.g. {'eq_1': 'A', 'eq_2': 'True', 'eq_3': 'Written response...'.}")

class GetGeneratedFilesInput(BaseModel):
    dummy: str = Field(description="Dummy parameter to satisfy Groq requirements. Must be 'files'.")

class GenerateSummaryInput(BaseModel):
    target_id: str = Field(description="Name/ID of the study hub or relative vault path to the atomic note to summarize.")
    is_hub: bool = Field(default=False, description="True if the target is a study hub, False if it is a single atomic note.")

class ShowPracticeConfigInput(BaseModel):
    hub_id: str = Field(description="Name/ID of the study hub to configure practice for.")
    question_distribution: Dict[str, int] = Field(description="Number of questions for each type, e.g., {'mcq': 2, 'true_false': 3}.")
    difficulty: str = Field(default="Mixed", description="Difficulty: 'Mixed', 'Easy', 'Medium', 'Hard'.")
    grading_strictness: str = Field(default="Lenient", description="Grading strictness: 'Lenient', 'Strict'.")
    distractor_plausibility: str = Field(default="High", description="Distractor plausibility: 'High', 'Medium'.")
    inject_trick_answers: bool = Field(default=False, description="True to enable trick answers.")
    prioritize_weaknesses: bool = Field(default=False, description="True to focus on weak topics.")
    global_time_limit_minutes: Optional[int] = Field(default=None, description="Global time limit in minutes.")


class NotebookLMQueryInput(BaseModel):
    notebook_id: str = Field(description="UUID of the Google NotebookLM notebook to query.")
    query: str = Field(description="Question to ask about the notebook's sources.")
    conversation_id: Optional[str] = Field(default=None, description="Optional conversation UUID to continue a thread.")


class NotebookLMResearchInput(BaseModel):
    query: str = Field(description="Query to search the web/Drive for finding new sources.")
    notebook_id: Optional[str] = Field(default=None, description="Optional notebook UUID. If not provided, a new notebook will be created.")
    mode: str = Field(default="fast", description="Search mode: 'fast' (~30s, ~10 sources) or 'deep' (~5min, ~40 sources).")
    title: Optional[str] = Field(default=None, description="Optional title for the new notebook if created.")


class NotebookLMStudioCreateInput(BaseModel):
    notebook_id: str = Field(description="UUID of the Google NotebookLM notebook.")
    artifact_type: str = Field(description="Type of studio artifact to generate: 'audio', 'video', 'report', 'quiz', 'flashcards', 'mind_map', 'slide_deck', 'infographic', 'data_table'.")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional parameters for generation: audio_format, audio_length, question_count, difficulty, report_format, custom_prompt, focus_prompt, etc.")


class SearchWebInput(BaseModel):
    query: str = Field(description="The search query to look up on the web (e.g. 'recent news on Python 3.12 release date').")



def get_fallback_display_name() -> str:
    import os
    import json
    from pathlib import Path
    
    home = Path.home()
    paths = []
    if os.name == "nt":
        appdata = os.environ.get("APPDATA")
        if appdata:
            paths.extend([
                Path(appdata) / "com.dagim.ater" / "ater_config.json",
                Path(appdata) / "com.ater.app" / "ater_config.json"
            ])
    elif os.name == "posix":
        paths.extend([
            home / "Library" / "Application Support" / "com.dagim.ater" / "ater_config.json",
            home / "Library" / "Application Support" / "com.ater.app" / "ater_config.json",
            home / ".config" / "com.dagim.ater" / "ater_config.json",
            home / ".config" / "com.ater.app" / "ater_config.json"
        ])
        
    for p in paths:
        if p.exists() and p.is_file():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                name = data.get("displayName") or data.get("display_name")
                if name:
                    return name
            except Exception:
                pass
    return ""


def resolve_assistant_oracle_path() -> Path:
    import sys
    if getattr(sys, 'frozen', False):
        exe_path = Path(sys.executable)
        paths = [
            exe_path.parent / "resources" / ".system/prompts/assistant_oracle.md",
            exe_path.parent / ".system/prompts/assistant_oracle.md"
        ]
        if sys.platform == "darwin":
            paths.append(exe_path.parent.parent / "Resources" / ".system/prompts/assistant_oracle.md")
        for p in paths:
            if p.exists(): return p
        return Path("assistant_oracle.md").resolve()
    else:
        root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        p = root / ".system/prompts/assistant_oracle.md"
        if p.exists(): return p
        return Path("assistant_oracle.md").resolve()


# ─────────────────────────────────────────────────────────────────────────────
# AterAssistant Class
# ─────────────────────────────────────────────────────────────────────────────

class AterAssistant:
    def __init__(self, secrets: AppSecrets, user_context: Optional[Dict[str, Any]] = None):
        self.secrets = secrets
        self.user_context = user_context or {}
        if not self.user_context.get("display_name"):
            fallback_name = get_fallback_display_name()
            if fallback_name:
                self.user_context["display_name"] = fallback_name
        self.vault_path = secrets.vault_path
        self.academic_path = secrets.academic_path or "Notes"

        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.1,
            base_url=secrets.ai_base_url,
            max_tpm=secrets.ai_max_tpm,
            max_rpm=secrets.ai_max_rpm,
            max_tpd=secrets.ai_max_tpd,
            max_rpd=secrets.ai_max_rpd,
            max_concurrency=secrets.ai_max_concurrency
        )

        self.folder_map = {
            "courses": "courses",
            "semesters": "semesters",
            "exams": "exams",
            "assignments": "assignments",
            "study planner": "study planner",
            "study_sessions": "study planner",
            "years": "years"
        }

    # ── Vault helpers ──────────────────────────────────────────────────────

    def get_all_vault_notes(self) -> List[Dict[str, str]]:
        if not self.vault_path:
            return []
        root = Path(self.vault_path)
        notes = []
        for file in root.rglob("*"):
            if not file.is_file():
                continue
            if any(p.startswith(".") for p in file.parts) or ".trash" in file.parts:
                continue
            suffix = file.suffix.lower()
            if suffix in (".md", ".pdf"):
                try:
                    rel_path = file.relative_to(root).as_posix()
                    notes.append({
                        "title": file.name if suffix == ".pdf" else file.stem,
                        "path": rel_path
                    })
                except Exception:
                    continue
        notes.sort(key=lambda x: x["path"])
        return notes

    def truncate_note_if_large(self, content: str) -> str:
        if len(content.encode('utf-8')) <= 20 * 1024:
            return content
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_part = f"---{parts[1]}---"
            body = parts[2]
        else:
            fm_part = ""
            body = content
        body_bytes = body.encode('utf-8')
        limit = 4 * 1024
        if len(body_bytes) <= limit * 2:
            return content
        first_part = body_bytes[:limit].decode('utf-8', errors='ignore')
        last_part = body_bytes[-limit:].decode('utf-8', errors='ignore')
        warning = "\n\n[Content truncated — file exceeds limit. Showing head and tail.]\n\n"
        return f"{fm_part}\n{first_part}{warning}{last_part}"

    # ── NotebookLM tools ───────────────────────────────────────────────────

    async def notebooklm_query(self, notebook_id: str, query: str, conversation_id: Optional[str] = None) -> str:
        """Query a Google NotebookLM notebook using its sources."""
        from src.domains.notebooklm.runner import NotebookLMRunner, NotebookLMException
        args = ["notebook", "query", notebook_id, query]
        if conversation_id:
            args += ["--conversation-id", conversation_id]
        args += ["--json"]
        try:
            res = await NotebookLMRunner.run_command(args, parse_json=True)
            if isinstance(res, dict):
                answer = res.get("answer", "")
                citations = res.get("citations", [])
                citation_text = ""
                if citations:
                    citation_text = "\n\nCitations:\n" + "\n".join([f"- [{c.get('index', i)}]: {c.get('source_title', '')} (page {c.get('page_number', '')})" for i, c in enumerate(citations)])
                return f"{answer}{citation_text}"
            return str(res)
        except NotebookLMException as e:
            return f"Error querying NotebookLM: {e}"

    async def notebooklm_research(self, query: str, notebook_id: Optional[str] = None, mode: str = "fast", title: Optional[str] = None) -> str:
        """Run web/Drive research and import sources into a notebook."""
        from src.domains.notebooklm.runner import NotebookLMRunner, NotebookLMException
        args = ["research", "start", query]
        if notebook_id:
            args += ["--notebook-id", notebook_id]
        if mode:
            args += ["--mode", mode]
        if title:
            args += ["--title", title]
        try:
            start_res = await NotebookLMRunner.run_command(args)
            task_id = None
            for word in start_res.split():
                if len(word) > 10 and "-" in word:
                    task_id = word.strip("()<>:[].,\"'")
            
            logger.info(f"Started research. Output: {start_res}. Polling for completion...")
            nb_id = notebook_id
            
            max_polls = 30
            poll_interval = 5
            task_success = False
            for _ in range(max_polls):
                await asyncio.sleep(poll_interval)
                status_args = ["research", "status"]
                if nb_id:
                    status_args += [nb_id]
                status_res = await NotebookLMRunner.run_command(status_args)
                if "complete" in status_res.lower() or "done" in status_res.lower() or "success" in status_res.lower():
                    task_success = True
                    break
                elif "failed" in status_res.lower() or "error" in status_res.lower():
                    return f"Research failed: {status_res}"
            
            if not task_success:
                return f"Research started (Task ID: {task_id}), but did not complete within the timeout."

            import_args = ["research", "import"]
            if nb_id:
                import_args += [nb_id]
            if task_id:
                import_args += [task_id]
            import_res = await NotebookLMRunner.run_command(import_args)
            return f"Research completed and sources imported successfully!\nOutput: {import_res}"
            
        except NotebookLMException as e:
            return f"Error executing research: {e}"

    async def notebooklm_studio_create(self, notebook_id: str, artifact_type: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Create a study aid or content artifact from notebook sources."""
        from src.domains.notebooklm.runner import NotebookLMRunner, NotebookLMException
        payload = {"artifact_type": artifact_type, **(options or {})}
        try:
            args = NotebookLMRunner.build_studio_create_args(notebook_id, payload)
            res = await NotebookLMRunner.run_command(args)
            return f"Studio generation started for {artifact_type}!\nOutput: {res}"
        except ValueError as e:
            return f"Invalid NotebookLM studio request: {e}"
        except NotebookLMException as e:
            return f"Error generating studio artifact: {e}"

    # ── Vault tools ────────────────────────────────────────────────────────

    def search_notes_fulltext(self, query: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        matches = []
        query_lower = query.lower()
        for file in root.rglob("*.md"):
            if ".obsidian" in file.parts or ".git" in file.parts:
                continue
            try:
                content = file.read_text(encoding="utf-8")
                if query_lower in content.lower():
                    lines = content.splitlines()
                    snippets = []
                    for idx, line in enumerate(lines):
                        if query_lower in line.lower():
                            snippets.append(line.strip()[:100])
                            if len(snippets) >= 2:
                                break
                    matches.append({
                        "title": file.stem,
                        "path": file.relative_to(root).as_posix(),
                        "snippet": " | ".join(snippets)
                    })
                    if len(matches) >= 15:
                        break
            except Exception:
                continue

        if not matches:
            return f"No notes matched '{query}'."

        # Return rich search navigator UI
        return self.render_ui("search_navigator", {"query": query, "results": matches})

    def search_web(self, query: str) -> str:
        """
        Search the internet using DuckDuckGo. Falls back to local search if offline.
        """
        logger.info(f"search_web called with query: '{query}'")
        
        # 1. Fallback if DDGS is not available
        if DDGS is None:
            local_res = self._fallback_local_search(query)
            return f"*(Offline: falling back to local vault RAG)*\n\n{local_res}"
            
        try:
            # Query DuckDuckGo text search
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
                
            if not results:
                return f"No search results found on the web for: '{query}'."
                
            formatted = [f"### Web Search Results for: \"{query}\"\n"]
            for idx, r in enumerate(results, 1):
                title = r.get("title", "No Title")
                url = r.get("href", "#")
                snippet = r.get("body", "")
                formatted.append(f"{idx}. **[{title}]({url})**\n   {snippet}\n")
                
            return "\n".join(formatted)
            
        except Exception as e:
            logger.warning(f"search_web failed, falling back to local search: {e}")
            local_res = self._fallback_local_search(query)
            return f"*(Offline: falling back to local vault RAG)*\n\n{local_res}"

    def _fallback_local_search(self, query: str) -> str:
        local_results = self.search_notes_fulltext(query)
        if "No notes matched" in local_results:
            return f"No results found in your local Obsidian Vault for: '{query}'."
        return local_results

    def search_notes_by_tag(self, tag: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        tag_pattern = re.compile(r'#' + re.escape(tag.lstrip('#')), re.IGNORECASE)
        matches = []
        for file in root.rglob("*.md"):
            if any(p.startswith(".") for p in file.parts):
                continue
            try:
                content = file.read_text(encoding="utf-8")
                if tag_pattern.search(content):
                    matches.append({"title": file.stem, "path": file.relative_to(root).as_posix()})
                    if len(matches) >= 20:
                        break
            except Exception:
                continue
        if not matches:
            return f"No notes found with tag '#{tag}'."
        return self.render_ui("note_cards", matches, caption=f"Notes tagged #{tag}")

    def read_note(self, path: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        
        # Clean path of obsidian link brackets
        clean_path = path.replace("[[", "").replace("]]", "").strip()
        
        suffixes = ["", ".md", ".pdf", ".txt"]
        possible_paths = []
        for s in suffixes:
            if s:
                possible_paths.append(root / f"{clean_path}{s}")
                possible_paths.append(root / self.academic_path / f"{clean_path}{s}")
            else:
                possible_paths.append(root / clean_path)
                possible_paths.append(root / self.academic_path / clean_path)
                
        target_path = None
        for p in possible_paths:
            if p.exists() and p.is_file():
                target_path = p
                break
                
        if not target_path:
            # Search by stem (case-insensitive, ignoring spaces/underscores)
            stem_target = Path(clean_path).stem.replace(" ", "_").lower()
            for file in root.rglob("*"):
                if file.is_file() and not any(p.startswith(".") for p in file.parts) and ".trash" not in file.parts:
                    if file.stem.replace(" ", "_").lower() == stem_target:
                        target_path = file
                        break
                        
        if not target_path:
            return f"File '{path}' not found in the vault."
            
        try:
            if target_path.suffix.lower() == ".pdf":
                import pypdf
                reader = pypdf.PdfReader(target_path)
                pages = []
                total_chars = 0
                for i, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    if text.strip():
                        page_text = f"--- [PDF PAGE {i+1}] ---\n{text}"
                        pages.append(page_text)
                        total_chars += len(page_text)
                        if total_chars > 30000:
                            pages.append("\n\n[PDF content truncated due to size limits.]")
                            break
                return "\n\n".join(pages)
            else:
                return self.truncate_note_if_large(target_path.read_text(encoding="utf-8"))
        except Exception as e:
            return f"Error reading {target_path.name}: {e}"

    def write_note(self, path: str, content: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        rel_path = path if path.endswith(".md") else path + ".md"
        sanitized = sanitize_note_content(content)
        client = ObsidianClient(self.vault_path)
        success = client.write_note(rel_path, sanitized)
        if success:
            return f"Written: '{rel_path}'."
        return f"Failed to write '{rel_path}'."

    def rename_note(self, old_path: str, new_path: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        old_full = root / old_path
        if not old_full.exists():
            old_full = root / f"{old_path}.md"
        if not old_full.exists():
            return f"Error: '{old_path}' not found."
            
        new_full = root / new_path if new_path.endswith(".md") else root / f"{new_path}.md"
        new_full.parent.mkdir(parents=True, exist_ok=True)
        try:
            old_full.rename(new_full)
            return f"Renamed '{old_path}' to '{new_full.relative_to(root).as_posix()}'."
        except Exception as e:
            return f"Failed to rename: {e}"

    def delete_note(self, path: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        full = root / path
        if not full.exists():
            full = root / f"{path}.md"
        if not full.exists():
            return f"Error: '{path}' not found."
        try:
            full.unlink()
            return f"Deleted '{path}'."
        except Exception as e:
            return f"Failed to delete: {e}"

    def get_vault_stats(self, category: Optional[str] = None) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        database_dir = root / "database"
        
        total_notes = 0
        atomic_notes = 0
        hubs_count = 0
        courses_count = 0
        exams_count = 0
        assignments_count = 0
        semesters_count = 0
        years_count = 0
        pdf_count = 0
        
        # Traverse vault
        try:
            for file in root.rglob("*"):
                if any(p.startswith(".") for p in file.parts) or ".trash" in file.parts:
                    continue
                if file.is_file():
                    ext = file.suffix.lower()
                    if ext == ".pdf":
                        pdf_count += 1
                    elif ext == ".md":
                        rel_parts = [p.lower() for p in file.relative_to(root).parts]
                        if "database" in rel_parts:
                            if database_dir.exists() and file.is_relative_to(database_dir) and file.parent.parent == database_dir:
                                category_folder = file.parent.name.lower()
                                if category_folder == "courses":
                                    courses_count += 1
                                    total_notes += 1
                                elif category_folder == "study planner":
                                    hubs_count += 1
                                    total_notes += 1
                                elif category_folder == "exams":
                                    exams_count += 1
                                    total_notes += 1
                                elif category_folder == "assignments":
                                    assignments_count += 1
                                    total_notes += 1
                                elif category_folder == "semesters":
                                    semesters_count += 1
                                    total_notes += 1
                                elif category_folder == "years":
                                    years_count += 1
                                    total_notes += 1
                        else:
                            is_atomic = False
                            if "notes" in rel_parts:
                                is_atomic = True
                            else:
                                try:
                                    post = frontmatter.loads(file.read_text(encoding="utf-8"))
                                    t = str(post.metadata.get("type") or "").lower()
                                    if "atomic" in t:
                                        is_atomic = True
                                except Exception:
                                    pass
                            
                            if is_atomic:
                                atomic_notes += 1
                            total_notes += 1
        except Exception as e:
            logger.error(f"Error compiling vault stats: {e}")

        # Traverse inbox for PDFs
        inbox_pdf_count = 0
        if self.secrets.inbox_path:
            try:
                inbox_dir = Path(self.secrets.inbox_path)
                if inbox_dir.exists() and inbox_dir.is_dir():
                    for file in inbox_dir.rglob("*.pdf"):
                        if not any(p.startswith(".") for p in file.parts):
                            inbox_pdf_count += 1
            except Exception:
                pass

        if category:
            cat = category.lower().strip()
            stats_dict = {
                "atomic_notes": atomic_notes,
                "atomic note": atomic_notes,
                "atomicnotes": atomic_notes,
                "atomic": atomic_notes,
                "hubs": hubs_count,
                "hub": hubs_count,
                "study planner": hubs_count,
                "study_planner": hubs_count,
                "pdfs": pdf_count + inbox_pdf_count,
                "pdf": pdf_count + inbox_pdf_count,
                "courses": courses_count,
                "course": courses_count,
                "exams": exams_count,
                "exam": exams_count,
                "assignments": assignments_count,
                "assignment": assignments_count,
                "semesters": semesters_count,
                "semester": semesters_count,
                "years": years_count,
                "year": years_count,
                "total_notes": total_notes,
                "total note": total_notes,
                "total": total_notes,
            }
            val = None
            matched_key = None
            for key, count in stats_dict.items():
                if cat == key or cat.replace("_", " ") == key or cat.replace(" ", "_") == key:
                    val = count
                    matched_key = key
                    break
            
            if val is not None:
                report_key = matched_key.replace(" ", "_")
                return f"{report_key}: {val}"

        return self.render_ui("stats", {
            "atomic_notes": atomic_notes,
            "hubs": hubs_count,
            "pdfs": pdf_count + inbox_pdf_count,
            "courses": courses_count,
            "exams": exams_count,
            "assignments": assignments_count,
            "semesters": semesters_count,
            "years": years_count,
            "total_notes": total_notes
        }, caption="Vault Intelligence Statistics")

    def get_program_info(self) -> str:
        if not self.vault_path:
            return ""
        years_dir = Path(self.vault_path) / "database" / "years"
        if not years_dir.exists():
            return ""
        programs = set()
        active_year = ""
        current_year_val = ""
        for file in years_dir.glob("*.md"):
            try:
                post = frontmatter.loads(file.read_text(encoding="utf-8"))
                prog = post.metadata.get("program") or post.metadata.get("Program")
                if prog:
                    programs.add(self._clean_prop(prog))
                
                status = self._clean_prop(post.metadata.get("status") or post.metadata.get("Status"))
                if status.lower() in ("active", "current"):
                    active_year = file.stem.replace("_", " ")
                    curr = post.metadata.get("current_year") or post.metadata.get("Current Year")
                    if curr:
                        current_year_val = self._clean_prop(curr)
            except Exception:
                continue
        
        info = []
        if programs:
            info.append(f"Program: {', '.join(sorted(programs))}")
        if active_year:
            info.append(f"Active Year: {active_year}")
        if current_year_val:
            info.append(f"Current Year: {current_year_val}")
        return " | ".join(info)

    def list_hubs(self) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            service = AterService(self.secrets)
            hubs = service.list_planner_hubs()
            result = []
            for h in hubs:
                note_count = len(service.list_atomic_notes(h["id"]))
                result.append({
                    "name": h["title"],
                    "note_count": note_count,
                    "path": h["path"]
                })
            if not result:
                return "No study hubs found in vault."
            return self.render_ui("hub_cards", result)
        except Exception as e:
            logger.error(f"Error in list_hubs: {e}", exc_info=True)
            return f"Error listing hubs: {e}"

    def get_hub_notes(self, hub_id: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            clean_id = hub_id.strip()
            if not clean_id.endswith("_Hub"):
                if clean_id.lower().endswith(" hub"):
                    clean_id = clean_id[:-4].strip().replace(" ", "_") + "_Hub"
                else:
                    clean_id = clean_id.replace(" ", "_") + "_Hub"
            else:
                clean_id = clean_id.replace(" ", "_")
                
            service = AterService(self.secrets)
            notes = service.list_atomic_notes(clean_id)
            if not notes:
                hubs = service.list_planner_hubs()
                matched_id = None
                for h in hubs:
                    h_id = h.get("id", "").replace(".md", "")
                    if h_id.lower() == hub_id.lower() or h.get("title", "").lower() == hub_id.lower() or h_id.lower().replace("_", " ") == hub_id.lower():
                        matched_id = h_id
                        break
                if matched_id:
                    notes = service.list_atomic_notes(matched_id)
                    clean_id = matched_id
            
            if not notes:
                return f"No atomic notes found for study hub '{hub_id}'."
                
            return self.render_ui("note_cards", notes, caption=f"Atomic Notes in {clean_id.replace('_', ' ')}")
        except Exception as e:
            logger.error(f"Error in get_hub_notes: {e}", exc_info=True)
            return f"Error listing notes for hub '{hub_id}': {e}"

    def _clean_prop(self, val: Any) -> str:
        if val is None: return ""
        while isinstance(val, list):
            if len(val) == 0: return ""
            val = val[0]
        s = str(val).strip()
        s = re.sub(r"[\[\]]+", "", s).strip("\"' ")
        if s.lower() in ("unknown", "none", ""): return ""
        return s

    def query_academic_database(self, record_type: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."

        ui_map = {
            "courses": "course_cards",
            "semesters": "semester_list",
            "exams": "exam_list",
            "assignments": "assignment_list",
            "study planner": "hub_cards",
            "years": "year_list"
        }

        record_type_lower = record_type.lower()
        if record_type_lower not in self.folder_map:
            return f"Invalid academic record type '{record_type}'. Please use one of: {', '.join(self.folder_map.keys())}"

        folder = self.folder_map.get(record_type_lower, record_type_lower)
        db_dir = Path(self.vault_path) / "database" / folder
        ui_type = ui_map.get(record_type_lower, "course_cards")

        # Friendly label for user-facing messages
        label_map = {
            "courses": "courses",
            "semesters": "semesters",
            "exams": "exams",
            "assignments": "assignments",
            "study planner": "study planner hubs",
            "years": "academic years"
        }
        label = label_map.get(record_type_lower, record_type)

        if not db_dir.exists():
            return f"You don't have any {label} yet. You can create one by asking me to add a {record_type.rstrip('s')}."

        records = []
        for file in sorted(db_dir.glob("*.md")):
            try:
                post = frontmatter.loads(file.read_text(encoding="utf-8"))
                meta = dict(post.metadata)

                # Clean metadata for UI (convert empty lists/dicts to empty strings)
                for k, v in meta.items():
                    if isinstance(v, (list, dict)) and not v:
                        meta[k] = ""
                    elif isinstance(v, (list, dict)):
                        meta[k] = str(v)

                meta["_title"] = file.stem
                meta["id"] = file.stem
                meta["path"] = f"database/{folder}/{file.name}"
                records.append(meta)
            except Exception:
                records.append({"_title": file.stem, "id": file.stem})

        if not records:
            return f"You don't have any {label} yet. You can create one by asking me to add a {record_type.rstrip('s')}."

        return self.render_ui(ui_type, records[:50])

    def create_academic_record(self, record_type: str, title: str, properties: Dict[str, Any]) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        filename = f"{to_underscore_title_case(title)}.md"
        relative_path = f"database/{folder}/{filename}"
        post = frontmatter.Post("")
        post.metadata["type"] = record_type.rstrip('s')
        post.metadata["title"] = to_underscore_title_case(title)
        for k, v in properties.items():
            if k.lower() in ("course", "semester"):
                post.metadata[k] = re.sub(r'[\[\]]+', '', str(v)).strip()
            else:
                post.metadata[k] = v
        client = ObsidianClient(self.vault_path)
        success = client.write_note(relative_path, frontmatter.dumps(post))
        if success:
            return f"Created {record_type} '{title}'."
        return f"Failed to create {record_type} '{title}'."

    def update_academic_record(self, record_type: str, id: str, properties: Dict[str, Any]) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        filename = f"{to_underscore_title_case(id)}.md"
        relative_path = f"database/{folder}/{filename}"
        client = ObsidianClient(self.vault_path)
        note_data = client.read_note(relative_path)
        if not note_data:
            dir_path = Path(self.vault_path) / "database" / folder
            if dir_path.exists():
                for f in dir_path.glob("*.md"):
                    if f.stem.lower() == id.lower() or f.stem.replace("_", " ").lower() == id.lower():
                        relative_path = f.relative_to(self.vault_path).as_posix()
                        note_data = client.read_note(relative_path)
                        break
        if not note_data:
            return f"'{id}' not found in {record_type}."
        post = frontmatter.Post(note_data["content"])
        post.metadata.update(note_data["metadata"])
        for k, v in properties.items():
            if k.lower() in ("course", "semester"):
                post.metadata[k] = re.sub(r'[\[\]]+', '', str(v)).strip()
            else:
                post.metadata[k] = v
        success = client.write_note(relative_path, frontmatter.dumps(post))
        if success:
            return f"Updated {record_type} '{id}'."
        return f"Failed to update {record_type} '{id}'."

    def delete_academic_record(self, record_type: str, id: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        filename = f"{to_underscore_title_case(id)}.md"
        relative_path = f"database/{folder}/{filename}"
        client = ObsidianClient(self.vault_path)
        success = client.delete_item(relative_path)
        if success:
            return f"Deleted {record_type} '{id}'."
        return f"'{id}' not found in {record_type}."

    # ── Practice / FSRS tools ──────────────────────────────────────────────

    async def generate_quiz(self, hub_id: str, count: int = 5, difficulty: str = "L1") -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        service = AterService(self.secrets)
        config_raw = {"question_count": min(max(count, 1), 15), "difficulty": difficulty, "question_type": "Multiple Choice"}
        try:
            res = await service.generate_practice(hub_id, config_raw)
            questions = res.get("questions", [])
            if not questions:
                return "No questions generated. The hub may be empty or the AI service returned nothing."
            questions_list = []
            for q in questions:
                q_dict = q.model_dump() if hasattr(q, "model_dump") else dict(q)
                q_dict = {k: v for k, v in q_dict.items() if v is not None}
                questions_list.append(q_dict)
            hub_display = hub_id.replace("_", " ")
            # Return full interactive quiz block
            return f"Quiz on **{hub_display}** ({len(questions_list)} questions, {difficulty}):\n\n```interactive-quiz\n{json.dumps(questions_list, indent=2)}\n```"
        except Exception as e:
            return f"Error generating quiz: {e}"

    def get_srs_cards(self, hub_id: Optional[str] = None) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "No SRS cards yet."
        try:
            from src.domains.ater.srs import SRSEngine
            engine = SRSEngine(db_path)
            hub_notes = []
            if hub_id and hub_id != "all" and self.vault_path:
                service = AterService(self.secrets)
                hub_notes = [n["path"] for n in service.list_atomic_notes(hub_id)]
            cards = engine.get_due(hub_notes if hub_notes else None)
            if not cards:
                label = f"hub '{hub_id}'" if hub_id else "any hub"
                return f"No cards due for review in {label}."
            card_list = [
                {
                    "title": Path(c.note_path).stem.replace("_", " "),
                    "path": c.note_path,
                    "due": c.due.strftime('%Y-%m-%d'),
                    "difficulty": round(c.difficulty, 2),
                    "stability": round(c.stability, 2),
                    "reps": c.reps
                }
                for c in cards[:20]
            ]
            return self.render_ui("srs_deck", card_list)
        except Exception as e:
            return f"Error fetching SRS cards: {e}"

    def override_srs_stability(self, note_path: str, manual_stability: float) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "SRS database does not exist."
        try:
            from src.domains.ater.srs import SRSEngine
            engine = SRSEngine(db_path)
            days_ahead = max(1, int(manual_stability * 9))
            new_due = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()
            engine.conn.execute(
                "UPDATE srs_cards SET stability=?, due=? WHERE note_path=?",
                (manual_stability, new_due, note_path)
            )
            engine.conn.commit()
            stem = Path(note_path).stem.replace("_", " ")
            return f"Updated SRS stability for '{stem}'. Next review in ~{days_ahead} days."
        except Exception as e:
            return f"Error overriding SRS stability: {e}"

    def get_study_history(self, limit: int = 10) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "No study history yet. Start a Pomodoro session or complete a practice quiz to begin tracking."
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            sessions = [dict(r) for r in conn.execute(
                "SELECT * FROM study_sessions ORDER BY timestamp DESC LIMIT ?", (limit,)
            ).fetchall()]
            practice = [dict(r) for r in conn.execute(
                "SELECT * FROM practice_log ORDER BY timestamp DESC LIMIT ?", (limit,)
            ).fetchall()]
            conn.close()
            if not sessions and not practice:
                return "No study history yet. Start a Pomodoro session or complete a practice quiz to begin tracking."
            return self.render_ui("study_history", {"sessions": sessions, "practice": practice}, caption="Recent Study History")
        except Exception as e:
            return f"Error reading study history: {e}"

    def get_app_config(self) -> str:
        """Fetch all current application and configuration settings."""
        config_data = {
            "display_name": self.user_context.get("display_name", ""),
            "obsidian_vault_path": self.user_context.get("obsidian_vault_path", self.secrets.vault_path or ""),
            "inbox_path": self.user_context.get("inbox_path", self.secrets.inbox_path or ""),
            "academic_folder_path": self.user_context.get("academic_folder_path", self.secrets.academic_path or ""),
            "auto_deploy": self.user_context.get("auto_deploy", self.secrets.auto_deploy),
            "pomodoro_work_duration": self.user_context.get("pomodoro_work_duration", 25),
            "pomodoro_short_break_duration": self.user_context.get("pomodoro_short_break_duration", 5),
            "pomodoro_long_break_duration": self.user_context.get("pomodoro_long_break_duration", 15),
            "pomodoro_sessions_before_long_break": self.user_context.get("pomodoro_sessions_before_long_break", 4),
            "show_properties": self.user_context.get("show_properties", False),
            "ai_provider": self.user_context.get("ai_provider", self.secrets.ai_provider),
            "ai_model": self.user_context.get("ai_model", self.secrets.ai_model),
            "ai_base_url": self.user_context.get("ai_base_url", self.secrets.ai_base_url or ""),
        }
        return self.render_ui("app_config", config_data, caption="System Configuration Settings")

    def update_app_config(self, key_values: Dict[str, Any]) -> str:
        """
        Update system settings.
        Valid keys: 'display_name', 'obsidian_vault_path', 'inbox_path', 'academic_folder_path',
        'auto_deploy', 'show_properties', 'pomodoro_work_duration', 'pomodoro_short_break_duration',
        'pomodoro_long_break_duration', 'pomodoro_sessions_before_long_break', 'ai_provider', 'ai_model', 'ai_base_url'.
        """
        mapped = {}
        key_map = {
            "display_name": "displayName",
            "displayname": "displayName",
            "displayName": "displayName",
            "obsidian_vault_path": "obsidianVaultPath",
            "obsidianvaultpath": "obsidianVaultPath",
            "obsidianVaultPath": "obsidianVaultPath",
            "inbox_path": "inboxPath",
            "inboxpath": "inboxPath",
            "inboxPath": "inboxPath",
            "academic_folder_path": "academicFolderPath",
            "academicfolderpath": "academicFolderPath",
            "academicFolderPath": "academicFolderPath",
            "auto_deploy": "autoDeploy",
            "autodeploy": "autoDeploy",
            "autoDeploy": "autoDeploy",
            "show_properties": "showProperties",
            "showproperties": "showProperties",
            "showProperties": "showProperties",
            "pomodoro_work_duration": "pomodoroWorkDuration",
            "pomodoroworkduration": "pomodoroWorkDuration",
            "pomodoroWorkDuration": "pomodoroWorkDuration",
            "pomodoro_short_break_duration": "pomodoroShortBreakDuration",
            "pomodoroshortbreakduration": "pomodoroShortBreakDuration",
            "pomodoroShortBreakDuration": "pomodoroShortBreakDuration",
            "pomodoro_long_break_duration": "pomodoroLongBreakDuration",
            "pomodorolongbreakduration": "pomodoroLongBreakDuration",
            "pomodoroLongBreakDuration": "pomodoroLongBreakDuration",
            "pomodoro_sessions_before_long_break": "pomodoroSessionsBeforeLongBreak",
            "pomodorosessionsbeforelongbreak": "pomodoroSessionsBeforeLongBreak",
            "pomodoroSessionsBeforeLongBreak": "pomodoroSessionsBeforeLongBreak",
            "ai_provider": "aiProvider",
            "aiprovider": "aiProvider",
            "aiProvider": "aiProvider",
            "ai_model": "aiModel",
            "aimodel": "aiModel",
            "aiModel": "aiModel",
            "ai_base_url": "aiBaseUrl",
            "aibaseurl": "aiBaseUrl",
            "aiBaseUrl": "aiBaseUrl",
        }
        
        for k, v in key_values.items():
            mapped_key = key_map.get(k, k)
            if mapped_key in ("pomodoroWorkDuration", "pomodoroShortBreakDuration", "pomodoroLongBreakDuration", "pomodoroSessionsBeforeLongBreak"):
                try:
                    mapped[mapped_key] = int(v)
                except ValueError:
                    mapped[mapped_key] = v
            elif mapped_key in ("autoDeploy", "showProperties"):
                if isinstance(v, str):
                    mapped[mapped_key] = v.lower() == "true"
                else:
                    mapped[mapped_key] = bool(v)
            else:
                mapped[mapped_key] = v
                
        payload = {"action": "update_config", "key_values": mapped}
        return f"ACTION:{json.dumps(payload)}"

    def factory_reset(self) -> str:
        """Perform system factory reset."""
        return f"ACTION:{json.dumps({'action': 'factory_reset'})}"

    def clear_study_history(self) -> str:
        """Clear all practice and session logs."""
        return f"ACTION:{json.dumps({'action': 'clear_study_history'})}"

    async def validate_feynman_explanation(self, note_path: str, explanation: str) -> str:
        """Use AI to validate the user's Feynman explanation for a note."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            # We call the FastAPI endpoint or service directly to validate
            AterService(self.secrets)
            # Find the actual FSRS note path or resolve relative path
            # Resolve db_path
            db_path = Path(self.secrets.inbox_path) / "ater_queue.db" if self.secrets.inbox_path else None
            if not db_path or not db_path.exists():
                return "Error: SRS queue database not initialized."
            from src.domains.ater.srs import SRSEngine
            engine = SRSEngine(db_path)
            res = engine.validate_feynman_gate(note_path, explanation, Path(self.secrets.vault_path))
            
            # Map SRSEngine response keys to frontend payload keys
            is_valid = res.get("success", False)
            if is_valid:
                score = 100
                feedback = "Explanation validated successfully."
            else:
                score = 0
                error_msg = res.get("error")
                missing = res.get("missing_keywords")
                if error_msg:
                    feedback = error_msg
                elif missing:
                    feedback = f"Missing key concepts: {', '.join(missing)}"
                else:
                    feedback = "Explanation needs improvement."

            # Emit action to frontend to update UI state
            payload = {
                "action": "feynman_validated",
                "note_path": note_path,
                "is_valid": is_valid,
                "feedback": feedback,
                "score": score
            }
            return f"ACTION:{json.dumps(payload)}"
        except Exception as e:
            logger.error(f"Feynman validation failed: {e}", exc_info=True)
            return f"Error validating explanation: {e}"

    async def generate_custom_practice(self, hub_id: str, difficulty: str = "Mixed", preset: str = "balanced", question_distribution: Optional[str] = None) -> str:
        """Generate a practice quiz session with custom parameters."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            # Look up preset distribution
            presets = {
                "balanced": {"mcq":2, "true_false":2, "writing":1, "fill_in":2, "matching":1, "order":1, "synthesis":1, "calculation":1, "data_analysis":1},
                "mcq_blitz": {"mcq":15, "true_false":5},
                "deep_write": {"writing":4, "synthesis":3, "trace":2, "debug":2},
                "math_mode": {"calculation":6, "data_analysis":4, "trace":3},
                "recall": {"mcq":5, "true_false":5, "fill_in":5},
                "hard_mode": {"writing":2, "synthesis":3, "calculation":3, "debug":2, "trace":2, "data_analysis":2},
                "exam_sim": {"mcq":5, "true_false":3, "writing":2, "fill_in":3, "calculation":2, "matching":2, "order":1}
            }
            dist = presets.get(preset.lower(), presets["balanced"])
            if question_distribution:
                try:
                    custom_dist = json.loads(question_distribution)
                    if isinstance(custom_dist, dict):
                        dist = custom_dist
                except Exception as je:
                    logger.warning(f"Failed to parse question_distribution JSON: {je}")

            service = AterService(self.secrets)
            config_payload = {
                "difficulty": difficulty,
                "questionDistribution": dist,
                "hubId": hub_id
            }
            res = await service.generate_practice(hub_id, config_payload)
            questions = res.get("questions", [])
            if not questions:
                return "No questions generated."
            
            questions_list = []
            for q in questions:
                q_dict = q.model_dump() if hasattr(q, "model_dump") else dict(q)
                q_dict = {k: v for k, v in q_dict.items() if v is not None}
                questions_list.append(q_dict)
            
            hub_display = hub_id.replace("_", " ")
            return f"Custom Practice Session on **{hub_display}** ({len(questions_list)} questions, {difficulty}):\n\n```interactive-quiz\n{json.dumps(questions_list, indent=2)}\n```"
        except Exception as e:
            logger.error(f"Generate custom practice failed: {e}", exc_info=True)
            return f"Error: {e}"

    async def create_exam(self, hub_ids: List[str], total_questions: int = 10, difficulty: str = "Mixed", question_types: Optional[Dict[str, int]] = None) -> str:
        """Create a secure exam across multiple study hubs using ExamEngine."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            from .exam_engine import ExamEngine
            engine = ExamEngine(self.vault_path)
            
            if not question_types:
                question_types = {"mcq": 5, "true_false": 5}
                
            config = {
                "total_questions": total_questions,
                "difficulty": difficulty,
                "question_types": question_types
            }
            
            exam = await engine.create_exam(hub_ids, config, self.secrets)
            
            # Format questions in markdown for the user to read/take
            md_lines = []
            md_lines.append(f"### Secure Exam Session: `{exam['exam_id']}`")
            md_lines.append(f"**Hubs:** {', '.join(exam['hub_ids'])}")
            md_lines.append(f"**Total Questions:** {len(exam['questions'])} | **Difficulty:** {difficulty}")
            md_lines.append("\n---\n")
            
            for q in exam["questions"]:
                q_id = q["id"]
                q_type = q["type"]
                q_text = q["question"]
                
                md_lines.append(f"**Question {q_id.replace('eq_', '')}** ({q_type.upper()})")
                md_lines.append(q_text)
                
                if q_type == "mcq" and q.get("options"):
                    for opt_key, opt_val in q["options"].items():
                        md_lines.append(f"- **{opt_key}**: {opt_val}")
                elif q_type == "true_false":
                    md_lines.append("- True\n- False")
                elif q_type == "fill_in" and q.get("text_with_blanks"):
                    md_lines.append(f"Fill in the blanks: {q['text_with_blanks']}")
                
                md_lines.append("") # spacer
                
            md_lines.append("\n---\n")
            md_lines.append(f"To submit and grade your answers, call the `grade_exam` tool with `exam_id='{exam['exam_id']}'` and your answers dict.")
            
            return "\n".join(md_lines)
        except Exception as e:
            logger.error(f"Failed to create exam: {e}", exc_info=True)
            return f"Error creating exam: {e}"

    def grade_exam(self, exam_id: str, student_answers: Dict[str, Any]) -> str:
        """Grade a completed exam using ExamEngine and return report."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            from .exam_engine import ExamEngine
            engine = ExamEngine(self.vault_path)
            report = engine.grade_exam(exam_id, student_answers)
            
            # Format grading report in markdown
            md_lines = []
            md_lines.append(f"### Exam Grading Report: `{exam_id}`")
            md_lines.append(f"**Score:** {report.get('correct_answers', 0)} / {report.get('total_questions', 0)} ({report.get('score_percentage', 0):.1f}%)")
            status_text = "PASSED" if report.get("passed", False) else "FAILED"
            md_lines.append(f"**Status:** {status_text}")
            md_lines.append("\n---\n")
            
            results = report.get("results", {})
            for q_id, res in results.items():
                is_correct = res.get("is_correct", False)
                status = "✅ Correct" if is_correct else "❌ Incorrect"
                md_lines.append(f"**Question {q_id.replace('eq_', '')}**: {res.get('question')}")
                md_lines.append(f"- Status: {status}")
                md_lines.append(f"- Your Answer: `{res.get('student_answer')}`")
                md_lines.append(f"- Correct Answer: `{res.get('correct_answer')}`")
                if res.get("explanation"):
                    md_lines.append(f"- Explanation: {res.get('explanation')}")
                md_lines.append("")
                
            if report.get("recommended_review_notes"):
                md_lines.append("**Recommended Notes to Review:**")
                for note in report["recommended_review_notes"]:
                    md_lines.append(f"- [[{Path(note).stem}]]")
                    
            return "\n".join(md_lines)
        except Exception as e:
            logger.error(f"Failed to grade exam: {e}", exc_info=True)
            return f"Error grading exam: {e}"

    def get_generated_files(self) -> str:
        """Get list of successfully processed notes in the Generated archive."""
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        
        generated_dir = Path(self.secrets.inbox_path) / "Generated"
        if not generated_dir.exists() or not generated_dir.is_dir():
            return "No files in the Generated folder."
            
        files = []
        try:
            for f in generated_dir.rglob("*"):
                if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in {'.pdf', '.txt', '.md', '.py', '.js', '.ts'}:
                    size_mb = f.stat().st_size / (1024 * 1024)
                    files.append({
                        "name": f.name,
                        "path": str(f.absolute()),
                        "size": f"{size_mb:.2f} MB",
                        "type": f.suffix.upper()[1:]
                    })
                    if len(files) >= 30:
                        break
        except Exception as e:
            logger.error(f"Error reading generated files: {e}")
            return f"Error reading generated files: {e}"
            
        if not files:
            return "No generated files found."
            
        return self.render_ui("inbox_gallery", {"files": files})


    # ── Pomodoro control tools (SSE action events → frontend store) ────────

    def start_pomodoro(self, duration_minutes: int = 25, hub_id: Optional[str] = None) -> str:
        """Start the Pomodoro focus timer."""
        duration = max(5, min(duration_minutes, 90))
        payload = {"action": "pomodoro_start", "duration_minutes": duration}
        if hub_id:
            payload["hub_id"] = hub_id
        return f"ACTION:{json.dumps(payload)}"

    def pause_pomodoro(self) -> str:
        """Pause/resume the Pomodoro timer."""
        return f"ACTION:{json.dumps({'action': 'pomodoro_pause'})}"

    def stop_pomodoro(self) -> str:
        """Stop and reset the Pomodoro timer."""
        return f"ACTION:{json.dumps({'action': 'pomodoro_stop'})}"

    def set_pomodoro_hub(self, hub_id: str) -> str:
        """Set the study hub for the Pomodoro session."""
        return f"ACTION:{json.dumps({'action': 'pomodoro_set_hub', 'hub_id': hub_id})}"

    async def generate_summary(self, target_id: str, is_hub: bool = False) -> str:
        """Generate a structured dynamic summary card for a study hub or atomic note."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        service = AterService(self.secrets)
        
        # 1. Fetch content
        if is_hub:
            notes = service.list_atomic_notes(target_id)
            if not notes:
                return f"No atomic notes found in hub '{target_id}'."
            note_details = []
            for n in notes[:10]:
                path = n.get("path")
                title = n.get("title", path)
                try:
                    full_p = Path(self.vault_path) / path
                    content = full_p.read_text(encoding="utf-8")[:1000]
                except Exception:
                    content = ""
                note_details.append(f"Note: {title}\nPath: {path}\nSnippet: {content}\n")
            combined_context = "\n".join(note_details)
            summary_title = target_id.replace("_", " ")
        else:
            try:
                full_p = Path(self.vault_path) / target_id
                if not full_p.exists():
                    root = Path(self.vault_path)
                    stem_target = target_id.replace(" ", "_").lower()
                    if not target_id.endswith(".md"):
                        stem_target = stem_target + ".md"
                    for file in root.rglob("*.md"):
                        if file.name.lower() == stem_target or file.stem.lower() == stem_target.replace(".md", ""):
                            full_p = file
                            target_id = file.relative_to(root).as_posix()
                            break
                combined_context = full_p.read_text(encoding="utf-8")[:8000]
                summary_title = full_p.stem.replace("_", " ")
            except Exception as e:
                return f"Error reading note '{target_id}': {e}"

        if is_hub:
            scope_prompt = (
                "This is a STUDY HUB summary. The material contains excerpts/details from all atomic notes under this hub. "
                "Your goal is to synthesize the main ideas, core concepts, and essential takeaways across ALL atomic notes contained in the hub. "
                "Compile everything the student MUST know for their exams, showing how these topics connect, rather than getting bogged down in narrow implementation specifics. "
                "Make sure key_takeaways covers a concise, clear compilation of the main ideas of each atomic note."
            )
        else:
            scope_prompt = (
                "This is an ATOMIC NOTE summary. Your goal is to go into MORE DETAIL about the specific concepts, mechanisms, "
                "equations, or rules covered in this note. Be precise, technical, and concrete. Do not just summarize at a high level; "
                "extract the exact mechanics, key terminology, and subtle edge cases of the specific note's topic."
            )

        sys_prompt = f"""You are an elite educational curator. Generate a highly structured summary of the provided study material.
{scope_prompt}

Your summary must extract the fundamental ideas, key terminology, and target areas for review.

Output ONLY a clean JSON object with the following fields:
{{
  "title": "Clean readable title of the hub/note",
  "is_hub": {str(is_hub).lower()},
  "overview": "A concise 2-3 sentence overview paragraph describing the core subject matter.",
  "key_takeaways": [
    "Core main idea 1...",
    "Core main idea 2...",
    "Core main idea 3..."
  ],
  "key_terms": [
    {{"term": "Term Name", "definition": "Clear concise explanation of this term in context"}}
  ],
  "weak_spots": [
    "Specific tricky detail or concept to watch out for/review"
  ]
}}

Set "is_hub" to {str(is_hub).lower()}.
DO NOT wrap your JSON in markdown code blocks. Return the raw JSON string directly."""

        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            res = await self.llm.ainvoke([
                SystemMessage(content=sys_prompt),
                HumanMessage(content=f"Generate the summary JSON for:\n\n{combined_context}")
            ])
            import json as _json
            raw_content = res.content.strip()
            # Handle potential markdown code block wrapping
            if raw_content.startswith("```"):
                # strip code block lines
                lines = raw_content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                raw_content = "\n".join(lines).strip()
            
            data = _json.loads(raw_content)
            
            # Normalize keys to snake_case as expected by frontend
            normalized = {}
            for k, v in data.items():
                k_lower = k.lower().replace("_", "").replace("-", "")
                if k_lower in ("title",):
                    normalized["title"] = v
                elif k_lower in ("ishub",):
                    normalized["is_hub"] = v
                elif k_lower in ("overview", "summary"):
                    normalized["overview"] = v
                elif k_lower in ("keytakeaways", "takeaways", "takeawayslist", "coretakeaways"):
                    normalized["key_takeaways"] = v
                elif k_lower in ("keyterms", "terms", "glossary", "keytermslist", "keyglossary"):
                    normalized["key_terms"] = v
                elif k_lower in ("weakspots", "weakspot", "weakspotslist", "reviewtargets", "reviewtarget"):
                    normalized["weak_spots"] = v
                else:
                    normalized[k] = v
            
            # Fill missing keys with empty defaults
            if "title" not in normalized:
                normalized["title"] = data.get("title") or summary_title
            if "overview" not in normalized:
                normalized["overview"] = data.get("overview") or ""
            if "key_takeaways" not in normalized:
                normalized["key_takeaways"] = data.get("key_takeaways") or []
            if "key_terms" not in normalized:
                normalized["key_terms"] = data.get("key_terms") or []
            if "weak_spots" not in normalized:
                normalized["weak_spots"] = data.get("weak_spots") or []
                
            # Normalize key_terms list
            terms = []
            raw_terms = normalized.get("key_terms", [])
            if isinstance(raw_terms, list):
                for item in raw_terms:
                    if isinstance(item, dict):
                        term_val = item.get("term") or item.get("word") or item.get("name") or ""
                        def_val = item.get("definition") or item.get("desc") or item.get("description") or ""
                        terms.append({"term": term_val, "definition": def_val})
                    elif isinstance(item, str):
                        if ":" in item:
                            parts = item.split(":", 1)
                            terms.append({"term": parts[0].strip(), "definition": parts[1].strip()})
                        else:
                            terms.append({"term": item, "definition": ""})
            normalized["key_terms"] = terms
            normalized["is_hub"] = is_hub
            
            return self.render_ui("summary_card", normalized)
        except Exception as e:
            return f"Error generating summary: {e}"

    def show_practice_config(
        self,
        hub_id: str,
        question_distribution: Dict[str, int],
        difficulty: str = "Mixed",
        grading_strictness: str = "Lenient",
        distractor_plausibility: str = "High",
        inject_trick_answers: bool = False,
        prioritize_weaknesses: bool = False,
        global_time_limit_minutes: Optional[int] = None
    ) -> str:
        """Show the practice session configuration card in chat for user to confirm and launch."""
        data = {
            "hubId": hub_id,
            "difficulty": difficulty,
            "gradingStrictness": grading_strictness,
            "distractorPlausibility": distractor_plausibility,
            "injectTrickAnswers": inject_trick_answers,
            "prioritizeWeaknesses": prioritize_weaknesses,
            "globalTimeLimitMinutes": global_time_limit_minutes,
            "questionDistribution": question_distribution
        }
        return self.render_ui("practice_config_card", data)


    # ── Navigation tools ───────────────────────────────────────────────────

    def navigate_to_route(self, route: str) -> str:
        # Normalize aliases to real frontend routes
        alias_map = {
            "/oracle": "/agents?tab=ater",
            "/pipeline": "/agents?tab=pipeline",
            "/chat": "/agents?tab=ater",
        }
        # Apply alias if the full route matches a known alias
        route_normalized = alias_map.get(route.split("?")[0], route)
        # If the alias already has a query string but original had none, use the full alias
        if route.split("?")[0] in alias_map and "?" not in route:
            route_normalized = alias_map[route.split("?")[0]]

        valid_bases = {"/agents", "/obsidian", "/academic", "/practice", "/settings"}
        base = route_normalized.split("?")[0]
        if base not in valid_bases:
            return (
                f"'{base}' is not a valid route. "
                f"Valid routes: /agents?tab=ater (Oracle), /agents?tab=pipeline (Pipeline), "
                f"/obsidian, /academic?tab=COURSES|EXAMS|ASSIGNMENTS|PLANNER|PROGRAM|CALENDAR, "
                f"/practice, /settings."
            )
        return f"ACTION:{json.dumps({'action': 'navigate', 'route': route_normalized})}"

    def navigate_to_note(self, note_path: str) -> str:
        if self.vault_path:
            root = Path(self.vault_path)
            target = note_path.strip().replace("\\", "/").lstrip("/")
            
            if (root / target).exists() and (root / target).is_file():
                resolved = target
            else:
                stem_target = target.replace(".md", "").replace(" ", "_").replace("%20", "_").lower()
                resolved = None
                for file in root.rglob("*.md"):
                    file_stem = file.stem.replace(" ", "_").lower()
                    if file_stem == stem_target:
                        resolved = file.relative_to(root).as_posix()
                        break
                        
                if not resolved:
                    for file in root.rglob("*.md"):
                        if file.name.lower() == target.lower() or (file.stem + ".md").lower() == target.lower():
                            resolved = file.relative_to(root).as_posix()
                            break
            if resolved:
                note_path = resolved

        # Redirect academic dashboard entities and practice to their dashboard routes with specific IDs
        normalized_path = note_path.lower()
        item_id = Path(note_path).stem
        if "database/courses/" in normalized_path:
            return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab=COURSES&id={item_id}'})}"
        elif "database/semesters/" in normalized_path or "database/years/" in normalized_path:
            return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab=PROGRAM&id={item_id}'})}"
        elif "database/exams/" in normalized_path:
            return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab=EXAMS&id={item_id}'})}"
        elif "database/assignments/" in normalized_path:
            return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab=ASSIGNMENTS&id={item_id}'})}"
        elif "practice" in normalized_path:
            return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab=PRACTICE&id={item_id}'})}"

        from urllib.parse import quote
        encoded = quote(note_path)
        return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/obsidian?path={encoded}'})}"

    def switch_academic_tab(self, tab: str) -> str:
        # The academic route uses uppercase tab params: ?tab=COURSES
        tab_map = {
            "courses": "COURSES",
            "semesters": "PROGRAM",  # semesters are under Program
            "exams": "EXAMS",
            "assignments": "ASSIGNMENTS",
            "planner": "PLANNER",
            "program": "PROGRAM",
            "practice": "PRACTICE",
            "calendar": "CALENDAR",
        }
        tab_lower = tab.lower()
        tab_value = tab_map.get(tab_lower, tab.upper())
        return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab={tab_value}'})}"

    def trigger_notification(self, variant: str, message: str) -> str:
        valid = {"success", "error", "info", "warning"}
        if variant not in valid:
            variant = "info"
        return f"ACTION:{json.dumps({'action': 'toast', 'variant': variant, 'message': message})}"

    # ── Dynamic UI rendering tool ──────────────────────────────────────────

    def render_ui(self, ui_type: str, data: Any, caption: Optional[str] = None) -> str:
        """
        Wraps structured data in an ater-ui code block.
        The frontend CodeRenderer intercepts this and renders rich card/list components.
        """
        payload = {"ui_type": ui_type, "data": data}
        if caption:
            payload["caption"] = caption
        block = f"```ater-ui\n{json.dumps(payload, indent=2)}\n```"
        return block

    # ── Agent Pipeline / Ingestion tools ───────────────────────────────────

    def get_inbox_files(self) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        inbox = Path(self.secrets.inbox_path)
        if not inbox.exists() or not inbox.is_dir():
            return f"Inbox directory not found at {inbox}."
        
        files = []
        try:
            # Look for files directly in inbox and in subfolders
            # Avoid the 'Generated' folder if it exists
            generated_dir = inbox / "Generated"
            
            for f in inbox.rglob("*"):
                if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in {'.pdf', '.txt', '.md', '.py', '.js'}:
                    # Skip files inside the 'Generated' directory
                    if generated_dir.exists() and (generated_dir in f.parents or str(f.absolute()).startswith(str(generated_dir.absolute()))):
                        continue
                        
                    size_mb = f.stat().st_size / (1024 * 1024)
                    files.append({
                        "name": f.name,
                        "path": str(f.absolute()),
                        "size": f"{size_mb:.1f} MB",
                        "type": f.suffix.upper()[1:]
                    })
                    
                    if len(files) >= 20: # Limit to 20 files for UI performance
                        break
        except Exception as e:
            logger.error(f"[Assistant] Error reading inbox: {e}")
            return f"Error reading inbox: {e}"
            
        if not files:
            return "Your inbox is currently empty."
        
        return self.render_ui("inbox_gallery", {"files": files})

    def get_queue_status(self) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "Queue database not found. Ingestion may not have run yet."
        try:
            import sys
            main_module = sys.modules.get("src.api.main")
            watcher = getattr(main_module, "ater_watcher", None) if main_module else None
            
            if watcher:
                status_dict = watcher.get_status()
            else:
                conn = sqlite3.connect(str(db_path))
                conn.row_factory = sqlite3.Row
                # Correct table is 'queue' per watcher.py line 129
                rows = conn.execute("SELECT status, count(*) as c FROM queue GROUP BY status").fetchall()
                status_counts = {r['status']: r['c'] for r in rows}
                pending_count = status_counts.get("pending", 0)
                conn.close()
                status_dict = {
                    "status": "idle",
                    "auto_process": self.secrets.auto_deploy,
                    "active_files": [],
                    "current_file": None,
                    "current_batch": 0,
                    "total_batches": 0,
                    "last_action": "Offline",
                    "queue_size": pending_count,
                    "governor_pressure": 0,
                }
            return self.render_ui("queue_status", status_dict, caption="Background Ingestion Pipeline")
        except Exception as e:
            logger.error(f"[Assistant] Error reading queue status: {e}", exc_info=True)
            return f"Error reading queue: {e}"

    def toggle_auto_deploy(self, state: bool) -> str:
        """
        Emits an SSE action that the frontend handles to toggle auto-deploy in Tauri config
        and hit the backend watcher toggle endpoint.
        """
        return f"ACTION:{json.dumps({'action': 'toggle_auto_deploy', 'state': state})}"

    async def start_generation(self, file_path: str, target_hub_id: Optional[str] = None) -> str:
        """Phase 1-3 trigger: Detect -> Plan -> Confirm automatically."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        
        service = AterService(self.secrets)
        si_path = str(AterService.resolve_si_path())
        
        try:
            # Phase 1: Detection
            detection = await service.detect_curriculum(file_path)
            curriculum = detection.get("detected_curriculum", {})
            
            # Phase 2: Planning
            plan_res = await service.generate_plan(file_path, si_path, curriculum, target_hub_id)
            session_id = plan_res.get("session_id")
            plan = plan_res.get("plan_structured", {})
            
            if not session_id:
                return "Failed to initialize generation session."
            
            # Return interactive stepper instead of just confirming
            return self.render_ui("generation_stepper", {
                "session_id": session_id,
                "file_path": file_path,
                "curriculum": curriculum,
                "plan": plan,
                "current_step": 2
            }, caption="Note Generation Pipeline")

        except Exception as e:
            logger.error(f"[Ater Assistant] Generation trigger failed: {e}")
            return f"Failed to start generation: {e}"

    def get_focus_hud(self) -> str:
        """Renders the interactive Pomodoro Focus HUD."""
        return self.render_ui("focus_hud", {})

    def get_academic_calendar(self) -> str:
        """Fetches upcoming exams and assignments for the calendar bar."""
        if not self.vault_path: return "Error: Vault path not configured."

        def _read_folder(folder_name: str) -> list:
            db_dir = Path(self.vault_path) / "database" / folder_name
            records = []
            if not db_dir.exists():
                return records
            for file in sorted(db_dir.glob("*.md")):
                try:
                    post = frontmatter.loads(file.read_text(encoding="utf-8"))
                    meta = dict(post.metadata)
                    meta["_title"] = file.stem
                    meta["id"] = file.stem
                    records.append(meta)
                except Exception:
                    records.append({"_title": file.stem, "id": file.stem})
            return records

        exams_raw = _read_folder("exams")
        assignments_raw = _read_folder("assignments")

        events = []
        for e in exams_raw[:5]:
            title = e.get("_title", "Exam").replace("_", " ")
            date = self._clean_prop(e.get("Date") or e.get("date")) or "TBD"
            events.append({"type": "Exam", "title": title, "date": date, "priority": "High"})
        for a in assignments_raw[:5]:
            title = a.get("_title", "Assignment").replace("_", " ")
            date = self._clean_prop(a.get("Due Date") or a.get("due_date")) or "TBD"
            events.append({"type": "Assignment", "title": title, "date": date, "priority": "Normal"})

        events.sort(key=lambda x: x["date"])
        if not events:
            return "You don't have any upcoming exams or assignments yet. Add some via the Academic Dashboard."
        return self.render_ui("calendar_bar", {"events": events})

    # ── Tool registry ──────────────────────────────────────────────────────

    def get_tools(self) -> List[StructuredTool]:
        return [
            # Web Search
            StructuredTool.from_function(name="search_web", func=self.search_web,
                description="Search the web (internet) using DuckDuckGo for general knowledge, recent facts, or queries outside the local vault.",
                args_schema=SearchWebInput),
            # Vault
            StructuredTool.from_function(name="search_notes_fulltext", func=self.search_notes_fulltext,
                description="Search vault notes for keywords. Returns matching files. Always call render_ui after with the results.",
                args_schema=SearchNotesInput),
            StructuredTool.from_function(name="search_notes_by_tag", func=self.search_notes_by_tag,
                description="Find all notes with a specific Obsidian tag.",
                args_schema=SearchVaultByTagInput),
            StructuredTool.from_function(name="read_note", func=self.read_note,
                description="Read the full markdown content of a note by path or title.",
                args_schema=ReadNoteInput),
            StructuredTool.from_function(name="write_note", func=self.write_note,
                description="Create or overwrite a markdown note in the vault.",
                args_schema=WriteNoteInput),
            StructuredTool.from_function(name="rename_note", func=self.rename_note,
                description="Rename or move a note in the vault.",
                args_schema=RenameNoteInput),
            StructuredTool.from_function(name="delete_note", func=self.delete_note,
                description="Delete a markdown note from the vault.",
                args_schema=DeleteNoteInput),
            StructuredTool.from_function(name="get_vault_stats", func=self.get_vault_stats,
                description="Get vault statistics. Pass category (e.g. 'atomic_notes') to get a plain text count instead of rendering the stats dashboard UI.",
                args_schema=GetVaultStatsInput),
            StructuredTool.from_function(name="get_hubs", func=self.list_hubs,
                description="List all study hubs in the vault with their note counts. Returns rendered UI cards automatically.",
                args_schema=ListHubsInput),
            StructuredTool.from_function(name="get_hub_notes", func=self.get_hub_notes,
                description="List all atomic notes within a specific study hub. Returns rendered note cards UI automatically.",
                args_schema=GetHubNotesInput),
            # Pipeline
            StructuredTool.from_function(name="get_inbox_files", func=self.get_inbox_files,
                description="Get a list of PDF/Text files currently waiting in the inbox.",
                args_schema=GetInboxFilesInput),
            StructuredTool.from_function(name="get_queue_status", func=self.get_queue_status,
                description="Check the background ingestion queue status and AI pressure.",
                args_schema=GetQueueStatusInput),
            StructuredTool.from_function(name="toggle_auto_deploy", func=self.toggle_auto_deploy,
                description="Enable or disable the background auto-deploy pipeline. Emits an action to the frontend.",
                args_schema=ToggleAutoDeployInput),
            StructuredTool.from_function(name="start_generation", coroutine=self.start_generation,
                description="Start the full Ater note generation pipeline for an inbox file. This detects curriculum, builds a study plan, and deploys agents to generate atomic notes.",
                args_schema=StartGenerationInput),
            # Academic DB
            StructuredTool.from_function(name="query_academic_database", func=self.query_academic_database,
                description="List all records of a given type (courses, semesters, exams, assignments, planner, years). Returns rendered UI cards automatically.",
                args_schema=QueryAcademicDatabaseInput),
            StructuredTool.from_function(name="create_academic_record", func=self.create_academic_record,
                description="Create a new course, semester, exam, assignment, or study planner entry.",
                args_schema=CreateAcademicRecordInput),
            StructuredTool.from_function(name="update_academic_record", func=self.update_academic_record,
                description="Update metadata fields on an existing academic record.",
                args_schema=UpdateAcademicRecordInput),
            StructuredTool.from_function(name="delete_academic_record", func=self.delete_academic_record,
                description="Delete an academic record from the database.",
                args_schema=DeleteAcademicRecordInput),
            # Practice / FSRS
            StructuredTool.from_function(name="generate_quiz", coroutine=self.generate_quiz,
                description="Generate an interactive MCQ quiz for a study hub.",
                args_schema=GenerateQuizInput),
            StructuredTool.from_function(name="get_srs_cards", func=self.get_srs_cards,
                description="Get FSRS cards due for review. Returns rendered UI cards automatically.",
                args_schema=GetSrsCardsInput),
            StructuredTool.from_function(name="override_srs_stability", func=self.override_srs_stability,
                description="Override FSRS memory stability for a note to postpone or accelerate its review.",
                args_schema=OverrideSrsStabilityInput),
            StructuredTool.from_function(name="get_study_history", func=self.get_study_history,
                description="Get recent study sessions and practice log entries.",
                args_schema=GetStudyHistoryInput),
            # Pomodoro
            StructuredTool.from_function(name="start_pomodoro", func=self.start_pomodoro,
                description="Start the Pomodoro focus timer. Optionally set duration and hub.",
                args_schema=PomodoroStartInput),
            StructuredTool.from_function(name="pause_pomodoro", func=self.pause_pomodoro,
                description="Pause or resume the Pomodoro timer.",
                args_schema=PausePomodoroInput),
            StructuredTool.from_function(name="stop_pomodoro", func=self.stop_pomodoro,
                description="Stop and reset the Pomodoro timer.",
                args_schema=StopPomodoroInput),
            StructuredTool.from_function(name="set_pomodoro_hub", func=self.set_pomodoro_hub,
                description="Set the study hub for the current Pomodoro session.",
                args_schema=PomodoroSetHubInput),
            StructuredTool.from_function(name="get_focus_hud", func=self.get_focus_hud,
                description="Show the interactive Pomodoro Focus HUD for timer control.",
                args_schema=GetFocusHudInput),
            StructuredTool.from_function(name="get_academic_calendar", func=self.get_academic_calendar,
                description="Show the academic calendar bar with upcoming exams and assignments.",
                args_schema=GetAcademicCalendarInput),
            # Navigation
            StructuredTool.from_function(name="navigate_to_route", func=self.navigate_to_route,
                description=(
                    "Navigate the app to a specific page. Use EXACT routes: "
                    "'/agents?tab=ater' (Oracle AI chat), '/agents?tab=pipeline' (ingestion pipeline), "
                    "'/obsidian' (vault viewer), '/settings'. "
                    "To open a specific dashboard tab, use '/academic?tab=COURSES|EXAMS|ASSIGNMENTS|PLANNER|PROGRAM|CALENDAR|PRACTICE'. "
                    "To open a specific entity (course, exam, assignment, planner hub, program year/semester, or practice setup for a hub) in the dashboard, append '&id=<entity_id>'. "
                    "E.g. '/academic?tab=COURSES&id=OOP With Java' or '/academic?tab=PRACTICE&id=cs_201_hub'. "
                    "NEVER use '/oracle' — it does not exist."
                ),
                args_schema=NavigateToRouteInput),
            StructuredTool.from_function(name="navigate_to_note", func=self.navigate_to_note,
                description="Open a specific note in the vault viewer.",
                args_schema=NavigateToNoteInput),
            StructuredTool.from_function(name="switch_academic_tab", func=self.switch_academic_tab,
                description="Switch the Academic Dashboard to a specific tab: courses, semesters, exams, assignments, planner, program.",
                args_schema=SwitchAcademicTabInput),
            StructuredTool.from_function(name="trigger_notification", func=self.trigger_notification,
                description="Show a toast notification (success, error, info, warning).",
                args_schema=TriggerNotificationInput),
            # Settings Management
            StructuredTool.from_function(name="get_app_config", func=self.get_app_config,
                description="Fetch all current application and configuration settings.",
                args_schema=GetAppConfigInput),
            StructuredTool.from_function(name="update_app_config", func=self.update_app_config,
                description="Update one or more application configurations or system settings.",
                args_schema=UpdateAppConfigInput),
            StructuredTool.from_function(name="factory_reset", func=self.factory_reset,
                description="Perform a system factory reset, clearing all settings, configurations, and keys.",
                args_schema=FactoryResetInput),
            StructuredTool.from_function(name="clear_study_history", func=self.clear_study_history,
                description="Delete all study history (telemetry, practice log, study sessions) from the database.",
                args_schema=ClearStudyHistoryInput),
            # Practice presets / Feynman
            StructuredTool.from_function(name="generate_custom_practice", coroutine=self.generate_custom_practice,
                description="Generate a custom practice quiz session with specific preset question type distributions.",
                args_schema=GenerateCustomPracticeInput),
            StructuredTool.from_function(name="create_exam", coroutine=self.create_exam,
                description="Assembles a comprehensive secure exam across multiple study hubs using ExamEngine.",
                args_schema=CreateExamInput),
            StructuredTool.from_function(name="grade_exam", func=self.grade_exam,
                description="Grades/evaluates a completed secure exam session using ExamEngine and produces a report.",
                args_schema=GradeExamInput),
            StructuredTool.from_function(name="validate_feynman_explanation", coroutine=self.validate_feynman_explanation,
                description="Validate a user's Feynman explanation for a note using AI.",
                args_schema=ValidateFeynmanExplanationInput),
            StructuredTool.from_function(name="get_generated_files", func=self.get_generated_files,
                description="List all processed notes in the Generated folder.",
                args_schema=GetGeneratedFilesInput),
            StructuredTool.from_function(name="generate_summary", coroutine=self.generate_summary,
                description="Generate a dynamically formatted summary card of a study hub or atomic note.",
                args_schema=GenerateSummaryInput),
            StructuredTool.from_function(name="show_practice_config", func=self.show_practice_config,
                description="Show the practice session configuration card in the chat UI for the user to confirm/start.",
                args_schema=ShowPracticeConfigInput),
            # NotebookLM
            StructuredTool.from_function(name="notebooklm_query", coroutine=self.notebooklm_query,
                description="Query a Google NotebookLM notebook by its UUID using its sources.",
                args_schema=NotebookLMQueryInput),
            StructuredTool.from_function(name="notebooklm_research", coroutine=self.notebooklm_research,
                description="Search the web or Drive for a query, create/retrieve a notebook, and import discovered sources.",
                args_schema=NotebookLMResearchInput),
            StructuredTool.from_function(name="notebooklm_studio_create", coroutine=self.notebooklm_studio_create,
                description="Generate a study aid artifact (audio, report, quiz, flashcards, mind map, slides, infographic) from a notebook.",
                args_schema=NotebookLMStudioCreateInput),
            # Dynamic UI
            StructuredTool.from_function(name="render_ui", func=self.render_ui,
                description=(
                    "ALWAYS use this after fetching data to display it as rich UI cards instead of plain text. "
                    "For courses → ui_type='course_cards'. For notes → 'note_cards'. For hubs → 'hub_cards'. "
                    "For exams → 'exam_list'. For assignments → 'assignment_list'. For SRS → 'srs_deck'. "
                    "For stats → 'stats'. For semesters → 'semester_list'. "
                    "For interactive widgets/sandboxes/graphs/tables → 'interactive_sandbox'."
                ),
                args_schema=RenderUIInput),
        ]

    async def execute_tool(self, name: str, args: dict) -> str:
        try:
            dispatch = {
                "search_web": lambda: self.search_web(**args),
                "search_notes_fulltext": lambda: self.search_notes_fulltext(**args),
                "search_notes_by_tag": lambda: self.search_notes_by_tag(**args),
                "read_note": lambda: self.read_note(**args),
                "write_note": lambda: self.write_note(**args),
                "rename_note": lambda: self.rename_note(**args),
                "delete_note": lambda: self.delete_note(**args),
                "get_vault_stats": lambda: self.get_vault_stats(),
                "get_hubs": lambda: self.list_hubs(),
                "list_hubs": lambda: self.list_hubs(),
                "get_hub_notes": lambda: self.get_hub_notes(**args),
                "get_inbox_files": lambda: self.get_inbox_files(),
                "get_queue_status": lambda: self.get_queue_status(),
                "toggle_auto_deploy": lambda: self.toggle_auto_deploy(**args),
                "start_generation": lambda: self.start_generation(**args),
                "query_academic_database": lambda: self.query_academic_database(**args),
                "create_academic_record": lambda: self.create_academic_record(**args),
                "update_academic_record": lambda: self.update_academic_record(**args),
                "delete_academic_record": lambda: self.delete_academic_record(**args),
                "generate_quiz": lambda: self.generate_quiz(**args),
                "get_srs_cards": lambda: self.get_srs_cards(**args),
                "override_srs_stability": lambda: self.override_srs_stability(**args),
                "get_study_history": lambda: self.get_study_history(**args),
                "start_pomodoro": lambda: self.start_pomodoro(**args),
                "pause_pomodoro": lambda: self.pause_pomodoro(),
                "stop_pomodoro": lambda: self.stop_pomodoro(),
                "set_pomodoro_hub": lambda: self.set_pomodoro_hub(**args),
                "get_focus_hud": lambda: self.get_focus_hud(),
                "get_academic_calendar": lambda: self.get_academic_calendar(),
                "navigate_to_route": lambda: self.navigate_to_route(**args),
                "navigate_to_note": lambda: self.navigate_to_note(**args),
                "switch_academic_tab": lambda: self.switch_academic_tab(**args),
                "trigger_notification": lambda: self.trigger_notification(**args),
                "render_ui": lambda: self.render_ui(**args),
                "get_app_config": lambda: self.get_app_config(),
                "update_app_config": lambda: self.update_app_config(**args),
                "factory_reset": lambda: self.factory_reset(),
                "clear_study_history": lambda: self.clear_study_history(),
                "generate_custom_practice": lambda: self.generate_custom_practice(**args),
                "create_exam": lambda: self.create_exam(**args),
                "grade_exam": lambda: self.grade_exam(**args),
                "validate_feynman_explanation": lambda: self.validate_feynman_explanation(**args),
                "get_generated_files": lambda: self.get_generated_files(),
                "generate_summary": lambda: self.generate_summary(**args),
                "show_practice_config": lambda: self.show_practice_config(**args),
                "notebooklm_query": lambda: self.notebooklm_query(**args),
                "notebooklm_research": lambda: self.notebooklm_research(**args),
                "notebooklm_studio_create": lambda: self.notebooklm_studio_create(**args),
            }
            fn = dispatch.get(name)
            if fn is None:
                return f"Unknown tool '{name}'."
            result = fn()
            if asyncio.iscoroutine(result):
                return await result
            return result
        except Exception as e:
            logger.error(f"[Tool Error] {name}({args}): {e}", exc_info=True)
            return f"Error executing '{name}': {e}"


# ─────────────────────────────────────────────────────────────────────────────
# Status messages
# ─────────────────────────────────────────────────────────────────────────────

def get_tool_status_message(name: str, args: dict) -> str:
    msgs = {
        "search_web": lambda: f"Searching the web for '{args.get('query', '')}'...",
        "search_notes_fulltext": lambda: f"Searching vault for '{args.get('query', '')}'...",
        "search_notes_by_tag": lambda: f"Finding notes tagged #{args.get('tag', '')}...",
        "read_note": lambda: f"Reading '{args.get('path', '')}'...",
        "write_note": lambda: f"Writing '{args.get('path', '')}'...",
        "rename_note": lambda: f"Renaming '{args.get('old_path', '')}'...",
        "delete_note": lambda: f"Deleting '{args.get('path', '')}'...",
        "get_vault_stats": lambda: "Getting vault stats...",
        "get_hubs": lambda: "Listing study hubs...",
        "list_hubs": lambda: "Listing study hubs...",
        "get_hub_notes": lambda: f"Listing atomic notes for '{args.get('hub_id', '')}'...",
        "get_inbox_files": lambda: "Checking inbox...",
        "get_queue_status": lambda: "Checking background pipeline...",
        "toggle_auto_deploy": lambda: f"{'Enabling' if args.get('state') else 'Disabling'} auto-deploy...",
        "start_generation": lambda: f"Triggering agent pipeline for '{Path(args.get('file_path', '')).name}'...",
        "query_academic_database": lambda: f"Fetching {args.get('record_type', '')}...",
        "create_academic_record": lambda: f"Creating {args.get('record_type', '')} '{args.get('title', '')}'...",
        "update_academic_record": lambda: f"Updating {args.get('record_type', '')} '{args.get('id', '')}'...",
        "delete_academic_record": lambda: f"Deleting {args.get('record_type', '')} '{args.get('id', '')}'...",
        "generate_quiz": lambda: f"Generating quiz for '{args.get('hub_id', '')}'...",
        "get_srs_cards": lambda: "Loading review cards...",
        "override_srs_stability": lambda: f"Updating SRS for '{args.get('note_path', '')}'...",
        "get_study_history": lambda: "Fetching study history...",
        "start_pomodoro": lambda: f"Starting {args.get('duration_minutes', 25)}min focus timer...",
        "pause_pomodoro": lambda: "Pausing timer...",
        "stop_pomodoro": lambda: "Stopping timer...",
        "set_pomodoro_hub": lambda: f"Setting focus hub to '{args.get('hub_id', '')}'...",
        "get_focus_hud": lambda: "Opening Focus HUD...",
        "get_academic_calendar": lambda: "Opening academic calendar...",
        "navigate_to_route": lambda: f"Navigating to {args.get('route', '')}...",
        "navigate_to_note": lambda: f"Opening '{args.get('note_path', '')}'...",
        "switch_academic_tab": lambda: f"Switching to {args.get('tab', '')} tab...",
        "trigger_notification": lambda: "Sending notification...",
        "render_ui": lambda: "Rendering...",
        "get_app_config": lambda: "Fetching settings...",
        "update_app_config": lambda: "Updating settings...",
        "factory_reset": lambda: "Performing factory reset...",
        "clear_study_history": lambda: "Clearing study history...",
        "generate_custom_practice": lambda: f"Generating custom quiz preset for '{args.get('hub_id', '')}'...",
        "create_exam": lambda: f"Creating secure exam for hubs {', '.join(args.get('hub_ids', []))}...",
        "grade_exam": lambda: f"Grading exam '{args.get('exam_id', '')}'...",
        "validate_feynman_explanation": lambda: f"Analyzing Feynman explanation for '{Path(args.get('note_path', '')).stem.replace('_', ' ')}'...",
        "get_generated_files": lambda: "Listing generated notes...",
        "generate_summary": lambda: f"Generating summary for '{args.get('target_id', '')}'...",
        "show_practice_config": lambda: f"Preparing practice config for '{args.get('hub_id', '')}'...",
    }
    fn = msgs.get(name)
    return fn() if fn else f"Running {name}..."


# ─────────────────────────────────────────────────────────────────────────────
# Helper: build context hint for LLM after rich-UI tool renders
# ─────────────────────────────────────────────────────────────────────────────

def _build_tool_context_hint(tool_name: str, tool_result_str: str, tool_args: dict) -> str:
    """
    Produce a concise factual context string for the LLM after a rich-UI tool renders.
    The LLM must know EXACTLY what was found so it cannot contradict the rendered UI.
    Returns something like: '[Tool result: Found 3 course(s). UI rendered. Do NOT describe the items in text.]'
    """
    import re as _re

    # Count items in the ater-ui JSON payload
    count: Optional[int] = None
    try:
        # Extract the ater-ui JSON block
        m = _re.search(r'```ater-ui\s*(\{.*?\}|\[.*?\])\s*```', tool_result_str, _re.DOTALL)
        if m:
            payload = json.loads(m.group(1))
            # Payload is either a list or {"ui_type":..., "data":..., ...}
            if isinstance(payload, list):
                count = len(payload)
            elif isinstance(payload, dict):
                data = payload.get("data", payload)
                if isinstance(data, list):
                    count = len(data)
                elif isinstance(data, dict):
                    for key in ("records", "results", "files", "events", "sessions", "cards", "hubs", "results"):
                        if isinstance(data.get(key), list):
                            count = len(data[key])
                            break
    except Exception:
        pass

    # Build label from tool name
    label_map = {
        "query_academic_database": tool_args.get("record_type", "records"),
        "list_hubs": "study hubs",
        "get_hubs": "study hubs",
        "get_hub_notes": "atomic notes",
        "search_notes_fulltext": "search results",
        "get_srs_cards": "SRS cards due",
        "get_study_history": "study sessions",
        "get_vault_stats": "vault statistics",
        "get_inbox_files": "inbox files",
        "get_generated_files": "generated files",
        "get_queue_status": "queue status",
        "get_app_config": "config settings",
        "get_focus_hud": "focus HUD",
        "get_academic_calendar": "calendar events",
        "generate_quiz": "quiz questions",
        "generate_custom_practice": "practice questions",
        "generate_summary": "summary",
        "show_practice_config": "practice config",
        "create_exam": "exam",
        "start_generation": "generation pipeline",
        "render_ui": "UI block",
    }
    label = label_map.get(tool_name, "items")

    count_str = f"Found {count} {label}." if count is not None else f"Returned {label}."
    return (
        f"[Tool executed successfully. {count_str} "
        f"The UI block has been rendered for the user. "
        f"Do NOT describe, list, or summarize the data in plain text. "
        f"Do NOT say 'no data found' or any empty-state message. "
        f"End your turn or ask a single helpful follow-up question.]"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Lesson request detection & conversion helpers
# ─────────────────────────────────────────────────────────────────────────────

_LESSON_TRIGGER_PATTERNS = re.compile(
    r"(teach\s+me|explain\s+how\s+to|how\s+do\s+i|walk\s+me\s+through|show\s+me\s+how\s+to|learn\s+how\s+to|guide\s+me|step.by.step)",
    re.IGNORECASE,
)


def _is_lesson_request(messages_history: List[Dict[str, Any]]) -> tuple[bool, str]:
    """Return (is_lesson, topic) based on whether any user message in history is a lesson request."""
    for msg in messages_history:
        if msg.get("role") == "user":
            text = msg.get("content", "")
            if text.strip().lower() in ["confirm", "proceed", "yes", "y", "ok", "start", "proceed with lesson", "start lesson"]:
                continue
            if _LESSON_TRIGGER_PATTERNS.search(text):
                return True, text.strip()
    return False, ""


def _xml_escape(value: Any) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _clean_lesson_title(value: str, fallback: str) -> str:
    title = (value or fallback or "Interactive Lesson").strip()
    title = re.sub(r"^LESSON\s*:\s*", "", title, flags=re.IGNORECASE).strip()
    title = re.sub(r"\s+", " ", title)
    if title.isupper():
        title = title.title()
        title = title.replace("'S", "'s")
    return title


def _chapter_sandbox_spec(topic: str, lesson_title: str, chapter_title: str) -> str:
    combined = f"{topic} {lesson_title} {chapter_title}".lower()
    if "rubik" in combined or "rubics" in combined:
        step_match = re.search(r"step\s*(\d+)", chapter_title, re.IGNORECASE)
        step_num = step_match.group(1) if step_match else "1"
        return (
            f"interactive Rubik's Cube flat net simulator focusing specifically on Step {step_num} ({chapter_title}). "
            "Show the 2D face net of U, L, F, R, B, D faces. Provide move buttons, reset, and highlight the stickers to change. "
            "Ensure the design has a dark theme background that blends with the app."
        )
    return (
        f"interactive visual simulator demonstrating {chapter_title} for {lesson_title or topic}. "
        "The interface must be fully interactive, elegant, and modern with clean animations. "
        "Support both light and dark themes using CSS variables or Tailwind dark: utilities. "
        "Render the visualization immediately on load without any mock 'Launch simulator' or 'Start' screen."
    )


def _is_rubiks_lesson_topic(value: str) -> bool:
    normalized = str(value or "").lower()
    return "rubik" in normalized or "rubics" in normalized


def _rubiks_beginner_payload() -> Dict[str, Any]:
    return {
        "title": "Rubik's Cube Beginner Method",
        "chapters": [
            {
                "title": "Step 1: Notation, Pieces, And Orientation",
                "content": (
                    "Hold one color as your bottom reference for the whole solve. In this lesson use white on bottom and yellow on top. "
                    "Centers define each face color and never change relative to each other. Edges have two stickers, corners have three. "
                    "Move notation names the face you turn: U, D, R, L, F, B. A prime mark means counter-clockwise, and 2 means a half turn."
                ),
            },
            {
                "title": "Step 2: Make The White Daisy",
                "content": (
                    "Find the four white edge pieces and place them around the yellow center, making a daisy. Do not worry about the side colors yet. "
                    "Use simple face turns to lift each white edge to the top. If a white edge is stuck in the middle or bottom, turn its face until it can move upward."
                ),
            },
            {
                "title": "Step 3: Turn The Daisy Into The White Cross",
                "content": (
                    "For each white petal on top, rotate U until the edge's side color matches the center on the side face. Then turn that face 180 degrees to send the white edge to the bottom. "
                    "Repeat four times. You should now have a white cross on the bottom, and each cross edge should match its side center."
                ),
            },
            {
                "title": "Step 4: Solve The White Corners",
                "content": (
                    "Find a white corner in the top layer. Place it above the slot between its two side-center colors. Use the Right trigger R U R' U' until the corner drops into the bottom layer correctly. "
                    "If the corner starts in the bottom but is twisted or in the wrong slot, use R U R' U' once to lift it out, then place it again."
                ),
            },
            {
                "title": "Step 5: Solve The Middle Layer Edges",
                "content": (
                    "Look for a top-layer edge with no yellow sticker. Match its front color to the front center. If the edge must go right, use U R U' R' U' F' U F. "
                    "If it must go left, use U' L' U L U F U' F'. Repeat until the first two layers are solved."
                ),
            },
            {
                "title": "Step 6: Make The Yellow Cross",
                "content": (
                    "Ignore yellow corners for now. Look only at yellow edges on top. Use F R U R' U' F' to move from dot to angle, angle to line, and line to yellow cross. "
                    "For the angle, hold it in the back-left. For the line, hold it horizontal."
                ),
            },
            {
                "title": "Step 7: Position The Yellow Edges",
                "content": (
                    "Turn U until at least one yellow-cross edge matches its side center. Use R U R' U R U2 R' to cycle the yellow edges until all four side colors line up. "
                    "Keep checking the centers, not the corner stickers."
                ),
            },
            {
                "title": "Step 8: Position The Yellow Corners",
                "content": (
                    "Find a yellow corner that is already in the correct location, even if twisted. Hold it at front-right. Use U R U' L' U R' U' L to cycle the other corners. "
                    "Repeat until every top corner belongs in its slot."
                ),
            },
            {
                "title": "Step 9: Orient The Yellow Corners",
                "content": (
                    "Hold an unsolved yellow corner at front-right. Repeat R U R' U' until yellow faces up on that corner. Then turn only U to bring the next unsolved corner to front-right. "
                    "Keep the cube orientation fixed. The cube may look scrambled during this step, but it resolves after the last corner."
                ),
            },
        ],
    }


def _lesson_payload_to_artifact(payload: Dict[str, Any], topic: str) -> str:
    title = _clean_lesson_title(str(payload.get("title") or ""), topic)
    chapters = payload.get("chapters")
    if not isinstance(chapters, list) or not chapters:
        return ""

    chapter_blocks = []
    for index, chapter in enumerate(chapters, start=1):
        if not isinstance(chapter, dict):
            continue
        chapter_title = str(chapter.get("title") or f"Chapter {index}").strip()
        content = str(chapter.get("content") or "").strip()
        
        # Build chapter-specific sandbox spec
        ch_spec = _chapter_sandbox_spec(topic, title, chapter_title)
        
        chapter_blocks.append(
            f'  <chapter title="{_xml_escape(chapter_title)}">\n'
            f"{_xml_escape(content)}\n"
            f"    <sandbox-spec>{_xml_escape(ch_spec)}</sandbox-spec>\n"
            "  </chapter>"
        )

    if not chapter_blocks:
        return ""

    return (
        f'<artifact title="{_xml_escape(title)}">\n'
        + "\n".join(chapter_blocks)
        + "\n</artifact>"
    )


def _convert_to_lesson_json(text: str, topic: str) -> str:
    """
    Convert any LLM response (structured JSON block OR plain markdown chapters)
    into the interactive artifact XML protocol.

    Priority:
      1. If the text already has artifact XML → pass through unchanged.
      2. If the text has a valid ```interactive-lesson block → convert it.
      3. If the text contains a bare JSON object with "chapters" key → convert it.
      3. Otherwise parse plain-markdown CHAPTER headings and build the JSON.
    """
    stripped = text.strip()

    if _is_rubiks_lesson_topic(f"{topic}\n{stripped}"):
        return _lesson_payload_to_artifact(_rubiks_beginner_payload(), topic)

    if "<artifact" in stripped or "<sandbox-spec" in stripped:
        return stripped

    if "```interactive-lesson" in stripped:
        lesson_match = re.search(r"```interactive-lesson\s*([\s\S]*?)```", stripped, re.IGNORECASE)
        if lesson_match:
            try:
                payload = json.loads(lesson_match.group(1).strip())
                converted = _lesson_payload_to_artifact(payload, topic)
                if converted:
                    return converted
            except (json.JSONDecodeError, ValueError, TypeError):
                pass

    # 2. Try bare JSON with "chapters"
    json_match = re.search(r'(\{[\s\S]*"chapters"[\s\S]*\})', stripped)
    if json_match:
        try:
            payload = json.loads(json_match.group(1))
            if "chapters" in payload and isinstance(payload["chapters"], list):
                converted = _lesson_payload_to_artifact(payload, topic)
                if converted:
                    return converted
        except (json.JSONDecodeError, ValueError):
            pass

    # 3. Parse plain markdown chapters.
    # Llama often outputs:
    #   "CHAPTER 1: ..." / "## Chapter 1: ..." / "1. Chapter 1: ..."
    # and appends non-chapter numbered sections like "3. PRACTICE TIME!" after.
    # Strategy: find all CHAPTER N headings, then stop at any non-chapter numbered
    # section that follows (e.g. "3. PRACTICE TIME!" or "4. WIDGET PAYLOAD:").
    chapter_pattern = re.compile(
        r'^(?:#{1,3}\s*)?(?:\*{0,2})?(?:CHAPTER|Chapter)\s*(\d+)[:\s\u2013-]+([^\n*]+)\*{0,2}',
        re.MULTILINE,
    )

    matches = list(chapter_pattern.finditer(stripped))

    if not matches:
        # Nothing to convert — return unchanged so model text still shows
        return text

    # Find the end boundary: the first non-chapter numbered section
    # e.g. "3. PRACTICE TIME!" or "4. WIDGET PAYLOAD:"
    post_chapters_cutoff = len(stripped)
    non_chapter_section = re.search(
        r'^\d+\.\s+(?!CHAPTER|Chapter)([A-Z][^\n]{0,60})',
        stripped[matches[-1].end():],
        re.MULTILINE,
    )
    if non_chapter_section:
        post_chapters_cutoff = matches[-1].end() + non_chapter_section.start()

    chapters = []
    for i, m in enumerate(matches):
        ch_title_raw = m.group(2).strip().rstrip(':')
        start_content = m.end()
        if i + 1 < len(matches):
            end_content = matches[i + 1].start()
        else:
            end_content = post_chapters_cutoff
        raw_content = stripped[start_content:end_content].strip()

        # Remove any sub-heading that is just the same title repeated
        raw_content = re.sub(r'^\*{0,2}' + re.escape(ch_title_raw) + r'\*{0,2}\s*\n?', '', raw_content).strip()

        # Build chapter title with chapter number prefix
        ch_title = f"Chapter {m.group(1)}: {ch_title_raw}"

        chapters.append({
            "title": ch_title,
            "content": raw_content,
            "widgetType": "none",
        })

    if not chapters:
        return text

    # Derive lesson title: try to extract from preamble before first chapter
    lesson_title = topic
    if matches:
        preamble = stripped[: matches[0].start()].strip()
        # Look for a markdown heading in the preamble
        heading_match = re.search(r'^#{1,3}\s*(.+)', preamble, re.MULTILINE)
        if heading_match:
            lesson_title = heading_match.group(1).strip()
        # Look for "LESSON TITLE: ..." pattern (Llama sometimes outputs this)
        elif re.search(r'LESSON TITLE[:\s]+(.+)', preamble, re.IGNORECASE):
            m_title = re.search(r'LESSON TITLE[:\s]+(.+)', preamble, re.IGNORECASE)
            lesson_title = m_title.group(1).strip().strip('*')
        elif preamble and len(preamble) < 120:
            lesson_title = preamble.splitlines()[0].strip('# ').strip()

    payload = {"title": lesson_title, "chapters": chapters}
    converted = _lesson_payload_to_artifact(payload, topic)
    return converted or text


# ─────────────────────────────────────────────────────────────────────────────
# Main agent loop
# ─────────────────────────────────────────────────────────────────────────────

async def run_assistant_chat(
    secrets: AppSecrets,
    messages_history: List[Dict[str, Any]],
    rag_context: Optional[str] = None,
    user_context: Optional[Dict[str, Any]] = None,
    active_artifact: Optional[Dict[str, Any]] = None,
    request: Optional[Any] = None
):
    """
    Ater agent loop. Yields SSE events:
      data: {"type": "status",  "message": "..."}
      data: {"type": "chunk",   "content": "..."}
      data: {"type": "action",  "action": "navigate"|"toast"|"pomodoro_*", ...}
      data: {"type": "error",   "message": "..."}
    """
    assistant = AterAssistant(secrets, user_context)
    tools = assistant.get_tools()
    llm_with_tools = assistant.llm.bind_tools(tools)

    # ── Build system prompt ────────────────────────────────────────────────

    # Build pomodoro context string
    pomodoro_str = ""
    user_identity = "User"
    if user_context:
        display_name = user_context.get("display_name")
        if display_name:
            user_identity = display_name
            
    if user_identity == "User":
        fallback_name = get_fallback_display_name()
        if fallback_name:
            user_identity = fallback_name

    if user_context:
        pm = user_context.get("pomodoro", {})
        if pm:
            status = "running" if pm.get("is_active") else "paused/stopped"
            time_left = pm.get("time_left", 0)
            mins = time_left // 60
            secs = time_left % 60
            pomodoro_str = (
                f"\n  Timer: {status}, {mins}m {secs}s left"
                f"\n  Mode: {pm.get('mode', 'focus')}"
                f"\n  Sessions completed: {pm.get('session_count', 0)}"
            )

    # Dynamically build vault and hub knowledge
    vault_notes = assistant.get_all_vault_notes()
    top_level_folders: set = set()
    if vault_notes:
        for n in vault_notes:
            parts = n["path"].split("/")
            if len(parts) > 1 and parts[0].lower() not in ("database", ".obsidian", ".trash"):
                top_level_folders.add(parts[0])

    # Retrieve actual study-planner hub IDs for generate_quiz / get_srs_cards
    planner_hub_entries: List[Dict[str, Any]] = []
    try:
        ater_service = AterService(secrets)
        planner_hub_entries = ater_service.list_planner_hubs()
    except Exception:
        pass

    hub_catalog_lines = []
    for h in planner_hub_entries:
        hub_id = h.get("id", "").replace(".md", "")
        hub_title = h.get("title", hub_id)
        hub_course = h.get("course", "")
        hub_semester = h.get("semester", "")
        meta = " | ".join(x for x in [hub_course, hub_semester] if x)
        hub_catalog_lines.append(f"  - ID: '{hub_id}' → {hub_title}" + (f" ({meta})" if meta else ""))

    hub_catalog_str = "\n".join(hub_catalog_lines) if hub_catalog_lines else "  (No study-planner hubs found — user must create them first.)"

    program_info = assistant.get_program_info()

    # Load system prompt from template file
    try:
        oracle_path = resolve_assistant_oracle_path()
        with open(oracle_path, "r", encoding="utf-8") as f:
            template = f.read()
    except Exception as e:
        logger.warning(f"Failed to read assistant_oracle.md: {e}. Falling back to default system prompt.")
        template = (
            "You are Ater Assistant, the autonomous Knowledge Architect, pedagogical Oracle, and system-level orchestrator.\n"
            "You are speaking with {{user_identity}}.{{program_info}}\n"
            "=== VAULT & POMODORO STATUS ===\n"
            "- Top-level study folders in vault: {{top_level_folders}}\n"
            "- Total notes in vault: {{total_notes}}\n"
            "- Pomodoro status: {{pomodoro_str}}\n"
            "{{active_hub_str}}\n"
            "{{rag_context_str}}\n"
            "{{hub_catalog}}\n"
        )

    # Perform substitutions
    import datetime
    current_time_str = datetime.datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")

    program_info_str = f" They are enrolled in: {program_info}.\n" if program_info else "\n"
    active_hub_str = f"- Current focus hub: {to_underscore_title_case(user_context.get('active_hub'))}\n" if user_context and user_context.get("active_hub") else ""
    rag_context_str = f"\n<rag_context>\n{rag_context}\n</rag_context>\n" if rag_context else ""

    sys_prompt = f"=== CURRENT ENVIRONMENT TIME ===\n- Current date/time: {current_time_str}\n\n" + template
    sys_prompt = sys_prompt.replace("{{user_identity}}", user_identity)
    sys_prompt = sys_prompt.replace("{{program_info}}", program_info_str)
    sys_prompt = sys_prompt.replace("{{top_level_folders}}", ', '.join(sorted(top_level_folders)) if top_level_folders else 'None found')
    sys_prompt = sys_prompt.replace("{{total_notes}}", str(len(vault_notes)))
    sys_prompt = sys_prompt.replace("{{pomodoro_str}}", pomodoro_str if pomodoro_str else 'not active')
    sys_prompt = sys_prompt.replace("{{hub_catalog}}", hub_catalog_str)
    sys_prompt = sys_prompt.replace("{{active_hub_str}}", active_hub_str)
    sys_prompt = sys_prompt.replace("{{rag_context_str}}", rag_context_str)

    if active_artifact and active_artifact.get("code"):
        sys_prompt += (
            "\n=== ACTIVE ARTIFACT FOR ITERATIVE EDITS ===\n"
            "The user has an active interactive simulator panel open. You can modify, fix, expand, or personalize it.\n"
            f"Title: {active_artifact.get('title', 'Untitled artifact')}\n"
            f"Version: {active_artifact.get('version', 1)}\n"
            "Current sandbox code:\n"
            f"{active_artifact.get('code')}\n"
            "If the user asks to modify, fix, expand, or personalize this simulator, you MUST return an updated XML artifact with all chapters preserved, but replace the <sandbox> block with a <sandbox-spec> tag specifying the requested changes (e.g., <sandbox-spec>change the colors of the rubik's cube simulator to bright neon</sandbox-spec>). Do NOT write or edit the full code inside a <sandbox> block yourself — the system will automatically edit the previous code inline according to your sandbox specification.\n"
        )

    # ── Format message history ─────────────────────────────────────────────
    formatted_messages = [SystemMessage(content=sys_prompt)]
    for msg in messages_history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            formatted_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            clean = re.sub(r'ACTION:\{.*?\}', '', content).strip()
            if clean:
                formatted_messages.append(AIMessage(content=clean))

    # Detect if this is a "teach me" style lesson request
    _lesson_mode, _lesson_topic = _is_lesson_request(messages_history)

    if _lesson_mode:
        try:
            async for event in _stream_learning_runtime_lesson(
                messages_history=messages_history,
                topic=_lesson_topic,
                secrets=secrets,
                request=request,
            ):
                yield f"data: {json.dumps(event)}\n\n"
            return
        except Exception as e:
            logger.error(f"[Assistant Lesson Stream] Learning runtime error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

    _active_llm = llm_with_tools

    for _ in range(8):
        accumulated_chunks = []
        has_tool_calls = False
        buffered_content: List[str] = []

        try:
            async for chunk in _active_llm.astream(formatted_messages):
                accumulated_chunks.append(chunk)
                if hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
                    has_tool_calls = True
                elif not has_tool_calls and hasattr(chunk, "content") and chunk.content:
                    if _lesson_mode:
                        # Buffer instead of streaming — we need the full response to convert
                        buffered_content.append(chunk.content)
                    else:
                        yield f"data: {json.dumps({'type': 'chunk', 'content': chunk.content})}\n\n"

            # Emit buffered lesson content after conversion
            if _lesson_mode and buffered_content and not has_tool_calls:
                full_text = "".join(buffered_content)
                converted = _convert_to_lesson_json(full_text, _lesson_topic)
                yield f"data: {json.dumps({'type': 'chunk', 'content': converted})}\n\n"
                break

            if not accumulated_chunks:
                break

            response = accumulated_chunks[0]
            for c in accumulated_chunks[1:]:
                response = response + c

        except Exception as stream_err:
            logger.warning(f"Streaming failed, checking fallback: {stream_err}")
            err_str = str(stream_err)
            is_tool_error = "Failed to call a function" in err_str or "tool_use_failed" in err_str or "400" in err_str
            
            if is_tool_error:
                logger.warning("[Ater] Stream failed on tool-bound LLM. Falling back to raw LLM without tools directly.")
                try:
                    response = await assistant.llm.ainvoke(formatted_messages)
                except Exception as raw_err:
                    logger.error(f"[Ater] raw LLM invoke failed: {raw_err}", exc_info=True)
                    yield f"data: {json.dumps({'type': 'error', 'message': str(raw_err)})}\n\n"
                    return
            else:
                try:
                    response = await _active_llm.ainvoke(formatted_messages)
                except Exception as invoke_err:
                    invoke_err_str = str(invoke_err)
                    if "Failed to call a function" in invoke_err_str or "tool_use_failed" in invoke_err_str or "400" in invoke_err_str:
                        logger.warning(f"[Ater] invoke failed on tool-bound LLM. Falling back to raw LLM without tools: {invoke_err}")
                        try:
                            response = await assistant.llm.ainvoke(formatted_messages)
                        except Exception as raw_err:
                            logger.error(f"[Ater] raw LLM invoke failed: {raw_err}", exc_info=True)
                            yield f"data: {json.dumps({'type': 'error', 'message': str(raw_err)})}\n\n"
                            return
                    else:
                        logger.error(f"[Ater] invoke failed: {invoke_err}", exc_info=True)
                        yield f"data: {json.dumps({'type': 'error', 'message': str(invoke_err)})}\n\n"
                        return
            if not (hasattr(response, "tool_calls") and response.tool_calls):
                content = response.content or ""
                if _lesson_mode:
                    content = _convert_to_lesson_json(content, _lesson_topic)
                yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
                return

        # Tool calls
        if hasattr(response, "tool_calls") and response.tool_calls:
            formatted_messages.append(response)
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id = tool_call["id"]

                yield f"data: {json.dumps({'type': 'status', 'message': get_tool_status_message(tool_name, tool_args)})}\n\n"

                tool_result = await assistant.execute_tool(tool_name, tool_args)
                tool_result_str = str(tool_result)

                # Stream tool results that contain rich UI blocks.
                # Only treat as rich UI if the result actually contains a UI block marker.
                _is_rich_ui_tool = tool_name in (
                    "render_ui", "generate_quiz", "search_notes_fulltext",
                    "get_inbox_files", "get_hubs", "list_hubs", "get_hub_notes",
                    "query_academic_database", "get_srs_cards", "get_vault_stats",
                    "start_generation", "get_focus_hud", "get_academic_calendar",
                    "get_study_history", "get_app_config", "get_queue_status",
                    "get_generated_files", "generate_summary", "show_practice_config",
                    "generate_custom_practice", "create_exam"
                )
                # Only stream as a UI chunk if the tool result actually contains a UI block.
                # Plain-text error/empty responses must flow as normal LLM text.
                is_rich_ui = _is_rich_ui_tool and (
                    "```ater-ui" in tool_result_str
                    or "```interactive-quiz" in tool_result_str
                )

                if is_rich_ui:
                    ui_chunk_content = "\n\n" + tool_result_str + "\n\n"
                    yield f"data: {json.dumps({'type': 'chunk', 'content': ui_chunk_content})}\n\n"
                    # Give the LLM a context-preserving summary so it knows what was found.
                    # Never strip all context — that causes contradictory empty-state messages.
                    _ctx = _build_tool_context_hint(tool_name, tool_result_str, tool_args)
                    tool_result_str = _ctx

                # ACTION: payloads → emit as SSE action events
                elif tool_result_str.startswith("ACTION:"):
                    try:
                        action_payload = json.loads(tool_result_str[7:])
                        yield f"data: {json.dumps({'type': 'action', **action_payload})}\n\n"
                        action_name = action_payload.get("action", "action")
                        tool_result_str = f"{action_name} executed."
                    except json.JSONDecodeError:
                        pass

                formatted_messages.append(ToolMessage(content=tool_result_str, tool_call_id=tool_id))
        else:
            break
