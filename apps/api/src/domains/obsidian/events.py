import asyncio
from typing import Dict, Any

class VaultEventBus:
    def __init__(self):
        self.listeners = set()

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.listeners.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self.listeners:
            self.listeners.remove(q)

    def publish(self, event_type: str, data: Dict[str, Any]):
        event = {"type": event_type, "data": data}
        for q in list(self.listeners):
            try:
                q.put_nowait(event)
            except Exception:
                pass

vault_events = VaultEventBus()
