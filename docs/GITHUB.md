# GITHUB.md — Version Control & CI/CD Guidelines

This document defines the branching strategy, commit conventions, Pull Request layouts, and automated CI/CD procedures for the Ater repository.

---

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
* **Test Verification:** Pull Requests will only be merged once the GitHub Actions CI workflow compiles successfully and runs all tests with a **green** status.
* **Self-Healing Loop:** If a pushed branch fails the CI run, the developer runs `git push-and-heal` to trigger the local Antigravity repair agent.
