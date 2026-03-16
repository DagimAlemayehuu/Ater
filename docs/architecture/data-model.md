# Data Model

## 1. Tauri Plugin Store (`life-os-config.json`)

Primary configuration store — encrypted, local-only.

| Key | Type | Default | Purpose |
|---|---|---|---|
| `notionApiKey` | string | `""` | Notion integration token |
| `geminiApiKey` | string | `""` | Google Gemini API key |
| `geminiModel` | string | `"gemini-2.5-flash"` | Selected Gemini model |
| `obsidianVaultPath` | string | `""` | Absolute path to Obsidian vault |
| `profilePersonal` | string | (template) | Personal profile markdown |
| `profileAcademic` | string | (template) | Academic profile markdown |
| `profileFinancial` | string | (template) | Financial profile markdown |
| `profileFitness` | string | (template) | Fitness profile markdown |
| `profileMasterPlan` | string | (template) | Master Plan markdown |
| `strategistPrompt` | string | (template) | Custom Strategist system prompt |
| `creatorPrompt` | string | (template) | Custom Creator system prompt |
| `customPersonas` | array | `[]` | User-created AI personas |

### Custom Persona Shape

```typescript
{
  id: string;           // UUID
  name: string;         // Display name
  description: string;  // Short description
  icon: string;         // Emoji or icon string
  systemPrompt: string; // Full system instruction
  settings: {
    temperature: number;   // 0-2
    creativity: number;    // slider value
    formality: number;     // slider value
  }
}
```

## 2. Notion Databases

IDs referenced in code:

| Constant | Database ID | Location | Purpose |
|---|---|---|---|
| `GOALS_DB_ID` | `2a9219ed-7519-815f-ac0f-ebfcd1dcd003` | `domains/ai/strategist.py` | Goals tracker |
| Academics DBs | (configured in AcademicsService) | `domains/academics/service.py` | Semesters, Courses, Study Planner, CRM, Exams, Assignments |

### Goals Database Schema (Notion)

| Property | Type | Values |
|---|---|---|
| `Name` | title | Goal name |
| `Type of Goal` | select | Weekly Goal, Monthly Goal, Quarterly Goal, Yearly Goal, Lifetime Goal |
| `Priority` | select | High, Medium, Low |
| `Completed` | checkbox | boolean |
| `Due Date` | date | YYYY-MM-DD |

## 3. OKA SQLite Database

Local SQLite via SQLAlchemy async + aiosqlite. Database file location: managed by the sidecar process.

### `OkaSettings` Table

| Column | Type | Purpose |
|---|---|---|
| `id` | Integer (PK) | Auto-increment |
| `vault_path` | String | Obsidian vault path (synced from headers) |
| `google_api_key` | String | Gemini key (synced from headers) |
| `selected_model` | String | Model name (synced from headers) |
| `system_instruction_part_a` | Text | First half of OKA system prompt |
| `system_instruction_part_b` | Text | Second half of OKA system prompt |

### `JobQueue` Table

| Column | Type | Purpose |
|---|---|---|
| `id` | Integer (PK) | Auto-increment, used as `job_id` |
| `file_uri` | String | Gemini file URI of uploaded resource |
| `unit_name` | String | Context for generation |
| `batch_id` | Integer | Batch number within the plan |
| `batch_notes` | String | Comma-separated note titles |
| `metadata_json` | Text | JSON metadata from plan |
| `status` | String | `pending` → `processing` → `completed` / `failed` |
| `result_json` | Text | JSON array of generated notes |
| `error_message` | Text | Error details (if failed) |

## 4. Resources Directory

Reference data and templates bundled with the app:

```
resources/
├── prompts/custom prompts/    # User-generated custom prompts (filesystem)
├── reference/                 # Filled example profiles for reference
│   ├── personalprofileexample.md
│   ├── academicprofileexample.md
│   ├── financialprofileexample.md
│   ├── fitnessprofileexample.md
│   ├── masterplanexample.md
│   └── strategistsystempromptexample.md
└── templates/                 # Default templates (blank + filled versions)
    ├── personal_profile.md / _template.md
    ├── academic_profile.md / _template.md
    ├── financial_profile.md / _template.md
    ├── fitness_profile.md / _template.md
    ├── master_plan.md / _template.md
    └── strategist_prompt.md / _template.md
```
