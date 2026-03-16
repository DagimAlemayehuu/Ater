# Frontend Architecture

**Location:** `apps/desktop/`
**Package:** `@life-os/desktop`
**Entry:** `src/main.tsx` → `src/App.tsx`

## Provider Hierarchy

```
<ThemeProvider>           # Dark/light mode
  <OkaProvider>           # OKA subsystem state
    <ConfigProvider>      # Tauri Store config (API keys, profiles, personas)
      <SidecarGate>       # Blocks until Python sidecar is connected
        <BrowserRouter>
          <ConfigGate>    # Forces /onboarding if keys missing
            <Routes />
          </ConfigGate>
        </BrowserRouter>
      </SidecarGate>
    </ConfigProvider>
  </OkaProvider>
</ThemeProvider>
```

## Routes

| Route | Component File | Description |
|---|---|---|
| `/onboarding` | `routes/onboarding.tsx` (9KB) | First-run setup: API keys, vault path |
| `/dashboard` | `routes/dashboard.tsx` (17KB) | Macro overview: live metrics, active missions, academic alerts, system health |
| `/strategist` | `routes/strategist.tsx` (116KB) | Multi-persona AI chat (Strategist, Creator, custom). Largest component. |
| `/chat` | `routes/chat.tsx` (26KB) | General-purpose AI chat interface |
| `/goals` | `routes/goals.tsx` (33KB) | Goal CRUD via Notion (create, edit, delete, mark complete) |
| `/notion` | `routes/notion.tsx` (14KB) | Notion workspace browser (pages, databases) |
| `/obsidian` | `routes/obsidian.tsx` (15KB) | Obsidian vault file browser and reader |
| `/oka` | `routes/oka.tsx` (47KB) | OKA Knowledge Architect: ingest → plan → generate → deploy |
| `/academics` | `routes/academics.tsx` (49KB) | Academic dashboard: semesters, courses, exams, assignments, unit tracking |
| `/settings` | `routes/settings.tsx` (43KB) | Full app config: keys, profiles, persona management, model selection |
| `/debugger` | Placeholder in App.tsx | Future: RAG-based problem solver |

## Core Modules

### `lib/sidecarApi.ts`
Single HTTP client for ALL Python sidecar communication. Key behaviors:
- Reads auth headers from Tauri Store via `getAuthHeaders()`
- Injects `X-Notion-Key`, `X-Gemini-Key`, `X-Gemini-Model`, `X-Vault-Path` on every request
- Base URL: `http://127.0.0.1:8765`
- Exports a `sidecarApi` object with typed methods for every backend endpoint

### `lib/ConfigContext.tsx`
React Context wrapping Tauri Plugin Store. Manages:
- API keys (Notion, Gemini, model selection)
- Obsidian vault path
- User profiles (personal, academic, financial, fitness, master plan)
- System prompts (strategist, creator)
- Custom personas (CRUD operations)
- `isConfigured` flag: `true` when all three keys are present

### `lib/OkaContext.tsx`
OKA-specific state management for the Knowledge Architect workflow.

### `lib/oka_defaults.ts`
Contains `OKA_PART_A` and `OKA_PART_B` — the default OKA system instruction split into two escaped string constants (~166KB).

## Layout Architecture

Uses the `shadcn-admin` pattern:
- **Shell** (`components/layout/Shell.tsx`) — Main layout wrapper
- **Sidebar** (`components/layout/app-sidebar.tsx`) — Persistent left navigation, collapsible
- **Header** (`components/layout/header.tsx`) — Breadcrumbs, theme toggle, user dropdown
- **Main** (`components/layout/main.tsx`) — Content area renders active route
- **NavGroup** (`components/layout/nav-group.tsx`) — Sidebar navigation groups with collapsible sections

## Component Library

30 shadcn/ui components in `components/ui/`:

`alert-dialog, alert, avatar, badge, button, calendar, card, checkbox, collapsible, command, dialog, dropdown-menu, form, input-otp, input, label, popover, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, switch, table, tabs, textarea, tooltip`

## Templates

Default markdown files bundled via Vite `?raw` imports:

**Profiles** (`templates/profiles/`):
- `personal.md`, `academic.md`, `financial.md`, `fitness.md`, `master_plan.md`

**System Prompts** (`templates/system-prompts/`):
- `strategist.md`, `creator.md`

These serve as defaults when the Tauri Store has no saved user content.
