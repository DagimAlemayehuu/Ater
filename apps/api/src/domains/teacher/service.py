import html
import json
import re
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from src.domains.ai.factory import ModelFactory


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


class TeacherService:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)

    async def chat(
        self,
        history: List[Dict[str, str]],
        secrets: Optional[Any] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        user_message = ""
        for message in reversed(history):
            if message.get("role") == "user":
                user_message = message.get("content", "")
                break

        topic = _title_from_prompt(user_message)
        workspace_slug = _slugify(topic)
        lesson_title = _display_title(topic)

        yield {"type": "status", "message": "Preparing teaching workspace..."}

        workspace = self._ensure_workspace(workspace_slug, lesson_title, user_message)
        lesson_path = self._next_lesson_path(workspace, workspace_slug)

        yield {"type": "status", "message": "Designing interactive lesson..."}
        generated = await self._generate_lesson_with_model(lesson_title, user_message, secrets)
        lesson_html = generated.get("lesson_html") or self._render_lesson_html(lesson_title, user_message)
        assistant_markdown = generated.get("assistant_markdown") or (
            f"I created an interactive lesson for **{lesson_title}** and saved it in "
            f"`{lesson_path.relative_to(self.vault_path)}`.\n\n"
            "Open the preview panel to work through the retrieval check and mini exercise."
        )

        lesson_path.write_text(lesson_html, encoding="utf-8")

        relative_path = lesson_path.relative_to(self.vault_path)
        preview_path = "/".join(relative_path.parts)

        yield {
            "type": "chunk",
            "content": assistant_markdown,
        }
        yield {
            "type": "lesson_created",
            "title": lesson_title,
            "workspace": workspace_slug,
            "lesson_path": str(relative_path),
            "preview_path": preview_path,
            "absolute_lesson_path": str(lesson_path),
        }

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

    async def _generate_lesson_with_model(
        self,
        lesson_title: str,
        prompt: str,
        secrets: Optional[Any],
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
                max_tokens=6000,
            )

            system = """You are Ater Teacher, a stateful teaching agent implementing the Teach skill.
Create a comprehensive, substantial, self-contained interactive multi-page HTML lesson. Follow these rules:
- Design a Single Page Application (SPA) layout with a left sidebar navigation to switch between pages. The active tab button must have a clear visual active style (e.g., left accent border, distinct background var(--card-2), and text var(--text)) and the JS must toggle this class correctly on click. The page container divs/sections must be hidden by default in CSS and only displayed when they have the active class (e.g., `.page-container { display: none; } .page-container.active { display: block; }`), preventing pages from being visible all at once or stacked on load.
- The lesson must have exactly these 5 tabs/pages:
  1. Foundations: High-density introduction to the concept from scratch, core motivation (why it exists), and vivid pedagogical mental models.
  2. Mechanics & Theory: Analytical depth, mathematical models, equations, or key decision flowcharts with step-by-step breakdowns.
  3. Worked Example: Step-by-step real-world case study with a dynamic interactive calculation or simulation where variable adjustments instantly update the results in JS.
  4. Active Retrieval: Multi-question conceptual quiz with multiple choice, matching, or trace questions, instant validation, and explanation feedback.
  5. Capstone Practice Lab: A hands-on scenario requiring a structured answer check from memory, with rigorous feedback logic.
- Ensure EACH page/tab is highly detailed, containing multiple dense paragraphs of academic-grade concepts to take the user from beginner to competent.
- Scoped JavaScript: Every interactive component must use scoped selection (e.g., querying elements within `event.target.closest('.quiz-question')` or using unique IDs) so multiple widgets on the same page do not override or conflict with each other.
- Interactive Quiz Mechanics: Every quiz question must have:
  * Mutually exclusive options (clicking one option disables all options in that question, and highlights the chosen option: green if correct, red if incorrect).
  * A dedicated explanation/feedback element (hidden by default) that reveals a detailed explanation of why the selected answer is correct or incorrect, with key pedagogical takeaways.
- Practice Lab Feedback Engine: The validation script for the Capstone Practice Lab must be 100% complete and fully implemented with NO placeholder comments, "TODO" text, or simple generic submit logs. It must parse the user's textarea response for key conceptual terms (e.g., checking for specific words related to the topic), display a dynamic checklist of structural criteria (e.g., "Included core formula: Checked", "Explained trade-offs: Missed"), and provide constructive, customized tutoring feedback.
- Visual Diagrams & Charts: Never output empty <img> tags or placeholder images. If a diagram, flow chart, graph, or visual concept model is needed, construct it inline using styled SVGs or pure CSS elements matching the dark instrument palette.
- Use clean dark scientific-instrument styling matching Ater's color scheme (never use light backgrounds):
  --bg: #111113 (Background)
  --panel: #151517 (Panels/Sections)
  --card: #1a1a1c (Cards/Items)
  --card-2: #202024 (Active/Hover states)
  --line: #2b2b30 (Borders/Dividers)
  --text: #ebebeb (Primary text)
  --muted: #a1a1aa (Subtle labels)
  --accent: #d9d9d9 (Interactive highlights)
  --good: #8bd49c (Success/Correct)
  --warn: #f4c06a (Warning/Notice)
  --bad: #ff8f8f (Error/Incorrect)
- Typography: Import Google Font 'Outfit' or 'Inter' and use sharp geometric borders (0px to 4px border-radius) for an instrument panel aesthetic.
- Structure your output as follows:
  First, write a 2-3 sentence friendly summary of what you created for the user.
  Then, write the exact divider string: `===HTML_LESSON===` on a new line.
  Then, write the complete, raw, single-file HTML document (with inline CSS and JS, starting with <!doctype html> and ending with </html>).
- Do not wrap the HTML document in markdown backticks or json. Output it directly after the divider."""

            human = f"Prompt: {prompt}\nLesson title: {lesson_title}"
            response = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=human)])
            raw = response.content if hasattr(response, "content") else str(response)
            
            parts = raw.split("===HTML_LESSON===")
            if len(parts) >= 2:
                assistant_markdown = parts[0].strip()
                lesson_html = parts[1].strip()
            else:
                html_idx = raw.find("<!doctype html>")
                if html_idx == -1:
                    html_idx = raw.find("<html")
                if html_idx != -1:
                    assistant_markdown = raw[:html_idx].strip()
                    lesson_html = raw[html_idx:].strip()
                else:
                    return {}
            
            if lesson_html.startswith("```html"):
                lesson_html = lesson_html[7:].strip()
            elif lesson_html.startswith("```"):
                lesson_html = lesson_html[3:].strip()
            if lesson_html.endswith("```"):
                lesson_html = lesson_html[:-3].strip()

            assistant_markdown = re.sub(r"^`+|`+$", "", assistant_markdown).strip()
            lower_html = lesson_html.lower()
            if (
                "<html" not in lower_html
                or "<script" not in lower_html
                or "<style" not in lower_html
                or len(lesson_html) < 2000
            ):
                return {}
            return {
                "lesson_html": lesson_html,
                "assistant_markdown": assistant_markdown,
            }
        except Exception as e:
            import logging
            logger = logging.getLogger("Ater")
            logger.error(f"[TeacherService] Model generation failed: {e}", exc_info=True)
            return {}

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

    def _render_lesson_html(self, lesson_title: str, prompt: str) -> str:
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
      display: grid;
      grid-template-columns: minmax(200px, 260px) minmax(0, 1fr);
      min-height: 100vh;
    }}
    nav {{
      position: sticky;
      top: 0;
      height: 100vh;
      border-right: 1px solid var(--line);
      background: rgba(17, 17, 19, .92);
      padding: 28px 18px;
    }}
    nav .mark {{
      width: 34px;
      height: 34px;
      border: 1px solid var(--line);
      display: grid;
      place-items: center;
      margin-bottom: 22px;
      font-weight: 900;
    }}
    nav button.nav-tab {{
      display: block;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      border-left: 2px solid transparent;
      color: var(--muted);
      padding: 10px 12px;
      margin: 6px 0;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
      border-radius: 0;
      transition: all 0.2s ease;
    }}
    nav button.nav-tab:hover {{
      color: var(--text);
      border-color: var(--accent);
      background: var(--card);
    }}
    nav button.nav-tab.active {{
      color: var(--text);
      border-color: var(--accent);
      background: var(--card-2);
      font-weight: 900;
    }}
    main {{
      max-width: 1020px;
      width: 100%;
      margin: 0 auto;
      padding: 48px 36px 72px;
    }}
    header.hero {{
      min-height: 240px;
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
      font-size: clamp(32px, 5vw, 64px);
      line-height: 1.1;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }}
    .hero p {{
      max-width: 720px;
      color: #cfcfd5;
      font-size: 16px;
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
    @media (max-width: 820px) {{
      .lesson-shell {{ grid-template-columns: 1fr; }}
      nav {{ position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line); }}
      nav button.nav-tab {{ display: inline-block; width: auto; margin: 4px; }}
      main {{ padding: 32px 18px 56px; }}
      .meta-grid, .two-col, .flow {{ grid-template-columns: 1fr; }}
      header.hero {{ min-height: auto; }}
    }}
  </style>
</head>
<body>
  <div class="lesson-shell">
    <nav aria-label="Lesson sections">
      <div class="mark">T</div>
      <button class="nav-tab active" onclick="switchTab('foundations')">Foundations</button>
      <button class="nav-tab" onclick="switchTab('mechanics')">Mechanics</button>
      <button class="nav-tab" onclick="switchTab('example')">Worked Example</button>
      <button class="nav-tab" onclick="switchTab('retrieval')">Retrieval Check</button>
      <button class="nav-tab" onclick="switchTab('lab')">Practice Lab</button>
      <button class="nav-tab" onclick="switchTab('reference')">Reference & Sources</button>
    </nav>

    <main>
      <header class="hero">
        <div class="eyebrow">Ater Teacher · Interactive Curriculum Progression</div>
        <h1>{safe_title}</h1>
        <p>A multi-stage structured lesson engineered for mastery. Step through each tab sequentially from Foundations to the Capstone Practice Lab.</p>
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
        </section>
      </div>
    </main>
  </div>

  <script>
    function switchTab(tabId) {{
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
      
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.add('active');
      
      const activeBtn = Array.from(document.querySelectorAll('.nav-tab')).find(btn => 
        btn.getAttribute('onclick').includes(tabId)
      );
      if (activeBtn) activeBtn.classList.add('active');
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

