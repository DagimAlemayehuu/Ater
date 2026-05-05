/**
 * Life OS - Python Sidecar API Client
 *
 * All heavy computation (Gemini, Notion) is executed in the Python sidecar.
 * This client is the ONLY interface between React and the Python backend.
 */

import { load } from '@tauri-apps/plugin-store'

const SIDECAR_BASE_URL = 'http://127.0.0.1:8765'
const STORE_FILENAME = 'life-os-config.json'

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
        academicFolderPath: (await store.get<string>('academicFolderPath')) || '1-Academic',
        autoDeploy: (await store.get<boolean>('autoDeploy')) || false,
    }

    return {
        'X-AI-Provider': config.aiProvider || 'google',
        'X-AI-Key': config.aiApiKey || config.geminiApiKey || '',
        'X-AI-Model': config.aiModel || 'gemini-2.0-flash',
        
        // Tiered Reasoning
        'X-Planner-Provider': config.plannerProvider || config.aiProvider || 'google',
        'X-Planner-Key': config.plannerApiKey || config.aiApiKey || config.geminiApiKey || '',
        'X-Planner-Model': config.plannerModel || config.aiModel || 'gemini-2.0-flash',

        'X-Utility-Provider': config.utilityProvider || config.aiProvider || 'google',
        'X-Utility-Key': config.utilityApiKey || config.plannerApiKey || config.aiApiKey || config.geminiApiKey || '',
        'X-Utility-Model': config.utilityModel || config.aiModel || 'gemini-1.5-flash-8b',

        'X-Vault-Path': config.obsidianVaultPath,
        'X-Inbox-Path': config.inboxPath || '',
        'X-Academic-Path': config.academicFolderPath || '1-Academic',
        'X-Auto-Deploy': String(config.autoDeploy || false),
    };
}

/**
 * Generic request wrapper
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await getAuthHeaders()
    
    // Guard: AI routes require a key configured in Settings
    const isAiRoute = path.includes('/api/ai/') || path.includes('/api/oka/')
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
        // For LifeOS, we might have a specific templates folder. 
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

    getVaultGraph: () =>
        request<{ nodes: any[]; links: any[] }>('/api/vault/graph'),

    getVaultBacklinks: (pageName: string) =>
        request<{ backlinks: any[] }>(`/api/vault/backlinks?page_name=${encodeURIComponent(pageName)}`),

    // ── AI & Agents ─────────────────────────────────────────
    testAiConnection: (target: 'primary' | 'planner' | 'utility' = 'primary') =>
        request<{ success: boolean; message?: string; error?: string }>('/api/ai/test-connection', {
            method: 'POST',
            body: JSON.stringify({ target })
        }),

    brainstorm: (query: string, context?: string, systemPrompt?: string, history?: any[], fileUri?: string) =>
        request<{ response: string }>('/api/ai/brainstorm', {
            method: 'POST',
            body: JSON.stringify({ query, context, system_prompt: systemPrompt, history, file_uri: fileUri })
        }),

    executeAgent: (agentName: string, query: string) =>
        request<{ response: string }>(`/api/ai/execute/${agentName}`, {
            method: 'POST',
            body: JSON.stringify({ query })
        }),

    getOrchestratorStatus: () =>
        request<{
            current_prompt: string;
            current_plan: string;
            active_agents: string[];
            stage: string;
            next_agent: string;
            logs: string[];
        }>('/api/ai/orchestrator/status'),

    // ── Obsidian & OKA ──────────────────────────────────────
    listObsidianFiles: () => request<{ files: ObsidianFile[] }>('/api/obsidian/files'),
    
    readObsidianNote: (path: string) =>
        request<ObsidianNote>(`/api/obsidian/files/${path}`),
    
    updateObsidianNote: (path: string, content: string) =>
        request<{ success: boolean }>(`/api/obsidian/files/${path}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        }),

    deleteObsidianItem: (path: string) =>
        request<{ success: boolean }>(`/api/obsidian/files/${path}`, {
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

    okaProcess: (payload: { file_path?: string; text?: string; target_hub_id?: string }) =>
        request<{ 
            session_id: string; 
            plan_raw: string; 
            plan_structured: any; 
            status: string;
            anchored_hub?: any;
            detected_curriculum?: any;
            available_hubs?: any[];
            available_options?: any;
        }>('/api/oka/process', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaGeneratePlan: (payload: { session_id?: string; file_path?: string; curriculum: any; target_hub_id?: string }) =>
        request<{ session_id: string; plan_raw: string; plan_structured: any; status: string }>('/api/oka/plan', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaConfirm: (payload: { session_id: string; command?: string; curriculum_override?: any; anchored_hub_id?: string }) =>
        request<{ ai_output: string; results: any[]; count: number; has_more: boolean; next_batch?: number; current_batch?: number; total_batches?: number; status: string }>('/api/oka/confirm', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaWatcherToggle: () =>
        request<{ status: string, inbox?: string }>('/api/oka/watcher/toggle', {
            method: 'POST'
        }),

    getAiRateLimits: () =>
        request<Record<string, any>>('/api/ai/rate-limits'),

    okaWatcherStatus: () =>
        request<{ is_running: boolean, inbox: string | null }>('/api/oka/watcher/status'),

    okaQueueStatus: () =>
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
        }>('/api/oka/queue/status'),

    okaListInbox: () =>
        request<{ files: any[] }>('/api/oka/inbox'),

    okaListGenerated: () =>
        request<{ files: any[] }>('/api/oka/generated'),

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

    syncNotionMirror: () =>
        request<{ status: string, message: string }>('/api/notion/sync-mirror', {
            method: 'POST'
        }),

    syncNotionMirrorStatus: () =>
        request<{ status: string, progress: number, total: number, message: string }>('/api/notion/sync-mirror/status'),

    // ── Legacy / Specialists ────────────────────────────────
    listHubs: () => request<{ hubs: any[] }>('/api/oka/hubs'),
    listHubNotes: (hubId: string) => 
        request<{ notes: any[] }>(`/api/oka/hubs/${hubId}/notes`),
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
        request<{ answer: string; detail?: string }>('/api/oka/explain', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    generateQuickQuestions: (payload: { path: string, selection: string, page?: number }) =>
        request<{ answer: string; detail?: string }>('/api/oka/quick-questions', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaChat: (payload: { path: string, selection: string, page?: number, messages: { role: string, content: string }[] }) =>
        request<{ answer: string }>('/api/oka/chat', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaInteractiveQuiz: (payload: { selection: string }) =>
        request<{ questions: any[] }>('/api/oka/interactive-quiz', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    getChronosStatus: () => request<any>('/api/ai/specialists/chronos'),
    getChronosTimeline: () => request<any[]>('/api/ai/chronos/timeline'),
    getWealthStatus: () => request<any>('/api/ai/specialists/wealth'),
    getGymStatus: () => request<any>('/api/ai/specialists/gym'),
    getScholarStatus: () => request<any>('/api/ai/specialists/scholar'),
}
