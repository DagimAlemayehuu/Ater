import asyncio
import logging
import time
from typing import Any

logger = logging.getLogger("Ater.AI.Retry")


def is_retryable_ai_error(exc: BaseException) -> bool:
    message = str(exc).lower()
    return any(
        token in message
        for token in [
            "500",
            "502",
            "503",
            "504",
            "gateway timeout",
            "internal",
            "timeout",
            "timed out",
            "readtimeout",
            "read operation timed out",
            "temporarily",
            "servererror",
            "server error",
        ]
    )


def invoke_llm_with_retry(
    llm: Any,
    messages: Any,
    *,
    label: str,
    attempts: int = 4,
    base_delay: float = 1.5,
):
    from src.domains.ater.governor import governor
    is_interactive = label not in {"source-note", "source-roadmap", "source-roadmap-repair"}
    
    if is_interactive:
        governor.active_interactive_calls += 1
        
    try:
        if label == "source-note":
            while governor.active_interactive_calls > 0:
                time.sleep(0.5)
                
        last_exc: BaseException | None = None
        for attempt in range(1, attempts + 1):
            try:
                return llm.invoke(messages)
            except Exception as exc:
                last_exc = exc
                if not is_retryable_ai_error(exc) or attempt >= attempts:
                    break
                delay = base_delay * attempt
                logger.warning(
                    "[AI] %s call failed on attempt %s/%s; retrying in %.1fs: %s",
                    label,
                    attempt,
                    attempts,
                    delay,
                    exc,
                )
                time.sleep(delay)
        raise last_exc  # type: ignore[misc]
    finally:
        if is_interactive:
            governor.active_interactive_calls = max(0, governor.active_interactive_calls - 1)


async def ainvoke_llm_with_retry(
    llm: Any,
    messages: Any,
    *,
    label: str,
    attempts: int = 4,
    base_delay: float = 1.5,
    timeout: float | None = None,
):
    from src.domains.ater.governor import governor
    is_interactive = label not in {"source-note", "source-roadmap", "source-roadmap-repair"}
    
    if is_interactive:
        governor.active_interactive_calls += 1
        
    try:
        if label == "source-note":
            while governor.active_interactive_calls > 0:
                await asyncio.sleep(0.5)
                
        last_exc: BaseException | None = None
        for attempt in range(1, attempts + 1):
            try:
                call = llm.ainvoke(messages)
                return await asyncio.wait_for(call, timeout=timeout) if timeout else await call
            except Exception as exc:
                last_exc = exc
                if not is_retryable_ai_error(exc) or attempt >= attempts:
                    break
                delay = base_delay * attempt
                logger.warning(
                    "[AI] %s call failed on attempt %s/%s; retrying in %.1fs: %s",
                    label,
                    attempt,
                    attempts,
                    delay,
                    exc,
                )
                await asyncio.sleep(delay)
        raise last_exc  # type: ignore[misc]
    finally:
        if is_interactive:
            governor.active_interactive_calls = max(0, governor.active_interactive_calls - 1)
