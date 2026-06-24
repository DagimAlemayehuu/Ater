# Learning Runtime — Manual Desktop Verification Checklist

**Change package:** `learning-runtime-e2e`  
**Purpose:** Human-executed desktop verification to confirm the complete learning runtime works correctly in the live Ater application.  
**When to run:** After all automated tests pass (see `learning-runtime-final-verification.md`).  
**Font:** All text visible in the desktop app uses the Outfit typeface.

> Complete all steps in order. Each step includes an **Expected Result**. If any expected result is not met, do not archive — report the failure with the step number.

---

## Prerequisites

- [ ] Ater desktop app is built and running (development or production).
- [ ] A local Obsidian vault path is configured in Ater settings.
- [ ] The machine is offline (airplane mode recommended) to confirm offline-first behaviour.

---

## Step 1 — Create a "Teach me Git from scratch" Learning Path

1. Open Ater and navigate to the **Teach Anything** route (sidebar → "Teach Anything" or the learning path creation button).
2. In the prompt field, type exactly: `Teach me Git from scratch`
3. Click **Generate** (or press Enter) to submit.
4. Wait for the planner to complete (progress indicator should appear and resolve).

**Expected Result:**
- A new **Learning Hub** file named `Git_Hub.md` appears under `database/learning paths/` in the Obsidian vault.
- The Ater UI shows the new Git path in the learning paths list.
- No error or timeout notification is displayed.

---

## Step 2 — Verify the Learning Hub File

1. Open the Obsidian vault in your file browser or Obsidian itself.
2. Navigate to `database/learning paths/` and open `Git_Hub.md`.

**Expected Result:**
- Frontmatter contains `type: Learning Hub` and `topic: Git`.
- The `chapters:` list includes at least one wikilink, e.g. `- "[[Chapter_01_Foundations]]"` (double-quoted).
- No plain-text wikilinks (e.g. `- [[Chapter]]` without quotes) are present.

---

## Step 3 — Open Chapter and Atomic Note Files in Explorer

1. In Ater, open the Explorer panel for the Git Learning Hub.
2. Expand the first chapter (e.g. "Foundations").
3. Click on the first Atomic Note stub (e.g. "Git Commit Graph").

**Expected Result:**
- The Chapter file (`Chapter_01_Foundations.md`) is visible in the Explorer.
- The Atomic Note (`Git_Commit_Graph.md`) opens in the note viewer/editor.
- The note's frontmatter shows `type: Atomic Note`, `chapter: "[[Chapter_01_Foundations]]"` (double-quoted), and `hub: "[[Git_Hub]]"` (double-quoted).

---

## Step 4 — Open the Compiled HTML Lesson

1. From the Atomic Note view, click **Open Lesson** (or the "Study" / "View Lesson" button).
2. Select the **Simple** lesson variant if multiple variants are shown.

**Expected Result:**
- A compiled HTML lesson renders in the lesson viewer.
- The lesson displays the **Mental Model** section with continuous prose (no bullet points in the Mental Model, H1, or H2 sections).
- A **Key Definitions** section is present.
- Navigation links show the **previous note** (or "Start of chapter" if first) and **next note** (e.g. "Git Branch Model").

---

## Step 5 — Verify Markdown Source Embedding (Deep Variant)

1. From the lesson viewer, switch to the **Deep** variant (if available in the UI).
2. Inspect the rendered page (right-click → View Source or use browser DevTools if the lesson opens in a web view).

**Expected Result:**
- A `<script type="text/markdown" id="raw-markdown-source">` block is present in the HTML source.
- The block contains the full raw Markdown text of the Atomic Note.

---

## Step 6 — Verify at Least One Interactive Artifact

1. Scroll to the **Proving Grounds** section of the compiled lesson.
2. Interact with the first artifact (e.g. an interactive quiz, SQL playground, or case simulation).

**Expected Result:**
- At least one interactive artifact loads and responds to input.
- Submitting a quiz answer shows feedback (correct/incorrect).
- No JavaScript errors appear in the console.

---

## Step 7 — Use the Tutor Loop and Verify Feedback

1. From the Git Learning Hub, start a **Tutor Session**.
2. When the first question appears, select an answer and choose a **wager** (High / Medium / Low confidence).
3. Submit a **correct answer with High confidence**.
4. Submit an **incorrect answer with High confidence**.

**Expected Result (correct + high):**
- Score increases by **+10 points**.
- Positive reinforcement feedback is displayed.

**Expected Result (incorrect + high):**
- Score decreases by **−5 points** (minimum score is 0, never negative).
- A **mistake repair** explanation appears, identifying the misconception.
- The misconception is flagged visually (e.g. a diagnostic badge or repair card).

---

## Step 8 — Start Cram Mode with a Short Time Budget

1. From the Git Learning Hub, select **Cram Mode**.
2. Set the time budget to **15 minutes**.
3. Start the session.

**Expected Result:**
- The orientation phase is **skipped** (no introductory orientation screen appears, or orientation duration shows 0 minutes).
- The phase breakdown shows approximately:
  - High-Yield Review: **3 min** (20%)
  - Active Recall: **9 min** (60%)
  - Mistake Repair: **3 min** (20%)
- Notes with previously logged misconceptions appear **earlier** in the queue.
- When approximately 2 minutes of budget remain, a **Rescue Mode** banner or compressed-priority indicator activates.

---

## Step 9 — Verify Source-Driven Learning (if UI is exposed)

> Skip this step if the source ingestion UI is not yet exposed in the desktop application.

1. Navigate to the **Source** or **Upload Document** feature.
2. Upload a small PDF (3–5 pages) related to Git or a topic of your choice.
3. Trigger grounded curriculum generation.

**Expected Result:**
- The generated Atomic Note stubs contain a `sources:` block in their frontmatter.
- The block lists the uploaded PDF file name and the page numbers that were cited.
- No live web search requests are made (the UI should indicate offline / mock mode or the ingestion should complete without internet access).

---

## Step 10 — Verify Artifact Versioning

1. Open an existing compiled lesson for "Git Commit Graph".
2. If the UI exposes an **Update Artifacts** or **Regenerate Pack** button, trigger it.
3. Navigate to the artifacts directory in the vault: `database/General/Git/01_Foundations/artifacts/`.

**Expected Result:**
- The file `Git_Commit_Graph.artifacts.json` exists.
- If a second version was generated, the JSON file contains a `versions` array with at least 2 entries and `active_version` pointing to the latest.
- Opening the JSON file shows valid, human-readable structure (not corrupted or truncated).

---

## Step 11 — Verify Offline Lesson Reopening

1. Ensure the machine is offline (no internet connection).
2. Close and reopen the Ater desktop application.
3. Navigate to the Git Learning Hub and open the compiled lesson for "Git Commit Graph".

**Expected Result:**
- The lesson opens successfully with no loading errors.
- All sections (Mental Model, H1, H2, Proving Grounds) render correctly.
- The interactive artifact in the Proving Grounds is functional.
- No "network error" or "offline mode unavailable" messages appear.

---

## Sign-Off

| Step | Verified By | Date | Result |
|------|-------------|------|--------|
| 1. Create learning path | | | ☐ Pass / ☐ Fail |
| 2. Verify Hub file | | | ☐ Pass / ☐ Fail |
| 3. Open Chapter & Note | | | ☐ Pass / ☐ Fail |
| 4. Open HTML lesson | | | ☐ Pass / ☐ Fail |
| 5. Markdown source embedding | | | ☐ Pass / ☐ Fail |
| 6. Interactive artifact | | | ☐ Pass / ☐ Fail |
| 7. Tutor loop & feedback | | | ☐ Pass / ☐ Fail |
| 8. Cram Mode (15 min) | | | ☐ Pass / ☐ Fail |
| 9. Source-Driven Learning | | | ☐ Pass / ☐ Skip (UI not exposed) |
| 10. Artifact versioning | | | ☐ Pass / ☐ Fail |
| 11. Offline reopening | | | ☐ Pass / ☐ Fail |

**Overall Manual Verification Result:** ☐ PASS — proceed to archive  ☐ FAIL — route failures to the responsible phase agent
