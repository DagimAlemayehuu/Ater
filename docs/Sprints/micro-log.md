# micro-log.md — Tier 1 Change Log

> Log all Tier 1 (micro-change) implementations here. One line per change.
> Format: `- YYYY-MM-DD | <file path> | <one-line description>`
>
> See `docs/SOP.md §1` for Tier 1 qualifying criteria.

---

- 2026-06-08 | docs/ | SDD v1.0 bootstrap — directory structure and core documents initialized.
- 2026-06-10 | apps/desktop/src-tauri/src/commands.rs | Automated offline DRM mock lease creation for debug builds.
- 2026-06-10 | apps/desktop/src/lib/sidecarApi.ts | Defensive null serialization for connection test configurations and development credit deduction bypass.
- 2026-06-10 | apps/desktop/src/lib/ConfigContext.tsx | Cleaned up temporary bridge diagnostics logger.
- 2026-06-10 | docs/ | Created infrastructure_cleanup_final.md sprint report and ai_pipeline_matrix.md validation archive.
- 2026-06-10 | apps/desktop/src/routes/onboarding.tsx | Fixed vault selection by avoiding backend restart during picker validation and creating the database folder before testing write access.
- 2026-06-26 | apps/desktop/src/tests/InteractiveLesson.test.tsx | Pass required onNavigate callback to MarkdownViewer component to resolve type checking issues.
- 2026-06-26 | apps/desktop/src/tests/StudySplitPane.test.tsx | Cast mockQuestion to any to bypass MCQ type mismatch and id type mismatches in MiniPracticeUI tests.
