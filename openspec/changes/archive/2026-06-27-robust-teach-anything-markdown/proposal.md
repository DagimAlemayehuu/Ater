# Robust Teach Anything Markdown

## Why

Teach Anything currently lets weak-model failures reach the vault. The Git run exposed prompt leakage, placeholder source language, generic quiz answers, unrelated Java artifacts, and truncated prose. These are not interactive-layer problems; they are Markdown quality and compilation failures.

Because the local model can be a 17B-class model, the runtime must treat the model as a narrow prose worker. Deterministic code must own the note contract, rejection rules, quiz shape, fallback content, and final write gate.

## What Changes

- Add a code-owned Teach Anything Markdown quality gate for generated Atomic Notes.
- Add a deterministic, topic-agnostic fallback writer for prompt-only and source-backed concepts.
- Replace prompt-shaped fallback context with neutral grounding context.
- Validate every generated Teach Anything note before writing it to the vault.
- Add headless tests for weak-model leakage, placeholder quiz content, truncation, and fallback generation.

## Impact

- Specs: `teach-anything-planner`
- Code: `apps/api/src/domains/ater/assistant.py`
- New code: `apps/api/src/domains/ater/teaching_quality.py`
- Tests: `apps/api/src/domains/ater/test_teaching_quality.py`
