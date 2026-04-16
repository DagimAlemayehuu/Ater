import React, { useEffect, useState } from 'react'
import { Link2, FileText, ChevronRight, Inbox } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

interface BacklinksViewProps {
    pageName: string
    onNavigate: (path: string) => void
}

export function BacklinksView({ pageName, onNavigate }: BacklinksViewProps) {
    const [backlinks, setBacklinks] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (pageName) {
            setLoading(true)
            sidecarApi.getVaultBacklinks(pageName)
                .then(res => setBacklinks(res.backlinks || []))
                .catch(err => console.error("Backlinks failed", err))
                .finally(() => setLoading(false))
        }
    }, [pageName])

    if (!loading && backlinks.length === 0) return null

    return (
        <div className="space-y-4 pt-10 border-t border-gray-100">
            <div className="flex items-center gap-2 px-2">
                <Link2 size={12} className="text-gray-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Linked References</h3>
                <div className="h-px flex-1 bg-gray-100 ml-2" />
                <span className="text-[9px] font-bold text-gray-300">{backlinks.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                    ))
                ) : (
                    backlinks.map((link) => (
                        <button
                            key={link.path}
                            onClick={() => onNavigate(link.path)}
                            className="group text-left p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-900 hover:shadow-lg transition-all space-y-2 relative overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                {link.type === 'database' ? <Inbox size={12} className="text-gray-400" /> : <FileText size={12} className="text-gray-400" />}
                                <span className="text-[11px] font-bold text-[#111827] truncate flex-1">{link.name}</span>
                                <ChevronRight size={10} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div className="text-[9px] text-gray-400 truncate opacity-40 italic">
                                {link.path.replace('.md', '')}
                            </div>
                            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-[#111827] transition-all" />
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
