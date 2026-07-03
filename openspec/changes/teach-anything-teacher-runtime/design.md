## Context

The source-grounded teacher runtime establishes the right architecture: source audit, concept graph, dynamic teaching profiles, compiler, tutor loop, mastery, practice, and coverage. Prompt-first teaching should not be a parallel system. It should produce an auditable synthetic source pack, then enter the same runtime.

Current Teach Anything behavior in `assistant.py` and `planner.py` can classify learning intent, generate curriculum previews, cache a roadmap, write progressive files, and generate the first note. It is useful, but it relies too much on in-process cache, model-created structure, and first-note-only generation. It also lacks a strong diagnostic intake and cannot prove coverage for a vague learning goal.

This change builds on `source-grounded-teacher-runtime`. If that change is not finalized in the working tree, implementation must first inspect and adapt to its actual source job APIs/services.

## Goals / Non-Goals

**Goals:**

- Make prompt-first learning use the same teacher runtime as source PDFs.
- Create durable prompt teacher jobs with diagnostic intake, assumptions, synthetic source packs, concept graph, coverage, tutor link, and vault deployment.
- Make prompt-first plans auditable: what is being taught, why it is in scope, what sources/provenance support it, and what remains unmastered.
- Reduce AI dependence by making code own prompt classification, intake schema, plan validation, graph invariants, profile selection, compilation shape, fallback behavior, and coverage state.
- Preserve existing chat UX while replacing fragile roadmap cache behavior with durable backend state.

**Non-Goals:**

- Do not implement unrestricted internet research as a default.
- Do not require live web search or paid AI for tests.
- Do not remove source/PDF learning behavior.
- Do not build every possible pedagogy style. Build a solid default loop with clear extension points.

## Decisions

### Decision 1: Prompt jobs produce synthetic source packs

A prompt teacher job must create a `SyntheticSourcePack` before entering the concept graph/compiler/tutor runtime. A pack contains topic, scope, assumptions, provenance, confidence, generated outline, local vault references if any, and source snippets used to ground concepts.

Rationale: the source runtime expects evidence. A vague prompt has no PDF, so the system must make its evidence explicit rather than pretending model memory is a source.

### Decision 2: Diagnostic intake precedes planning

The system should collect or infer:

- learner goal
- current level
- desired depth
- timeframe
- exam/practical/project target
- known prerequisites
- preferred rigor
- constraints

When the prompt is too vague to plan responsibly, ask one concise clarification. Otherwise record assumptions and continue.

Rationale: perfect teaching starts with learner state and goal, not just topic extraction.

### Decision 3: Reuse source runtime for everything after source-pack creation

After diagnostic intake and synthetic source-pack creation, prompt-first teaching must reuse:

- concept graph service
- teaching profile service
- source/coverage matrix
- AI-minimized compiler
- tutor runtime
- learner model
- vault deployment

Rationale: one canonical teacher loop avoids drift between PDF and prompt modes.

### Decision 4: Weak-model fallback is required

When the model cannot produce a high-quality synthetic source pack, the system must still produce a deterministic starter path from domain keywords, existing vault notes, known roadmap blueprints, and safe generic concept templates. Coverage must show degraded confidence.

Rationale: user has weak/free API keys; failure must degrade honestly.

### Decision 5: Existing vault knowledge is preferred over model invention

When local vault notes, hubs, or prior source jobs match the prompt, the planner should use them as high-confidence local sources before generating new synthetic material.

Rationale: Ater is offline-first and personal; local knowledge is more inspectable than model memory.

## Risks / Trade-offs

- [Risk] Synthetic sources can hallucinate authority. -> Mitigation: explicit provenance, confidence, assumptions, and coverage warnings.
- [Risk] Clarification can slow the UX. -> Mitigation: ask only when ambiguity blocks correctness; otherwise default and record assumptions.
- [Risk] Prompt mode may duplicate PDF/source concepts. -> Mitigation: search existing hubs/source jobs/vault notes first.
- [Risk] Weak model output may be generic. -> Mitigation: deterministic plan validation, dynamic profiles, fallback starter curriculum, and mastery gates.
- [Risk] This depends on the first source runtime change. -> Mitigation: implementation must inspect actual APIs/services from `source-grounded-teacher-runtime` and adapt rather than assuming exact names.

## Migration Plan

1. Add prompt teacher job persistence as an additive layer, preferably sharing source job tables where practical.
2. Wrap existing Teach Anything planner outputs into durable prompt jobs.
3. Add synthetic source pack creation and validation.
4. Route prompt teacher jobs through concept graph/profile/compiler/tutor services.
5. Update chat runtime to create/resume prompt jobs and persist metadata.
6. Update desktop chat UI to render prompt job roadmap/coverage/tutor state.
7. Preserve old planner functions as compatibility helpers until tests cover the new path.
