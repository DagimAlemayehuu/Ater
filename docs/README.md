# Ater Documentation & Engineering Hub

Welcome to the engineering documentation for **Ater**, an offline-first, voice-guided Personal Cognitive Learning Engine and Adaptive Socratic Tutor built for the STARK Official Hackathon.

All collaborators must treat this directory as the canonical single source of truth for architectural invariants, coding conventions, database schemas, and product milestones.

---

## 1. Documentation Index & Sitemap

| Document | Primary Audience | Purpose & Key Topics |
| :--- | :--- | :--- |
| **[ONBOARDING.md](./ONBOARDING.md)** | New Collaborators | 5-minute setup: Node/pnpm, `.env.local` keys, Supabase credentials, running tests, and local dev server. |
| **[WORKFLOW.md](./WORKFLOW.md)** | All Developers | The strict collaboration contract: branch naming (`feat/*`, `fix/*`), PR requirements, test gates, and code review rules. |
| **[PRD.md](./PRD.md)** | Product & Design | Product vision, learner journeys, pedagogical principles, completed MVP baseline, and upcoming feature specifications. |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | All Developers | Complete system topology, 13 Next.js routes, component hierarchy, Edge Neural TTS, Web Audio VAD, and tenant isolation. |
| **[DATABASE.md](./DATABASE.md)** | Backend / Full-Stack | Supabase schema contracts, `public.ater_*` tables, Row-Level Security (RLS) policies, and hybrid storage sync. |
| **[DESIGN.md](./DESIGN.md)** | Frontend Developers | Design tokens: Parchment Light palette (`#faf8f5`, cream cards, charcoal text), dark zinc mode, typography, and component states. |
| **[ROADMAP.md](./ROADMAP.md)** | All Collaborators | Sprints, completed MVP milestone (Sprint 1), upcoming Sprint 2/3 backlogs, and collaborator task assignments. |
| **[SCHOLARXIV_RESEARCH.md](./SCHOLARXIV_RESEARCH.md)** | Research / Judges | STARK Hackathon Rule 1 compliance: Master collection, 6 foundational academic citations, and learning theory grounding. |
| **[STATE.md](./STATE.md)** | Lead Architect | Empirical system verification ledger, test pass telemetry, and session continuity history. |

---

## 2. Core Invariants (Do Not Break)

1. **Zero-Bullet Invariant:** Foundational conceptual sections in lesson notes (Mental Model, Mechanism, Concrete Real-World Example) must strictly be written in continuous, paragraph-form prose. Bulleted lists are forbidden in foundational sections to prevent shallow skimming.
2. **Tenant Isolation Invariant:** All persistent user data (courses, notes, sessions) must be scoped by user identity in `lib/sync/store.ts` (`ater_courses_${uid}`, `ater_notes_${uid}_*`) and protected by Supabase RLS.
3. **Single-Speaker Audio Coordinator:** Concurrent audio streams are strictly prohibited. Speech synthesis requests across the reader, companion, and gate must route through the monotonic session token invalidator in `lib/voice/ttsClient.ts`.
4. **Fail-First Testing:** Every new feature or bugfix must ship with automated Vitest tests. Never merge code without running `pnpm test` and `pnpm build`.
5. **No Direct Pushes to `main`:** All code changes must enter `main` exclusively through Pull Requests with passing CI checks.
