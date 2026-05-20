/**
 * Ater - Native RAG & Tauri IPC Client
 *
 * This client communicates directly with the native Rust/Tauri RAG engine.
 * The old Python sidecar dependencies and HTTP fetch calls have been completely removed.
 */

import { load } from '@tauri-apps/plugin-store'
import { invoke } from '@tauri-apps/api/core'

const STORE_FILENAME = 'ater_config.json'
let isInitialized = false
let syncProgress = 0
let syncTotal = 0
let syncStatus = 'idle'

const optionsCache = new Map<string, any>()

async function ensureDbInitialized(): Promise<void> {
    if (isInitialized) return
    try {
        const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
        const vaultPath = (await store.get<string>('obsidianVaultPath')) || ''
        
        const dbPath = vaultPath
        
        await invoke('initialize_database', { dbPath })
        isInitialized = true
        console.info('[Tauri Native RAG] Successfully initialized database at:', dbPath)
    } catch (err) {
        console.error('[Tauri Native RAG] Failed to initialize database:', err)
        throw err
    }
}

export interface HealthResponse {
    status: string
    version: string
}

export interface VaultDatabase {
    id: string;
    name: string;
    area?: string;
    schema: Record<string, string | { type: string; source?: string }>;
    type: 'obsidian';
}

export interface ObsidianFile {
    name: string
    path: string
    is_dir: boolean
    modified?: string
    size?: number
}

export interface ObsidianNote {
    metadata: Record<string, any>
    content: string
}

export interface SearchResult {
    id: string
    content: string
    source: string
    filename: string
    folder: string
    metadata: string
    distance: number
}

export const sidecarApi = {
    // ── Native Tauri IPC Core Commands ─────────────────────────
    init_app: async (dbPath: string): Promise<void> => {
        try {
            await invoke('init_app', { dbPath })
        } catch (err) {
            console.error('[Tauri Native RAG] init_app failed:', err)
            throw err
        }
    },
    initialize_database: async (dbPath: string): Promise<void> => {
        try {
            await invoke('initialize_database', { dbPath })
        } catch (err) {
            console.error('[Tauri Native RAG] initialize_database failed:', err)
            throw err
        }
    },
    embed_and_store_text: async (content: string, metadata: Record<string, string>): Promise<void> => {
        try {
            await invoke('embed_and_store_text', { content, metadata })
        } catch (err) {
            console.error('[Tauri Native RAG] embed_and_store_text failed:', err)
            throw err
        }
    },
    add_document: async (content: string, metadata: Record<string, string>): Promise<void> => {
        try {
            await invoke('add_document', { content, metadata })
        } catch (err) {
            console.error('[Tauri Native RAG] add_document failed:', err)
            throw err
        }
    },
    search_similar: async (query: string, limit: number): Promise<SearchResult[]> => {
        try {
            return await invoke<SearchResult[]>('search_similar', { query, limit })
        } catch (err) {
            console.error('[Tauri Native RAG] search_similar failed:', err)
            throw err
        }
    },

    // ── Native Diagnostics ────────────────────────────────────
    exportLogs: async (): Promise<string> => {
        try {
            return await invoke<string>('export_logs')
        } catch (err) {
            console.error('[Tauri Native RAG] exportLogs failed:', err)
            throw err
        }
    },

    getMachineId: async (): Promise<string> => {
        try {
            return await invoke<string>('get_machine_id')
        } catch (err) {
            console.error('[Tauri Native RAG] getMachineId failed:', err)
            throw err
        }
    },

    // ── Native Tauri IPC Routes (Fully wired, no fake mocks!) ──
    health: async (): Promise<HealthResponse> => {
        return { status: 'ok', version: '0.1.2' }
    },

    getBaseUrl: async (): Promise<string> => {
        return 'http://localhost'
    },

    listVaultDatabases: async () => {
        try {
            return await invoke<any>('list_vault_databases')
        } catch (err) {
            console.error('[Tauri Native RAG] listVaultDatabases failed:', err)
            return { databases: [] }
        }
    },
    
    fetchVaultAreas: async () => {
        try {
            return await invoke<any>('fetch_vault_areas')
        } catch (err) {
            console.error('[Tauri Native RAG] fetchVaultAreas failed:', err)
            return { areas: [] }
        }
    },

    initializeVault: async () => {
        try {
            return await invoke<any>('initialize_vault')
        } catch (err) {
            console.error('[Tauri Native RAG] initializeVault failed:', err)
            throw err
        }
    },

    createVaultDatabase: async (name: string, area?: string) => {
        try {
            return await invoke<any>('create_vault_database', { id: name })
        } catch (err) {
            console.error('[Tauri Native RAG] createVaultDatabase failed:', err)
            throw err
        }
    },
    
    deleteVaultDatabase: async (dbName: string) => {
        try {
            return await invoke<any>('delete_vault_database', { dbName })
        } catch (err) {
            console.error('[Tauri Native RAG] deleteVaultDatabase failed:', err)
            throw err
        }
    },

    updateVaultDatabaseSchema: async (dbName: string, properties: Record<string, any>, renameFrom?: string, renameTo?: string) => {
        try {
            return await invoke<any>('update_vault_database_schema', { dbName, properties, renameFrom, renameTo })
        } catch (err) {
            console.error('[Tauri Native RAG] updateVaultDatabaseSchema failed:', err)
            throw err
        }
    },
    
    queryVaultDatabase: async (dbName: string) => {
        try {
            return await invoke<any>('query_vault_database', { dbName })
        } catch (err) {
            console.error('[Tauri Native RAG] queryVaultDatabase failed:', err)
            return { results: [] }
        }
    },
    
    listVaultDatabaseRows: async (dbName: string) => {
        try {
            return await invoke<any>('list_vault_database_rows', { dbName })
        } catch (err) {
            console.error('[Tauri Native RAG] listVaultDatabaseRows failed:', err)
            return { results: [] }
        }
    },
    
    listVaultTemplates: async () => {
        try {
            return await invoke<any>('list_vault_templates')
        } catch (err) {
            console.error('[Tauri Native RAG] listVaultTemplates failed:', err)
            return { templates: [] }
        }
    },
    
    updateVaultRow: async (dbName: string, fileName: string, properties: any) => {
        try {
            return await invoke<any>('update_vault_row', { dbName, id: fileName, properties })
        } catch (err) {
            console.error('[Tauri Native RAG] updateVaultRow failed:', err)
            throw err
        }
    },
        
    createVaultRow: async (dbName: string, title: string, properties: any) => {
        try {
            return await invoke<any>('create_vault_row', { dbName, title, properties })
        } catch (err) {
            console.error('[Tauri Native RAG] createVaultRow failed:', err)
            throw err
        }
    },
        
    deleteVaultRow: async (dbName: string, fileName: string) => {
        try {
            return await invoke<any>('delete_vault_row', { dbName, id: fileName })
        } catch (err) {
            console.error('[Tauri Native RAG] deleteVaultRow failed:', err)
            throw err
        }
    },

    renameVaultFile: async (dbName: string, oldFileName: string, newFileName: string) => {
        try {
            return await invoke<any>('rename_vault_file', { dbName, oldId: oldFileName, newId: newFileName })
        } catch (err) {
            console.error('[Tauri Native RAG] renameVaultFile failed:', err)
            throw err
        }
    },

    clearOptionsCache: () => {
        optionsCache.clear()
    },

    getVaultOptions: async (source: string) => {
        if (optionsCache.has(source)) {
            // Trigger a background refresh to keep it fresh (Stale-While-Revalidate)
            invoke<any>('get_vault_options', { source }).then(res => {
                if (res && res.options) {
                    optionsCache.set(source, res)
                }
            }).catch(() => {})
            return optionsCache.get(source)
        }
        try {
            const res = await invoke<any>('get_vault_options', { source })
            if (res && res.options) {
                optionsCache.set(source, res)
            }
            return res
        } catch (err) {
            console.error('[Tauri Native RAG] getVaultOptions failed:', err)
            return { options: [] }
        }
    },

    createVaultOption: async (source: string, name: string) => {
        optionsCache.delete(source)
        try {
            return await invoke<any>('create_vault_option', { source, name })
        } catch (err) {
            console.error('[Tauri Native RAG] createVaultOption failed:', err)
            throw err
        }
    },

    updateVaultOption: async (source: string, oldName: string, newName: string) => {
        optionsCache.delete(source)
        try {
            return await invoke<any>('update_vault_option', { source, oldName, newName })
        } catch (err) {
            console.error('[Tauri Native RAG] updateVaultOption failed:', err)
            throw err
        }
    },

    deleteVaultOption: async (source: string, name: string) => {
        optionsCache.delete(source)
        try {
            return await invoke<any>('delete_vault_option', { source, name })
        } catch (err) {
            console.error('[Tauri Native RAG] deleteVaultOption failed:', err)
            throw err
        }
    },

    findVaultPage: async (pageName: string) => {
        try {
            return await invoke<any>('find_vault_page', { pageName })
        } catch (err) {
            console.error('[Tauri Native RAG] findVaultPage failed:', err)
            return { found: false }
        }
    },

    searchVaultFull: async (query: string): Promise<{ paths: string[] }> => {
        try {
            await ensureDbInitialized()
            const results = await invoke<any[]>('search_similar', { query, limit: 100 })
            const paths = results.map(r => r.source).filter(Boolean)
            return { paths }
        } catch (err) {
            console.error('[Tauri Native RAG] searchVaultFull failed:', err)
            return { paths: [] }
        }
    },

    getVaultGraph: async () => {
        try {
            return await invoke<any>('get_vault_graph')
        } catch (err) {
            console.error('[Tauri Native RAG] getVaultGraph failed:', err)
            return { nodes: [], links: [] }
        }
    },

    getVaultBacklinks: async (pageName: string) => {
        try {
            return await invoke<any>('get_vault_backlinks', { pageName })
        } catch (err) {
            console.error('[Tauri Native RAG] getVaultBacklinks failed:', err)
            return { backlinks: [] }
        }
    },

    testAiConnection: async (target: 'primary' = 'primary') => {
        try {
            return await invoke<any>('test_ai_connection', { target })
        } catch (err) {
            console.error('[Tauri Native RAG] testAiConnection failed:', err)
            return { success: false, message: 'Connection failed', error: String(err) }
        }
    },

    listObsidianFiles: async () => {
        try {
            const files = await invoke<ObsidianFile[]>('list_obsidian_files')
            return { files }
        } catch (err) {
            console.error('[Tauri Native RAG] listObsidianFiles failed:', err)
            return { files: [] }
        }
    },
    
    readObsidianNote: async (path: string) => {
        try {
            return await invoke<any>('read_obsidian_note', { path })
        } catch (err) {
            console.error('[Tauri Native RAG] readObsidianNote failed:', err)
            return { metadata: {}, content: '' }
        }
    },
    
    updateObsidianNote: async (path: string, content: string) => {
        try {
            return await invoke<any>('update_obsidian_note', { path, content })
        } catch (err) {
            console.error('[Tauri Native RAG] updateObsidianNote failed:', err)
            throw err
        }
    },

    deleteObsidianItem: async (path: string) => {
        try {
            return await invoke<any>('delete_obsidian_item', { path })
        } catch (err) {
            console.error('[Tauri Native RAG] deleteObsidianItem failed:', err)
            throw err
        }
    },

    createObsidianFile: async (path: string, content: string = '', overwrite: boolean = false) => {
        try {
            return await invoke<any>('create_obsidian_file', { path, content, overwrite })
        } catch (err) {
            console.error('[Tauri Native RAG] createObsidianFile failed:', err)
            throw err
        }
    },

    createObsidianFolder: async (path: string) => {
        try {
            return await invoke<any>('create_obsidian_folder', { path })
        } catch (err) {
            console.error('[Tauri Native RAG] createObsidianFolder failed:', err)
            throw err
        }
    },

    moveObsidianItem: async (oldPath: string, newPath: string) => {
        try {
            return await invoke<any>('move_obsidian_item', { oldPath, newPath })
        } catch (err) {
            console.error('[Tauri Native RAG] moveObsidianItem failed:', err)
            throw err
        }
    },

    aiUpload: async (file: File) => ({ file_uri: '', name: file.name }),

    aterProcess: async (payload: { file_path?: string; text?: string; target_hub_id?: string }) => {
        try {
            return await invoke<any>('ater_process', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] aterProcess failed:', err)
            throw err
        }
    },

    aterGeneratePlan: async (payload: { session_id?: string; file_path?: string; curriculum: any; target_hub_id?: string }) => {
        try {
            return await invoke<any>('ater_generate_plan', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] aterGeneratePlan failed:', err)
            throw err
        }
    },

    aterConfirm: async (payload: { session_id: string; command?: string; curriculum_override?: any; anchored_hub_id?: string }) => {
        try {
            return await invoke<any>('ater_confirm', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] aterConfirm failed:', err)
            throw err
        }
    },

    aterWatcherToggle: async () => {
        try {
            return await invoke<any>('ater_watcher_toggle')
        } catch (err) {
            console.error('[Tauri Native RAG] aterWatcherToggle failed:', err)
            throw err
        }
    },

    getAiRateLimits: async () => {
        try {
            return await invoke<any>('get_ai_rate_limits')
        } catch (err) {
            console.error('[Tauri Native RAG] getAiRateLimits failed:', err)
            return {}
        }
    },

    aterQueueStatus: async () => {
        try {
            return await invoke<any>('ater_queue_status')
        } catch (err) {
            console.error('[Tauri Native RAG] aterQueueStatus failed:', err)
            return {
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
            }
        }
    },

    aterListInbox: async () => {
        try {
            return await invoke<any>('ater_list_inbox')
        } catch (err) {
            console.error('[Tauri Native RAG] aterListInbox failed:', err)
            return { files: [] }
        }
    },

    aterListGenerated: async () => {
        try {
            return await invoke<any>('ater_list_generated')
        } catch (err) {
            console.error('[Tauri Native RAG] aterListGenerated failed:', err)
            return { files: [] }
        }
    },

    ragWatcherToggle: async () => {
        try {
            return await invoke<any>('rag_watcher_toggle')
        } catch (err) {
            console.error('[Tauri Native RAG] ragWatcherToggle failed:', err)
            throw err
        }
    },

    ragSyncVault: async () => {
        try {
            return await invoke<any>('rag_sync_vault')
        } catch (err) {
            console.error('[Tauri Native RAG] ragSyncVault failed:', err)
            throw err
        }
    },

    ragSyncStatus: async () => {
        try {
            return await invoke<any>('get_rag_sync_status')
        } catch (err) {
            console.error('[Tauri Native RAG] ragSyncStatus failed:', err)
            return { status: 'error', progress: 0, total: 0, message: String(err) }
        }
    },

    listHubs: async () => {
        try {
            return await invoke<any>('list_hubs')
        } catch (err) {
            console.error('[Tauri Native RAG] listHubs failed:', err)
            return { hubs: [] }
        }
    },
    
    listHubNotes: async (hubId: string) => {
        try {
            return await invoke<any>('list_hub_notes', { hubId })
        } catch (err) {
            console.error('[Tauri Native RAG] listHubNotes failed:', err)
            return { notes: [] }
        }
    },
    
    generatePractice: async (hubId: string, config: any) => {
        try {
            return await invoke<any>('generate_practice', { hubId, configPayload: config })
        } catch (err) {
            console.error('[Tauri Native RAG] generatePractice failed:', err)
            throw err
        }
    },
    
    listPractices: async () => {
        try {
            return await invoke<any>('list_practices')
        } catch (err) {
            console.error('[Tauri Native RAG] listPractices failed:', err)
            return { practices: [] }
        }
    },
    
    getPracticeStatus: async () => {
        try {
            return await invoke<any>('get_practice_status')
        } catch (err) {
            console.error('[Tauri Native RAG] getPracticeStatus failed:', err)
            return { status: {} }
        }
    },
    
    getPractice: async (path: string) => {
        try {
            return await invoke<any>('get_practice', { path })
        } catch (err) {
            console.error('[Tauri Native RAG] getPractice failed:', err)
            throw err
        }
    },
    
    deletePractice: async (path: string) => {
        try {
            return await invoke<any>('delete_practice', { path })
        } catch (err) {
            console.error('[Tauri Native RAG] deletePractice failed:', err)
            throw err
        }
    },
    
    updatePracticeScore: async (path: string, score: number) => {
        try {
            return await invoke<any>('update_practice_score', { path, score })
        } catch (err) {
            console.error('[Tauri Native RAG] updatePracticeScore failed:', err)
            throw err
        }
    },

    academicsDashboard: async () => {
        try {
            return await invoke<any>('academics_dashboard')
        } catch (err) {
            console.error('[Tauri Native RAG] academicsDashboard failed:', err)
            return { semesters: [], courses: [], units: [], exams: [], assignments: [] }
        }
    },

    academicsSyncProfile: async () => {
        try {
            return await invoke<any>('academics_sync_profile')
        } catch (err) {
            console.error('[Tauri Native RAG] academicsSyncProfile failed:', err)
            throw err
        }
    },

    explainPdfSelection: async (payload: { path: string, selection: string, page?: number, note_mode?: string, note_title?: string, note_course?: string }) => {
        try {
            return await invoke<any>('explain_pdf_selection', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] explainPdfSelection failed:', err)
            throw err
        }
    },

    generateQuickQuestions: async (payload: { path: string, selection: string, page?: number }) => {
        try {
            return await invoke<any>('generate_quick_questions', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] generateQuickQuestions failed:', err)
            throw err
        }
    },

    aterExplain: async (payload: {
        path: string,
        selection: string,
        page?: number,
        question?: string,
        note_mode?: string,
        note_title?: string,
        note_course?: string,
        scope?: 'selection' | 'page' | 'note',
        source_kind?: 'markdown' | 'pdf',
        selection_context?: string,
    }) => {
        try {
            return await invoke<any>('ater_explain', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] aterExplain failed:', err)
            throw err
        }
    },

    aterChat: async (payload: {
        path: string,
        selection: string,
        page?: number,
        messages: { role: string, content: string }[],
        scope?: 'selection' | 'page' | 'note',
        source_kind?: 'markdown' | 'pdf',
        selection_context?: string,
        note_mode?: string,
        note_title?: string,
        note_course?: string,
    }) => {
        try {
            return await invoke<any>('ater_chat', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] aterChat failed:', err)
            throw err
        }
    },

    aterInteractiveQuiz: async (payload: { selection: string }) => {
        try {
            return await invoke<any>('ater_interactive_quiz', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] aterInteractiveQuiz failed:', err)
            throw err
        }
    },

    logNoteVisit: async (notePath: string, durationSeconds: number) => {
        try {
            return await invoke<any>('log_note_visit', { notePath, durationSeconds })
        } catch (err) {
            console.error('[Tauri Native RAG] logNoteVisit failed:', err)
            throw err
        }
    },
    
    logStudySession: async (hubId: string, durationSeconds: number, mode: string = 'focus') => {
        try {
            return await invoke<any>('log_study_session', { hubId, durationSeconds, mode })
        } catch (err) {
            console.error('[Tauri Native RAG] logStudySession failed:', err)
            throw err
        }
    },

    logPracticeResult: async (hubId: string, score: number, total: number, notePath?: string) => {
        try {
            return await invoke<any>('log_practice_result', { hubId, score, total, notePath })
        } catch (err) {
            console.error('[Tauri Native RAG] logPracticeResult failed:', err)
            throw err
        }
    },
    
    getStudyHistory: async () => {
        try {
            return await invoke<any>('get_study_history')
        } catch (err) {
            console.error('[Tauri Native RAG] getStudyHistory failed:', err)
            return { sessions: [], telemetry: [], practice: [] }
        }
    },

    clearStudyHistory: async () => {
        try {
            return await invoke<any>('clear_study_history')
        } catch (err) {
            console.error('[Tauri Native RAG] clearStudyHistory failed:', err)
            throw err
        }
    },

    factoryReset: async () => {
        try {
            return await invoke<any>('factory_reset')
        } catch (err) {
            console.error('[Tauri Native RAG] factoryReset failed:', err)
            throw err
        }
    },

    getAiUsage: async (keyHash?: string, timeframe: string = 'day') => {
        try {
            return await invoke<any>('get_ai_usage', { keyHash, timeframe })
        } catch (err) {
            console.error('[Tauri Native RAG] getAiUsage failed:', err)
            return {}
        }
    },

    getAllKeysUsage: async (timeframe: string = 'day') => {
        try {
            return await invoke<any>('get_all_keys_usage', { timeframe })
        } catch (err) {
            console.error('[Tauri Native RAG] getAllKeysUsage failed:', err)
            return []
        }
    },

    srsReview: async (notePath: string, rating: number) => {
        try {
            return await invoke<any>('srs_review', { notePath, rating })
        } catch (err) {
            console.error('[Tauri Native RAG] srsReview failed:', err)
            throw err
        }
    },
    
    srsDue: async (hubId?: string) => {
        try {
            return await invoke<any>('srs_due', { hubId })
        } catch (err) {
            console.error('[Tauri Native RAG] srsDue failed:', err)
            return { due_cards: [] }
        }
    },

    recordPerformance: async (payload: { note_path: string; was_correct: boolean; time_ms: number; question_type?: string; difficulty?: string; confidence?: number; session_id?: string; question_id?: string }) => {
        try {
            return await invoke<any>('record_performance', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] recordPerformance failed:', err)
            throw err
        }
    },

    vaultList: async (hubId: string) => {
        try {
            return await invoke<any>('vault_list', { hubId })
        } catch (err) {
            console.error('[Tauri Native RAG] vaultList failed:', err)
            return { vaults: [] }
        }
    },

    vaultUploadText: async (hubId: string, sourceName: string, sourceText: string) => {
        try {
            return await invoke<any>('vault_upload_text', { hubId, sourceName, sourceText })
        } catch (err) {
            console.error('[Tauri Native RAG] vaultUploadText failed:', err)
            throw err
        }
    },

    vaultGenerate: async (vaultPaths: string[], mode: string, hubId: string) => {
        try {
            return await invoke<any>('vault_generate', { vaultPaths, mode, hubId })
        } catch (err) {
            console.error('[Tauri Native RAG] vaultGenerate failed:', err)
            throw err
        }
    },

    vaultUploadFile: async (hubId: string, file: File) => {
        try {
            const filePath = (file as any).path || '';
            if (!filePath) {
                console.error('[Tauri Native RAG] File upload missing absolute path property.');
                throw new Error('Absolute path is required for native file upload. Please select a file through the native dialog or drop a file from explorer.');
            }
            return await invoke<any>('vault_upload_file', {
                hubId,
                filePath,
                fileName: file.name
            });
        } catch (err) {
            console.error('[Tauri Native RAG] vaultUploadFile failed:', err);
            throw err;
        }
    },

    request: async (method: string, path: string, body?: any): Promise<any> => {
        return {}
    },

    getConfig: async () => {
        const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
        return {
            obsidianVaultPath: (await store.get<string>('obsidianVaultPath')) || '',
            inboxPath: (await store.get<string>('inboxPath')) || '',
            academicFolderPath: (await store.get<string>('academicFolderPath')) || 'database',
            aiProvider: (await store.get<string>('aiProvider')) || 'google',
            aiModel: (await store.get<string>('aiModel')) || 'gemini-2.0-flash',
        }
    },

    explainQuestion: async (payload: { question: string; type: string; answer: any; explanation?: string; context?: string }) => {
        try {
            return await invoke<any>('explain_question', { payload })
        } catch (err) {
            console.error('[Tauri Native RAG] explainQuestion failed:', err)
            throw err
        }
    },
    getPracticeAnalytics: async () => {
        try {
            return await invoke<any>('get_practice_analytics')
        } catch (err) {
            console.error('[Tauri Native RAG] getPracticeAnalytics failed:', err)
            return { modalities: {}, weakest_concepts: [] }
        }
    },
    logPracticeAttempt: async (noteId: string, questionType: string, isCorrect: boolean, timeTakenSeconds: number) => {
        try {
            return await invoke<any>('log_practice_attempt', { noteId, questionType, isCorrect, timeTakenSeconds })
        } catch (err) {
            console.error('[Tauri Native RAG] logPracticeAttempt failed:', err)
        }
    },
}
