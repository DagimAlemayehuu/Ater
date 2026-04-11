import re

def clean_llm_output(raw_text: str) -> str:
    """
    Cleans LLM output by stripping preamble/scratchpads and enforcing custom code block syntax.
    """
    if not raw_text:
        return ""

    # 1. Extract Core Payload (everything from the first --- START_NOTE --- or YAML delimiter)
    # If --- START_NOTE --- is present, start there.
    start_note_marker = "--- START_NOTE ---"
    if start_note_marker in raw_text:
        payload = raw_text[raw_text.find(start_note_marker):]
    else:
        # Fallback: if marker missing but YAML exists, start at YAML
        yaml_match = re.search(r"^---", raw_text, re.MULTILINE)
        if yaml_match:
            payload = raw_text[yaml_match.start():]
        else:
            payload = raw_text

    # 2. Strip scratchpads/think tags if they somehow leaked into payload
    payload = re.sub(r"<scratchpad>.*?</scratchpad>", "", payload, flags=re.DOTALL)
    payload = re.sub(r"<think>.*?</think>", "", payload, flags=re.DOTALL)

    # 3. Enforce Custom Code Blocks: Convert ```lang to --- START_CODE:lang ---
    # This regex catches ```python, ```mermaid, etc.
    payload = re.sub(r"```(\w+)\n", r"\n--- START_CODE:\1 ---\n", payload)
    
    # Convert closing ``` to --- END_CODE:lang ---
    # Since we don't easily know the lang here, we use a generic marker or try to match.
    # The OKA parser is usually flexible, but let's try to be precise.
    payload = re.sub(r"```\n?", r"\n--- END_CODE:text ---\n", payload)

    # 4. Final Polish: Ensure single START_NOTE if it's an atomic note
    # (Orchestrator will handle batching if needed, but cleaner works on single outputs)
    
    return payload.strip()
