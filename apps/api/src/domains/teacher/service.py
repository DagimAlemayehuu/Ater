import html
import json
import re
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from src.domains.ai.factory import ModelFactory

MIN_LESSON_SECTIONS = 8


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "lesson"


def _title_from_prompt(prompt: str) -> str:
    cleaned = re.sub(r"^\s*(teach\s+me\s+about|teach\s+me|teach\s+about|teach|learn\s+about|learn|explain\s+about|explain)\s+", "", prompt, flags=re.I).strip()
    cleaned = re.sub(r"^\s*about\s+", "", cleaned, flags=re.I).strip()
    cleaned = cleaned.rstrip(".?!")
    return cleaned or "Focused Lesson"


def _display_title(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("-", " ")).strip().title()


def _fallback_roadmap_sections(lesson_title: str) -> List[str]:
    title = _display_title(lesson_title)
    if re.search(r"\bgit\b|version control", title, re.I):
        return [
            title,
            "Git Mental Model And Version Control Foundations",
            "Repository Anatomy And Object Storage",
            "Working Tree Index And Commit Discipline",
            "Branching Merging And Conflict Resolution",
            "Remote Collaboration With Fetch Pull And Push",
            "History Inspection Diffing And Recovery",
            "Advanced Workflows Rebase Stash Submodules And Worktrees",
        ]

    return [
        title,
        f"{title} Foundations And Mental Model",
        f"{title} Core Vocabulary And System Boundaries",
        f"{title} Internal Mechanics And State Transitions",
        f"{title} Formal Model And Decision Rules",
        f"{title} Worked Example From First Principles",
        f"{title} Failure Modes Misconceptions And Debugging",
        f"{title} Capstone Synthesis And Retrieval Mastery",
    ]


def _normalize_sections(sections: List[str], lesson_title: str) -> List[str]:
    cleaned: List[str] = []
    seen = set()
    for section in sections:
        value = re.sub(r"\s+", " ", str(section)).strip(" -*#\t\r\n")
        value = re.sub(r"^\d+[\).\-\s]+", "", value).strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(_display_title(value))

    fallback = _fallback_roadmap_sections(lesson_title)
    for section in fallback:
        if len(cleaned) >= MIN_LESSON_SECTIONS:
            break
        key = section.lower()
        if key not in seen:
            cleaned.append(section)
            seen.add(key)

    return cleaned


def _render_roadmap_markdown(lesson_title: str, prompt: str, sections: List[str]) -> str:
    nodes = []
    for index, section in enumerate(sections, start=1):
        node_id = f"S{index}"
        label = section.replace('"', "'")
        nodes.append(f'    {node_id}["{index}. {label}"]')
        if index > 1:
            nodes.append(f"    S{index - 1} --> {node_id}")

    section_lines = []
    for index, section in enumerate(sections, start=1):
        section_lines.append(
            f"- **Chapter {index}: {section}** creates `"
            f"{index:04d}-{_slugify(section)}.md` as an Ater Atomic Note with Mental Model, How It Works, Formal Model, and The Proving Grounds."
        )

    return "\n".join(
        [
            f"## Roadmap: {lesson_title}",
            "",
            f"This learning path turns `{prompt.strip() or lesson_title}` into a sequence of focused atomic notes and matching interactive lessons. Each chapter is narrow enough to review, quiz, and advance without losing the larger progression.",
            "",
            "```mermaid",
            "graph TD",
            *nodes,
            "```",
            "",
            "## Chapter Plan",
            "",
            *section_lines,
            "",
            'Reply with "confirm" or click **Start Lesson** to generate the full lesson workspace.',
        ]
    )


def _strip_frontmatter(markdown_content: str) -> str:
    content = markdown_content.strip()
    if not content.startswith("---"):
        return content
    end = content.find("\n---", 3)
    if end == -1:
        return content
    return content[end + 4 :].strip()


def _extract_markdown_section(markdown_content: str, heading: str) -> str:
    body = _strip_frontmatter(markdown_content)
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    match = re.search(pattern, body, flags=re.MULTILINE | re.IGNORECASE)
    if not match:
        return ""
    next_match = re.search(r"^##\s+", body[match.end() :], flags=re.MULTILINE)
    end = match.end() + next_match.start() if next_match else len(body)
    return body[match.end() : end].strip()


def _extract_quiz_items(proving_grounds: str) -> List[Dict[str, Any]]:
    match = re.search(r"```interactive-quiz\s*([\s\S]*?)```", proving_grounds, flags=re.IGNORECASE)
    if not match:
        return []
    try:
        parsed = json.loads(match.group(1).strip())
    except Exception:
        return []
    if not isinstance(parsed, list):
        return []
    items: List[Dict[str, Any]] = []
    for item in parsed:
        if isinstance(item, dict) and item.get("question") and isinstance(item.get("options"), list):
            items.append(item)
    return items


def _markdown_fragment_to_html(markdown_fragment: str) -> str:
    lines = markdown_fragment.strip().splitlines()
    html_parts: List[str] = []
    paragraph: List[str] = []

    def flush_paragraph() -> None:
        if not paragraph:
            return
        text = " ".join(line.strip() for line in paragraph).strip()
        paragraph.clear()
        if text:
            html_parts.append(f"<p>{_inline_markdown_to_html(text)}</p>")

    in_code = False
    code_lines: List[str] = []
    code_lang = ""
    for raw_line in lines:
        line = raw_line.rstrip()
        fence = re.match(r"^```(\S*)", line)
        if fence:
            if in_code:
                html_parts.append(
                    f'<pre class="code-block" data-lang="{html.escape(code_lang)}"><code>{html.escape(chr(10).join(code_lines))}</code></pre>'
                )
                code_lines = []
                code_lang = ""
                in_code = False
            else:
                flush_paragraph()
                in_code = True
                code_lang = fence.group(1) or "text"
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line.strip():
            flush_paragraph()
            continue
        if line.startswith("- "):
            flush_paragraph()
            # The simple renderer handles one list item at a time unless adjacent
            html_parts.append(f"<ul><li>{_inline_markdown_to_html(line[2:].strip())}</li></ul>")
            continue
        if line.startswith("#### "):
            flush_paragraph()
            html_parts.append(f"<h4>{_inline_markdown_to_html(line[5:].strip())}</h4>")
            continue
        if line.startswith("### "):
            flush_paragraph()
            html_parts.append(f"<h3>{_inline_markdown_to_html(line[4:].strip())}</h3>")
            continue
        if line.startswith("## "):
            flush_paragraph()
            html_parts.append(f"<h2>{_inline_markdown_to_html(line[3:].strip())}</h2>")
            continue
        if line.startswith("# "):
            flush_paragraph()
            html_parts.append(f"<h1>{_inline_markdown_to_html(line[2:].strip())}</h1>")
            continue
        paragraph.append(line)

    flush_paragraph()
    if in_code and code_lines:
        html_parts.append(
            f'<pre class="code-block" data-lang="{html.escape(code_lang)}"><code>{html.escape(chr(10).join(code_lines))}</code></pre>'
        )
    return "\n".join(html_parts) or "<p>No section content was generated for this chapter.</p>"


def _inline_markdown_to_html(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"\[\[([^\]]+)\]\]", r'<span class="wiki-link">\1</span>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    return escaped


class TeacherService:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)

    async def chat(
        self,
        history: List[Dict[str, str]],
        secrets: Optional[Any] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        original_prompt = ""

        # Let's find the original user prompt (the first user message)
        for message in history:
            if message.get("role") == "user":
                content = message.get("content", "")
                # Skip trivial confirmations to find the actual topic
                if content.strip().lower() not in ["confirm", "proceed", "yes", "y", "ok", "start", "proceed with lesson", "start lesson"]:
                    original_prompt = content
                    break

        # If we couldn't find any non-trivial prompt, fallback to the last user message
        if not original_prompt:
            for message in reversed(history):
                if message.get("role") == "user":
                    original_prompt = message.get("content", "")
                    break

        # Get latest user message for the current chat action
        for message in reversed(history):
            if message.get("role") == "user":
                message.get("content", "")
                break

        topic = _title_from_prompt(original_prompt)
        workspace_slug = _slugify(topic)
        lesson_title = _display_title(topic)

        has_roadmap = False
        for msg in history:
            if msg.get("role") == "assistant" and ("```mermaid" in msg.get("content", "") or "graph TD" in msg.get("content", "") or "graph LR" in msg.get("content", "")):
                has_roadmap = True
                break

        if not has_roadmap:
            yield {"type": "status", "message": "Designing learning roadmap..."}
            roadmap_content = await self._generate_roadmap_with_model(lesson_title, original_prompt, secrets)
            yield {
                "type": "chunk",
                "content": roadmap_content,
            }
            return

        yield {"type": "status", "message": "Extracting roadmap sections..."}
        sections = await self._extract_roadmap_sections(history, secrets)
        sections = _normalize_sections(sections, lesson_title)

        yield {"type": "status", "message": "Preparing teaching workspace..."}
        workspace = self._ensure_workspace(workspace_slug, lesson_title, original_prompt)

        first_lesson_path = None
        first_relative_path = None
        first_preview_path = None
        first_lesson_title = ""

        # Loop through each section in the roadmap and generate companion files
        for i, sec_title in enumerate(sections):
            sec_slug = _slugify(sec_title)
            sec_number = i + 1
            
            # Form standard incremented path: e.g. 0001-basic-economic-concepts.html
            lesson_path = workspace / "lessons" / f"{sec_number:04d}-{sec_slug}.html"
            
            yield {"type": "status", "message": f"Designing Section {sec_number}/{len(sections)}: {sec_title}..."}
            
            generated = await self._generate_lesson_with_model(sec_title, original_prompt, secrets, history)
            markdown_content = self._ensure_atomic_markdown(
                generated.get("markdown_content") or "",
                sec_title,
                original_prompt,
                sec_number,
                len(sections),
            )
            lesson_html = self._render_lesson_html(sec_title, original_prompt, markdown_content, sec_number, len(sections))
            
            lesson_path.write_text(lesson_html, encoding="utf-8")
            md_path = lesson_path.with_suffix(".md")
            md_path.write_text(markdown_content, encoding="utf-8")

            relative_path = lesson_path.relative_to(self.vault_path)
            preview_path = "/".join(relative_path.parts)

            if i == 0:
                first_lesson_path = lesson_path
                first_relative_path = relative_path
                first_preview_path = preview_path
                first_lesson_title = sec_title

        assistant_markdown = (
            f"I have successfully generated your complete learning path for **{lesson_title}**! "
            f"All {len(sections)} sections and paired atomic notes have been saved side-by-side in your vault:\n\n"
        )
        for i, sec_title in enumerate(sections):
            sec_slug = _slugify(sec_title)
            sec_number = i + 1
            assistant_markdown += f"* Section {sec_number}: **{sec_title}** (`{sec_number:04d}-{sec_slug}.md`)\n"
        
        assistant_markdown += "\nThe HTML lessons now wrap the same Markdown atomic-note source, so the interactive view and vault note stay aligned."

        yield {
            "type": "chunk",
            "content": assistant_markdown,
        }
        yield {
            "type": "lesson_created",
            "title": first_lesson_title,
            "workspace": workspace_slug,
            "lesson_path": str(first_relative_path),
            "preview_path": first_preview_path,
            "absolute_lesson_path": str(first_lesson_path),
        }

    async def _extract_roadmap_sections(
        self,
        history: List[Dict[str, str]],
        secrets: Optional[Any] = None,
    ) -> List[str]:
        ai_key = getattr(secrets, "ai_key", None) if secrets else None
        if not ai_key:
            return []

        try:
            provider = getattr(secrets, "ai_provider", None) or "google"
            model = getattr(secrets, "ai_model", None) or "gemini-2.0-flash"
            llm = ModelFactory.get_model(
                provider=provider,
                model_name=model,
                api_key=ai_key,
                temperature=0.1,
                max_tokens=500,
            )

            system = """You are a precise data extractor.
Analyze the conversation history, find the proposed learning roadmap, and extract the names of the atomic-note chapters to be generated.
Prefer 8 to 12 narrow chapters over a few broad headings. If the roadmap only has broad phases, split each phase into focused chapter titles that can each become one Ater Atomic Note.
Return the result strictly as a JSON list of strings, for example:
["Foundations And Mental Model", "Core Vocabulary", "State Transitions", "Formal Model", "Worked Example", "Failure Modes", "Applied Practice", "Capstone Synthesis"]
Do not output any introductory or concluding text. Output only valid JSON."""

            history_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in history])
            response = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=history_text)])
            raw = response.content if hasattr(response, "content") else str(response)
            
            # Clean JSON markers if present
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:].strip()
            elif raw.startswith("```"):
                raw = raw[3:].strip()
            if raw.endswith("```"):
                raw = raw[:-3].strip()

            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item) for item in parsed]
            return []
        except Exception as e:
            import logging
            logger = logging.getLogger("Ater")
            logger.error(f"[TeacherService] Failed to extract roadmap sections: {e}", exc_info=True)
            return []

    def _ensure_workspace(self, workspace_slug: str, lesson_title: str, prompt: str) -> Path:
        workspace = self.vault_path / "Lessons" / workspace_slug
        (workspace / "lessons").mkdir(parents=True, exist_ok=True)
        (workspace / "reference").mkdir(parents=True, exist_ok=True)
        (workspace / "learning-records").mkdir(parents=True, exist_ok=True)

        mission = workspace / "MISSION.md"
        if not mission.exists():
            mission.write_text(
                "\n".join(
                    [
                        f"# Mission: {lesson_title}",
                        "",
                        "## Why",
                        f"Learn {lesson_title} well enough to use it in a real task.",
                        "",
                        "## Success looks like",
                        f"- Explain the core idea of {lesson_title} from memory",
                        "- Complete a short retrieval exercise without looking at the answer",
                        "- Apply the idea to a small concrete example",
                        "",
                        "## Constraints",
                        "- Lessons should be short, interactive, and reviewable inside Ater",
                        "",
                        "## Out of scope",
                        "- Broad unrelated theory not needed for the immediate learning goal",
                    ]
                ),
                encoding="utf-8",
            )

        resources = workspace / "RESOURCES.md"
        if not resources.exists():
            resources.write_text(
                "\n".join(
                    [
                        f"# {lesson_title} Resources",
                        "",
                        "## Knowledge",
                        "",
                        "- Resource curation pending.",
                        "  Use for: replace this with high-trust primary material during a deeper teaching pass.",
                        "",
                        "## Wisdom (Communities)",
                        "",
                        "- Community curation pending.",
                        "  Use for: real-world feedback once the learner is ready to test the skill.",
                    ]
                ),
                encoding="utf-8",
            )

        notes = workspace / "NOTES.md"
        if not notes.exists():
            notes.write_text(f"# Notes\n\nInitial prompt: {prompt.strip()}\n", encoding="utf-8")

        return workspace

    async def _generate_roadmap_with_model(
        self,
        lesson_title: str,
        prompt: str,
        secrets: Optional[Any],
    ) -> str:
        ai_key = getattr(secrets, "ai_key", None) if secrets else None
        if not ai_key:
            return _render_roadmap_markdown(lesson_title, prompt, _normalize_sections([], lesson_title))

        try:
            provider = getattr(secrets, "ai_provider", None) or "google"
            model = getattr(secrets, "ai_model", None) or "gemini-2.0-flash"
            llm = ModelFactory.get_model(
                provider=provider,
                model_name=model,
                api_key=ai_key,
                temperature=0.5,
                max_tokens=2000,
            )

            system = f"""You are Ater Teacher, a stateful teaching agent implementing the Teach skill.
Your task is to analyze the requested topic "{lesson_title}" and generate a structured, sequential learning roadmap of 8 to 12 atomic-note chapters showing the progression from beginner to competent.
You MUST output:
1. A brief 1-2 sentence introduction.
2. A beautiful Mermaid diagram (graph TD) showing the progression of the sections.
3. A chapter plan detailing what will be learned in each section and which atomic note will be generated for it.
4. A friendly question asking the user to confirm/proceed (respond with "confirm" or click the proceed button) to start the first dynamic lesson.

Every planned chapter must be narrow enough to become one Ater Atomic Note with Mental Model, How It Works, Formal Model, and The Proving Grounds sections.
Format your response in Markdown. Do not generate any HTML code. Keep the Mermaid graph syntax valid."""

            human = f"Prompt: {prompt}\nLesson title: {lesson_title}"
            response = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=human)])
            return response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            import logging
            logger = logging.getLogger("Ater")
            logger.error(f"[TeacherService] Roadmap generation failed: {e}", exc_info=True)
            return f"### Roadmap: {lesson_title}\n\nError generating roadmap: {e}"

    async def _generate_lesson_with_model(
        self,
        lesson_title: str,
        prompt: str,
        secrets: Optional[Any],
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, str]:
        ai_key = getattr(secrets, "ai_key", None) if secrets else None
        if not ai_key:
            return {}

        try:
            provider = getattr(secrets, "ai_provider", None) or "google"
            model = getattr(secrets, "ai_model", None) or "gemini-2.0-flash"
            llm = ModelFactory.get_model(
                provider=provider,
                model_name=model,
                api_key=ai_key,
                temperature=0.45,
                max_tokens=5000,
            )

            system = f"""You are Ater Teacher, a stateful teaching agent implementing the Teach skill.
For the chosen concept "{lesson_title}", generate one high-fidelity Markdown note for an Obsidian vault. The application will wrap the Markdown into native interactive HTML, so do not generate HTML.

Follow these rules for the Markdown note:
- Follow the Ater v33.0 schema:
  ---
  title: {lesson_title}
  type: Atomic Note
  course: {lesson_title}
  semester: Semester 1
  unit: "1"
  hub: "[[{lesson_title}_Hub]]"
  source: "[[Interactive_Lessons]]"
  mode: CS
  read: false
  generated: true
  ---
  
  ## Mental Model
  (2-3 sentences. Vivid, industry-specific analogy. MUST map >=2 structural components. NO bullet points in prose.)
  
  ## How It Works
  (3-5 sentences of continuous technical prose. Explain WHAT, WHY, and HOW. Embed 3-5 [[Wikilinks]] referencing related concepts. NO bullet points in prose.)
  
  ## Formal Model
  (3-5 sentences of formal/academic definition, constraints, or boundary conditions. Followed by a code block, LaTeX formula, or Mermaid diagram.)
  
  ## The Proving Grounds
  ```interactive-quiz
  [
    {{
      "id": "q1",
      "type": "multiple-choice",
      "difficulty": "L1",
      "question": "...",
      "options": [...],
      "answer": "...",
      "explanation": "..."
    }},
    {{
      "id": "q2",
      "type": "multiple-choice",
      "difficulty": "L2",
      "question": "...",
      "options": [...],
      "answer": "...",
      "explanation": "..."
    }}
  ]
  ```

Structure your output EXACTLY as follows:
First, write a 2-3 sentence friendly summary of what you created for the user.
Then, write the exact divider string: `===MARKDOWN_NOTE===` on a new line.
Then, write the raw Markdown note (do not wrap in markdown backticks).
Do not output HTML. Do not wrap the Markdown note in markdown backticks."""

            if history:
                history_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in history])
                human = f"Conversation History:\n{history_text}\n\nNow, generate the next lesson on the roadmap: {lesson_title}."
            else:
                human = f"Prompt: {prompt}\nLesson title: {lesson_title}"

            response = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=human)])
            raw = response.content if hasattr(response, "content") else str(response)

            markdown_content = ""
            assistant_markdown = ""

            parts_md = raw.split("===MARKDOWN_NOTE===")
            if len(parts_md) >= 2:
                assistant_markdown = parts_md[0].strip()
                markdown_content = parts_md[1].strip()
            else:
                markdown_content = raw.strip()

            if markdown_content.startswith("```markdown"):
                markdown_content = markdown_content[11:].strip()
            elif markdown_content.startswith("```"):
                markdown_content = markdown_content[3:].strip()
            if markdown_content.endswith("```"):
                markdown_content = markdown_content[:-3].strip()

            assistant_markdown = re.sub(r"^`+|`+$", "", assistant_markdown).strip()

            return {
                "markdown_content": markdown_content,
                "assistant_markdown": assistant_markdown,
            }
        except Exception as e:
            import logging
            logger = logging.getLogger("Ater")
            logger.error(f"[TeacherService] Model generation failed: {e}", exc_info=True)
            return {}

    def _ensure_atomic_markdown(
        self,
        markdown_content: str,
        lesson_title: str,
        prompt: str,
        section_number: int = 1,
        total_sections: int = 1,
    ) -> str:
        required = ["## Mental Model", "## How It Works", "## Formal Model", "## The Proving Grounds"]
        content = markdown_content.strip()
        section_lengths = [
            len(_extract_markdown_section(content, "Mental Model")),
            len(_extract_markdown_section(content, "How It Works")),
            len(_extract_markdown_section(content, "Formal Model")),
        ]
        quiz_items = _extract_quiz_items(_extract_markdown_section(content, "The Proving Grounds"))
        if (
            content.startswith("---")
            and all(section in content for section in required)
            and "```interactive-quiz" in content
            and min(section_lengths or [0]) >= 180
            and len(quiz_items) >= 2
        ):
            return content
        return self._render_fallback_markdown(lesson_title, prompt, section_number, total_sections)

    def _render_fallback_markdown(
        self,
        lesson_title: str,
        prompt: str,
        section_number: int = 1,
        total_sections: int = 1,
    ) -> str:
        safe_title = lesson_title
        safe_prompt = prompt.strip() or lesson_title
        related = [
            f"[[{safe_title} Mental Model]]",
            f"[[{safe_title} Mechanics]]",
            f"[[{safe_title} Practice]]",
            f"[[{safe_title} Failure Modes]]",
        ]
        return f"""---
title: {safe_title}
type: Atomic Note
course: {safe_title}
semester: Semester 1
unit: "{section_number}"
hub: "[[{safe_title}_Hub]]"
source: "[[Interactive_Lessons]]"
mode: CS
read: false
generated: true
lesson_index: {section_number}
lesson_total: {total_sections}
---

## Mental Model

Learning {safe_title} is like opening a precise instrument panel where every gauge represents one part of the system. The working tree is the live workspace, the index is the staging tray where intent is prepared, and the commit history is the durable record that lets a learner inspect, compare, and recover decisions instead of guessing what changed.

## How It Works

{safe_title} starts by isolating the smallest useful unit of understanding from the larger request: {safe_prompt}. The concept becomes useful when the learner can explain its purpose, name the state it changes, and predict what will happen after each operation without relying on the interface. This chapter connects {related[0]}, {related[1]}, {related[2]}, and {related[3]} so the idea can move from recognition into active control. Ater treats this as one atomic note because the learner should be able to rehearse the model, the mechanism, the formal rule, and the retrieval check in one focused pass.

## Formal Model

Formally, {safe_title} can be modeled as a state transition over a bounded learning system. The learner begins with an input prompt, builds a mental representation, applies an operation, then checks whether the output preserves the intended invariant. The boundary condition is competence: if the learner cannot predict the next state, inspect an error, or explain the trade-off from memory, the concept is not yet stable. The model below captures the chapter loop used by Ater lessons.

```mermaid
graph TD
    A[Prompt] --> B[Mental Model]
    B --> C[Mechanism]
    C --> D[Formal Rule]
    D --> E[Retrieval Check]
    E --> F[Applied Transfer]
```

## The Proving Grounds

```interactive-quiz
[
  {{
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What makes this chapter an atomic note rather than a generic lesson page?",
    "options": ["It isolates one durable concept and includes model, mechanism, formal rule, and retrieval", "It contains a long introduction with no testable boundary", "It only stores raw HTML"],
    "answer": "It isolates one durable concept and includes model, mechanism, formal rule, and retrieval",
    "explanation": "Ater atomic notes are built for recall and transfer, so each one keeps the conceptual model, working explanation, formal structure, and quiz in the same reviewable unit."
  }},
  {{
    "id": "q2",
    "type": "multiple-choice",
    "difficulty": "L2",
    "question": "What should you be able to do after studying {safe_title}?",
    "options": ["Predict the next state and explain the trade-off from memory", "Only recognize the title when it appears", "Skip the formal model because the example felt intuitive"],
    "answer": "Predict the next state and explain the trade-off from memory",
    "explanation": "Competence means the learner can operate the concept, not just identify it. Prediction and explanation expose whether the model is usable."
  }}
]
```
"""

    def _next_lesson_path(self, workspace: Path, workspace_slug: str) -> Path:
        lessons_dir = workspace / "lessons"
        existing = sorted(lessons_dir.glob("*.html"))
        next_number = 1
        if existing:
            numbers = []
            for path in existing:
                match = re.match(r"^(\d{4})-", path.name)
                if match:
                    numbers.append(int(match.group(1)))
            if numbers:
                next_number = max(numbers) + 1
        return lessons_dir / f"{next_number:04d}-{workspace_slug}.html"

    def _render_legacy_lesson_html(self, lesson_title: str, prompt: str) -> str:
        safe_title = html.escape(lesson_title)
        safe_prompt = html.escape(prompt.strip())
        lower_title = html.escape(lesson_title.lower())
        return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{safe_title}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #111113;
      --panel: #151517;
      --card: #1a1a1c;
      --card-2: #202024;
      --line: #2b2b30;
      --text: #ebebeb;
      --muted: #a1a1aa;
      --accent: #d9d9d9;
      --good: #8bd49c;
      --warn: #f4c06a;
      --bad: #ff8f8f;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(255,255,255,.035), transparent 260px),
        radial-gradient(circle at top right, rgba(255,255,255,.035), transparent 340px),
        var(--bg);
      color: var(--text);
      font-family: Outfit, ui-sans-serif, system-ui, -apple-system, sans-serif;
      line-height: 1.55;
    }}
    .lesson-shell {{
      min-height: 100vh;
    }}
    main {{
      max-width: 800px;
      width: 100%;
      margin: 0 auto;
      padding: 48px 24px 72px;
    }}
    header.hero {{
      min-height: 200px;
      display: grid;
      align-content: center;
      border-bottom: 1px solid var(--line);
      margin-bottom: 28px;
      padding-bottom: 24px;
    }}
    .eyebrow {{
      color: var(--muted);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
    }}
    h1 {{
      margin: 12px 0 16px;
      max-width: 840px;
      font-size: clamp(32px, 5vw, 48px);
      line-height: 1.1;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }}
    .hero p {{
      max-width: 720px;
      color: #cfcfd5;
      font-size: 15px;
      margin: 0;
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 28px;
    }}
    .meta {{
      border: 1px solid var(--line);
      background: rgba(255,255,255,.025);
      padding: 14px;
      border-radius: 8px;
    }}
    .meta b {{
      display: block;
      font-size: 10px;
      color: var(--muted);
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }}
    .tab-content {{
      display: none;
    }}
    .tab-content.active {{
      display: block;
    }}
    section {{
      border: 1px solid var(--line);
      background: var(--panel);
      padding: 32px;
      margin: 18px 0;
      border-radius: 8px;
    }}
    h2 {{
      margin: 0 0 16px;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: .08em;
      border-bottom: 1px solid var(--line);
      padding-bottom: 12px;
    }}
    h3 {{
      margin: 0 0 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--accent);
    }}
    p, li {{ color: #d9d9dc; font-size: 15px; line-height: 1.6; }}
    .two-col {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      margin-top: 18px;
    }}
    .card {{
      border: 1px solid var(--line);
      background: var(--card);
      border-radius: 8px;
      padding: 20px;
    }}
    .flow {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }}
    .step {{
      border: 1px solid var(--line);
      background: var(--card);
      min-height: 140px;
      padding: 16px;
      border-radius: 8px;
    }}
    .step span {{
      display: inline-grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border: 1px solid var(--line);
      margin-bottom: 12px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 900;
    }}
    button.action-btn {{
      border: 1px solid var(--line);
      background: var(--card);
      color: var(--text);
      border-radius: 6px;
      padding: 10px 14px;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s ease;
    }}
    button.action-btn:hover {{ border-color: var(--accent); background: var(--card-2); }}
    button.action-btn.selected {{ border-color: var(--accent); background: var(--accent); color: var(--bg); }}
    .choices {{ display: grid; gap: 10px; margin-top: 12px; }}
    .choices button {{
      text-align: left;
      border: 1px solid var(--line);
      background: var(--card);
      color: var(--text);
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
    }}
    .choices button:hover {{ border-color: var(--accent); }}
    .choices button.selected {{ border-color: var(--accent); background: var(--card-2); }}
    .feedback {{
      min-height: 32px;
      margin-top: 14px;
      border-left: 2px solid var(--line);
      padding-left: 12px;
      color: var(--accent);
      font-weight: 800;
    }}
    .feedback.good {{ color: var(--good); border-color: var(--good); }}
    .feedback.bad {{ color: var(--bad); border-color: var(--bad); }}
    textarea {{
      width: 100%;
      min-height: 130px;
      resize: vertical;
      border: 1px solid var(--line);
      background: var(--bg);
      color: var(--text);
      border-radius: 6px;
      padding: 12px;
      font: inherit;
    }}
    .source {{
      color: var(--muted);
      font-size: 13px;
      border-left: 2px solid var(--line);
      padding-left: 12px;
    }}
    .meter {{
      height: 8px;
      border: 1px solid var(--line);
      background: var(--bg);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 12px;
    }}
    .meter > div {{
      height: 100%;
      width: 0%;
      background: var(--accent);
      transition: width .2s ease;
    }}
    .term {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid var(--line);
      padding: 12px 0;
    }}
    .term:first-child {{ border-top: 0; }}
    .term strong {{ color: var(--text); }}
    .term span {{ color: var(--muted); text-align: right; }}
    .nav-buttons {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 32px;
      border-top: 1px solid var(--line);
      padding-top: 24px;
    }}
    button.nav-btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--line);
      background: var(--card);
      color: var(--text);
      border-radius: 4px;
      padding: 10px 18px;
      font: inherit;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
      transition: all 0.2s ease;
    }}
    button.nav-btn:hover {{
      border-color: var(--accent);
      background: var(--card-2);
    }}
    button.nav-btn.primary {{
      background: var(--accent);
      color: var(--bg);
      border-color: var(--accent);
    }}
    button.nav-btn.primary:hover {{
      background: #ffffff;
      color: var(--bg);
      border-color: #ffffff;
    }}
    @media (max-width: 820px) {{
      main {{ padding: 32px 18px 56px; }}
      .meta-grid, .two-col, .flow {{ grid-template-columns: 1fr; }}
      header.hero {{ min-height: auto; }}
    }}
  </style>
</head>
<body>
  <div class="lesson-shell">
    <main>
      <header class="hero">
        <div class="eyebrow">Ater Teacher · Interactive Curriculum Progression</div>
        <h1>{safe_title}</h1>
        <p>A multi-stage structured lesson engineered for mastery. Navigate step-by-step using the buttons at the bottom of each section.</p>
        <div class="meta-grid">
          <div class="meta"><b>Topic Prompt</b>{safe_prompt}</div>
          <div class="meta"><b>Learning Path</b>Foundations &rarr; Mechanics &rarr; Lab</div>
          <div class="meta"><b>Goal</b>Develop full functional competence in {lower_title}.</div>
        </div>
      </header>

      <!-- Foundations Tab -->
      <div id="foundations" class="tab-content active">
        <section>
          <h2>1. Foundations of {safe_title}</h2>
          <p>Welcome to the study of <strong>{safe_title}</strong>. When approaching this topic for the first time, it is vital to establish why this concept exists and what fundamental problem it was designed to resolve. Focus on the core mechanics rather than memorizing definitions.</p>
          
          <div class="two-col">
            <div class="card">
              <h3>Core Definition</h3>
              <p>{safe_title} is the systematic framework or mechanism used to analyze, organize, and determine outcomes regarding <em>{lower_title}</em>.</p>
              <p>In practice, it allows us to answer questions of resource allocation, state transitions, and optimization within its specific domain boundaries.</p>
            </div>
            <div class="card">
              <h3>Why It Matters</h3>
              <p>Without understanding {safe_title}, decisions in this domain are reduced to guesswork. Having a formal model allows for predictable interventions, optimization calculations, and root-cause mapping of failures.</p>
            </div>
          </div>
          
          <div class="card" style="margin-top: 20px;">
            <h3>The Conceptual Model</h3>
            <p>Think of {safe_title} as a specialized lens: it filters out complex noise and isolates the variables that actually drive state change. Once you identify these primary variables, you can predict outputs with mathematical certainty.</p>
          </div>
          
          <div class="nav-buttons">
            <div></div>
            <button class="nav-btn primary" onclick="switchTab('mechanics')">Next: Mechanics &rarr;</button>
          </div>
        </section>
      </div>

      <!-- Mechanics Tab -->
      <div id="mechanics" class="tab-content">
        <section>
          <h2>2. Analytical Mechanics & Rules</h2>
          <p>Every structural model is governed by core equations, rules, or logical boundaries. In this section, we break down the operational anatomy of <strong>{safe_title}</strong>.</p>
          
          <div class="flow">
            <div class="step"><span>1</span><h3>Identify Inputs</h3><p>Isolate key variables, parameters, or initial resource states.</p></div>
            <div class="step"><span>2</span><h3>Map Constraints</h3><p>Establish resource bounds, rules, and system limits.</p></div>
            <div class="step"><span>3</span><h3>Apply Function</h3><p>Process the variables through the decision model or equation.</p></div>
            <div class="step"><span>4</span><h3>Evaluate Output</h3><p>Analyze the resulting equilibrium, state change, or output payload.</p></div>
          </div>

          <div class="two-col" style="margin-top: 20px;">
            <div class="card">
              <h3>Operational Principles</h3>
              <ul>
                <li><strong>Equilibrium Bound</strong>: The system tends toward a balance point where forces or parameters align.</li>
                <li><strong>Constraint Limits</strong>: Bypassing constraints causes systemic failures or model breakdown.</li>
                <li><strong>Input Elasticity</strong>: Changing one parameter produces a proportional change in the final state.</li>
              </ul>
            </div>
            <div class="card">
              <h3>Logical Rules</h3>
              <p>Keep these conditions in mind when working with the model:</p>
              <p style="font-family: monospace; background: var(--bg); padding: 12px; border-radius: 4px; border: 1px solid var(--line);">
                If Input (X) varies, Output (Y) updates matching:<br>
                Y = f(X, constraints)
              </p>
            </div>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-btn" onclick="switchTab('foundations')">&larr; Back: Foundations</button>
            <button class="nav-btn primary" onclick="switchTab('example')">Next: Worked Example &rarr;</button>
          </div>
        </section>
      </div>

      <!-- Worked Example Tab -->
      <div id="example" class="tab-content">
        <section>
          <h2>3. Interactive Scenario Simulation</h2>
          <p>Let's look at a concrete implementation. Use the interactive controls below to modify the variables of the simulation and observe how the output adjusts dynamically.</p>
          
          <div class="card">
            <h3>Variable Configuration Panel</h3>
            <div class="two-col">
              <div>
                <label for="var-input" style="display:block; font-size:12px; font-weight:800; text-transform:uppercase; color:var(--muted); margin-bottom:6px;">Parameter Value (X)</label>
                <input id="var-input" type="range" min="10" max="100" value="50" style="width:100%;" oninput="updateSimulation()" />
              </div>
              <div>
                <label for="multiplier" style="display:block; font-size:12px; font-weight:800; text-transform:uppercase; color:var(--muted); margin-bottom:6px;">Domain Multiplier</label>
                <select id="multiplier" style="width:100%; background:var(--bg); border:1px solid var(--line); color:var(--text); padding:8px; border-radius:4px;" onchange="updateSimulation()">
                  <option value="1">Standard (1x)</option>
                  <option value="2">Optimized (2x)</option>
                  <option value="3">Maximum Output (3x)</option>
                </select>
              </div>
            </div>
            
            <div class="meter" aria-hidden="true" style="margin-top:24px; height:16px;"><div id="sim-bar" style="width: 50%; background: var(--good);"></div></div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12px; color:var(--muted);">
              <span>Min Value</span>
              <span id="sim-output-val" style="font-weight:bold; color:var(--text);">Current Output: 50</span>
              <span>Max Capacity</span>
            </div>
          </div>

          <div class="two-col" style="margin-top:20px;">
            <div class="card">
              <h3>Simulated Scenario Walkthrough</h3>
              <p>As you increase <strong>Parameter (X)</strong>, the resource capacity scales linearly. However, applying the <strong>Domain Multiplier</strong> accelerates the state change, representing an optimization shift in {safe_title}.</p>
            </div>
            <div class="card">
              <h3>Key Takeaway</h3>
              <p>In real-world settings, finding the threshold where input parameters produce the highest yield without breaking the boundary system is the target of domain competence.</p>
            </div>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-btn" onclick="switchTab('mechanics')">&larr; Back: Mechanics</button>
            <button class="nav-btn primary" onclick="switchTab('retrieval')">Next: Quiz &rarr;</button>
          </div>
        </section>
      </div>

      <!-- Retrieval Tab -->
      <div id="retrieval" class="tab-content">
        <section>
          <h2>4. Conceptual Retrieval Check</h2>
          <p>Answer the following question without toggling back to previous tabs. This tests active retrieval strength, which is the primary mechanism for building durable memory storage.</p>
          
          <div class="card">
            <h3>Question: Which of the following best describes the core purpose of {safe_title}?</h3>
            <div class="choices">
              <button onclick="checkQuizAnswer(this, false, 'Recognition is not sufficient. Memorizing text is not the same as having a working model.')">A) Rote memorization of domain definitions.</button>
              <button onclick="checkQuizAnswer(this, true, 'Correct. Isolating key variables allows us to model system behavior and make optimized predictions.')">B) Filtering out noise to isolate critical variables for state modeling and predictions.</button>
              <button onclick="checkQuizAnswer(this, false, 'No. Simply compiling logs without action is a passive storage mechanism, not a logical operation.')">C) Gathering resources and compiling folders in the vault.</button>
            </div>
            <div id="quiz-feedback" class="feedback" aria-live="polite"></div>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-btn" onclick="switchTab('example')">&larr; Back: Worked Example</button>
            <button class="nav-btn primary" onclick="switchTab('lab')">Next: Practice Lab &rarr;</button>
          </div>
        </section>
      </div>

      <!-- Lab Tab -->
      <div id="lab" class="tab-content">
        <section>
          <h2>5. Capstone Practice Lab</h2>
          <p>Write an explanation of <strong>{safe_title}</strong> from memory. Your explanation should contain: 1) a definition of the concept, 2) when/where it applies, and 3) how to check if the concept is working properly.</p>
          
          <textarea id="exercise" placeholder="Write your explanation here from memory..."></textarea>
          <div id="exercise-feedback" class="feedback"></div>
          
          <div style="margin-top: 14px; display: flex; gap: 10px;">
            <button class="action-btn" id="check-exercise" onclick="validateExercise()">Verify Competency</button>
            <button class="action-btn" id="show-coach" onclick="toggleCoaching()">Show Coaching Criteria</button>
          </div>
          
          <div id="coach" class="card" style="display:none; margin-top:14px;">
            <h3>Coaching Criteria</h3>
            <ul>
              <li><strong>Definition:</strong> Did you explain what the concept is in your own words?</li>
              <li><strong>Applicability:</strong> Did you specify a situation or problem where it applies?</li>
              <li><strong>Falsifiability Check:</strong> Did you mention a check to prove the explanation?</li>
            </ul>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-btn" onclick="switchTab('retrieval')">&larr; Back: Quiz</button>
            <button class="nav-btn primary" onclick="switchTab('reference')">Next: Reference &rarr;</button>
          </div>
        </section>
      </div>

      <!-- Reference & Sources Tab -->
      <div id="reference" class="tab-content">
        <section>
          <h2>6. Reference & Primary Sources</h2>
          <p>Consolidated data reference sheet for ongoing reviews and active recall setups.</p>
          
          <div class="term"><strong>Definition</strong><span>The structural framework for domains relating to {lower_title}.</span></div>
          <div class="term"><strong>Key Parameters</strong><span>Inputs (X), Constraints (limits), Multipliers (optimizations).</span></div>
          <div class="term"><strong>Next Steps</strong><span>Ask Ater Teacher to build custom practice decks on this topic in your practice tab.</span></div>

          <h3 style="margin-top:28px;">Primary Source Citations</h3>
          <p class="source">Resource curation is pending for this workspace. Ater Teacher automatically verifies primary documents from your Obsidian Vault before citing specific textbooks or academic papers. Ask Teacher to parse a local PDF/source text to link directly to primary materials.</p>
          
          <div class="nav-buttons">
            <button class="nav-btn" onclick="switchTab('lab')">&larr; Back: Practice Lab</button>
            <button class="nav-btn primary" onclick="window.parent.postMessage({{ type: 'NEXT_NOTE' }}, '*')">Next Chapter &rarr;</button>
          </div>
        </section>
      </div>
    </main>
  </div>

  <script>
    function switchTab(tabId) {{
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      const targetContent = document.getElementById(tabId);
      if (targetContent) {{
        targetContent.classList.add('active');
        window.scrollTo({{ top: 0, behavior: 'smooth' }});
      }}
    }}

    function updateSimulation() {{
      const val = parseInt(document.getElementById('var-input').value);
      const mult = parseInt(document.getElementById('multiplier').value);
      const result = val * mult;
      
      document.getElementById('sim-output-val').textContent = "Current Output: " + result;
      
      const bar = document.getElementById('sim-bar');
      const percentage = Math.min((result / 300) * 100, 100);
      bar.style.width = percentage + '%';
      
      if (percentage > 80) {{
        bar.style.background = 'var(--good)';
      }} else if (percentage > 40) {{
        bar.style.background = 'var(--warn)';
      }} else {{
        bar.style.background = 'var(--bad)';
      }}
    }}

    function checkQuizAnswer(btn, isCorrect, msg) {{
      document.querySelectorAll('.choices button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      const feedback = document.getElementById('quiz-feedback');
      feedback.className = 'feedback ' + (isCorrect ? 'good' : 'bad');
      feedback.textContent = msg;
    }}

    function validateExercise() {{
      const text = document.getElementById('exercise').value.trim();
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      const feedback = document.getElementById('exercise-feedback');
      
      const hasUse = /use|when|apply|example|case|decide|helps|problem|where/i.test(text);
      const hasCheck = /check|test|prove|verify|if|whether|evaluate/i.test(text);
      const ok = sentences.length >= 3 && hasUse && hasCheck;
      
      feedback.className = 'feedback ' + (ok ? 'good' : 'bad');
      feedback.textContent = ok
        ? 'Competency Check Passed. You have correctly structured a definition, application use-case, and a verification boundary in your explanation. Continue practice.'
        : 'Structure check failed. Try typing at least three sentences. Ensure you include a definition, when to use it, and how to verify if it works.';
    }}

    function toggleCoaching() {{
      const coach = document.getElementById('coach');
      coach.style.display = coach.style.display === 'none' ? 'block' : 'none';
    }}

    // Initialize simulation
    updateSimulation();
  </script>
</body>
</html>
"""

    def _render_lesson_html(
        self,
        lesson_title: str,
        prompt: str,
        markdown_content: str,
        section_number: int = 1,
        total_sections: int = 1,
    ) -> str:
        safe_title = html.escape(lesson_title)
        safe_prompt = html.escape(prompt.strip() or lesson_title)
        safe_markdown = html.escape(markdown_content)
        proving_grounds = _extract_markdown_section(markdown_content, "The Proving Grounds")
        quiz_items = _extract_quiz_items(proving_grounds)
        quiz_html = self._render_quiz_html(quiz_items)
        
        # Clean and render the entire markdown body
        body = _strip_frontmatter(markdown_content)
        body_no_quiz = re.sub(r'```interactive-quiz\s*\n.*?\n```', '', body, flags=re.DOTALL | re.IGNORECASE)
        body_no_quiz = re.sub(r'^##\s+The Proving Grounds\s*$', '', body_no_quiz, flags=re.MULTILINE | re.IGNORECASE)
        lesson_body_html = _markdown_fragment_to_html(body_no_quiz.strip())

        progress = int((section_number / max(total_sections, 1)) * 100)
        next_label = "Next Chapter" if section_number < total_sections else "Finish Path"
        return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{safe_title}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #111113;
      --panel: #151517;
      --surface: #18181b;
      --surface-2: #202024;
      --line: #2b2b30;
      --line-strong: #3a3a40;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --soft: #d4d4d8;
      --good: #8bd49c;
      --warn: #f4c06a;
      --bad: #ff8f8f;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background: transparent;
      color: var(--text);
      font-family: Outfit, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.58;
    }}
    .lesson-shell {{
      min-height: 100vh;
      padding: 34px 28px 48px;
      background: var(--bg);
    }}
    .lesson-frame {{
      max-width: 920px;
      margin: 0 auto;
    }}
    .lesson-topbar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }}
    .lesson-kicker {{
      margin: 0 0 4px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }}
    h1 {{
      margin: 0;
      font-size: 34px;
      line-height: 1.08;
      letter-spacing: 0;
      text-wrap: balance;
    }}
    .chapter-chip {{
      min-width: 116px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px 12px;
      text-align: right;
      color: var(--soft);
      font-size: 12px;
      font-weight: 800;
      background: var(--surface);
    }}
    .progress-track {{
      height: 4px;
      border-radius: 999px;
      overflow: hidden;
      background: #0f0f10;
      border: 1px solid var(--line);
      margin: 0 0 22px;
    }}
    .progress-fill {{
      width: {progress}%;
      height: 100%;
      background: var(--soft);
    }}
    .page-container {{ display: none; }}
    .page-container.active {{ display: block; }}
    .lesson-card {{
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
      padding: 28px;
      margin-bottom: 18px;
    }}
    h2 {{
      margin: 0 0 16px;
      color: var(--text);
      font-size: 20px;
      line-height: 1.2;
      letter-spacing: 0;
      text-wrap: balance;
    }}
    h3 {{
      margin: 20px 0 8px;
      color: var(--soft);
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }}
    p, li {{
      color: var(--soft);
      font-size: 15px;
      max-width: 72ch;
    }}
    strong {{ color: var(--text); }}
    code {{
      border: 1px solid var(--line);
      border-radius: 4px;
      background: #101011;
      padding: 1px 5px;
      color: var(--text);
      font-size: .92em;
    }}
    .wiki-link {{
      display: inline-flex;
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 0 5px;
      color: var(--text);
      background: var(--surface);
      font-size: .94em;
    }}
    .section-body {{
      display: grid;
      gap: 12px;
    }}
    .section-body p {{
      margin: 0;
    }}
    .code-block {{
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #101011;
      padding: 14px;
      color: var(--soft);
      font-size: 12px;
      line-height: 1.55;
    }}
    .prompt-note {{
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 6px;
      padding: 14px 16px;
      color: var(--muted);
      font-size: 13px;
      margin: 18px 0 0;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 18px;
    }}
    .mini-card {{
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 6px;
      padding: 16px;
    }}
    .diagram {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 18px;
    }}
    .diagram span {{
      display: grid;
      min-height: 82px;
      place-items: center;
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 6px;
      padding: 12px;
      color: var(--soft);
      font-size: 12px;
      font-weight: 800;
      text-align: center;
    }}
    .quiz-options {{
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }}
    button {{
      font: inherit;
    }}
    .option, .nav-btn, .action-btn {{
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--text);
      border-radius: 6px;
      cursor: pointer;
      transition: border-color .16s ease, background .16s ease, color .16s ease;
    }}
    .option {{
      width: 100%;
      padding: 12px 14px;
      text-align: left;
      font-size: 13px;
    }}
    .option:hover, .nav-btn:hover, .action-btn:hover {{
      border-color: var(--line-strong);
      background: var(--surface-2);
    }}
    .option.correct {{
      border-color: rgba(139,212,156,.75);
      background: rgba(139,212,156,.12);
    }}
    .option.incorrect {{
      border-color: rgba(255,143,143,.75);
      background: rgba(255,143,143,.12);
    }}
    .feedback {{
      display: none;
      margin-top: 12px;
      border: 1px solid var(--line);
      background: #101011;
      border-radius: 6px;
      padding: 12px 14px;
      color: var(--soft);
      font-size: 13px;
    }}
    .feedback.visible {{ display: block; }}
    .quiz-card {{
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 6px;
      padding: 16px;
      margin-top: 14px;
    }}
    textarea {{
      width: 100%;
      min-height: 150px;
      resize: vertical;
      border: 1px solid var(--line);
      background: #101011;
      color: var(--text);
      border-radius: 6px;
      padding: 14px;
      font: inherit;
      outline: none;
    }}
    textarea:focus {{
      border-color: var(--line-strong);
    }}
    .checklist {{
      display: grid;
      gap: 8px;
      margin-top: 14px;
    }}
    .checklist div {{
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px 12px;
      color: var(--muted);
      font-size: 13px;
      background: var(--surface);
    }}
    .checklist .pass {{ color: var(--good); }}
    .checklist .miss {{ color: var(--bad); }}
    .markdown-source {{
      max-height: 54vh;
      overflow: auto;
      white-space: pre-wrap;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #101011;
      color: var(--soft);
      padding: 18px;
      font-family: "SFMono-Regular", ui-monospace, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.6;
    }}
    .nav-row {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid var(--line);
      margin-top: 24px;
      padding-top: 18px;
    }}
    .nav-btn, .action-btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 9px 14px;
      color: var(--soft);
      font-size: 12px;
      font-weight: 800;
    }}
    .nav-btn.primary, .action-btn.primary {{
      background: var(--text);
      border-color: var(--text);
      color: #111113;
    }}
    @media (max-width: 760px) {{
      .lesson-shell {{ padding: 18px 14px 30px; }}
      .lesson-topbar {{ align-items: flex-start; flex-direction: column; }}
      .chapter-chip {{ text-align: left; }}
      h1 {{ font-size: 28px; }}
      .lesson-card {{ padding: 20px; }}
      .grid, .diagram {{ grid-template-columns: 1fr; }}
    }}
    @media (prefers-reduced-motion: reduce) {{
      * {{ scroll-behavior: auto !important; transition: none !important; }}
    }}
  </style>
</head>
<body>
  <main class="lesson-shell">
    <div class="lesson-frame">
      <header class="lesson-topbar">
        <div>
          <p class="lesson-kicker">Ater Teacher · Atomic Lesson</p>
          <h1>{safe_title}</h1>
        </div>
        <div class="chapter-chip">Chapter {section_number} / {total_sections}</div>
      </header>
      <div class="progress-track" aria-hidden="true"><div class="progress-fill"></div></div>

      <section class="page-container active">
        <div class="lesson-card">
          <div class="section-body">{lesson_body_html}</div>
          <div class="prompt-note">Original request: {safe_prompt}</div>
          <div class="nav-row"><span></span><button class="nav-btn primary" onclick="navigateToNextPage()">Next: Take Quiz &rarr;</button></div>
        </div>
      </section>

      <section class="page-container">
        <div class="lesson-card">
          <h2>The Proving Grounds</h2>
          <p>Answer from memory before checking. These questions are generated from the `interactive-quiz` block stored in the Markdown note.</p>
          {quiz_html}
          <h3>Practice Lab</h3>
          <p>Write a compact explanation from memory. Include what the concept is, why it exists, how it changes state, and what mistake would break the invariant.</p>
          <textarea id="practice-answer" placeholder="Explain the chapter from memory..."></textarea>
          <div style="margin-top: 12px;"><button class="action-btn primary" onclick="validatePractice()">Check answer</button></div>
          <div id="practice-checklist" class="checklist" aria-live="polite"></div>
          <div class="nav-row"><button class="nav-btn" onclick="navigateToPreviousPage()">&larr; Back to Lesson</button><button class="nav-btn primary" onclick="navigateToNextPage()">Next: View Source &rarr;</button></div>
        </div>
      </section>

      <section class="page-container">
        <div class="lesson-card">
          <h2>Markdown Source</h2>
          <p>This is the complete vault note used to generate the lesson. If the Markdown is weak, the lesson is weak, so the source remains visible and reviewable.</p>
          <pre class="markdown-source" data-markdown-source>{safe_markdown}</pre>
          <div class="nav-row">
            <button class="nav-btn" onclick="navigateToPreviousPage()">&larr; Back to Quiz</button>
            <button class="nav-btn primary" onclick="window.parent.postMessage({{ type: 'NEXT_NOTE' }}, '*')">{next_label}</button>
          </div>
        </div>
      </section>
    </div>
  </main>
  <script>
    function getPages() {{
      return Array.from(document.querySelectorAll('.page-container'));
    }}
    function showPage(index) {{
      const pages = getPages();
      pages.forEach((page, pageIndex) => page.classList.toggle('active', pageIndex === index));
      window.scrollTo({{ top: 0, behavior: 'smooth' }});
    }}
    function navigateToNextPage() {{
      const pages = getPages();
      const curr = pages.findIndex(page => page.classList.contains('active'));
      if (curr !== -1 && curr < pages.length - 1) showPage(curr + 1);
    }}
    function navigateToPreviousPage() {{
      const pages = getPages();
      const curr = pages.findIndex(page => page.classList.contains('active'));
      if (curr > 0) showPage(curr - 1);
    }}
    function selectOption(button, correct) {{
      const quiz = button.closest('[data-quiz]');
      const buttons = Array.from(quiz.querySelectorAll('.option'));
      buttons.forEach(option => {{
        option.disabled = true;
        option.classList.remove('correct', 'incorrect');
      }});
      button.classList.add(correct ? 'correct' : 'incorrect');
      const feedback = quiz.parentElement.querySelector('[data-feedback]');
      feedback.classList.add('visible');
      feedback.textContent = button.dataset.explanation || (correct
        ? 'Correct. Use this answer as the retrieval anchor for the chapter.'
        : 'Not enough. Re-open the Markdown source and identify the invariant this chapter is protecting.');
    }}
    function validatePractice() {{
      const text = document.getElementById('practice-answer').value.toLowerCase();
      const checks = [
        ['Definition', /is|means|refers|represents|system|model/.test(text)],
        ['Purpose', /why|because|so that|helps|prevents|allows/.test(text)],
        ['Mechanism', /how|state|change|step|operation|process/.test(text)],
        ['Failure mode', /mistake|break|fail|wrong|risk|conflict|error/.test(text)]
      ];
      const target = document.getElementById('practice-checklist');
      target.innerHTML = checks.map(([label, pass]) => `<div class="${{pass ? 'pass' : 'miss'}}">${{pass ? 'Passed' : 'Missing'}}: ${{label}}</div>`).join('');
    }}
  </script>
</body>
</html>
"""

    def _render_quiz_html(self, quiz_items: List[Dict[str, Any]]) -> str:
        if not quiz_items:
            return '<div class="quiz-card"><p>No quiz items were found in the Markdown source.</p></div>'
        cards: List[str] = []
        for index, item in enumerate(quiz_items, start=1):
            answer = str(item.get("answer", ""))
            explanation = html.escape(str(item.get("explanation", "")))
            options = []
            for option in item.get("options", []):
                option_text = str(option)
                is_correct = option_text == answer
                options.append(
                    '<button class="option" '
                    f'onclick="selectOption(this, {str(is_correct).lower()})" '
                    f'data-explanation="{explanation}">{html.escape(option_text)}</button>'
                )
            cards.append(
                "\n".join(
                    [
                        '<div class="quiz-card">',
                        f"<h3>Question {index}</h3>",
                        f"<p>{html.escape(str(item.get('question', '')))}</p>",
                        '<div class="quiz-options" data-quiz>',
                        *options,
                        "</div>",
                        '<div class="feedback" data-feedback></div>',
                        "</div>",
                    ]
                )
            )
        return "\n".join(cards)
