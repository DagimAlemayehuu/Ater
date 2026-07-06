from typing import Optional, Dict, Any, List
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_groq import ChatGroq
from langchain_core.callbacks import AsyncCallbackHandler, BaseCallbackHandler
from langchain_core.outputs import LLMResult
from .tracker import tracker
from src.domains.ater.governor import governor

class TrackingCallbackHandler(AsyncCallbackHandler, BaseCallbackHandler):
    """
    Captures rate limit information from LLM responses.
    """
    def __init__(self, provider: str, model: str):
        self.provider = provider
        self.model = model

    def on_chat_model_start(self, *args: Any, **kwargs: Any) -> None:
        return None

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Capture rate limits and usage stats from metadata."""
        try:
            if not response.generations: return
            
            # Extract metadata from top-level output
            metadata = response.llm_output or {}
            token_usage = metadata.get("token_usage", {})
            
            limit_data = {}

            # 1. Capture Usage Stats (Prompt/Completion/Total)
            if token_usage:
                limit_data['prompt_tokens'] = token_usage.get('prompt_tokens', 0)
                limit_data['completion_tokens'] = token_usage.get('completion_tokens', 0)
                limit_data['total_tokens'] = token_usage.get('total_tokens', 0)

            # 2. Search in response_metadata of individual generations
            for gen_list in response.generations:
                for gen in gen_list:
                    msg_meta = {}
                    if hasattr(gen, 'message'):
                        msg_meta = getattr(gen.message, 'response_metadata', {})
                    elif hasattr(gen, 'generation_info'):
                        msg_meta = gen.generation_info or {}
                    
                    headers = msg_meta.get('headers', {})
                    if not headers and 'headers' in msg_meta:
                        headers = msg_meta['headers']
                    
                    # Capture Google / LangChain usage metadata fallback
                    usage_meta = msg_meta.get("usage_metadata", {})
                    if usage_meta and not limit_data.get('total_tokens'):
                        limit_data['prompt_tokens'] = usage_meta.get('prompt_tokens', 0)
                        limit_data['completion_tokens'] = usage_meta.get('completion_tokens', 0)
                        limit_data['total_tokens'] = usage_meta.get('total_tokens', 0)

                    # Extract Limits from Headers
                    def get_header(keys: List[str]):
                        for k in keys:
                            val = headers.get(k) or msg_meta.get(k)
                            if val is not None: return val
                        return None

                    req_rem = get_header(['x-ratelimit-remaining-requests', 'X-Ratelimit-Remaining-Requests', 'ratelimit-remaining'])
                    req_lim = get_header(['x-ratelimit-limit-requests', 'X-Ratelimit-Limit-Requests', 'ratelimit-limit'])
                    tok_rem = get_header(['x-ratelimit-remaining-tokens', 'X-Ratelimit-Remaining-Tokens'])
                    tok_lim = get_header(['x-ratelimit-limit-tokens', 'X-Ratelimit-Limit-Tokens'])

                    if req_rem is not None: limit_data['requests_remaining'] = int(req_rem)
                    if req_lim is not None: limit_data['requests_limit'] = int(req_lim)
                    if tok_rem is not None: limit_data['tokens_remaining'] = int(tok_rem)
                    if tok_lim is not None: limit_data['tokens_limit'] = int(tok_lim)

            # Update tracker even if only usage stats were found
            tracker.update(self.provider, self.model, limit_data)
            
            # PERFECT TOKEN COUNTER FIX:
            # We now use the exact actual tokens from the LLM response to debit the daily DB quota.
            # This completely eliminates "ghost tokens" from over-estimated permits.
            exact_tokens = limit_data.get('total_tokens', 0)
            if exact_tokens > 0:
                governor._record_usage_db(tokens=exact_tokens, requests=1)
                
            if limit_data.get("requests_limit") or limit_data.get("tokens_limit"):
                governor.update_limits_from_provider(
                    requests_limit=limit_data.get("requests_limit"),
                    tokens_limit=limit_data.get("tokens_limit"),
                )
        except Exception as e:
            print(f"[TrackingCallback] Failed to parse limits: {e}")

    async def on_llm_end_async(self, response: LLMResult, **kwargs: Any) -> None:
        self.on_llm_end(response, **kwargs)

class ModelFactory:
    """
    Unified Model Factory to provide a consistent LangChain interface 
    across multiple AI providers. Includes OpenRouter support.
    """
    
    PROVIDERS = {
        "google": ChatGoogleGenerativeAI,
        "openai": ChatOpenAI,
        "anthropic": ChatAnthropic,
        "groq": ChatGroq,
        "openrouter": ChatOpenAI, # OpenAI-compatible
        "custom": ChatOpenAI, # User-supplied OpenAI-compatible endpoint
    }

    @staticmethod
    def get_model(
        provider: str, 
        model_name: str, 
        api_key: str, 
        temperature: float = 0.7,
        timeout: Optional[int] = None,
        request_timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        base_url: Optional[str] = None,
        max_tpm: Optional[int] = None,
        max_rpm: Optional[int] = None,
        max_tpd: Optional[int] = None,
        max_rpd: Optional[int] = None,
        max_concurrency: Optional[int] = None,
        **kwargs
    ) -> BaseChatModel:
        """
        Instantiates and returns the appropriate LangChain ChatModel.
        """
        provider = provider.lower()
        if provider not in ModelFactory.PROVIDERS:
            raise ValueError(f"Unsupported AI provider: {provider}")

        if provider == "google":
            model_lower = model_name.lower()
            if not (model_lower.startswith("models/") or model_lower.startswith("tunedmodels/")):
                model_name = f"models/{model_name.lower()}"
            elif model_lower.startswith("models/"):
                model_name = f"models/{model_name[7:].lower()}"

        governor.configure(
            provider,
            model_name,
            base_url=base_url,
            max_tpm=max_tpm,
            max_rpm=max_rpm,
            max_tpd=max_tpd,
            max_rpd=max_rpd,
            max_concurrency=max_concurrency,
        )

        # Pick a valid API key from the pool if comma-separated
        valid_api_key = governor.get_valid_api_key(api_key, provider=provider, model=model_name, base_url=base_url)

        model_class = ModelFactory.PROVIDERS[provider]
        
        # Configuration mapping per provider
        config: Dict[str, Any] = {
            "model_name" if provider in ["openai", "openrouter", "custom"] else "model": model_name,
            "temperature": temperature,
            "max_retries": max_retries if max_retries is not None else (0 if provider == "google" else 1),
            "callbacks": [TrackingCallbackHandler(provider, model_name)]
        }
        
        # Provider-specific timeout configuration. Google/Gemma calls can take
        # materially longer than short chat probes on large source-grounded jobs.
        effective_timeout = timeout or request_timeout or (120 if provider == "google" else 60)
            
        if provider in ["openai", "openrouter", "custom", "anthropic", "groq"]:
            config["timeout"] = effective_timeout
        elif provider == "google":
            config["timeout"] = effective_timeout
            config["request_timeout"] = effective_timeout
        else:
            config["request_timeout"] = effective_timeout

        if provider == "google":
            config["google_api_key"] = valid_api_key
        elif provider == "openai":
            config["api_key"] = valid_api_key
        elif provider == "anthropic":
            config["anthropic_api_key"] = valid_api_key
        elif provider == "groq":
            config["groq_api_key"] = valid_api_key
        elif provider == "openrouter":
            config["api_key"] = valid_api_key
            config["base_url"] = "https://openrouter.ai/api/v1"
            config["default_headers"] = {
                "HTTP-Referer": "https://github.com/Ater",
                "X-Title": "Ater"
            }
        elif provider == "custom":
            if not base_url:
                raise ValueError("Custom/OpenAI-compatible providers require ai_base_url")
            config["api_key"] = valid_api_key
            config["base_url"] = base_url

        if base_url and provider in ["openai", "custom"]:
            config["base_url"] = base_url

        # Handle response_mime_type formatting standardization
        if "response_mime_type" in kwargs:
            mime = kwargs.pop("response_mime_type")
            if provider == "google":
                config["response_mime_type"] = mime
            elif provider in ["openai", "openrouter", "custom"]:
                if mime == "application/json":
                    config.setdefault("model_kwargs", {})["response_format"] = {"type": "json_object"}

        # Handle max_tokens parameter standardization
        if "max_tokens" in kwargs:
            max_tok = kwargs.pop("max_tokens")
            if provider == "groq" and max_tok > 4096:
                max_tok = 4096
            
            if provider == "google":
                config["max_output_tokens"] = max_tok
            elif provider == "anthropic":
                config["max_tokens_to_sample"] = max_tok
            else:
                config["max_tokens"] = max_tok

        # Merge additional kwargs safely
        for k, v in kwargs.items():
            if k not in config:
                if k in ["top_p", "presence_penalty", "frequency_penalty"]:
                    if provider == "groq":
                        config.setdefault("model_kwargs", {})[k] = v
                    elif provider in ["openai", "openrouter", "custom"]:
                        config[k] = v
                else:
                    config[k] = v

        model = model_class(**config)

        def normalize_content(content):
            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                    elif isinstance(part, str):
                        text_parts.append(part)
                return "".join(text_parts)
            return content

        def normalize_message(msg):
            if hasattr(msg, 'content'):
                msg.content = normalize_content(msg.content)
            return msg

        original_invoke = model.invoke
        def patched_invoke(*args, **kwargs):
            res = original_invoke(*args, **kwargs)
            return normalize_message(res)
        object.__setattr__(model, "invoke", patched_invoke)

        original_ainvoke = model.ainvoke
        async def patched_ainvoke(*args, **kwargs):
            res = await original_ainvoke(*args, **kwargs)
            return normalize_message(res)
        object.__setattr__(model, "ainvoke", patched_ainvoke)

        original_generate = model.generate
        def patched_generate(*args, **kwargs):
            res = original_generate(*args, **kwargs)
            if res and res.generations:
                for gen_list in res.generations:
                    for gen in gen_list:
                        if hasattr(gen, 'message'):
                            normalize_message(gen.message)
            return res
        object.__setattr__(model, "generate", patched_generate)

        original_agenerate = model.agenerate
        async def patched_agenerate(*args, **kwargs):
            res = await original_agenerate(*args, **kwargs)
            if res and res.generations:
                for gen_list in res.generations:
                    for gen in gen_list:
                        if hasattr(gen, 'message'):
                            normalize_message(gen.message)
            return res
        object.__setattr__(model, "agenerate", patched_agenerate)

        original_stream = model.stream
        def patched_stream(*args, **kwargs):
            for chunk in original_stream(*args, **kwargs):
                yield normalize_message(chunk)
        object.__setattr__(model, "stream", patched_stream)

        original_astream = model.astream
        async def patched_astream(*args, **kwargs):
            async for chunk in original_astream(*args, **kwargs):
                yield normalize_message(chunk)
        object.__setattr__(model, "astream", patched_astream)

        return model
