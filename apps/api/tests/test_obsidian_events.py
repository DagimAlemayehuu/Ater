import asyncio
import pytest
from unittest.mock import patch
from src.domains.obsidian.events import VaultEventBus

@pytest.fixture
def event_bus():
    return VaultEventBus()

@pytest.mark.asyncio
async def test_subscribe_unsubscribe(event_bus):
    # Test subscribe
    q1 = event_bus.subscribe()
    q2 = event_bus.subscribe()

    assert isinstance(q1, asyncio.Queue)
    assert isinstance(q2, asyncio.Queue)
    assert len(event_bus.listeners) == 2
    assert q1 in event_bus.listeners
    assert q2 in event_bus.listeners

    # Test unsubscribe
    event_bus.unsubscribe(q1)
    assert len(event_bus.listeners) == 1
    assert q1 not in event_bus.listeners
    assert q2 in event_bus.listeners

    # Test unsubscribe non-existent/already unsubscribed
    event_bus.unsubscribe(q1)
    assert len(event_bus.listeners) == 1

@pytest.mark.asyncio
async def test_publish_event(event_bus):
    q1 = event_bus.subscribe()
    q2 = event_bus.subscribe()

    test_data = {"file": "test.md"}
    event_bus.publish("file_changed", test_data)

    # Check if queues received the event
    assert not q1.empty()
    assert not q2.empty()

    # Verify event content
    event1 = q1.get_nowait()
    event2 = q2.get_nowait()

    expected_event = {"type": "file_changed", "data": test_data}
    assert event1 == expected_event
    assert event2 == expected_event

@pytest.mark.asyncio
async def test_publish_handles_exception(event_bus):
    q1 = event_bus.subscribe()
    q2 = event_bus.subscribe()
    q3 = event_bus.subscribe()

    # Mock q2.put_nowait to raise an exception
    with patch.object(q2, 'put_nowait', side_effect=Exception("Test error")):
        event_bus.publish("test_event", {})

        # q1 and q3 should still receive the event
        assert not q1.empty()
        assert not q3.empty()

        # Verify event content for queues that worked
        assert q1.get_nowait() == {"type": "test_event", "data": {}}
        assert q3.get_nowait() == {"type": "test_event", "data": {}}
