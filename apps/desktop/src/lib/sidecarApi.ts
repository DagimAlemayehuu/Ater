/**
 * Life OS - Python Sidecar API Client
 *
 * All heavy computation (Gemini, Notion) is executed in the Python sidecar.
 * This client is the ONLY interface between React and the Python backend.
 */

import { load } from '@tauri-apps/plugin-store'

const SIDECAR_BASE_URL = 'http://localhost:8765'
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
    listNotionDatabases: () => request<{ databases: any[] }>('/api/notion/databases'),
    queryNotionDatabase: (databaseId: string) => request<{ results: any[] }>(`/api/notion/databases/${databaseId}/query`),
    listObsidianFiles: () => request<{ files: ObsidianFile[] }>('/api/obsidian/files'),
    brainstorm: (query: string, context?: string, systemPrompt?: string) =>
        request<{ response: string }>('/api/ai/brainstorm', {
            method: 'POST',
            body: JSON.stringify({ query, context, system_prompt: systemPrompt })
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
}
