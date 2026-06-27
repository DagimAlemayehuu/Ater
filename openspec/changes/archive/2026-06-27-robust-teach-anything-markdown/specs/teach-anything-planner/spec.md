## MODIFIED Requirements

### Requirement: Teach Anything planner
The system SHALL generate Teach Anything learning paths for arbitrary user prompts and SHALL produce vault-ready Markdown notes through deterministic quality gates before writing content.

#### Scenario: Reject weak-model prompt leakage before writing
- **WHEN** a model-generated Teach Anything Atomic Note contains internal prompt text, placeholder source language, placeholder quiz answers, or obviously truncated prose
- **THEN** the runtime SHALL reject that body before writing it to the vault
- **AND** the runtime SHALL retry or replace it with a deterministic fallback note

#### Scenario: Produce a usable note without source material
- **WHEN** the user asks to learn a topic from a simple prompt without attaching sources
- **THEN** the runtime SHALL build neutral grounding context from the topic, chapter, note title, and prompt
- **AND** it SHALL NOT inject prompt-shaped fallback text such as requests for a comprehensive explanation into the generated note
- **AND** it SHALL write a structurally valid Atomic Note with an interactive quiz

#### Scenario: Preserve source-backed grounding without fake citations
- **WHEN** source snippets are available for a Teach Anything concept
- **THEN** the runtime MAY use those snippets as grounding context
- **BUT** it SHALL NOT emit fake page anchors, generic "source treatment" placeholders, or claims that the source says something when no specific source snippet supports it

#### Scenario: Headless quality tests
- **WHEN** the Teach Anything Markdown quality tests run
- **THEN** they SHALL run without a desktop window
- **AND** they SHALL run without live AI providers
- **AND** they SHALL run without network access
