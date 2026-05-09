import React, { useEffect, useState } from 'react'
import { Link2, FileText, ChevronRight, Inbox } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'

interface Backlink {
    path: string
    type: string
    name: string
}

interface BacklinksViewProps {
    pageName: string
    onNavigate: (path: string) => void
}

export function BacklinksView({ pageName, onNavigate }: BacklinksViewProps) {
    const [backlinks, setBacklinks] = useState<Backlink[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let active = true;
        if (pageName) {
            const fetchBacklinks = async () => {
                setLoading(true)
                try {
                    const res = await sidecarApi.getVaultBacklinks(pageName)
                    if (active) setBacklinks(res.backlinks || [])
                } catch (err) {
                    if (active) console.error("Backlinks failed", err)
                } finally {
                    if (active) setLoading(false)
                }
            }
            fetchBacklinks()
        }
        return () => { active = false }
    }, [pageName])

    if (!loading && backlinks.length === 0) return null

    return (
        <div className="space-y-4 pt-10 border-t border-border">
            <div className="flex items-center gap-2 px-2">
                <Link2 size={12} className="text-muted-foreground" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Linked References</h3>
                <div className="h-px flex-1 bg-border ml-2" />
                <span className="text-[9px] font-bold text-muted-foreground/40">{backlinks.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-20 bg-muted/30 rounded-xl " />
                    ))
                ) : (
                    backlinks.map((link) => (
                        <button
                            key={link.path}
                            onClick={() => onNavigate(link.path)}
                            className="group text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-lg  space-y-2 relative overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                {link.type === 'database' ? <Inbox size={12} className="text-muted-foreground" /> : <FileText size={12} className="text-muted-foreground" />}
                                <span className="text-[11px] font-bold text-foreground truncate flex-1">{link.name}</span>
                                <ChevronRight size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 " />
                            </div>
                            <div className="text-[9px] text-muted-foreground truncate opacity-40 italic">
                                {link.path.replace('.md', '')}
                            </div>
                            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-primary " />
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
