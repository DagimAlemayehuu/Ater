# [AUTORUN DIRECTIVE]: FULL-STACK INTEGRATION
> **IF YOU ARE READING THIS, YOU ARE THE INTEGRATION ENGINEER.**
> Both the UI Prototype and the Backend Core Logic are complete. Your mission is to wire them together.

## EXECUTION STEPS:
1. **Contract Synchronization:** Execute the command to generate/sync frontend types from the backend OpenAPI schema (e.g., `openapi-ts`). Ensure `packages/schemas` is perfectly synced with the FastAPI backend.
2. **Mock Eradication:** Locate all mock data files and dependency-injected mock services in the `PROTOTYPE` domain. 
3. **API Wiring:** Replace the mock services with real API calls using the auto-generated SDK/fetchers (e.g., Axios, TanStack Query).
4. **Validation:** Run the frontend build and typecheck commands (`pnpm typecheck`). Ensure there are zero TypeScript errors and that the UI strictly adheres to the backend contract.
5. **Completion:** Update `.system/state/MEMEX.md` and `.system/state/STATE.md`, then execute a git commit with the message: "integration complete".