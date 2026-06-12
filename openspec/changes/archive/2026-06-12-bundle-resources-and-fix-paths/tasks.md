## 1. Resource Configuration

- [x] 1.1 Update `apps/desktop/src-tauri/tauri.conf.json` to bundle `Ater.md` and `.system/prompts/*` as resources

## 2. Path Resolution Updates

- [x] 2.1 Update `apps/api/src/domains/ater/embeddings_linker.py` to check `resources/` on Windows
- [x] 2.2 Update `apps/api/src/domains/ater/service.py` to check `resources/` on Windows
- [x] 2.3 Update `apps/api/src/domains/ater/assistant.py` to check `resources/` on Windows
- [x] 2.4 Update `apps/desktop/e2e/student.spec.ts` and `apps/desktop/e2e/app.spec.ts` mock stores to bypass walkthrough tour modal


## 3. Local Dry-Run Verification

- [x] 3.1 Run `python3 .agent/scripts/release_dry_run.py` to verify release layout safety
- [x] 3.2 Execute pytest suite to verify no regressions in local environment
