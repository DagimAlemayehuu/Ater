import os
import shutil
import asyncio
import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Query, Request
from fastapi.responses import StreamingResponse

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.ai.tracker import tracker
from src.domains.ai.factory import ModelFactory
from src.domains.ater.assistant import run_assistant_chat

logger = logging.getLogger("Ater")
router = APIRouter()

@router.get("/ai/rate-limits")
async def get_rate_limits():
    """Returns the current captured rate limit state for all providers."""
    return tracker.get_all()

@router.get("/ai/usage")
async def get_ai_usage(
    key_hash: Optional[str] = Query(None),
    timeframe: str = Query("day")
):
    """Returns aggregated usage stats for a specific key and timeframe."""
    from src.domains.ater.governor import governor
    return governor.get_aggregated_usage(key_hash, timeframe)

@router.get("/ai/usage/all")
async def get_all_ai_usage(timeframe: str = Query("day")):
    """Returns usage summary for all tracked keys."""
    from src.domains.ater.governor import governor
    return governor.get_all_keys_usage(timeframe)

@router.post("/ai/upload")
async def ai_upload(file: UploadFile = File(...), secrets: AppSecrets = Depends(get_app_secrets)):
    """Uploads a file for reasoning context. Currently multi-provider support is limited."""
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI API Key missing")
    
    import tempfile
    import shutil
    
    # Save temporary file using a proper temp directory
    fd, temp_path = tempfile.mkstemp(prefix="ater_upload_", suffix=f"_{file.filename}")
    
    try:
        with os.fdopen(fd, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        if secrets.ai_provider == "google":
            import google.generativeai as genai
            genai.configure(api_key=secrets.ai_key)
            uploaded_file = await asyncio.to_thread(genai.upload_file, temp_path)
            
            # Wait for file to process
            max_retries = 30
            for _ in range(max_retries):
                file_info = await asyncio.to_thread(genai.get_file, uploaded_file.name)
                if file_info.state.name == "ACTIVE":
                    break
                if file_info.state.name == "FAILED":
                    raise HTTPException(status_code=500, detail="File processing failed in Gemini")
                await asyncio.sleep(2)
            else:
                raise HTTPException(status_code=500, detail="File processing timed out")

            return {"file_uri": uploaded_file.uri, "name": file.filename}
        else:
            return {"file_uri": f"temp:{file.filename}", "name": file.filename, "note": "Provider does not support direct file upload yet."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/ai/test-connection")
async def test_ai_connection(
    payload: Dict[str, str] = Body({"target": "primary"}),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Tests if the specified AI tier configuration is valid."""
    target = payload.get("target", "primary")
    
    if target == "primary":
        provider, model, key = secrets.ai_provider, secrets.ai_model, secrets.ai_key
    elif target == "planner":
        provider, model, key = secrets.planner_provider, secrets.planner_model, secrets.planner_key
    else: # utility
        provider, model, key = secrets.utility_provider, secrets.utility_model, secrets.utility_key

    if not key:
        return {"success": False, "error": f"API Key for {target} is missing"}
    
    try:
        from src.domains.ai.factory import ModelFactory
        from langchain_core.messages import HumanMessage
        
        llm = ModelFactory.get_model(
            provider=provider,
            model_name=model,
            api_key=key,
            temperature=0.1,
            base_url=secrets.ai_base_url,
            max_tpm=secrets.ai_max_tpm,
            max_rpm=secrets.ai_max_rpm,
            max_tpd=secrets.ai_max_tpd,
            max_rpd=secrets.ai_max_rpd,
            max_concurrency=secrets.ai_max_concurrency,
        )
        
        response = await llm.ainvoke([HumanMessage(content="Hello. Respond with exactly one word: 'Connected'.")])
        content = response.content.strip() if hasattr(response, 'content') else str(response)
        
        return {"success": True, "message": f"{target.capitalize()} Tier: {content}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/ater/assistant/chat")
async def assistant_chat(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Ater Chat endpoint.
    Streams tool-calling agent execution status and content chunks via SSE.
    """
    messages_history = payload.get("history", [])
    rag_context = payload.get("rag_context")
    user_context = payload.get("user_context")
    active_artifact = payload.get("active_artifact")
    
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI API key is required. Please set it in Settings.")
        
    async def sse_generator():
        try:
            async for event in run_assistant_chat(secrets, messages_history, rag_context, user_context, active_artifact, request=request):
                yield event
        except Exception as e:
            logger.error(f"[Assistant Stream] Generator error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.post("/practice/explain")
async def explain_question(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates a detailed mini-lesson for a given quiz question using the configured AI."""
    ai_key = secrets.planner_key or secrets.ai_key
    if not ai_key:
        raise HTTPException(status_code=400, detail="AI Key required")

    question = payload.get("question", "")
    q_type = payload.get("type", "")
    answer = payload.get("answer", "")
    explanation = payload.get("explanation", "")
    context = payload.get("context", "")
    user_answer = payload.get("userAnswer", payload.get("user_answer", ""))

    provider = secrets.planner_provider or secrets.ai_provider or "google"
    model = secrets.planner_model or secrets.ai_model or "gemini-2.0-flash"

    try:
        llm = ModelFactory.get_model(provider=provider, model_name=model, api_key=ai_key, temperature=0.7, max_tokens=2000)

        q_type_lower = str(q_type).lower()
        if q_type_lower in ("calculation", "math", "calculation_mode"):
            dynamic_style_instruction = (
                "MATHEMATICAL/CALCULATION MODE: Because this is a calculative concept, you MUST provide a complete step-by-step "
                "algebraic or numerical derivation using LaTeX block formulas. Define every single variable, state the formulas used, "
                "and show intermediate steps clearly."
            )
        elif q_type_lower in ("code", "debug", "trace"):
            dynamic_style_instruction = (
                "CODE/ALGORITHM TRACE MODE: Because this is a programming or logic concept, you MUST provide an execution trace. "
                "Use Markdown code blocks to show input/output values, step through the loops/conditionals, explain state changes, "
                "and diagnose off-by-one errors or resource leaks specifically."
            )
        else:
            dynamic_style_instruction = (
                "SOCRATIC CONCEPTUAL BREAKDOWN: Focus on the underlying mechanisms and first principles. Begin with a Socratic hook question, "
                "explain the conceptual connections, and provide a real-world analogy to anchor the idea."
            )

        sys_prompt = f"""You are a world-class Socratic tutor and an elite educator. A student just answered a quiz question and requested a comprehensive explanation of the underlying concept.

If a student's answer is provided, you MUST begin your response with a grading line:
GRADED: [CORRECT or INCORRECT]
Followed by a blank line, and then the rest of your response. Check if the student's answer matches the correct answer conceptually or exactly.

{dynamic_style_instruction}

Your lesson MUST follow this strict structure:
1. SOCRATIC HOOK: Start with a brief, thought-provoking question to challenge their assumptions (conceptual mode only; mathematical or code mode can jump to mathematical context).
2. EXPLAIN: Break down the core concept tested as if speaking to a brilliant 12-year-old, but with high academic fidelity. Be thorough, clear, and comprehensive.
3. VISUALIZE: Provide a vivid, real-world analogy. Avoid common clichés like coffee shops or basic cars; use a mechanical, architectural, natural science, or industry-specific scenario.
4. DIAGNOSE: Highlight exactly where most students go wrong (key misconceptions).
5. PERSONALIZED CRITIQUE: If a student's answer is provided:
   - Compare their answer to the correct answer.
   - If their answer was correct, briefly validate their logical connection and reinforce why it works.
   - If their answer was incorrect, directly address their specific mistake and explain exactly why this reasoning falls short or which misconception it represents.
6. MEMORY HOOK: End with a single, bolded 1-sentence takeaway.

Format your response in flawless, readable Markdown. Use headers, bullet points, blockquotes, and bold text effectively to organize information."""

        is_correct = payload.get("is_correct", True)
        if not is_correct:
            sys_prompt += "\n\nAdditionally, at the very end of your response, you MUST append a line:\n---MISCONCEPTION---\nfollowed by a 1-sentence summary of the student's specific misconception, starting with a bolded category prefix. For example:\n---MISCONCEPTION---\n**Incorrect Model**: Confused late interaction MaxSim token alignment with standard cross-encoder scoring."

        human_prompt = f"""Quiz Question: {question}

Question Type: {q_type}
Correct Answer: {answer}
{f"Student's Answer: {user_answer}" if user_answer else ""}
{f'Existing Explanation: {explanation}' if explanation else ''}
{f'Additional Context: {context}' if context else ''}

Generate the mini-lesson now."""

        res = await llm.ainvoke([("system", sys_prompt), ("human", human_prompt)])
        lesson_content = res.content.strip()
        
        is_graded_correct = True
        if "GRADED:" in lesson_content:
            parts = lesson_content.split("\n", 1)
            grade_line = parts[0]
            if "INCORRECT" in grade_line.upper():
                is_graded_correct = False
            elif "CORRECT" in grade_line.upper():
                is_graded_correct = True
            if len(parts) > 1:
                lesson_content = parts[1].strip()
        
        misconception = None
        if "---MISCONCEPTION---" in lesson_content:
            parts = lesson_content.split("---MISCONCEPTION---")
            lesson_content = parts[0].strip()
            misconception = parts[1].strip()

        note_path = payload.get("note_path")
        if misconception and note_path and secrets.vault_path:
            try:
                from src.domains.ater.service import AterService
                service = AterService(secrets)
                service.append_misconception_to_note(note_path, misconception)
            except Exception as ex:
                logger.error(f"Failed to append misconception to note: {ex}")

        return {"lesson": lesson_content, "is_correct": is_graded_correct}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/explain")
async def ater_explain(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates a detailed explanation of the selection, page, or note context."""
    ai_key = secrets.ai_key
    if not ai_key:
        raise HTTPException(status_code=400, detail="AI API Key missing")

    provider = secrets.ai_provider or "google"
    model = secrets.ai_model or "gemini-2.0-flash"

    selection = payload.get("selection", "")
    selection_context = payload.get("selection_context", "")
    page = payload.get("page")
    note_title = payload.get("note_title", "")
    path = payload.get("path", "")

    context_str = ""
    if selection:
        context_str += f"Selection: \"{selection}\"\n"
    if selection_context:
        context_str += f"Selection context: \"{selection_context}\"\n"
    if page:
        context_str += f"Page: {page}\n"
    if note_title:
        context_str += f"Document Title: {note_title}\n"
    if path:
        context_str += f"Document Path: {path}\n"

    try:
        llm = ModelFactory.get_model(
            provider=provider,
            model_name=model,
            api_key=ai_key,
            temperature=0.7,
            max_tokens=2000
        )

        sys_prompt = """You are Ater's Socratic Tutor, an elite AI educator and subject-matter expert.
Your goal is to explain the provided selection or document context in a comprehensive, detailed, and master-level manner.

Instructions:
1. Master-Level Content: Explain all concepts from the ground up, assuming the student knows absolutely nothing. Provide deep, rich, highly explanatory detailed lessons to take the student to true mastery. Do not summarize or write brief text; write comprehensive explanations, mathematical derivations, or full conceptual breakdowns.
2. Structure the lesson into a single <artifact> block containing exactly 3 to 5 chapters. Do not write lesson text outside the <artifact> block.
3. Every single chapter must have a clear title and contain:
   - A detailed Markdown text explanation of the concepts.
   - An interactive visual aid or simulation specification.
4. Formatting & Anti-Code-Fences: Do NOT wrap the chapter's lesson text in any markdown code blocks or fences (like ```markdown or ```text). Write the text directly as plain markdown paragraphs and headings. Code fences (```) must ONLY be used for actual programming code snippets or when formatting a preset like ```ater-ui.
5. No Emojis: Never use emojis anywhere in your response, chapter titles, or lesson content.
6. For interactive visual aids, do NOT write the HTML/JS code inside a <sandbox> yourself. Instead, use either:
   - A declarative `ater-ui` preset block (type: 'math-plotter', 'node-graph', or 'table-explorer').
   - A `<sandbox-spec>precise sandbox simulator request</sandbox-spec>` block detailing the interactive elements, controls, and visual representation. The system will compile this spec into code asynchronously.
   - Crucially, do NOT wait until the last chapter to generate an interactive sandbox; every chapter should have its own tailored visualization.
7. Format for `ater-ui` codeblock:
```ater-ui
{
  "ui_type": "interactive_sandbox",
  "data": {
    "title": "Math Plotter Example",
    "type": "math-plotter",
    "equation": "sine",
    "sliders": [
      { "name": "amplitude", "min": 10, "max": 100, "default": 50 }
    ]
  }
}
```
Supported types:
- `math-plotter` (equations: `sine`, `logistic`, `exponential`, `quadratic`. Sliders: `amplitude`, `frequency`, `phase`, `decay`)
- `node-graph` (nodes: array of `{ id, label, x, y }`, links: array of `{ source, target }`)
- `table-explorer` (headers: array of strings, rows: array of objects)

Format for <artifact> structure:
<artifact title="Comprehensive Lesson Title">
  <chapter title="Chapter 1: Title">
    Detailed lesson text explaining the concepts...
    <sandbox-spec>Draw an interactive graph showing nodes A, B, C representing a triangle. Allow the user to drag vertices. Ensure it matches dark mode styling.</sandbox-spec>
  </chapter>
  <chapter title="Chapter 2: Title">
    Detailed lesson text on the next concepts...
    ```ater-ui
    {
      "ui_type": "interactive_sandbox",
      "data": {
        "title": "Adjacency Table",
        "type": "table-explorer",
        ...
      }
    }
    ```
  </chapter>
</artifact>"""

        human_prompt = f"""Document Context:
{context_str}

Please generate the explanation now."""

        res = await llm.ainvoke([("system", sys_prompt), ("human", human_prompt)])
        return {"answer": res.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/chat")
async def ater_chat(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Holds a Socratic follow-up conversation about the document context."""
    ai_key = secrets.ai_key
    if not ai_key:
        raise HTTPException(status_code=400, detail="AI API Key missing")

    provider = secrets.ai_provider or "google"
    model = secrets.ai_model or "gemini-2.0-flash"

    messages = payload.get("messages", [])
    active_artifact = payload.get("active_artifact") or {}
    selection = payload.get("selection", "")
    selection_context = payload.get("selection_context", "")
    page = payload.get("page")
    note_title = payload.get("note_title", "")

    context_str = ""
    if selection:
        context_str += f"Selection: \"{selection}\"\n"
    if selection_context:
        context_str += f"Selection context: \"{selection_context}\"\n"
    if page:
        context_str += f"Page: {page}\n"
    if note_title:
        context_str += f"Document Title: {note_title}\n"
    if active_artifact.get("code"):
        context_str += (
            "\nActive artifact state for iterative edits:\n"
            f"Title: {active_artifact.get('title', 'Untitled artifact')}\n"
            f"Version: {active_artifact.get('version', 1)}\n"
            "Current sandbox code:\n"
            f"{active_artifact.get('code')}\n"
        )

    try:
        llm = ModelFactory.get_model(
            provider=provider,
            model_name=model,
            api_key=ai_key,
            temperature=0.7,
            max_tokens=2000
        )

        sys_prompt = f"""You are Ater's Socratic Tutor. You are holding a follow-up conversation with the student about the following document context:
{context_str}

Guide the student using Socratic dialogue. Help them think deeply, ask guiding questions, check their understanding, and explain complex parts thoroughly but in a highly accessible way. Keep your formatting elegant using Markdown.

If the explanation would benefit from a minor visualization (e.g. plotting a function, displaying a connection graph, or a table of data), prefer outputting a lightweight declarative preset block inside an `ater-ui` JSON codeblock:
```ater-ui
{{
  "ui_type": "interactive_sandbox",
  "data": {{
    "title": "Math Plotter Example",
    "type": "math-plotter",
    "equation": "sine",
    "sliders": [
      {{ "name": "amplitude", "min": 10, "max": 100, "default": 50 }},
      {{ "name": "frequency", "min": 1, "max": 10, "default": 2 }}
    ]
  }}
}}
```
Supported preset types are `math-plotter` (equations: `sine`, `logistic`, etc.), `node-graph`, or `table-explorer`.

If the student asks to explain a new concept in detail or teach them a topic:
1. Master-Level Content: Explain all concepts from the ground up, assuming the student knows absolutely nothing. Provide deep, rich, highly explanatory detailed lessons to take the student to true mastery. Do not summarize or write brief text; write comprehensive explanations, mathematical derivations, or full conceptual breakdowns.
2. Structure the lesson into a single <artifact> block containing exactly 3 to 5 chapters. Do not write lesson text outside the <artifact> block.
3. Every single chapter must have a clear title and contain a detailed Markdown text explanation of the concepts, and an interactive visual aid or simulation specification.
4. Formatting & Anti-Code-Fences: Do NOT wrap the chapter's lesson text in any markdown code blocks or fences (like ```markdown or ```text). Write the text directly as plain markdown paragraphs and headings. Code fences (```) must ONLY be used for actual programming code snippets or when formatting a preset like ```ater-ui.
5. No Emojis: Never use emojis anywhere in your response, chapter titles, or lesson content.
6. Use either an `ater-ui` preset block or a `<sandbox-spec>precise sandbox simulator request</sandbox-spec>` block detailing the interactive elements, controls, and visual representation. Every chapter should have its own tailored visualization.

If the student asks to modify, fix, expand, or personalize the interactive simulator, you MUST return an updated XML artifact with all chapters preserved, but replace the <sandbox> block with a <sandbox-spec> tag specifying the requested changes (e.g., <sandbox-spec>change the colors of the rubik's cube simulator to bright neon</sandbox-spec>). Do NOT write or edit the full code inside a <sandbox> block yourself — the system will automatically edit the previous code inline according to your sandbox specification."""

        formatted_messages = [("system", sys_prompt)]
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            formatted_messages.append((role, content))

        res = await llm.ainvoke(formatted_messages)
        return {"answer": res.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _clean_markdown_fences(code: str) -> str:
    code = code.strip()
    if code.startswith("```"):
        newline_idx = code.find("\n")
        if newline_idx != -1:
            code = code[newline_idx:].strip()
        else:
            code = code[3:].strip()
        if code.endswith("```"):
            code = code[:-3].strip()
    return code


def _is_rubiks_sandbox_request(prompt: str, previous_code: str = "") -> bool:
    if previous_code:
        # If we already have a sandbox, any subsequent request is an edit/modification.
        # We must return False so that the LLM performs the modification inline.
        return False
    normalized = str(prompt or "").lower()
    return "rubik" in normalized or "rubics" in normalized


def _build_rubiks_cube_sandbox() -> str:
    return """<style>
  .rubik-shell{height:100%;min-height:620px;background:hsl(var(--background));color:hsl(var(--foreground));font-family:Outfit,Inter,system-ui,sans-serif;padding:24px;box-sizing:border-box;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:20px}
  .rubik-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;border-bottom:1px solid hsl(var(--border));padding-bottom:14px}
  .rubik-kicker{font-size:11px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:hsl(var(--muted-foreground))}
  .rubik-title{font-size:26px;line-height:1.1;font-weight:900;text-transform:uppercase;margin-top:6px}
  .rubik-subtitle{max-width:820px;margin-top:8px;color:hsl(var(--muted-foreground));font-size:14px;line-height:1.5}
  .rubik-stage{display:grid;grid-template-columns:1fr 340px;gap:20px;min-height:0}
  
  .cube-card{position:relative;display:flex;align-items:center;justify-content:center;border:1px solid hsl(var(--border));background:hsl(var(--muted)/0.3);padding:20px;min-height:400px;border-radius:10px}
  .cube-net{
    display:grid;
    grid-template-areas:
      ". U . ."
      "L F R B"
      ". D . .";
    grid-template-columns: repeat(4, 75px);
    grid-template-rows: repeat(3, 75px);
    gap: 8px;
    justify-content: center;
    align-content: center;
  }
  .cube-face{
    display:grid;
    grid-template-columns:repeat(3, 1fr);
    grid-template-rows:repeat(3, 1fr);
    gap:2px;
    padding:4px;
    background:hsl(var(--muted)/0.6);
    border:2px solid hsl(var(--border));
    border-radius:6px;
    position:relative;
    aspect-ratio:1/1;
  }
  .cube-face::after {
    content: attr(data-face);
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    color: hsl(var(--foreground)/0.08);
    pointer-events: none;
    z-index: 10;
  }
  
  .face-U{grid-area:U}
  .face-L{grid-area:L}
  .face-F{grid-area:F}
  .face-R{grid-area:R}
  .face-B{grid-area:B}
  .face-D{grid-area:D}
  
  .sticker{
    border-radius:3px;
    border:1px solid rgba(0,0,0,0.4);
    box-shadow:inset 0 0 0 1px rgba(255,255,255,0.15);
    transition:transform .16s ease,filter .16s ease;
    aspect-ratio:1/1;
  }
  .sticker.flash{transform:scale(.85);filter:brightness(1.3)}
  
  .lesson-panel{border:1px solid hsl(var(--border));background:hsl(var(--muted)/0.4);padding:20px;display:flex;flex-direction:column;gap:16px;min-height:0;border-radius:10px}
  .lesson-panel h3{font-size:13px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin:0;color:hsl(var(--foreground))}
  .step{font-size:15px;line-height:1.6;color:hsl(var(--foreground)/0.9);min-height:110px}
  .moves{display:flex;flex-wrap:wrap;gap:8px}
  
  button{min-height:38px;border:1px solid hsl(var(--border));background:hsl(var(--muted)/0.5);color:hsl(var(--foreground));border-radius:8px;padding:0 12px;font-size:12px;font-weight:900;cursor:pointer;transition:background .2s, border-color .2s}
  button:hover{background:hsl(var(--muted)/0.8);border-color:hsl(var(--muted-foreground))}
  button:active{transform:translateY(1px)}
  .primary{background:hsl(var(--primary));color:hsl(var(--background));border-color:hsl(var(--primary))}
  .primary:hover{background:hsl(var(--primary)/0.9)}
  
  .controls{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
  .footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid hsl(var(--border));padding-top:14px}
  .log{font-size:13px;color:hsl(var(--muted-foreground));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;min-width:0}
  
  @media(max-width:900px){
    .rubik-shell{padding:16px}
    .rubik-stage{grid-template-columns:1fr}
    .cube-net{grid-template-columns:repeat(4,65px);grid-template-rows:repeat(3,65px)}
    .controls{grid-template-columns:repeat(3,1fr)}
  }
</style>
<div class="rubik-shell">
  <div class="rubik-head">
    <div>
      <div class="rubik-kicker">Interactive Lesson Sandbox</div>
      <div class="rubik-title">Rubik's Cube Flat Net Simulator</div>
      <div class="rubik-subtitle">This flat 2D projection shows all 6 faces (U, L, F, R, B, D) simultaneously. Use the stepper or manual controls to practice.</div>
    </div>
    <button id="reset">Reset</button>
  </div>
  <div class="rubik-stage">
    <div class="cube-card">
      <div class="cube-net" id="cube" aria-label="Flat Rubik's Cube net view"></div>
    </div>
    <div class="lesson-panel">
      <h3 id="stepTitle">Step 1: Notation</h3>
      <div id="stepText" class="step"></div>
      <div id="stepMoves" class="moves"></div>
      <button id="playStep" class="primary">Play Step Moves</button>
    </div>
  </div>
  <div>
    <div class="controls" id="manualControls" aria-label="Practice move controls"></div>
    <div class="footer">
      <button id="prev">Prev Step</button>
      <div class="log" id="log">Moves: none</div>
      <button id="next">Next Step</button>
    </div>
  </div>
</div>
<script>
const faceOrder=['U','L','F','R','B','D'];
// === COLOR PALETTE ===
const palette={U:'#f8fafc',D:'#facc15',F:'#dc2626',B:'#f97316',L:'#16a34a',R:'#2563eb'};
const moves=["U","U'","D","D'","R","R'","L","L'","F","F'","B","B'"];
const cubeState={U:Array(9).fill('U'),D:Array(9).fill('D'),F:Array(9).fill('F'),B:Array(9).fill('B'),L:Array(9).fill('L'),R:Array(9).fill('R')};
const solved=JSON.stringify(cubeState);
const steps=[
  {title:'Step 1: Notation',text:'A move letter names the face to turn. A prime mark means counter-clockwise; 2 means turn the face twice. Start by watching how U, R, U\\', R\\' changes the visible stickers.',seq:["U","R","U'","R'"]},
  {title:'Step 2: White Daisy',text:'Move the four white edges to the top around the yellow center. The sandbox sequence gives you a simple feel for lifting and repositioning edges without worrying about exact solve state yet.',seq:["F","U","R","U'"]},
  {title:'Step 3: White Cross',text:'Match each white edge side color with its center, then turn that face twice to send the white sticker to the bottom cross.',seq:["F","F","R","R","B","B","L","L"]},
  {title:'Step 4: White Corners',text:'Place a white corner above its target slot and repeat the right trigger R U R\\' U\\' until the corner drops into place.',seq:["R","U","R'","U'"]},
  {title:'Step 5: Middle Layer',text:'Find a top edge with no yellow. Match its front color to the center, then insert it right or left. This sequence demonstrates the right insertion.',seq:["U","R","U'","R'","U'","F'","U","F"]},
  {title:'Step 6: Yellow Cross',text:'Use F R U R\\' U\\' F\\' to turn the top yellow pattern from dot to angle, angle to line, and line to cross.',seq:["F","R","U","R'","U'","F'"]},
  {title:'Step 7: Last Layer Edges',text:'Cycle the yellow-cross edges until every side color matches its center. Keep the yellow face on top while applying the sequence.',seq:["R","U","R'","U","R","U","U","R'"]},
  {title:'Step 8: Last Layer Corners',text:'Position the corners first, then orient each one at front-right with the right trigger while keeping the cube orientation fixed.',seq:["R","U","R'","U'","R","U","R'","U'"]}
];
let step=0,history=[],lastTouched='',isPlaying=false;
const cube=document.getElementById('cube'),log=document.getElementById('log');
function row(face,r){return [cubeState[face][r*3],cubeState[face][r*3+1],cubeState[face][r*3+2]]}
function setRow(face,r,v){[0,1,2].forEach((i)=>cubeState[face][r*3+i]=v[i])}
function col(face,c){return [cubeState[face][c],cubeState[face][c+3],cubeState[face][c+6]]}
function setCol(face,c,v){[0,1,2].forEach((i)=>cubeState[face][c+i*3]=v[i])}
function rotateFace(face,prime=false){
  const old=cubeState[face].slice();
  const map=prime?[2,5,8,1,4,7,0,3,6]:[6,3,0,7,4,1,8,5,2];
  cubeState[face]=map.map(i=>old[i]);
}
function cycle(getA,setA,getB,setB,getC,setC,getD,setD){const t=getA();setA(getD());setD(getC());setC(getB());setB(t)}
function applyBaseMove(move){
  const prime=move.endsWith("'");
  const face=move[0];
  rotateFace(face,prime);
  const times=prime?3:1;
  for(let n=0;n<times;n++){
    if(face==='U')cycle(()=>row('F',0),v=>setRow('F',0,v),()=>row('R',0),v=>setRow('R',0,v),()=>row('B',0),v=>setRow('B',0,v),()=>row('L',0),v=>setRow('L',0,v));
    if(face==='D')cycle(()=>row('F',2),v=>setRow('F',2,v),()=>row('L',2),v=>setRow('L',2,v),()=>row('B',2),v=>setRow('B',2,v),()=>row('R',2),v=>setRow('R',2,v));
    if(face==='R')cycle(()=>col('U',2),v=>setCol('U',2,v),()=>col('F',2),v=>setCol('F',2,v),()=>col('D',2),v=>setCol('D',2,v),()=>col('B',0).reverse(),v=>setCol('B',0,v.slice().reverse()));
    if(face==='L')cycle(()=>col('U',0),v=>setCol('U',0,v),()=>col('B',2).reverse(),v=>setCol('B',2,v.slice().reverse()),()=>col('D',0),v=>setCol('D',0,v),()=>col('F',0),v=>setCol('F',0,v));
    if(face==='F')cycle(()=>row('U',2),v=>setRow('U',2,v),()=>col('L',2).reverse(),v=>setCol('L',2,v.slice().reverse()),()=>row('D',0),v=>setRow('D',0,v),()=>col('R',0),v=>setCol('R',0,v));
    if(face==='B')cycle(()=>row('U',0),v=>setRow('U',0,v),()=>col('R',2),v=>setCol('R',2,v),()=>row('D',2),v=>setRow('D',2,v),()=>col('L',0).reverse(),v=>setCol('L',0,v.slice().reverse()));
  }
}
function applyMove(move){
  if(move.endsWith('2')){applyBaseMove(move[0]);applyBaseMove(move[0]);}
  else applyBaseMove(move);
  lastTouched=move[0];
  history.push(move);
  log.textContent='Moves: '+history.slice(-18).join(' ');
  renderCube();
}
async function applySequence(sequence){
  if(isPlaying)return;
  isPlaying=true;
  for(const move of sequence){
    applyMove(move);
    await new Promise(resolve=>setTimeout(resolve,260));
  }
  isPlaying=false;
}
function renderCube(){
  cube.innerHTML='';
  faceOrder.forEach(face=>{
    const faceEl=document.createElement('div');
    faceEl.className='cube-face face-'+face;
    faceEl.dataset.face=face;
    cubeState[face].forEach(colorKey=>{
      const cell=document.createElement('div');
      cell.className='sticker'+(lastTouched===face?' flash':'');
      cell.style.backgroundColor=palette[colorKey];
      faceEl.appendChild(cell);
    });
    cube.appendChild(faceEl);
  });
  setTimeout(()=>{lastTouched='';document.querySelectorAll('.flash').forEach(el=>el.classList.remove('flash'));},170);
}
function renderStep(){
  const current=steps[step];
  document.getElementById('stepTitle').textContent=current.title;
  document.getElementById('stepText').textContent=current.text;
  document.getElementById('playStep').onclick=()=>applySequence(current.seq);
  const box=document.getElementById('stepMoves');
  box.innerHTML='';
  current.seq.forEach(move=>{
    const button=document.createElement('button');
    button.textContent=move;
    button.dataset.move=move;
    button.setAttribute('aria-label','Practice move '+move);
    button.onclick=()=>applyMove(move);
    box.appendChild(button);
  });
}
const controls=document.getElementById('manualControls');
moves.forEach(move=>{
  const button=document.createElement('button');
  button.textContent=move;
  button.dataset.move=move;
  button.setAttribute('aria-label','Practice move '+move);
  button.onclick=()=>applyMove(move);
  controls.appendChild(button);
});
document.getElementById('prev').onclick=()=>{step=Math.max(0,step-1);renderStep();};
document.getElementById('next').onclick=()=>{step=Math.min(steps.length-1,step+1);renderStep();};
document.getElementById('reset').onclick=()=>{const fresh=JSON.parse(solved);Object.keys(fresh).forEach(face=>cubeState[face]=fresh[face]);history=[];log.textContent='Moves: none';renderCube();};
renderCube();
renderStep();
</script>"""

@router.post("/ater/artifact/repair")
async def repair_artifact_code(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Repairs sandbox code after a client-side runtime error."""
    ai_key = secrets.ai_key
    if not ai_key:
        raise HTTPException(status_code=400, detail="AI API Key missing")

    code = payload.get("code", "")
    error = payload.get("error", "")
    stack = payload.get("stack", "")
    if not code:
        raise HTTPException(status_code=400, detail="code is required")

    try:
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider or "google",
            model_name=secrets.ai_model or "gemini-2.0-flash",
            api_key=ai_key,
            temperature=0.1,
            max_tokens=2500,
        )
        sys_prompt = """Repair a self-contained browser sandbox snippet.
Return raw corrected HTML/CSS/JavaScript only. Do not explain, use markdown fences, or omit existing intended behavior."""
        human_prompt = f"""Runtime error:
{error}

Stack:
{stack}

Broken code:
{code}

Return corrected code only."""
        res = await llm.ainvoke([("system", sys_prompt), ("human", human_prompt)])
        code = res.content.strip() if hasattr(res, "content") else str(res).strip()
        return {"code": _clean_markdown_fences(code)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/quick-questions")
async def ater_quick_questions(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates 3 quick conceptual questions based on document context."""
    ai_key = secrets.ai_key
    if not ai_key:
        raise HTTPException(status_code=400, detail="AI API Key missing")

    provider = secrets.ai_provider or "google"
    model = secrets.ai_model or "gemini-2.0-flash"

    selection = payload.get("selection", "")
    selection_context = payload.get("selection_context", "")
    page = payload.get("page")
    note_title = payload.get("note_title", "")

    context_str = ""
    if selection:
        context_str += f"Selection: \"{selection}\"\n"
    if selection_context:
        context_str += f"Selection context: \"{selection_context}\"\n"
    if page:
        context_str += f"Page: {page}\n"
    if note_title:
        context_str += f"Document Title: {note_title}\n"

    try:
        llm = ModelFactory.get_model(
            provider=provider,
            model_name=model,
            api_key=ai_key,
            temperature=0.7,
            max_tokens=2000
        )

        sys_prompt = f"""You are Ater's Socratic Tutor. Based on the following document context, generate exactly 3 quick conceptual questions that a student can answer to verify their understanding:
{context_str}

Provide the questions in a clean, readable Markdown format with bold question numbers, and include short guidance or hints for each question."""

        res = await llm.ainvoke([("system", sys_prompt), ("human", "Generate the quick questions now.")])
        return {"answer": res.content, "questions": res.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Persistent Chat Runtime Router Endpoints ---
from src.domains.ater.chat_runtime import ChatStorage
from src.domains.ater.chat_runtime.memory import MemoryManager
from src.domains.ater.chat_runtime.attachments import AttachmentManager
from src.domains.ater.chat_runtime.streaming import StreamingManager

def get_chat_runtime_components(secrets: AppSecrets = Depends(get_app_secrets)):
    base_dir = Path(secrets.inbox_path) if secrets.inbox_path else (Path(secrets.vault_path) / "Inbox" if secrets.vault_path else Path("."))
    db_path = base_dir / "ater_queue.db"
    storage = ChatStorage(db_path)
    memory_manager = MemoryManager(storage)
    attachment_manager = AttachmentManager(storage, secrets.vault_path, secrets.inbox_path)
    streaming_manager = StreamingManager(storage, memory_manager, attachment_manager)
    return {
        "storage": storage,
        "memory_manager": memory_manager,
        "attachment_manager": attachment_manager,
        "streaming_manager": streaming_manager
    }

@router.post("/chat/conversations")
async def create_conversation(
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    title = payload.get("title", "New Conversation")
    metadata = payload.get("metadata", {})
    return deps["storage"].create_conversation(title=title, metadata=metadata)

@router.get("/chat/conversations")
async def list_conversations(
    include_archived: bool = Query(False),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    return deps["storage"].list_conversations(include_archived=include_archived)

@router.get("/chat/conversations/{conv_id}")
async def get_conversation(
    conv_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    conv = deps["storage"].get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.patch("/chat/conversations/{conv_id}")
async def patch_conversation(
    conv_id: str,
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    storage = deps["storage"]
    updated = False
    if "title" in payload:
        updated = storage.rename_conversation(conv_id, payload["title"])
    if "metadata" in payload:
        curr = storage.get_conversation(conv_id)
        if curr:
            new_meta = {**curr.get("metadata", {}), **payload["metadata"]}
            updated = storage.update_conversation_metadata(conv_id, new_meta)
    return {"success": updated}

@router.delete("/chat/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    hard: bool = Query(False),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    success = deps["storage"].delete_conversation(conv_id, hard=hard)
    return {"success": success}

@router.post("/chat/conversations/{conv_id}/archive")
async def archive_conversation(
    conv_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    success = deps["storage"].archive_conversation(conv_id, archive=True)
    return {"success": success}

@router.post("/chat/conversations/{conv_id}/restore")
async def restore_conversation(
    conv_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    success = deps["storage"].archive_conversation(conv_id, archive=False)
    return {"success": success}

# --- Messages & Streaming ---
@router.get("/chat/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    conv = deps["storage"].get_conversation(conv_id)
    if not conv or conv.get("deleted_at") is not None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return deps["storage"].get_messages(conv_id)

@router.post("/chat/conversations/{conv_id}/messages")
async def append_historical_message(
    conv_id: str,
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    role = payload.get("role", "user")
    content = payload.get("content", "")
    status = payload.get("status", "completed")
    parent_message_id = payload.get("parent_message_id")
    metadata = payload.get("metadata")
    return deps["storage"].append_message(
        conv_id=conv_id,
        role=role,
        content=content,
        status=status,
        parent_message_id=parent_message_id,
        metadata=metadata
    )

@router.post("/chat/conversations/{conv_id}/stream")
async def stream_turn(
    conv_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    user_message = payload.get("message", "")
    parent_message_id = payload.get("parent_message_id")
    token_budget = payload.get("token_budget", 8000)
    rag_context = payload.get("rag_context")
    user_context = payload.get("user_context")
    active_artifact = payload.get("active_artifact")

    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI API key is required. Please set it in Settings.")

    async def sse_generator():
        try:
            async for event in deps["streaming_manager"].stream_assistant_turn(
                conversation_id=conv_id,
                user_message_content=user_message,
                secrets=secrets,
                parent_message_id=parent_message_id,
                token_budget=token_budget,
                rag_context=rag_context,
                user_context=user_context,
                active_artifact=active_artifact
            ):
                yield event
        except Exception as e:
            logger.error(f"[Chat Stream] turn error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.post("/chat/stream/cancel")
async def cancel_stream(
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    run_id = payload.get("run_id", "")
    success = deps["streaming_manager"].cancel_stream_run(run_id)
    return {"success": success}

@router.post("/chat/conversations/{conv_id}/regenerate")
async def regenerate_message(
    conv_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    assistant_message_id = payload.get("message_id", "")
    msg = deps["storage"].get_message(assistant_message_id)
    if not msg or msg["role"] != "assistant":
        raise HTTPException(status_code=400, detail="Invalid assistant message ID")
        
    parent_user_msg_id = msg["parent_message_id"]
    if not parent_user_msg_id:
        raise HTTPException(status_code=400, detail="Parent user message not found")
        
    parent_user_msg = deps["storage"].get_message(parent_user_msg_id)
    if not parent_user_msg:
        raise HTTPException(status_code=400, detail="Parent user message content not found")

    async def sse_generator():
        try:
            async for event in deps["streaming_manager"].stream_assistant_turn(
                conversation_id=conv_id,
                user_message_content=parent_user_msg["content"],
                secrets=secrets,
                parent_message_id=parent_user_msg_id,
                is_regenerate=True
            ):
                yield event
        except Exception as e:
            logger.error(f"[Chat Regen] error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.post("/chat/conversations/{conv_id}/branch")
async def branch_message(
    conv_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    message_id = payload.get("message_id", "")
    new_content = payload.get("content", "")
    
    # Verify that the message belongs to the specified conversation
    messages = deps["storage"].get_messages(conv_id)
    if not any(msg["id"] == message_id for msg in messages):
        raise HTTPException(status_code=400, detail="Message does not belong to this conversation")
        
    res = deps["streaming_manager"].branch_from_message(conv_id, message_id, new_content, secrets)
    
    branch_id = res["branch_id"]
    new_user_message_id = res["new_user_message_id"]

    async def sse_generator():
        yield f"data: {json.dumps({'type': 'branch_created', 'branch_id': branch_id, 'new_user_message_id': new_user_message_id})}\n\n"
        try:
            async for event in deps["streaming_manager"].stream_assistant_turn(
                conversation_id=conv_id,
                user_message_content=new_content,
                secrets=secrets,
                parent_message_id=new_user_message_id,
                is_regenerate=True
            ):
                yield event
        except Exception as e:
            logger.error(f"[Chat Branch] error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# --- Memories ---
@router.get("/chat/memories")
async def list_memories(
    conversation_id: Optional[str] = Query(None),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    return deps["memory_manager"].list_memories(conversation_id)

@router.post("/chat/memories")
async def create_memory(
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    scope = payload.get("scope", "durable")
    content = payload.get("content", "")
    confidence = payload.get("confidence", 1.0)
    conversation_id = payload.get("conversation_id")
    source_message_id = payload.get("source_message_id")
    status = payload.get("status", "accepted")

    if scope == "durable":
        return deps["memory_manager"].create_durable_memory(
            content=content, confidence=confidence, source_message_id=source_message_id, status=status
        )
    else:
        return deps["memory_manager"].create_session_memory(
            conversation_id=conversation_id, content=content, confidence=confidence, source_message_id=source_message_id, status=status
        )

@router.patch("/chat/memories/{memory_id}")
async def patch_memory(
    memory_id: str,
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    storage = deps["storage"]
    success = False
    if "enabled" in payload:
        success = storage.update_memory_status(memory_id, payload["enabled"])
    if "status" in payload:
        success = storage.update_memory_approval(memory_id, payload["status"])
    return {"success": success}

@router.delete("/chat/memories/{memory_id}")
async def delete_memory(
    memory_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    success = deps["storage"].delete_memory(memory_id)
    return {"success": success}

# --- Attachments ---
@router.post("/chat/conversations/{conv_id}/attachments")
async def upload_attachment(
    conv_id: str,
    payload: Dict[str, Any] = Body(...),
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    file_path = payload.get("file_path", "")
    file_type = payload.get("file_type", "")
    message_id = payload.get("message_id")
    content = payload.get("content")
    
    attachment = deps["attachment_manager"].attach_file(
        conversation_id=conv_id, file_path=file_path, file_type=file_type, message_id=message_id, content=content
    )
    return attachment

@router.get("/chat/conversations/{conv_id}/attachments")
async def list_attachments(
    conv_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    return deps["attachment_manager"].get_attachments(conv_id)

@router.post("/chat/attachments/{attachment_id}/promote")
async def promote_attachment(
    attachment_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    promoted = deps["attachment_manager"].promote_to_source_grounded_curriculum(attachment_id)
    return promoted

# --- Tool Timeline ---
@router.get("/chat/messages/{message_id}/tools")
async def get_message_tools(
    message_id: str,
    deps: Dict[str, Any] = Depends(get_chat_runtime_components)
):
    return deps["storage"].get_tool_calls(message_id)
