## Context

Ater requires an exam-focused, time-limited study loop ("Cram Mode") to optimize student performance when time is restricted. Currently, Ater tutor sessions are static in progression and lack time-awareness or weak-spot prioritization. This design introduces the `CramSessionManager`, a deterministic `weakness_score` prioritization function, an adaptive time scheduler, a "rescue mode" trigger, and a specialized compiler layout variant (`cram`).

This architecture is offline-first, runs entirely in the FastAPI sidecar, and is fully verified using headless tests without Tauri or browser dependencies.

## Goals / Non-Goals

**Goals:**
- Define Pydantic models for `CramSessionPlan`, `CramPhase`, and `CramPriorityItem`.
- Implement a deterministic, explainable `weakness_score` / `cram_priority_score` ranking helper in `cram_service.py`.
- Implement an adaptive phase time budget scheduler that supports durations of 15, 30, 45, 60, 90 minutes (defaulting to 60) and dynamically compresses allocations.
- Implement a "rescue mode" flag that triggers when remaining time drops below 15% (or under 5 minutes), filtering content to highest-yield facts, traps, and formulas.
- Define a specialized compiler contract for `lessons/<Atomic_Note>.cram.html` that generates high-yield cram-focused contents and skips passive reading.
- Add FastAPI routes for starting, tracking, and updating cram sessions under `ater.py`.
- Run all tests headlessly via pytest without external APIs, network, or GUI windows.

**Non-Goals:**
- Do not implement a beautiful React/Tauri UI container in this phase; focus on the backend planning and runtime state engine.
- Do not touch or fix the Phase 5 SyntaxError in `compiler_service.py` within this spec.
- Do not integrate PDF/source ingestion in this phase (belongs to Phase 7).
- Do not archive any active changes; all changes remain active until final hardening.

## Decisions

### 1. Cram Session Data Contracts
We will represent cram sessions using the following Pydantic schemas in `apps/api/src/domains/ater/cram_service.py` (or integrated into existing schemas):
- `CramPriorityItem`:
  - `note_path`: str
  - `concept`: str
  - `priority_score`: float
  - `why_selected`: str
  - `source_signals`: dict  # e.g., {"telemetry_errors": 2, "mismatch": true, "fsrs_retrievability": 0.65}
  - `recommended_question_types`: list[str]
- `CramPhase`: Enum of `orientation`, `high_yield`, `active_recall`, `mistake_repair`, `final_review`.
- `CramSessionPlan`:
  - `session_id`: str
  - `topic`: str
  - `total_minutes`: int
  - `started_at`: float
  - `mode`: str = "cram"
  - `current_phase`: CramPhase
  - `phases`: list[str]
  - `selected_notes`: list[str]
  - `priority_items`: list[CramPriorityItem]
  - `weak_spots`: list[str]
  - `question_mix`: list[str]
  - `time_allocations`: dict[str, float]  # Phase name -> minutes allocated
  - `rescue_mode_threshold_seconds`: int
  - `rescue_mode_active`: bool = False
  - `exit_check`: dict

### 2. Deterministic Weakness Prioritization Score
To ensure weak-model-safe and latency-free operation, the system will use a deterministic prioritization function to rank notes for the cram session:
$$\text{Priority Score} = W_D \cdot D + W_E \cdot E + W_M \cdot M + W_R \cdot (1 - R) + W_Y \cdot Y - W_T \cdot T$$
Where:
- $D \in \{0, 1\}$: Diagnostic quiz status (1 if incorrect or skipped, 0 if correct).
- $E \ge 0$: Count of incorrect tutor answers in the last 7 days.
- $M \ge 0$: Confidence mismatch rating (specifically, count of incorrect answers wagered with "high" confidence).
- $R \in [0, 1]$: FSRS retrievability metric (if no FSRS state exists, defaults to 0.70).
- $Y \in [0, 1]$: High-yield weight defined in note frontmatter (defaults to 0.50).
- $T \ge 0$: Time recency decay (hours since last mistake; $e^{-\lambda T}$ or similar linear penalty).

**Graceful Fallbacks:**
- **If telemetry & FSRS exist**: Apply full scoring.
- **If FSRS exists but no telemetry**: Score using FSRS retrievability ($R$) and note importance ($Y$).
- **If neither exists**: Run a 3-question diagnostic quiz.
- **If user skips diagnostic / knows nothing**: Rank strictly by planner high-yield weights ($Y$) and dependency prerequisites.

### 3. Adaptive Time Scheduler & Rescue Mode
The default phase budget allocation is **10% Orientation**, **20% High-Yield**, **50% Active Recall**, and **20% Mistake Repair**.
- **Compression Rule**: For short budgets (e.g. 15 minutes), the scheduler scales down or skips phases (e.g. skips Orientation entirely, allocating 20% High-Yield, 60% Recall, 20% Repair).
- **Performance Adaptivity**: If the initial diagnostic score is low (< 50% correct), the scheduler reduces the breadth of High-Yield explanation content (allocates less time/notes to that phase) and re-allocates that time to Core Active Recall.
- **Rescue Mode Trigger**: When remaining session time falls below 15% of the total budget (or under 5 minutes), `rescue_mode_active` is set to `true`. This triggers the runtime to bypass full lessons and serve only the highest-yield priority cards (formulas, traps, and summary checklists).

### 4. High-Yield Cram Lesson variant (`cram.html`)
The `atomic-note-lesson-compiler` will support compiling a `cram` layout variant. The HTML structure of the cram variant is optimized for fast consumption:
- **Payoff Header**: 1-minute explanation of why the concept matters for exams.
- **High-Yield Rules**: Compact facts, definitions, and equations.
- **Traps & Misconceptions**: Bullet points highlighting common mistakes (retrieved from `user_misconceptions` database logs).
- **Rapid Recall Prompts**: Simple fill-in-the-blank or trace code widgets.
- **Exam-Style Quizzes**: Harder questions with confidence wagers.
- **Cheatsheet Checklist**: Summary list of "can you do this?" checklist items.

Passive descriptions, long historical contexts, and extensive visual graphics are omitted from the cram variant.

## Risks / Trade-offs

- **[Risk]**: The user spends too much time on a single difficult question, exhausting the time budget.  
  **Mitigation**: The runtime implements a per-question time warning (or soft timeout) that encourages the user to skip or submit a wager, and automatically shifts to rescue mode if the global time runs low.

- **[Risk]**: Weak models generate invalid structured questions that fail Pydantic parsing.  
  **Mitigation**: The sidecar uses deterministic fallback question mixes (such as standard multiple-choice and true/false templates) when custom code trace or debug questions fail verification.
