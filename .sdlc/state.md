# SDLC State

Status: archived
Active Change:
GitHub Issue: #12
Branch: feature/perfect-artifacts
Worktree:
Base Branch: main
Run File: .sdlc/run.json

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
- [x] Orchestrate
- [x] Verify
- [x] Archive
