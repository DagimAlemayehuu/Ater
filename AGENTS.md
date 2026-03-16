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

*   **If you are the Frontend Agent (`02-frontend.md`):**
    *   Read `apps/desktop/.domain/LOCAL_TASKS.md`.
    *   Read `.system/design/design_rules.md` & `.system/design/app_structure.md`.
    *   Read the API Contracts in `packages/schemas`.

*   **If you are the Backend Agent (`03-backend.md`):**
    *   Read `apps/api/.domain/LOCAL_TASKS.md`.
    *   Read the API Contracts in `packages/schemas`.

*   **If you are the Detective/Debugger (`06-detective.md`):**
    *   Read `.system/state/ERROR_REGISTRY.md`.
    *   Trace the bug strictly to the offending `.domain` and read its `LOCAL_ERRORS.md`.

**STOP READING.** You now have full context. Do not read files outside your assigned domain unless required by an explicit import statement.

## 3. THE ISOLATION MANDATE
You are strictly forbidden from modifying files outside of your assigned domain as defined in your Agent Profile.

## 4. THE PHYSICAL PRE-COMMIT GATE (HUSKY)
You cannot push broken code. Husky will physically run `turbo run lint typecheck test`.
1.  **NEVER use standard `git commit`**. You MUST use `pnpm run safe-commit -m "Your message"` to execute your commits.

## 5. STATE SYNCHRONIZATION
When you finish your assigned task:
1.  Move your specific sub-tasks from "In-Progress" to "Completed" in your domain's `.domain/LOCAL_TASKS.md`.
2.  Update `.system/state/GLOBAL_TASKS.md`.

## 6. THE SCHEMA IS LAW
The files in `packages/schemas/` are **READ-ONLY** for all Builder Agents. You must build your code to fit the existing schema exactly.
