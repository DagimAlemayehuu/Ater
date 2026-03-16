# Code Conventions

## Iron Laws (Immutable)

1. **No hardcoded secrets.** Keys flow ONLY via HTTP headers from frontend to backend.
2. **Local first.** Obsidian operations are purely filesystem-based; no cloud sync for notes.
3. **Pydantic discipline.** All API responses must be typed and validated via Pydantic.
4. **Clean exit.** The Python sidecar must terminate immediately on Tauri window close.
5. **No placeholders.** UI uses real data or clear loading states; never static mock text.
6. **Premium aesthetic.** All views follow the monochromatic shadcn-admin design language.
7. **Read before write.** Always check existing code before modifying. Never assume patterns.
8. **Compiler verification.** Every change must pass `pnpm typecheck` / `pnpm lint`.

## Package Managers

| Language | Manager | Forbidden |
|---|---|---|
| JavaScript/TypeScript | **pnpm** (strict mode) | npm, yarn |
| Python | **uv** (Astral) | pip, pipenv, poetry |

## Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React component | `kebab-case.tsx` | `app-sidebar.tsx` |
| React route | `kebab-case.tsx` | `dashboard.tsx` |
| TypeScript module | `camelCase.ts` | `sidecarApi.ts` |
| Python module | `snake_case.py` | `gemini_service.py` |
| Documentation | `kebab-case.md` | `project-state.md` |

### Code

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `SidecarGate` |
| React hook | camelCase with `use` prefix | `useConfig` |
| TypeScript function | camelCase | `getAuthHeaders` |
| TypeScript constant | UPPER_SNAKE | `SIDECAR_URL` |
| Python class | PascalCase | `NotionClient` |
| Python function | snake_case | `list_notion_goals` |
| Python constant | UPPER_SNAKE | `GOALS_DB_ID` |
| API endpoint path | kebab-case | `/api/oka/generate-plan` |

## Frontend Conventions

### Component Structure

- Route components live in `src/routes/`
- Reusable components live in `src/components/`
- shadcn/ui primitives live in `src/components/ui/`
- Layout components live in `src/components/layout/`

### State Management

- **Tauri Store** — Persistent config (API keys, profiles, personas)
- **React Context** — Global state (config, theme, OKA)
- **Local state** — Component-level `useState` / `useReducer`
- **Avoid** Zustand for new features unless there's a strong reason

### API Calls

- All sidecar communication goes through `lib/sidecarApi.ts`
- Never call `fetch()` directly to the sidecar
- Auth headers are injected automatically by `getAuthHeaders()`

## Backend Conventions

### Endpoint Patterns

- All endpoints prefixed with `/api/`
- Domain-specific routes managed by their own `router.py` files
- Use FastAPI `Depends(get_app_secrets)` for secret injection
- Return Pydantic-validated responses

### Async

- All Notion/Gemini operations must be `async`
- Use `httpx.AsyncClient` for HTTP calls (not `requests`)
- Heavy work goes through the OKA background worker pattern

### Error Handling

- Use specific exception types (not bare `Exception`)
- Return structured error responses with HTTP status codes
- Log errors with context using print statements prefixed with `[Life OS Sidecar]`

## Git Conventions

- Commit messages should be descriptive and reference the feature/fix
- Feature branches encouraged for multi-step work
- Always run `pnpm typecheck` before committing

## Documentation Protocol

After completing any feature or fix:
1. Update `docs/tracking/changelog.md`
2. Update `docs/tracking/project-state.md`
3. Update `docs/tracking/backlog.md` if applicable
4. Update architecture/API docs if structure changed
