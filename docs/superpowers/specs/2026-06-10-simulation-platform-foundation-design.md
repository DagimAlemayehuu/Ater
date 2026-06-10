# Simulation Platform Foundation Design

## Status

Approved for Phase 1 implementation.

## Product Goal

A first-time user can enter a high-fidelity simulation of Ater before choosing a vault, entering an API key, or writing any local files. The simulation must feel like the real application while remaining technically isolated from the user's disk, Tauri store, sidecar, Supabase account state, and credit ledger.

This design intentionally excludes the exhaustive Grand Tour tooltip map. Phase 2 will layer the full guided tour on top of this foundation after the simulated data and AI paths are stable.

## Scope

Phase 1 includes:

- A typed application mode boundary: `real` or `simulation`.
- A `SimulationProvider` and `useSimulation` hook.
- A structured in-memory Ghost Vault.
- A deterministic mock AI/data adapter.
- Sidecar API routing that prevents real native IPC, Supabase RPC, and credit deductions while in simulation.
- Memory-only simulation mutations that are wiped on exit or reload.
- A hardened factory reset contract and frontend reset behavior.
- Tests proving isolation and deterministic simulation behavior.

Phase 1 does not include:

- Exhaustive tour coverage for every surface-map element.
- New visual mockups for every page.
- Large theme-token migration across all components.
- Real user data migration.

## Non-Negotiable Isolation Rules

Simulation data must stay in memory.

The simulation layer must not:

- Write simulated files to the user's vault.
- Write simulated config, notes, generated plans, practice logs, API keys, or academic rows to Tauri Store.
- Call `invoke(...)` for simulated reads, writes, AI generation, ingestion, practice, explain, or graph operations.
- Call Supabase RPCs or mutate Supabase user metadata.
- Deduct credits.
- Reuse real active API keys.
- Persist ephemeral simulated changes across reloads.

The only persistent write allowed during simulation is an explicit mode transition requested by the user, such as leaving simulation and starting real onboarding.

## App Mode Model

Add a first-class mode:

```ts
export type AppMode = 'real' | 'simulation';
```

`ConfigContext` gains:

```ts
appMode: AppMode;
```

`isDemoMode` remains as a compatibility alias during migration. New code reads `appMode`. Existing code that still checks `isDemoMode` must treat it as equivalent to `appMode === 'simulation'` until Phase 2 removes the alias.

The app enters simulation when a user chooses the guest/demo entrypoint after login or when a development bypass explicitly requests simulation. The app exits simulation when the user chooses the conversion CTA to build their own system, which routes to `/onboarding` in real mode.

## Provider Architecture

`SimulationProvider` sits inside `ConfigProvider` and outside routed pages. It exposes:

```ts
interface SimulationContextValue {
  appMode: AppMode;
  isSimulation: boolean;
  profile: SimulationProfile;
  vault: SimulationState;
  enterSimulation: () => Promise<void>;
  exitSimulation: () => Promise<void>;
  resetSimulation: () => void;
}
```

The provider owns an in-memory simulation store. It is initialized from static seed data on first entry, then mutated only in React memory. Reloading the app returns to static seed data. Exiting simulation clears the memory store and saves only the real mode transition.

## Ghost Vault

The Ghost Vault is a virtual filesystem snapshot with high-quality academic content centered on a single coherent hub:

- Hub: `Distributed Systems`
- Atomic notes:
  - `Consensus.md`
  - `Raft_Leader_Election.md`
  - `Log_Replication.md`
  - `Vector_Clocks.md`
  - `CAP_Theorem.md`
  - `Quorum_Reads_Writes.md`
  - `Failure_Detectors.md`
  - `Gossip_Protocols.md`
- Source PDF: `Inbox/Distributed_Systems_Primer.pdf`
- PDF waypoints:
  - `Consensus Problem`, page 3
  - `Leader Election`, page 7
  - `Replication Invariants`, page 11
  - `Causal Ordering`, page 15
- Profile:
  - Name: `Maya Chen`
  - Program: `B.S. Computer Science`
  - Course: `CS 342: Distributed Systems`
  - Semester: `Semester VI`
  - Active unit: `Fault Tolerance and Replication`

The virtual filesystem provides file lists, note reads, note updates, graph data, backlinks, hub navigation, academic rows, inbox files, generated plan data, queue state, SRS data, and practice history.

All updates return successful results but mutate only the in-memory snapshot owned by `SimulationProvider`.

## Mock AI/Data Adapter

Create a simulation adapter with deterministic responses for the public sidecar API methods used by the desktop app.

The adapter handles at least:

- `health`
- `listObsidianFiles`
- `readObsidianNote`
- `updateObsidianNote`
- `createObsidianFile`
- `createObsidianFolder`
- `deleteObsidianItem`
- `moveObsidianItem`
- `findVaultPage`
- `getVaultGraph`
- `getVaultBacklinks`
- `listVaultDatabases`
- `queryVaultDatabase`
- `listVaultDatabaseRows`
- `getVaultOptions`
- `testAiConnection`
- `aterListInbox`
- `aterListGenerated`
- `aterProcess`
- `aterGeneratePlan`
- `aterConfirm`
- `aterQueueStatus`
- `generatePracticeQuestions`
- `gradePracticeAnswer`
- `logPracticeResult`
- `getStudyHistory`
- explain/chat methods used by `AterExplainDialog` and the Oracle route.

Response quality requirements:

- General chat: welcoming, Socratic, specific to the simulated course.
- Explain with AI: structured pedagogical breakdown with mental model, formal definition, example, common trap, and recall question.
- Practice generation: pre-baked quiz with MCQ and Feynman/writing questions.
- Ingestion: deterministic curriculum detection, plan generation, and deployment completion using the distributed systems source PDF.

## Sidecar API Routing

`sidecarApi` remains the public interface used by routes. It must route through simulation before native IPC:

```ts
if (isSimulationMode()) {
  return simulationSidecarApi.method(args);
}
return invoke(...);
```

For methods protected by feature locks or credit deduction, the simulation branch must run before `enforceFeatureLock` and `deductCredits`.

This ordering matters. In simulation, the app must not block on real entitlements or credits.

## State Isolation

The in-memory simulation state module should support:

```ts
createSimulationState(): SimulationState
getSimulationState(): SimulationState
resetSimulationState(): SimulationState
patchSimulationNote(path: string, content: string): SimulationMutationResult
recordSimulationPracticeResult(result: SimulationPracticeResult): SimulationMutationResult
```

It must not import `getAppStore`, `invoke`, Supabase clients, Node filesystem APIs, or Tauri plugins.

Static seed data can live in TypeScript files. Mutable state must be cloned from the seed data. No route should mutate the seed constants directly.

## Factory Reset Contract

Factory reset must become an explicit, verifiable lifecycle operation.

Rust command `factory_reset` should:

1. Terminate sidecar/watchers.
2. Wait for sidecar process exit or return a clear timeout error.
3. Purge known app config, app data, local Ater data, and vault-owned Ater metadata.
4. Verify the purge by checking the paths/files are absent.
5. Return a structured result:

```json
{
  "success": true,
  "terminatedSidecar": true,
  "purged": ["..."],
  "verified": ["..."],
  "restartRequired": true
}
```

Frontend reset should:

1. Call `sidecarApi.factoryReset()`.
2. Validate `success === true`.
3. Clear in-memory stores such as pomodoro/practice UI state.
4. Relaunch only after the reset command returns success.
5. Show a specific error if purge verification fails.

The Rust command should not call `tauri::process::restart` before returning a result, because the frontend cannot verify completion if the process exits immediately.

## Testing Strategy

Tests must cover the foundation before any exhaustive tour implementation:

- App mode transition tests:
  - default mode is `real`
  - entering simulation sets simulation mode
  - exiting simulation clears memory and returns to real mode
- Ghost Vault tests:
  - contains the Distributed Systems hub and at least eight notes
  - note updates mutate memory only
  - reset restores seed content
- Sidecar routing tests:
  - simulation branch does not call `invoke`
  - simulation AI calls do not call credit or Supabase paths
  - real branch still calls existing IPC methods
- Mock AI tests:
  - chat/explain/practice responses are deterministic
  - ingestion process, plan, and confirm flow succeeds without API key
- Factory reset tests:
  - frontend relaunch waits for structured success
  - frontend surfaces verification failure
  - Rust unit or integration coverage validates purge verification helpers where practical

## Implementation Boundaries

Prefer small files:

- `apps/desktop/src/lib/appMode.ts`
- `apps/desktop/src/lib/simulation/seed.ts`
- `apps/desktop/src/lib/simulation/state.ts`
- `apps/desktop/src/lib/simulation/adapter.ts`
- `apps/desktop/src/context/SimulationContext.tsx`
- targeted `sidecarApi.ts` routing edits
- targeted `ConfigContext.tsx` mode compatibility edits
- targeted `settings.tsx` factory reset behavior edits
- targeted Rust helper extraction for factory reset verification

Avoid broad route rewrites in Phase 1. The goal is to make existing routes work against a simulation backend.

## Self-Review

### Placeholder Scan

No placeholder requirements remain. Each Phase 1 responsibility identifies the owning boundary and expected behavior.

### Internal Consistency

The design consistently treats `appMode` as the source of truth and `isDemoMode` as a temporary compatibility alias. Simulation mutations are memory-only throughout the provider, adapter, and Ghost Vault sections.

### Scope Check

The original request spans simulation, exhaustive tour, global theme audit, and factory reset. This design intentionally scopes Phase 1 to platform foundation and factory reset hardening. Exhaustive tour and full theme audit are deferred to later phases.

### Ambiguity Check

The only allowed simulation persistence is the explicit mode transition. Simulated notes, generated plans, practice logs, keys, academic rows, and vault paths are not persisted.
