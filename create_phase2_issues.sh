#!/bin/bash

# Create Issue 2.1
gh issue create --title "[Phase 2] Jules Agent 2.1: Admin Security Enforcer & Edge Function Integration" --label "jules" --body "**Focus:** \`apps/admin\`.

**Tasks:**
1. Implement \`AdminGuard.tsx\` to strictly verify \`profiles.role\` (must be 'admin' or 'developer') on the server before rendering the dashboard. Do not rely solely on layout wrapping without session validation.
2. Strip all client-side Supabase mutations (credits, feature locks, waitlist approvals, hardware bans) from the Admin dashboard.
3. Replace the stripped client mutations with explicit API calls to the Edge Functions created during Phase 1.

**Isolation Boundary:** \`apps/admin/src/\`.

**Verification:**
- Unauthenticated users must redirect to \`/login\` or 403 when hitting the admin dashboard.
- Admin mutations successfully execute via Edge Functions and are logged."

# Create Issue 2.2
gh issue create --title "[Phase 2] Jules Agent 2.2: Desktop Slug Standardization & DRM Alignment" --label "jules" --body "**Focus:** \`apps/desktop\`.

**Tasks:**
1. Standardize the feature lock slugs across the desktop application (e.g., ensure \`ai-features\` vs \`ai_locked\` discrepancies are resolved to a single source of truth).
2. Update the Zustand \`securityStore.ts\` and \`PageGuard.tsx\` to consume this unified schema and properly lock down the UI when a feature is revoked.
3. Update the IPC Rust handlers in \`commands.rs\` to properly process the unified \`machine_id\` logic established in Phase 1's database migrations.

**Isolation Boundary:** \`apps/desktop/src/\`, \`apps/desktop/src-tauri/\`.

**Verification:**
- Revoking a feature lock in the (mocked) profile successfully restricts access in the desktop client.
- The Tauri hardware heartbeat correctly validates against the unified \`machine_id\` footprint."

# Create Issue 2.3
gh issue create --title "[Phase 2] Jules Agent 2.3: Landing Page Privacy & Marketing Copywriter" --label "jules" --body "**Focus:** \`apps/landing-page\`.

**Tasks:**
1. Rewrite the landing page copy and privacy documentation to accurately reflect the architecture: state clearly that while storage and embeddings are local, the generation step sends source text to external LLM providers (e.g., Gemini).
2. Ensure there are no false claims like \"files never sent to cloud\".
3. Fix any SEO metadata issues related to this copy update.

**Isolation Boundary:** \`apps/landing-page/app/\`, \`apps/landing-page/components/\`.

**Verification:**
- Text across the landing page explicitly and accurately explains the local-first but LLM-connected nature of the app.
- \`pnpm test:e2e\` (if applicable to copy) passes."

