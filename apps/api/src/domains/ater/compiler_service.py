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
    title = re.sub(r'[\\/:*?"<>|]', '_', title)
    cleaned = re.sub(r'[\s_]+', ' ', title).strip()
    words = cleaned.split(' ')
    capitalized_words = [w[0].upper() + w[1:] if w else "" for w in words]
    return "_".join(capitalized_words)

class AterLessonCompiler:
    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path).resolve()

    def _extract_definitions(self, parsed: dict, clean_title: str) -> list[tuple[str, str]]:
        """Extracts dynamic definitions and key points from the parsed note content."""
        definitions = []
        
        # Clean title to get the core topic/noun term (e.g. "What Is Git" -> "Git")
        core_term = clean_title
        core_term = re.sub(r'^(what is|how to|about|importance of|brief history of|history of)\s+', '', core_term, flags=re.IGNORECASE).strip()
        
        # Combine contents for parsing
        h1_content = parsed.get("h1", {}).get("content", "")
        h2_content = parsed.get("h2", {}).get("content", "")
        mental_content = parsed.get("mental_model", {}).get("content", "")
        combined_text = f"{mental_content}\n{h1_content}\n{h2_content}"
        
        # 1. Search for "<core_term> is/are ..." or "<core_term> refers to ..."
        primary_match = re.search(
            rf'(?:^|\n|[\s.\n])({re.escape(core_term)}\s+(?:is|are|refers\s+to|means)\s+[^.\n]+)',
            combined_text,
            re.IGNORECASE
        )
        if primary_match:
            sentence = primary_match.group(1).strip()
            # Clean sentence trailing punctuation
            sentence = re.sub(r'^[.\s]+|[.\s]+$', '', sentence)
            if len(sentence.split()) <= 20:  # Keep it concise
                definitions.append((core_term, sentence))
        
        # 2. Search for explicit bolded definitions (**Term**: Description) in H1 and H2
        bold_defs = re.findall(r'(?:^|\n)[-*+ \t]*\*\*(.*?)\*\*[:\-]\s*([^\n]+)', h1_content + "\n" + h2_content)
        for term, desc in bold_defs:
            term_clean = term.strip()
            desc_clean = desc.strip()
            if term_clean and desc_clean and len(desc_clean.split()) <= 25:
                # Avoid duplicates
                if not any(t.lower() == term_clean.lower() for t, _ in definitions):
                    definitions.append((term_clean, desc_clean))
        
        # 3. Search for bullet points and parse them
        bullet_lines = []
        for line in (h1_content + "\n" + h2_content).split('\n'):
            line_stripped = line.strip()
            if line_stripped.startswith('-') or line_stripped.startswith('*'):
                bullet_text = re.sub(r'^[-*\s]+', '', line_stripped).strip()
                if bullet_text:
                    bullet_lines.append(bullet_text)
                    
        for bullet in bullet_lines:
            if len(definitions) >= 4:
                break
                
            # If bullet starts with bold text: e.g. **Branch**: description
            bold_start = re.match(r'^\*\*(.*?)\*\*[:\-]\s*(.*)', bullet)
            if bold_start:
                term = bold_start.group(1).strip()
                desc = bold_start.group(2).strip()
                if not any(t.lower() == term.lower() for t, _ in definitions):
                    definitions.append((term, desc))
                continue
                
            # If bullet matches: Term is/are/refers to ...
            match_is = re.match(r'^([A-Z][a-zA-Z0-9_\-\s]{1,30})\s+(?:is|are|refers\s+to|means)\s+(.*)', bullet)
            if match_is:
                term = match_is.group(1).strip()
                desc = match_is.group(2).strip()
                # Check for pronouns
                if term.lower() in ["it", "this", "they", "she", "he"]:
                    term = core_term
                desc_full = f"{term} is {desc}"
                if any(t.lower() == term.lower() for t, _ in definitions):
                    words = desc.split()
                    if words:
                        first_word = words[0].strip(":,.-").capitalize()
                        if len(words) > 1 and first_word.lower() in ["a", "an", "the"]:
                            first_word = words[1].strip(":,.-").capitalize()
                        if first_word and not any(t.lower() == first_word.lower() for t, _ in definitions):
                            term = first_word
                        else:
                            term = f"{core_term} Feature"
                
                if not any(t.lower() == term.lower() for t, _ in definitions):
                    definitions.append((term, desc_full))
                continue
                
            # If bullet matches: Term verb-s ...
            match_verb = re.match(r'^([A-Z][a-zA-Z0-9_\-\s]{1,30})\s+([a-z]+s)\s+(.*)', bullet)
            if match_verb:
                term = match_verb.group(1).strip()
                verb = match_verb.group(2).strip()
                desc = match_verb.group(3).strip()
                if term.lower() in ["it", "this", "they"]:
                    term = core_term
                desc_full = f"{term} {verb} {desc}"
                if any(t.lower() == term.lower() for t, _ in definitions):
                    words = desc.split()
                    if words:
                        first_word = f"{verb.capitalize()} {words[0].strip(':,.-')}"
                        if not any(t.lower() == first_word.lower() for t, _ in definitions):
                            term = first_word
                        else:
                            term = f"{core_term} Capability"
                
                if not any(t.lower() == term.lower() for t, _ in definitions):
                    definitions.append((term, desc_full))
                continue
                
            # Fallback for plain bullet point (use core_term or "Key Concept")
            desc_full = bullet
            # If it starts with a lowercase letter or "it"/"this", prepend the core_term
            if bullet[0].islower() or bullet.lower().startswith("it ") or bullet.lower().startswith("this "):
                cleaned_bullet = re.sub(r'^(it|this)\s+', '', bullet, flags=re.IGNORECASE).strip()
                desc_full = f"{core_term} {cleaned_bullet}"
            
            # Use core_term or first 2 words if core_term is already defined
            if not any(t.lower() == core_term.lower() for t, _ in definitions):
                definitions.append((core_term, desc_full))
            else:
                first_words = " ".join(desc_full.split()[:2]).strip(":,.-")
                if len(first_words) > 3 and not any(t.lower() == first_words.lower() for t, _ in definitions):
                    definitions.append((first_words, desc_full))
                else:
                    definitions.append(("Key Concept", desc_full))
                    
        # 4. Final Fallback if still empty or too short
        if len(definitions) < 2:
            if not any(t.lower() == core_term.lower() for t, _ in definitions):
                definitions.append((core_term, f"The core topic of this interactive lesson."))
            if len(definitions) < 2:
                h1_title = parsed.get("h1", {}).get("title", "Foundational Concept")
                definitions.append((h1_title, f"Important principles to master for {clean_title}."))
                
        return definitions[:3]

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
            defs = self._extract_definitions(parsed, clean_title)
            defs_html = "\n".join([f"                    <li><strong>{t}</strong>: {d}</li>" for t, d in defs])
            content_html = f"""
            <section class="page-container active">
              <div class="lesson-card">
                <div class="section-body">
                  <h2>Mental Model</h2>
                  {mental_model_html}
                  <h2>{parsed["h1"]["title"]} (Core Idea)</h2>
                  {h1_html}
                  <h2>Key Definitions</h2>
                  <ul>
{defs_html}
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
                explanation = q.get("explanation") or "No explanation available."
                
                if q_type == "sql_query_playground":
                    schema_ddl_escaped = q.get("schema_ddl", "").replace("<", "&lt;").replace(">", "&gt;")
                    initial_query = q.get("initial_query", "")
                    quiz_html += f"""
                    <div class="quiz-card" data-quiz-id="{q_id}" data-type="sql_query_playground" data-playground='{json.dumps(q)}'>
                      <h3>SQL Query Playground</h3>
                      <p><strong>Database Schema:</strong></p>
                      <pre class="code-block"><code>{schema_ddl_escaped}</code></pre>
                      <textarea id="sql-query-{q_id}" style="font-family: monospace; min-height: 80px;" placeholder="SELECT...">{initial_query}</textarea>
                      <div style="margin-top: 10px;">
                        <button class="action-btn primary" onclick="runSqlQuery('{q_id}')">Run Query</button>
                      </div>
                      <div class="feedback" id="sql-feedback-{q_id}"></div>
                      <div style="overflow-x: auto; margin-top: 10px;">
                        <table id="sql-table-{q_id}" style="width: 100%; border-collapse: collapse; display: none;">
                          <thead></thead>
                          <tbody></tbody>
                        </table>
                      </div>
                    </div>
                    """
                elif q_type == "simulation_predict":
                    states_json = json.dumps(q.get("states", []))
                    checkpoints_json = json.dumps(q.get("checkpoints", []))
                    quiz_html += f"""
                    <div class="quiz-card" data-quiz-id="{q_id}" data-type="simulation_predict" data-states='{states_json}' data-checkpoints='{checkpoints_json}'>
                      <h3>Simulation Predict</h3>
                      <div id="sim-container-{q_id}">
                        <div id="sim-state-{q_id}" class="mini-card" style="margin-bottom: 10px;"></div>
                        <div id="sim-input-area-{q_id}"></div>
                        <button class="action-btn" id="sim-btn-{q_id}" onclick="advanceSimulation('{q_id}')">Next Step</button>
                      </div>
                      <div class="feedback" id="sim-feedback-{q_id}"></div>
                    </div>
                    """
                elif q_type == "proof_step":
                    steps_json = json.dumps(q.get("steps", []))
                    reasons_json = json.dumps(q.get("reasons", []))
                    correct_order = json.dumps(q.get("correct_order", []))
                    reason_mappings = json.dumps(q.get("reason_mappings", []))
                    quiz_html += f"""
                    <div class="quiz-card" data-quiz-id="{q_id}" data-type="proof_step" 
                         data-steps='{steps_json}' 
                         data-reasons='{reasons_json}'
                         data-correct-order='{correct_order}'
                         data-reason-mappings='{reason_mappings}'>
                      <h3>Proof Builder</h3>
                      <div id="proof-container-{q_id}"></div>
                      <button class="action-btn primary" onclick="checkProof('{q_id}')">Verify Proof</button>
                      <div class="feedback" id="proof-feedback-{q_id}"></div>
                    </div>
                    """
                elif q_type == "evidence_select":
                    selectable_spans = q.get("selectable_spans", [])
                    raw_text = q.get("raw_text", "")
                    sorted_spans = sorted(selectable_spans, key=lambda x: x.get("start", 0))
                    evidence_html = ""
                    last_idx = 0
                    for span in sorted_spans:
                        start = span.get("start", 0)
                        end = span.get("end", 0)
                        span_id = span.get("id")
                        evidence_html += raw_text[last_idx:start].replace("<", "&lt;").replace(">", "&gt;")
                        evidence_html += f'<span class="selectable" data-id="{span_id}" style="cursor: pointer; padding: 2px 4px; border-radius: 4px; border: 1px dashed var(--line); transition: background 0.2s;" onclick="toggleEvidenceSpan(this)">{raw_text[start:end].replace("<", "&lt;").replace(">", "&gt;")}</span>'
                        last_idx = end
                    evidence_html += raw_text[last_idx:].replace("<", "&lt;").replace(">", "&gt;")
                    target_spans = json.dumps(q.get("target_spans", []))
                    quiz_html += f"""
                    <div class="quiz-card" data-quiz-id="{q_id}" data-type="evidence_select" data-target-spans='{target_spans}'>
                      <h3>Evidence Selection</h3>
                      <p>Highlight the spans that represent evidence or contain bugs:</p>
                      <pre class="code-block" style="line-height: 2.2; white-space: pre-wrap;">{evidence_html}</pre>
                      <button class="action-btn primary" onclick="checkEvidence('{q_id}')">Submit Selection</button>
                      <div class="feedback" id="evidence-feedback-{q_id}"></div>
                    </div>
                    """
                elif q_type == "case_simulation":
                    stages_json = json.dumps(q.get("stages", {}))
                    metrics_json = json.dumps(q.get("metrics", {}))
                    success_conditions = json.dumps(q.get("success_conditions", {}))
                    quiz_html += f"""
                    <div class="quiz-card" data-quiz-id="{q_id}" data-type="case_simulation"
                         data-stages='{stages_json}'
                         data-metrics='{metrics_json}'
                         data-success-conditions='{success_conditions}'>
                      <h3>Case Simulation</h3>
                      <div id="case-container-{q_id}">
                        <div style="display: flex; gap: 20px; margin-bottom: 12px;" id="case-metrics-{q_id}"></div>
                        <p id="case-text-{q_id}"></p>
                        <div id="case-choices-{q_id}" style="display: grid; gap: 8px;"></div>
                      </div>
                      <div class="feedback" id="case-feedback-{q_id}"></div>
                    </div>
                    """
                else:
                    # Default question types (multiple-choice or write-in)
                    question = q.get("question") or ""
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
                    elif q_type in ["fill_in", "fill-in", "fill_blank", "fill-in-the-blank"]:
                        answer = str(q.get("answer") or "").replace("'", "\\'")
                        quiz_html += f"""
                        <div style="margin-top: 10px;">
                          <input id="quiz-fill-{q_id}" class="fill-input" placeholder="Type the missing word or phrase..." data-answer="{answer}" />
                          <button class="action-btn primary" style="margin-top: 10px;" onclick="checkFillIn('{q_id}', '{answer}', '{explanation}')">Check Answer</button>
                          <div class="feedback" id="feedback-{q_id}"></div>
                        </div>
                        """
                    else:
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
    .selectable:hover {{
      background: var(--surface-2);
    }}
    .selectable.selected {{
      background: var(--warn);
      color: #111113;
    }}
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
      
      const quizCard = button.closest('.quiz-card');
      const quizId = quizCard ? quizCard.dataset.quizId : 'unknown';
      const wager = confirm("Are you highly confident in this answer?") ? "high" : "low";
      window.parent.postMessage({{
        type: 'ANSWER_SUBMITTED',
        payload: {{
          question_id: quizId,
          is_correct: correct,
          wager: wager,
          user_answer: button.textContent || ''
        }}
      }}, '*');
    }}
    function showWritingExplanation(qId, explanation) {{
      const feedback = document.getElementById('feedback-' + qId);
      feedback.textContent = explanation;
      feedback.classList.add('visible');
      
      const textarea = document.getElementById('quiz-write-' + qId);
      const user_ans = textarea ? textarea.value : '';
      const wager = confirm("Are you highly confident in this answer?") ? "high" : "low";
      window.parent.postMessage({{
        type: 'ANSWER_SUBMITTED',
        payload: {{
          question_id: qId,
          is_correct: false,
          wager: wager,
          user_answer: user_ans
        }}
      }}, '*');
    }}
    function checkFillIn(qId, answer, explanation) {{
      const input = document.getElementById('quiz-fill-' + qId);
      const feedback = document.getElementById('feedback-' + qId);
      const userAnswer = input ? input.value.trim() : '';
      const correct = userAnswer.toLowerCase() === String(answer || '').trim().toLowerCase();
      feedback.textContent = (correct ? 'Correct. ' : 'Not quite. ') + explanation;
      feedback.classList.add('visible');
      feedback.style.color = correct ? 'var(--good)' : 'var(--bad)';
      window.parent.postMessage({{
        type: 'ANSWER_SUBMITTED',
        payload: {{
          question_id: qId,
          is_correct: correct,
          wager: 'low',
          user_answer: userAnswer
        }}
      }}, '*');
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

    // Advanced Artifacts JS Functions

    // 1. SQL Playground
    async function runSqlQuery(qId) {{
      const textarea = document.getElementById('sql-query-' + qId);
      const query = textarea ? textarea.value : '';
      const card = document.querySelector(`[data-quiz-id="\${{qId}}"]`);
      const playgroundData = JSON.parse(card.dataset.playground);
      const feedback = document.getElementById('sql-feedback-' + qId);
      const table = document.getElementById('sql-table-' + qId);

      feedback.classList.remove('visible');
      table.style.display = 'none';

      try {{
        const res = await fetch('/api/ater/playground/sql/evaluate', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{
            playground: playgroundData,
            query: query
          }})
        }});
        const data = await res.json();
        
        feedback.classList.add('visible');
        if (data.success) {{
          feedback.textContent = 'Correct query execution!';
          feedback.style.color = 'var(--good)';
          
          // Render Table
          if (data.dataset && data.dataset.length > 0) {{
            table.style.display = 'table';
            const headers = Object.keys(data.dataset[0]);
            table.querySelector('thead').innerHTML = `<tr>\${{headers.map(h => `<th style="border: 1px solid var(--line); padding: 6px;">\${{h}}</th>`).join('')}}</tr>`;
            table.querySelector('tbody').innerHTML = data.dataset.map(row => 
              `<tr>\${{headers.map(h => `<td style="border: 1px solid var(--line); padding: 6px;">\${{row[h]}}</td>`).join('')}}</tr>`
            ).join('');
          }}
        }} else {{
          feedback.textContent = 'Error: ' + data.error;
          feedback.style.color = 'var(--bad)';
        }}

        window.parent.postMessage({{
          type: 'ANSWER_SUBMITTED',
          payload: {{
            question_id: qId,
            is_correct: data.success,
            wager: 'high',
            user_answer: query
          }}
        }}, '*');
      }} catch (err) {{
        feedback.classList.add('visible');
        feedback.textContent = 'Failed to execute query: ' + err.message;
        feedback.style.color = 'var(--bad)';
      }}
    }}

    // 2. Simulation Predict
    const simStates = {{}};
    function initSimulation(qId) {{
      const card = document.querySelector(`[data-quiz-id="\${{qId}}"]`);
      const states = JSON.parse(card.dataset.states);
      const checkpoints = JSON.parse(card.dataset.checkpoints);
      
      simStates[qId] = {{
        currentStep: 0,
        states: states,
        checkpoints: checkpoints,
        success: true
      }};

      renderSimStep(qId);
    }}

    function renderSimStep(qId) {{
      const sim = simStates[qId];
      const stateDiv = document.getElementById('sim-state-' + qId);
      const inputArea = document.getElementById('sim-input-area-' + qId);
      const btn = document.getElementById('sim-btn-' + qId);
      
      const currState = sim.states[sim.currentStep];
      stateDiv.innerHTML = `<strong>Step \${{sim.currentStep}}:</strong><br>` + 
        Object.entries(currState.vars || {{}}).map(([k, v]) => `\${{k}} = \${{v}}`).join('<br>');
      
      inputArea.innerHTML = '';
      
      // Check if there is a checkpoint for the current step
      const checkpoint = sim.checkpoints.find(cp => cp.step_index === sim.currentStep);
      if (checkpoint) {{
        inputArea.innerHTML = `
          <div style="margin-bottom: 10px;">
            <p>\${{checkpoint.question}}</p>
            <input type="number" id="sim-pred-\${{qId}}" placeholder="Enter prediction for \${{checkpoint.target_var}}">
          </div>
        `;
        btn.textContent = 'Verify Prediction';
      }} else {{
        btn.textContent = sim.currentStep < sim.states.length - 1 ? 'Next Step' : 'Finish Simulation';
      }}
    }}

    function advanceSimulation(qId) {{
      const sim = simStates[qId];
      const feedback = document.getElementById('sim-feedback-' + qId);
      feedback.classList.remove('visible');

      const checkpoint = sim.checkpoints.find(cp => cp.step_index === sim.currentStep);
      if (checkpoint) {{
        const input = document.getElementById('sim-pred-' + qId);
        const prediction = input ? input.value : '';
        if (prediction === '' || parseFloat(prediction) !== parseFloat(checkpoint.expected_value)) {{
          sim.success = false;
          feedback.classList.add('visible');
          feedback.textContent = `Incorrect prediction! Expected \${{checkpoint.expected_value}} for \${{checkpoint.target_var}}.`;
          feedback.style.color = 'var(--bad)';
          return;
        }} else {{
          feedback.classList.add('visible');
          feedback.textContent = 'Correct prediction!';
          feedback.style.color = 'var(--good)';
        }}
      }}

      if (sim.currentStep < sim.states.length - 1) {{
        sim.currentStep++;
        renderSimStep(qId);
      }} else {{
        feedback.classList.add('visible');
        feedback.textContent = sim.success ? 'Simulation completed successfully!' : 'Simulation finished with incorrect predictions.';
        feedback.style.color = sim.success ? 'var(--good)' : 'var(--bad)';
        
        window.parent.postMessage({{
          type: 'ANSWER_SUBMITTED',
          payload: {{
            question_id: qId,
            is_correct: sim.success,
            wager: 'high',
            user_answer: 'completed'
          }}
        }}, '*');
      }}
    }}

    // 3. Proof Step
    const proofStates = {{}};
    function initProof(qId) {{
      const card = document.querySelector(`[data-quiz-id="\${{qId}}"]`);
      const steps = JSON.parse(card.dataset.steps);
      const reasons = JSON.parse(card.dataset.reasons);
      
      // Shuffle initially
      const indices = steps.map((_, i) => i);
      indices.sort(() => Math.random() - 0.5);

      proofStates[qId] = {{
        order: indices,
        steps: steps,
        reasons: reasons
      }};

      renderProof(qId);
    }}

    function renderProof(qId) {{
      const proof = proofStates[qId];
      const container = document.getElementById('proof-container-' + qId);
      container.innerHTML = '';

      proof.order.forEach((stepIdx, renderIdx) => {{
        const stepText = proof.steps[stepIdx];
        const stepDiv = document.createElement('div');
        stepDiv.className = 'mini-card';
        stepDiv.style = 'display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;';
        stepDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px;">\${{stepText}}</span>
            <div style="display: flex; gap: 4px;">
              <button class="action-btn" style="min-height: 28px; padding: 2px 6px;" onclick="moveProofStep('\${{qId}}', \${{renderIdx}}, -1)">▲</button>
              <button class="action-btn" style="min-height: 28px; padding: 2px 6px;" onclick="moveProofStep('\${{qId}}', \${{renderIdx}}, 1)">▼</button>
            </div>
          </div>
          <div>
            <select id="proof-reason-\${{qId}}-\${{renderIdx}}" style="width: 100%; background: #101011; color: var(--text); border: 1px solid var(--line); border-radius: 4px; padding: 4px;">
              <option value="">-- Choose Justification --</option>
              \${{proof.reasons.map((r, rIdx) => `<option value="\${{rIdx}}">\${{r}}</option>`).join('')}}
            </select>
          </div>
        `;
        container.appendChild(stepDiv);
      }});
    }}

    function moveProofStep(qId, renderIdx, direction) {{
      const proof = proofStates[qId];
      const targetIdx = renderIdx + direction;
      if (targetIdx >= 0 && targetIdx < proof.order.length) {{
        // Swap select values before re-rendering
        const currentSelect = document.getElementById(`proof-reason-\${{qId}}-\${{renderIdx}}`);
        const targetSelect = document.getElementById(`proof-reason-\${{qId}}-\${{targetIdx}}`);
        const val1 = currentSelect ? currentSelect.value : '';
        const val2 = targetSelect ? targetSelect.value : '';

        const temp = proof.order[renderIdx];
        proof.order[renderIdx] = proof.order[targetIdx];
        proof.order[targetIdx] = temp;

        renderProof(qId);

        const newCurrentSelect = document.getElementById(`proof-reason-\${{qId}}-\${{renderIdx}}`);
        const newTargetSelect = document.getElementById(`proof-reason-\${{qId}}-\${{targetIdx}}`);
        if (newCurrentSelect) newCurrentSelect.value = val2;
        if (newTargetSelect) newTargetSelect.value = val1;
      }}
    }}

    function checkProof(qId) {{
      const card = document.querySelector(`[data-quiz-id="\${{qId}}"]`);
      const proof = proofStates[qId];
      const correctOrder = JSON.parse(card.dataset.correctOrder);
      const reasonMappings = JSON.parse(card.dataset.reasonMappings);
      const feedback = document.getElementById('proof-feedback-' + qId);

      let correct = true;
      proof.order.forEach((stepIdx, renderIdx) => {{
        // Check order
        if (stepIdx !== correctOrder[renderIdx]) {{
          correct = false;
        }}
        // Check reason mapping
        const select = document.getElementById(`proof-reason-\${{qId}}-\${{renderIdx}}`);
        const selectedReasonIdx = select ? parseInt(select.value) : -1;
        if (selectedReasonIdx !== reasonMappings[stepIdx]) {{
          correct = false;
        }}
      }});

      feedback.classList.add('visible');
      if (correct) {{
        feedback.textContent = 'Proof verified successfully! Correct order and axioms.';
        feedback.style.color = 'var(--good)';
      }} else {{
        feedback.textContent = 'Incorrect proof order or justifications. Try again.';
        feedback.style.color = 'var(--bad)';
      }}

      window.parent.postMessage({{
        type: 'ANSWER_SUBMITTED',
        payload: {{
          question_id: qId,
          is_correct: correct,
          wager: 'high',
          user_answer: JSON.stringify(proof.order)
        }}
      }}, '*');
    }}

    // 4. Evidence Select
    function toggleEvidenceSpan(span) {{
      span.classList.toggle('selected');
    }}

    function checkEvidence(qId) {{
      const card = document.querySelector(`[data-quiz-id="\${{qId}}"]`);
      const targetSpans = JSON.parse(card.dataset.targetSpans);
      const feedback = document.getElementById('evidence-feedback-' + qId);
      
      const selectedSpans = Array.from(card.querySelectorAll('.selectable.selected')).map(el => parseInt(el.dataset.id));
      
      // Compare arrays
      const isCorrect = targetSpans.length === selectedSpans.length && targetSpans.every(v => selectedSpans.includes(v));

      feedback.classList.add('visible');
      if (isCorrect) {{
        feedback.textContent = 'Correct selection! All target elements identified.';
        feedback.style.color = 'var(--good)';
      }} else {{
        feedback.textContent = 'Incorrect selection. Make sure to select all required items.';
        feedback.style.color = 'var(--bad)';
      }}

      window.parent.postMessage({{
        type: 'ANSWER_SUBMITTED',
        payload: {{
          question_id: qId,
          is_correct: isCorrect,
          wager: 'high',
          user_answer: JSON.stringify(selectedSpans)
        }}
      }}, '*');
    }}

    // 5. Case Simulation
    const caseStates = {{}};
    function initCaseSimulation(qId) {{
      const card = document.querySelector(`[data-quiz-id="\${{qId}}"]`);
      const stages = JSON.parse(card.dataset.stages);
      const initialMetrics = JSON.parse(card.dataset.metrics);
      const successConditions = JSON.parse(card.dataset.successConditions);

      caseStates[qId] = {{
        currentStage: 'start',
        stages: stages,
        metrics: {{ ...initialMetrics }},
        successConditions: successConditions,
        ended: false
      }};

      renderCaseStep(qId);
    }}

    function renderCaseStep(qId) {{
      const c = caseStates[qId];
      const metricsDiv = document.getElementById('case-metrics-' + qId);
      const textP = document.getElementById('case-text-' + qId);
      const choicesDiv = document.getElementById('case-choices-' + qId);
      const feedback = document.getElementById('case-feedback-' + qId);

      // Render metrics
      metricsDiv.innerHTML = Object.entries(c.metrics).map(([name, val]) => {{
        // Clamp stability or integrity metrics [0.0, 1.0] as progress bars
        const isPercentage = name === 'stability' || name === 'integrity';
        const displayVal = isPercentage ? Math.round(val * 100) + '%' : val;
        const progressHtml = isPercentage ? `
          <div style="width: 100px; height: 10px; background: var(--line); border-radius: 4px; overflow: hidden; margin-top: 4px;">
            <div style="width: \${{val * 100}}%; height: 100%; background: var(--soft);"></div>
          </div>
        ` : '';
        return `<div><strong>\${{name.toUpperCase()}}</strong>: \${{displayVal}}\${{progressHtml}}</div>`;
      }}).join('');

      const stage = c.stages[c.currentStage];
      textP.textContent = stage.text;
      choicesDiv.innerHTML = '';

      if (c.ended) return;

      const choices = stage.choices || [];
      if (choices.length === 0) {{
        // Terminal stage
        c.ended = true;
        
        // Evaluate success
        let success = true;
        for (const [metric, condition] of Object.entries(c.successConditions)) {{
          const val = c.metrics[metric];
          if (condition.min !== undefined && val < condition.min) success = false;
          if (condition.max !== undefined && val > condition.max) success = false;
        }}

        feedback.classList.add('visible');
        if (success) {{
          feedback.textContent = 'Scenario successfully resolved! All conditions met.';
          feedback.style.color = 'var(--good)';
        }} else {{
          feedback.textContent = 'Scenario failed. Critical success thresholds violated.';
          feedback.style.color = 'var(--bad)';
        }}

        window.parent.postMessage({{
          type: 'ANSWER_SUBMITTED',
          payload: {{
            question_id: qId,
            is_correct: success,
            wager: 'high',
            user_answer: c.currentStage
          }}
        }}, '*');
        return;
      }}

      choices.forEach((choice, idx) => {{
        const btn = document.createElement('button');
        btn.className = 'option';
        btn.textContent = choice.text;
        btn.onclick = () => selectCaseChoice(qId, idx);
        choicesDiv.appendChild(btn);
      }});
    }}

    async function selectCaseChoice(qId, choiceIndex) {{
      const c = caseStates[qId];
      const feedback = document.getElementById('case-feedback-' + qId);

      try {{
        const res = await fetch('/api/ater/playground/case/evaluate', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{
            stages: c.stages,
            current_stage: c.currentStage,
            choice_index: choiceIndex,
            current_metrics: c.metrics,
            success_conditions: c.successConditions
          }})
        }});
        const data = await res.json();
        
        c.currentStage = data.next_stage;
        c.metrics = data.metrics;
        c.ended = data.ended;

        renderCaseStep(qId);
        
        if (c.ended) {{
          feedback.classList.add('visible');
          if (data.success) {{
            feedback.textContent = 'Scenario successfully resolved! All conditions met.';
            feedback.style.color = 'var(--good)';
          }} else {{
            feedback.textContent = 'Scenario failed. Critical success thresholds violated.';
            feedback.style.color = 'var(--bad)';
          }}
          window.parent.postMessage({{
            type: 'ANSWER_SUBMITTED',
            payload: {{
              question_id: qId,
              is_correct: data.success,
              wager: 'high',
              user_answer: c.currentStage
            }}
          }}, '*');
        }}
      }} catch (err) {{
        feedback.classList.add('visible');
        feedback.textContent = 'Failed to evaluate case choice: ' + err.message;
        feedback.style.color = 'var(--bad)';
      }}
    }}

    // Initialize all widgets on load
    document.addEventListener('DOMContentLoaded', () => {{
      document.querySelectorAll('[data-type="simulation_predict"]').forEach(el => initSimulation(el.dataset.quizId));
      document.querySelectorAll('[data-type="proof_step"]').forEach(el => initProof(el.dataset.quizId));
      document.querySelectorAll('[data-type="case_simulation"]').forEach(el => initCaseSimulation(el.dataset.quizId));
    }});
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
            from .vault_manager import VaultManager
            vm = VaultManager(self.vault_path)
            post = frontmatter.loads(note_path.read_text(encoding="utf-8"))
            post.metadata["lesson_variants"] = lesson_variants
            yaml_part = vm.dump_obsidian_yaml(post.metadata)
            body = post.content
            if not body.startswith("\n") and body:
                body = "\n" + body
            note_path.write_text(f"---\n{yaml_part}---\n{body}", encoding="utf-8")
        except Exception:
            pass
            
        return output_path
