# Ater (አተር)

> A voice-guided Personal Cognitive Learning Engine and Adaptive Socratic Tutor built to eliminate the illusion of competence.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed-green)](https://vitest.dev/)

---

## The Problem: The Illusion of Competence

In modern learning, reading summaries, watching video lectures, or chatting with generic AI bots gives learners a false sensation of understanding. Because information is easy to consume, learners assume they have mastered the material—until they are asked to solve problems or explain mechanisms independently.

## The Solution: Active Socratic Mastery

Ater replaces passive content consumption with verifiable active mastery:

1. **Personalized Diagnostic Intake:** Ingests any learning topic or dense academic PDF and generates 4–7 open-ended diagnostic questions assessing baseline depth, `coreConcepts`, and `misconceptions`.
2. **Living Curriculum Roadmap DAG:** Scaffolds an atomic, sequenced roadmap of conceptual primitives—strictly one primitive per lesson to prevent cognitive overload.
3. **5-Section Dynamic Notes:** Generates structured pedagogical notes that strictly enforce the **Zero-Bullet Invariant** on foundational concepts, requiring continuous prose explanations.
4. **Midway Socratic Checkpoints:** Interrogates learners midway through lessons with interactive MCQs, matching pairs, and fill-in-the-blank questions that dynamically mutate notes.
5. **Oral Socratic Feynman Gate:** Challenges learners to explain core concepts simply in spoken audio or text without using 2 forbidden domain **taboo words**.
6. **Adaptive Remediation:** If a misconception is exposed during sparring, the engine dynamically splices a targeted remediation sub-lesson into the curriculum roadmap.
7. **Bilingual Engine:** Full localized support for both English and Amharic Ge'ez script.

---

## Documentation Index

All architecture, database, design, and workflow documentation is centrally maintained in the [`docs/`](./docs) folder:

| Document | Description |
| :--- | :--- |
| **[`docs/README.md`](./docs/README.md)** | Engineering hub overview and immutable system invariants. |
| **[`docs/ONBOARDING.md`](./docs/ONBOARDING.md)** | 5-minute setup guide for collaborators and developers. |
| **[`docs/WORKFLOW.md`](./docs/WORKFLOW.md)** | Git branching rules, PR templates, and test verification gates. |
| **[`docs/PRD.md`](./docs/PRD.md)** | Core product requirements, pedagogical blueprint, and feature scope. |
| **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** | System topology, Next.js routes, component tree, and audio pipelines. |
| **[`docs/DATABASE.md`](./docs/DATABASE.md)** | Supabase PostgreSQL schema, RLS policies, and sync store mechanics. |
| **[`docs/DESIGN.md`](./docs/DESIGN.md)** | Parchment Light and Zinc Dark palette tokens, typography, and UI standards. |
| **[`docs/ROADMAP.md`](./docs/ROADMAP.md)** | Sprints, completed MVP milestone, and active collaborator backlogs. |
| **[`docs/SCHOLARXIV_RESEARCH.md`](./docs/SCHOLARXIV_RESEARCH.md)** | STARK Rule 1 compliance: Curated paper citations and theoretical foundation. |
| **[`docs/STATE.md`](./docs/STATE.md)** | Empirical verification telemetry and session continuity ledger. |

---

## Quickstart

### Prerequisites
- Node.js `v20.x` or later
- pnpm `v9.x` or later (`corepack enable && corepack prepare pnpm@latest --activate`)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone git@github.com:DagimAlemayehuu/Ater.git
   cd Ater
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   # Fill in GEMINI_API_KEY and Supabase credentials
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) for the public landing page, or [http://localhost:3000/app](http://localhost:3000/app) for the learning studio.

---

## Core Engineering Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts local Next.js development server on port 3000. |
| `pnpm test` | Runs the full Vitest suite in single-run mode. |
| `pnpm test:watch` | Runs Vitest in interactive watch mode for TDD. |
| `pnpm build` | Compiles optimized production build across all routes. |
| `pnpm start` | Serves compiled production build locally. |

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Design Tokens:** Parchment Light (`#faf8f5`) & Zinc Dark (`#09090b`)
- **Backend / Database:** Supabase (PostgreSQL with Row-Level Security), `@supabase/ssr`
- **AI Pedagogical Engine:** Google Gemini 3.5 Flash Lite
- **Audio Pipelines:** Edge Neural TTS (`en-US-JennyNeural`), Web Audio API RMS VAD, Gemini Multimodal Speech Transcription
- **Test Suite:** Vitest, Testing Library, JSDOM
