# System Architecture & Technical Design: Ater

- **Target AI Model:** Gemini 3.5 Flash Lite
- **Framework:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Database & Auth:** Supabase (`@supabase/ssr`), PostgreSQL with Row-Level Security
- **Audio Engines:** Edge Neural TTS (`node-edge-tts`), Web Audio API RMS VAD
- **Repository:** `DagimAlemayehuu/Ater`

---

## 1. System Topology & Component Layout

```text
+-----------------------------------------------------------------------------------------+
|                                  CLIENT BROWSER LAYER                                   |
|                                                                                         |
|  +---------------------+   +------------------------------------+   +----------------+  |
|  |     LEFT DRAWER     |   |         CENTER STAGE CANVAS        |   | RIGHT ROADMAP  |  |
|  |                     |   |                                    |   |                |  |
|  | - Saved Courses     |   | +--------------------------------+ |   | - Course DAG   |  |
|  | - Session History   |   | |   InlineVoiceCompanion         | |   | - Mastered     |  |
|  | - Intake Trigger    |   | |   (Waveform, VAD, Read Status) | |   | - Active Node  |  |
|  | - ProfileMenu       |   | +--------------------------------+ |   | - Locked Nodes |  |
|  |   (Settings, Auth)  |   | - 5-Section Note Article           |   | - Remediation  |  |
|  |                     |   | - Midway Checkpoint Interrogator   |   |   Sub-Lessons  |  |
|  |                     |   | - Real-time Dynamic Note Mutator   |   |                |  |
|  |                     |   | - Oral Feynman Gate Modal Trigger  |   |                |  |
|  +----------+----------+   +-----------------+------------------+   +-------+--------+  |
|             |                                |                              |           |
|             +--------------------------------+------------------------------+           |
|                                              |                                          |
|                                  +-----------v-----------+                              |
|                                  |   Web Audio VAD Node  |                              |
|                                  | (RMS + Noise Floor)   |                              |
|                                  +-----------+-----------+                              |
+----------------------------------------------|------------------------------------------+
                                               | HTTP (JSON / REST)
                                               v
+-----------------------------------------------------------------------------------------+
|                              NEXT.JS SERVERLESS ROUTE LAYER                             |
|                                                                                         |
|  - /api/ingest/intake          : Analyzes prompt/PDF, generates diagnostic questions    |
|  - /api/curriculum/generate    : Scaffolds Living Roadmap DAG                           |
|  - /api/curriculum/remediate   : Dynamically splices remediation lessons into roadmap   |
|  - /api/ai/compile-note        : Generates 5-section note enforcing Zero-Bullet rule    |
|  - /api/lesson/step            : Evaluates midway checkpoints & mutates note content     |
|  - /api/voice/synthesize       : Edge Neural TTS audio streaming                        |
|  - /api/voice/transcribe       : Multimodal Gemini Ge'ez / English audio transcription  |
|  - /api/voice/converse         : Real-time Socratic voice companion dialogue            |
|  - /api/auth/google/validate   : Server-side Google OAuth token verification            |
+-----------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------+
|                                    PERSISTENCE LAYER                                    |
|                                                                                         |
|  +-------------------------------------+   +-----------------------------------------+  |
|  |       Supabase Cloud Database       |   |          Browser Local Cache            |  |
|  |                                     |   |                                         |  |
|  | - public.ater_courses (RLS enabled) |   | - ater_courses_${uid}                   |  |
|  | - public.ater_lessons (RLS enabled) |   | - ater_notes_${uid}_${courseId}         |  |
|  | - public.ater_notes   (RLS enabled) |   | - Isolated multi-tenant key prefixes    |  |
|  +-------------------------------------+   +-----------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. All 13 Next.js Application Routes

| Route | Type | Description |
| :--- | :--- | :--- |
| `/` | Page | Primary 3-column learning studio (Drawer, NoteCanvas, Roadmap). |
| `/admin` | Page | Admin telemetry dashboard (waitlist analytics, tenant overview). |
| `/auth/callback` | Route Handler | Supabase OAuth and magic link callback redirect handler. |
| `/api/ingest/intake` | API Route | Evaluates topic/PDF inputs and outputs diagnostic interview questions. |
| `/api/curriculum/generate` | API Route | Compiles living roadmap DAG tailored to learner baseline. |
| `/api/curriculum/remediate` | API Route | Splices targeted micro-lessons when misconceptions are detected. |
| `/api/ai/compile-note` | API Route | Produces dynamic 5-section pedagogical notes via Gemini 3.5 Flash Lite. |
| `/api/lesson/step` | API Route | Evaluates active recall checkpoints and applies dynamic mutations. |
| `/api/voice/synthesize` | API Route | Synthesizes streaming audio using Edge Neural TTS (`en-US-JennyNeural`). |
| `/api/voice/transcribe` | API Route | Transcribes spoken audio into English or Amharic Ge'ez script. |
| `/api/voice/converse` | API Route | Handles low-latency Socratic conversational turns. |
| `/api/auth/google/validate` | API Route | Validates Google access tokens and provisions Supabase auth sessions. |
| `/api/demo` | API Route | Lightweight mock intake simulation endpoint. |

---

## 3. Core Architectural Subsystems

### 3.1 Multi-Tenant Storage Scoping (`lib/sync/store.ts`)
To prevent cross-user data leakage on shared machines and verify strict security compliance:
- Every storage transaction prefixes keys with the active Supabase user ID: `ater_courses_${uid}` and `ater_notes_${uid}_${courseId}`.
- If unauthenticated, the store operates in local guest mode under `ater_guest_*` keys.
- Remote persistence syncs transparently with Supabase PostgreSQL tables using Row-Level Security (RLS) policies enforcing `auth.uid() = user_id`.

### 3.2 Single-Speaker Audio Coordinator (`lib/voice/ttsClient.ts`)
To eliminate overlapping audio when multiple UI components trigger playback:
- A monotonic session token invalidator cancels in-flight fetch requests via `AbortController`.
- A singleton `HTMLAudioElement` handles playback, pausing any active track immediately when a new synthesis request begins.

### 3.3 Dynamic Note & Feynman Gate Pipeline (`lib/curriculum/notes.ts`, `lib/ai/gate.ts`)
- **Zero-Bullet Invariant:** The compiler guarantees that Mental Model, First-Principles Mechanism, and Concrete Example sections contain zero list markdown (`*`, `-`, `1.`), requiring flowing prose explanations.
- **Taboo Word Evaluator:** Compares learner defense submissions against 2 banned technical terms, assigning penalties if taboo terms are used in place of conceptual understanding.

### 3.4 Feature Flag Governance (`lib/config/features.ts`)
Non-destructive flags decouple feature release from codebase deployments:
- `ENABLE_ADVANCED_QUESTION_TYPES`: Toggles fill-in-the-blank and matching checkpoints.
- `ENABLE_VOICE_AGENT_COMMANDS`: Controls background continuous voice listeners.
- `ENABLE_DYNAMIC_NOTE_MUTATION`: Controls post-checkpoint dynamic note rewriting.
