# Agent Handoff: Ater Learning Runtime Orchestrator

This document transfers the learning-runtime orchestration work to a fresh agent. It is intentionally detailed so the next agent can continue without relying on hidden chat history.

## Role Of The Next Agent

You are the **Ater Learning Runtime OpenSpec Orchestrator**.

Your job is not to implement application code unless the user explicitly exits orchestration/spec-writing mode and asks you to implement. Your primary job is to:

1. Maintain the product direction for Ater's adaptive learning runtime.
2. Write one OpenSpec change at a time.
3. Make each spec small, test-driven, deterministic, and weak-model-friendly.
4. Wait for the user to apply each spec with another implementation agent.
5. Review the result when the user returns.
6. Then write the next spec.

The user plans to use a separate weak-model implementation agent to run:

```text
/opsx:apply <change-name>
```

That implementation agent should implement only the current phase and stop only after the tests and `openspec validate <change-name>` pass.

## Required Skills To Consider

Invoke relevant skills before acting. The most relevant skills for this project are:

- `openspec-explore`: use when discussing direction, requirements, product design, tradeoffs, or phase planning.
- `openspec-propose`: use when creating the next OpenSpec change.
- `openspec-apply-change`: use only if the user asks this agent to implement a spec.
- `openspec-verify-change`: use when the user returns after another agent implemented a spec and wants verification.
- `handoff`: use if creating another transfer document.
- `verification-before-completion`: use before claiming a phase/spec/verification is complete.

Do not skip skill loading when a skill applies.

## Current Status

The following orchestration work has already been done:

1. Root roadmap created:
   - `LEARNING_RUNTIME_ROADMAP.md`

2. Old exploratory change archived:
   - `openspec/changes/archive/2026-06-24-dynamic-study-console/`

3. First phase OpenSpec created and validated:
   - Change name: `learning-object-model`
   - Location: `openspec/changes/learning-object-model/`
   - Validation command already passed:
     ```text
     openspec validate learning-object-model
     Change 'learning-object-model' is valid
     ```

4. `learning-object-model` artifacts completed:
   - `openspec/changes/learning-object-model/proposal.md`
   - `openspec/changes/learning-object-model/design.md`
   - `openspec/changes/learning-object-model/specs/learning-object-model/spec.md`
   - `openspec/changes/learning-object-model/tasks.md`

The next expected user action is likely:

```text
I applied learning-object-model with another agent. Here is the result...
```

When that happens, verify the implementation before proposing the next phase.

## High-Level Product Vision

Ater should evolve from a note-generation pipeline into an **adaptive learning runtime**.

The core idea:

```text
User intent
  -> learning mode
  -> hub-centered plan
  -> Atomic Notes
  -> artifact packs
  -> durable HTML lessons
  -> tutor runtime
  -> practice, diagnosis, review
```

Ater should not merely generate lessons. Ater should run a learning loop:

```text
Teach -> interact -> ask -> check -> diagnose -> remediate -> advance -> review
```

Markdown remains the source of truth. Durable HTML lessons expand the Markdown into an interactive learning experience. Artifact packs provide structured interactive objects that can be rendered consistently without relying on a strong model.

## Core Learning Hierarchy

The agreed hierarchy is:

```text
Hub
  -> Chapter files
      -> Atomic Notes
          -> full Markdown source
          -> artifact pack with versions
          -> durable HTML lesson variants
```

Important decisions:

- Every generated learning path must have a central Hub.
- Chapters are real Markdown files, not only sections inside a Hub.
- Each Atomic Note gets its own HTML lesson.
- Each HTML lesson must contain the full Markdown and expand on it.
- Artifact packs are editable and versioned.
- Users can pin artifact types.
- Cram Mode writes durable lessons like other modes.
- Multiple lesson variants are allowed: `simple`, `deep`, `cram`, `exam`.

## Folder Route Decisions

For Teach Anything / self-study:

```text
database/
  learning paths/
    Git_Hub.md

  General/
    Git/
      01_Foundations/
        Chapter_01_Foundations.md
        Git_Three_State_Model.md
        Commit_As_Snapshot.md

        lessons/
          Git_Three_State_Model.simple.html
          Git_Three_State_Model.cram.html
          Commit_As_Snapshot.simple.html

        artifacts/
          Git_Three_State_Model.artifacts.json
          Commit_As_Snapshot.artifacts.json
```

For coursework / school materials later:

```text
database/
  study planner/
    Data_Structures_Unit_3_Hub.md

  Spring_2026/
    Data_Structures/
      03_Trees/
        Chapter_01_Binary_Trees.md
        Binary_Tree_Traversal.md

        lessons/
          Binary_Tree_Traversal.simple.html

        artifacts/
          Binary_Tree_Traversal.artifacts.json
```

Rules:

```text
Teach Anything / self-study
  Hub: database/learning paths/
  Content: database/General/<Topic>/

Coursework / school material
  Hub: database/study planner/
  Content: database/<Semester>/<Course>/<Unit>/
```

If Ater finds an existing relevant Hub, it should extend that Hub instead of creating scattered duplicate learning paths.

## Roadmap Phases

The phases should be written and implemented one at a time. Do not write all specs upfront.

### Phase 1: `learning-object-model`

Status: OpenSpec written and valid. Awaiting implementation by separate agent.

Purpose: Define the durable structure for learning paths.

Scope:

- New `Learning Hub` type.
- Chapter file schema.
- Atomic Note linkage to Hub and Chapter.
- Lesson file naming.
- Artifact pack file naming.
- Artifact versioning.
- Lesson variants.
- Existing Hub detection/update rules.

No advanced generation yet.

### Phase 2: `teach-anything-planner`

Purpose: Make Ater create or extend a learning path from a prompt.

Scope:

- Intent classifier.
- Clarification policy.
- Existing Hub lookup.
- Learn-from-scratch mode.
- Generate all vs progressive mode.
- Chapter and Atomic Note planning.
- Confirmation before writing.

Clarification rule:

```text
Clear input
  -> proceed

Vague input where clarification would materially improve output
  -> ask 1-3 high-impact questions
```

The user wants Ater to ask only if the input is vague or clarification would significantly improve the result. If the user gives a PDF or a detailed prompt, Ater should proceed without interrogation.

### Phase 3: `atomic-note-lesson-compiler`

Purpose: Turn Atomic Notes into durable offline HTML lessons.

Scope:

- One HTML lesson per Atomic Note.
- Full Markdown embedded inside each HTML lesson.
- HTML expands on the Markdown with simple explanations and lesson structure.
- Hub/chapter/next/previous navigation.
- Lesson variants: `simple`, `deep`, `cram`, `exam`.

### Phase 4: `artifact-pack-v1`

Purpose: Add weak-model-safe interactive artifacts.

Scope:

- Artifact pack JSON schema.
- Artifact selector from domain and concept modality.
- Manual artifact pinning.
- Artifact versions and rollback.
- Initial artifacts:
  - `reveal_card`
  - `cloze_multi`
  - `matching_pairs`
  - `sortable_steps`
  - `state_stepper`
  - `concept_map`
  - `table_lens`
  - `code_trace`
  - `formula_card`
  - `timeline`

Artifacts should be generated only when they improve understanding, prediction, practice, diagnosis, or transfer. They are not decoration.

### Phase 5: `tutor-runtime`

Purpose: Make lessons active instead of passive.

Scope:

- Teach -> ask -> check -> diagnose -> follow-up -> advance.
- Reuse existing Practice question types.
- Confidence wager.
- Mistake diagnosis.
- Misconception capture.
- Lesson events:
  - `NEXT_NOTE`
  - `ANSWER_SUBMITTED`
  - `ARTIFACT_UPDATED`
  - `MISCONCEPTION_FOUND`

Existing Practice question types to reuse:

```text
mcq
true_false
writing
fill_in
matching
order
debug
synthesis
trace
scenario
code
calculation
data_analysis
find_error
```

### Phase 6: `cram-mode`

Purpose: Time-limited exam-focused learning.

Scope:

- Time budget.
- High-yield lesson variant.
- Heavy retrieval/testing.
- Weak spot prioritization.
- Durable cram lessons.

Default cram behavior:

```text
10% orientation
20% high-yield explanation
50% active recall
20% mistake repair
```

The user wants Cram Mode to optimize for passing/scoring well in a short amount of time.

### Phase 7: `source-driven-learning`

Purpose: Bring PDFs/materials into the new architecture after Teach Anything works.

Scope:

- PDF/source input.
- Source-grounded chapter extraction.
- Generate Hub -> Chapters -> Atomic Notes -> Lessons.
- Source weakness warnings.
- Optional web augmentation.

This phase should wait until Teach Anything works.

### Phase 8: `advanced-artifacts`

Purpose: Expand artifact coverage.

Candidate artifacts:

```text
label_diagram
hotspot
simulation_predict
evidence_select
proof_step
rank_order
argument_map
case_simulation
sql_query_playground
code_rubric_check
misconception_choice
teach_back
```

### Phase 9: `adaptive-learner-model`

Purpose: Make Ater adapt over time.

Scope:

- Per user/course/hub/topic learner model.
- Weak concepts.
- Confidence calibration.
- Common misconceptions.
- FSRS integration.
- Recommended next lessons.

## Important Product Decisions

### Clarification Policy

Ater should ask questions only when:

- the request is vague,
- the missing information materially changes the learning path,
- or the system is unsure whether to proceed with weak grounding.

Examples:

- If user gives a PDF: do not ask; generate from it.
- If user gives a detailed prompt: do not ask unless a significant ambiguity remains.
- If user says "Teach me Git": ask only high-impact questions if needed.

### Diagnostic Quiz Policy

Ater should start with a diagnostic quiz only when:

- the learner says they know a little,
- the system detects prior context,
- or the learning mode benefits from placement.

If the learner knows nothing, quizzing first is not useful.

### Web Search Policy

Ater should be able to search the web in future phases. However:

- If source grounding is weak, Ater should tell the user.
- It should ask whether to proceed or search the web.
- If it uses web sources, later phases should preserve provenance where reasonable.

### Weak Model Policy

The user is using weak/free models such as Llama 17B and Gemma 31B. Specs must assume weak model implementation and weak model runtime behavior.

Therefore:

- Prefer deterministic code over model-generated structure.
- Do not ask models to write arbitrary HTML/JS when a schema/component can do it.
- The model should fill bounded JSON or choose from allowed types.
- Code should validate and render.
- Specs must be highly explicit and test-driven.

### Artifact Philosophy

Do not make HTML generation the core feature.

The core feature is **artifact compilation**:

```text
Atomic Note -> structured artifact pack -> deterministic lesson rendering
```

HTML is just the delivery format.

### Code Execution Policy

Do not start with a full compiler.

For CS learning, early phases should focus on:

- read code,
- predict output,
- trace variables,
- find bugs,
- write small code-like answers,
- compare to rubric.

Real execution can come later.

## Testing Policy For Every Spec

Every spec must include tests. Tests are not optional.

For foundational phases, tests must be code-level and headless:

- no Tauri window,
- no visible browser window,
- no manual visual inspection,
- no live AI calls,
- no network access unless explicitly required by a later web-search phase.

Preferred tests:

- Python unit tests for backend helpers.
- Python integration tests with temporary vault directories.
- Vitest tests only if frontend helpers are introduced.
- Playwright only for later UI phases, and only if necessary. For early foundational phases avoid it.

Implementation agents should stop only when:

```text
python3 -m pytest
pnpm --filter @ater/desktop test   # only if relevant frontend tests were added
openspec validate <change-name>
```

all pass.

## Current Phase Details: `learning-object-model`

Read these files before verifying or continuing:

```text
openspec/changes/learning-object-model/proposal.md
openspec/changes/learning-object-model/design.md
openspec/changes/learning-object-model/specs/learning-object-model/spec.md
openspec/changes/learning-object-model/tasks.md
```

The implementation tasks require:

- backend deterministic route helpers,
- metadata builders,
- artifact pack JSON builder/validator,
- existing Hub lookup,
- contract validator,
- headless Python tests,
- optional Vitest tests only if frontend helpers are introduced,
- OpenSpec validation.

The implementation must not replace or rewrite the old Ater Architect pipeline.

## Existing Code Areas To Understand

Before writing or reviewing specs, read the repo docs:

```text
AGENTS.md
docs/CONTEXT.md
LEARNING_RUNTIME_ROADMAP.md
```

Important architecture docs:

```text
README.md
docs/Architecture/ARCHITECTURE.md
```

Important Ater generation contract:

```text
Ater.md
apps/api/src/domains/ater/domain_matrix.yaml
apps/api/src/domains/ater/templates.py
apps/api/src/domains/ater/schemas.py
apps/api/src/domains/ater/agents.py
apps/api/src/domains/ater/service.py
```

Important vault and Obsidian backend areas:

```text
apps/api/src/domains/ater/vault_manager.py
apps/api/src/domains/obsidian/router.py
apps/api/src/domains/obsidian/client.py
apps/desktop/src/routes/obsidian.tsx
apps/desktop/src/lib/sidecarApi.ts
apps/desktop/src-tauri/src/commands.rs
```

Important Teacher/current lesson areas:

```text
apps/desktop/src/routes/teacher.tsx
apps/api/src/domains/teacher/service.py
apps/desktop/src/components/obsidian/HtmlLessonViewer.tsx
apps/desktop/src/components/obsidian/InteractiveLessonRenderer.tsx
apps/desktop/src/components/obsidian/InteractiveLessonPlayer.tsx
```

Important artifact areas:

```text
apps/desktop/src/lib/artifacts/parser.ts
apps/desktop/src/lib/artifacts/store.ts
apps/desktop/src/lib/artifacts/types.ts
apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx
apps/desktop/src/components/obsidian/ArtifactViewer.tsx
openspec/specs/interactive-artifacts/spec.md
openspec/specs/interactive-artifacts-expansion/spec.md
```

Important practice/question areas:

```text
apps/desktop/src/types/practice.ts
apps/desktop/src/hooks/usePracticeConfig.ts
apps/desktop/src/hooks/usePracticeSession.ts
apps/desktop/src/components/practice/
apps/api/src/domains/ater/quiz_builder.py
apps/api/src/domains/ater/compilers.py
apps/api/src/api/routers/ater.py
```

Important Oracle/agent areas:

```text
apps/desktop/src/routes/agents.tsx
apps/api/src/api/routers/ai.py
apps/api/src/domains/ater/assistant.py
```

## Existing Specs To Know

Read current specs before creating new changes:

```text
openspec/specs/interactive-artifacts/spec.md
openspec/specs/interactive-artifacts-expansion/spec.md
openspec/specs/notebook-lm/spec.md
openspec/specs/theme-system/spec.md
openspec/specs/desktop-production-ready-audit/spec.md
openspec/specs/refactor/spec.md
```

Do not accidentally modify an existing capability unless the new phase explicitly changes its requirements.

## Git / Workspace Caution

At the time this handoff was created, the worktree had unrelated changes in `Vault_Test/`, teacher/lesson files, and other areas. Treat them as user or generated work. Do not revert or delete them unless the user explicitly instructs you to.

The orchestration files created by this thread include:

```text
LEARNING_RUNTIME_ROADMAP.md
AGENT_HANDOFF_LEARNING_RUNTIME.md
openspec/changes/archive/2026-06-24-dynamic-study-console/
openspec/changes/learning-object-model/
```

## What To Do When The User Returns After Applying Phase 1

1. Ask for the implementation result if not provided:
   - test output,
   - `openspec validate learning-object-model` output,
   - `git status --short`,
   - changed file list.

2. Verify the implementation:
   - Use `openspec-verify-change` if available/applicable.
   - Read changed files.
   - Run relevant tests if possible.
   - Check every task in `tasks.md`.
   - Confirm no old pipeline replacement happened.

3. If Phase 1 is complete:
   - archive or prepare to archive as appropriate.
   - write the next OpenSpec change: `teach-anything-planner`.

4. If Phase 1 is incomplete:
   - give precise fix instructions for the implementation agent.
   - do not write Phase 2 yet.

## New Chat Prompt For The Next Agent

Use this prompt in a fresh chat:

```text
You are taking over as the Ater Learning Runtime OpenSpec Orchestrator.

Start by reading:
- AGENTS.md
- docs/CONTEXT.md
- LEARNING_RUNTIME_ROADMAP.md
- AGENT_HANDOFF_LEARNING_RUNTIME.md
- openspec/changes/learning-object-model/proposal.md
- openspec/changes/learning-object-model/design.md
- openspec/changes/learning-object-model/specs/learning-object-model/spec.md
- openspec/changes/learning-object-model/tasks.md

Your role:
- You are not the weak-model implementation agent.
- You are the orchestrator/spec writer.
- The user will apply each OpenSpec phase in another chat using `/opsx:apply <change-name>`.
- When the user returns, verify the implementation and then write the next OpenSpec phase.
- Write one spec at a time.
- Every spec must include concrete headless tests.
- Do not implement app code unless the user explicitly asks you to leave orchestration mode.
- Do not touch or replace the old Ater Architect pipeline unless a spec explicitly says so.
- Keep specs deterministic, small, and weak-model-friendly.

Current state:
- `LEARNING_RUNTIME_ROADMAP.md` exists.
- The old `dynamic-study-console` change was archived.
- The first phase, `learning-object-model`, has been proposed and validated.
- The next likely task is to verify the implementation of `learning-object-model`, or if already verified, write `teach-anything-planner`.

Product vision:
Ater should become an adaptive learning runtime:
Hub -> Chapter files -> Atomic Notes -> artifact packs -> durable HTML lesson variants -> tutor runtime -> practice/diagnosis/review.
Markdown is the source of truth. HTML lessons are durable offline expansions. Artifact packs are structured, editable, versioned, and weak-model-safe.
```

