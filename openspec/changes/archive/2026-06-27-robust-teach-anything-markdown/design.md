# Design

## Principle

The model should not own the final Markdown contract. It may draft explanation fragments, but code must decide whether the result is acceptable and must be able to produce a usable note without any model output.

## Runtime Flow

1. Build a `TeachingConceptSpec` from topic, chapter, note title, user prompt, mode, modality, related note titles, and optional source context.
2. Fetch web context when available, but never turn "no context" into an instruction prompt.
3. Ask the model agents for theory, practice, and quiz fragments.
4. Render those fragments through the existing Atomic Note compiler.
5. Run `validate_teaching_markdown` on the rendered body.
6. Retry only when the failure is recoverable.
7. If attempts fail, write `build_deterministic_teaching_note(spec)`.
8. Before persisting a note, run the same gate again and fall back if needed.

## Quality Gate

The gate is deterministic and checks:

- Required note headings are present.
- Internal prompts and source-placeholder language are absent.
- The note is not obviously truncated.
- The note discusses the focused concept instead of only generic learning language.
- The interactive quiz block is parseable JSON.
- Quiz answers and explanations are not placeholders.
- Non-CS notes do not receive CS/Java artifacts.

## Fallback Writer

The fallback writer is deliberately generic. It uses:

- The concept title as the anchor.
- The topic and chapter as scope.
- Optional source snippets as quoted grounding material when available.
- Deterministic domain hints for common technical/software topics.
- A fixed quiz JSON structure with concept-specific questions.

This does not make every fallback expert-level, but it prevents unusable vault output and gives the learner a coherent first pass for any topic.

## Non-Goals

- No interactive tutor changes in this change.
- No new live web-search requirement.
- No attempt to guarantee expert truth for source-free arbitrary topics.
