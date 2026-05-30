## Context

The Ater desktop application has robust frontend elements but exhibits minor operational details that hinder full production-readiness, including a runtime crash when executing offline mock subscriptions, layout dimension warnings in charts, and obsolete imports causing console and build-time clutter.

## Goals / Non-Goals

**Goals:**
- Fix the offline Supabase mock client chaining bug to prevent runtime TypeError failures.
- Eliminate obsolete imports and unused variables in settings routes and tests to clean up build outputs.
- hard-code baseline dimensions for Recharts wrappers in dashboards to silence console aspect ratio warnings.
- Securely harden offline licensing and DRM lease synchronizations.

**Non-Goals:**
- Porting styling/components to newer CSS frameworks (e.g. TailwindCSS v4 or styled-components).
- Restructuring the core Tauri Rust IPC methods or profile schemas in the database.

## Decisions

### Decision 1: Self-Referential Mock Chaining on Supabase Offline Client
- **Option A**: Implement complete mock channel mapping mirroring Supabase client exactly.
- **Option B (Chosen)**: Modify the offline `channel` mock in `apps/desktop/src/lib/supabase.ts` to return a stateful object where the `.on` handler returns the same channel object recursively:
  ```typescript
  channel: (name: string) => {
    if (realSupabase) return realSupabase.channel(name)
    const mockChannel = {
      on: () => mockChannel,
      subscribe: () => {}
    }
    return mockChannel
  }
  ```
- **Rationale**: Keeps the offline mockup extremely simple and lightweight while providing complete compatibility for multi-chained `.on()` database update listeners.

### Decision 2: Fixed Bounds for Responsive Recharts Dashboards
- **Option A**: Use standard divs with generic tailwind classes.
- **Option B (Chosen)**: Wrap Recharts elements in dedicated grid containers with explicit minHeight parameters (e.g., `min-h-[300px]`) and standard React element sizing properties.
- **Rationale**: Silences the browser console/test log aspect ratio warning immediately.

## Risks / Trade-offs

- **[Risk]** Mocking too many layers may drift from actual Supabase realtime engine behavior → **[Mitigation]** Keep mock assertions simple and rely on full E2E/Playwright tests with active Supabase sandbox configurations.
