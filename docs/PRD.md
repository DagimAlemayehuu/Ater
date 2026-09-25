# Product Requirement Document (PRD): Ater Cognitive Learning Engine

- **Product Name:** Ater
- **Status:** APPROVED (Post-Kickoff MVP Complete)
- **Target Event:** STARK Official Hackathon (Cognitive Learning Track)
- **Repository:** `DagimAlemayehuu/Ater`
- **Target Model:** Gemini 3.5 Flash Lite
- **Deployment Platform:** Vercel (Production Sandbox) & EthioDeploy

---

## 1. Executive Summary & Vision

Ater is an offline-first, voice-guided **Personal Cognitive Learning Engine and Adaptive Socratic Tutor**. It rejects the prevailing paradigm of passive literature search tools (arXiv scrapers, generic chatbots, and unread PDF dumpers) in favor of **verifiable active mastery**.

Rather than letting learners passively skim notes or nod along with AI responses, Ater forces cognitive engagement:
1. It ingests an unstructured learning topic or dense academic document (PDF, syllabus, paper).
2. It conducts an open-ended **Socratic Discovery Interview** to extract `coreConcepts` and `misconceptions`, accurately calibrating learner baseline knowledge.
3. It scaffolds an atomic **Living Curriculum Roadmap DAG** (one conceptual primitive per lesson; strictly no monolithic cognitive overload).
4. In the active lesson canvas, it presents a **5-Section Dynamic Pedagogical Note** enforcing the strict **Zero-Bullet Invariant** on foundational concepts to demand genuine narrative comprehension.
5. It pauses midway with **Interactive Checkpoints** to verify baseline recall.
6. It enforces comprehension through an oral or written **Socratic Feynman Gate**, where the learner must explain the concept simply without using forbidden domain taboo words.
7. If the learner exhibits misconceptions, the engine dynamically splices an adaptive **Remediation Lesson** into the roadmap.

---

## 2. Core User Journey

```text
[ Intake Screen ] ──> Topic Prompt or PDF Drop
        │
        v
[ Socratic Discovery Interview ] ──> 4-7 open-ended diagnostic questions (coreConcepts & misconceptions)
        │
        v
[ Living Curriculum Scaffolding ] ──> Generates Living Roadmap DAG in Right Panel
        │
        v
[ Active Lesson Study Canvas ] ──> 5-Section Note Article + Inline Voice Companion
        │                           ├─ Zero-Bullet Invariant on Foundational Sections
        │                           ├─ Midway Socratic Checkpoints (MCQ, Matching, Blank, Short)
        │                           └─ Real-time Dynamic Note Mutation
        v
[ Socratic Feynman Gate ] ──> Oral / Written Defense with 2 Forbidden Taboo Words
        │
        ├── Score >= 8 (Pass) ───> Marks Mastered, Unlocks Next Lesson, Updates Roadmap
        │
        └── Score < 8 (Fail) ────> Generates Adaptive Remediation Sub-Lesson into Roadmap
```

---

## 3. Completed MVP Feature Baseline

The initial hackathon MVP has been fully built, verified, and merged into `main`:

### 3.1 Dual Intake & Personalized Diagnostic Interview
- Accepts text prompts or PDF uploads.
- Generates 4 to 7 personalized diagnostic questions assessing baseline depth, misconceptions, and goals.
- Provides upfront question loading with predictable progress tracking.

### 3.2 Dynamic 5-Section Pedagogical Notes
Every lesson note adheres to a strictly structured 5-section pedagogical blueprint:
1. **Section 1: Mental Model (Analogy):** Continuous narrative prose. Zero bullets allowed.
2. **Section 2: First-Principles Mechanism:** Step-by-step physical breakdown. Zero bullets allowed.
3. **Section 3: Concrete Real-World Example:** Grounded practical application. Zero bullets allowed.
4. **Section 4: Technical Specifications & Edge Cases:** Structured details, constraints, and tables.
5. **Section 5: Active Recall Checkpoint:** Interactive question verifying understanding.

### 3.3 Socratic Feynman Gate
- Spoken and written defense sparring interface.
- Selects 2 domain-specific **taboo words** that the learner cannot use in their explanation.
- Evaluates clarity, conceptual accuracy, and forbidden word violations.
- Live mastery progress indicator and score threshold (minimum score: 8/10 to unlock subsequent lessons).

### 3.4 Multi-Tenant Auth & Storage Isolation
- Complete Supabase authentication integration (`@supabase/ssr`).
- Dynamic user-scoped local storage keys (`ater_courses_${uid}`, `ater_notes_${uid}_*`), preventing cross-user data leakage.
- User profile dropdown (`ProfileMenu.tsx`) with status, settings, and sign-out controls.

### 3.5 Bilingual Engine (Amharic & English)
- Full localized curriculum scaffolding, note compilation, and Feynman gate evaluation in both English and Amharic Ge'ez script.

### 3.6 Non-Destructive Feature Flags
- Managed in `lib/config/features.ts` for safe, modular runtime toggling (`ENABLE_ADVANCED_QUESTION_TYPES`, `ENABLE_VOICE_AGENT_COMMANDS`, `ENABLE_DYNAMIC_NOTE_MUTATION`).

---

## 4. Post-MVP Hackathon Feature Roadmap

The following modules represent the active hackathon sprint scope:

1. **Voxide Voice Integration (Rule 2 Compliance):**
   - High-performance, low-latency voice pipeline supporting Amharic, Oromiffa, and English spoken sparring.
2. **Scholarxiv Autonomous Integration (Rule 1 Compliance):**
   - Living collection sync (`6aa6d22cf0b42983a063820b`), paper full-text grounding, and automated academic citations.
3. **Local Payment Processing (Rule 5 Compliance):**
   - Seamless Ethiopian Birr (ETB) checkout integration via Links.et (`v.odit.et`).
4. **Production Deployment on EthioDeploy (Rule 3 Compliance):**
   - Deploying live mirror instances on local Ethiopian cloud infrastructure (`ethiodeploy.com`).
