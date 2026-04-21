import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

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
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700">
            {/* Header Content */}
            <div className="px-6 pt-12 pb-8">
                <nav className="flex items-center gap-2 mb-6">
                    <span className="label-sm text-secondary">VAULT</span>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-primary">MIRRORED REGISTRY</span>
                </nav>
                
                <h1 className="display-md mb-8">Notion Mirror</h1>
                
                {/* Search Bar (High Fidelity) */}
                <div className="relative mb-10 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-[20px] transition-colors group-focus-within:text-primary">search</span>
                    <input
                        type="text"
                        placeholder="Search mirrored modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted border-none text-[14px] font-medium px-5 py-4 pl-12 rounded-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>

                {/* Databases Grid */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                             <span className="material-symbols-outlined animate-spin text-[32px]">refresh</span>
                             <span className="label-sm">Synchronizing Registry...</span>
                        </div>
                    ) : filteredDatabases.length > 0 ? (
                        filteredDatabases.map((db, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(`/databases/${db.id}`)}
                                className="bg-surface-container-low p-6 flex flex-col gap-4 text-left hover:bg-accent transition-colors group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 bg-primary flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                                        <span className="material-symbols-outlined text-[20px]">layers</span>
                                    </div>
                                    <span className="label-sm bg-primary text-on-primary px-2 py-0.5 tracking-tighter">DB v2</span>
                                </div>
                                
                                <div>
                                    <h3 className="headline-sm text-primary mb-1">{db.name.replace(/_/g, ' ')}</h3>
                                    <p className="label-md text-secondary uppercase tracking-widest">{db.id}</p>
                                </div>

                                <div className="flex justify-between items-center border-t border-border/10 pt-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="label-sm text-[8px] opacity-40">ITEM COUNT</span>
                                        <span className="body-md font-bold">{db.count || 0} Assets</span>
                                    </div>
                                    <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="py-20 text-center opacity-40 border-2 border-dashed border-border">
                            <span className="material-symbols-outlined text-[48px] mb-4">database_off</span>
                            <p className="label-sm">No mirrored databases found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Spacing */}
            <div className="h-24 shrink-0" />
        </div>
    )
}
