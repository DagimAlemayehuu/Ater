# SDLC State

Status: planned
Active Change: unify-source-learning-pipeline
GitHub Issue: #94
Branch: main
Worktree:
Base Branch: main
Run File: .sdlc/run.json
Last Cleanup: 2026-07-04 PR #91 merged at 6b34553e; repository clean on main only.

## Harness Health
- OpenSpec: /opt/homebrew/bin/openspec (Available)
- GitHub CLI: /opt/homebrew/bin/gh (Available)
- Test command: pnpm --filter @ater/desktop test / cd apps/api && uv run python -m pytest tests/
- Build command: pnpm build
- Lint command: pnpm lint
- CI provider: GitHub Actions
- Context budget: Healthy

## Current Phase
- [x] Plan
- [ ] Orchestrate
- [ ] Verify
- [ ] Archive
