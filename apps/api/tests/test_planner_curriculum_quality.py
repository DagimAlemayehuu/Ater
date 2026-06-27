import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.domains.ater.planner import AterPlanner


class _PlanResponse:
    def __init__(self, payload):
        self._payload = payload

    def model_dump(self):
        return self._payload


def _secrets(tmp_path):
    return SimpleNamespace(
        vault_path=str(tmp_path),
        ai_key="mock-key",
        ai_provider="google",
        ai_model="gemma-3-4b-it",
    )


def _llm_returning(payload):
    mock_llm = MagicMock()
    mock_chain = MagicMock()
    mock_chain.ainvoke = AsyncMock(return_value=_PlanResponse(payload))
    mock_llm.with_structured_output.return_value = mock_chain
    return mock_llm


@pytest.mark.asyncio
async def test_generate_curriculum_expands_short_model_roadmap_without_topic_specific_hardcoding(tmp_path):
    planner = AterPlanner(
        _secrets(tmp_path),
        llm=_llm_returning(
            {
                "topic": "Git",
                "learning_mode": "learn_from_scratch",
                "chapters": [
                    {"title": "Intro", "order": 1, "atomic_notes": ["What is Git"]},
                    {"title": "Commands", "order": 2, "atomic_notes": ["Basic Commands"]},
                ],
            }
        ),
    )

    plan = await planner.generate_curriculum("Teach me Git from scratch", learning_mode="learn_from_scratch")

    assert plan["topic"] == "Git"
    assert len(plan["chapters"]) >= 8
    assert all(len(chapter["atomic_notes"]) >= 3 for chapter in plan["chapters"])

    note_titles = {
        note
        for chapter in plan["chapters"]
        for note in chapter["atomic_notes"]
    }
    assert "What is Version Control" not in note_titles
    assert "Basic Principles" not in note_titles


@pytest.mark.asyncio
async def test_generate_curriculum_returns_deep_generic_roadmap_when_model_times_out(tmp_path):
    mock_llm = MagicMock()
    mock_chain = MagicMock()
    mock_chain.ainvoke = AsyncMock(side_effect=asyncio.TimeoutError)
    mock_llm.with_structured_output.return_value = mock_chain

    planner = AterPlanner(_secrets(tmp_path), llm=mock_llm)

    plan = await planner.generate_curriculum("Teach me distributed systems from scratch")

    assert plan["topic"] == "Distributed Systems"
    assert len(plan["chapters"]) >= 8
    assert sum(len(chapter["atomic_notes"]) for chapter in plan["chapters"]) >= 24
    assert plan["chapters"][0]["title"] != "Introduction & Foundations"
