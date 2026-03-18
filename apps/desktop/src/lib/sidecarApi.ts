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

/**
 * Internal helper to get keys from Tauri store
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
    const notionKey = (await store.get<string>('notionApiKey')) || ''
    const geminiKey = (await store.get<string>('geminiApiKey')) || ''
    const geminiModel = (await store.get<string>('geminiModel')) || 'gemini-2.5-flash'
    const vaultPath = (await store.get<string>('obsidianVaultPath')) || ''
    const inboxPath = (await store.get<string>('inboxPath')) || ''
    const autoDeploy = (await store.get<boolean>('autoDeploy')) ? 'true' : 'false'

    return {
        'X-Notion-Key': notionKey,
        'X-Gemini-Key': geminiKey,
        'X-Gemini-Model': geminiModel,
        'X-Vault-Path': vaultPath,
        'X-Inbox-Path': inboxPath,
        'X-Auto-Deploy': autoDeploy,
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
    listNotionDatabases: () => request<{ databases: any[] }>('/api/notion/databases'),
    queryNotionDatabase: (databaseId: string) => request<{ results: any[] }>(`/api/notion/databases/${databaseId}/query`),
    listObsidianFiles: () => request<{ files: ObsidianFile[] }>('/api/obsidian/files'),
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
    brainstorm: (query: string, context?: string, systemPrompt?: string, history?: any[], fileUri?: string) =>
        request<{ response: string }>('/api/ai/brainstorm', {
            method: 'POST',
            body: JSON.stringify({ query, context, system_prompt: systemPrompt, history, file_uri: fileUri })
        }),
    updateNotionPage: (pageId: string, properties: Record<string, any>) =>
        request<{ page: any }>(`/api/notion/pages/${pageId}`, {
            method: 'PATCH',
            body: JSON.stringify(properties)
        }),
    createNotionPage: (databaseId: string, properties: Record<string, any>) =>
        request<{ page: any }>(`/api/notion/databases/${databaseId}/pages`, {
            method: 'POST',
            body: JSON.stringify({ properties })
        }),
    deleteNotionPage: (pageId: string) =>
        request<{ success: boolean }>(`/api/notion/pages/${pageId}`, {
            method: 'DELETE'
        }),
    getNotionPageContent: (pageId: string) =>
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

    // ── OKA (Autonomous Ingestion) ──────────────────────────

    okaProcess: (payload: { file_path?: string; text?: string }) =>
        request<{ session_id: string; plan_raw: string; plan_structured: any; status: string }>('/api/oka/process', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaConfirm: (payload: { session_id: string; command?: string }) =>
        request<{ ai_output: string; results: any[]; count: number; has_more: boolean; next_batch?: number; current_batch?: number; total_batches?: number; status: string }>('/api/oka/confirm', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),


    okaWatcherToggle: () =>
        request<{ status: string, inbox?: string }>('/api/oka/watcher/toggle', {
            method: 'POST'
        }),

    okaWatcherStatus: () =>
        request<{ is_running: boolean, inbox: string | null }>('/api/oka/watcher/status'),

    okaQueueStatus: () =>
        request<{ status: string, auto_process: boolean, current_file: string | null, current_batch: number, total_batches: number, pending_count: number, pending_files: string[] }>('/api/oka/queue/status'),

    okaListInbox: () =>
        request<{ files: any[] }>('/api/oka/inbox'),

    okaListGenerated: () =>
        request<{ files: any[] }>('/api/oka/generated'),

    // ── Academics ───────────────────────────────────────────

    academicsDashboard: () =>
        request<{ semesters: any[]; courses: any[]; units: any[]; exams: any[]; assignments: any[] }>('/api/academics/dashboard'),

    academicsSyncProfile: () =>
        request<{ success: boolean; profile_path: string }>('/api/academics/sync-profile', {
            method: 'POST'
        }),
}


