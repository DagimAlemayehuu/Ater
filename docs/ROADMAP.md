# ROADMAP.md — Ater Adaptive Learning Runtime Roadmap

This document outlines the product vision, directory routing rules, multi-phase implementation roadmap, and active phase gaps for the Ater Adaptive Learning Runtime.

---

## 1. Product Vision & Learning Loop
Ater is evolving from a static note-generation pipeline into a local-first **adaptive learning runtime**. It runs a continuous learning loop:
```
Teach -> Interact -> Ask -> Check -> Diagnose -> Remediate -> Advance -> Review
```
* **Source of Truth:** Plain Markdown files inside your Obsidian Vault.
* **Durable Delivery:** HTML lessons serve as offline-first, interactive learning representations of the notes.
* **Weak-Model Safe:** Interactive objects are structured as versioned, editable JSON **artifact packs** so that lightweight local models can render them consistently without generation failure.

---

## 2. Core Learning Hierarchy & Folder Routes
```
Hub (Obsidian file)
  └── Chapter files (Markdown)
       └── Atomic Notes (Markdown + metadata)
            ├── Artifact Pack (JSON)
            └── HTML Lesson Variants (simple, deep, cram, exam)
```

### Routing Invariants
* **Self-Study (Teach Anything):**
  * Hub: `database/learning paths/`
  * Content: `database/General/<Topic>/`
* **School Coursework:**
  * Hub: `database/study planner/`
  * Content: `database/<Semester>/<Course>/<Unit>/`

---

## 3. Development Phases & Scope

### Phase 1: `learning-object-model` [VALIDATED]
* **Scope:** Defines the directory structure, chapter schemas, note link mappings, and basic versioning for artifact packs.

### Phase 2: `teach-anything-planner`
* **Scope:** Classifier to determine user intent, lookup existing Hubs, and plan chapters/atomic notes progressively.

### Phase 3: `atomic-note-lesson-compiler`
* **Scope:** Compiles Obsidian Markdown into standalone interactive HTML lessons with Hub/chapter navigation.

### Phase 4: `artifact-pack-v1`
* **Scope:** Introduces JSON schemas for interactive objects (e.g. `reveal_card`, `matching_pairs`, `code_trace`, `formula_card`).

### Phase 5: `tutor-runtime`
* **Scope:** Powers active quiz checking, wagers, mistake diagnoses, and lesson event logging.

### Phase 6: `cram-mode`
* **Scope:** Priority ranker to optimize high-yield study schedules under strict time limits.

### Phase 7: `source-driven-learning`
* **Scope:** Local PDF/source document extraction to automatically scaffold complete hubs from documents.

### Phase 8: `advanced-artifacts`
* **Scope:** Introduces advanced templates like SQL Query playgrounds, simulations, and proof steps.

### Phase 9: `adaptive-learner-model`
* **Scope:** Integrates the FSRS scheduler, confidence calibration, and next-lesson recommendation sorting.

---

## 4. Active Phase Gaps & Hardening Checklist
*These are outstanding gaps to address during the final hardening pass of each phase.*

### Phase 1 Gaps
- [ ] **Lesson Variant Verification:** Ensure `validate_learning_objects` checks that all lesson paths exist.
- [ ] **Fragile Hub Lookup:** Verify `lookup_existing_hub` checks for `type: Learning Hub` in frontmatter instead of matching any arbitrary Markdown file.
- [ ] **Title Normalization:** Sanitize filename characters (e.g. `\`, `/`, `*`, `?`) during normalization.

### Phase 3 Gaps
- [ ] **YAML Formatting:** Ensure `compiler_service.py` uses `VaultManager.dump_obsidian_yaml` instead of `frontmatter.dumps` to prevent breaking double-quoted wikilink rules.
- [ ] **Tauri Relative Links:** Validate that relative links (e.g. `./Prev_Note.simple.html`) resolve correctly under Tauri's `convertFileSrc` file protocol.

### Phase 4 Gaps
- [ ] **Mismatched Paths:** Standardize the artifact pack write path. The planner writes to `database/artifacts/` but the service expects them nested under the specific chapter directory.
- [ ] **Pydantic Validation Coercion:** Add fallback structures for weak models returning invalid type coordinates (e.g. integers instead of strings) in execution steps.

### Phase 5 Gaps
- [ ] **JavaScript Template Escape:** Escape javascript brackets as `{{` and `}}` in `compiler_service.py` to prevent Python f-string SyntaxErrors.
