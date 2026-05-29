import os
import shutil
import asyncio
import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Query
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
    
    # Save temporary file
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
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
            return {"file_uri": str(Path(temp_path).absolute()), "name": file.filename, "note": "Provider does not support direct file upload yet."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path) and secrets.ai_provider == "google":
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
    
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI API key is required. Please set it in Settings.")
        
    async def sse_generator():
        try:
            async for event in run_assistant_chat(secrets, messages_history, rag_context, user_context):
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

        human_prompt = f"""Quiz Question: {question}

Question Type: {q_type}
Correct Answer: {answer}
{f"Student's Answer: {user_answer}" if user_answer else ""}
{f'Existing Explanation: {explanation}' if explanation else ''}
{f'Additional Context: {context}' if context else ''}

Generate the mini-lesson now."""

        res = await llm.ainvoke([("system", sys_prompt), ("human", human_prompt)])
        return {"lesson": res.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
