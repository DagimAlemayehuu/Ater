# SOP.md — Standard Operating Procedure v1.0
# Ater Spec-Driven Development (SDD)

> **Effective from**: 2026-06-08  
> **Authority**: Hermes (Lead Architect) + Antigravity (Lead Implementation Engineer)  
> **Supersedes**: All prior ad-hoc "vibe coding" workflows.

---

## 0. Session Start Protocol

Before **any** work begins in a new session, Antigravity must read the following files in order:

1. `docs/CONTEXT.md` — Domain glossary and invariants.
2. `docs/Sprints/active.md` — Current operational focus.
3. The relevant `spec.md` in `docs/Specs/active/<feature-slug>/` if implementing a Tier 2 feature.

Skipping step 1 is a protocol violation. Proceed without it and terminology will drift.

---

## 1. Change Classification

Every piece of work is classified before implementation begins. No exceptions.

### Tier 1 — Micro-Change

**Definition**: A change that modifies no observable behavior, introduces no new logic, and touches at most one or two files.

**Qualifying categories** (if the work does not fit these exactly, escalate to Tier 2):
- Lint fixes
- Unused import removal
- TypeScript `any` → typed replacement (where the type is obvious and already used)
- Copy/label/text string changes
- Code formatting
- Comment additions or corrections

**Workflow**:
```
Identify → Implement → Log in docs/Sprints/micro-log.md → Done
```

**micro-log.md entry format**:
```
- YYYY-MM-DD | <file changed> | <one-line description>
```

**No spec required. No Hermes sign-off required.**

---

### Tier 2 — Structural or Feature Change

**Definition**: Any change that introduces new behavior, modifies existing behavior, touches the database schema, adds/modifies a Tauri IPC command, adds a new route, modifies the FastAPI sidecar API surface, or affects the security/DRM layer.

**Qualifying triggers**:
- New React route or component with own state
- New or modified Tauri IPC command
- New or modified FastAPI endpoint
- Supabase schema change (tables, triggers, RLS policies)
- Changes to `ater.db` schema or FSRS logic
- Changes to `Ater.md` note-generation rules (requires full system review)
- Any change to `PageGuard`, `useSecurityStore`, or the DRM lease flow
- Changes to the ONNX embedding pipeline
- UI layout changes that affect information hierarchy

**Workflow**:
```
spec.md created in docs/Specs/active/<slug>/
       ↓
Hermes reviews and sets status: SIGNED_OFF in frontmatter
       ↓
Antigravity implements against the signed spec
       ↓
Acceptance Criteria verified (each AC → named test/assertion)
       ↓
ADR written if architecture was modified
       ↓
Spec moved to docs/Specs/archive/<slug>/
```

**No code is written before `status: SIGNED_OFF` appears in the spec frontmatter. This is the enforcement gate.**

---

## 2. Spec File Format

All Tier 2 specs live at `docs/Specs/active/<feature-slug>/spec.md`.

### Required Frontmatter

```yaml
---
title: "<Human-readable feature name>"
slug: "<feature-slug>"
status: DRAFT | IN_REVIEW | SIGNED_OFF | ARCHIVED
author: Hermes | Antigravity
created: YYYY-MM-DD
signed_off_date: YYYY-MM-DD   # populated by Hermes on sign-off
---
```

### Required Sections

```markdown
## Context
Why this change is needed. Problem statement only — no solution yet.

## Goals
What this spec will deliver. Numbered list.

## Non-Goals
What this spec explicitly will NOT address. Prevents scope creep.

## Decisions
Key technical decisions made during design, with rationale and rejected alternatives.

## Acceptance Criteria
Numbered, testable, observable behaviors. Each one MUST be mapped to a test before archiving.

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | ... | `tests/unit/foo.test.ts > "test name"` |
| AC-2 | ... | `e2e/bar.spec.ts > "test name"` |

## Risks & Trade-offs
```

### Optional Sections

```markdown
## Design Notes       ← UI changes: attach screenshots or token references
## Migration Notes    ← DB schema changes: attach SQL migration filename
```

---

## 3. Sign-Off Protocol

Hermes is the sole spec approval authority.

**A spec becomes a binding implementation contract when and only when:**

```yaml
status: SIGNED_OFF
signed_off_date: YYYY-MM-DD
```

...appears in the spec's YAML frontmatter.

Antigravity must not begin Tier 2 implementation if `status` is anything other than `SIGNED_OFF`. If Hermes is unavailable and urgency is critical, Antigravity may escalate by logging a `BLOCKED` status in `docs/Sprints/active.md` and halting Tier 2 work.

---

## 4. Verification Protocol

A Tier 2 feature is **NOT done when tests pass**. It is done when:

**Layer 1 — Mechanical** (necessary but not sufficient):
```bash
python .agent/scripts/checklist.py .
```
All checks must pass: lint, types, test suite.

**Layer 2 — Behavioral** (the actual done condition):
- Every AC item in the spec's Acceptance Criteria table has a `Mapped Test` entry pointing to a real, passing test file and test name.
- If an AC cannot be mapped to a test, a new test must be written before the spec is archived. "It works manually" is not verification.

**Layer 3 — Architectural** (conditional):
- If the change modified system architecture (added a new subsystem, changed a data flow, introduced a new external dependency), a new ADR must be written in `docs/Decisions/` before archiving.
- ADR naming: `ADR-NNNN-short-decision-title.md` (zero-padded, sequential).

---

## 5. Spec Lifecycle

```
docs/Specs/active/<slug>/spec.md    ← Active: being designed or implemented
       ↓  (all ACs verified, ADR written if needed)
docs/Specs/archive/<slug>/spec.md   ← Archived: immutable record
```

**Abandoned specs**: If a spec is cancelled before implementation completes, set `status: ABANDONED` in frontmatter, add a one-line `## Abandonment Reason` section, and move to `archive/`. Do not delete specs — they are ADR-equivalent historical records.

---

## 6. ADR Format

All Architecture Decision Records live in `docs/Decisions/`.

```markdown
# ADR-NNNN: <Decision Title>

**Date**: YYYY-MM-DD  
**Status**: PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED BY ADR-NNNN  
**Deciders**: Hermes, Antigravity

## Context
What situation forced this decision.

## Decision
What was decided.

## Alternatives Considered
What was rejected and why.

## Consequences
What changes as a result. What becomes harder or easier.
```

---

## 7. Operational Prohibitions

These actions are forbidden under SDD v1.0:

- Writing Tier 2 implementation code before `status: SIGNED_OFF`
- Modifying `Ater.md` at the project root without a full system-level review and explicit Hermes directive
- Moving `docs/Architecture/PRODUCT.md` or `docs/Architecture/DESIGN.md` without an ADR
- Adding a new external API dependency without an ADR documenting the offline-first impact
- Claiming a Tier 2 feature is "done" without all AC rows in the spec having a Mapped Test
- Inventing domain terminology not present in `docs/CONTEXT.md`
- Archiving a spec with `status` still set to `DRAFT` or `IN_REVIEW`
