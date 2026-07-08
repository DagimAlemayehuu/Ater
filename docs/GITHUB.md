# GITHUB.md — Version Control & CI/CD Guidelines

This document defines the branching strategy, commit conventions, Pull Request layouts, and automated CI/CD procedures for the Ater repository.

---

## 0. Current Branch Hygiene

As of 2026-07-08, the repository is intentionally protected for PR-based integration:

* Local active branch: `main`
* Remote active branch: `origin/main`
* Required GitHub status check: `Gatekeeper Required`
* Open PRs: none
* Required state before starting new work: create a new feature/fix branch from updated `main`

Do not resurrect old Jules, Bolt, Sentinel, or repair branches unless a new issue explicitly requires that history.

## 1. Branch Naming Conventions
To keep branch management clean and automated, use the following prefixes:
* **Features:** `feat/short-description` (e.g. `feat/user-auth`)
* **Bug Fixes:** `fix/short-description` (e.g. `fix/db-leak`)
* **Refactoring:** `refactor/short-description` (e.g. `refactor/api-routes`)
* **Documentation:** `docs/short-description` (e.g. `docs/update-readme`)

---

## 2. Commit Message Guidelines
Commit messages must be written in **clear, simple, non-technical language** that a product owner can understand. Avoid low-level technical jargon.
* **Format:** `<type>: <user-friendly description>`
* *Correct Example:* `fix: corrected login redirect loop`
* *Incorrect Example:* `fix: update useAuth hook state validation redirect check`
* *Correct Example:* `feat: added database check to prevent account duplicates`
* *Incorrect Example:* `feat: implement unique constraint query in profile service`

---

## 3. Pull Request Template
When submitting a Pull Request via `gh pr create`, populate the description using this clean format:
```markdown
## Summary
* <1-2 sentences of what user-facing capability was added or fixed>
* <any new dependencies introduced>

## How to Verify (Manual Steps)
1. [ ] <Step 1 of manual verification checklist>
2. [ ] <Step 2 of manual verification checklist>
```

---

## 4. CI/CD Pipeline Gates
* **Protected Branches:** Push permissions directly to `master`/`main` are blocked. All integrations must happen via a Pull Request.
* **Fast PR Gate:** `.github/workflows/ci.yml` is the fast Jules/Codex feedback loop. It runs on pull requests, non-`main` branch pushes, and manual dispatch. It checks workflow/release contracts, backend Ruff correctness + pytest on Ubuntu, workspace lint/typecheck/build on Ubuntu, desktop Vitest on Ubuntu, and Rust `cargo check` on Ubuntu without a release-mode build.
* **Required PR Check:** GitHub branch protection for `main` requires the `Gatekeeper Required` status check with strict up-to-date checks. This summary job is the PR merge contract and fails if any fast gate fails, is cancelled, or is skipped.
* **Platform Validation:** `.github/workflows/platform-validation.yml` runs after merges to `main` and can be launched manually. It performs the slower confidence checks across macOS, Windows, and Linux: backend Ruff + pytest, workspace lint/typecheck/build, desktop Vitest, release-mode Rust cargo build/test, and Ubuntu Playwright smoke tests. Its summary job is `Platform Validation Required`.
* **Release Packaging:** `.github/workflows/release.yml` runs only for version tags matching `v*`. It is the only workflow that builds PyInstaller sidecars, packages Tauri installers for macOS/Windows/Linux, uploads artifacts to `DagimAlemayehuu/Ater_Releases`, generates `update.json`, and publishes the release.
* **Expected Runtime:** Fast PR CI should target roughly 4-8 minutes on warm caches. Platform validation should target roughly 15-25 minutes. Full release packaging should be expected to take roughly 35-45 minutes because Windows and Linux installer packaging are the bottlenecks.
* **Repair Loop:** If a branch fails `Gatekeeper Required`, inspect the failing job logs, fix on the same branch, and rerun the fast gate. If `Platform Validation Required` fails after merge, treat `main` as blocked for release until the failing platform job is fixed. If the release workflow fails, delete or repair the draft release/tag state before retrying the same version.

## 5. Parallel Agent Rules
* Give each Jules/Codex agent a separate branch or worktree and a bounded task scope.
* Agents may open PRs only after relevant local checks pass.
* Agents must not merge until `Gatekeeper Required` passes on the latest `main` base.
* Agents must treat `Platform Validation Required` as the post-merge cross-platform release-readiness signal.
* If another PR merges first, rebase or merge `main`, resolve conflicts, and wait for CI to rerun.
* Do not treat CI as a proof of every possible behavior. User-facing workflow changes still require manual verification evidence.
