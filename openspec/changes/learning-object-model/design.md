## Context

Ater already has an Ater Architect ingestion pipeline that generates Atomic Notes into an Obsidian Vault, and a newer Teacher path that creates lessons. Those paths do not yet share a durable learning object contract. The next learning runtime needs a stable model before planner, compiler, artifact, tutor, cram, and PDF phases can be implemented safely.

This change introduces the foundational vault structure only. It does not replace the existing Ater Architect pipeline, does not implement Teach Anything generation, and does not implement interactive artifacts. It creates deterministic file routes, metadata contracts, and validation helpers that later phases can call.

The implementation agent for this work may be a weak model, so the design intentionally favors code-owned schemas, deterministic path builders, validators, and headless tests over broad UI behavior or LLM-generated structure.

## Goals / Non-Goals

**Goals:**

- Define a durable Hub -> Chapter -> Atomic Note -> Lesson -> Artifact Pack hierarchy.
- Add a `Learning Hub` contract for Teach Anything and self-study paths.
- Keep coursework Hubs distinct from self-study Learning Hubs.
- Define canonical folder routes for self-study and coursework learning objects.
- Define frontmatter metadata needed to link Hubs, Chapters, Atomic Notes, HTML lessons, and artifact packs.
- Define lesson variant naming for `simple`, `deep`, `cram`, and `exam`.
- Define artifact pack JSON shape with version storage and pinned artifact metadata.
- Define deterministic existing-Hub lookup behavior for future planners.
- Require headless unit/integration tests that run in code without launching a desktop window.

**Non-Goals:**

- Do not modify or replace the existing Ater Architect note generation pipeline.
- Do not generate new lessons from prompts.
- Do not compile Atomic Notes into full HTML lessons yet.
- Do not render or edit interactive artifacts in the UI.
- Do not add real code execution, tutor runtime behavior, cram runtime behavior, PDF extraction, or learner-model adaptation.
- Do not require GUI, browser window, or Tauri window tests in this phase.

## Decisions

### 1. Learning Hub route is separate from coursework study planner

Self-study / Teach Anything Hubs SHALL live under:

```text
database/learning paths/
```

Coursework Hubs SHALL continue to live under:

```text
database/study planner/
```

Self-study content SHALL live under:

```text
database/General/<Topic>/
```

Coursework content SHALL continue to use:

```text
database/<Semester>/<Course>/<Unit>/
```

**Rationale:** The user explicitly wants `study planner` to remain coursework-specific while giving Teach Anything a clean home. Keeping content under `database/General/<Topic>/` preserves the existing pipeline's course-like organization without mixing self-study Hubs into coursework planning.

**Alternative considered:** Put all Teach Anything files under `database/learning paths/<Topic>/`. Rejected because it would make Hubs and content live in one folder and diverge from existing Ater academic organization.

### 2. Chapter files are real vault objects

Each Chapter SHALL be a Markdown file, not merely a section inside a Hub. Chapter files SHALL group Atomic Notes and provide stable navigation metadata.

Example:

```text
database/General/Git/01_Foundations/Chapter_01_Foundations.md
```

**Rationale:** Real Chapter files make the hierarchy inspectable in Obsidian, easier to test, easier to navigate, and easier for later lesson/runtime phases to update.

**Alternative considered:** Store chapters only as Hub sections. Rejected because the user wants real Chapter files and because section-only chapters are harder to link, update, test, and extend.

### 3. Atomic Notes remain the source of truth

Atomic Notes SHALL remain Markdown files. HTML lessons and artifact packs are derived companion files. Atomic Note frontmatter SHALL link to its Hub, Chapter, lesson variants, and artifact pack.

Example frontmatter fields:

```yaml
type: Atomic Note
hub: "[[Git_Hub]]"
chapter: "[[Chapter_01_Foundations]]"
lesson_variants:
  simple: "lessons/Git_Three_State_Model.simple.html"
  deep: "lessons/Git_Three_State_Model.deep.html"
  cram: "lessons/Git_Three_State_Model.cram.html"
  exam: "lessons/Git_Three_State_Model.exam.html"
artifact_pack: "artifacts/Git_Three_State_Model.artifacts.json"
```

**Rationale:** This preserves Obsidian-readable knowledge while enabling durable lessons and artifacts.

### 4. Lesson variants use deterministic filenames

Lesson filenames SHALL follow:

```text
lessons/<Atomic_Note_Title>.<variant>.html
```

Valid phase-one variants SHALL be:

```text
simple
deep
cram
exam
```

This phase defines the naming contract only. It does not require generating all variants.

**Rationale:** Later phases can generate mode-specific lessons without changing paths or metadata.

### 5. Artifact packs are JSON companion files with versions

Artifact pack filenames SHALL follow:

```text
artifacts/<Atomic_Note_Title>.artifacts.json
```

The artifact pack SHALL support versions and pinned artifact type preferences. A minimal valid pack:

```json
{
  "schema_version": 1,
  "note_title": "Git_Three_State_Model",
  "note_path": "database/General/Git/01_Foundations/Git_Three_State_Model.md",
  "active_version": 1,
  "pinned_artifact_types": [],
  "versions": [
    {
      "version": 1,
      "created_at": "2026-06-24T00:00:00Z",
      "artifacts": []
    }
  ]
}
```

**Rationale:** Editing and rollback are future requirements. Defining version structure now prevents later migration churn.

### 6. Existing-Hub lookup is deterministic and conservative

Future planners SHALL use deterministic lookup helpers before creating a new Learning Hub. The phase-one contract SHOULD support:

- exact canonical title match,
- normalized title match,
- alias/topic match when metadata exists,
- matching within both `database/learning paths/` and `database/study planner/`.

When a relevant Hub is found, later phases SHALL extend the existing Hub instead of creating a duplicate. This phase only provides the contract and helper behavior; it does not implement the planner.

**Rationale:** The user wants Ater to update existing lessons when a Hub already exists.

### 7. Tests are headless code tests

This phase SHALL use headless unit and integration tests only. Tests SHALL run through existing Python/TypeScript test runners and SHALL NOT require opening a Tauri desktop window, OS browser window, or visual Playwright session.

Acceptable tests:

- Python unit tests for route builders, metadata builders, artifact pack validators, and Hub lookup.
- Python integration tests using temporary vault directories.
- TypeScript/Vitest tests for any frontend-side path or metadata helpers introduced in this phase.

Not acceptable for this phase:

- Tests that require a visible app window.
- Tests that depend on manual inspection.
- Tests that call live AI providers.
- Tests that depend on network access.

## Risks / Trade-offs

- **Risk:** New metadata fields drift from existing Ater note conventions.  
  **Mitigation:** Keep `hub` as a quoted wikilink, keep `course` and `semester` plain text, and add fields rather than changing existing required fields.

- **Risk:** The implementation agent touches the old pipeline while adding helpers.  
  **Mitigation:** Tasks explicitly forbid pipeline replacement and require backward-compatible shared helpers only.

- **Risk:** Artifact pack schema becomes too ambitious for phase one.  
  **Mitigation:** Only define minimal versioned JSON structure. Do not implement artifact generation.

- **Risk:** Existing Hub lookup falsely merges unrelated topics.  
  **Mitigation:** Use conservative exact/normalized matching in phase one. Fuzzy matching can be added later behind explicit thresholds.

- **Risk:** Tests become UI-heavy and fragile.  
  **Mitigation:** Require headless unit/integration tests only and include temporary-vault fixtures for file contract tests.

## Migration Plan

No existing vault files need migration in this phase. The new learning object model applies to newly created learning paths and future phases.

Implementation should be rollback-safe: removing the new helpers and tests should not affect the old Ater Architect pipeline.

## Open Questions

- The exact module names are left to implementation, but the preferred direction is a small deterministic backend helper/service in `apps/api/src/domains/ater/` and optional frontend helper mirrors only if needed.
- Later phases will decide whether all lesson variants are generated upfront or lazily. This phase only defines valid variant paths.
