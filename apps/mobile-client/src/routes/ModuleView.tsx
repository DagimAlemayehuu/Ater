import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

export default function ModuleView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await sidecarApi.queryVaultDatabase(id!)
                setRows(res.results)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 overflow-y-auto custom-scrollbar">
            {/* Header Content */}
            <div className="px-6 pt-12 pb-8">
                <nav className="flex items-center gap-2 mb-6 overflow-x-auto whitespace-nowrap">
                    <button onClick={() => navigate('/registry')} className="label-sm text-secondary hover:text-primary transition-colors">REGISTRY</button>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-primary">{id?.replace(/-/g, ' ').toUpperCase()}</span>
                </nav>
                
                <h1 className="display-md mb-8">{id?.replace(/-/g, ' ')}</h1>
                
                {/* Metadata Panel (Mirrored Design) */}
                <div className="bg-surface-container-low p-5 mb-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-border/10 pb-3">
                        <span className="label-md text-secondary">Module ID</span>
                        <span className="body-md font-medium text-primary uppercase tracking-tighter">{id}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/10 pb-3">
                        <span className="label-md text-secondary">Asset Path</span>
                        <span className="body-md font-medium text-primary">3-Database/{id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="label-md text-secondary">Status</span>
                        <span className="label-sm bg-primary text-on-primary px-2 py-1 tracking-wider">INDEXED</span>
                    </div>
                </div>

                {/* Items List (Card Progression Design) */}
                <section className="space-y-4">
                    <h2 className="label-sm text-secondary mb-6">{rows.length} COMPONENT ASSETS</h2>
                    
                    {loading ? (
                        <div className="space-y-4">
                             {Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-muted animate-pulse ghost-border" />
                             ))}
                        </div>
                    ) : rows.map((row, i) => (
                        <Link
                            key={i}
                            to={`/note/${encodeURIComponent(row.path || '')}`}
                            className="bg-surface-container-lowest p-5 ghost-border flex items-center gap-5 hover:bg-accent transition-all group"
                        >
                            <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-[18px]">description</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-primary truncate">{row.title || row.name || 'Untitled Note'}</h3>
                                <p className="body-md text-secondary text-[11px] uppercase tracking-widest mt-0.5">
                                    STABILITY {row.stability || '85%'} · {row.course || 'GENERAL'}
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-border/40 group-hover:text-primary transition-colors">chevron_right</span>
                        </Link>
                    ))}
                </section>
            </div>

            {/* Bottom Spacing */}
            <div className="h-24 shrink-0" />
        </div>
    )
}
