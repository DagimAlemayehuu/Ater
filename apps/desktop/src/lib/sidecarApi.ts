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

export interface NotionPage {
    id: string
    object: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: Record<string, any>
    url: string
}

export interface ObsidianFile {
    name: string
    path: string
    full_path: string
    modified: string
    size: number
}

export interface OkaSettings {
    google_api_key?: string
    selected_model?: string
    vault_path?: string
    system_instruction_part_a?: string
    system_instruction_part_b?: string
}

/**
 * Internal helper to get keys from Tauri store
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
    const notionKey = (await store.get<string>('notionApiKey')) || ''
    const geminiKey = (await store.get<string>('geminiApiKey')) || ''
    const geminiModel = (await store.get<string>('geminiModel')) || 'gemini-2.5-flash'
    const vaultPath = (await store.get<string>('obsidianVaultPath')) || ''

    return {
        'X-Notion-Key': notionKey,
        'X-Gemini-Key': geminiKey,
        'X-Gemini-Model': geminiModel,
        'X-Vault-Path': vaultPath,
    }
}

/**
 * Generic request wrapper
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await getAuthHeaders()
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
    listNotionPages: () => request<{ pages: NotionPage[] }>('/api/notion/pages'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listNotionDatabases: () => request<{ databases: any[] }>('/api/notion/databases'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryNotionDatabase: (databaseId: string) => request<{ results: any[] }>(`/api/notion/databases/${databaseId}/query`),
    listObsidianFiles: () => request<{ files: ObsidianFile[] }>('/api/obsidian/files'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    brainstorm: (query: string, context?: string, systemPrompt?: string, history?: any[]) =>
        request<{ response: string }>('/api/ai/brainstorm', {
            method: 'POST',
            body: JSON.stringify({ query, context, system_prompt: systemPrompt, history })
        }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateNotionPage: (pageId: string, properties: Record<string, any>) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ page: any }>(`/api/notion/pages/${pageId}`, {
            method: 'PATCH',
            body: JSON.stringify(properties)
        }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createNotionPage: (databaseId: string, properties: Record<string, any>) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ page: any }>(`/api/notion/databases/${databaseId}/pages`, {
            method: 'POST',
            body: JSON.stringify({ properties })
        }),
    deleteNotionPage: (pageId: string) =>
        request<{ success: boolean }>(`/api/notion/pages/${pageId}`, {
            method: 'DELETE'
        }),
    getNotionPageContent: (pageId: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ blocks: any[] }>(`/api/notion/pages/${pageId}/content`),
    updateNotionPageContent: (pageId: string, markdown: string) =>
        request<{ success: boolean }>(`/api/notion/pages/${pageId}/content`, {
            method: 'PUT',
            body: JSON.stringify({ markdown })
        }),
    readObsidianNote: (path: string) =>
        request<{ content: string }>(`/api/obsidian/files/${path}`),
    updateObsidianNote: (path: string, content: string) =>
        request<{ success: boolean }>(`/api/obsidian/files/${path}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        }),
    savePersonaPrompt: (name: string, content: string) =>
        request<{ success: boolean, path: string }>('/api/personae/save', {
            method: 'POST',
            body: JSON.stringify({ name, content })
        }),

    // ── OKA (Obsidian Knowledge Architect) ──────────────────────

    okaIngestResource: async (file: File): Promise<string> => {
        const authHeaders = await getAuthHeaders()
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`${SIDECAR_BASE_URL}/api/oka/ingest-resource`, {
            method: 'POST',
            headers: { ...authHeaders },
            body: formData,
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Ingest failed' }))
            throw new Error(err.detail || 'Ingest failed')
        }
        const data = await response.json()
        return data.file_uri
    },

    okaIngestLocalPath: (path: string) =>
        request<{ file_uri: string }>('/api/oka/ingest-local-path', {
            method: 'POST',
            body: JSON.stringify({ path }),
        }),

    okaGeneratePlan: (fileUri: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<any>('/api/oka/generate-plan', {
            method: 'POST',
            body: JSON.stringify({ file_uri: fileUri }),
        }),

    okaGenerateBatch: (opts: {
        file_uri: string
        unit_context: string
        batch_id?: number
        batch_notes?: string[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata?: any
    }) =>
        request<{ job_id: number; status: string }>('/api/oka/generate-batch', {
            method: 'POST',
            body: JSON.stringify(opts),
        }),

    okaGenerateStatus: (jobId: number) =>
        request<{ status: string; error?: string | null }>(`/api/oka/generate-status/${jobId}`),

    okaGenerateResults: (jobId: number) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ notes: any[] }>(`/api/oka/generate-results/${jobId}`),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    okaDeployBatch: (notes: any[], vaultPath: string) =>
        request<{ status: string }>('/api/oka/deploy-batch', {
            method: 'POST',
            body: JSON.stringify({ notes, vault_path: vaultPath }),
        }),

    okaHubStructure: (hubPath: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<any[]>(`/api/oka/hub-structure?hub_file_path=${encodeURIComponent(hubPath)}`),

    okaValidatePath: (vaultPath: string) =>
        request<{ is_valid: boolean }>(`/api/oka/validate-path?vault_path=${encodeURIComponent(vaultPath)}`),

    okaGetSettings: () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<any>('/api/oka/settings'),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    okaUpdateSettings: (settings: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<any>('/api/oka/settings', {
            method: 'PATCH',
            body: JSON.stringify(settings),
        }),

    okaTestApi: (apiKey: string) =>
        request<{ status: string; message: string }>('/api/oka/test-api', {
            method: 'POST',
            body: JSON.stringify({ api_key: apiKey }),
        }),

    okaChat: (messages: { role: string; content: string }[], fileUri?: string) =>
        request<{ response: string }>('/api/oka/chat', {
            method: 'POST',
            body: JSON.stringify({ messages, file_uri: fileUri }),
        }),

    // ── Academics ───────────────────────────────────────────

    academicsDashboard: () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ semesters: any[]; courses: any[]; units: any[]; exams: any[]; assignments: any[] }>('/api/academics/dashboard'),

    academicsSyncProfile: () =>
        request<{ success: boolean; profile_path: string }>('/api/academics/sync-profile', {
            method: 'POST'
        }),

    // ── Vault Brain (RAG) ───────────────────────────────────

    vaultSync: (force: boolean = false) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ status: string; result: any }>('/api/vault/sync', {
            method: 'POST',
            body: JSON.stringify({ force })
        }),

    vaultSearch: (query: string, limit: number = 5) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request<{ results: any[] }>(`/api/vault/search?q=${encodeURIComponent(query)}&limit=${limit}`),

    vaultClearIndex: () =>
        request<{ status: string; message: string }>('/api/vault/index', {
            method: 'DELETE'
        }),

    debuggerQuery: (query: string) =>
        request<{ response: string; sources: string[] }>('/api/debugger/query', {
            method: 'POST',
            body: JSON.stringify({ query })
        }),
}


