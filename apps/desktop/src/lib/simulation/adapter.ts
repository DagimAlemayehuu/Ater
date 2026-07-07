import { getSimulationState, patchSimulationNote } from './state'

let currentSimBatch = 0

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
    nodes: getSimulationState().notes.map((note) => ({
      id: note.path,
      label: note.title.replace(/_/g, ' '),
      group: 1,
    })),
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
      study_sessions: [
        {
          id: 'fault_tolerance',
          title: profile.activeUnit,
          course: `[[${profile.course}]]`,
          status: '[[In Progress]]',
        },
      ],
    }
    return { results: rows[dbName] ?? [] }
  },

  getVaultOptions: async (source: string) => ({ options: source === 'hubs' ? ['Distributed Systems'] : [] }),

  testAiConnection: async () => ({ success: true, message: 'Simulation AI is ready. No API key required.' }),

  aterListInbox: async () => ({
    files: [{ name: 'Distributed_Systems_Primer.pdf', path: 'Inbox/Distributed_Systems_Primer.pdf', size: 1572864 }],
  }),

  aterListGenerated: async () => ({
    notes: getSimulationState().notes.map((note) => ({ path: note.path, title: note.title })),
  }),

  listHubs: async () => ({
    hubs: getSimulationState().hubs.map((hub) => ({
      id: hub.id,
      name: hub.title,
      description: hub.description,
    })),
  }),

  listHubNotes: async (_hubId: string) => ({
    notes: getSimulationState().notes.map((note) => ({
      path: note.path,
      title: note.title,
      read: Boolean(note.metadata.read),
    })),
  }),

  aterProcess: async (_payload?: unknown) => {
    currentSimBatch = 0;
    return {
      session_id: 'simulation-ingest-session',
      curriculum: {
        course: 'CS 342: Distributed Systems',
        semester: 'Semester VI',
        unit: 'Fault Tolerance and Replication',
        hub_title: 'Distributed Systems',
      },
    };
  },

  aterGeneratePlan: async (_payload?: unknown) => {
    currentSimBatch = 0;
    const notes = getSimulationState().notes;
    const atomicNotesLines = notes.map((note, index) => `  - [[${note.title}]] (Mode CS): Summary of ${note.title}. Pages: [${index + 3}]`).join('\n');
    const plan_raw = `
<hub_note>Distributed Systems Hub</hub_note>
<pq_note>Distributed Systems Practice</pq_note>
<atomic_notes>
${atomicNotesLines}
</atomic_notes>
    `;

    return {
      session_id: 'simulation-ingest-session',
      plan_raw,
      plan: {
        hub_note: 'Distributed_Systems_Hub.md',
        practice_note: 'Distributed_Systems_Practice.md',
        atomic_notes: notes.map((note, index) => ({
          title: note.title,
          level: index < 2 ? 'foundation' : 'application',
          source_pages: [index + 3],
          mode: 'CS',
        })),
      },
      plan_structured: {
        batches: [
          { id: 1, notes: ['Notes/Consensus.md', 'Notes/Raft_Leader_Election.md'] },
          { id: 2, notes: ['Notes/Log_Replication.md', 'Notes/Vector_Clocks.md'] },
          { id: 3, notes: ['Notes/CAP_Theorem.md', 'Notes/Quorum_Reads_Writes.md'] },
          { id: 4, notes: ['Notes/Failure_Detectors.md', 'Notes/Gossip_Protocols.md'] }
        ],
        hub_note: 'Distributed_Systems_Hub.md',
        pq_note: 'Distributed_Systems_Practice.md',
        atomic_notes: notes.map((note, index) => ({
          title: note.title,
          level: index < 2 ? 'foundation' : 'application',
          source_pages: [index + 3],
          mode: 'CS',
        })),
      }
    };
  },

  refineSourceLearningJobRoadmap: async (sessionId: string, instruction: string, currentTitles: string[]) => {
    return {
      plan_raw: `
<hub_note>Refined Distributed Systems Hub</hub_note>
<pq_note>Refined Distributed Systems Practice</pq_note>
<atomic_notes>
  - [[Refined Consensus]] (Mode CS): Advanced summary of Consensus. Pages: [3]
  - [[Advanced Raft]] (Mode CS): Deep dive into Raft. Pages: [4]
</atomic_notes>
      `
    };
  },

  aterConfirm: async (_payload?: any) => {
    currentSimBatch++;
    const total = 4;
    const hasMore = currentSimBatch < total;
    
    const allNotes = getSimulationState().notes;
    const batchNotes = allNotes.slice((currentSimBatch - 1) * 2, currentSimBatch * 2);
    
    return {
      done: !hasMore,
      status: hasMore ? 'processing' : 'complete',
      current_batch: currentSimBatch,
      total_batches: total,
      has_more: hasMore,
      results: batchNotes.map((note) => ({ title: note.title })),
      ai_output: `Synthesizing batch ${currentSimBatch}/${total}: Generated ${batchNotes.map(n => n.title).join(', ')}`,
      created_notes: allNotes.map((note) => note.path),
    };
  },

  aterQueueStatus: async () => {
    const total = 4;
    const allNotes = getSimulationState().notes;
    return {
      status: 'idle',
      auto_process: false,
      current_file: null,
      current_batch: currentSimBatch || total,
      total_batches: total,
      last_action: 'Simulation deployment completed',
      processed_notes: allNotes.map((note) => ({ path: note.path, title: note.title })),
      planned_batches: [],
      pending_count: 0,
      pending_files: [],
    };
  },

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

  generatePractice: async (_hubId?: string, _config?: unknown) => ({
    quiz_path: 'simulation_practice.json',
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
        explanation: 'A strong answer names election terms, randomized timeout, majority votes, and stale-log protection.',
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
