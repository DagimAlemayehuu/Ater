from typing import Optional, Dict, Any
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_groq import ChatGroq

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
        **kwargs
    ) -> BaseChatModel:
        """
        Instantiates and returns the appropriate LangChain ChatModel.
        """
        provider = provider.lower()
        if provider not in ModelFactory.PROVIDERS:
            raise ValueError(f"Unsupported AI provider: {provider}")

        model_class = ModelFactory.PROVIDERS[provider]
        
        # Configuration mapping per provider
        config: Dict[str, Any] = {
            "model_name" if provider in ["openai", "openrouter"] else "model": model_name,
            "temperature": temperature,
        }

        if provider == "google":
            config["google_api_key"] = api_key
        elif provider == "openai":
            config["api_key"] = api_key
        elif provider == "anthropic":
            config["anthropic_api_key"] = api_key
        elif provider == "groq":
            config["groq_api_key"] = api_key
        elif provider == "openrouter":
            config["api_key"] = api_key
            config["base_url"] = "https://openrouter.ai/api/v1"
            config["default_headers"] = {
                "HTTP-Referer": "https://github.com/LifeOS",
                "X-Title": "Life OS"
            }

        # Merge with any additional kwargs
        # Note: ChatOpenAI uses model_name, others use model
        # We handle this in the initial config dict
        config.update(kwargs)

        return model_class(**config)
