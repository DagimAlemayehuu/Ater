from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import threading

class ProviderRateLimit(BaseModel):
    provider: str
    model: str
    requests_remaining: Optional[int] = None
    requests_limit: Optional[int] = None
    tokens_remaining: Optional[int] = None
    tokens_limit: Optional[int] = None
    retry_after: Optional[int] = None # Seconds
    
    # Usage Stats
    request_count: int = 0
    total_tokens: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    
    last_updated: datetime = datetime.now()

class RateLimitTracker:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(RateLimitTracker, cls).__new__(cls)
                cls._instance.limits = {}
        return cls._instance

    def update(self, provider: str, model: str, data: Dict[str, Any]):
        key = f"{provider}:{model}"
        with self._lock:
            current = self.limits.get(key, ProviderRateLimit(provider=provider, model=model))
            
            # Update Limits
            if "requests_remaining" in data: current.requests_remaining = data["requests_remaining"]
            if "requests_limit" in data: current.requests_limit = data["requests_limit"]
            if "tokens_remaining" in data: current.tokens_remaining = data["tokens_remaining"]
            if "tokens_limit" in data: current.tokens_limit = data["tokens_limit"]
            if "retry_after" in data: current.retry_after = data["retry_after"]
            
            # Update Usage Stats
            current.request_count += 1
            if "prompt_tokens" in data: current.prompt_tokens += data["prompt_tokens"]
            if "completion_tokens" in data: current.completion_tokens += data["completion_tokens"]
            if "total_tokens" in data: current.total_tokens += data["total_tokens"]
            
            current.last_updated = datetime.now()
            self.limits[key] = current

    def get_all(self) -> Dict[str, ProviderRateLimit]:
        with self._lock:
            # We return dicts to ensure JSON serializability for FastAPI
            return {k: v.model_dump() for k, v in self.limits.items()}

tracker = RateLimitTracker()
