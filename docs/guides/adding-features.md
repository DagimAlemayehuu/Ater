# Adding Features — Step-by-Step Guide

Common development tasks and how to implement them in Life OS.

---

## Adding a New Route (Frontend Page)

1. **Create the route component:**
   ```
   apps/desktop/src/routes/my-feature.tsx
   ```

2. **Add the route to `App.tsx`:**
   ```tsx
   <Route path="/my-feature" element={<MyFeature />} />
   ```
   Place it inside the `<AuthenticatedLayout>` wrapper for sidebar support.

3. **Add sidebar navigation:**
   Edit `apps/desktop/src/components/layout/data/sidebar-data.ts` to add the nav item.

4. **Update docs:**
   - Add the route to `docs/architecture/frontend.md` route table
   - Update `docs/tracking/changelog.md`
   - Update `docs/tracking/project-state.md`

---

## Adding a New API Endpoint

### Quick endpoint in `main.py`

1. Add the endpoint directly to `apps/api/src/api/main.py`:
   ```python
   @app.get("/api/my-endpoint")
   async def my_endpoint(secrets: AppSecrets = Depends(get_app_secrets)):
       # Implementation
       return {"result": "..."}
   ```

### Domain-scoped endpoint (recommended for complex features)

1. **Create or extend a domain module:**
   ```
   apps/api/src/domains/my_domain/
   ├── __init__.py
   ├── router.py      # FastAPI APIRouter
   └── service.py     # Business logic
   ```

2. **Define the router:**
   ```python
   from fastapi import APIRouter
   router = APIRouter(prefix="/my-domain", tags=["my-domain"])

   @router.get("/data")
   async def get_data():
       return {"data": "..."}
   ```

3. **Mount in `main.py`:**
   ```python
   from src.domains.my_domain.router import router as my_domain_router
   app.include_router(my_domain_router, prefix="/api")
   ```

4. **Add frontend API method in `sidecarApi.ts`:**
   ```typescript
   async getMyData() {
     const headers = await getAuthHeaders();
     const res = await fetch(`${SIDECAR_URL}/api/my-domain/data`, { headers });
     return res.json();
   }
   ```

5. **Update docs:**
   - Add to `docs/api/endpoints.md`
   - Add to `docs/architecture/backend.md`
   - Update `docs/tracking/changelog.md`

---

## Adding a New AI Persona

### Via The Creator (in-app)

1. Go to `/strategist` and switch to "The Creator" persona
2. Chat with The Creator to define the persona's role, expertise, and system prompt
3. The Creator outputs a `<PERSONA_COMMIT>` JSON block
4. Navigate to `/settings` → Personas → Import from clipboard

### Via Settings (manual)

1. Go to `/settings` → Personas tab
2. Click "Add Persona"
3. Fill in: name, description, icon (emoji), system prompt, tuning sliders
4. Save — stored in Tauri Plugin Store

### Programmatically

```typescript
const { addPersona } = useConfig();
addPersona({
  id: crypto.randomUUID(),
  name: "My Persona",
  description: "...",
  icon: "🎯",
  systemPrompt: "You are ...",
  settings: { temperature: 0.7, creativity: 50, formality: 50 }
});
```

---

## Adding a New Notion Database Integration

1. **Get the database ID** from Notion (share link → extract UUID)

2. **Create a service in the backend:**
   ```python
   from src.domains.notion.client import NotionClient

   class MyService:
       def __init__(self, notion_key: str):
           self.client = NotionClient(notion_key)

       async def get_data(self):
           results = await self.client.query_database("YOUR_DB_ID")
           # Process results...
           return processed_data
   ```

3. **Create an endpoint** to expose the data

4. **Call from frontend** via `sidecarApi.ts`

---

## Modifying OKA System Prompts

The OKA system instruction is split across two locations:

1. **TypeScript constants** (`apps/desktop/src/lib/oka_defaults.ts`):
   - `OKA_PART_A` and `OKA_PART_B` — sent from frontend to backend

2. **OKA Settings** (SQLite database):
   - `system_instruction_part_a` and `system_instruction_part_b`
   - Synced from frontend on settings load

3. **Source of truth** (`docs/prompts/oka.md`):
   - The master prompt document (~164KB)
   - Edit this, then re-export to TypeScript constants

---

## General Workflow

1. **Read** the relevant architecture docs before starting
2. **Implement** the feature (backend first, then frontend)
3. **Test** locally with `pnpm dev:all`
4. **Verify** `pnpm typecheck` passes
5. **Update docs** (changelog, project state, backlog, architecture/API docs as needed)
6. **Commit** with a descriptive message
