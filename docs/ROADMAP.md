# ROADMAP.md - Ater Adaptive Learning Runtime

This document records durable product direction only. Active implementation work belongs in OpenSpec changes, not in this file.

## Product Vision

Ater is evolving from a note-generation pipeline into a local-first adaptive learning runtime:

```text
Teach -> Interact -> Ask -> Check -> Diagnose -> Remediate -> Advance -> Review
```

Markdown inside the Obsidian Vault remains the source of truth. Durable HTML lessons and structured artifact packs expand that Markdown into offline interactive learning experiences.

## Learning Hierarchy

```text
Hub
  -> Chapter files
      -> Atomic Notes
          -> Markdown source
          -> Artifact pack
          -> HTML lesson variants
```

## Vault Routing

Self-study and Teach Anything:

```text
Hub:     database/learning paths/
Content: database/General/<Topic>/
```

School coursework:

```text
Hub:     database/study planner/
Content: database/<Semester>/<Course>/<Unit>/
```

If Ater finds an existing relevant Hub, it should extend that Hub rather than creating duplicate learning paths.

## Capability Areas

- Learning object model: Hubs, Chapters, Atomic Notes, lesson variants, artifact pack versioning.
- Teach Anything planner: intent classification, Hub lookup, chapter planning, progressive note generation.
- Atomic note lesson compiler: durable offline HTML lessons compiled from Markdown.
- Artifact packs: structured interactive objects such as reveal cards, matching pairs, code traces, formula cards, simulations, and proof steps.
- Tutor runtime: quiz checking, wagers, mistake diagnosis, lesson event logging.
- Cram mode: high-yield scheduling under strict time limits.
- Source-driven learning: local document extraction and source-grounded learning paths.
- Adaptive learner model: FSRS, confidence calibration, misconception history, and next-lesson recommendations.

## Execution Rule

Every new capability or hardening pass must be represented as an OpenSpec change under `openspec/changes/<change-name>/` and follow:

```text
sdlc-plan -> sdlc-orchestrate -> sdlc-verify
```
