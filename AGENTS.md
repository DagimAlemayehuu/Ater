# [SUPREME LAW]: AUTONOMOUS FACTORY DIRECTIVE
> **ATTENTION AGENT:** If you are reading this, you are operating in a multi-agent, asynchronous Monorepo Environment.
> You must strictly adhere to this protocol to ensure you do not break the factory or hallucinate instructions.

## 1. THE PRIME DIRECTIVE (ROLE ADOPTION & INITIALIZATION)
You are a blank slate. You are forbidden from modifying code until you adopt a specific Persona and arm the repository's defenses.

When initialized by the user, you will be told: *"Read AGENTS.md and your role is [Role Name]"*.
**IMMEDIATELY perform these two actions:**
1.  Run `pnpm install` in the root directory. This is non-negotiable. It installs dependencies and arms the Husky pre-commit hooks.
2.  Read your specific profile in `.system/agents/[role].md` and assume that identity.

## 2. HYPER-TRIMMED CONTEXT LOADING PROTOCOL (TOKEN SAVER)
**DO NOT READ THE ENTIRE REPOSITORY.** To save tokens and maintain absolute focus, you must ONLY read the files listed for your specific role below. You do NOT need to read global state files unless you are the Architect, Merge Agent, or Inquisitor.

**ROLE-SPECIFIC READING PROTOCOLS:**

*   **If you are the Architect (`01-architect.md`):**
    *   Read `.system/prompts/prompt.md`.
    *   Read `.system/state/STATE.md` and `.system/state/GLOBAL_TASKS.md`.
    *   *Note: Architect must use `pnpm run generate:contracts` (or equivalent) to enforce the Cross-Language Dependency Graph (Zod -> OpenAPI -> Pydantic).*

*   **If you are the Frontend Agent (`02-frontend.md`):**
    *   Read `apps/desktop/.domain/LOCAL_TASKS.md` or `apps/web-client/.domain/LOCAL_TASKS.md` (Your specific tasks).
    *   Read `.system/design/design_rules.md` & `.system/design/app_structure.md`.
    *   Read the API Contracts in `packages/schemas` (e.g., `api_contracts.ts`). This is the strict law.
    *   *DO NOT READ global state, architecture docs, or backend code.*

*   **If you are the Backend Agent (`03-backend.md`):**
    *   Read `apps/api/.domain/LOCAL_TASKS.md`.
    *   Read the API Contracts in `packages/schemas`.
    *   Read the Database Models in `packages/database-orm/prisma/schema.prisma` or equivalent.
    *   *DO NOT READ global state, design docs, or frontend code.*

*   **If you are the Database Agent (`04-database.md`):**
    *   Read `packages/database-orm/.domain/LOCAL_TASKS.md`.
    *   Read the Database Blueprint in `.system/architecture/architecture.md`.
    *   *DO NOT READ frontend, backend, or design docs.*

*   **If you are the Surgeon/Update Agent (`05-surgeon.md`):**
    *   Ask the user for clarification.
    *   Append the feature to the correct section of `.system/state/GLOBAL_TASKS.md`.
    *   Adopt necessary Builder personas and read their specific files.

*   **If you are the Detective/Debugger (`06-detective.md`):**
    *   Read `.system/state/ERROR_REGISTRY.md`.
    *   Trace the bug strictly to the offending `.domain` and read its `LOCAL_ERRORS.md`.

**STOP READING.** You now have full context. Do not read files outside your assigned domain unless required by an explicit import statement.

## 3. THE ISOLATION MANDATE
You are strictly forbidden from modifying files outside of your assigned domain as defined in your Agent Profile.
*   If you are assigned to `apps/desktop`, do not touch `apps/api`.
*   If you find a bug in another domain, do NOT fix it. Log it in `.system/state/ERROR_REGISTRY.md` for the Debugger Agent.

## 4. THE PHYSICAL PRE-COMMIT GATE (HUSKY)
You cannot push broken code. Husky will physically run `turbo run lint typecheck test`.
1.  **NEVER use standard `git commit`**. You MUST use `pnpm run safe-commit -m "Your message"` to execute your commits.
2.  If the commit fails, read the terminal output carefully.
3.  Fix the TypeScript type, syntax error, or failing test in your domain and re-run `pnpm run safe-commit`.
4.  **CIRCUIT BREAKER:** The `safe-commit` script is hardcoded. If you fail 3 times on the same issue, you are physically blocked from retrying and forced to create a DRAFT commit. You MUST STOP and halt execution.

## 5. STATE SYNCHRONIZATION
When you finish your assigned task:
1.  Move your specific sub-tasks from "In-Progress" to "Completed" in your domain's `.domain/LOCAL_TASKS.md`.
2.  *(Only if Architect/Surgeon)* Update `.system/state/GLOBAL_TASKS.md`.
3.  Push your branch and submit the Pull Request.

**CRITICAL SYNC GAP (Merge Agent / Inquisitor):**
*   When a PR is successfully merged, the Merge Agent or the Inquisitor MUST cross-reference the completed `LOCAL_TASKS.md` from that PR and tick off the corresponding macro-box in `.system/state/GLOBAL_TASKS.md`. The Worker Agents cannot do this. You are responsible for keeping the global state accurate.

## 6. THE SCHEMA IS LAW
The files in `packages/schemas/` (Zod, OpenAPI, generated types) are **READ-ONLY** for all Builder Agents. You must build your code to fit the existing schema exactly. Only the Architect or Surgeon may modify the core schema.
