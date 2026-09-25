# Development & Git Collaboration Workflow

To maintain code quality, avoid merge conflicts, and prevent CI breakage during the STARK Hackathon sprint, all collaborators must strictly follow this engineering workflow.

---

## 1. Golden Rules of Collaboration

1. **Never push directly to `main`:** The `main` branch is protected and always deployable. All changes enter via Pull Requests.
2. **Branch from latest `main`:** Before starting any task, run `git checkout main && git pull origin main` to ensure your base is fresh.
3. **Mandatory Local Verification:** Never open a PR without running:
   ```bash
   pnpm test
   pnpm build
   ```
   Both commands must exit with code 0 before pushing.
4. **Zero Monorepo Splits:** Ater is a single root Next.js application. Do not create sub-packages or nested `package.json` files.
5. **Small, Atomic Scopes:** Keep PRs focused on one feature or bugfix to simplify review and prevent conflicting changes.

---

## 2. Branch Naming Conventions

Always use descriptive, kebab-case branch names prefixed with the change type:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat/` | New user-facing feature or API capability | `feat/voxide-voice-stt` |
| `fix/` | Bugfix or patch | `fix/checkpoint-matching-score` |
| `docs/` | Documentation additions or updates | `docs/update-architecture` |
| `refactor/` | Code structure change with no behavior shift | `refactor/tts-client-lifecycle` |
| `test/` | Adding or updating unit/integration tests | `test/intake-schema-edge-cases` |

---

## 3. Step-by-Step Feature Workflow

### Step 1: Start Fresh
```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### Step 2: Implement with TDD / Automated Tests
When writing a new feature or fixing a bug, write corresponding tests in `tests/`:
```bash
# Run tests during development
pnpm test:watch
```

### Step 3: Verify Everything Locally
Before pushing your branch, run the full verification battery:
```bash
pnpm test
pnpm build
```
If any test fails or TypeScript flags a type error, resolve it before proceeding.

### Step 4: Commit with Conventional Commit Messages
Format commit messages clearly:
```bash
git add .
git commit -m "feat(voice): implement Voxide real-time STT listener"
```
Use standard prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.

### Step 5: Push and Open a Pull Request
```bash
git push -u origin feat/your-feature-name
```
Open a PR against `main` using GitHub CLI or the GitHub web interface:
```bash
gh pr create --title "feat(voice): implement Voxide real-time STT listener" --body "Detailed summary of changes and test proof."
```

### Step 6: Code Review & Merge
- At least one collaborator must review and approve the PR.
- Vercel and GitHub Actions CI checks must be green.
- Merge using **Squash and Merge** or **Rebase and Merge**.
- Delete the remote feature branch upon merge.

---

## 4. Handling Merge Conflicts

If `main` has progressed while you were working on your branch:
```bash
git checkout main
git pull origin main
git checkout feat/your-feature-name
git merge main
```
Resolve any conflict markers cleanly, run `pnpm test && pnpm build`, and push the resolution commit.
