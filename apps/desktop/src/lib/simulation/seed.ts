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

const note = (
  path: string,
  title: string,
  content: string,
  extra: Record<string, unknown> = {},
): SimulationNote => ({
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
  note(
    'Notes/Consensus.md',
    'Consensus',
    `# Consensus

Consensus is the problem of getting distributed processes to agree on one value despite delay, message reordering, and partial failure.

## Mental model

Imagine a lab team trying to publish one final measurement while some instruments lag behind. Consensus is the protocol discipline that prevents two conflicting final answers.

## Recall prompt

Why does agreement matter more than speed when replicated state machines serve user writes?

\`\`\`interactive-quiz
{
  "id": "consensus-mcq",
  "type": "mcq",
  "difficulty": "Easy",
  "question": "What is the primary goal of a consensus protocol in a distributed system?",
  "options": {
    "A": "To maximize execution speed of read queries",
    "B": "To ensure processes agree on a single data value despite failures",
    "C": "To prevent network partitions from ever occurring",
    "D": "To partition the data across multiple geographical regions"
  },
  "answer": "B",
  "explanation": "Consensus protocols (like Raft or Paxos) ensure that a set of distributed processes can agree on a single decision or value, maintaining consistency even if some nodes fail or messages are delayed."
}
\`\`\`
`,
  ),
  note(
    'Notes/Raft_Leader_Election.md',
    'Raft Leader Election',
    `# Raft Leader Election

Raft elects one leader per term. Followers become candidates after an election timeout, request votes, and become leader only after receiving a majority.

## Common trap

A node with stale logs should not win leadership simply because it timed out first.
`,
  ),
  note(
    'Notes/Log_Replication.md',
    'Log Replication',
    `# Log Replication

Leaders append commands to their logs, replicate entries to followers, and commit once a majority has stored the entry.

## Invariant

If two logs contain an entry with the same index and term, all previous entries are identical.
`,
  ),
  note(
    'Notes/Vector_Clocks.md',
    'Vector Clocks',
    `# Vector Clocks

Vector clocks track causality by storing one logical counter per participant. They can prove one event happened before another or detect concurrency.
`,
  ),
  note(
    'Notes/CAP_Theorem.md',
    'CAP Theorem',
    `# CAP Theorem

CAP says a distributed system facing a network partition must choose between availability and linearizable consistency.
`,
  ),
  note(
    'Notes/Quorum_Reads_Writes.md',
    'Quorum Reads and Writes',
    `# Quorum Reads and Writes

Quorum systems choose read and write set sizes so operations overlap. The overlap lets readers observe the latest committed write.
`,
  ),
  note(
    'Notes/Failure_Detectors.md',
    'Failure Detectors',
    `# Failure Detectors

Failure detectors convert missing heartbeats into suspicion. They are useful but imperfect because slow nodes can look dead.
`,
  ),
  note(
    'Notes/Gossip_Protocols.md',
    'Gossip Protocols',
    `# Gossip Protocols

Gossip protocols spread membership or state by repeated random peer exchange. They trade precision for robustness and scale.
`,
  ),
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
    ...SIMULATION_NOTES.map((entry) => ({
      name: `${entry.title}.md`,
      path: entry.path,
      is_dir: false,
      size: entry.content.length,
    })),
    { name: 'Inbox', path: 'Inbox', is_dir: true },
    {
      name: 'Distributed_Systems_Primer.pdf',
      path: 'Inbox/Distributed_Systems_Primer.pdf',
      is_dir: false,
      size: 1572864,
    },
  ],
  pdfWaypoints: [
    { id: 'consensus-problem', label: 'Consensus Problem', page: 3, notePath: 'Notes/Consensus.md' },
    { id: 'leader-election', label: 'Leader Election', page: 7, notePath: 'Notes/Raft_Leader_Election.md' },
    { id: 'replication-invariants', label: 'Replication Invariants', page: 11, notePath: 'Notes/Log_Replication.md' },
    { id: 'causal-ordering', label: 'Causal Ordering', page: 15, notePath: 'Notes/Vector_Clocks.md' },
  ],
  practiceHistory: [],
}
