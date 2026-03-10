"""
OKA Gemini Service - Handles all Gemini API interactions for OKA.
Includes document upload, plan generation, chat, batch processing, and background worker.
"""

import os
import asyncio
import re
import json
import google.generativeai as genai
from sqlalchemy.future import select
from loguru import logger

from src.domains.oka.models import JobQueue, OkaSettings

# Logging setup
DATA_DIR = os.path.join(os.path.expanduser("~"), ".life-os", "oka")
os.makedirs(DATA_DIR, exist_ok=True)
LOG_FILE = os.path.join(DATA_DIR, "gemini_debug.log")
logger.add(LOG_FILE, rotation="1 MB")


async def upload_document(file_path: str, api_key: str) -> str:
    """Uploads a document to Google AI Studio and returns the file URI."""
    genai.configure(api_key=api_key)
    uploaded_file = genai.upload_file(path=file_path)
    return uploaded_file.name


def get_academic_profile() -> str:
    """Reads the user's Academic Profile from the auto-synced markdown file."""
    try:
        from pathlib import Path
        # Resolve path to LifeOs/md templates/academic_profile.md
        root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        profile_path = root_dir / "resources" / "templates" / "academic_profile.md"
        
        if profile_path.exists():
            with open(profile_path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception as e:
        logger.warning(f"Could not load academic profile: {e}")
    return ""


def audit_generated_text(text: str) -> str | None:
    """Audits the raw Gemini output against critical OKA rules."""
    
    # 1. Prohibition of triple backticks
    if "```" in text:
        return "CRITICAL FAILURE: You used standard markdown code blocks (```). You MUST use --- START_CODE:{language} ---."
    
    # 2. Silent Planning Protocol (A.3.2)
    if "--- START_INTERNAL_AUDIT ---" not in text:
        return "CRITICAL FAILURE: You failed to begin your response with the required --- START_INTERNAL_AUDIT --- marker for the Silent Planning Protocol."

    # 3. Mandatory Output Blocks (A.2.3.2)
    # Every code/mermaid block needs a --- START_CODE:text --- block
    code_matches = re.findall(r'--- START_CODE:(\w+) ---', text)
    if code_matches:
        # Filter out 'text' since it's the output block itself
        actual_code_blocks = [m for m in code_matches if m != 'text']
        text_output_blocks = [m for m in code_matches if m == 'text']
        
        if len(actual_code_blocks) > len(text_output_blocks):
            return "CRITICAL FAILURE: You provided code/diagram blocks but failed to include a corresponding --- START_CODE:text --- simulated output block for each."

    # 4. Blank Line Precision (A.2.1)
    # --- START_NOTE --- must be followed by exactly one blank line (\n\n)
    if re.search(r'--- START_NOTE ---\n[^\n]', text):
        return "CRITICAL FAILURE: --- START_NOTE --- must be followed by exactly one blank line."
    
    # --- END_NOTE --- must be preceded by exactly one blank line
    if re.search(r'[^\n]\n--- END_NOTE ---', text):
        return "CRITICAL FAILURE: --- END_NOTE --- must be preceded by exactly one blank line."

    return None


def parse_gemini_response(text: str) -> list[dict]:
    """Parses Gemini's response to extract individual notes."""
    notes = []
    pattern = re.compile(r'--- START_NOTE ---(.*?)--- END_NOTE ---', re.DOTALL)
    matches = pattern.findall(text)

    for match in matches:
        content = match.strip()
        title_match = re.search(r'^#\s+(.*?)$', content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else "Untitled Note"

        note_type = "Concept"
        if "type: " in content.lower():
            type_match = re.search(r'type:\s*(.*?)$', content, re.IGNORECASE | re.MULTILINE)
            if type_match:
                note_type = type_match.group(1).strip()

        notes.append({
            "title": title,
            "content": content,
            "type": note_type,
        })

    return notes


async def process_job(db, job_id: int):
    """Processes a single OKA generation job with retry logic."""
    result = await db.execute(select(JobQueue).where(JobQueue.id == job_id))
    job = result.scalar_one_or_none()

    settings_result = await db.execute(select(OkaSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    if not job or not settings or not settings.google_api_key:
        return

    max_retries = 3
    for attempt in range(max_retries):
        try:
            genai.configure(api_key=settings.google_api_key)
            model = genai.GenerativeModel(model_name=settings.selected_model)

            gemini_file = genai.get_file(job.file_uri)

            sys_prompt_b = settings.system_instruction_part_b
            academic_profile = get_academic_profile()
            if academic_profile and "[INSERT_ACADEMIC_CONTEXT_HERE]" in sys_prompt_b:
                sys_prompt_b = sys_prompt_b.replace("[INSERT_ACADEMIC_CONTEXT_HERE]", academic_profile)

            sys_prompt = f"{settings.system_instruction_part_a}\n\n{sys_prompt_b}"

            notes_context = ""
            if job.batch_notes:
                notes_context = f"\nFor this BATCH, you MUST ONLY generate the following notes: {job.batch_notes}\n"

            metadata_context = ""
            if job.metadata_json:
                try:
                    meta = json.loads(job.metadata_json)
                    metadata_context = "\n--- ACTION: METADATA_SYNCHRONIZATION (OVERRIDE) ---\n"
                    metadata_context += "Use the following specific metadata for the YAML Frontmatter and paths for ALL notes in this batch:\n"
                    metadata_context += f"Academic Year: {meta.get('year')}\n"
                    metadata_context += f"Semester: {meta.get('semester')}\n"
                    metadata_context += f"Course Name: {meta.get('course_name')}\n"
                    metadata_context += f"Course Code: {meta.get('course_code')}\n"
                    metadata_context += f"Unit Name: {meta.get('unit_name')}\n"
                    metadata_context += f"Credits: {meta.get('credits')}\n"
                    metadata_context += "---------------------------------------------------------\n"
                except Exception:
                    pass

            if job.batch_id == 1:
                batch_instruction = (
                    "\n\n--- ACTION: BATCH_SYNTHESIS_INITIATION ---\n"
                    f"This is BATCH 1. {notes_context}"
                    "Your task is to generate the HUB file (index of the unit) and the fundamental notes as specified.\n"
                    "CRITICAL: You MUST wrap EVERY generated note with the following delimiters:\n"
                    "--- START_NOTE ---\n\n"
                    "Note Content Here\n\n"
                    "--- END_NOTE ---\n"
                )
            else:
                batch_instruction = (
                    f"\n\n--- ACTION: BATCH_SYNTHESIS_CONTINUATION ---\n"
                    f"This is BATCH {job.batch_id}. {notes_context}"
                    "Continue generating the topical notes exactly as named in the architectural plan.\n"
                    "CRITICAL: You MUST wrap EVERY generated note with the following delimiters:\n"
                    "--- START_NOTE ---\n\n"
                    "Note Content Here\n\n"
                    "--- END_NOTE ---\n"
                )

            full_prompt = (
                sys_prompt + metadata_context + batch_instruction
                + "\n\nBegin generating Batch " + str(job.batch_id)
                + " notes now. CRITICAL: You MUST begin your response strictly with --- START_INTERNAL_AUDIT --- to conduct your Silent Planning Protocol before writing the first --- START_NOTE ---. Do not provide conversational filler. Ensure EXACT blank line precision as per A.2.1."
            )

            # Wait until the file is active (with timeout)
            max_wait_seconds = 600 # 10 minutes max for very large files
            waited = 0
            while gemini_file.state.name == "PROCESSING" and waited < max_wait_seconds:
                await asyncio.sleep(5) # Increased from 2s to reduce rate-limit pressure
                waited += 5
                gemini_file = genai.get_file(job.file_uri)

            if gemini_file.state.name == "PROCESSING":
                logger.error(f"Job {job.id} timed out waiting for file processing")
                job.status = "failed"
                await db.commit()
                return

            if gemini_file.state.name == "FAILED":
                job.status = "failed"
                await db.commit()
                return

            from google.generativeai.types import HarmCategory, HarmBlockThreshold
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }

            max_audit_retries = 3
            current_prompt = full_prompt
            response = None
            error_message = None

            for audit_attempt in range(max_audit_retries):
                response = model.generate_content([current_prompt, gemini_file], safety_settings=safety_settings)
                
                if not response.candidates:
                    raise Exception("Gemini returned no candidates. Safety filter might be active.")
                
                error_message = audit_generated_text(response.text)
                if error_message:
                    logger.warning(f"Audit failed (Attempt {audit_attempt + 1}): {error_message}")
                    current_prompt = f"YOUR PREVIOUS ATTEMPT FAILED. REASON: {error_message}\nFix this immediately and regenerate the ENTIRE batch."
                else:
                    break
            
            if error_message:
                logger.error(f"Job {job.id} failed audit after {max_audit_retries} attempts.")
                job.status = "failed"
                await db.commit()
                return

            parsed_notes = parse_gemini_response(response.text)

            job.status = "completed"
            job.result_json = json.dumps(parsed_notes)
            await db.commit()
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
            await db.commit()
            return


async def generate_plan(
    file_uri: str, api_key: str, model_name: str,
    sys_prompt_a: str, sys_prompt_b: str,
) -> dict:
    """Generates an architectural plan for the knowledge assets from a source document."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name=model_name)

    gemini_file = genai.get_file(file_uri)
    max_wait_seconds = 300
    waited = 0
    while gemini_file.state.name == "PROCESSING" and waited < max_wait_seconds:
        await asyncio.sleep(5) # Increased from 2s
        waited += 5
        gemini_file = genai.get_file(file_uri)

    if gemini_file.state.name == "PROCESSING":
        raise Exception("Timeout waiting for Gemini to process the document")

    if gemini_file.state.name == "FAILED":
        raise Exception("Gemini file processing failed")

    plan_prompt = (
        f"{sys_prompt_a}\n\n{sys_prompt_b}\n\n"
        "--- ACTION: ARCHITECTURAL PLANNING PHASE (A.6.2.0) ---\n"
        "Analyze the source material and define the architectural blueprint for the Knowledge Assets.\n"
        "Return ONLY a JSON object with this structure:\n"
        "{\n"
        '  "unit_name": "Canonical_Name_of_the_Unit",\n'
        '  "year": "Year_XX",\n'
        '  "semester": "Semester_X",\n'
        '  "course_name": "Course_Name",\n'
        '  "course_code": "CSXXXX",\n'
        '  "credits": integer,\n'
        '  "total_notes": integer_count,\n'
        '  "batches": [\n'
        "    {\n"
        '      "batch_id": 1,\n'
        '      "notes": [\n'
        '        { "title": "Canonical_Unit_Name_Hub", "type": "Hub", "reasoning": "Central navigation hub" },\n'
        '        { "title": "Possible_Questions", "type": "Questions", "reasoning": "Assessment foundation" }\n'
        "      ]\n"
        "    },\n"
        '    { "batch_id": 2, "notes": [...] }\n'
        "  ]\n"
        "}\n"
        "CRITICAL REQUIREMENT 1: Batch 1 MUST ONLY contain exactly two files: the Hub and the Possible Questions note.\n"
        "CRITICAL REQUIREMENT 2: Every subsequent batch (Batch 2, Batch 3, etc.) SHOULD contain between 6 and 8 notes. Max 8.\n"
        "Do not include any text, markdown backticks, or filler. Only the raw JSON string."
    )

    logger.info(f"Generating plan for file: {file_uri}")
    response = None
    try:
        from google.generativeai.types import HarmCategory, HarmBlockThreshold
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        response = model.generate_content(
            [plan_prompt, gemini_file],
            safety_settings=safety_settings,
        )

        if not response.candidates:
            raise Exception("Gemini returned no candidates. Blocking or safety filter might be active.")

        text = response.text
        logger.debug(f"Gemini Raw Response: {text}")

        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        json_text = json_match.group(1) if json_match else text
        json_text = json_text.strip()
        return json.loads(json_text)

    except Exception as e:
        err_str = str(e)
        logger.error(f"Generate Plan Error: {err_str}")
        if response and hasattr(response, 'prompt_feedback'):
            logger.warning(f"Prompt Feedback: {response.prompt_feedback}")

        if "429" in err_str or "Quota" in err_str or "ResourceExhausted" in err_str:
            raise Exception(
                "Google API Limits Exceeded (429). You have hit the strict rate limit for the "
                "selected model. Please wait a minute or switch to a 'Flash' model."
            )
        raise e


async def chat_with_gemini(
    messages: list[dict], file_uri: str | None,
    api_key: str, model_name: str,
    sys_prompt_a: str, sys_prompt_b: str,
) -> str:
    """Runs a multi-turn chat with Gemini, optionally with a file context."""
    genai.configure(api_key=api_key)

    instruction = (
        f"{sys_prompt_a}\n\n{sys_prompt_b}\n\n"
        "You are in a collaborative chat mode. Help the user with their knowledge architecture tasks."
    )

    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=instruction,
    )

    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }

    gemini_file = None
    if file_uri:
        try:
            gemini_file = genai.get_file(file_uri)
        except Exception as e:
            logger.error(f"Failed to get gemini file: {e}")

    history = []
    for i, msg in enumerate(messages[:-1]):
        parts = [msg["content"]]
        if i == 0 and msg["role"] == "user" and gemini_file:
            parts.append(gemini_file)
        history.append({"role": msg["role"], "parts": parts})

    chat = model.start_chat(history=history)
    last_msg = messages[-1]["content"]

    final_parts = [last_msg]
    if not history and gemini_file:
        final_parts.append(gemini_file)

    response = await chat.send_message_async(final_parts, safety_settings=safety_settings)

    if not response.candidates:
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback.block_reason:
            return f"Response blocked by safety filters (Reason: {response.prompt_feedback.block_reason}). Please try a different query."
        return "No response generated by the model. It might have reached a quota limit or been blocked."

    candidate = response.candidates[0]
    if candidate.finish_reason != 1:
        return f"Generation incomplete. (Finish Reason: {candidate.finish_reason}). This often happens with long outputs or quota limits."

    return response.text


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
                    await db.commit()
                    await process_job(db, job.id)
                    await asyncio.sleep(30)
                else:
                    await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Worker iteration error: {e}")
            await asyncio.sleep(5)
