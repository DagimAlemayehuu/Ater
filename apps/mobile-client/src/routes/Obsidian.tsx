import React, { useState, useEffect } from 'react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { NoteReader } from './NoteReader'
import { useNavigate } from 'react-router-dom'

export default function Obsidian() {
    const [files, setFiles] = useState<ObsidianFile[]>([])
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState<'explorer' | 'oka'>('explorer')
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [queue, setQueue] = useState<any>(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchFiles()
        fetchQueue()
        const it = setInterval(fetchQueue, 5000)
        return () => clearInterval(it)
    }, [])

    const fetchFiles = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listObsidianFiles()
            setFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch obsidian files:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchQueue = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setQueue(res)
        } catch (e) {}
    }

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(path)) newExpanded.delete(path)
        else newExpanded.add(path)
        setExpandedFolders(newExpanded)
    }

    const selectFile = (path: string) => {
        navigate(`/note/${encodeURIComponent(path)}`)
    }

    const renderTree = (pathPrefix = '') => {
        const filtered = files.filter(f => {
            const path = f?.path || ''
            const relative = pathPrefix ? path.slice(pathPrefix.length + 1) : path
            return !relative.includes('/') && (!searchQuery || path.toLowerCase().includes((searchQuery || '').toLowerCase()))
        })

        return filtered.map(file => {
            const isExpanded = expandedFolders.has(file.path)
            return (
                <div key={file.path} className="flex flex-col">
                    <div 
                        onClick={() => file.is_dir ? toggleFolder(file.path) : selectFile(file.path)}
                        className={cn(
                            "flex items-center gap-4 py-4 px-2 border-b border-border/10 transition-colors group",
                            file.is_dir ? "font-bold" : "font-normal"
                        )}
                    >
                        <span className="material-symbols-outlined text-secondary text-[20px]">
                            {file.is_dir ? (isExpanded ? 'folder_open' : 'folder') : 'description'}
                        </span>
                        <span className="truncate text-[14px] flex-1 leading-none transition-colors group-hover:text-primary">
                            {file.path.split('/').pop()?.replace(/_/g, ' ')}
                        </span>
                        {file.is_dir && (
                            <span className={cn("material-symbols-outlined text-[16px] transition-transform", isExpanded && "rotate-90")}>
                                chevron_right
                            </span>
                        )}
                    </div>
                </div>
            )
        })
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700">
            {/* View Switcher Tabs (Editorial Style) */}
            <div className="flex bg-surface-container-low border-b border-border/10 p-1 m-4">
                <button 
                    onClick={() => setView('explorer')}
                    className={cn(
                        "flex-1 py-3 label-sm text-[9px] transition-all",
                        view === 'explorer' ? "bg-primary text-on-primary" : "text-secondary"
                    )}
                >
                    EXPLORER
                </button>
                <button 
                    onClick={() => setView('oka')}
                    className={cn(
                        "flex-1 py-3 label-sm text-[9px] transition-all",
                        view === 'oka' ? "bg-primary text-on-primary" : "text-secondary"
                    )}
                >
                    INGESTION_QUEUE {queue?.active_batches?.length > 0 && `(${queue.active_batches.length})`}
                </button>
            </div>

            {view === 'explorer' ? (
                <div className="flex-1 flex flex-col overflow-hidden px-6">
                    <div className="pt-4 pb-8 flex flex-col gap-6">
                         <nav className="flex items-center gap-2">
                            <span className="label-sm text-secondary">KNOWLEDGE</span>
                            <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                            <span className="label-sm text-primary">VAULT EXPLORER</span>
                        </nav>
                        <h1 className="display-md text-[2.25rem]">Obsidian Vault</h1>
                        
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Search all knowledge assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-muted border-none text-[13px] font-medium px-5 py-4 pl-12 rounded-none focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
                        {loading ? (
                             <div className="py-20 text-center opacity-40">
                                <span className="material-symbols-outlined animate-spin text-[32px]">refresh</span>
                             </div>
                        ) : renderTree()}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col px-6 pt-6 overflow-y-auto custom-scrollbar">
                    <div className="mb-10 text-center py-12 bg-surface-container-low ghost-border px-8">
                         <div className="w-16 h-16 bg-primary mx-auto flex items-center justify-center text-white mb-6">
                             <span className="material-symbols-outlined text-[32px]">upload</span>
                         </div>
                         <h2 className="headline-sm mb-2">Autonomous Ingestion</h2>
                         <p className="body-md italic tracking-tight opacity-60">Upload PDF source material to trigger the autonomous OKA v23 synthesis pipeline.</p>
                         <button className="mt-8 w-full py-4 bg-primary text-on-primary label-sm tracking-widest font-black">
                             SELECT SOURCE MATERIAL
                         </button>
                    </div>

                    {/* Active Queue */}
                    <section className="pb-32">
                         <h2 className="label-sm text-secondary mb-6 tracking-[0.3em]">ACTIVE PIPELINE</h2>
                         {queue?.active_batches?.length > 0 ? (
                             <div className="space-y-4">
                                 {queue.active_batches.map((batch: any, i: number) => (
                                     <div key={i} className="bg-surface-container-lowest p-6 ghost-border border-l-4 border-primary">
                                         <div className="flex justify-between items-start mb-4">
                                             <div className="flex items-center gap-3">
                                                 <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">refresh</span>
                                                 <h3 className="font-bold text-sm uppercase tracking-tight">{batch.name || 'Processing Cluster'}</h3>
                                             </div>
                                             <span className="label-sm bg-muted px-2 py-0.5">{batch.status || 'INGESTING'}</span>
                                         </div>
                                         <div className="w-full h-1 bg-border/20 mb-2">
                                             <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${batch.progress || 35}%` }} />
                                         </div>
                                         <div className="flex justify-between text-[8px] font-black opacity-40 uppercase tracking-widest">
                                             <span>Step: Atomic Synthesis</span>
                                             <span>{batch.progress || 35}%</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <div className="py-20 text-center border-2 border-dashed border-border opacity-40">
                                 <span className="material-symbols-outlined text-[48px] mb-4">hourglass_empty</span>
                                 <p className="label-sm">Pipeline Idle. Awaiting payload.</p>
                             </div>
                         )}
                    </section>
                </div>
            )}
        </div>
    )
}
