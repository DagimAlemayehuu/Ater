import React, { useEffect, useState } from 'react'
import { Database, Table, Kanban, Calendar, Image as ImageIcon, Search } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

interface SlashCommandPopoverProps {
    onSelect: (command: string) => void
    onClose: () => void
    position: { top: number, left: number }
}

export function SlashCommandPopover({ onSelect, onClose, position }: SlashCommandPopoverProps) {
    const [databases, setDatabases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        sidecarApi.listVaultDatabases()
            .then(res => setDatabases(res.databases || []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const filteredDbs = databases.filter(db => 
        db.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div 
            className="fixed z-[999] w-64 bg-popover border border-border shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ top: position.top, left: position.left }}
        >
            <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <Search size={12} className="text-muted-foreground" />
                <input 
                    autoFocus
                    className="flex-1 bg-transparent border-none focus:outline-none text-[10px] font-bold uppercase tracking-wider placeholder:text-muted-foreground/30 text-foreground"
                    placeholder="Search databases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') onClose();
                    }}
                />
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Database size={10} /> Databases
                </div>
                
                {loading ? (
                    <div className="px-3 py-4 text-center text-[10px] text-muted-foreground animate-pulse">Scanning Vault...</div>
                ) : filteredDbs.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">No matching databases</div>
                ) : (
                    filteredDbs.map(db => (
                        <button
                            key={db.id}
                            onClick={() => onSelect(`/table ${db.id || db.name}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent rounded-lg transition-all group"
                        >
                            <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                <Table size={14} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-black text-foreground truncate uppercase tracking-tighter">{db.name}</span>
                                <span className="text-[9px] text-muted-foreground truncate opacity-60">Connected database view</span>
                            </div>
                        </button>
                    ))
                )}

                <div className="h-px bg-border my-1 mx-2" />
                
                <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Visual Blocks
                </div>
                <CommandItem icon={<ImageIcon size={14} />} label="Image" desc="Upload or link an image" onClick={() => onSelect('![[Image]]')} />
                <CommandItem icon={<Table size={14} />} label="Simple Table" desc="Add a basic markdown table" onClick={() => onSelect('| Col 1 | Col 2 | \n|---|---|\n| | |')} />
            </div>
        </div>
    )
}

function CommandItem({ icon, label, desc, onClick }: { icon: any, label: string, desc: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent rounded-lg transition-all group"
        >
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {icon}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-foreground truncate uppercase tracking-tighter">{label}</span>
                <span className="text-[9px] text-muted-foreground truncate opacity-60">{desc}</span>
            </div>
        </button>
    )
}
