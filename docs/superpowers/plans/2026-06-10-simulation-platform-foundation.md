# Simulation Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a memory-only simulation foundation so Ater can run a zero-key, zero-disk-write guest mode before the exhaustive tour is implemented.

**Architecture:** Add a first-class `appMode` boundary, a React `SimulationProvider`, a Ghost Vault seed/state module, and a deterministic simulation sidecar adapter. Existing routes continue calling `sidecarApi`, which routes to the simulation adapter before native IPC, credit checks, or Supabase paths when simulation mode is active.

**Tech Stack:** React, TypeScript, Vitest, Tauri IPC, Rust, existing shadcn/Radix UI components, existing desktop package scripts.

---

## File Structure

- Create `apps/desktop/src/lib/appMode.ts`: shared mode types and in-memory mode helpers used by non-React modules.
- Create `apps/desktop/src/lib/simulation/seed.ts`: immutable Ghost Vault seed data.
- Create `apps/desktop/src/lib/simulation/state.ts`: cloned memory state and mutation helpers.
- Create `apps/desktop/src/lib/simulation/adapter.ts`: deterministic sidecar API simulation methods.
- Create `apps/desktop/src/context/SimulationContext.tsx`: React provider and hook.
- Modify `apps/desktop/src/lib/ConfigContext.tsx`: add `appMode` and `isDemoMode` compatibility.
- Modify `apps/desktop/src/App.tsx`: mount `SimulationProvider`.
- Modify `apps/desktop/src/lib/sidecarApi.ts`: route simulation branches before IPC, feature locks, and credit deductions.
- Modify `apps/desktop/src/routes/settings.tsx`: validate structured factory-reset success before relaunch.
- Modify `apps/desktop/src-tauri/src/commands.rs`: return structured reset results and verify purge before frontend relaunch.
- Add tests under `apps/desktop/src/tests/` for app mode, simulation state, simulation adapter, sidecar routing, and settings reset behavior.

## Task 1: App Mode Boundary

**Files:**
- Create: `apps/desktop/src/lib/appMode.ts`
- Modify: `apps/desktop/src/lib/ConfigContext.tsx`
- Test: `apps/desktop/src/tests/appMode.test.ts`

- [ ] **Step 1: Write the failing app mode test**

Create `apps/desktop/src/tests/appMode.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getRuntimeAppMode,
  isSimulationMode,
  setRuntimeAppMode,
  toAppMode,
} from '@/lib/appMode'

describe('appMode', () => {
  it('defaults to real mode', () => {
    setRuntimeAppMode('real')

    expect(getRuntimeAppMode()).toBe('real')
    expect(isSimulationMode()).toBe(false)
  })

  it('normalizes legacy demo flags to simulation', () => {
    expect(toAppMode('simulation', false)).toBe('simulation')
    expect(toAppMode(undefined, true)).toBe('simulation')
    expect(toAppMode('real', false)).toBe('real')
  })

  it('tracks simulation mode for non-React API routing', () => {
    setRuntimeAppMode('simulation')

    expect(getRuntimeAppMode()).toBe('simulation')
    expect(isSimulationMode()).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/appMode.test.ts
```

Expected: FAIL because `@/lib/appMode` does not exist.

- [ ] **Step 3: Add the app mode implementation**

Create `apps/desktop/src/lib/appMode.ts`:

```ts
export type AppMode = 'real' | 'simulation'

let runtimeAppMode: AppMode = 'real'

export function toAppMode(value: unknown, legacyIsDemoMode?: boolean): AppMode {
  if (value === 'simulation') return 'simulation'
  if (legacyIsDemoMode === true) return 'simulation'
  return 'real'
}

export function setRuntimeAppMode(mode: AppMode) {
  runtimeAppMode = mode
}

export function getRuntimeAppMode(): AppMode {
  return runtimeAppMode
}

export function isSimulationMode(): boolean {
  return runtimeAppMode === 'simulation'
}
```

- [ ] **Step 4: Add config typing and initialization**

Modify `apps/desktop/src/lib/ConfigContext.tsx`:

```ts
import { AppMode, setRuntimeAppMode, toAppMode } from '@/lib/appMode'
```

Add to `AppConfig`:

```ts
appMode: AppMode;
```

Add to `DEFAULT_CONFIG`:

```ts
appMode: 'real',
```

In store initialization, load app mode next to `isDemoMode`:

```ts
const rawAppMode = await store.get<string>('appMode');
const isDemoMode = (await store.get<boolean>('isDemoMode')) ?? false;
const appMode = toAppMode(rawAppMode, isDemoMode);
```

Add `appMode` to `loadedConfig`:

```ts
appMode,
isDemoMode: appMode === 'simulation',
```

In the development bypass block, set both values:

```ts
loadedConfig.appMode = 'simulation';
loadedConfig.isDemoMode = true;
```

After `setConfig(loadedConfig)`, sync the runtime mode:

```ts
setRuntimeAppMode(loadedConfig.appMode);
```

In `saveConfig`, compute and sync the compatibility pair before writing:

```ts
const nextMode = toAppMode((newConfig as any).appMode ?? config.appMode, (newConfig as any).isDemoMode ?? config.isDemoMode);
const updatedConfig = {
  ...config,
  ...newConfig,
  appMode: nextMode,
  isDemoMode: nextMode === 'simulation',
} as any;
setRuntimeAppMode(nextMode);
```

When writing `newConfig` keys, ensure a passed `appMode` also writes the legacy alias:

```ts
const entries = { ...newConfig } as any;
if ('appMode' in entries || 'isDemoMode' in entries) {
  entries.appMode = nextMode;
  entries.isDemoMode = nextMode === 'simulation';
}
for (const key of Object.keys(entries)) {
  const val = entries[key];
  if (val === undefined) {
    try { await store.delete(key); } catch { /* key may not exist yet */ }
  } else {
    await store.set(key, val);
  }
}
```

- [ ] **Step 5: Run app mode test to verify GREEN**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/appMode.test.ts
```

Expected: PASS.

## Task 2: Ghost Vault Seed and Memory State

**Files:**
- Create: `apps/desktop/src/lib/simulation/seed.ts`
- Create: `apps/desktop/src/lib/simulation/state.ts`
- Test: `apps/desktop/src/tests/simulationState.test.ts`

- [ ] **Step 1: Write the failing Ghost Vault state tests**

Create `apps/desktop/src/tests/simulationState.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  createSimulationState,
  getSimulationState,
  patchSimulationNote,
  resetSimulationState,
} from '@/lib/simulation/state'

describe('simulation state', () => {
  it('seeds a distributed systems ghost vault', () => {
    const state = createSimulationState()

    expect(state.profile.name).toBe('Maya Chen')
    expect(state.profile.course).toBe('CS 342: Distributed Systems')
    expect(state.hubs[0].title).toBe('Distributed Systems')
    expect(state.notes).toHaveLength(8)
    expect(state.files.some((file) => file.path === 'Inbox/Distributed_Systems_Primer.pdf')).toBe(true)
  })

  it('keeps note updates in memory and resets to seed content', () => {
    resetSimulationState()
    const original = getSimulationState().notesByPath['Notes/Consensus.md'].content

    patchSimulationNote('Notes/Consensus.md', 'temporary edit')

    expect(getSimulationState().notesByPath['Notes/Consensus.md'].content).toBe('temporary edit')

    resetSimulationState()

    expect(getSimulationState().notesByPath['Notes/Consensus.md'].content).toBe(original)
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/simulationState.test.ts
```

Expected: FAIL because simulation state modules do not exist.

- [ ] **Step 3: Add the Ghost Vault seed**

Create `apps/desktop/src/lib/simulation/seed.ts`:

```ts
import type { ObsidianFile } from '@/lib/sidecarApi'

export interface SimulationProfile {
  name: string
  program: string
  course: string
  semester: string
  activeUnit: string
}

export interface SimulationNote {
  path: string
  title: string
  metadata: Record<string, unknown>
  content: string
}

export interface SimulationHub {
  id: string
  title: string
  description: string
  notePaths: string[]
}

export interface SimulationPdfWaypoint {
  id: string
  label: string
  page: number
  notePath: string
}

export interface SimulationState {
  profile: SimulationProfile
  hubs: SimulationHub[]
  notes: SimulationNote[]
  notesByPath: Record<string, SimulationNote>
  files: ObsidianFile[]
  pdfWaypoints: SimulationPdfWaypoint[]
  practiceHistory: Array<Record<string, unknown>>
}

const note = (path: string, title: string, content: string, extra: Record<string, unknown> = {}): SimulationNote => ({
  path,
  title,
  metadata: {
    title,
    type: 'Atomic Note',
    course: 'CS 342: Distributed Systems',
    semester: 'Semester VI',
    hub: '[[Distributed_Systems_Hub]]',
    generated: true,
    ...extra,
  },
  content,
})

export const SIMULATION_NOTES: SimulationNote[] = [
  note('Notes/Consensus.md', 'Consensus', `# Consensus

Consensus is the problem of getting distributed processes to agree on one value despite delay, message reordering, and partial failure.

## Mental model

Imagine a lab team trying to publish one final measurement while some instruments lag behind. Consensus is the protocol discipline that prevents two conflicting final answers.

## Recall prompt

Why does agreement matter more than speed when replicated state machines serve user writes?
`),
  note('Notes/Raft_Leader_Election.md', 'Raft Leader Election', `# Raft Leader Election

Raft elects one leader per term. Followers become candidates after an election timeout, request votes, and become leader only after receiving a majority.

## Common trap

A node with stale logs should not win leadership simply because it timed out first.
`),
  note('Notes/Log_Replication.md', 'Log Replication', `# Log Replication

Leaders append commands to their logs, replicate entries to followers, and commit once a majority has stored the entry.

## Invariant

If two logs contain an entry with the same index and term, all previous entries are identical.
`),
  note('Notes/Vector_Clocks.md', 'Vector Clocks', `# Vector Clocks

Vector clocks track causality by storing one logical counter per participant. They can prove one event happened before another or detect concurrency.
`),
  note('Notes/CAP_Theorem.md', 'CAP Theorem', `# CAP Theorem

CAP says a distributed system facing a network partition must choose between availability and linearizable consistency.
`),
  note('Notes/Quorum_Reads_Writes.md', 'Quorum Reads and Writes', `# Quorum Reads and Writes

Quorum systems choose read and write set sizes so operations overlap. The overlap lets readers observe the latest committed write.
`),
  note('Notes/Failure_Detectors.md', 'Failure Detectors', `# Failure Detectors

Failure detectors convert missing heartbeats into suspicion. They are useful but imperfect because slow nodes can look dead.
`),
  note('Notes/Gossip_Protocols.md', 'Gossip Protocols', `# Gossip Protocols

Gossip protocols spread membership or state by repeated random peer exchange. They trade precision for robustness and scale.
`),
]

export const SIMULATION_SEED: SimulationState = {
  profile: {
    name: 'Maya Chen',
    program: 'B.S. Computer Science',
    course: 'CS 342: Distributed Systems',
    semester: 'Semester VI',
    activeUnit: 'Fault Tolerance and Replication',
  },
  hubs: [
    {
      id: 'distributed_systems_hub',
      title: 'Distributed Systems',
      description: 'Fault tolerance, consensus, replication, causality, and large-scale coordination.',
      notePaths: SIMULATION_NOTES.map((entry) => entry.path),
    },
  ],
  notes: SIMULATION_NOTES,
  notesByPath: Object.fromEntries(SIMULATION_NOTES.map((entry) => [entry.path, entry])),
  files: [
    { name: 'Notes', path: 'Notes', is_dir: true },
    ...SIMULATION_NOTES.map((entry) => ({ name: `${entry.title}.md`, path: entry.path, is_dir: false, size: entry.content.length })),
    { name: 'Inbox', path: 'Inbox', is_dir: true },
    { name: 'Distributed_Systems_Primer.pdf', path: 'Inbox/Distributed_Systems_Primer.pdf', is_dir: false, size: 1_572_864 },
  ],
  pdfWaypoints: [
    { id: 'consensus-problem', label: 'Consensus Problem', page: 3, notePath: 'Notes/Consensus.md' },
    { id: 'leader-election', label: 'Leader Election', page: 7, notePath: 'Notes/Raft_Leader_Election.md' },
    { id: 'replication-invariants', label: 'Replication Invariants', page: 11, notePath: 'Notes/Log_Replication.md' },
    { id: 'causal-ordering', label: 'Causal Ordering', page: 15, notePath: 'Notes/Vector_Clocks.md' },
  ],
  practiceHistory: [],
}
```

- [ ] **Step 4: Add the in-memory state implementation**

Create `apps/desktop/src/lib/simulation/state.ts`:

```ts
import { SIMULATION_SEED, SimulationState } from './seed'

function cloneState(seed: SimulationState): SimulationState {
  return structuredClone(seed)
}

let currentState: SimulationState = cloneState(SIMULATION_SEED)

export function createSimulationState(): SimulationState {
  return cloneState(SIMULATION_SEED)
}

export function getSimulationState(): SimulationState {
  return currentState
}

export function resetSimulationState(): SimulationState {
  currentState = cloneState(SIMULATION_SEED)
  return currentState
}

export function patchSimulationNote(path: string, content: string) {
  const existing = currentState.notesByPath[path]
  if (!existing) {
    return { success: false, error: `Simulation note not found: ${path}` }
  }

  const updated = { ...existing, content }
  currentState.notesByPath[path] = updated
  currentState.notes = currentState.notes.map((entry) => (entry.path === path ? updated : entry))
  currentState.files = currentState.files.map((file) => (file.path === path ? { ...file, size: content.length } : file))

  return { success: true, path }
}
```

- [ ] **Step 5: Run state tests to verify GREEN**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/simulationState.test.ts
```

Expected: PASS.

## Task 3: Simulation Adapter

**Files:**
- Create: `apps/desktop/src/lib/simulation/adapter.ts`
- Test: `apps/desktop/src/tests/simulationAdapter.test.ts`

- [ ] **Step 1: Write failing adapter tests**

Create `apps/desktop/src/tests/simulationAdapter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { simulationSidecarApi } from '@/lib/simulation/adapter'
import { resetSimulationState } from '@/lib/simulation/state'

describe('simulation sidecar adapter', () => {
  it('returns deterministic vault files and notes', async () => {
    resetSimulationState()

    const files = await simulationSidecarApi.listObsidianFiles()
    const note = await simulationSidecarApi.readObsidianNote('Notes/Consensus.md')

    expect(files.files.some((file) => file.path === 'Notes/Consensus.md')).toBe(true)
    expect(note.content).toContain('Consensus is the problem')
  })

  it('provides zero-key AI and ingestion responses', async () => {
    await expect(simulationSidecarApi.testAiConnection()).resolves.toMatchObject({ success: true })
    await expect(simulationSidecarApi.aterProcess({ file_path: 'Inbox/Distributed_Systems_Primer.pdf' })).resolves.toMatchObject({
      curriculum: expect.objectContaining({ hub_title: 'Distributed Systems' }),
    })
    await expect(simulationSidecarApi.generatePracticeQuestions()).resolves.toMatchObject({
      questions: expect.arrayContaining([expect.objectContaining({ type: 'multiple-choice' })]),
    })
  })

  it('records simulated practice only in memory', async () => {
    resetSimulationState()

    await simulationSidecarApi.logPracticeResult({ score: 1, total: 1, hubId: 'distributed_systems_hub' })
    const history = await simulationSidecarApi.getStudyHistory()

    expect(history.practice).toHaveLength(1)

    resetSimulationState()
    await expect(simulationSidecarApi.getStudyHistory()).resolves.toMatchObject({ practice: [] })
  })
})
```

- [ ] **Step 2: Run adapter tests to verify RED**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/simulationAdapter.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the deterministic adapter**

Create `apps/desktop/src/lib/simulation/adapter.ts`:

```ts
import {
  getSimulationState,
  patchSimulationNote,
} from './state'

export const simulationSidecarApi = {
  health: async () => ({ status: 'ok', version: 'simulation' }),
  listObsidianFiles: async () => ({ files: getSimulationState().files }),
  readObsidianNote: async (path: string) => {
    const cleanPath = path.replace(/\\/g, '/')
    const note = getSimulationState().notesByPath[cleanPath]
    return note ? { metadata: note.metadata, content: note.content } : { metadata: {}, content: '' }
  },
  updateObsidianNote: async (path: string, content: string) => patchSimulationNote(path.replace(/\\/g, '/'), content),
  createObsidianFile: async (path: string, content = '') => patchSimulationNote(path.replace(/\\/g, '/'), content),
  createObsidianFolder: async (path: string) => ({ success: true, path }),
  deleteObsidianItem: async (path: string) => ({ success: true, path }),
  moveObsidianItem: async (oldPath: string, newPath: string) => ({ success: true, oldPath, newPath }),
  findVaultPage: async (pageName: string) => {
    const match = getSimulationState().notes.find((note) => note.title === pageName || note.path.endsWith(`${pageName}.md`))
    return match ? { found: true, path: match.path } : { found: false }
  },
  getVaultGraph: async () => ({
    nodes: getSimulationState().notes.map((note) => ({ id: note.path, label: note.title.replaceAll('_', ' '), group: 1 })),
    links: [
      { source: 'Notes/Raft_Leader_Election.md', target: 'Notes/Consensus.md' },
      { source: 'Notes/Log_Replication.md', target: 'Notes/Consensus.md' },
      { source: 'Notes/Vector_Clocks.md', target: 'Notes/Gossip_Protocols.md' },
    ],
  }),
  getVaultBacklinks: async (pageName: string) => ({
    backlinks: getSimulationState().notes
      .filter((note) => note.content.includes(pageName))
      .map((note) => ({ path: note.path, title: note.title })),
  }),
  listVaultDatabases: async () => ({
    databases: [
      { id: 'years', name: 'Years', type: 'obsidian', schema: {} },
      { id: 'semesters', name: 'Semesters', type: 'obsidian', schema: {} },
      { id: 'courses', name: 'Courses', type: 'obsidian', schema: {} },
      { id: 'study_sessions', name: 'Study Planner', type: 'obsidian', schema: {} },
    ],
  }),
  queryVaultDatabase: async (dbName: string) => simulationSidecarApi.listVaultDatabaseRows(dbName),
  listVaultDatabaseRows: async (dbName: string) => {
    const { profile } = getSimulationState()
    const rows: Record<string, unknown[]> = {
      years: [{ id: 'year_3', title: 'Year III', Status: '[[Active]]', Program: `[[${profile.program}]]` }],
      semesters: [{ id: 'semester_6', title: profile.semester, Status: '[[Active]]' }],
      courses: [{ id: 'cs_342', title: profile.course, semester: profile.semester, Credits: '4' }],
      study_sessions: [{ id: 'fault_tolerance', title: profile.activeUnit, course: `[[${profile.course}]]`, status: '[[In Progress]]' }],
    }
    return { results: rows[dbName] ?? [] }
  },
  getVaultOptions: async (source: string) => ({ options: source === 'hubs' ? ['Distributed Systems'] : [] }),
  testAiConnection: async () => ({ success: true, message: 'Simulation AI is ready. No API key required.' }),
  aterListInbox: async () => ({ files: [{ name: 'Distributed_Systems_Primer.pdf', path: 'Inbox/Distributed_Systems_Primer.pdf', size: 1_572_864 }] }),
  aterListGenerated: async () => ({ notes: getSimulationState().notes.map((note) => ({ path: note.path, title: note.title })) }),
  aterProcess: async (_payload?: unknown) => ({
    session_id: 'simulation-ingest-session',
    curriculum: {
      course: 'CS 342: Distributed Systems',
      semester: 'Semester VI',
      unit: 'Fault Tolerance and Replication',
      hub_title: 'Distributed Systems',
    },
  }),
  aterGeneratePlan: async (_payload?: unknown) => ({
    session_id: 'simulation-ingest-session',
    plan: {
      hub_note: 'Distributed_Systems_Hub.md',
      practice_note: 'Distributed_Systems_Practice.md',
      atomic_notes: getSimulationState().notes.map((note, index) => ({
        title: note.title,
        level: index < 2 ? 'foundation' : 'application',
        source_pages: [index + 3],
        mode: 'CS',
      })),
    },
  }),
  aterConfirm: async () => ({
    done: true,
    status: 'complete',
    created_notes: getSimulationState().notes.map((note) => note.path),
  }),
  aterQueueStatus: async () => ({
    status: 'idle',
    auto_process: false,
    current_file: null,
    current_batch: 8,
    total_batches: 8,
    last_action: 'Simulation deployment completed',
    processed_notes: getSimulationState().notes.map((note) => ({ path: note.path, title: note.title })),
    planned_batches: [],
    pending_count: 0,
    pending_files: [],
  }),
  explainWithAi: async () => ({
    answer: `## Mental model

Consensus is a contract that keeps replicas from publishing conflicting histories.

## Formal shape

The system needs agreement, validity, and termination. Agreement prevents split-brain. Validity prevents invented values. Termination keeps the protocol useful.

## Recall question

What failure would users observe if two leaders committed different commands at the same log index?`,
  }),
  chat: async (message: string) => ({
    answer: message.toLowerCase().includes('hello')
      ? 'Welcome to the simulated Distributed Systems lab. I can help you reason through consensus, replication, quorums, and causal ordering.'
      : 'Let us test the idea against failure: which node can be slow, partitioned, or stale while the system still preserves the invariant?',
  }),
  generatePracticeQuestions: async () => ({
    questions: [
      {
        id: 'sim-mcq-1',
        type: 'multiple-choice',
        question: 'Which property prevents two replicas from deciding different committed values?',
        options: ['Availability', 'Agreement', 'Throughput', 'Fanout'],
        answer: 'Agreement',
        explanation: 'Agreement is the consensus property that forbids conflicting decisions.',
      },
      {
        id: 'sim-feynman-1',
        type: 'writing',
        question: 'Explain Raft leader election to a junior engineer using one concrete failure example.',
        required_keywords: ['term', 'majority', 'timeout', 'log'],
      },
    ],
  }),
  gradePracticeAnswer: async () => ({
    correct: true,
    score: 0.92,
    feedback: 'Strong answer. You connected terms, majority voting, and stale-log prevention.',
  }),
  logPracticeResult: async (result: Record<string, unknown>) => {
    getSimulationState().practiceHistory.push({ ...result, date: new Date().toISOString() })
    return { success: true }
  },
  getStudyHistory: async () => ({
    sessions: [],
    telemetry: [],
    practice: getSimulationState().practiceHistory,
  }),
}
```

- [ ] **Step 4: Run adapter tests to verify GREEN**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/simulationAdapter.test.ts
```

Expected: PASS.

## Task 4: Simulation Provider

**Files:**
- Create: `apps/desktop/src/context/SimulationContext.tsx`
- Modify: `apps/desktop/src/App.tsx`
- Test: `apps/desktop/src/tests/SimulationContext.test.tsx`

- [ ] **Step 1: Write the failing provider test**

Create `apps/desktop/src/tests/SimulationContext.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SimulationProvider, useSimulation } from '@/context/SimulationContext'

const saveConfig = vi.fn()

vi.mock('@/lib/ConfigContext', () => ({
  useConfig: () => ({
    config: { appMode: 'real', isDemoMode: false },
    saveConfig,
  }),
}))

function Probe() {
  const simulation = useSimulation()
  return (
    <div>
      <div data-testid="mode">{simulation.appMode}</div>
      <div data-testid="profile">{simulation.profile.name}</div>
      <button onClick={simulation.enterSimulation}>enter</button>
      <button onClick={simulation.exitSimulation}>exit</button>
    </div>
  )
}

describe('SimulationProvider', () => {
  it('enters and exits simulation through config mode only', async () => {
    const user = userEvent.setup()

    render(
      <SimulationProvider>
        <Probe />
      </SimulationProvider>,
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('real')
    expect(screen.getByTestId('profile')).toHaveTextContent('Maya Chen')

    await user.click(screen.getByText('enter'))
    expect(saveConfig).toHaveBeenCalledWith({ appMode: 'simulation', isDemoMode: true })

    await user.click(screen.getByText('exit'))
    expect(saveConfig).toHaveBeenCalledWith({ appMode: 'real', isDemoMode: false })
  })
})
```

- [ ] **Step 2: Run provider test to verify RED**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/SimulationContext.test.tsx
```

Expected: FAIL because `SimulationContext` does not exist.

- [ ] **Step 3: Implement SimulationProvider**

Create `apps/desktop/src/context/SimulationContext.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { AppMode, setRuntimeAppMode, toAppMode } from '@/lib/appMode'
import { useConfig } from '@/lib/ConfigContext'
import { getSimulationState, resetSimulationState } from '@/lib/simulation/state'
import type { SimulationProfile, SimulationState } from '@/lib/simulation/seed'

interface SimulationContextValue {
  appMode: AppMode
  isSimulation: boolean
  profile: SimulationProfile
  vault: SimulationState
  enterSimulation: () => Promise<void>
  exitSimulation: () => Promise<void>
  resetSimulation: () => void
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { config, saveConfig } = useConfig()
  const appMode = toAppMode(config?.appMode, config?.isDemoMode)
  const vault = getSimulationState()

  setRuntimeAppMode(appMode)

  const enterSimulation = useCallback(async () => {
    resetSimulationState()
    setRuntimeAppMode('simulation')
    await saveConfig({ appMode: 'simulation', isDemoMode: true } as any)
  }, [saveConfig])

  const exitSimulation = useCallback(async () => {
    resetSimulationState()
    setRuntimeAppMode('real')
    await saveConfig({ appMode: 'real', isDemoMode: false } as any)
  }, [saveConfig])

  const resetSimulation = useCallback(() => {
    resetSimulationState()
  }, [])

  const value = useMemo<SimulationContextValue>(
    () => ({
      appMode,
      isSimulation: appMode === 'simulation',
      profile: vault.profile,
      vault,
      enterSimulation,
      exitSimulation,
      resetSimulation,
    }),
    [appMode, vault, enterSimulation, exitSimulation, resetSimulation],
  )

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider')
  }
  return context
}
```

- [ ] **Step 4: Mount provider in App**

Modify `apps/desktop/src/App.tsx`:

```tsx
import { SimulationProvider } from '@/context/SimulationContext'
```

Wrap the existing app routes inside `ConfigProvider`:

```tsx
<ConfigProvider>
  <SimulationProvider>
    <UpdateChecker />
    <SecurityBlocker />
    <AppRoutes />
  </SimulationProvider>
</ConfigProvider>
```

- [ ] **Step 5: Run provider test to verify GREEN**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/SimulationContext.test.tsx
```

Expected: PASS.

## Task 5: Sidecar Simulation Routing

**Files:**
- Modify: `apps/desktop/src/lib/sidecarApi.ts`
- Test: `apps/desktop/src/tests/sidecarSimulationRouting.test.ts`

- [ ] **Step 1: Write failing routing tests**

Create `apps/desktop/src/tests/sidecarSimulationRouting.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { setRuntimeAppMode } from '@/lib/appMode'
import { sidecarApi } from '@/lib/sidecarApi'

describe('sidecarApi simulation routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRuntimeAppMode('real')
  })

  it('does not call native IPC for simulated note reads or AI connection tests', async () => {
    setRuntimeAppMode('simulation')

    await expect(sidecarApi.readObsidianNote('Notes/Consensus.md')).resolves.toMatchObject({
      content: expect.stringContaining('Consensus is the problem'),
    })
    await expect(sidecarApi.testAiConnection()).resolves.toMatchObject({ success: true })

    expect(invoke).not.toHaveBeenCalled()
  })

  it('routes simulated ingestion before native IPC', async () => {
    setRuntimeAppMode('simulation')

    const result = await sidecarApi.aterProcess({ file_path: 'Inbox/Distributed_Systems_Primer.pdf' })

    expect(result.curriculum.hub_title).toBe('Distributed Systems')
    expect(invoke).not.toHaveBeenCalled()
  })

  it('keeps real mode native routing intact', async () => {
    setRuntimeAppMode('real')
    vi.mocked(invoke).mockResolvedValueOnce({ success: true, message: 'ok' })

    await sidecarApi.testAiConnection()

    expect(invoke).toHaveBeenCalledWith('test_ai_connection', { target: 'primary', overrideConfig: null })
  })
})
```

- [ ] **Step 2: Run routing tests to verify RED**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/sidecarSimulationRouting.test.ts
```

Expected: FAIL because `sidecarApi` still uses legacy demo checks or native IPC for some simulation paths.

- [ ] **Step 3: Add routing imports and helper**

Modify `apps/desktop/src/lib/sidecarApi.ts`:

```ts
import { isSimulationMode } from '@/lib/appMode'
import { simulationSidecarApi } from '@/lib/simulation/adapter'
```

Update `isDemoActive` to honor app mode:

```ts
async function isDemoActive(): Promise<boolean> {
    if (isSimulationMode()) {
        return true
    }
    if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
        return true
    }
    try {
        const store = await getAppStore()
        return (await store.get<boolean>('isDemoMode')) ?? false
    } catch {
        return false
    }
}
```

- [ ] **Step 4: Route high-risk methods through the adapter before feature locks and credits**

For each method, place the simulation branch as the first line in the method body:

```ts
if (isSimulationMode()) return simulationSidecarApi.readObsidianNote(path)
```

Apply this pattern to:

```ts
health
listVaultDatabases
queryVaultDatabase
listVaultDatabaseRows
getVaultOptions
findVaultPage
getVaultGraph
getVaultBacklinks
testAiConnection
listObsidianFiles
readObsidianNote
updateObsidianNote
deleteObsidianItem
createObsidianFile
createObsidianFolder
moveObsidianItem
aterProcess
aterGeneratePlan
aterConfirm
aterQueueStatus
getStudyHistory
```

Example for `aterProcess`:

```ts
aterProcess: async (payload: { file_path?: string; text?: string; target_hub_id?: string }) => {
    if (isSimulationMode()) return simulationSidecarApi.aterProcess(payload)
    enforceFeatureLock('ai-features')
    await deductCredits('ater_generation')
    try {
        return await invoke<any>('ater_process', { payload })
    } catch (err) {
        console.error('[Tauri Native RAG] aterProcess failed:', err)
        throw err
    }
},
```

Example for `testAiConnection`:

```ts
testAiConnection: async (target: 'primary' = 'primary', overrideConfig?: any) => {
    if (isSimulationMode()) return simulationSidecarApi.testAiConnection()
    try {
        return await invoke<any>('test_ai_connection', { target, overrideConfig: overrideConfig ?? null })
    } catch (err) {
        console.error('[Tauri Native RAG] testAiConnection failed:', err)
        return { success: false, message: 'Connection failed', error: String(err) }
    }
},
```

- [ ] **Step 5: Run routing tests to verify GREEN**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/sidecarSimulationRouting.test.ts
```

Expected: PASS.

## Task 6: Factory Reset Frontend Contract

**Files:**
- Modify: `apps/desktop/src/routes/settings.tsx`
- Test: `apps/desktop/src/tests/Settings.test.tsx`

- [ ] **Step 1: Add failing settings reset tests**

Update imports in `apps/desktop/src/tests/Settings.test.tsx`:

```ts
import userEvent from '@testing-library/user-event';
import { sidecarApi } from '../lib/sidecarApi';
```

Add this process mock after the existing sidecar mock:

```ts
const relaunch = vi.fn();

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch,
}));
```

Add this render helper inside `describe('Settings Panel', () => { ... })`:

```tsx
function renderSettings() {
  return render(
    <MemoryRouter>
      <ConfigProvider>
        <HeaderProvider>
          <Settings />
        </HeaderProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
}
```

Append these tests:

```ts
it('does not relaunch when factory reset verification fails', async () => {
  vi.mocked(sidecarApi.factoryReset).mockResolvedValueOnce({
    success: false,
    restartRequired: false,
    error: 'Purge verification failed',
  })

  render(<Settings />)

  await userEvent.click(screen.getByText(/Factory Reset/i))
  await userEvent.click(screen.getByRole('button', { name: /Confirm/i }))

  expect(sidecarApi.factoryReset).toHaveBeenCalled()
  expect(relaunch).not.toHaveBeenCalled()
  expect(await screen.findByText(/Purge verification failed/i)).toBeInTheDocument()
})

it('relaunches only after structured factory reset success', async () => {
  vi.mocked(sidecarApi.factoryReset).mockResolvedValueOnce({
    success: true,
    terminatedSidecar: true,
    purged: ['ater_config.json'],
    verified: ['ater_config.json'],
    restartRequired: true,
  })

  render(<Settings />)

  await userEvent.click(screen.getByText(/Factory Reset/i))
  await userEvent.click(screen.getByRole('button', { name: /Confirm/i }))

  expect(sidecarApi.factoryReset).toHaveBeenCalled()
  expect(relaunch).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run Settings test to verify RED**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/Settings.test.tsx
```

Expected: FAIL because the current frontend treats reset as successful too loosely or the test selectors need alignment with the rendered dialog.

- [ ] **Step 3: Harden frontend reset behavior**

Modify `handleFactoryReset` in `apps/desktop/src/routes/settings.tsx`:

```ts
const res = await sidecarApi.factoryReset();
if (!res?.success) {
  throw new Error(res?.error || 'Factory reset did not complete. No relaunch was attempted.');
}
if (res.restartRequired !== true) {
  throw new Error('Factory reset completed without a restart instruction.');
}
clearLocalHistory();
toast.success('System has been factory reset. Restarting...');
const { relaunch } = await import('@tauri-apps/plugin-process');
setTimeout(() => relaunch(), 1500);
```

Keep the catch branch specific:

```ts
toast.error('Factory reset failed: ' + (err instanceof Error ? err.message : String(err)));
```

- [ ] **Step 4: Run Settings test to verify GREEN**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/Settings.test.tsx
```

Expected: PASS.

## Task 7: Factory Reset Rust Contract

**Files:**
- Modify: `apps/desktop/src-tauri/src/commands.rs`

- [ ] **Step 1: Extract reset result structures**

In `apps/desktop/src-tauri/src/commands.rs`, near `factory_reset`, add:

```rust
#[derive(serde::Serialize)]
struct FactoryResetResult {
    success: bool,
    terminated_sidecar: bool,
    purged: Vec<String>,
    verified: Vec<String>,
    restart_required: bool,
}

fn remove_path_if_exists(path: &std::path::Path, purged: &mut Vec<String>) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }
    if path.is_dir() {
        std::fs::remove_dir_all(path).map_err(|e| format!("Failed to remove {}: {}", path.display(), e))?;
    } else {
        std::fs::remove_file(path).map_err(|e| format!("Failed to remove {}: {}", path.display(), e))?;
    }
    purged.push(path.display().to_string());
    Ok(())
}

fn verify_absent(path: &std::path::Path, verified: &mut Vec<String>) -> Result<(), String> {
    if path.exists() {
        return Err(format!("Purge verification failed: {} still exists", path.display()));
    }
    verified.push(path.display().to_string());
    Ok(())
}
```

- [ ] **Step 2: Replace immediate restart with structured return**

Modify `factory_reset` so it accumulates purged and verified paths, then returns JSON:

```rust
let mut purged = Vec::new();
let mut verified = Vec::new();
let mut verification_paths: Vec<std::path::PathBuf> = Vec::new();
```

For each path currently removed, use:

```rust
remove_path_if_exists(&persist_dir, &mut purged)?;
verification_paths.push(persist_dir);
```

After all removals:

```rust
for path in &verification_paths {
    verify_absent(path, &mut verified)?;
}

Ok(serde_json::to_value(FactoryResetResult {
    success: true,
    terminated_sidecar: true,
    purged,
    verified,
    restart_required: true,
}).map_err(|e| e.to_string())?)
```

Remove:

```rust
tauri::process::restart(&app_handle.env());
```

- [ ] **Step 3: Verify Rust compiles**

Run:

```bash
pnpm --filter @ater/desktop tauri build --debug
```

Expected: Rust command compiles. If the full Tauri build is too slow or fails because signing/bundling is unavailable, run the closest available Rust check from `apps/desktop/src-tauri`:

```bash
cargo check
```

Expected: no Rust type errors.

## Task 8: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused simulation tests**

Run:

```bash
pnpm --filter @ater/desktop test src/tests/appMode.test.ts src/tests/simulationState.test.ts src/tests/simulationAdapter.test.ts src/tests/SimulationContext.test.tsx src/tests/sidecarSimulationRouting.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run existing desktop tests**

Run:

```bash
pnpm --filter @ater/desktop test
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm --filter @ater/desktop typecheck
```

Expected: PASS.

- [ ] **Step 4: Run frontend build**

Run:

```bash
pnpm --filter @ater/desktop build
```

Expected: PASS. Existing Vite chunk-size warnings are acceptable if the command exits 0.

- [ ] **Step 5: Manual zero-key smoke check**

Start the desktop dev server:

```bash
pnpm --filter @ater/desktop exec vite --port 1421
```

Open the app in a browser and verify:

- entering simulation does not ask for an API key
- `/agents` shows `Distributed_Systems_Primer.pdf`
- processing and plan generation return deterministic simulation data
- `/obsidian` lists the Distributed Systems notes
- an Explain action returns the deterministic explanation
- `/practice` can generate questions without a key
- exiting simulation clears memory edits and routes to real onboarding

## Self-Review

### Spec Coverage

The plan covers app mode, provider, Ghost Vault seed/state, deterministic AI/data adapter, sidecar routing before real calls, memory-only reset behavior, factory reset frontend contract, Rust reset verification, and verification commands.

### Placeholder Scan

No `TBD`, `TODO`, "similar to", or unspecified implementation steps remain.

### Type Consistency

`AppMode`, `SimulationState`, `SimulationProfile`, `simulationSidecarApi`, `setRuntimeAppMode`, and `isSimulationMode` are introduced before use. `appMode` and `isDemoMode` compatibility are used consistently.
