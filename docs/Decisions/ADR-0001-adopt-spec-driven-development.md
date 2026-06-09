# ADR-0001: Adoption of Spec-Driven Development (SDD) v1.0

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes (Lead Architect), Antigravity (Lead Implementation Engineer)

---

## Context

The Ater project was previously developed under an informal, iterative workflow where implementation decisions were made at the point of coding with no prior written contract. This "vibe coding" approach caused context loss across sessions, undocumented reversals of architectural decisions, and no clear definition of "done" beyond test passage. As the codebase scales and the Hermes → Antigravity two-agent handoff model is formalized, a shared written contract layer is required.

## Decision

Adopt Spec-Driven Development (SDD) v1.0 as the mandatory engineering workflow for all Tier 2 changes. The full procedure is codified in `docs/SOP.md`. Key elements:

- A two-tier change classification (Tier 1: micro, Tier 2: structural/feature).
- No Tier 2 code written before a spec carries `status: SIGNED_OFF`.
- Hermes is the sole spec approval authority.
- "Done" is defined as: all Acceptance Criteria mapped to passing tests, plus an ADR written if architecture changed.
- A canonical `docs/CONTEXT.md` glossary is the mandatory first-read of every session.

## Alternatives Considered

**Continue ad-hoc workflow**: Rejected. Context loss across multi-session, multi-agent development is unacceptable at the current codebase scale.

**Use GitHub Issues as the spec layer**: Rejected. The project is local-first by principle; GitHub Issues require a remote dependency and break the offline-first engineering philosophy that mirrors the product's own design mandate.

**Use the existing `openspec/` system unchanged**: Partially rejected. The `openspec/` system had the right shape (proposal, design, tasks) but lacked: a mandatory glossary, explicit sign-off gating, an acceptance criteria contract, and a clear Tier 1 exemption for micro-changes. SDD v1.0 is a superset of the openspec model.

## Consequences

**What becomes easier**:
- Antigravity can resume any session by reading three files (`CONTEXT.md`, `Sprints/active.md`, relevant `spec.md`) and have full context.
- Architectural decisions are traceable. No more "why was this changed?" questions.
- "Done" has a binary, verifiable definition.

**What becomes harder**:
- Urgency-driven patches require conscious classification before implementation — a small but real friction cost.
- Hermes must be available or Tier 2 work is blocked. (Mitigation: log as BLOCKED in `Sprints/active.md` and switch to Tier 1 queue.)

**Invariants this ADR does not change**:
- `Ater.md` remains at the project root and is not governed by this doc structure.
- The `openspec/` directory and its existing archive are preserved as historical record.
