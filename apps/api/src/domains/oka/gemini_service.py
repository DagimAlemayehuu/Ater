"""
OKA Gemini Service - Handles all Gemini API interactions for OKA.
Includes document upload, plan generation, chat, batch processing, and background worker.
"""

import os
import asyncio
import re
import json
from google import genai
from google.genai import types
from sqlalchemy.future import select
from loguru import logger

from src.domains.oka.models import JobQueue, OkaSettings
from src.domains.oka.vault_utils import VaultUtils

# Logging setup
DATA_DIR = os.path.join(os.path.expanduser("~"), ".life-os", "oka")
os.makedirs(DATA_DIR, exist_ok=True)
LOG_FILE = os.path.join(DATA_DIR, "gemini_debug.log")
logger.add(LOG_FILE, rotation="1 MB")


async def upload_document(file_path: str, api_key: str) -> str:
    """
    Uploads a document and returns a stable file name (e.g. "files/abc123").
    This name is used later with `client.files.get(name=...)`.
    """
    client = genai.Client(api_key=api_key)
    # Prefer async client when available, fall back to sync in a thread.
    try:
        uploaded = await client.aio.files.upload(file=file_path)
    except Exception:
        uploaded = await asyncio.to_thread(client.files.upload, file=file_path)
    finally:
        try:
            await client.aio.aclose()
        except Exception:
            try:
                client.close()
            except Exception:
                pass
    return uploaded.name


def get_academic_profile() -> str:
    """Reads the user's Academic Profile from available sources."""
    try:
        from pathlib import Path
        root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        
        # Priority order for profile locations
        locations = [
            root_dir / "resources" / "templates" / "academic_profile.md",
            root_dir / "resources" / "reference" / "academic_profile.md",
        ]
        
        for profile_path in locations:
            if profile_path.exists():
                with open(profile_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        return content
    except Exception as e:
        logger.warning(f"Could not load academic profile: {e}")
    return ""

def inject_academic_context(system_prompt: str, profile: str) -> str:
    """Injects the academic profile into the system prompt with clear demarcation."""
    if not profile:
        return system_prompt.replace("[INSERT_ACADEMIC_CONTEXT_HERE]", "No academic profile available.")
    
    formatted_profile = (
        "\n\n--- BEGIN USER ACADEMIC PROFILE ---\n"
        "The following information represents the user's current academic status, including active courses, "
        "upcoming deadlines, and identified knowledge deficits. Use this to prioritize and tailor "
        "the depth and focus of the generated notes.\n\n"
        f"{profile}\n"
        "--- END USER ACADEMIC PROFILE ---\n\n"
    )
    
    if "[INSERT_ACADEMIC_CONTEXT_HERE]" in system_prompt:
        return system_prompt.replace("[INSERT_ACADEMIC_CONTEXT_HERE]", formatted_profile)
    
    # Fallback: append if placeholder not found
    return f"{system_prompt}\n\n{formatted_profile}"


def audit_generated_text(text: str) -> str | None:
    """Audits the raw Gemini output — only checks for actual note blocks."""
    # The only hard requirement: at least one parseable note block.
    pattern = re.compile(r'--- START_NOTE ---(.*?)--- END_NOTE ---', re.DOTALL)
    matches = pattern.findall(text)
    if not matches:
        return "CRITICAL FAILURE: No notes found. You must output at least one --- START_NOTE --- ... --- END_NOTE --- block."

    return None


def parse_gemini_response(text: str) -> list[dict]:
    """Parses Gemini's response to extract individual notes."""
    notes = []
    pattern = re.compile(r'--- START_NOTE ---(.*?)--- END_NOTE ---', re.DOTALL)
    matches = pattern.findall(text)

    for match in matches:
        content = match.strip()
        # Prefer YAML values for title/type (used by deployer)
        title = "Untitled"
        note_type = "Concept"
        yaml_match = re.search(r'^---\s*(.*?)\s*---', content, re.DOTALL)
        if yaml_match:
            yaml_text = yaml_match.group(1)
            t_match = re.search(r'^title:\s*"?(.+?)"?\s*$', yaml_text, re.MULTILINE | re.IGNORECASE)
            if t_match:
                title = t_match.group(1).strip()
            ty_match = re.search(r'^type:\s*"?(.+?)"?\s*$', yaml_text, re.MULTILINE | re.IGNORECASE)
            if ty_match:
                note_type = ty_match.group(1).strip()
        else:
            # Fallback to first H1 if YAML missing (should be blocked by audit)
            title_match = re.search(r'^#\s+(.*?)$', content, re.MULTILINE)
            if title_match:
                title = title_match.group(1).strip()

        notes.append({
            "title": title,
            "content": content,
            "type": note_type,
        })

    return notes


def _has_yaml_frontmatter(note_content: str) -> bool:
    return bool(re.search(r'^---\s*[\s\S]*?\s*---', note_content))


def _inject_yaml_frontmatter(note_content: str, *, title: str, note_type: str, meta: dict) -> str:
    """
    Guarantee deployable notes even if the model omits YAML.
    Uses VaultUtils canonicalization rules and the job metadata override.
    """
    canonical_title = VaultUtils.get_canonical_title(title or "Untitled")
    canonical_unit = VaultUtils.get_canonical_title(meta.get("unit_name") or meta.get("unit") or "Uncategorized_Unit")
    canonical_course = VaultUtils.get_canonical_title(meta.get("course_name") or meta.get("course") or "General_Computer_Science")
    canonical_year = VaultUtils.get_canonical_title(meta.get("year") or "Unsorted_Year")
    canonical_semester = VaultUtils.get_canonical_title(meta.get("semester") or "Unsorted_Semester")
    canonical_type = (note_type or "Concept").strip()

    yaml = (
        "---\n"
        f"title: \"{canonical_title}\"\n"
        f"type: \"{canonical_type}\"\n"
        f"year: \"{canonical_year}\"\n"
        f"semester: \"{canonical_semester}\"\n"
        f"course: \"{canonical_course}\"\n"
        f"unit: \"{canonical_unit}\"\n"
        "---\n"
    )

    body = note_content.lstrip()
    return yaml + "\n" + body


def _extract_text_from_response(response) -> str | None:
    """
    google-generativeai's `response.text` accessor throws when there are no valid text Parts.
    In the wild, Gemini sometimes returns a candidate with a STOP finish_reason but no text parts.
    """
    if response is None:
        return None

    # Best-effort: use quick accessor if it works.
    try:
        txt = response.text
        if txt and isinstance(txt, str):
            return txt
    except Exception:
        pass

    try:
        if not getattr(response, "candidates", None):
            return None
        candidate = response.candidates[0]
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        texts: list[str] = []
        for p in parts:
            t = getattr(p, "text", None)
            if t:
                texts.append(t)
        joined = "\n".join(texts).strip()
        return joined or None
    except Exception:
        return None


def _summarize_response_for_logs(response) -> str:
    try:
        cand = response.candidates[0] if getattr(response, "candidates", None) else None
        fr = getattr(cand, "finish_reason", None)
        parts = getattr(getattr(cand, "content", None), "parts", None) or []
        part_kinds = []
        for p in parts:
            if getattr(p, "text", None):
                part_kinds.append("text")
            else:
                part_kinds.append(type(p).__name__)
        return f"finish_reason={fr} parts={part_kinds}"
    except Exception:
        return "unavailable"


async def process_job(db, job_id: int):
    """Processes a single OKA generation job with retry logic."""
    result = await db.execute(select(JobQueue).where(JobQueue.id == job_id))
    job = result.scalar_one_or_none()

    settings_result = await db.execute(select(OkaSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    if not job or not settings or not settings.google_api_key:
        if job:
            job.status = "failed"
            job.error_message = "OKA Settings missing or Google API key not configured."
            await db.commit()
        return

    max_retries = 3
    for attempt in range(max_retries):
        aclient = None
        try:
            model_name = (settings.selected_model or "gemini-2.5-flash").strip()
            client = genai.Client(api_key=settings.google_api_key)
            aclient = client.aio

            # Retrieve the uploaded file by its stable name (e.g. "files/abc123")
            gemini_file = await aclient.files.get(name=job.file_uri)

            # Prepare system prompt with academic context
            academic_profile = get_academic_profile()
            sys_prompt_b = inject_academic_context(settings.system_instruction_part_b, academic_profile)
            sys_prompt = f"{settings.system_instruction_part_a}\n\n{sys_prompt_b}"

            notes_context = ""
            if job.batch_notes:
                notes_context = f"\nFor this BATCH, you MUST ONLY generate the following notes: {job.batch_notes}\n"

            metadata_context = ""
            meta_dict: dict = {}
            if job.metadata_json:
                try:
                    meta = json.loads(job.metadata_json)
                    meta_dict = meta if isinstance(meta, dict) else {}
                    metadata_context = "\n--- ACTION: METADATA_SYNCHRONIZATION (OVERRIDE) ---\n"
                    metadata_context += "Use the following specific metadata for the YAML Frontmatter and paths for ALL notes in this batch:\n"
                    metadata_context += f"Academic Year: {meta.get('year')}\n"
                    metadata_context += f"Semester: {meta.get('semester')}\n"
                    metadata_context += f"Course (YAML field: course): {meta.get('course_name')}\n"
                    metadata_context += f"Course Code (optional): {meta.get('course_code')}\n"
                    metadata_context += f"Unit (YAML field: unit): {meta.get('unit_name')}\n"
                    metadata_context += f"Credits (optional): {meta.get('credits')}\n"
                    metadata_context += "---------------------------------------------------------\n"
                except Exception:
                    pass

            yaml_skeleton = (
                "---\n"
                "title: \"<CANONICAL_TITLE_CASE_WITH_UNDERSCORES>\"\n"
                "type: \"<Hub|Questions|Foundational|Core|Supporting|Unit>\"\n"
                "year: \"<YEAR>\"\n"
                "semester: \"<SEMESTER>\"\n"
                "course: \"<COURSE>\"\n"
                "unit: \"<UNIT>\"\n"
                "---\n"
            )

            if job.batch_id == 1:
                batch_instruction = (
                    "\n\n--- ACTION: BATCH_SYNTHESIS_INITIATION ---\n"
                    f"This is BATCH 1. {notes_context}"
                    "Your task is to generate the HUB file (index of the unit) and the fundamental notes as specified.\n"
                    "CRITICAL: You MUST wrap EVERY generated note with the following delimiters:\n"
                    "--- START_NOTE ---\n\n"
                    f"{yaml_skeleton}\n"
                    "# <H1 Title>\n"
                    "<Markdown body>\n\n"
                    "--- END_NOTE ---\n"
                    "CRITICAL: The YAML frontmatter above is MANDATORY and must include: title, type, year, semester, course, unit.\n"
                )
            else:
                batch_instruction = (
                    f"\n\n--- ACTION: BATCH_SYNTHESIS_CONTINUATION ---\n"
                    f"This is BATCH {job.batch_id}. {notes_context}"
                    "Continue generating the topical notes exactly as named in the architectural plan.\n"
                    "CRITICAL: You MUST wrap EVERY generated note with the following delimiters:\n"
                    "--- START_NOTE ---\n\n"
                    f"{yaml_skeleton}\n"
                    "# <H1 Title>\n"
                    "<Markdown body>\n\n"
                    "--- END_NOTE ---\n"
                    "CRITICAL: The YAML frontmatter above is MANDATORY and must include: title, type, year, semester, course, unit.\n"
                )

            full_prompt = (
                "start\n" + sys_prompt + metadata_context + batch_instruction
                + "\n\nBegin generating Batch " + str(job.batch_id)
                + " notes now. Do not provide conversational filler. Output ONLY the note blocks."
            )

            # Wait until the file is active (with timeout)
            max_wait_seconds = 600 # 10 minutes max for very large files
            waited = 0
            while getattr(getattr(gemini_file, "state", None), "name", None) == "PROCESSING" and waited < max_wait_seconds:
                await asyncio.sleep(5) # Increased from 2s to reduce rate-limit pressure
                waited += 5
                gemini_file = await aclient.files.get(name=job.file_uri)

            if getattr(getattr(gemini_file, "state", None), "name", None) == "PROCESSING":
                logger.error(f"Job {job.id} timed out waiting for file processing")
                job.status = "failed"
                job.error_message = "Timeout waiting for Gemini file processing."
                await db.commit()
                await aclient.aclose()
                return

            if getattr(getattr(gemini_file, "state", None), "name", None) == "FAILED":
                job.status = "failed"
                job.error_message = "Gemini file processing failed."
                await db.commit()
                await aclient.aclose()
                return
            gen_config = types.GenerateContentConfig(
                system_instruction=sys_prompt,
                max_output_tokens=65536,
                temperature=0.2,
            )

            max_audit_retries = 3
            current_prompt = full_prompt
            response = None
            error_message = None

            for audit_attempt in range(max_audit_retries):
                response = await aclient.models.generate_content(
                    model=model_name,
                    contents=[current_prompt, gemini_file],
                    config=gen_config,
                )
                
                if not response.candidates:
                    raise Exception("Gemini returned no candidates. Safety filter might be active.")

                response_text = _extract_text_from_response(response)
                if not response_text:
                    # Transient API edge-case; retry with small backoff.
                    logger.warning(
                        "Gemini returned a candidate with no text parts. "
                        f"({_summarize_response_for_logs(response)})"
                    )
                    await asyncio.sleep(2)
                    continue

                error_message = audit_generated_text(response_text)
                if error_message:
                    logger.warning(f"Audit failed (Attempt {audit_attempt + 1}): {error_message}")
                    with open("/tmp/gemini_failed_output.txt", "w") as f: f.write(response_text)
                    # Keep the full system + batch prompt, but prepend a strict correction.
                    current_prompt = (
                        full_prompt
                        + "\n\nYOUR PREVIOUS ATTEMPT FAILED.\nREASON: "
                        + error_message
                        + "\nFix this immediately and regenerate the ENTIRE batch. "
                        + "Return ONLY the internal audit + note blocks."
                    )
                else:
                    break
            
            if error_message:
                logger.error(f"Job {job.id} failed audit after {max_audit_retries} attempts.")
                job.status = "failed"
                job.error_message = error_message
                await db.commit()
                return

            final_text = _extract_text_from_response(response)
            if not final_text:
                raise Exception(
                    "Gemini returned no text parts after audit passed. "
                    f"({_summarize_response_for_logs(response)})"
                )

            parsed_notes = parse_gemini_response(final_text)
            if not parsed_notes:
                job.status = "failed"
                job.error_message = (
                    "Generation returned text but no notes were parsed. "
                    "Ensure the model outputs '--- START_NOTE ---' and '--- END_NOTE ---' blocks."
                )
                await db.commit()
                return

            # Post-process: ensure every note is deployable (YAML required by VaultUtils)
            for n in parsed_notes:
                c = n.get("content", "")
                if not _has_yaml_frontmatter(c):
                    n["content"] = _inject_yaml_frontmatter(
                        c,
                        title=n.get("title", ""),
                        note_type=n.get("type", ""),
                        meta=meta_dict,
                    )

            job.status = "completed"
            job.result_json = json.dumps(parsed_notes)
            job.error_message = None
            await db.commit()
            await aclient.aclose()
            return parsed_notes

        except Exception as e:
            err_msg = str(e)
            logger.warning(f"Error processing job (Attempt {attempt + 1}/{max_retries}): {err_msg}")

            if "429" in err_msg or "Quota" in err_msg or "ResourceExhausted" in err_msg:
                if attempt < max_retries - 1:
                    logger.info("Hit 429 Rate Limit. Sleeping for 45s before retrying...")
                    await asyncio.sleep(45)
                    continue

            job.status = "failed"
            job.error_message = err_msg
            await db.commit()
            if aclient:
                try:
                    await aclient.aclose()
                except Exception:
                    pass
            return


def _repair_json(text: str) -> str:
    """Attempt to repair common JSON issues from Gemini output."""
    text = text.strip()
    # Remove markdown code fences if present
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)

    # Remove trailing commas before closing brackets/braces
    text = re.sub(r',\s*([}\]])', r'\1', text)

    # If JSON is truncated (doesn't end with }), try to close it
    if text and not text.rstrip().endswith('}'):
        logger.warning("JSON appears truncated, attempting repair...")
        # Count open/close braces and brackets
        open_braces = text.count('{') - text.count('}')
        open_brackets = text.count('[') - text.count(']')

        # Find the last complete object and truncate there
        # Strategy: try to find the last complete batch entry
        # Remove any trailing incomplete object/string
        # First, try removing trailing partial content after last complete note/batch
        last_good = text
        
        # Try trimming from the end to find a parseable JSON
        for trim_marker in ['}, {', '},\n    {', '}\n  ]', '},\n  ]']:
            idx = text.rfind(trim_marker)
            if idx > 0:
                candidate = text[:idx + 1]
                # Close remaining brackets/braces
                ob = candidate.count('{') - candidate.count('}')
                obrk = candidate.count('[') - candidate.count(']')
                candidate += ']' * obrk + '}' * ob
                try:
                    json.loads(candidate)
                    logger.info("JSON repair succeeded via trim strategy")
                    return candidate
                except json.JSONDecodeError:
                    continue

        # Brute force: just close everything
        last_good += ']' * open_brackets + '}' * open_braces
        return last_good

    return text


async def generate_plan(
    file_uri: str, api_key: str, model_name: str,
    sys_prompt_a: str, sys_prompt_b: str,
) -> dict:
    """Generates an architectural plan for the knowledge assets from a source document."""
    model_name = (model_name or "gemini-2.5-flash").strip()
    client = genai.Client(api_key=api_key)
    aclient = client.aio

    gemini_file = await aclient.files.get(name=file_uri)
    max_wait_seconds = 300
    waited = 0
    while getattr(getattr(gemini_file, "state", None), "name", None) == "PROCESSING" and waited < max_wait_seconds:
        await asyncio.sleep(5)
        waited += 5
        gemini_file = await aclient.files.get(name=file_uri)

    if getattr(getattr(gemini_file, "state", None), "name", None) == "PROCESSING":
        await aclient.aclose()
        raise Exception("Timeout waiting for Gemini to process the document")

    if getattr(getattr(gemini_file, "state", None), "name", None) == "FAILED":
        await aclient.aclose()
        raise Exception("Gemini file processing failed")

    plan_prompt = (
        "Analyze the attached source material and create an architectural plan for knowledge notes.\n"
        "Return ONLY a valid JSON object with this exact structure:\n"
        '{\n'
        '  "unit_name": "Canonical_Name_of_the_Unit",\n'
        '  "year": "Year_XX",\n'
        '  "semester": "Semester_X",\n'
        '  "course_name": "Course_Name",\n'
        '  "course_code": "CSXXXX",\n'
        '  "credits": 4,\n'
        '  "total_notes": 15,\n'
        '  "batches": [\n'
        '    {\n'
        '      "batch_id": 1,\n'
        '      "notes": [\n'
        '        {"title": "Unit_Name_Hub", "type": "Hub", "reasoning": "Central navigation hub"},\n'
        '        {"title": "Possible_Questions", "type": "Questions", "reasoning": "Assessment foundation"}\n'
        '      ]\n'
        '    },\n'
        '    {"batch_id": 2, "notes": [{"title": "Topic_Name", "type": "Core", "reasoning": "Reason"}]}\n'
        '  ]\n'
        '}\n\n'
        "Rules:\n"
        "1. Batch 1 MUST contain exactly 2 notes: the Hub and Possible Questions.\n"
        "2. Subsequent batches should contain 4-6 notes each (max 8).\n"
        "3. All titles must use Canonical_Title_Case_With_Underscores (no spaces, hyphens, or special chars).\n"
        "4. Note types: Hub, Questions, Foundational, Core, Supporting.\n"
        "5. Output ONLY the JSON. No text, no markdown, no code fences."
    )

    logger.info(f"Generating plan for file: {file_uri}")
    
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        response = None
        try:
            response = await aclient.models.generate_content(
                model=model_name,
                contents=[plan_prompt, gemini_file],
                config=types.GenerateContentConfig(
                    max_output_tokens=65536,
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )

            if not response.candidates:
                raise Exception("Gemini returned no candidates. Blocking or safety filter might be active.")

            text = _extract_text_from_response(response) or ""
            logger.debug(f"Gemini Raw Response (attempt {attempt + 1}): {text[:500]}...")

            # Extract JSON object from response
            json_match = re.search(r'(\{.*\})', text, re.DOTALL)
            json_text = json_match.group(1) if json_match else text
            json_text = json_text.strip()

            # First try direct parse
            try:
                result = json.loads(json_text)
                await aclient.aclose()
                return result
            except json.JSONDecodeError as je:
                logger.warning(f"Direct JSON parse failed (attempt {attempt + 1}): {je}")
                # Try repair
                repaired = _repair_json(json_text)
                try:
                    result = json.loads(repaired)
                    logger.info(f"JSON repair succeeded on attempt {attempt + 1}")
                    await aclient.aclose()
                    return result
                except json.JSONDecodeError as je2:
                    last_error = f"JSON parse failed after repair: {je2}"
                    logger.warning(f"JSON repair also failed (attempt {attempt + 1}): {je2}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2)
                        continue

        except Exception as e:
            err_str = str(e)
            last_error = err_str
            logger.error(f"Generate Plan Error (attempt {attempt + 1}): {err_str}")
            if response and hasattr(response, 'prompt_feedback'):
                logger.warning(f"Prompt Feedback: {response.prompt_feedback}")

            if "429" in err_str or "Quota" in err_str or "ResourceExhausted" in err_str:
                if attempt < max_retries - 1:
                    logger.info("Rate limited during plan generation, waiting 30s...")
                    await asyncio.sleep(30)
                    continue
                await aclient.aclose()
                raise Exception(
                    "Google API Limits Exceeded (429). Please wait a minute or switch to a different model."
                )
            if attempt >= max_retries - 1:
                await aclient.aclose()
                raise e
            await asyncio.sleep(2)
    
    await aclient.aclose()
    raise Exception(f"Plan generation failed after {max_retries} attempts: {last_error}")


async def chat_with_gemini(
    messages: list[dict], file_uri: str | None,
    api_key: str, model_name: str,
    sys_prompt_a: str, sys_prompt_b: str,
) -> str:
    """Runs a multi-turn chat with Gemini, optionally with a file context."""
    model_name = (model_name or "gemini-2.5-flash").strip()
    instruction = (
        f"{sys_prompt_a}\n\n{sys_prompt_b}\n\n"
        "You are in a collaborative chat mode. Help the user with their knowledge architecture tasks."
    )

    client = genai.Client(api_key=api_key)
    aclient = client.aio

    # Flatten messages into a readable transcript (simple + robust).
    transcript_lines: list[str] = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        transcript_lines.append(f"{role.upper()}: {content}")
    transcript = "\n".join(transcript_lines).strip()

    parts: list[object] = [transcript]
    if file_uri:
        try:
            f = await aclient.files.get(name=file_uri)
            parts.append(f)
        except Exception as e:
            logger.error(f"Failed to get gemini file for chat: {e}")

    response = await aclient.models.generate_content(
        model=model_name,
        contents=parts,
        config=types.GenerateContentConfig(system_instruction=instruction),
    )
    await aclient.aclose()

    if not response.candidates:
        return "No response generated by the model. It might have reached a quota limit or been blocked."

    return _extract_text_from_response(response) or ""


async def background_queue_worker(get_db_session):
    """Background worker that continuously processes pending OKA jobs."""
    while True:
        try:
            async for db in get_db_session():
                result = await db.execute(
                    select(JobQueue)
                    .where(JobQueue.status == 'pending')
                    .order_by(JobQueue.created_at)
                )
                job = result.scalars().first()

                if job:
                    job.status = "processing"
                    job.error_message = None
                    await db.commit()
                    await process_job(db, job.id)
                    # Small delay to prevent tight loop; keep UX responsive.
                    await asyncio.sleep(1)
                else:
                    await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Worker iteration error: {e}")
            await asyncio.sleep(5)
