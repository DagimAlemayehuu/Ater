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
        **kwargs
    ) -> BaseChatModel:
        """
        Instantiates and returns the appropriate LangChain ChatModel.
        """
        provider = provider.lower()
        if provider not in ModelFactory.PROVIDERS:
            raise ValueError(f"Unsupported AI provider: {provider}")

        # Pick a valid API key from the pool if comma-separated
        valid_api_key = governor.get_valid_api_key(api_key)

        model_class = ModelFactory.PROVIDERS[provider]
        
        # Configuration mapping per provider
        config: Dict[str, Any] = {
            "model_name" if provider in ["openai", "openrouter"] else "model": model_name,
            "temperature": temperature,
            "max_retries": max_retries if max_retries is not None else 2,
            "callbacks": [TrackingCallbackHandler(provider, model_name)]
        }
        
        # Provider-specific timeout configuration
        effective_timeout = timeout or 300
        if provider in ["openai", "openrouter", "anthropic", "groq"]:
            config["timeout"] = effective_timeout
        else:  # google
            config["request_timeout"] = request_timeout or effective_timeout

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

        # Merge additional kwargs safely
        for k, v in kwargs.items():
            if k not in config:
                if k in ["presence_penalty", "frequency_penalty"]:
                    if provider in ["openai", "openrouter", "groq"]:
                        config[k] = v
                else:
                    config[k] = v

        return model_class(**config)
