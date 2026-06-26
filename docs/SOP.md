# SOP.md - Agentic SDLC

This repository uses OpenSpec-backed agentic engineering. Do not use the retired `docs/Specs` or `docs/Sprints` workflow.

## Session Start

Read only the files needed for the task:

1. `AGENTS.md`
2. `docs/CONTEXT.md`
3. `.sdlc/state.md`
4. `.sdlc/context-brief.md` when resuming work
5. OpenSpec artifacts for the active change

Load task-specific docs from `AGENTS.md` instead of scanning the whole repo.

## Workflow

### 1. Plan

Use `sdlc-plan`.

Planning creates or updates an OpenSpec change under:

```text
openspec/changes/<change-name>/
```

Planning may write OpenSpec artifacts and `.sdlc` state files only. It must not edit implementation code, runtime config, generated assets, tests, or migrations.

For non-tiny work, planning must use `openspec-explore` first so the user and agent share the same understanding before artifacts are written.

### 2. Orchestrate

Use `sdlc-orchestrate`.

Implementation happens on an isolated feature branch/worktree when possible. Non-trivial work is split into OpenSpec-backed phases. Subagents may implement bounded phases, but their completion reports are only signals; the parent verifies every phase independently.

Each phase must:

- map to OpenSpec tasks and requirements/scenarios
- stay inside allowed files/scope
- leave the repo buildable
- run relevant verification
- update `.sdlc/phase-ledger.md`, `.sdlc/run.json`, and `.sdlc/context-brief.md`

### 3. Verify

Use `sdlc-verify`.

Verification order is mandatory:

1. automated OpenSpec audit
2. fresh local lint/typecheck/test/build/eval commands
3. local preview available on the user's computer
4. one-by-one manual verification checklist
5. integration decision: PR, local merge, keep branch, or stop
6. CI/review gate when integrating
7. spec sync
8. archive
9. cleanup

Do not push or merge to `main` before manual verification passes. Do not archive before verification and the chosen integration path are complete or explicitly deferred.

## Source Of Truth

| Fact | Source |
|---|---|
| Requirements, scenarios, tasks | `openspec/changes/<change-name>/` |
| Long-lived capabilities | `openspec/specs/` |
| Current workflow state | `.sdlc/state.md` and `.sdlc/run.json` |
| Session summary | `.sdlc/context-brief.md` |
| Phase evidence | `.sdlc/phase-ledger.md` |
| Local/CI commands | `.sdlc/verification.md` |
| Human checks | `.sdlc/manual-checklist.md` |

## Change Classes

| Class | Use when | Required flow |
|---|---|---|
| Tiny | explicit, low-risk, obvious one-file or copy-level change | lightweight OpenSpec, one phase allowed |
| Product change | feature, refactor, behavior change, UI workflow, API change | `sdlc-plan -> sdlc-orchestrate -> sdlc-verify` |
| Production-critical | auth, DRM, payments, data loss, security, migrations, infra | full OpenSpec, tests, manual verification, CI, human review |

If classification is ambiguous, choose the stricter class.

## Non-Negotiables

- `docs/CONTEXT.md` vocabulary controls domain language.
- `Ater.md` stays at the repository root and must not be moved.
- OpenSpec artifacts are the only planning/task source of truth.
- `.sdlc` files track workflow state; chat history is not durable truth.
- Fresh verification evidence is required before any completion claim.
- Manual verification is mandatory for user-facing behavior unless explicitly waived and recorded.
- Preserve user work. Never discard, force-delete, or rewrite unrelated changes.
