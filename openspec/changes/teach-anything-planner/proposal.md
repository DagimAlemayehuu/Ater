## Why

Ater needs a structured planning system to create or extend learning paths from user prompt intents. Currently, Ater lacks a central coordinator that classifies intent, determines whether to ask for clarification, lookup existing Hubs, and maps out a curriculum of Chapters and Atomic Notes before generating files. This change introduces the `teach-anything-planner` capability to fulfill this need.

## What Changes

- **Intent Classifier**: Service in the sidecar to detect if a prompt is a learning request (e.g. "Teach me X", "Learn Y") vs. other Ater operations.
- **Clarification Policy Engine**: Evaluates prompt vagueness and decides whether to ask 1 to 3 targeted clarification questions or proceed directly.
- **Existing Hub Lookup & Extension**: Queries existing Hub files using the Phase 1 lookup helper. If found, plans to extend the existing Hub rather than creating a duplicate.
- **Curriculum Planner**: Uses local-model or Gemini API prompting to plan a list of Chapters (titles and order) and Atomic Notes (titles and order) matching the user's intent.
- **Generation Mode Selector**: Supports either "Generate All" (plan and queue all notes) or "Progressive" (plan all, but generate and write one chapter at a time).
- **Confirmation step**: Renders the proposed curriculum to the user for approval before writing files to the vault.

## Capabilities

### New Capabilities
- `teach-anything-planner`: Handles intent classification, clarification questioning, existing-Hub integration, curriculum structure planning, and confirmation before vault file writing.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: New services in `apps/api/src/domains/ater/` implementing planner logic, intent classification, and curriculum generation APIs.
- **Tauri / Desktop UI**: Desktop client components to support the planner flow, showing clarification prompts if needed, displaying the proposed curriculum tree, and providing a "Confirm & Generate" action.
- **Obsidian Vault**: Will write new Learning Hubs and Chapters under the canonical paths defined in Phase 1.
- **Tests**: Headless backend unit and integration tests simulating the planner flow, mock LLM generation, and file-writing assertions.
