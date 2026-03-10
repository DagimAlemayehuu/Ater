/**
 * OKA - Obsidian Knowledge Architect
 * Main page component with tabbed navigation between Dashboard, Staging, Chat, and Settings.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
    Upload, FileText, Loader2, Check, X,
    Brain, Zap, MessageSquare, Rocket,
    BookOpen, AlertCircle, RefreshCw, Eye, EyeOff,
    Send, Paperclip, ArrowRight, CheckCircle2, XCircle,
    Sparkles, Archive, Plus, History, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import { useConfig } from '@/lib/ConfigContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useOka, type ChatMessage } from '@/lib/OkaContext'

/* ─────────────── Types ─────────────── */

type OkaTab = 'dashboard' | 'staging' | 'chat'

/* ─────────────── Main Component ─────────────── */

export default function Oka() {
    const { activeTab, setActiveTab, fileUri } = useOka()

    const tabs: { id: OkaTab; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <Brain size={16} /> },
        { id: 'staging', label: 'Staging Area', icon: <Archive size={16} /> },
        { id: 'chat', label: 'OKA Chat', icon: <MessageSquare size={16} /> },
    ]



    return (
        <div className="h-full flex-1 flex-col space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Parser Engine</h2>
                    <p className="text-muted-foreground">
                        Document parser and knowledge builder.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium tracking-tight bg-card">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            fileUri ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                        )} />
                        <span className="text-muted-foreground">
                            {fileUri ? 'Connected' : 'Standby'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tab Bar (Shadcn style) */}
            <div className="flex items-center justify-start">
                <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                activeTab === tab.id
                                    ? "bg-background text-foreground shadow"
                                    : "hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full min-h-0 pt-6">
                {activeTab === 'dashboard' && <OkaDashboard />}
                {activeTab === 'staging' && <OkaStagingArea />}
                {activeTab === 'chat' && <OkaChat />}
            </div>
        </div>
    )
}

/* ─────────────── Dashboard ─────────────── */

function OkaDashboard() {
    const { fileUri, setFileUri, plan, setPlan, metadata, setMetadata, setCurrentBatchId, targetUnit, setTargetUnit, setActiveTab, setStatus, setGeneratedNotes } = useOka()
    const [uploading, setUploading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)
        setFileName(file.name)

        try {
            const uri = await sidecarApi.okaIngestResource(file)
            setFileUri(uri)
        } catch (err: any) {
            setError(err.message || 'Upload failed')
            setFileName(null)
        } finally {
            setUploading(false)
        }
    }

    const handleGeneratePlan = async () => {
        if (!fileUri) return
        setGenerating(true)
        setError(null)

        try {
            const result = await sidecarApi.okaGeneratePlan(fileUri)
            setPlan(result)
            setMetadata({
                unit_name: result.unit_name,
                year: result.year,
                semester: result.semester,
                course_name: result.course_name,
                course_code: result.course_code,
                credits: result.credits,
            })
        } catch (err: any) {
            setError(err.message || 'Plan generation failed')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-muted border">
                    <Brain size={24} className="text-muted-foreground" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Document Parser</h1>
                    <p className="text-sm text-muted-foreground mt-1 tracking-tight">
                        Convert documents into structured markdown notes.
                    </p>
                </div>
            </div>

            {/* Target Unit Banner */}
            {targetUnit && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-md text-emerald-600 dark:text-emerald-400">
                            <Brain size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Target Note</p>
                            <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mt-0.5">{targetUnit.name}</h3>
                        </div>
                    </div>
                    <button
                        onClick={() => setTargetUnit(null)}
                        className="p-2 rounded-md hover:bg-emerald-500/20 text-emerald-600/70 hover:text-emerald-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Upload Section */}
            <div className="relative">
                <div className={cn(
                    "p-8 rounded-xl border-2 border-dashed transition-all duration-300",
                    fileUri
                        ? "border-primary/20 bg-muted/30"
                        : "border-border hover:border-primary/50 hover:bg-muted/30 bg-card cursor-pointer"
                )}
                    onClick={() => !fileUri && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.txt,.md,.docx,.doc,.pptx,.ppt"
                    />

                    {fileUri ? (
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-md bg-primary text-primary-foreground">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                                    Document Analyzed
                                </h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {fileName || 'Document'} — Ready to create notes.
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setFileUri(null)
                                    setPlan(null)
                                    setMetadata(null)
                                    setFileName(null)
                                }}
                                className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            {uploading ? (
                                <Loader2 size={32} className="text-muted-foreground animate-spin" />
                            ) : (
                                <div className="p-4 rounded-md bg-muted border shadow-sm">
                                    <Upload size={24} className="text-muted-foreground" />
                                </div>
                            )}
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-semibold tracking-tight">
                                    {uploading ? 'Uploading to Gemini...' : 'Upload Source Document'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    PDF, TXT, MD, DOCX, PPTX
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    <AlertCircle size={16} />
                    <p>{error}</p>
                </div>
            )}

            {/* Generate Plan Button */}
            {fileUri && !plan && (
                <button
                    onClick={handleGeneratePlan}
                    disabled={generating}
                    className={cn(
                        "w-full py-4 rounded-md font-semibold text-sm transition-all shadow-sm",
                        generating
                            ? "bg-muted text-muted-foreground cursor-wait"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    <div className="flex items-center justify-center gap-2">
                        {generating ? (
                            <>
                                <Loader2 size={16} className="animate-spin opacity-50" />
                                Analyzing Document...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Parse Document
                            </>
                        )}
                    </div>
                </button>
            )}

            {/* Plan Display */}
            {plan && metadata && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Metadata Editor */}
                    <div className="p-6 rounded-xl border bg-card shadow-sm space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-md bg-muted text-muted-foreground">
                                <BookOpen size={16} />
                            </div>
                            <div>
                                <h3 className="font-semibold tracking-tight">Document Details</h3>
                                <p className="text-sm text-muted-foreground">Edit details before parsing.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { key: 'unit_name', label: 'Unit Name' },
                                { key: 'course_name', label: 'Course' },
                                { key: 'course_code', label: 'Code' },
                                { key: 'year', label: 'Year' },
                                { key: 'semester', label: 'Semester' },
                                { key: 'credits', label: 'Credits' },
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        {label}
                                    </label>
                                    <input
                                        type={key === 'credits' ? 'number' : 'text'}
                                        value={metadata[key] || ''}
                                        onChange={(e) => setMetadata({ ...metadata, [key]: e.target.value })}
                                        className="w-full px-3 py-2 rounded-md bg-background border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                            <FileText size={16} />
                            <span className="font-medium text-foreground">{plan.total_notes} notes</span>
                            <span>across</span>
                            <span className="font-medium text-foreground">{plan.batches.length} batches</span>
                        </div>
                    </div>

                    {/* Batch Overview */}
                    <div className="grid gap-4">
                        {plan.batches.map((batch) => (
                            <div
                                key={batch.batch_id}
                                className="p-5 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-sm font-semibold border">
                                            {batch.batch_id}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium tracking-tight">Batch Sequence</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">{batch.notes.length} Objects Defined</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {batch.notes.map((note, i) => (
                                        <span key={i} className="text-xs font-medium text-muted-foreground border bg-muted/50 px-2.5 py-1 rounded-md">
                                            {note.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8">
                        <button
                            onClick={() => {
                                setCurrentBatchId(1)
                                setActiveTab('staging')
                                setStatus('idle')
                                setGeneratedNotes([])
                            }}
                            className="w-full py-6 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group border border-primary/20"
                        >
                            <Zap size={24} className="fill-current group-hover:animate-pulse" />
                            Start Architectural Synthesis
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-center text-xs text-muted-foreground mt-4 font-medium italic opacity-70">
                            Protocol A.1.3 Enforced: Canonical Titles & Tiered Synthesis
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─────────────── Staging Area ─────────────── */

function OkaStagingArea() {
    const {
        fileUri, plan, generatedNotes, setGeneratedNotes,
        currentBatchId, setCurrentBatchId, status, setStatus, startBatch, targetUnit
    } = useOka()
    const { config } = useConfig()
    const vaultPath = config?.obsidianVaultPath || ''

    const [deploying, setDeploying] = useState(false)
    const [deployResult, setDeployResult] = useState<string | null>(null)
    const [expandedNote, setExpandedNote] = useState<number | null>(null)

    const handleStartBatch = async () => {
        if (!plan) return
        const batch = plan.batches.find((b) => b.batch_id === currentBatchId)
        if (!batch) return
        await startBatch(currentBatchId, batch.notes.map(n => n.title))
    }

    const handleDeploy = async () => {
        const selected = generatedNotes.filter((n) => n.selected)
        if (selected.length === 0 || !vaultPath) return

        setDeploying(true)
        try {
            await sidecarApi.okaDeployBatch(selected, vaultPath)
            setDeployResult(`Successfully deployed ${selected.length} notes to vault!`)

            if (targetUnit) {
                const vaultName = vaultPath.split(/[/\\]/).pop() || 'Vault'
                const noteName = encodeURIComponent(selected[0].title)
                const obsUrl = `obsidian://open?vault=${vaultName}&file=${noteName}`
                await sidecarApi.updateNotionPage(targetUnit.id, {
                    "NoteBookLM ": { url: obsUrl }
                })
            }
        } catch (err: any) {
            setDeployResult(`Deployment failed: ${err.message}`)
        } finally {
            setDeploying(false)
        }
    }

    const toggleNoteSelection = (index: number) => {
        const updated = [...generatedNotes]
        updated[index] = { ...updated[index], selected: !updated[index].selected }
        setGeneratedNotes(updated)
    }

    if (!plan || !fileUri) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                    <div className="p-4 rounded-md bg-muted inline-block border">
                        <Archive size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold tracking-tight text-foreground">No Plan Available</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Upload a document and generate a plan from the Dashboard first.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-md bg-muted border text-muted-foreground">
                        <Archive size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Staging Area</h2>
                        <p className="text-sm text-muted-foreground">
                            Processing Batch {currentBatchId} of {plan.batches.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status + Actions */}
            {status === 'idle' && (
                <button
                    onClick={handleStartBatch}
                    className="w-full py-4 rounded-md font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Zap size={16} />
                        Start Parsing
                    </div>
                </button>
            )}

            {status === 'processing' && (
                <div className="p-6 rounded-xl border bg-muted/30 flex flex-col gap-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                        <Loader2 size={18} className="text-muted-foreground animate-spin" />
                        <div>
                            <h4 className="text-sm font-semibold tracking-tight">Architectural Synthesis in Progress...</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Generative Engine is processing batch {currentBatchId}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {status === 'failed' && (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 flex items-center justify-between gap-4 text-sm font-medium">
                    <div className="flex items-center gap-3 text-destructive">
                        <XCircle size={18} />
                        <div>
                            <h4 className="font-semibold">Synthesis Interrupted</h4>
                            <p className="text-destructive/80 mt-0.5">An operational failure occurred during generation.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStatus('idle')}
                        className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2 shrink-0"
                    >
                        <RefreshCw size={14} />
                        Retry Sequence
                    </button>
                </div>
            )}

            {/* Generated Notes */}
            {status === 'completed' && generatedNotes.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-semibold text-foreground">
                            Generated Assets <span className="text-muted-foreground font-normal">({generatedNotes.filter((n) => n.selected).length}/{generatedNotes.length} selected)</span>
                        </span>
                        <button
                            onClick={() =>
                                setGeneratedNotes(
                                    generatedNotes.map((n) => ({ ...n, selected: !generatedNotes.every((x) => x.selected) }))
                                )
                            }
                            className="text-sm font-medium text-primary hover:underline transition-colors focus:outline-none"
                        >
                            {generatedNotes.every((n) => n.selected) ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {generatedNotes.map((note, i) => (
                            <div
                                key={i}
                                className="bg-card border rounded-xl overflow-hidden shadow-sm transition-colors"
                            >
                                <div className="flex items-center gap-4 p-4">
                                    <button
                                        onClick={() => toggleNoteSelection(i)}
                                        className={cn(
                                            "w-5 h-5 rounded flex items-center justify-center transition-colors border",
                                            note.selected
                                                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                : "border-input bg-background hover:bg-muted"
                                        )}
                                    >
                                        {note.selected && <Check size={14} />}
                                    </button>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="text-sm font-semibold tracking-tight truncate">{note.title}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs font-medium text-muted-foreground capitalize">{note.type}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setExpandedNote(expandedNote === i ? null : i)}
                                        className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors border border-transparent hover:border-border shrink-0"
                                    >
                                        {expandedNote === i ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {expandedNote === i && (
                                    <div className="border-t bg-muted/20 p-5">
                                        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto custom-scrollbar">
                                            {note.content}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Deploy Section */}
                    <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4 mt-8">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground">Target Vault</label>
                            <span className="text-sm text-muted-foreground font-mono truncate">
                                {vaultPath || 'No vault configured in Settings'}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={handleDeploy}
                                disabled={deploying || !vaultPath}
                                className={cn(
                                    "flex-1 py-2.5 rounded-md font-medium text-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring flex items-center justify-center gap-2",
                                    deploying || !vaultPath
                                        ? "bg-muted text-muted-foreground border cursor-not-allowed"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                )}
                            >
                                {deploying ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Rocket size={16} />
                                )}
                                {deploying ? 'Deploying...' : `Deploy ${generatedNotes.filter((n) => n.selected).length} Notes`}
                            </button>

                            {currentBatchId < (plan?.batches.length || 1) && (
                                <button
                                    onClick={() => {
                                        setCurrentBatchId(currentBatchId + 1)
                                        setStatus('idle')
                                        setGeneratedNotes([])
                                        setDeployResult(null)
                                    }}
                                    disabled={!deployResult?.includes('Successfully')}
                                    className={cn(
                                        "px-5 py-2.5 rounded-md font-medium text-sm border bg-background text-foreground transition-all flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring",
                                        !deployResult?.includes('Successfully')
                                            ? "opacity-50 cursor-not-allowed grayscale bg-muted/50"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    Proceed to Next Batch
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Deploy Result */}
                    {deployResult && (
                        <div className={cn(
                            "p-4 rounded-md text-sm font-medium flex items-center gap-2 border shadow-sm",
                            deployResult.includes('Successfully')
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                            {deployResult.includes('Successfully') ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {deployResult}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─────────────── Chat ─────────────── */

function OkaChat() {
    const { fileUri, setFileUri, messages, setMessages } = useOka()

    // Sessions
    interface OkaSession {
        id: string;
        title: string;
        timestamp: number;
        messages: ChatMessage[];
        fileUri: string | null;
    }

    const [sessions, setSessions] = useState<OkaSession[]>(() => {
        try {
            const v = localStorage.getItem('lifeos_oka_sessions');
            return v ? JSON.parse(v) : [];
        } catch {
            return [];
        }
    });

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (messages.length === 0) return;

        let id = currentSessionId;
        if (!id) {
            id = Date.now().toString();
            setCurrentSessionId(id);
        }

        const newSessions = [...sessions];
        const existingIdx = newSessions.findIndex(s => s.id === id);

        const title = messages.find(m => m.role === 'user')?.content.slice(0, 40) + '...' || 'New OKA Session';

        const sessionData: OkaSession = {
            id,
            title,
            timestamp: Date.now(),
            fileUri,
            messages
        };

        if (existingIdx >= 0) {
            newSessions[existingIdx] = sessionData;
            const [item] = newSessions.splice(existingIdx, 1);
            newSessions.unshift(item);
        } else {
            newSessions.unshift(sessionData);
        }

        setSessions(newSessions);
        localStorage.setItem('lifeos_oka_sessions', JSON.stringify(newSessions));
    }, [messages, currentSessionId, fileUri]);

    const startNewChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setFileUri(null);
        setShowHistory(false);
    };

    const loadSession = (session: OkaSession) => {
        setMessages(session.messages);
        setCurrentSessionId(session.id);
        setFileUri(session.fileUri);
        setShowHistory(false);
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        localStorage.setItem('lifeos_oka_sessions', JSON.stringify(newSessions));
        if (currentSessionId === id) {
            startNewChat();
        }
    };

    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg: ChatMessage = { role: 'user', content: input.trim() }
        const updatedMessages = [...messages, userMsg]
        setMessages(updatedMessages)
        setInput('')
        setLoading(true)

        try {
            const { response } = await sidecarApi.okaChat(
                updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                fileUri || undefined,
            )
            setMessages([...updatedMessages, { role: 'model', content: response }])
        } catch (err: any) {
            setMessages([
                ...updatedMessages,
                { role: 'model', content: `Error: ${err.message}` },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const uri = await sidecarApi.okaIngestResource(file)
            setFileUri(uri)
            setMessages((prev) => [
                ...prev,
                { role: 'model', content: `📎 Document "${file.name}" attached and uploaded to AI context.` },
            ])
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                { role: 'model', content: `Failed to attach file: ${err.message}` },
            ])
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col flex-1 border bg-background shadow-xs sm:rounded-md max-w-4xl mx-auto w-full overflow-hidden mb-6 h-[calc(100vh-160px)]">
            {/* Header / History Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/10 shrink-0">
                <div className="text-sm font-semibold tracking-tight">OKA Chat</div>
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={cn(
                            "inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            showHistory ? "bg-muted text-foreground" : "bg-background border shadow-sm hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <History className="mr-2 h-3.5 w-3.5" />
                        History
                    </button>
                    <button
                        onClick={startNewChat}
                        className="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        New Chat
                    </button>

                    {showHistory && (
                        <div className="absolute top-full right-0 mt-2 w-80 max-h-[60vh] overflow-auto bg-popover text-popover-foreground border rounded-md shadow-md z-50 flex flex-col p-1 animate-in slide-in-from-top-2">
                            {sessions.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No chat history found.</div>
                            ) : (
                                sessions.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSession(session)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group",
                                            currentSessionId === session.id && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="truncate font-medium">{session.title}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(session.timestamp).toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={(e) => deleteSession(session.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-4 pt-0 pb-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pt-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full border-2 border-border mb-2">
                                <MessageSquare className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold tracking-tight">OKA Assistant</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                    Chat with the OKA Document Knowledge base. Attach a file for contextual conversations.
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className="flex gap-4 animate-in fade-in duration-300 py-4 border-b border-border/50 last:border-0 items-start">
                            <div className="shrink-0 mt-1">
                                {msg.role === 'user' ? (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="text-[10px] font-bold text-primary">YOU</span>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                        <MessageSquare size={16} className="text-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {msg.role === 'user' ? 'You' : 'OKA Assistant'}
                                </span>
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4 items-start py-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                    <Loader2 size={16} className="text-foreground animate-spin" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">OKA Assistant</span>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex w-full flex-none gap-2 mt-2"
                >
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:ring-1 focus-within:ring-ring focus-within:outline-none">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={cn(
                                "h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors focus:outline-none",
                                uploading ? "text-muted-foreground cursor-wait" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileAttach}
                            className="hidden"
                            accept=".pdf,.txt,.md,.docx,.doc,.pptx,.ppt"
                        />

                        <label className="flex-1">
                            <span className="sr-only">Chat Text Box</span>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={fileUri ? "Ask OKA about your document..." : "Type your message..."}
                                className="h-8 w-full bg-inherit text-sm focus-visible:outline-none placeholder:text-muted-foreground/60"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors focus:outline-none hidden sm:inline-flex disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
