import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { 
    Layers, Search, ChevronRight, RefreshCw, 
    Database, ArrowRight, DatabaseZap, Box
} from 'lucide-react'

export default function VaultSync() {
    const [databases, setDatabases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetchDatabases()
    }, [])

    const fetchDatabases = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listVaultDatabases()
            setDatabases(res.databases || [])
        } catch (err) {
            console.error('Failed to fetch databases:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredDatabases = databases.filter(db => 
        (db?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    )

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 pb-32">
            {/* Header Content */}
            <div className="px-6 pt-12 pb-6 border-b border-border/10">
                <nav className="flex items-center gap-2 mb-4">
                    <span className="label-sm text-secondary">VAULT</span>
                    <ChevronRight size={10} className="text-border" />
                    <span className="label-sm text-primary">MIRRORED_REGISTRY</span>
                </nav>
                
                <h1 className="display-md mb-6">Notion Mirror</h1>
                
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search mirrored modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/30 border border-border p-4 pl-12 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                             <RefreshCw className="animate-spin text-primary" size={32} />
                             <span className="label-sm">Synchronizing Registry...</span>
                        </div>
                    ) : filteredDatabases.length > 0 ? (
                        filteredDatabases.map((db, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(`/databases/${db.id}`)}
                                className="bg-muted/20 p-6 border border-border flex flex-col gap-4 text-left hover:bg-muted/40 transition-all group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 bg-primary flex items-center justify-center text-white">
                                        <Layers size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase border border-primary px-2 py-0.5 tracking-tighter">DB_V2</span>
                                </div>
                                
                                <div>
                                    <h3 className="headline-sm text-primary mb-1 break-words">{db.name.replace(/_/g, ' ')}</h3>
                                    <p className="label-sm text-muted-foreground truncate">{db.id}</p>
                                </div>

                                <div className="flex justify-between items-center border-t border-border/10 pt-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/40">ITEM COUNT</span>
                                        <span className="body-md font-bold">{db.count || 0} Assets</span>
                                    </div>
                                    <ArrowRight className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-border gap-4 opacity-50">
                            <Box size={48} className="text-muted-foreground" />
                            <p className="label-sm">No mirrored databases found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

