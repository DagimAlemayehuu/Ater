import json
from types import SimpleNamespace
from typing import Any, Iterable, Optional

import httpx


DEFAULT_GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


def normalize_google_model_name(model: str) -> str:
    value = str(model or "").strip()
    if not value:
        raise ValueError("Google model name is required")
    if value.lower().startswith("models/"):
        return f"models/{value[7:].lower()}"
    return f"models/{value.lower()}"


def _message_role_and_text(message: Any) -> tuple[str, str]:
    if isinstance(message, tuple) and len(message) >= 2:
        role = str(message[0] or "user").lower()
        return role, str(message[1] or "")
    role = str(getattr(message, "type", "") or getattr(message, "role", "") or "user").lower()
    content = getattr(message, "content", message)
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text") or ""))
        content = "\n".join(parts)
    return role, str(content or "")


class GoogleNativeChatModel:
    """Small native Google AI Studio client for deterministic text calls.

    This intentionally avoids LangChain's tool/AFC path. It is for source-learning
    generation and other plain text/JSON calls, not tool-bound streaming chat.
    """

    def __init__(
        self,
        *,
        model: str,
        api_key: str,
        base_url: Optional[str] = None,
        temperature: float = 0.2,
        timeout: float = 120,
        max_output_tokens: Optional[int] = None,
        response_mime_type: Optional[str] = None,
        client: Optional[httpx.Client] = None,
        async_client: Optional[httpx.AsyncClient] = None,
    ):
        self.model = normalize_google_model_name(model)
        self.api_key = api_key
        self.base_url = str(base_url or DEFAULT_GOOGLE_BASE_URL).rstrip("/")
        if self.base_url.endswith("/openai"):
            self.base_url = self.base_url[: -len("/openai")]
        self.temperature = temperature
        self.timeout = timeout
        self.max_output_tokens = max_output_tokens
        self.response_mime_type = response_mime_type
        self._client = client
        self._async_client = async_client

    @property
    def _url(self) -> str:
        return f"{self.base_url}/{self.model}:generateContent"

    def _payload(self, messages: Iterable[Any]) -> dict[str, Any]:
        system_parts: list[str] = []
        contents: list[dict[str, Any]] = []
        for message in messages:
            role, text = _message_role_and_text(message)
            if not text.strip():
                continue
            if role in {"system"}:
                system_parts.append(text)
                continue
            gemini_role = "model" if role in {"assistant", "ai"} else "user"
            contents.append({"role": gemini_role, "parts": [{"text": text}]})
        if not contents:
            contents.append({"role": "user", "parts": [{"text": ""}]})

        generation_config: dict[str, Any] = {"temperature": self.temperature}
        if self.max_output_tokens:
            generation_config["maxOutputTokens"] = self.max_output_tokens
        if self.response_mime_type:
            generation_config["responseMimeType"] = self.response_mime_type

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config,
        }
        if system_parts:
            if "gemma" in self.model.lower():
                system_text = "\n\n".join(system_parts)
                first_user_idx = -1
                for idx, c in enumerate(contents):
                    if c["role"] == "user":
                        first_user_idx = idx
                        break
                if first_user_idx != -1:
                    first_text = contents[first_user_idx]["parts"][0]["text"]
                    contents[first_user_idx]["parts"][0]["text"] = f"{system_text}\n\n[System Instructions Above]\n\n{first_text}"
                else:
                    contents.insert(0, {"role": "user", "parts": [{"text": system_text}]})
            else:
                payload["systemInstruction"] = {"parts": [{"text": "\n\n".join(system_parts)}]}
        return payload

    def _parse_response(self, response: httpx.Response) -> SimpleNamespace:
        if response.status_code >= 400:
            try:
                body = response.json()
                message = body.get("error", {}).get("message") or json.dumps(body)
            except Exception:
                message = response.text
            raise RuntimeError(f"Google native API error {response.status_code}: {message}")
        data = response.json()
        parts = (
            ((data.get("candidates") or [{}])[0].get("content") or {}).get("parts")
            or []
        )
        content = "".join(
            str(part.get("text") or "")
            for part in parts
            if isinstance(part, dict) and not part.get("thought")
        )
        return SimpleNamespace(content=content, response_metadata=data)

    def invoke(self, messages: Iterable[Any]):
        close_client = self._client is None
        client = self._client or httpx.Client(timeout=self.timeout)
        try:
            response = client.post(
                self._url,
                params={"key": self.api_key},
                json=self._payload(messages),
                headers={"Content-Type": "application/json"},
            )
            return self._parse_response(response)
        finally:
            if close_client:
                client.close()

    async def ainvoke(self, messages: Iterable[Any]):
        close_client = self._async_client is None
        client = self._async_client or httpx.AsyncClient(timeout=self.timeout)
        try:
            response = await client.post(
                self._url,
                params={"key": self.api_key},
                json=self._payload(messages),
                headers={"Content-Type": "application/json"},
            )
            return self._parse_response(response)
        finally:
            if close_client:
                await client.aclose()
