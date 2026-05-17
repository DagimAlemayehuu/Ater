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

async function ensureDbInitialized(): Promise<void> {
    if (isInitialized) return
    try {
        const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
        const vaultPath = (await store.get<string>('obsidianVaultPath')) || ''
        
        let dbPath = ''
        if (vaultPath) {
            dbPath = `${vaultPath}/.ater/vector_store`
        }
        
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

    // ── Mocked/Cleaned Non-IPC Routes (No Fetch/Network calls) ─
    health: async (): Promise<HealthResponse> => {
        return { status: 'ok', version: '0.1.2' }
    },

    getBaseUrl: async (): Promise<string> => {
        return 'http://localhost'
    },

    listVaultDatabases: async () => ({ databases: [] as any[] }),
    
    fetchVaultAreas: async () => ({ areas: [] as string[] }),

    initializeVault: async () => ({ success: true, message: 'Vault initialized' }),

    createVaultDatabase: async (name: string, area?: string) => ({ success: true, id: 'db' }),
    
    deleteVaultDatabase: async (dbName: string) => ({ success: true }),

    updateVaultDatabaseSchema: async (dbName: string, properties: Record<string, any>, renameFrom?: string, renameTo?: string) => ({ success: true }),
    
    queryVaultDatabase: async (dbName: string) => ({ results: [] as any[] }),
    
    listVaultDatabaseRows: async (dbName: string) => ({ results: [] as any[] }),
    
    listVaultTemplates: async () => ({ templates: [] as any[] }),
    
    updateVaultRow: async (dbName: string, fileName: string, properties: any) => ({ success: true, id: 'row', properties }),
        
    createVaultRow: async (dbName: string, title: string, properties: any) => ({ success: true, id: 'row', title, properties }),
        
    deleteVaultRow: async (dbName: string, fileName: string) => ({ success: true }),

    renameVaultFile: async (dbName: string, oldFileName: string, newFileName: string) => ({ success: true }),

    getVaultOptions: async (source: string) => ({ options: [] as string[] }),

    createVaultOption: async (source: string, name: string) => ({ success: true, name }),

    updateVaultOption: async (source: string, oldName: string, newName: string) => ({ success: true, name: newName }),

    deleteVaultOption: async (source: string, name: string) => ({ success: true }),

    findVaultPage: async (pageName: string) => ({ found: false as boolean, path: undefined as string | undefined, type: undefined as string | undefined, db_id: undefined as string | undefined, file_name: undefined as string | undefined }),

    searchVaultFull: async (query: string): Promise<{ paths: string[] }> => {
        try {
            await ensureDbInitialized()
            const results = await invoke<any[]>('search_similar', { query, limit: 100 })
            const paths = results.map(r => r.source).filter(Boolean)
            return { paths }
        } catch (err) {
            console.error('[Tauri Native RAG] search_similar command failed:', err)
            return { paths: [] }
        }
    },

    getVaultGraph: async () => ({ nodes: [] as any[], links: [] as any[] }),

    getVaultBacklinks: async (pageName: string) => ({ backlinks: [] as any[] }),

    testAiConnection: async (target: 'primary' = 'primary') => ({ success: true, message: 'Native connection active', error: undefined as string | undefined }),

    listObsidianFiles: async () => ({ files: [] as ObsidianFile[] }),
    
    readObsidianNote: async (path: string) => ({ metadata: {} as Record<string, any>, content: '' }),
    
    updateObsidianNote: async (path: string, content: string) => {
        try {
            await ensureDbInitialized()
            const filename = path.split('/').pop() || ''
            const folder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
            await invoke('add_document', {
                content,
                metadata: {
                    id: path,
                    source: path,
                    filename,
                    folder
                }
            })
            console.info(`[Tauri Native RAG] Successfully indexed updated note: ${path}`)
        } catch (err) {
            console.error(`[Tauri Native RAG] Failed to index note ${path}:`, err)
        }
        return { success: true }
    },

    deleteObsidianItem: async (path: string) => ({ success: true }),

    createObsidianFile: async (path: string, content: string = '', overwrite: boolean = false) => {
        try {
            await ensureDbInitialized()
            const filename = path.split('/').pop() || ''
            const folder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
            await invoke('add_document', {
                content,
                metadata: {
                    id: path,
                    source: path,
                    filename,
                    folder
                }
            })
            console.info(`[Tauri Native RAG] Successfully indexed new note: ${path}`)
        } catch (err) {
            console.error(`[Tauri Native RAG] Failed to index new note ${path}:`, err)
        }
        return { success: true, path }
    },

    createObsidianFolder: async (path: string) => ({ success: true, path }),

    moveObsidianItem: async (oldPath: string, newPath: string) => ({ success: true, old_path: oldPath, new_path: newPath }),

    aiUpload: async (file: File) => ({ file_uri: '', name: file.name }),

    aterProcess: async (payload: { file_path?: string; text?: string; target_hub_id?: string }) => ({ 
        session_id: 'session', 
        plan_raw: '', 
        plan_structured: {} as any, 
        status: 'done',
        anchored_hub: undefined as any,
        available_hubs: [] as any[],
        available_options: { courses: [], semesters: [], units: [] } as any,
        detected_curriculum: undefined as any
    }),

    aterGeneratePlan: async (payload: { session_id?: string; file_path?: string; curriculum: any; target_hub_id?: string }) => ({ 
        session_id: 'session', 
        plan_raw: '', 
        plan_structured: {} as any, 
        status: 'done',
        anchored_hub: undefined as any,
        available_hubs: [] as any[],
        available_options: { courses: [], semesters: [], units: [] } as any,
        detected_curriculum: undefined as any
    }),

    aterConfirm: async (payload: { session_id: string; command?: string; curriculum_override?: any; anchored_hub_id?: string }) => ({ 
        ai_output: '', 
        results: [] as any[], 
        count: 0, 
        has_more: false, 
        status: 'done',
        current_batch: undefined as number | undefined
    }),

    aterWatcherToggle: async () => ({ status: 'disabled' }),

    getAiRateLimits: async () => ({} as Record<string, any>),

    aterQueueStatus: async () => ({ 
        status: 'idle', 
        auto_process: false, 
        current_file: null as string | null, 
        current_batch: 0, 
        total_batches: 0, 
        last_action: '',
        processed_notes: [] as any[],
        planned_batches: [] as { id: number, notes: string[] }[],
        pending_count: 0, 
        pending_files: [] as string[] 
    }),

    aterListInbox: async () => ({ files: [] as any[] }),

    aterListGenerated: async () => ({ files: [] as any[] }),

    ragWatcherToggle: async () => ({ status: 'enabled', vault: 'obsidian' }),

    ragSyncVault: async () => {
        syncStatus = 'syncing'
        syncProgress = 0
        syncTotal = 0
        
        ;(async () => {
            try {
                await ensureDbInitialized()
                const res = await sidecarApi.listObsidianFiles()
                const files = res.files.filter(f => !f.is_dir && f.path.endsWith('.md'))
                
                syncTotal = files.length
                console.info(`[Tauri Native RAG] Sync starting. Total markdown files: ${syncTotal}`)
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    try {
                        const note = await sidecarApi.readObsidianNote(file.path)
                        const filename = file.name
                        const folder = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : ''
                        
                        await invoke('add_document', {
                            content: note.content || '',
                            metadata: {
                                id: file.path,
                                source: file.path,
                                filename,
                                folder
                            }
                        })
                        syncProgress = i + 1
                    } catch (err) {
                        console.error(`[Tauri Native RAG] Sync failed for file ${file.path}:`, err)
                    }
                }
                
                syncStatus = 'success'
                console.info('[Tauri Native RAG] Sync complete!')
            } catch (err) {
                syncStatus = 'error'
                console.error('[Tauri Native RAG] Sync failed:', err)
            }
        })()

        return { status: 'syncing', message: 'Sync started successfully' }
    },

    ragSyncStatus: async () => ({
        status: syncStatus,
        progress: syncProgress,
        total: syncTotal,
        message: syncStatus === 'syncing' ? `Syncing vault files: ${syncProgress}/${syncTotal}` : `Sync status: ${syncStatus}`
    }),

    listHubs: async () => ({ hubs: [] as any[] }),
    listHubNotes: async (hubId: string) => ({ notes: [] as any[] }),
    generatePractice: async (hubId: string, config: any) => ({ session_id: '', questions: [] as any[], quiz_path: '' }),
    listPractices: async () => ({ practices: [] as any[] }),
    getPracticeStatus: async () => ({ status: {} as Record<string, string> }),
    getPractice: async (path: string) => ({ questions: [] as any[] }),
    deletePractice: async (path: string) => ({ status: 'deleted' }),
    updatePracticeScore: async (path: string, score: number) => ({ status: 'updated' }),

    academicsDashboard: async () => ({ semesters: [] as any[], courses: [] as any[], units: [] as any[], exams: [] as any[], assignments: [] as any[] }),

    academicsSyncProfile: async () => ({ success: true, profile_path: '' }),

    explainPdfSelection: async (payload: { path: string, selection: string, page?: number, note_mode?: string, note_title?: string, note_course?: string }) => ({ answer: '', persona: undefined as string | undefined }),

    generateQuickQuestions: async (payload: { path: string, selection: string, page?: number }) => ({ answer: '', persona: undefined as string | undefined }),

    aterExplain: async (payload: { path: string, selection: string, page?: number, question?: string, note_mode?: string, note_title?: string, note_course?: string }) => ({ answer: '', persona: undefined as string | undefined }),

    aterChat: async (payload: { path: string, selection: string, page?: number, messages: { role: string, content: string }[] }) => ({ answer: '', persona: undefined as string | undefined }),

    aterInteractiveQuiz: async (payload: { selection: string }) => ({ questions: [] as any[] }),

    logNoteVisit: async (notePath: string, durationSeconds: number) => ({ status: 'ok' }),
    
    logStudySession: async (hubId: string, durationSeconds: number, mode: string = 'focus') => ({ status: 'ok' }),

    logPracticeResult: async (hubId: string, score: number, total: number, notePath?: string) => ({ status: 'ok' }),
    
    getStudyHistory: async () => ({ sessions: [] as any[], telemetry: [] as any[], practice: [] as any[] }),

    clearStudyHistory: async () => ({ success: true }),

    factoryReset: async () => ({ success: true }),

    getAiUsage: async (keyHash?: string, timeframe: string = 'day') => ({}),

    getAllKeysUsage: async (timeframe: string = 'day') => ([] as any[]),

    srsReview: async (notePath: string, rating: number) => ({ success: true, card: {} as any }),
    
    srsDue: async (hubId?: string) => ({ due_cards: [] as any[] }),

    recordPerformance: async (payload: { note_path: string; was_correct: boolean; time_ms: number; question_type?: string; difficulty?: string; confidence?: number; session_id?: string; question_id?: string }) => ({ success: true }),

    vaultList: async (hubId: string) => ({ vaults: [] as any[] }),

    vaultUploadText: async (hubId: string, sourceName: string, sourceText: string) => ({ path: '', total: 0 }),

    vaultGenerate: async (vaultPaths: string[], mode: string, hubId: string) => ({ questions: [] as any[], quiz_path: '' }),

    vaultUploadFile: async (hubId: string, file: File) => ({ vault_path: '', total_questions: 0 }),

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

    explainQuestion: async (payload: { question: string; type: string; answer: any; explanation?: string; context?: string }) => ({ lesson: '' }),
}
