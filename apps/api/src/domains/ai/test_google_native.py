import httpx
import pytest


def test_google_native_chat_uses_generate_content_without_tools_or_thinking_config():
    from src.domains.ai.google_native import GoogleNativeChatModel

    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["payload"] = request.read()
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"content": {"parts": [{"text": "Connected"}]}}
                ],
                "usageMetadata": {"totalTokenCount": 7},
            },
        )

    model = GoogleNativeChatModel(
        model="Gemma-4-31b-it",
        api_key="test-key",
        temperature=0.1,
        max_output_tokens=64,
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    )

    response = model.invoke([("system", "Be terse."), ("human", "Hello")])

    assert response.content == "Connected"
    assert "models/gemma-4-31b-it:generateContent" in captured["url"]
    assert "thinking" not in captured["payload"].decode("utf-8").lower()
    assert "tool" not in captured["payload"].decode("utf-8").lower()


@pytest.mark.asyncio
async def test_google_native_chat_async_json_mode_returns_text_content():
    from src.domains.ai.google_native import GoogleNativeChatModel

    captured = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["payload"] = request.read()
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"content": {"parts": [{"text": '[{"title":"Consumer Preferences"}]'}]}}
                ]
            },
        )

    model = GoogleNativeChatModel(
        model="models/gemma-4-31b-it",
        api_key="test-key",
        temperature=0.0,
        max_output_tokens=1024,
        response_mime_type="application/json",
        async_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    response = await model.ainvoke([("human", "Return JSON")])

    assert response.content == '[{"title":"Consumer Preferences"}]'
    assert b'"responseMimeType":"application/json"' in captured["payload"].replace(b" ", b"")


def test_google_native_chat_raises_useful_error_body():
    from src.domains.ai.google_native import GoogleNativeChatModel

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"error": {"message": "quota exceeded"}})

    model = GoogleNativeChatModel(
        model="gemma-4-31b-it",
        api_key="test-key",
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(RuntimeError, match="quota exceeded"):
        model.invoke([("human", "Hello")])
