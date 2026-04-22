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
                reject(new Error(`Native bridge timeout: ${path}`))
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
    pickVaultFolder: () => sidecarApi.request<{ success: boolean, path: string }>('/api/obsidian/pick-folder', {
        method: 'POST'
    }),
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
    
    findVaultPage: async (pageName: string) => {
        const res = await sidecarApi.request<any>(`/api/vault/search`, {
            method: 'POST',
            body: JSON.stringify({ query: pageName })
        })
        if (res.results && res.results.length > 0) {
            return { found: true, path: res.results[0].path }
        }
        return { found: false }
    },

    readBinaryFile: (path: string) => sidecarApi.request<{ data: string, mime: string }>(`/api/obsidian/files/binary/${encodeURIComponent(path)}`),

    listVaultDatabases: () => sidecarApi.request<{ databases: any[] }>('/api/vault/databases'),
    listVaultDatabaseRows: (dbName: string) => sidecarApi.request<{ results: any[] }>(`/api/vault/databases/${dbName}`),
    queryVaultDatabase: (dbName: string) => sidecarApi.request<{ results: any[] }>(`/api/vault/databases/${dbName}`),
    createVaultRow: (dbId: string, title: string, options: any = {}) => sidecarApi.request<any>(`/api/vault/databases/${dbId}/create`, {
        method: 'POST',
        body: JSON.stringify({ title, ...options })
    }),
    updateVaultRow: (dbId: string, rowId: string, updates: any) => sidecarApi.request<any>(`/api/vault/databases/${dbId}/rows/${rowId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    }),
    deleteVaultRow: (dbId: string, rowId: string) => sidecarApi.request<any>(`/api/vault/databases/${dbId}/rows/${rowId}`, {
        method: 'DELETE'
    }),
    listVaultTemplates: () => sidecarApi.request<{ templates: any[] }>('/api/vault/templates'),

    // ── AI & Agents (Universal) ─────────────────────────────────────────
    testAiConnection: (target: 'primary' | 'planner' | 'utility' = 'primary') => 
        sidecarApi.request<{ success: boolean; message: string }>('/api/test-ai', {
            method: 'POST',
            body: JSON.stringify({ target })
        }),

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
    okaConfirm: (payload: any) => sidecarApi.request<any>('/api/oka/confirm', { method: 'POST', body: JSON.stringify(payload) }),
    okaGeneratePlan: (payload: any) => sidecarApi.request<any>('/api/oka/plan', { method: 'POST', body: JSON.stringify(payload) }),
    okaWatcherToggle: () => sidecarApi.request<any>('/api/oka/watcher/toggle', { method: 'POST' }),
    okaWatcherStatus: () => sidecarApi.request<{ is_running: boolean, inbox: string | null }>('/api/oka/watcher/status'),
    okaListInbox: () => sidecarApi.request<{ files: any[] }>('/api/oka/inbox'),
    okaListGenerated: () => sidecarApi.request<{ files: any[] }>('/api/oka/generated'),
    okaPickFileToInbox: () => sidecarApi.request<{ success: boolean }>('/api/oka/pick-to-inbox', { method: 'POST' }),

    // ── Practice ─────────────────────────
    listPractices: () => sidecarApi.request<{ practices: any[] }>('/api/practice/list').catch(() => ({ practices: [] })),
    listHubs: () => sidecarApi.request<{ hubs: any[] }>('/api/oka/hubs').catch(() => ({ hubs: [] })),
    listHubNotes: (hubId: string) => sidecarApi.request<{ notes: any[] }>(`/api/oka/hubs/${hubId}/notes`).catch(() => ({ notes: [] })),
    generatePractice: (hubId: string, config: any) => sidecarApi.request<any>('/api/practice/generate', {
        method: 'POST',
        body: JSON.stringify({ hub_id: hubId, config })
    }),
    getPractice: (path: string) => sidecarApi.request<any>('/api/practice/get', {
        method: 'POST',
        body: JSON.stringify({ path })
    }),
    updatePracticeScore: (path: string, score: number) => sidecarApi.request<any>('/api/practice/score', {
        method: 'POST',
        body: JSON.stringify({ path, score })
    }),
    deletePractice: (path: string) => sidecarApi.request<any>('/api/practice/delete', {
        method: 'POST',
        body: JSON.stringify({ path })
    }),

    // ── Academics / Databases ─────────────────
    academicsDashboard: () => sidecarApi.request<any>('/api/academics/dashboard'),
    listDatabaseUnits: (dbId: string) => sidecarApi.request<any>(`/api/vault/databases/${dbId}/units`),
    getDatabaseStats: (dbId: string) => sidecarApi.request<any>(`/api/vault/databases/${dbId}/stats`),
    getVaultStats: () => sidecarApi.request<any>('/api/vault/stats'),
    
    // ── Scholar & AI Specialist Methods ────────
    explainPdfSelection: (payload: { path: string, selection: string, page?: number }) =>
        sidecarApi.request<{ answer: string; detail?: string }>('/api/oka/explain', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    generateQuickQuestions: (payload: { path: string, selection: string, page?: number }) =>
        sidecarApi.request<{ answer: string; detail?: string }>('/api/oka/quick-questions', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaChat: (payload: { path: string, selection: string, page?: number, messages: { role: string, content: string }[] }) =>
        sidecarApi.request<{ answer: string }>('/api/oka/chat', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    okaInteractiveQuiz: (payload: { selection: string }) =>
        sidecarApi.request<{ questions: any[] }>('/api/oka/interactive-quiz', {
            method: 'POST',
            body: JSON.stringify(payload)
        }),

    // ── Specialists ──────────────────────────
    getChronosStatus: () => sidecarApi.request<any>('/api/ai/specialists/chronos'),
    getChronosTimeline: () => sidecarApi.request<any[]>('/api/ai/chronos/timeline'),
    getWealthStatus: () => sidecarApi.request<any>('/api/ai/specialists/wealth'),
    getGymStatus: () => sidecarApi.request<any>('/api/ai/specialists/gym'),
    getScholarStatus: () => sidecarApi.request<any>('/api/ai/specialists/scholar'),
    getVaultBacklinks: (pageName: string) => sidecarApi.request<{ backlinks: any[] }>(`/api/vault/backlinks?pageName=${encodeURIComponent(pageName)}`),
}

