# [WORKFLOW]: SOLO BUILDER LOOP
> **ATTENTION SOLO AGENT:** You are instructed to build the entire system alone. You must adopt the 9 Agent Personas sequentially to prevent context overload and hallucination.

## THE LOOP MANDATE
You must never build two domains at the same time. You will iterate through the monorepo package by package, following this strict sequence:

1. **Phase 1: Database (The Foundation)**
   * **Adopt Persona:** Read `.system/agents/04-database.md`.
   * **Load Context:** Read `.system/architecture/architecture.md`.
   * **Execute:** Navigate to `packages/database-orm`. Read `packages/database-orm/.domain/LOCAL_TASKS.md`. Build the Schema. Run local migrations.
   * **Commit:** Stage and commit with message: `"Database complete"`.
   * **Update State:** Move Database tasks to "Completed" in `.system/state/GLOBAL_TASKS.md`.

2. **Phase 2: Backend (The Logic)**
   * **Adopt Persona:** Read `.system/agents/03-backend.md`.
   * **Load Context:** Read `.system/architecture/architecture.md` (Pay strict attention to API Contracts).
   * **Execute:** Navigate to `apps/backend-api`. Read `apps/backend-api/.domain/LOCAL_TASKS.md`. Build the Endpoints. Run local unit tests (`vitest` or `pytest`).
   * **Commit:** Stage and commit with message: `"Backend complete"`.
   * **Update State:** Move Backend tasks to "Completed" in `.system/state/GLOBAL_TASKS.md`.

3. **Phase 3: Frontend (The Interface)**
   * **Adopt Persona:** Read `.system/agents/02-frontend.md`.
   * **Load Context:** Read `.system/design/design_rules.md` and `.system/design/app_structure.md`. Look at images in `references/` if any exist. Re-read `.system/architecture/architecture.md` for JSON payload expectations.
   * **Execute:** Navigate to `apps/web-client`. Read `apps/web-client/.domain/LOCAL_TASKS.md`. Build the UI components.
   * **Commit:** Stage and commit with message: `"Frontend complete"`.
   * **Update State:** Move Frontend tasks to "Completed" in `.system/state/GLOBAL_TASKS.md`.

4. **Phase 4: Global Testing (The Inquisitor)**
   * **Adopt Persona:** Read `.system/agents/07-inquisitor.md`.
   * **Execute:** Navigate to `apps/e2e-tests`. Write and execute Playwright tests covering the full system.
   * If tests fail, adopt `.system/agents/06-detective.md` Persona, find the bug in the specific app, fix it locally, and re-run Phase 4.

5. **Phase 5: DevOps**
   * **Adopt Persona:** Read `.system/agents/08-devops.md`.
   * **Execute:** Write Dockerfiles and CI/CD pipelines in `.github/workflows/`.
   * **Commit:** Stage and commit with message: `"Project Deployment Ready"`.
