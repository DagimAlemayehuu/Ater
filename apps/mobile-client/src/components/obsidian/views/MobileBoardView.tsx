import React, { useMemo } from 'react'
import { cn } from '../../../lib/utils'
import { MoreHorizontal, Plus } from 'lucide-react'

interface MobileBoardViewProps {
    rows: any[]
    schema: Record<string, any>
    groupBy?: string | null
    hiddenProperties?: string[]
    onSelect: (row: any) => void
}

export function MobileBoardView({ rows, schema, groupBy, hiddenProperties = [], onSelect }: MobileBoardViewProps) {
    // Use the provided groupBy or find a grouping property (Status, Stage, etc.)
    const groupKey = useMemo(() => {
        if (groupBy) return groupBy
        const keys = Object.keys(schema)
        return keys.find(k => k.toLowerCase() === 'status') || 
               keys.find(k => k.toLowerCase() === 'stage') || 
               keys.find(k => k.toLowerCase() === 'category') ||
               keys[0]
    }, [schema, groupBy])

    const groups = useMemo(() => {
        const map: Record<string, any[]> = {}
        rows.forEach(row => {
            const val = String(row[groupKey] || 'No ' + groupKey)
            if (!map[val]) map[val] = []
            map[val].push(row)
        })
        return map
    }, [rows, groupKey])

    return (
        <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar bg-black/5">
            {Object.entries(groups).map(([name, groupRows]) => (
                <div key={name} className="w-[85vw] shrink-0 h-full flex flex-col p-4 snap-center">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">{name}</h2>
                            <span className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold text-muted-foreground">{groupRows.length}</span>
                        </div>
                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground">
                            <MoreHorizontal size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                        {groupRows.map((row, idx) => (
                            <div 
                                key={row.id || idx}
                                onClick={() => onSelect(row)}
                                className="bg-zinc-900 border border-white/5 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all"
                            >
                                <h3 className="text-sm font-bold text-foreground mb-3">
                                    {row.title || row.id?.replace('.md', '').replace(/_/g, ' ')}
                                </h3>
                                
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(row)
                                        .filter(([k]) => k !== 'id' && k !== 'title' && k !== groupKey && !hiddenProperties.includes(k) && typeof row[k] === 'string')
                                        .slice(0, 3)
                                        .map(([k, v]) => (
                                            <span key={k} className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                                {String(v)}
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                        
                        <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground/30 hover:text-muted-foreground transition-colors group">
                            <Plus size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Add Item</span>
                        </button>

                        <div className="h-10" />
                    </div>
                </div>
            ))}

            {/* Empty state if no groups */}
            {Object.keys(groups).length === 0 && (
                <div className="w-full flex items-center justify-center opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-widest">No Grouped Data</p>
                </div>
            )}
        </div>
    )
}
