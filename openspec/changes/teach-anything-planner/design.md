## Context

Ater currently has an ingestion pipeline that accepts source materials (like documents or raw text) and generates Atomic Notes. To support the new adaptive learning runtime roadmap, Ater needs a "Teach Anything" planner. This planner allows a user to type a prompt (e.g. "Teach me advanced Git branching") and receive a tailored curriculum of chapters and note topics.

This design covers the orchestration layer of that planner. It classifies the intent, evaluates whether clarification is needed (Socratic gate), checks if a matching Learning Hub already exists, plans the curriculum of chapters and note stubs, and prompts for user confirmation before writing files. It does not generate the actual content of the Atomic Notes or lessons—it only plans the structure.

## Goals / Non-Goals

**Goals:**
- Implement an intent classifier to identify learning requests.
- Implement a clarification policy to ask 1 to 3 targeted questions when a prompt is too vague or lacks context.
- Integrate the existing Hub lookup to extend an existing learning path instead of creating a duplicate.
- Plan a curriculum structure (Hub topic, learning mode, chapters list, and Atomic Note titles per chapter).
- Support "Generate All" and "Progressive" planning modes.
- Implement a preview step where the user approves the proposed curriculum before any files are written to the vault.
- Ensure all business logic runs headlessly and is fully testable in python unit/integration tests with mocked LLM calls.

**Non-Goals:**
- Do not write the full content of the Atomic Notes or compile HTML lessons (this is for later compiler/generator phases).
- Do not build a new LLM client interface; reuse existing Gemini / local model clients.
- Do not modify coursework study planner workflows.
- Do not build complex frontend UI components in this phase (API contract and logic first).

## Decisions

### 1. Separation of Ingestion Intent Classification
The planner API will first classify the incoming user query. It will identify if the intent is to learn a new topic or expand a topic.
- If it is not a learning request, it will gracefully reject or route it back.
- **Alternatives considered**: Use keyword matching (e.g. looking for "teach", "learn"). Rejected because keyword matching is brittle and cannot handle complex prompts or questions.

### 2. Socratic Clarification Gate
If the user's prompt is deemed too vague (e.g., "Teach me programming"), the planner will return a list of 1-3 clarification questions.
- If the user provides a detailed prompt, the planner proceeds directly.
- **Alternatives considered**: Always generate a default curriculum for vague prompts. Rejected because starting with a generic curriculum does not respect the user's specific goals and results in high token waste.

### 3. Progressive vs. All-at-Once Generation
The curriculum JSON will support planning the entire course structure. The planner will support writing all files (stubs) at once ("Generate All") or writing only the first chapter's stubs ("Progressive").
- In "Progressive" mode, only the first chapter and its notes are written as stubs; the Hub lists subsequent chapters as planned but not yet created.

### 4. Deterministic Mocking for Testing
All LLM-driven components (intent classifier, question generator, curriculum planner) will use a mockable interface in `apps/api` so that the unit and integration tests do not make real network calls and run fast and headlessly.

## Risks / Trade-offs

- **[Risk]**: The LLM planning output is non-deterministic, which might produce invalid JSON or structure.  
  **Mitigation**: Use Pydantic schemas for structured outputs and enforce robust parsing/fallback in the sidecar.

- **[Risk]**: Merging new chapters into an existing Hub might corrupt existing markdown formatting.  
  **Mitigation**: Use the structured markdown parsing libraries already present in the project to append new chapters cleanly.
