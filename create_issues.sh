#!/bin/bash

# Create Issue 1.1
gh issue create --title "[Phase 1] Jules Agent 1.1: Fix Root Config Caching & Landing Page Mock Bypass" --label "jules" --body "**Focus:** Root monorepo configuration.

**Tasks:**
1. Re-add \`\"src/**/*.py\"\` and \`\"tests/**/*.py\"\` to the \`inputs\` array for the \`lint\`, \`typecheck\`, and \`test\` tasks in \`turbo.json\`.
2. Remove the \`?bypass=true\` mock vulnerability references from \`apps/landing-page/README.md\` (and any public environment logic if applicable).
**Isolation Boundary:** \`turbo.json\`, \`apps/landing-page/README.md\`.

**Verification:**
- Modifying a \`.py\` file inside \`apps/api/src/\` should invalidate the \`pnpm test\` cache for the Turborepo.
- Landing page mock bypass must be documented as removed."

# Create Issue 1.2
gh issue create --title "[Phase 1] Jules Agent 1.2: Supabase Schema Unification & Edge Functions" --label "jules" --body "**Focus:** Remote Supabase schema.

**Tasks:**
1. Create standard SQL migrations in \`supabase/migrations/\` to unify \`hardware_blacklist.machine_id_hash\` with \`profiles.machine_id\`.
2. Create an \`admin_audit_log\` table migration.
3. Scaffold Deno Edge Functions in \`supabase/functions/\` for Admin Mutations (credit grants, locks, bans) using the \`supabase-js\` service role.
**Isolation Boundary:** \`supabase/migrations/\`, \`supabase/functions/\`.

**Verification:**
- Migrations apply successfully via local Supabase CLI.
- Edge functions correctly enforce service-role logic for mutations."

# Create Issue 1.3
gh issue create --title "[Phase 1] Jules Agent 1.3: Desktop E2E Test Restoration for Vault Reads" --label "jules" --body "**Focus:** Desktop Playwright E2E suites.

**Tasks:**
1. In \`apps/desktop/e2e/student.spec.ts\`, revert the deletion of the note-reading assertions for the Obsidian vault.
2. Fix the mock routing/payload so the test successfully opens a mock Markdown note and verifies the content text (expecting \`high-fidelity note\` or similar).
**Isolation Boundary:** \`apps/desktop/e2e/\`.

**Verification:**
- \`pnpm --filter @ater/desktop test:e2e\` passes.
- The test accurately verifies the Monaco editor/note viewer renders the mocked text."

