/* eslint-disable */
/**
 * Tauri IPC Mock for Playwright E2E tests.
 *
 * Playwright runs the app in a real browser (Chromium) without Tauri's native layer.
 * We inject a global `window.__TAURI__` mock so all `invoke()` calls resolve with
 * realistic responses instead of crashing with "Tauri not available".
 *
 * Usage: Add `await page.addInitScript({ path: 'e2e/mocks/tauri.js' })` at the top
 * of tests that need it, or in the global setup fixture.
 */

console.log('[TauriMock] tauri.js mock script is starting...');

// Keep track of loaded stores and store data in memory
const storeData = new Map();
const loadedStores = new Map();
let nextRid = 1;

// Global mock state representing the RAG system and file system
const state = {
  files: [
    { name: 'Computer_Science', path: 'Computer_Science', is_dir: true },
    { name: 'Data_Structures_And_Algorithms.md', path: 'Computer_Science/Data_Structures_And_Algorithms.md', is_dir: false, modified: new Date().toISOString(), size: 1024 },
    { name: 'Binary_Search_Trees.md', path: 'Computer_Science/Binary_Search_Trees.md', is_dir: false, modified: new Date().toISOString(), size: 512 }
  ],
  notes: {
    'Computer_Science/Data_Structures_And_Algorithms.md': {
      metadata: {
        title: 'Data Structures and Algorithms',
        course: 'CS 101',
        semester: 'Fall 2026',
        unit: '1',
        hub: '[[Computer_Science_Hub]]',
        read: false,
        generated: true
      },
      content: '# Data Structures and Algorithms\nThis is a high-fidelity note about [[Binary_Search_Trees]] and core data layout design concepts in continuous prose.'
    },
    'Computer_Science/Binary_Search_Trees.md': {
      metadata: {
        title: 'Binary Search Trees',
        course: 'CS 101',
        semester: 'Fall 2026',
        unit: '1',
        hub: '[[Computer_Science_Hub]]',
        read: false,
        generated: true
      },
      content: '# Binary Search Trees\nA binary tree where every node satisfies the BST property.'
    }
  },
  databases: [
    { id: 'CS_101', name: 'Computer Science', area: 'Engineering', schema: {}, type: 'obsidian' }
  ],
  areas: ['Engineering', 'Mathematics', 'Economics'],
  hubs: [
    { id: 'CS_101', name: 'Computer Science Hub', note_count: 2 }
  ],
  practices: [
    {
      path: 'practices/CS_101_practice.json',
      name: 'Practice Session 1',
      hub_id: 'CS_101',
      score: 0,
      questions: [
        {
          id: 'q1',
          type: 'recall',
          difficulty: 'L1',
          question: 'What is a Binary Search Tree (BST)?',
          options: ['A heap', 'A binary tree satisfying search constraints', 'A graph', 'A stack'],
          answer: 'A binary tree satisfying search constraints',
          explanation: 'A BST maintains structural ordering.'
        },
        {
          id: 'q2',
          type: 'application',
          difficulty: 'L2',
          question: 'How do you insert 5 into an empty BST?',
          options: ['As the root node', 'As a leaf node on the left', 'As a right node', 'None'],
          answer: 'As the root node',
          explanation: 'An empty tree places the first element at the root.'
        },
        {
          id: 'q3',
          type: 'debug',
          difficulty: 'L3',
          question: 'Fix the recursion leak:',
          content: 'void traverse(Node n) { traverse(n); }',
          answer: 'Add a base case checking for null node.',
          explanation: 'Infinite recursion occurs without an base check.'
        }
      ]
    }
  ],
  studyHistory: {
    sessions: [
      { id: 's1', hubId: 'CS_101', durationSeconds: 600, timestamp: new Date().toISOString(), mode: 'focus' }
    ],
    telemetry: [],
    practice: [
      { hubId: 'CS_101', score: 3, total: 3, timestamp: new Date().toISOString() }
    ]
  },
  queueStatus: {
    status: 'idle',
    auto_process: false,
    current_file: null,
    current_batch: 0,
    total_batches: 0,
    last_action: '',
    processed_notes: [],
    planned_batches: [],
    pending_count: 0,
    pending_files: []
  },
  inbox: [
    { name: 'lecture1.pdf', path: '/Users/test/vault/Inbox/lecture1.pdf', is_dir: false, size: 5000000 }
  ],
  srsCards: [
    { note_path: 'Computer_Science/Data_Structures_And_Algorithms.md', interval: 1, ease: 2.5, due: new Date().toISOString() }
  ],
  isWatcherActive: false,
  isRagWatcherActive: false,
  isRagSyncing: false
};

// Mock tauri-plugin-store
window.__TAURI_STORE__ = {
  load: async (path, _opts) => {
    if (!storeData.has(path)) {
      storeData.set(path, {
        isProgramConfigured: false,
        isActivated: false,
        obsidianVaultPath: '',
        aiProvider: 'google',
        aiModel: 'gemini-2.0-flash',
        aiApiKey: '',
        displayName: '',
        inboxPath: '',
        academicFolderPath: 'Notes',
      });
    }

    return {
      get: async (key) => {
        const data = storeData.get(path);
        return data[key] ?? null;
      },
      set: async (key, value) => {
        const data = storeData.get(path);
        data[key] = value;
      },
      delete: async (key) => {
        const data = storeData.get(path);
        delete data[key];
      },
      save: async () => {},
      entries: async () => {
        const data = storeData.get(path);
        return Object.entries(data);
      },
    };
  },
};

// Inject into window before any app script runs
window.__PLAYWRIGHT_E2E__ = true;
window.__TAURI__ = {
  core: {
    invoke: async (cmd, args) => {
      // ── plugin:store commands ──
      if (cmd === 'plugin:store|load') {
        const path = args?.path || 'default.json';
        const storeInstance = await window.__TAURI_STORE__.load(path, args?.options);
        const rid = nextRid++;
        loadedStores.set(rid, { path, store: storeInstance });
        return rid;
      }
      if (cmd === 'plugin:store|get') {
        const rid = args?.rid;
        const key = args?.key;
        const entry = loadedStores.get(rid);
        if (entry) {
          const val = await entry.store.get(key);
          return [val, val !== undefined && val !== null];
        }
        return [null, false];
      }
      if (cmd === 'plugin:store|set') {
        const rid = args?.rid;
        const key = args?.key;
        const value = args?.value;
        const entry = loadedStores.get(rid);
        if (entry) {
          await entry.store.set(key, value);
        }
        return null;
      }
      if (cmd === 'plugin:store|delete') {
        const rid = args?.rid;
        const key = args?.key;
        const entry = loadedStores.get(rid);
        if (entry) {
          await entry.store.delete(key);
        }
        return null;
      }
      if (cmd === 'plugin:store|save') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          await entry.store.save();
        }
        return null;
      }
      if (cmd === 'plugin:store|entries') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          return await entry.store.entries();
        }
        return [];
      }
      if (cmd === 'plugin:store|has') {
        const rid = args?.rid;
        const key = args?.key;
        const entry = loadedStores.get(rid);
        if (entry) {
          const val = await entry.store.get(key);
          return val !== undefined && val !== null;
        }
        return false;
      }
      if (cmd === 'plugin:store|clear') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          storeData.set(entry.path, {});
        }
        return null;
      }
      if (cmd === 'plugin:store|reset') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          storeData.delete(entry.path);
          const newStore = await window.__TAURI_STORE__.load(entry.path);
          loadedStores.set(rid, { path: entry.path, store: newStore });
        }
        return null;
      }

      // ── Core RAG & App commands ──
      if (cmd === 'init_app' || cmd === 'initialize_database') {
        return null;
      }
      if (cmd === 'get_health') {
        return { status: 'ok', version: '0.6.0' };
      }
      if (cmd === 'get_machine_id') {
        return 'test-machine-id-e2e';
      }
      if (cmd === 'get_sidecar_port') {
        return 5000;
      }
      if (cmd === 'get_sidecar_token') {
        return 'test-sidecar-token';
      }
      if (cmd === 'update_vault_path') {
        return null;
      }
      if (cmd === 'silo_test') {
        return 'Silo healthy';
      }
      if (cmd === 'log_from_js') {
        return null;
      }
      if (cmd === 'export_logs') {
        return '[TauriMock] Exported dynamic logs: RAG healthy, telemetry active.';
      }
      if (cmd === 'factory_reset') {
        state.files = [];
        state.notes = {};
        state.databases = [];
        state.hubs = [];
        state.practices = [];
        state.studyHistory = { sessions: [], telemetry: [], practice: [] };
        return { success: true };
      }

      // ── Database Schema commands ──
      if (cmd === 'list_vault_databases') {
        return { databases: state.databases };
      }
      if (cmd === 'fetch_vault_areas') {
        return { areas: state.areas };
      }
      if (cmd === 'initialize_vault') {
        return { success: true };
      }
      if (cmd === 'create_vault_database') {
        const dbId = args?.id || 'new_db';
        const newDb = { id: dbId, name: dbId.replace('_', ' '), area: 'Engineering', schema: {}, type: 'obsidian' };
        state.databases.push(newDb);
        return newDb;
      }
      if (cmd === 'delete_vault_database') {
        const dbName = args?.dbName;
        state.databases = state.databases.filter(d => d.id !== dbName);
        return { success: true };
      }
      if (cmd === 'update_vault_row' || cmd === 'create_vault_row' || cmd === 'delete_vault_row') {
        return { success: true };
      }
      if (cmd === 'update_vault_database_schema') {
        const dbName = args?.dbName;
        const db = state.databases.find(d => d.id === dbName);
        if (db) {
          db.schema = args?.properties || {};
        }
        return { success: true };
      }
      if (cmd === 'query_vault_database' || cmd === 'list_vault_database_rows') {
        return { results: [] };
      }
      if (cmd === 'list_vault_templates') {
        return { templates: [] };
      }

      // ── Option manager ──
      if (cmd === 'get_vault_options') {
        return { options: ['TagA', 'TagB', 'Core'] };
      }
      if (cmd === 'create_vault_option' || cmd === 'update_vault_option' || cmd === 'delete_vault_option') {
        return { success: true };
      }

      // ── Graph & Backlinks ──
      if (cmd === 'get_vault_graph') {
        return {
          nodes: state.files.filter(f => !f.is_dir).map(f => ({ id: f.path, label: f.name.replace('.md', '') })),
          links: [
            { source: 'Computer_Science/Data_Structures_And_Algorithms.md', target: 'Computer_Science/Binary_Search_Trees.md' }
          ]
        };
      }
      if (cmd === 'get_vault_backlinks') {
        return { backlinks: ['Computer_Science/Data_Structures_And_Algorithms.md'] };
      }

      // ── Obsidian File System commands ──
      if (cmd === 'list_obsidian_files') {
        return state.files;
      }
      if (cmd === 'read_obsidian_note') {
        const path = args?.path;
        return state.notes[path] || { metadata: {}, content: '' };
      }
      if (cmd === 'update_obsidian_note') {
        const path = args?.path;
        const content = args?.content || '';
        if (!state.notes[path]) {
          state.notes[path] = { metadata: { title: path.split('/').pop().replace('.md', ''), generated: true }, content: '' };
        }
        state.notes[path].content = content;
        // Simple regex to parse simulated frontmatter yaml
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (yamlMatch) {
          const lines = yamlMatch[1].split('\n');
          lines.forEach(l => {
            const index = l.indexOf(':');
            if (index > 0) {
              const k = l.substring(0, index).trim();
              const v = l.substring(index + 1).trim().replace(/^"(.*)"$/, '$1');
              state.notes[path].metadata[k] = v;
            }
          });
        }
        return { success: true };
      }
      if (cmd === 'delete_obsidian_item') {
        const path = args?.path;
        state.files = state.files.filter(f => f.path !== path);
        delete state.notes[path];
        return { success: true };
      }
      if (cmd === 'create_obsidian_file') {
        const path = args?.path;
        const content = args?.content || '';
        const name = path.split('/').pop();
        if (!state.files.some(f => f.path === path)) {
          state.files.push({ name, path, is_dir: false, modified: new Date().toISOString(), size: content.length });
        }
        state.notes[path] = {
          metadata: { title: name.replace('.md', ''), generated: true },
          content
        };
        return { success: true };
      }
      if (cmd === 'create_obsidian_folder') {
        const path = args?.path;
        const name = path.split('/').pop();
        if (!state.files.some(f => f.path === path)) {
          state.files.push({ name, path, is_dir: true });
        }
        return { success: true };
      }
      if (cmd === 'move_obsidian_item') {
        const oldPath = args?.oldPath;
        const newPath = args?.newPath;
        state.files.forEach(f => {
          if (f.path === oldPath) {
            f.path = newPath;
            f.name = newPath.split('/').pop();
          }
        });
        if (state.notes[oldPath]) {
          state.notes[newPath] = state.notes[oldPath];
          delete state.notes[oldPath];
        }
        return { success: true };
      }
      if (cmd === 'find_vault_page') {
        const pageName = args?.pageName;
        const found = state.files.find(f => f.name.replace('.md', '') === pageName || f.path === pageName);
        return found ? { found: true, path: found.path } : { found: false, path: null };
      }
      if (cmd === 'rename_vault_file') {
        return { success: true };
      }

      // ── SRS / Active Recall commands ──
      if (cmd === 'srs_cards') {
        return { cards: state.srsCards };
      }
      if (cmd === 'srs_due') {
        return { due_cards: state.srsCards };
      }
      if (cmd === 'srs_review') {
        const path = args?.notePath;
        const card = state.srsCards.find(c => c.note_path === path);
        if (card) {
          card.interval = card.interval * 2;
          card.due = new Date(Date.now() + 86400000 * card.interval).toISOString();
        }
        return { success: true };
      }
      if (cmd === 'srs_feynman_validate') {
        return { score: 85, review: 'Excellent explanation mapping core BST behaviors.' };
      }

      // ── Ingestion Queue commands ──
      if (cmd === 'ater_watcher_toggle') {
        state.isWatcherActive = !state.isWatcherActive;
        return { active: state.isWatcherActive };
      }
      if (cmd === 'ater_queue_status') {
        state.queueStatus.auto_process = state.isWatcherActive;
        return state.queueStatus;
      }
      if (cmd === 'ater_list_inbox') {
        return { files: state.inbox };
      }
      if (cmd === 'ater_list_generated') {
        return { files: state.files.filter(f => !f.is_dir) };
      }
      if (cmd === 'ater_inbox_upload') {
        return { path: args?.filePath || 'inbox/uploaded.pdf' };
      }
      if (cmd === 'ater_interactive_quiz') {
        return { questions: [] };
      }
      if (cmd === 'ater_process') {
        const filePath = args?.payload?.file_path || '';
        state.queueStatus.status = 'processing';
        state.queueStatus.current_file = filePath;
        
        // Push a simulated processing state change
        setTimeout(() => {
          state.queueStatus.status = 'idle';
          state.queueStatus.current_file = null;
          state.queueStatus.pending_count = Math.max(0, state.queueStatus.pending_count - 1);
        }, 1000);

        return { session_id: 'session-456', total_batches: 1 };
      }
      if (cmd === 'ater_confirm') {
        return { success: true };
      }
      if (cmd === 'get_ai_rate_limits') {
        return { requests_per_minute: 15, remaining_requests: 12 };
      }

      // ── AI/LLM Connections and PDF Ingestion ──
      if (cmd === 'test_ai_connection') {
        return { success: true, message: 'Connection to Gemini is successful!' };
      }
      if (cmd === 'ater_oracle_chat') {
        return { response: 'Oracle mock response' };
      }
      if (cmd === 'search_similar') {
        const query = args?.query || '';
        return Object.keys(state.notes).map((path, idx) => ({
          id: String(idx + 1),
          content: state.notes[path].content,
          source: path,
          filename: path.split('/').pop(),
          folder: path.split('/')[0],
          metadata: JSON.stringify(state.notes[path].metadata),
          distance: 0.1
        }));
      }

      // ── Academics Dashboard & Practices ──
      if (cmd === 'academics_dashboard') {
        return {
          years: [{ id: 'Year_I', title: 'Year I', Status: '[[Active]]', 'Current Year': true }],
          semesters: [{ id: 'Semester_1', title: 'Semester_1', Year: '[[Year_I]]', Status: '[[Active]]' }],
          courses: [{ id: 'CS_101', title: 'Computer Science', Semester: '[[Semester_1]]', Status: '[[Active]]' }],
          units: [{ id: 'u_1', title: 'Unit 1', course_id: 'CS_101' }],
          exams: [],
          assignments: []
        };
      }
      if (cmd === 'academics_sync_profile') {
        return { success: true };
      }
      if (cmd === 'list_hubs') {
        return { hubs: state.hubs };
      }
      if (cmd === 'list_hub_notes') {
        return {
          notes: state.files.filter(f => !f.is_dir).map(f => ({
            title: f.name.replace('.md', ''),
            path: f.path
          }))
        };
      }
      if (cmd === 'list_practices') {
        return { practices: state.practices };
      }
      if (cmd === 'generate_practice') {
        const hubId = args?.hubId;
        const newPrac = {
          path: `practices/${hubId}_practice_${Date.now()}.json`,
          name: `Practice Session ${state.practices.length + 1}`,
          hub_id: hubId,
          score: 0,
          questions: state.practices[0].questions
        };
        state.practices.push(newPrac);
        return newPrac;
      }
      if (cmd === 'get_practice') {
        const path = args?.path;
        const prac = state.practices.find(p => p.path === path);
        if (!prac) throw new Error('Practice session not found');
        return prac;
      }
      if (cmd === 'update_practice_score') {
        const path = args?.path;
        const score = args?.score || 0;
        const prac = state.practices.find(p => p.path === path);
        if (prac) {
          prac.score = score;
        }
        return { success: true };
      }
      if (cmd === 'delete_practice') {
        const path = args?.path;
        state.practices = state.practices.filter(p => p.path !== path);
        return { success: true };
      }
      if (cmd === 'get_practice_status') {
        return { status: 'idle' };
      }
      if (cmd === 'get_practice_analytics') {
        return {
          modalities: { recall: 80, application: 70, debug: 90 },
          weakest_concepts: ['Binary Tree Traversal']
        };
      }

      // ── Study Logging and Telemetry ──
      if (cmd === 'log_note_visit' || cmd === 'log_study_session' || cmd === 'log_practice_result' || cmd === 'log_practice_attempt') {
        return { success: true };
      }
      if (cmd === 'get_study_history') {
        return state.studyHistory;
      }
      if (cmd === 'record_performance') {
        return { success: true };
      }
      if (cmd === 'clear_study_history') {
        state.studyHistory = { sessions: [], telemetry: [], practice: [] };
        return { success: true };
      }

      // ── Watcher & Ingestion Sync ──
      if (cmd === 'rag_watcher_toggle') {
        state.isRagWatcherActive = !state.isRagWatcherActive;
        return { active: state.isRagWatcherActive };
      }
      if (cmd === 'rag_sync_vault') {
        state.isRagSyncing = true;
        setTimeout(() => { state.isRagSyncing = false; }, 1000);
        return { success: true };
      }
      if (cmd === 'get_rag_sync_status') {
        return {
          status: state.isRagSyncing ? 'syncing' : 'idle',
          progress: state.isRagSyncing ? 50 : 100,
          total: 100,
          message: state.isRagSyncing ? 'Syncing vector store...' : 'Fully synchronized.'
        };
      }

      // ── Vault Ingestion commands ──
      if (cmd === 'vault_list') {
        return { vaults: [] };
      }
      if (cmd === 'vault_upload_text' || cmd === 'vault_upload_file') {
        return { success: true };
      }
      if (cmd === 'vault_generate') {
        return { success: true };
      }

      // ── AI Usage & Analytics ──
      if (cmd === 'get_ai_usage') {
        return {};
      }
      if (cmd === 'get_all_keys_usage') {
        return [];
      }

      // ── Watcher commands ──
      if (cmd === 'start_watching_directory' || cmd === 'stop_watching_directory') {
        return null;
      }

      // ── Embedding commands ──
      if (cmd === 'embed_and_store_text' || cmd === 'add_document') {
        return null;
      }

      // ── Security & Licensing mock commands ──
      if (cmd === 'load_cached_security_state') {
        return 'Active';
      }
      if (cmd === 'get_security_state') {
        return { status: 'Active', locked_features: [] };
      }
      if (cmd === 'process_security_heartbeat') {
        return 'Active';
      }

      console.warn(`[TauriMock] Unhandled invoke: ${cmd}`, args);
      return null;
    },
  },
  event: {
    listen: async () => () => {},
    once: async () => () => {},
    emit: async () => {},
  },
};

// ── Tauri v2 Internal Bridge Mocking ──
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args, options) => {
    return window.__TAURI__.core.invoke(cmd, args);
  },
  transformCallback: (callback, once = false) => {
    const id = nextRid++;
    return id;
  },
  unregisterCallback: () => {},
  convertFileSrc: (filePath) => filePath,
};

window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
  registerListener: () => {},
  unregisterListener: () => {},
};

console.log('[TauriMock] tauri.js mock script completed execution! __TAURI_INTERNALS__ is:', window.__TAURI_INTERNALS__);
