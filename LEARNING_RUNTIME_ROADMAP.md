# Ater Learning Runtime Roadmap

This roadmap captures the phased direction for evolving Ater from a note-generation pipeline into an adaptive learning runtime. The core principle is that Ater should build durable knowledge first, then compile that knowledge into interactive lessons.

## Product Principle

Ater should not merely generate lessons. Ater should run a learning loop:

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

Markdown remains the source of truth. HTML lessons are durable offline expansions of the Markdown. Artifact packs provide the structured interactive layer.

## Learning Hierarchy

```text
Hub
  -> Chapter files
      -> Atomic Notes
          -> full Markdown source
          -> artifact pack with versions
          -> durable HTML lesson variants
```

Each generated learning path must have a central Hub. Chapters are real vault files. Each Atomic Note gets one or more lesson variants and an artifact pack when useful.

## Folder Route

Teach Anything and self-study content use `database/learning paths/` for Hubs and `database/General/<Topic>/` for generated content.

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

      02_Branching/
        Chapter_02_Branching.md
        Branch_As_Movable_Pointer.md
        Merge_Conflict_Model.md

        lessons/
          Branch_As_Movable_Pointer.simple.html
          Merge_Conflict_Model.simple.html

        artifacts/
          Branch_As_Movable_Pointer.artifacts.json
          Merge_Conflict_Model.artifacts.json
```

Coursework and school material continue to use `database/study planner/` for Hubs and course-specific folders for content.

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

Rule:

```text
Teach Anything / self-study
  Hub: database/learning paths/
  Content: database/General/<Topic>/

Coursework / school material
  Hub: database/study planner/
  Content: database/<Semester>/<Course>/<Unit>/
```

If Ater finds an existing relevant Hub, it should extend that Hub rather than creating scattered duplicate learning paths.

## Phase 1: Learning Object Model

Define the durable learning-path structure before building new behavior.

Scope:

- New `Learning Hub` type.
- Chapter file schema.
- Atomic Note linkage to Hub and Chapter.
- Lesson file naming.
- Artifact pack file naming.
- Artifact versioning and rollback model.
- Lesson variant naming.
- Existing Hub detection and update rules.

Output:

```text
Hub.md
Chapter_01_Foundations.md
Atomic_Note.md
lessons/Atomic_Note.simple.html
lessons/Atomic_Note.cram.html
artifacts/Atomic_Note.artifacts.json
```

## Phase 2: Teach Anything Planner

Create or extend a Hub-centered learning path from a prompt.

Scope:

- Intent classifier.
- Clarification policy.
- Existing Hub lookup.
- Learn-from-scratch mode.
- Generate-all vs progressive generation.
- Chapter and Atomic Note planning.
- Confirmation before writing.

Clarification rule:

```text
Clear input
  -> proceed

Vague input where clarification would materially improve the result
  -> ask 1-3 high-impact questions
```

## Phase 3: Atomic Note Lesson Compiler

Convert Atomic Notes into durable offline HTML lessons.

Scope:

- One HTML lesson per Atomic Note.
- Full Markdown embedded inside each HTML lesson.
- HTML expands on the Markdown with simpler explanations and interactive lesson structure.
- Hub, Chapter, previous, and next navigation.
- Lesson variants: `simple`, `deep`, `cram`, `exam`.

## Phase 4: Artifact Pack v1

Add deterministic, weak-model-safe artifacts.

Scope:

- Artifact pack JSON schema.
- Artifact selector from domain and concept modality.
- Manual artifact pinning.
- Artifact versions and rollback.
- Regenerate or update artifact by request.
- Max artifact count rules.

Initial artifact set:

```text
reveal_card
cloze_multi
matching_pairs
sortable_steps
state_stepper
concept_map
table_lens
code_trace
formula_card
timeline
```

Artifacts should be generated only when they improve understanding, prediction, practice, diagnosis, or transfer. They are not decoration.

## Phase 5: Tutor Runtime

Make lessons active instead of passive.

Scope:

- Teach -> ask -> check -> diagnose -> follow-up -> advance.
- Reuse existing Practice question types.
- Confidence wager.
- Mistake diagnosis.
- Misconception capture.
- Lesson events such as `NEXT_NOTE`, `ANSWER_SUBMITTED`, `ARTIFACT_UPDATED`, and `MISCONCEPTION_FOUND`.

Existing Practice question types should be reused:

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

## Phase 6: Cram Mode

Create time-limited exam-focused learning.

Scope:

- Time budget.
- High-yield lesson variant.
- Heavy retrieval and testing.
- Weak spot prioritization.
- Durable cram lessons.

Default cram behavior:

```text
10% orientation
20% high-yield explanation
50% active recall
20% mistake repair
```

## Phase 7: Source-Driven Learning

Bring PDFs and source materials into the new architecture after Teach Anything works.

Scope:

- PDF and source input.
- Source-grounded chapter extraction.
- Generate Hub -> Chapters -> Atomic Notes -> Lessons.
- Source weakness warnings.
- Optional web augmentation.

## Phase 8: Advanced Artifacts

Expand artifact coverage after the v1 registry proves useful.

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

## Phase 9: Adaptive Learner Model

Make Ater adapt over time.

Scope:

- Per user, course, hub, and topic learner model.
- Weak concepts.
- Confidence calibration.
- Common misconceptions.
- FSRS integration.
- Recommended next lessons.

## Implementation Strategy

Write and implement one OpenSpec change at a time. Keep this roadmap as the guide, but do not hand the entire vision to one implementation agent.

Recommended order:

```text
1. learning-object-model
2. teach-anything-planner
3. atomic-note-lesson-compiler
4. artifact-pack-v1
5. tutor-runtime
```

Parallel agents can be used inside a phase after that phase's spec is locked. They should not implement later phases before foundational contracts are stable.
