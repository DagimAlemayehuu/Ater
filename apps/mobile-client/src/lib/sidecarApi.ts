const SIDECAR_BASE_URL = window.location.origin.includes('localhost:3000') ? '' : 'http://localhost:8765'

export interface ObsidianFile {
    path: string
    is_dir: boolean
}

export const sidecarApi = {
    health: async () => {
        const response = await fetch(`${SIDECAR_BASE_URL}/api/health`)
        return response.json()
    },

    // Generic request wrapper
    async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const config = JSON.parse(localStorage.getItem('life-os-config') || '{}')
        
        const vaultPath = config.obsidianVaultPath || '/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault'
        
        const authHeaders: Record<string, string> = {
            'X-AI-Provider': config.aiProvider || 'google',
            'X-AI-Key': config.aiApiKey || '',
            'X-AI-Model': config.aiModel || 'gemini-2.0-flash',
            'X-Vault-Path': vaultPath,
            'X-Inbox-Path': config.inboxPath || '',
            'X-Academic-Path': config.academicFolderPath || '1-Academic',
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
    },

    // Obsidian
    listVaultDatabases: () => sidecarApi.request<{ databases: any[] }>('/api/vault/databases'),
    queryVaultDatabase: (dbName: string) => sidecarApi.request<{ results: any[] }>(`/api/vault/databases/${dbName}`),
    listObsidianFiles: () => sidecarApi.request<{ files: any[] }>('/api/obsidian/files'),
    readObsidianNote: (path: string) => sidecarApi.request<any>(`/api/obsidian/files/${path}`),
    
    // AI / OKA
    okaQueueStatus: () => sidecarApi.request<any>('/api/oka/queue/status'),
    okaProcess: (payload: any) => sidecarApi.request<any>('/api/oka/process', { method: 'POST', body: JSON.stringify(payload) }),
    
    // Practice
    listPractices: () => sidecarApi.request<{ practices: any[] }>('/api/practice/list'),
    academicsDashboard: () => sidecarApi.request<any>('/api/academics/dashboard'),
    
    // RAG
    ragSyncStatus: () => sidecarApi.request<any>('/api/rag/sync-status'),
}
