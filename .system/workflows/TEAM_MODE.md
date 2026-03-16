# [WORKFLOW]: MULTI-AGENT TEAM MODE
> **ATTENTION ARCHITECT & ORCHESTRATOR:** This runbook dictates how to operate the Factory with concurrent, specialized AI Agents. You will act as the orchestrator to kick off the team.

## THE BRANCHING STRATEGY
1. **The Starting Point:** The Architect Agent must commit the current `.system/` state (Architecture, Design Rules, Global Tasks) to the repo with the message: `"Initial commit: Architecture and Requirements"`.
2. **The Freeze:** The Orchestrator halts execution. It awaits the user to boot up individual agents in separate environments.

## THE CONCURRENT EXECUTION
Agents will be booted up manually by the user with the command: *"Read AGENTS.md and your role is [Role Name]"*.

**Agent Responsibilities:**
*   Read `AGENTS.md` and load context.
*   Update your assigned `LOCAL_TASKS.md` in your `.domain/` folder.
*   Create a separate branch (e.g., `feature/frontend` or `feature/backend`).
*   Execute your assigned Global Epic.
*   Write and run local unit tests.
*   Submit a Pull Request with the message `"[Domain] complete"`.

## THE MERGE & GLOBAL TEST PHASE
1. The user will call the **Merge Agent** to resolve any lockfile conflicts in `pnpm-lock.yaml`.
2. Once all PRs are merged into `main`, the user will call the **Inquisitor Agent** to write and run Global E2E Tests in `apps/e2e-tests`.
3. If the Inquisitor finds bugs, the **Detective Agent** will be dispatched to read the `ERROR_REGISTRY.md` and fix them.
