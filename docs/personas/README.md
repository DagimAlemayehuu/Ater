# AI Personas

Life OS supports multiple AI personas, each with custom system prompts and behavioral characteristics. Personas are used primarily in the `/strategist` route.

## Architecture

### Storage
- **Built-in personas** (Strategist, Creator) — System prompts stored in Tauri Plugin Store config and bundled as templates in `apps/desktop/src/templates/system-prompts/`
- **Custom personas** — Stored in Tauri Plugin Store under the `customPersonas` array

### How Personas Are Used
1. User selects a persona in the Strategist view
2. The persona's `systemPrompt` is sent as part of the brainstorm request body
3. Python sidecar passes it to Gemini as `system_instruction`
4. If no system prompt is provided, the Strategist class falls back to a hardcoded default

### Persona Properties
```typescript
{
  id: string;           // UUID
  name: string;         // Display name
  description: string;  // Short description
  icon: string;         // Emoji
  systemPrompt: string; // Full system instruction for Gemini
  settings: {
    temperature: number;
    creativity: number;
    formality: number;
  }
}
```

## Built-in Personas

### 1. The Strategist
- **File:** [strategist.md](strategist.md)
- **Role:** Chief of Staff & Strategic Orchestrator
- **Capabilities:** Direct Notion CRUD via automatic function calling
- **Default model:** `gemini-2.5-flash`

### 2. The Creator
- **File:** [creator.md](creator.md)  
- **Role:** AI Persona Builder
- **Capabilities:** Guided persona design → JSON export via `<PERSONA_COMMIT>` blocks

## Creating New Personas

### Via The Creator
1. Switch to The Creator in the Strategist view
2. Describe the persona you want
3. The Creator outputs a `<PERSONA_COMMIT>` JSON block
4. Import via Settings → Personas

### Via Settings
1. Navigate to `/settings` → Personas tab
2. Click "Add Persona"
3. Define name, description, icon, system prompt, tuning sliders

### Programmatically
Use `ConfigContext`'s `addPersona()` method.

## Prompt Source Files

| Persona | Source Prompt Location |
|---|---|
| Strategist | `apps/desktop/src/templates/system-prompts/strategist.md` |
| Creator | `apps/desktop/src/templates/system-prompts/creator.md` |
| OKA | `docs/prompts/oka.md` (split into Part A/B) |
