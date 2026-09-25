# Engineering Roadmap & Sprint Backlog

This document tracks completed milestones, active sprint goals, and collaborator work assignments for the **STARK Official Hackathon**.

---

## 1. Hackathon Timeline & Milestone Overview

- **Official Kickoff:** Monday, September 14, 2026
- **Sprint 1 (MVP Baseline Complete):** September 14 – September 25, 2026 [COMPLETED]
- **Sprint 2 (Voice & Research Integration):** September 26 – October 02, 2026 [ACTIVE]
- **Sprint 3 (Payments & Platform Hardening):** October 03 – October 08, 2026 [PLANNED]
- **Final Submission Deadline:** Friday, October 09, 2026, 09:00 UTC
- **Winner Ceremony:** Sunday, October 11, 2026 at ALX Ethiopia

---

## 2. Sprint 1: MVP Core Learning Engine (COMPLETED)

*Milestone merged into `main` at commit `791228b` with 12 passing test suites (81/81 tests) and verified Vercel production deployment.*

- [x] **Dual Intake Engine:** Prompt and PDF ingestion generating 4–7 personalized diagnostic questions (`coreConcepts`, `misconceptions`).
- [x] **Living Curriculum Roadmap DAG:** Dynamic course generation with atomic conceptual nodes and status badges.
- [x] **Dynamic 5-Section Notes:** Strict **Zero-Bullet Invariant** enforced across foundational conceptual sections.
- [x] **Midway Socratic Checkpoints:** Embedded interactive questions (MCQ, Matching, Blank, Short Answer) with note mutation.
- [x] **Oral Socratic Feynman Gate:** Voice and written sparring evaluation with 2 forbidden taboo words and score threshold.
- [x] **Multi-Tenant Supabase Auth:** User-scoped caching (`ater_courses_${uid}`), database RLS, and `ProfileMenu` controls.
- [x] **Bilingual Support:** Full English and Amharic Ge'ez script localized generation and voice transcription.
- [x] **Feature Flags:** Modular flags configured in `lib/config/features.ts`.

---

## 3. Sprint 2: Voice, Research & Deployment (ACTIVE SPRINT)

*Target Completion: October 02, 2026*

### Track A: Voxide Voice Engine (Rule 2 Compliance)
- [ ] Implement Voxide WebRTC / WebSocket streaming client for sub-400ms conversational turnarounds.
- [ ] Integrate local voice recognition for Amharic and Oromiffa spoken inputs.
- [ ] Add voice-driven hands-free navigation in NoteCanvas.
- **Lead:** Audio & Voice Lead

### Track B: Scholarxiv Research Grounding (Rule 1 Compliance)
- [ ] Connect Scholarxiv live collection API (`6aa6d22cf0b42983a063820b`).
- [ ] Extract empirical citations from curated papers and inject relevant excerpts into lesson notes.
- [ ] Add automated paper cross-referencing in active study sessions.
- **Lead:** Research & Core AI Lead

### Track C: Local Hosting on EthioDeploy (Rule 3 Compliance)
- [ ] Author Dockerfile and deployment pipeline for EthioDeploy (`ethiodeploy.com`).
- [ ] Verify low-latency routing and regional CDN caching within Ethiopia.
- **Lead:** Infrastructure Lead

---

## 4. Sprint 3: Payments, PWA & Polish (PLANNED)

*Target Completion: October 08, 2026*

- [ ] **Links.et Payment Integration (Rule 5 Compliance):** Add Ethiopian Birr (ETB) subscription flow via Links.et (`v.odit.et`).
- [ ] **Offline PWA Support:** Service worker asset caching and background IndexedDB replication.
- [ ] **End-to-End Rehearsal:** Full demo script rehearsal for judges at ALX Ethiopia.
- [ ] **Public Video Walkthrough:** 3-minute production video demonstrating voice sparring and dynamic note mutations.
