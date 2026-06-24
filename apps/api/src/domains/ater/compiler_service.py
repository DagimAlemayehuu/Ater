import os
import re
import json
from pathlib import Path
import frontmatter
import markdown2

def normalize_title(title: str) -> str:
    """Normalizes titles by replacing spaces/underscores with a single underscore,
    and capitalizing the first letter of each word (TitleCase)."""
    if not title:
        return ""
    cleaned = re.sub(r'[\s_]+', ' ', title).strip()
    words = cleaned.split(' ')
    capitalized_words = [w[0].upper() + w[1:] if w else "" for w in words]
    return "_".join(capitalized_words)

class AterLessonCompiler:
    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path).resolve()

    def parse_note(self, note_path: Path) -> tuple[dict, dict]:
        """Parses the Markdown content of an Atomic Note and extracts its four canonical sections."""
        note_path = Path(note_path)
        if not note_path.is_absolute():
            note_path = (self.vault_path / note_path).resolve()
        else:
            note_path = note_path.resolve()

        if not note_path.exists():
            raise FileNotFoundError(f"Note file not found: {note_path}")


        raw_text = note_path.read_text(encoding="utf-8")
        
        # Parse YAML frontmatter
        try:
            post = frontmatter.loads(raw_text)
            metadata = post.metadata
            content = post.content
        except Exception:
            metadata = {}
            content = raw_text

        # Extract sections using ## header markers
        lines = content.split('\n')
        sections = []
        current_header = None
        current_lines = []

        for line in lines:
            match = re.match(r'^##\s+(.*?)\s*$', line)
            if match:
                if current_header is not None or current_lines:
                    sections.append((current_header, '\n'.join(current_lines)))
                current_header = match.group(1).strip()
                current_lines = []
            else:
                current_lines.append(line)

        if current_header is not None or current_lines:
            sections.append((current_header, '\n'.join(current_lines)))

        parsed = {
            "mental_model": {"title": "Mental Model", "content": ""},
            "h1": {"title": "", "content": ""},
            "h2": {"title": "", "content": ""},
            "proving_grounds": {"title": "The Proving Grounds", "content": ""},
            "raw_markdown": raw_text
        }

        other_sections = []
        for header, body in sections:
            if not header:
                continue
            header_lower = header.lower()
            if "mental" in header_lower and "model" in header_lower:
                parsed["mental_model"] = {"title": header, "content": body.strip()}
            elif "proving" in header_lower and "ground" in header_lower:
                parsed["proving_grounds"] = {"title": header, "content": body.strip()}
            else:
                other_sections.append({"title": header, "content": body.strip()})

        # Set H1 and H2 with fallbacks
        if len(other_sections) > 0:
            parsed["h1"] = other_sections[0]
        else:
            parsed["h1"] = {"title": "Core Mechanism", "content": ""}

        if len(other_sections) > 1:
            parsed["h2"] = other_sections[1]
        else:
            parsed["h2"] = {"title": "Key Details", "content": ""}

        # Handle any extra sections by appending to H2
        if len(other_sections) > 2:
            for extra in other_sections[2:]:
                parsed["h2"]["content"] += f"\n\n## {extra['title']}\n\n{extra['content']}"

        return parsed, metadata

    def resolve_navigation(self, note_path: Path, metadata: dict) -> dict:
        """Resolves previous note, next note, chapter, and hub navigation links."""
        note_path = Path(note_path).resolve()
        result = {
            "prev_note_path": "",
            "prev_note_title": "",
            "next_note_path": "",
            "next_note_title": "",
            "chapter_title": "",
            "hub_path": "",
            "hub_title": "",
            "lesson_index": 1,
            "lesson_total": 1
        }

        # Determine Hub Title and Chapter Title from frontmatter/directories
        hub_link = metadata.get("hub") or ""
        chapter_link = metadata.get("chapter") or ""

        # Normalize names (stripping wikilinks syntax [[...]])
        hub_name = re.sub(r"[\[\]]+", "", hub_link).strip()
        chapter_name = re.sub(r"[\[\]]+", "", chapter_link).strip()

        result["hub_title"] = hub_name
        result["chapter_title"] = chapter_name

        # 1. Resolve Hub Path
        if hub_name:
            # Look in standard directories
            for search_dir in ["database/learning paths", "database/study planner"]:
                hub_file = self.vault_path / search_dir / f"{hub_name}.md"
                if hub_file.exists():
                    # Calculate relative path from compiled HTML lesson folder (lessons/) to the hub file
                    html_folder = note_path.parent / "lessons"
                    rel_path = os.path.relpath(hub_file, html_folder)
                    result["hub_path"] = rel_path
                    break

        # 2. Resolve Chapter File & Previous/Next Notes
        if chapter_name:
            chapter_file = None
            # Look in note's parent directories or search recursively
            for search_path in [note_path.parent / f"{chapter_name}.md", note_path.parent / f"Chapter_{chapter_name}.md"]:
                if search_path.exists():
                    chapter_file = search_path
                    break

            if not chapter_file:
                # Recursive search in vault
                for p in self.vault_path.rglob("*.md"):
                    if p.name == f"{chapter_name}.md" or p.name == f"Chapter_{chapter_name}.md" or p.stem == chapter_name:
                        chapter_file = p
                        break

            if chapter_file and chapter_file.exists():
                try:
                    ch_post = frontmatter.loads(chapter_file.read_text(encoding="utf-8"))
                    atomic_notes = ch_post.metadata.get("atomic_notes") or []
                    cleaned_notes = [re.sub(r"[\[\]]+", "", note).strip() for note in atomic_notes]
                    
                    current_stem = note_path.stem
                    current_title = metadata.get("title") or current_stem

                    # Try to locate the current note in chapter's list
                    index = -1
                    for idx, n in enumerate(cleaned_notes):
                        if n.lower() == current_stem.lower() or n.lower() == current_title.lower() or normalize_title(n).lower() == normalize_title(current_stem).lower():
                            index = idx
                            break

                    if index != -1:
                        result["lesson_index"] = index + 1
                        result["lesson_total"] = len(cleaned_notes)
                        
                        if index > 0:
                            prev_name = cleaned_notes[index - 1]
                            result["prev_note_title"] = prev_name
                            result["prev_note_path"] = f"./{normalize_title(prev_name)}"
                        if index < len(cleaned_notes) - 1:
                            next_name = cleaned_notes[index + 1]
                            result["next_note_title"] = next_name
                            result["next_note_path"] = f"./{normalize_title(next_name)}"
                except Exception:
                    pass

        return result

    def compile_to_html(self, note_path: Path, variant: str) -> str:
        """Compiles note to an offline-runnable HTML file using the requested learning variant."""
        parsed, metadata = self.parse_note(note_path)
        nav = self.resolve_navigation(note_path, metadata)

        title = metadata.get("title") or note_path.stem
        clean_title = title.replace("_", " ")

        # Parse sections to HTML using markdown2
        mental_model_html = markdown2.markdown(parsed["mental_model"]["content"], extras=["fenced-code-blocks", "tables"])
        h1_html = markdown2.markdown(parsed["h1"]["content"], extras=["fenced-code-blocks", "tables"])
        h2_html = markdown2.markdown(parsed["h2"]["content"], extras=["fenced-code-blocks", "tables"])

        # Parse Proving Grounds questions
        quiz_json = []
        proving_grounds_text = parsed["proving_grounds"]["content"]
        
        # Try to find a JSON block or quiz block
        quiz_match = re.search(r'```(?:interactive-quiz|json)?\s*(\[.*?\])\s*```', proving_grounds_text, re.DOTALL)
        if quiz_match:
            try:
                quiz_json = json.loads(quiz_match.group(1))
            except Exception:
                pass

        # Build custom variant layout content
        content_html = ""
        
        if variant == "simple":
            content_html = f"""
            <section class="page-container active">
              <div class="lesson-card">
                <div class="section-body">
                  <h2>Mental Model</h2>
                  {mental_model_html}
                  <h2>{parsed["h1"]["title"]} (Core Idea)</h2>
                  <p><strong>{clean_title}</strong> in simple terms focuses on the foundational rules and concepts.</p>
                  <h2>Key Definitions</h2>
                  <ul>
                    <li><strong>{parsed["h1"]["title"]}</strong>: {parsed["h1"]["title"]} provides the core mechanism for this topic.</li>
                    <li><strong>{parsed["h2"]["title"]}</strong>: {parsed["h2"]["title"]} provides the textbook model.</li>
                  </ul>
                </div>
                <div class="nav-row">
                  <span></span>
                  <button class="nav-btn primary" onclick="navigateToNextPage()">Next: Take Quiz &rarr;</button>
                </div>
              </div>
            </section>
            """
        elif variant == "cram":
            # Extract high-yield bullets
            bullets_1 = [line.strip() for line in parsed["h1"]["content"].split('\n') if line.strip().startswith('-') or line.strip().startswith('*')]
            bullets_2 = [line.strip() for line in parsed["h2"]["content"].split('\n') if line.strip().startswith('-') or line.strip().startswith('*')]
            
            bullets_html = ""
            if bullets_1 or bullets_2:
                bullets_html += "<ul>"
                for b in (bullets_1 + bullets_2)[:6]:  # Limit to top 6 bullets
                    bullets_html += f"<li>{b.lstrip('-* ')}</li>"
                bullets_html += "</ul>"
            else:
                bullets_html = f"<p>Active Recall Summary: Focus heavily on definitions and Proving Grounds questions below.</p>"

            content_html = f"""
            <section class="page-container active">
              <div class="lesson-card">
                <div class="section-body">
                  <h2>Cram Sheet: {clean_title}</h2>
                  <h3>Mental Model Summary</h3>
                  {mental_model_html}
                  <h3>High-Yield Bullet Highlights</h3>
                  {bullets_html}
                </div>
                <div class="nav-row">
                  <span></span>
                  <button class="nav-btn primary" onclick="navigateToNextPage()">Next: Take Quiz &rarr;</button>
                </div>
              </div>
            </section>
            """
        elif variant == "exam":
            # Show only quiz, hide explanations
            content_html = ""
        else: # deep (default)
            content_html = f"""
            <section class="page-container active">
              <div class="lesson-card">
                <div class="section-body">
                  <h2>{parsed["mental_model"]["title"]}</h2>
                  {mental_model_html}
                  <h2>{parsed["h1"]["title"]}</h2>
                  {h1_html}
                  <h2>{parsed["h2"]["title"]}</h2>
                  {h2_html}
                </div>
                <div class="nav-row">
                  <span></span>
                  <button class="nav-btn primary" onclick="navigateToNextPage()">Next: Take Quiz &rarr;</button>
                </div>
              </div>
            </section>
            """

        # Generate Quiz Page HTML
        quiz_html = ""
        if quiz_json:
            for idx, q in enumerate(quiz_json):
                q_id = q.get("id") or f"q{idx+1}"
                q_type = q.get("type") or "multiple-choice"
                question = q.get("question") or ""
                explanation = q.get("explanation") or "No explanation available."
                
                # Check for options
                options = q.get("options") or []
                
                quiz_html += f"""
                <div class="quiz-card" data-quiz-id="{q_id}">
                  <h3>Question {idx + 1}</h3>
                  <p>{question}</p>
                """
                
                if isinstance(options, list) and options:
                    quiz_html += '<div class="quiz-options" data-quiz>'
                    for opt in options:
                        is_correct = "true" if opt == q.get("answer") else "false"
                        quiz_html += f"""
                        <button class="option" onclick="selectOption(this, {is_correct})" data-explanation="{explanation}">{opt}</button>
                        """
                    quiz_html += '</div>'
                elif isinstance(options, dict) and options:
                    quiz_html += '<div class="quiz-options" data-quiz>'
                    for key, val in options.items():
                        is_correct = "true" if key == q.get("answer") else "false"
                        quiz_html += f"""
                        <button class="option" onclick="selectOption(this, {is_correct})" data-explanation="{explanation}"><strong>{key}</strong>: {val}</button>
                        """
                    quiz_html += '</div>'
                else:
                    # Write in answer/scenario
                    ans = q.get("answer") or ""
                    quiz_html += f"""
                    <div style="margin-top: 10px;">
                      <textarea id="quiz-write-{q_id}" placeholder="Write your answer here..."></textarea>
                      <button class="action-btn primary" style="margin-top: 10px;" onclick="showWritingExplanation('{q_id}', '{explanation}')">Reveal Explanation</button>
                      <div class="feedback" id="feedback-{q_id}"></div>
                    </div>
                    """
                
                quiz_html += f"""
                  <div class="feedback" data-feedback></div>
                </div>
                """

        # For exam variant, page 1 is the quiz page directly!
        quiz_page_active = "active" if variant == "exam" else ""
        
        quiz_section_html = f"""
        <section class="page-container {quiz_page_active}">
          <div class="lesson-card">
            <h2>The Proving Grounds</h2>
            <p>Answer from memory before checking. These questions are generated from the `interactive-quiz` block stored in the Markdown note.</p>
            {quiz_html}
            
            <h3>Practice Lab</h3>
            <p>Write a compact explanation from memory. Include what the concept is, why it exists, how it changes state, and what mistake would break the invariant.</p>
            <textarea id="practice-answer" placeholder="Explain the chapter from memory..."></textarea>
            <div style="margin-top: 12px;">
              <button class="action-btn primary" onclick="validatePractice()">Check answer</button>
            </div>
            <div id="practice-checklist" class="checklist" aria-live="polite"></div>
            
            <div class="nav-row">
              {"<button class='nav-btn' onclick='navigateToPreviousPage()'>&larr; Back to Lesson</button>" if variant != "exam" else "<span></span>"}
              <button class="nav-btn primary" onclick="navigateToNextPage()">Next: View Source &rarr;</button>
            </div>
          </div>
        </section>
        """

        # Navigation Header/Footer
        prev_btn_html = ""
        if nav["prev_note_path"]:
            prev_btn_html = f"""
            <a class="nav-btn" href="{nav["prev_note_path"]}.{variant}.html">&larr; Prev Lesson</a>
            """
        else:
            prev_btn_html = "<span></span>"

        next_btn_html = ""
        if nav["next_note_path"]:
            next_btn_html = f"""
            <a class="nav-btn primary" href="{nav["next_note_path"]}.{variant}.html">Next Lesson &rarr;</a>
            """
        else:
            next_btn_html = f"""
            <button class="nav-btn primary" onclick="window.parent.postMessage({{ type: 'NEXT_NOTE' }}, '*')">Next Chapter</button>
            """

        hub_link_html = ""
        if nav["hub_path"]:
            hub_link_html = f"""
            <a href="{nav["hub_path"]}" style="color: var(--muted); font-size: 12px; text-decoration: none;">&larr; Back to Hub: {nav["hub_title"]}</a>
            """

        # Full HTML Template
        html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{clean_title}</title>
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
    @media (prefers-color-scheme: light) {{
      :root {{
        color-scheme: light;
        --bg: #fafafa;
        --panel: #ffffff;
        --surface: #f4f4f5;
        --surface-2: #e4e4e7;
        --line: #e4e4e7;
        --line-strong: #d4d4d8;
        --text: #18181b;
        --muted: #71717a;
        --soft: #27272a;
        --good: #16a34a;
        --warn: #ca8a04;
        --bad: #dc2626;
      }}
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
      width: {int((nav["lesson_index"] / max(1, nav["lesson_total"])) * 100)}%;
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
      text-decoration: none;
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
          <p class="lesson-kicker">Ater Teacher · {"Exam Mode" if variant == "exam" else "Atomic Lesson"}</p>
          <h1>{clean_title}</h1>
          {hub_link_html}
        </div>
        <div class="chapter-chip">Chapter {nav["lesson_index"]} / {nav["lesson_total"]}</div>
      </header>
      <div class="progress-track" aria-hidden="true"><div class="progress-fill"></div></div>

      {content_html}

      {quiz_section_html}

      <section class="page-container">
        <div class="lesson-card">
          <h2>Markdown Source</h2>
          <p>This is the complete vault note used to generate the lesson. If the Markdown is weak, the lesson is weak, so the source remains visible and reviewable.</p>
          <pre class="markdown-source" data-markdown-source>{parsed["raw_markdown"]}</pre>
          <div class="nav-row">
            <button class="nav-btn" onclick="navigateToPreviousPage()">&larr; Back to Quiz</button>
            <div style="display: flex; gap: 8px;">
              {prev_btn_html}
              {next_btn_html}
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
  
  <script type="text/markdown" id="raw-markdown-source">{parsed["raw_markdown"]}</script>

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
    function selectOption(button, correct) {
      const quiz = button.closest('[data-quiz]');
      const buttons = Array.from(quiz.querySelectorAll('.option'));
      buttons.forEach(option => {
        option.disabled = true;
        option.classList.remove('correct', 'incorrect');
      });
      button.classList.add(correct ? 'correct' : 'incorrect');
      const feedback = quiz.parentElement.querySelector('[data-feedback]');
      feedback.classList.add('visible');
      feedback.textContent = button.dataset.explanation || (correct
        ? 'Correct. Use this answer as the retrieval anchor for the chapter.'
        : 'Not enough. Re-open the Markdown source and identify the invariant this chapter is protecting.');
      
      const quizCard = button.closest('.quiz-card');
      const quizId = quizCard ? quizCard.dataset.quizId : 'unknown';
      const wager = confirm("Are you highly confident in this answer?") ? "high" : "low";
      window.parent.postMessage({
        type: 'ANSWER_SUBMITTED',
        payload: {
          question_id: quizId,
          is_correct: correct,
          wager: wager,
          user_answer: button.textContent || ''
        }
      }, '*');
    }
    function showWritingExplanation(qId, explanation) {
      const feedback = document.getElementById('feedback-' + qId);
      feedback.textContent = explanation;
      feedback.classList.add('visible');
      
      const textarea = document.getElementById('quiz-write-' + qId);
      const user_ans = textarea ? textarea.value : '';
      const wager = confirm("Are you highly confident in this answer?") ? "high" : "low";
      window.parent.postMessage({
        type: 'ANSWER_SUBMITTED',
        payload: {
          question_id: qId,
          is_correct: false,
          wager: wager,
          user_answer: user_ans
        }
      }, '*');
    }
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
        return html

    def compile_lesson(self, note_path: Path, variant: str) -> Path:
        """Runs the compile and writes the HTML output to lessons/ subdirectory relative to the note."""
        note_path = Path(note_path)
        if not note_path.is_absolute():
            note_path = (self.vault_path / note_path).resolve()
        else:
            note_path = note_path.resolve()
        html = self.compile_to_html(note_path, variant)

        
        lessons_dir = note_path.parent / "lessons"
        lessons_dir.mkdir(parents=True, exist_ok=True)
        
        output_filename = f"{normalize_title(note_path.stem)}.{variant}.html"
        output_path = lessons_dir / output_filename
        output_path.write_text(html, encoding="utf-8")
        
        # Now update frontmatter lesson_variants field in note
        parsed, metadata = self.parse_note(note_path)
        lesson_variants = metadata.get("lesson_variants") or {}
        if not isinstance(lesson_variants, dict):
            lesson_variants = {}
        
        lesson_variants[variant] = f"lessons/{output_filename}"
        
        # Write back frontmatter and keep the rest of the note
        try:
            post = frontmatter.loads(note_path.read_text(encoding="utf-8"))
            post.metadata["lesson_variants"] = lesson_variants
            note_path.write_text(frontmatter.dumps(post), encoding="utf-8")
        except Exception:
            pass
            
        return output_path
