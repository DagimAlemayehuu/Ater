# Active Global Skills Catalog

> Master indexing directory of all 58 globally registered agent skills.

This file serves as the definitive reference manual for your coding agent. At the start of a session, scan this document to discover the available knowledge domains, workflows, and trigger prompts.

---

## 🛠️ Unified Skill Categories

### 1. Spec-Driven Planning & Changes (OpenSpec)

Used to manage, explore, check, and track technical design specs and checklists natively inside your project.

| Skill | Trigger Keywords / Purpose |
| :--- | :--- |
| **`openspec-propose`** | *Trigger*: `/opsx:propose`, "propose change", "scaffold specs" <br> *Purpose*: Creates `proposal.md`, `design.md`, and `tasks.md` in one step. |
| **`openspec-apply-change`** | *Trigger*: `/opsx:apply`, "apply change", "implement checklist" <br> *Purpose*: Automates step-by-step task checklist implementation. |
| **`openspec-explore`** | *Trigger*: `/opsx:explore`, "explore idea", "investigate problem" <br> *Purpose*: Acts as a Socratic thinking partner to clarify requirements. |
| **`openspec-verify-change`** | *Trigger*: `/opsx:verify`, "verify changes", "run verification" <br> *Purpose*: Runs full validations and tests before archiving features. |
| **`openspec-archive-change`** | *Trigger*: `/opsx:archive`, "archive change" <br> *Purpose*: Archives finished features to `openspec/changes/archive/` to keep context clean. |
| **`openspec-new-change`** | *Trigger*: `/opsx:new`, "new change", "start planning" <br> *Purpose*: Scaffolds a new change package. |
| **`openspec-continue-change`** | *Trigger*: `/opsx:continue`, "continue change", "next artifact" <br> *Purpose*: Drives step-by-step progress on active specs. |
| **`openspec-sync-specs`** | *Trigger*: `/opsx:sync`, "sync specs" <br> *Purpose*: Syncs active changes directly into main codebase specifications. |
| **`openspec-bulk-archive-change`**| *Trigger*: `/opsx:bulk-archive` <br> *Purpose*: Archives multiple changes at once. |
| **`openspec-onboard`** | *Trigger*: `/opsx:onboard` <br> *Purpose*: Narrative walkthrough of spec-driven methodologies. |

---

### 2. High-Density UI & Visual Aesthetics (Impeccable)

Loaded during layout modifications, UI audits, and component creation to prevent "AI design slop" and apply premium visual heuristics.

| Skill | Trigger Keywords / Purpose |
| :--- | :--- |
| **`impeccable`** | *Trigger*: `/impeccable`, "polish UI", "design audit", "critique styling" <br> *Purpose*: 23 visual commands enforcing de-warmed tints, academic typography, and high-density spacing. |
| **`/impeccable critique`**| *Trigger*: "UX critique", "review layout", "scored feedback" <br> *Purpose*: Full hierarchy, clarity, and structural resonance review. |
| **`/impeccable audit`** | *Trigger*: "accessibility check", "performance review", "responsive check" <br> *Purpose*: Evaluates layout, accessibility tokens, and Core Web Vitals. |
| **`/impeccable polish`**| *Trigger*: "pre-ship audit", "visual cleanup", "align tokens" <br> *Purpose*: Final pre-shipping style system checks. |
| **`/impeccable shape`** | *Trigger*: "shape layout", "plan UX", "wireframe" <br> *Purpose*: Plans visual hierarchies before coding. |
| **`/impeccable live`** | *Trigger*: "live mode", "visual variant mode" <br> *Purpose*: Direct, interactive element variants within local browser instances. |

---

### 3. Google Stitch Integration & Scaffolding (Stitch-Skills)

Provides tight, deep bindings to Google Stitch workspaces, design systems, and components.

| Skill | Trigger Keywords / Purpose |
| :--- | :--- |
| **`code-to-design`** | *Trigger*: "upload code to stitch", "migrate codebase to design" <br> *Purpose*: Chants HTML extraction, design token analysis, and uploader. |
| **`generate-design`** | *Trigger*: "make screen", "edit screen in stitch", "generate variant" <br> *Purpose*: Edits design layers and variant structures in Stitch MCP. |
| **`react-components`**| *Trigger*: "convert design to react", "stitch components" <br> *Purpose*: Generates modular React + Vite code with AST syntax checks. |
| **`extract-design-md`**| *Trigger*: "scan design system", "extract DESIGN.md" <br> *Purpose*: Reverse-engineers visual language into standard layout tokens. |
| **`extract-static-html`**| *Trigger*: "static html snapshot", "inline css assets" <br> *Purpose*: Extracts running web-app views into individual static sheets. |
| **`upload-to-stitch`**| *Trigger*: "upload html", "upload assets to stitch" <br> *Purpose*: High-reliability file uploader bypass. |
| **`remotion`** | *Trigger*: "walkthrough video", "generate remotion video" <br> *Purpose*: Spawns camera-zooming tour videos of Stitch designs. |
| **`design-md`** | *Trigger*: "generate DESIGN.md", "analyze design tokens" <br> *Purpose*: Generates rich visual manuals from screen maps. |
| **`enhance-prompt`** | *Trigger*: "enhance UI prompt", "optimize stitch prompt" <br> *Purpose*: Optimizes prompts with industry-grade UX keywords. |
| **`stitch-loop`** | *Trigger*: "build site", "multi-page stitch website" <br> *Purpose*: Generates complete websites with automated validator loops. |
| **`taste-design`** | *Trigger*: "taste design system", "anti-generic visual rules" <br> *Purpose*: Enforces custom typographic scales and color calibrations. |
| **`shadcn-ui`** | *Trigger*: "setup shadcn UI", "build table component" <br> *Purpose*: Flawless component discovery and assembly. |

---

### 4. Technical Rigor & Quality Control (Superpowers)

Implements robust branch sandboxing, test-first architectures, and multi-perspective code reviews.

| Skill | Trigger Keywords / Purpose |
| :--- | :--- |
| **`test-driven-development`** | *Trigger*: "red-green-refactor", "tdd workflow", "write tests first" <br> *Purpose*: Enforces strict RED-GREEN-REFACTOR cycles. Deletes code written before tests. |
| **`using-git-worktrees`** | *Trigger*: "isolate feature", "sandboxed branch" <br> *Purpose*: Creates git worktrees to insulate changes from master. |
| **`writing-plans`** | *Trigger*: "write checklist", "2-minute task plan" <br> *Purpose*: Breaks features into bite-sized tasks with exact paths. |
| **`executing-plans`**| *Trigger*: "execute checklist", "batch tasks" <br> *Purpose*: Systematic progress checks with checkpoint reviews. |
| **`dispatching-parallel-agents`**| *Trigger*: "parallel subagents", "dispatch tasks" <br> *Purpose*: Concurrent task processing. |
| **`subagent-driven-development`**| *Trigger*: "subagent task coordination" <br> *Purpose*: Spawns subagents with two-stage reviews (spec then quality). |
| **`systematic-debugging`** | *Trigger*: "systematic debug", "reproduce issue" <br> *Purpose*: 4-phase root cause discovery cycle. |
| **`verification-before-completion`**| *Trigger*: "verify fix", "evidence over assertion" <br> *Purpose*: Enforces terminal validation checks to prevent false success claims. |
| **`requesting-code-review`** | *Trigger*: "pre-review checklist", "code review audit" <br> *Purpose*: Pre-review severity gates. |
| **`receiving-code-review`** | *Trigger*: "review feedback", "incorporate review" <br> <br> *Purpose*: Rigorous technical revision. |
| **`finishing-a-development-branch`**| *Trigger*: "merge branch", "create PR" <br> *Purpose*: Merges branches, files cleanups, and closes sandboxes. |
| **`using-superpowers`**| *Trigger*: "superpowers instructions" <br> *Purpose*: Introduction guidelines to the superpower states. |
| **`writing-skills`**| *Trigger*: "build skill", "write skill guidelines" <br> *Purpose*: Guidelines for writing custom agent skills. |

---

### 5. Developer Workspace Utilities (Pocock-Skills)

Enhances local ticket management, dependency source exploring, and codebase refactoring.

| Skill | Trigger Keywords / Purpose |
| :--- | :--- |
| **`opensrc`** | *Trigger*: "fetch source of package", "read library code", "opensrc path" <br> *Purpose*: Natively downloads and grep-searches the actual source of any dependency. |
| **`diagnose`** | *Trigger*: "reproduce bug", "debug loop" <br> *Purpose*: Minimal reproduction debugger. |
| **`triage`** | *Trigger*: "triage issue", "issue label machine" <br> *Purpose*: Triage issue evaluation state manager. |
| **`improve-codebase-architecture`**| *Trigger*: "improve architecture", "decouple code" <br> *Purpose*: Audits modularity and architectural boundaries. |
| **`to-issues`** | *Trigger*: "vertical slicing", "create markdown issues" <br> *Purpose*: Slices plans into bite-sized, independently-grabbable issues. |
| **`to-prd`** | *Trigger*: "synthesize PRD", "write PRD from chat" <br> *Purpose*: Turns conversational states into a formal PRD. |
| **`zoom-out`** | *Trigger*: "explain codebase", "zoom-out view" <br> *Purpose*: High-level architectural maps of unfamiliar scopes. |
| **`caveman`** | *Trigger*: "caveman mode", "brief prose" <br> *Purpose*: Compresses token spending by dropping fluff text. |
| **`grill-me`** | *Trigger*: "grill me", "challenge plan" <br> *Purpose*: Socratic interview to stress-test designs. |
| **`grill-with-docs`**| *Trigger*: "grill with glossary", "check ADRs" <br> *Purpose*: Socratic review against local `CONTEXT.md` and ADR decisions. |
| **`setup-matt-pocock-skills`**| *Trigger*: "configure local skills" <br> *Purpose*: Configures issue trackers and labels inside `AGENTS.md`. |
| **`setup-pre-commit`**| *Trigger*: "husky config", "setup git lint hooks" <br> *Purpose*: Local pre-commit lint and test checkers. |
| **`scaffold-exercises`**| *Trigger*: "scaffold CS exercise" <br> *Purpose*: Structured learning templates. |
| **`migrate-to-shoehorn`**| *Trigger*: "shoehorn types", "refactor test assertions" <br> *Purpose*: Automated type-safety test refactor. |
