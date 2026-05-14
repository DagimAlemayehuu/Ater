import re

with open("apps/api/src/domains/ai/factory.py", "r") as f:
    content = f.read()

import_str = "from src.domains.ater.governor import governor\n\nclass TrackingCallbackHandler"
if "from src.domains.ater.governor" not in content:
    content = content.replace("class TrackingCallbackHandler", import_str)

new_get_model = """    def get_model(
        provider: str, 
        model_name: str, 
        api_key: str, 
        temperature: float = 0.7,
        timeout: Optional[int] = None,
        request_timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        **kwargs
    ) -> BaseChatModel:
        \"\"\"
        Instantiates and returns the appropriate LangChain ChatModel.
        \"\"\"
        provider = provider.lower()
        if provider not in ModelFactory.PROVIDERS:
            raise ValueError(f"Unsupported AI provider: {provider}")

        # Pick a valid API key from the pool if comma-separated
        valid_api_key = governor.get_valid_api_key(api_key)

        model_class = ModelFactory.PROVIDERS[provider]"""

content = re.sub(
    r'    def get_model\(.*?model_class = ModelFactory\.PROVIDERS\[provider\]',
    new_get_model,
    content,
    flags=re.DOTALL
)

content = content.replace("config[\"google_api_key\"] = api_key", "config[\"google_api_key\"] = valid_api_key")
content = content.replace("config[\"api_key\"] = api_key", "config[\"api_key\"] = valid_api_key")
content = content.replace("config[\"anthropic_api_key\"] = api_key", "config[\"anthropic_api_key\"] = valid_api_key")
content = content.replace("config[\"groq_api_key\"] = api_key", "config[\"groq_api_key\"] = valid_api_key")

with open("apps/api/src/domains/ai/factory.py", "w") as f:
    f.write(content)
