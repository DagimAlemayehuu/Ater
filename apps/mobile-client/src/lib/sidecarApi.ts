/**
 * Life OS - Mobile Scriptable API Client
 *
 * This client routes all requests through the iOS Scriptable bridge.
 */

export interface HealthResponse {
    status: string
    platform: string
}

export interface ObsidianFile {
    name: string
    path: string
    is_dir: boolean
}

export interface ObsidianNote {
    metadata: Record<string, any>
    content: string
}

export const sidecarApi = {
    // Generic request wrapper for Scriptable Bridge
    async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(7)
            
            const handler = (event: any) => {
                if (event.detail.requestId === requestId) {
                    window.removeEventListener('lifeos-api-response', handler)
                    if (event.detail.error) {
                        reject(new Error(event.detail.error))
                    } else {
                        resolve(event.detail.data)
                    }
                }
            }
            
            window.addEventListener('lifeos-api-response', (handler as any))
            
            // Timeout for bridge response
            setTimeout(() => {
                window.removeEventListener('lifeos-api-response', (handler as any))
                reject(new Error('Native bridge timeout'))
            }, 60000)

            // Map API calls to Universal AI Bridge if needed
            if (path.includes('/api/ai/') || path.includes('/api/oka/')) {
                if (path === '/api/ai/brainstorm' || path === '/api/ai/execute') {
                    const body = options.body ? JSON.parse(options.body as string) : {}
                    const config = JSON.parse(localStorage.getItem('life-os-config') || '{}')
                    
                    ;(window as any).LifeOS.send('api_request', {
                        path: '/api/ai/universal',
                        method: 'POST',
                        body: JSON.stringify({
                            provider: config.aiProvider || 'google',
                            model: config.aiModel || 'gemini-2.0-flash',
                            messages: body.history || [{ role: 'user', content: body.query }],
                            system_prompt: body.system_prompt
                        }),
                        requestId
                    })
                    return
                }
            }

            ;(window as any).LifeOS.send('api_request', {
                path,
                method: options.method || 'GET',
                body: options.body,
                requestId
            })
        })
    },

    health: () => sidecarApi.request<HealthResponse>('/api/health'),

    // ── Obsidian Local ─────────────────────────
    listObsidianFiles: (recursive = false) => sidecarApi.request<{ files: ObsidianFile[] }>('/api/obsidian/files', {
        method: 'POST',
        body: JSON.stringify({ recursive })
    }),
    readObsidianNote: (path: string) => sidecarApi.request<ObsidianNote>(`/api/obsidian/files/${encodeURIComponent(path)}`),
    updateObsidianNote: (path: string, content: string) => sidecarApi.request<{ success: boolean }>(`/api/obsidian/files/${encodeURIComponent(path)}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
    }),
    deleteObsidianItem: (path: string) => sidecarApi.request<{ success: boolean }>(`/api/obsidian/files/${encodeURIComponent(path)}`, {
        method: 'DELETE'
    }),
    
    findVaultPage: (pageName: string) => sidecarApi.request<any>(`/api/vault/search`, {
        method: 'POST',
        body: JSON.stringify({ query: pageName })
    }),

    // ── AI & Agents (Universal) ─────────────────────────────────────────
    brainstorm: (query: string, context?: string, systemPrompt?: string, history?: any[]) => 
        sidecarApi.request<{ response: string }>('/api/ai/brainstorm', {
            method: 'POST',
            body: JSON.stringify({ query, context, system_prompt: systemPrompt, history })
        }),

    executeAgent: (agentName: string, query: string) =>
        sidecarApi.request<{ response: string }>(`/api/ai/execute/${agentName}`, {
            method: 'POST',
            body: JSON.stringify({ query })
        }),

    // ── OKA ─────────────────────────────────────────
    okaQueueStatus: () => sidecarApi.request<any>('/api/oka/queue/status').catch(() => ({ status: 'idle', pending_count: 0 })),
    okaProcess: (payload: any) => sidecarApi.request<any>('/api/oka/process', { method: 'POST', body: JSON.stringify(payload) }),

    // ── Practice ─────────────────────────
    listPractices: () => sidecarApi.request<{ practices: any[] }>('/api/practice/list').catch(() => ({ practices: [] })),
    listHubs: () => sidecarApi.request<{ hubs: any[] }>('/api/vault/hubs').catch(() => ({ hubs: [] })),
    listHubNotes: (hubId: string) => sidecarApi.request<{ notes: any[] }>(`/api/vault/hubs/${hubId}/notes`).catch(() => ({ notes: [] })),
    generatePractice: (hubId: string, config: any) => sidecarApi.request<any>('/api/practice/generate', {
        method: 'POST',
        body: JSON.stringify({ hubId, ...config })
    }),
    getPractice: (path: string) => sidecarApi.request<any>(`/api/practice/session?path=${encodeURIComponent(path)}`),
    updatePracticeScore: (path: string, score: number) => sidecarApi.request<any>('/api/practice/score', {
        method: 'POST',
        body: JSON.stringify({ path, score })
    }),
}
