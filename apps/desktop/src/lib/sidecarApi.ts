/**
 * Ater - Python Sidecar API Client
 *
 * All heavy computation (Gemini, RAG, Reranking) is executed in the Python sidecar.
 * This client is the ONLY interface between React and the Python backend.
 */

import { load } from '@tauri-apps/plugin-store'

export const SIDECAR_BASE_URL = 'http://127.0.0.1:8765'
const STORE_FILENAME = 'ater_config.json'

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

/**
 * Internal helper to get keys from Tauri store
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
    
    let obsidianVaultPath = await store.get<string>('obsidianVaultPath');
    if (!obsidianVaultPath || obsidianVaultPath.trim() === '') {
        obsidianVaultPath = '';
    }

    // Fetch all config values into a single object
    const config = {
        geminiApiKey: (await store.get<string>('geminiApiKey')) || '',
        aiProvider: (await store.get<string>('aiProvider')) || 'google', 
        aiApiKey: (await store.get<string>('aiApiKey')) || '', 
        aiModel: (await store.get<string>('aiModel')) || 'gemini-2.0-flash', 
        
        // Tiered Reasoning
        plannerProvider: await store.get<string>('plannerProvider'),
        plannerApiKey: await store.get<string>('plannerApiKey'),
        plannerModel: await store.get<string>('plannerModel'),
        
        utilityProvider: await store.get<string>('utilityProvider'),
        utilityApiKey: await store.get<string>('utilityApiKey'),
        utilityModel: await store.get<string>('utilityModel'),

        obsidianVaultPath,
        inboxPath: (await store.get<string>('inboxPath')) || '',
        academicFolderPath: (await store.get<string>('academicFolderPath')) || 'Database',
        autoDeploy: (await store.get<boolean>('autoDeploy')) || false,
    }

    return {
        'X-AI-Provider': config.aiProvider || 'google',
        'X-AI-Key': config.aiApiKey || config.geminiApiKey || '',
        'X-AI-Model': config.aiModel || 'gemini-2.0-flash',
        
        'X-Vault-Path': config.obsidianVaultPath,
        'X-Inbox-Path': config.inboxPath || '',
        'X-Academic-Path': config.academicFolderPath || 'Database',
        'X-Auto-Deploy': String(config.autoDeploy || false),
    };
}

/**
 * Generic request wrapper
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await getAuthHeaders()
    
    // Guard: AI routes require a key configured in Settings
    const isAiRoute = path.includes('/api/ai/') || path.includes('/api/ater/') || path.includes('/api/practice/explain') || path.includes('/api/practice/vault/')
    if (isAiRoute && !authHeaders['X-AI-Key']) {
        throw new Error('AI API Key is not configured. Go to Settings > AI Configuration to add your key.')
    }
    
    const response = await fetch(`${SIDECAR_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options.headers,
        },
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `Sidecar error [${response.status}]`)
    }

    return response.json() as Promise<T>
}

export const sidecarApi = {
    health: async (): Promise<HealthResponse> => {
        const response = await fetch(`${SIDECAR_BASE_URL}/api/health`)
        if (!response.ok) throw new Error('Health check failed')
        return response.json()
    },

    // ── Obsidian Local Headless CMS ─────────────────────────
    listVaultDatabases: () =>
        request<{ databases: any[] }>('/api/vault/databases'),
    
    fetchVaultAreas: () =>
        request<{ areas: string[] }>(`/api/vault/areas`),

    createVaultDatabase: (name: string, area?: string) =>
        request<{ success: boolean; id: string }>(`/api/vault/databases`, {
            method: 'POST',
            body: JSON.stringify({ name, area })
        }),
    
    deleteVaultDatabase: (dbName: string) =>
        request<{ success: boolean }>(`/api/vault/databases/${dbName}`, {
            method: 'DELETE'
        }),

    updateVaultDatabaseSchema: (dbName: string, properties: Record<string, any>, renameFrom?: string, renameTo?: string) =>
        request<{ success: boolean }>(`/api/vault/databases/${dbName}/schema`, {
            method: 'PATCH',
            body: JSON.stringify({ properties, rename_from: renameFrom, rename_to: renameTo })
        }),
    
    queryVaultDatabase: (dbName: string) =>
        request<{ results: any[] }>(`/api/vault/databases/${dbName}`),
    
    listVaultDatabaseRows: (dbName: string) =>
        request<{ results: any[] }>(`/api/vault/databases/${dbName}`),
    
    listVaultTemplates: async () => {
        const res = await request<{ files: ObsidianFile[] }>('/api/obsidian/files');
        // Filter for files in templates folder. Usually .obsidian/templates or similar.
        // For Ater, we might have a specific templates folder. 
        // Based on the vault structure, they might be in resources/templates or 1-Meta/Templates.
        return { 
            templates: res.files
                .filter(f => !f.is_dir && (f.path.includes('Templates') || f.path.includes('templates')))
                .map(f => ({ name: f.name.replace('.md', ''), path: f.path }))
        };
    },
    
    updateVaultRow: (dbName: string, fileName: string, properties: any) =>
        request<{ success: boolean; id: string; properties: any }>(`/api/vault/databases/${encodeURIComponent(dbName)}/${encodeURIComponent(fileName)}`, {
            method: 'PATCH',
            body: JSON.stringify({ properties })
        }),
        
    createVaultRow: (dbName: string, title: string, properties: any) =>
        request<{ success: boolean; id: string; title: string; properties: any }>(`/api/vault/databases/${encodeURIComponent(dbName)}`, {
            method: 'POST',
            body: JSON.stringify({ title, properties })
        }),
        
    deleteVaultRow: (dbName: string, fileName: string) =>
        request<{ success: boolean }>(`/api/vault/databases/${encodeURIComponent(dbName)}/${encodeURIComponent(fileName)}`, {
            method: 'DELETE'
        }),

    renameVaultFile: (dbName: string, oldFileName: string, newFileName: string) =>
        request<{ success: boolean }>(`/api/vault/databases/${encodeURIComponent(dbName)}/${encodeURIComponent(oldFileName)}/rename`, {
            method: 'POST',
            body: JSON.stringify({ new_name: newFileName })
        }),

    getVaultOptions: (source: string) =>
        request<{ options: string[] }>(`/api/vault/options?source=${encodeURIComponent(source)}`),

    createVaultOption: (source: string, name: string) =>
        request<{ success: boolean; name: string }>('/api/vault/options', {
            method: 'POST',
            body: JSON.stringify({ source, name })
        }),

    updateVaultOption: (source: string, oldName: string, newName: string) =>
        request<{ success: boolean; name: string }>(`/api/vault/options?old_name=${encodeURIComponent(oldName)}`, {
            method: 'PATCH',
            body: JSON.stringify({ source, name: newName })
        }),

    deleteVaultOption: (source: string, name: string) =>
        request<{ success: boolean }>(`/api/vault/options?source=${encodeURIComponent(source)}&name=${encodeURIComponent(name)}`, {
            method: 'DELETE'
        }),

    findVaultPage: (pageName: string) =>
        request<{ found: boolean; type?: 'database' | 'note'; db_id?: string; file_name?: string; path?: string }>(`/api/vault/search?page_name=${encodeURIComponent(pageName)}`),

    searchVaultFull: (query: string) =>
        request<{ paths: string[] }>(`/api/vault/search-full?query=${encodeURIComponent(query)}`),

    getVaultGraph: () =>
        request<{ nodes: any[]; links: any[] }>('/api/vault/graph'),

    getVaultBacklinks: (pageName: string) =>
        request<{ backlinks: any[] }>(`/api/vault/backlinks?page_name=${encodeURIComponent(pageName)}`),

    // ── AI & Agents ─────────────────────────────────────────
    testAiConnection: (target: 'primary' = 'primary') =>
        request<{ success: boolean; message?: string; error?: string }>('/api/ai/test-connection', {
            method: 'POST',
            body: JSON.stringify({ target })
        }),

    // ── Obsidian & Ater ──────────────────────────────────────
    listObsidianFiles: () => request<{ files: ObsidianFile[] }>('/api/obsidian/files'),
    
    readObsidianNote: (path: string) =>
        request<ObsidianNote>(`/api/obsidian/files/${encodeURIComponent(path)}`),
    
    updateObsidianNote: (path: string, content: string) =>
        request<{ success: boolean }>(`/api/obsidian/files/${encodeURIComponent(path)}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        }),

    deleteObsidianItem: (path: string) =>
        request<{ success: boolean }>(`/api/obsidian/files/${encodeURIComponent(path)}`, {
            method: 'DELETE'
        }),

    createObsidianFile: (path: string, content: string = '', overwrite: boolean = false) =>
        request<{ success: boolean; path: string }>('/api/vault/files', {
            method: 'POST',
            body: JSON.stringify({ path, content, overwrite })
        }),

    createObsidianFolder: (path: string) =>
        request<{ success: boolean; path: string }>('/api/vault/folders', {
            method: 'POST',
            body: JSON.stringify({ path })
        }),

    moveObsidianItem: (oldPath: string, newPath: string) =>
        request<{ success: boolean; old_path: string; new_path: string }>('/api/vault/items', {
            method: 'PATCH',
            body: JSON.stringify({ old_path: oldPath, new_path: newPath })
        }),

    aiUpload: async (file: File): Promise<{ file_uri: string, name: string }> => {
        const authHeaders = await getAuthHeaders()
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`${SIDECAR_BASE_URL}/api/ai/upload`, {
            method: 'POST',
            headers: { ...authHeaders },
            body: formData,
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Upload failed' }))
            throw new Error(err.detail || 'Upload failed')
        }
        return response.json()
    },

    aterProcess: (payload: { file_path?: string; text?: string; target_hub_id?: string }) =>
        request<{ 
            session_id: string; 
            plan_raw: string; 
            plan_structured: any; 
            status: string;
            anchored_hub?: any;
            detected_curriculum?: any;
            available_hubs?: any[];
            available_options?: any;
        }>('/api/ater/process', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    aterGeneratePlan: (payload: { session_id?: string; file_path?: string; curriculum: any; target_hub_id?: string }) =>
        request<{ session_id: string; plan_raw: string; plan_structured: any; status: string }>('/api/ater/plan', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    aterConfirm: (payload: { session_id: string; command?: string; curriculum_override?: any; anchored_hub_id?: string }) =>
        request<{ ai_output: string; results: any[]; count: number; has_more: boolean; next_batch?: number; current_batch?: number; total_batches?: number; status: string }>('/api/ater/confirm', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    aterWatcherToggle: () =>
        request<{ status: string, inbox?: string }>('/api/ater/watcher/toggle', {
            method: 'POST'
        }),

    getAiRateLimits: () =>
        request<Record<string, any>>('/api/ai/rate-limits'),

    aterQueueStatus: () =>
        request<{ 
            status: string, 
            auto_process: boolean, 
            current_file: string | null, 
            current_batch: number, 
            total_batches: number, 
            last_action: string,
            processed_notes: any[],
            planned_batches: { id: number, notes: string[] }[],
            pending_count: number, 
            pending_files: string[] 
        }>('/api/ater/queue/status'),

    aterListInbox: () =>
        request<{ files: any[] }>('/api/ater/inbox'),

    aterListGenerated: () =>
        request<{ files: any[] }>('/api/ater/generated'),

    // ── RAG & Mirror ────────────────────────────────────────
    ragWatcherToggle: () =>
        request<{ status: string, vault?: string }>('/api/rag/watcher/toggle', {
            method: 'POST'
        }),

    ragSyncVault: () =>
        request<{ status: string, message: string }>('/api/rag/sync', {
            method: 'POST'
        }),

    ragSyncStatus: () =>
        request<{ status: string, progress: number, total: number, message: string }>('/api/rag/sync-status'),


    // ── Legacy / Specialists ────────────────────────────────
    listHubs: () => request<{ hubs: any[] }>('/api/ater/hubs'),
    listHubNotes: (hubId: string) => 
        request<{ notes: any[] }>(`/api/ater/hubs/${hubId}/notes`),
    generatePractice: (hubId: string, config: any) => 
        request<{ session_id: string; questions: any[]; quiz_path: string }>('/api/practice/generate', {
            method: 'POST',
            body: JSON.stringify({ hub_id: hubId, config })
        }),
    listPractices: () => request<{ practices: any[] }>('/api/practice/list'),
    getPracticeStatus: () => request<{ status: Record<string, string> }>('/api/practice/status'),
    getPractice: (path: string) => 
        request<{ questions: any[] }>('/api/practice/get', {
            method: 'POST',
            body: JSON.stringify({ path })
        }),
    deletePractice: (path: string) => 
        request<{ status: string }>('/api/practice/delete', {
            method: 'POST',
            body: JSON.stringify({ path })
        }),
    updatePracticeScore: (path: string, score: number) => 
        request<{ status: string }>('/api/practice/score', {
            method: 'POST',
            body: JSON.stringify({ path, score })
        }),

    academicsDashboard: () =>
        request<{ semesters: any[]; courses: any[]; units: any[]; exams: any[]; assignments: any[] }>('/api/academics/dashboard'),

    academicsSyncProfile: () =>
        request<{ success: boolean; profile_path: string }>('/api/academics/sync-profile', {
            method: 'POST'
        }),

    // ── Scholar & AI ──────────────────────────────────────
    explainPdfSelection: (payload: { path: string, selection: string, page?: number }) =>
        request<{ answer: string; detail?: string }>('/api/ater/explain', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    generateQuickQuestions: (payload: { path: string, selection: string, page?: number }) =>
        request<{ answer: string; detail?: string }>('/api/ater/quick-questions', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    aterExplain: (payload: { path: string, selection: string, page?: number, question?: string }) =>
        request<{ answer: string }>('/api/ater/explain', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    aterChat: (payload: { path: string, selection: string, page?: number, messages: { role: string, content: string }[] }) =>
        request<{ answer: string }>('/api/ater/chat', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    aterInteractiveQuiz: (payload: { selection: string }) =>
        request<{ questions: any[] }>('/api/ater/interactive-quiz', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    // ── Telemetry & Study Tracking ──────────────────────────
    logNoteVisit: (notePath: string, durationSeconds: number) =>
        request<{ status: string }>('/api/obsidian/log-visit', {
            method: 'POST',
            body: JSON.stringify({ note_path: notePath, duration_seconds: durationSeconds })
        }),
    
    logStudySession: (hubId: string, durationSeconds: number, mode: string = 'focus') =>
        request<{ status: string }>('/api/study/log-session', {
            method: 'POST',
            body: JSON.stringify({ hub_id: hubId, duration_seconds: durationSeconds, mode })
        }),

    logPracticeResult: (hubId: string, score: number, total: number, notePath?: string) =>
        request<{ status: string }>('/api/study/log-practice', {
            method: 'POST',
            body: JSON.stringify({ hub_id: hubId, score, total_questions: total, note_path: notePath })
        }),
    
    getStudyHistory: () =>
        request<{ sessions: any[]; telemetry: any[]; practice: any[] }>('/api/study/history'),

    clearStudyHistory: () =>
        request<{ success: boolean }>('/api/study/reset', { method: 'POST' }),

    getAiUsage: (keyHash?: string, timeframe: string = 'day') => {
        const params = new URLSearchParams();
        if (keyHash) params.append('key_hash', keyHash);
        params.append('timeframe', timeframe);
        return request<any>(`/api/ai/usage?${params.toString()}`);
    },

    getAllKeysUsage: (timeframe: string = 'day') =>
        request<any[]>(`/api/ai/usage/all?timeframe=${timeframe}`),

    // ── Spaced Repetition (SRS) & Analytics ─────────────────
    srsReview: (notePath: string, rating: number) =>
        request<{ success: boolean; card: any }>('/api/srs/review', {
            method: 'POST',
            body: JSON.stringify({ note_path: notePath, rating })
        }),
    
    srsDue: (hubId?: string) =>
        request<{ due_cards: any[] }>(`/api/srs/due${hubId ? `?hub_id=${encodeURIComponent(hubId)}` : ''}`),

    recordPerformance: (payload: { note_path: string; was_correct: boolean; time_ms: number; question_type?: string; difficulty?: string; confidence?: number; session_id?: string; question_id?: string }) =>
        request<{ success: boolean }>('/api/analytics/record', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    // ── Reference Vault ─────────────────────────────────────────────────────
    vaultList: (hubId: string) =>
        request<{ vaults: any[] }>(`/api/practice/vault/list?hub_id=${encodeURIComponent(hubId)}`),

    vaultUploadText: (hubId: string, sourceName: string, sourceText: string) =>
        request<{ path: string; total: number }>('/api/practice/vault/upload', {
            method: 'POST',
            body: JSON.stringify({ hub_id: hubId, source_name: sourceName, source_text: sourceText })
        }),

    vaultGenerate: (vaultPaths: string[], mode: string, hubId: string) =>
        request<{ questions: any[]; quiz_path: string }>('/api/practice/vault/generate', {
            method: 'POST',
            body: JSON.stringify({ vault_paths: vaultPaths, mode, hub_id: hubId })
        }),

    vaultUploadFile: async (hubId: string, file: File): Promise<{ vault_path: string; total_questions: number }> => {
        const authHeaders = await getAuthHeaders()
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`${SIDECAR_BASE_URL}/api/practice/vault/upload-file?hub_id=${encodeURIComponent(hubId)}`, {
            method: 'POST',
            headers: { ...authHeaders },
            body: formData,
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Upload failed' }))
            throw new Error(err.detail || 'File upload failed')
        }
        return response.json()
    },

    // ── Generic passthrough (for vault & other ad-hoc endpoints) ─────────
    request: async (method: string, path: string, body?: any): Promise<any> => {
        return request<any>(path, {
            method,
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        })
    },

    // ── Configuration ───────────────────────────────────────
    getConfig: async () => {
        const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
        return {
            obsidianVaultPath: (await store.get<string>('obsidianVaultPath')) || '',
            inboxPath: (await store.get<string>('inboxPath')) || '',
            academicFolderPath: (await store.get<string>('academicFolderPath')) || 'Database',
            aiProvider: (await store.get<string>('aiProvider')) || 'google',
            aiModel: (await store.get<string>('aiModel')) || 'gemini-2.0-flash',
        }
    },

    explainQuestion: (payload: { question: string; type: string; answer: any; explanation?: string; context?: string }) =>
        request<{ lesson: string }>('/api/practice/explain', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),
}
