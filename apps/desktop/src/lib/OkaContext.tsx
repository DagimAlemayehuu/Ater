/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { sidecarApi } from './sidecarApi'

export interface BatchPlan {
    unit_name: string
    year: string
    semester: string
    course_name: string
    course_code: string
    credits: number
    total_notes: number
    batches: Array<{
        batch_id: number
        notes: Array<{ title: string; type: string; reasoning: string }>
    }>
}

export interface GeneratedNote {
    title: string
    content: string
    type: string
    selected?: boolean
}

export interface ChatMessage {
    role: 'user' | 'model'
    content: string
}

interface OkaContextType {
    activeTab: 'dashboard' | 'staging' | 'chat'
    setActiveTab: (tab: 'dashboard' | 'staging' | 'chat') => void

    targetUnit: { id: string; name: string } | null
    setTargetUnit: (unit: { id: string; name: string } | null) => void

    fileUri: string | null
    setFileUri: (uri: string | null) => void

    plan: BatchPlan | null
    setPlan: (plan: BatchPlan | null) => void

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMetadata: (meta: any) => void

    currentBatchId: number
    setCurrentBatchId: (id: number) => void

    generatedNotes: GeneratedNote[]
    setGeneratedNotes: React.Dispatch<React.SetStateAction<GeneratedNote[]>>

    jobId: number | null
    setJobId: (id: number | null) => void

    status: 'idle' | 'processing' | 'completed' | 'failed'
    setStatus: (status: 'idle' | 'processing' | 'completed' | 'failed') => void

    generationError: string | null
    setGenerationError: (err: string | null) => void

    messages: ChatMessage[]
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>

    startBatch: (batchId: number, batchNotes: string[]) => Promise<void>
}

const OkaContext = createContext<OkaContextType | undefined>(undefined)

export function OkaProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'staging' | 'chat'>('dashboard')
    const [targetUnit, setTargetUnit] = useState<{ id: string; name: string } | null>(null)
    const [fileUri, setFileUri] = useState<string | null>(null)
    const [plan, setPlan] = useState<BatchPlan | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [metadata, setMetadata] = useState<any>(null)
    const [currentBatchId, setCurrentBatchId] = useState(1)
    const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([])
    const [jobId, setJobId] = useState<number | null>(null)
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')
    const [generationError, setGenerationError] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])

    // Initial load from localStorage
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        try {
            const vTab = localStorage.getItem('oka_activeTab'); if (vTab) setActiveTab(JSON.parse(vTab))
            const vUnit = localStorage.getItem('oka_targetUnit'); if (vUnit) setTargetUnit(JSON.parse(vUnit))
            const vUri = localStorage.getItem('oka_fileUri'); if (vUri) setFileUri(JSON.parse(vUri))
            const vPlan = localStorage.getItem('oka_plan'); if (vPlan) setPlan(JSON.parse(vPlan))
            const vMeta = localStorage.getItem('oka_metadata'); if (vMeta) setMetadata(JSON.parse(vMeta))
            const vBatch = localStorage.getItem('oka_currentBatchId'); if (vBatch) setCurrentBatchId(JSON.parse(vBatch))
            const vNotes = localStorage.getItem('oka_generatedNotes'); if (vNotes) setGeneratedNotes(JSON.parse(vNotes))
            const vJob = localStorage.getItem('oka_jobId'); if (vJob) setJobId(JSON.parse(vJob))
            const vStatus = localStorage.getItem('oka_status'); if (vStatus) setStatus(JSON.parse(vStatus))
            const vErr = localStorage.getItem('oka_generationError'); if (vErr) setGenerationError(JSON.parse(vErr))
            const vMsg = localStorage.getItem('oka_messages'); if (vMsg) setMessages(JSON.parse(vMsg))
        } catch (e) {
            console.warn('[OKA] Failed to load from localStorage:', e)
        }
    }, [])

    // Store state in localStorage
    useEffect(() => { localStorage.setItem('oka_activeTab', JSON.stringify(activeTab)) }, [activeTab])
    useEffect(() => { localStorage.setItem('oka_targetUnit', JSON.stringify(targetUnit)) }, [targetUnit])
    useEffect(() => { localStorage.setItem('oka_fileUri', JSON.stringify(fileUri)) }, [fileUri])
    useEffect(() => { localStorage.setItem('oka_plan', JSON.stringify(plan)) }, [plan])
    useEffect(() => { localStorage.setItem('oka_metadata', JSON.stringify(metadata)) }, [metadata])
    useEffect(() => { localStorage.setItem('oka_currentBatchId', JSON.stringify(currentBatchId)) }, [currentBatchId])
    useEffect(() => { localStorage.setItem('oka_generatedNotes', JSON.stringify(generatedNotes)) }, [generatedNotes])
    useEffect(() => { localStorage.setItem('oka_jobId', JSON.stringify(jobId)) }, [jobId])
    useEffect(() => { localStorage.setItem('oka_status', JSON.stringify(status)) }, [status])
    useEffect(() => { localStorage.setItem('oka_generationError', JSON.stringify(generationError)) }, [generationError])
    useEffect(() => { localStorage.setItem('oka_messages', JSON.stringify(messages)) }, [messages])

    // Background sync
    useEffect(() => {
        const sync = async () => {
            try {
                await sidecarApi.okaGetSettings()
            } catch {
                console.warn('[OKA] Initial settings sync failed.')
            }
        }
        sync()
    }, [])

    // Global background polling
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>

        if (status === 'processing' && jobId !== null) {
            interval = setInterval(async () => {
                try {
                    const { status: jobStatus, error } = await sidecarApi.okaGenerateStatus(jobId)
                    if (jobStatus === 'completed') {
                        clearInterval(interval)
                        const { notes } = await sidecarApi.okaGenerateResults(jobId)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setGeneratedNotes(notes.map((n: any) => ({ ...n, selected: true })))
                        setGenerationError(null)
                        setStatus('completed')
                    } else if (jobStatus === 'failed') {
                        clearInterval(interval)
                        setGenerationError(error || 'Generation failed in sidecar.')
                        setStatus('failed')
                    }
                } catch {
                    // Do nothing on single failure, let it retry until success or definitive failure
                }
            }, 3000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [status, jobId])

    const startBatch = async (batchId: number, batchNotes: string[]) => {
        if (!fileUri || !plan) return

        setStatus('processing')
        setGenerationError(null)
        setGeneratedNotes([])
        setCurrentBatchId(batchId)

        try {
            const result = await sidecarApi.okaGenerateBatch({
                file_uri: fileUri,
                unit_context: metadata?.unit_name || plan.unit_name,
                batch_id: batchId,
                batch_notes: batchNotes,
                metadata: metadata,
            })
            setJobId(result.job_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setGenerationError(err?.message || 'Failed to enqueue generation job.')
            setStatus('failed')
        }
    }

    return (
        <OkaContext.Provider value={{
            activeTab, setActiveTab,
            targetUnit, setTargetUnit,
            fileUri, setFileUri,
            plan, setPlan,
            metadata, setMetadata,
            currentBatchId, setCurrentBatchId,
            generatedNotes, setGeneratedNotes,
            jobId, setJobId,
            status, setStatus,
            generationError, setGenerationError,
            messages, setMessages,
            startBatch
        }}>
            {children}
        </OkaContext.Provider>
    )
}

export function useOka() {
    const context = useContext(OkaContext)
    if (context === undefined) {
        throw new Error('useOka must be used within an OkaProvider')
    }
    return context
}
