import React from 'react'
import { cn } from '../../../lib/utils'
import { ChevronRight, MoreVertical, Edit3 } from 'lucide-react'

interface MobileTableViewProps {
    rows: any[]
    schema: Record<string, any>
    hiddenProperties?: string[]
    onSelect: (row: any) => void
    onUpdate: (rowId: string, updates: any) => void
}

export function MobileTableView({ rows, schema, hiddenProperties = [], onSelect, onUpdate }: MobileTableViewProps) {
    const columns = Object.keys(schema).filter(c => 
        c.toLowerCase() !== 'title' && !hiddenProperties.includes(c)
    )

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'in progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            default: return 'bg-white/5 text-muted-foreground border-white/10'
        }
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full opacity-40 p-10 text-center">
                <div className="size-16 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center mb-4">
                    <MoreVertical className="text-white/20" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">No Records Found</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {rows.map((row, idx) => (
                <div 
                    key={row.id || idx}
                    onClick={() => onSelect(row)}
                    className="flex flex-col p-4 border-b border-white/5 active:bg-white/5 transition-colors group"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-foreground truncate group-active:text-primary transition-colors">
                                {row.title || row.id?.replace('.md', '').replace(/_/g, ' ')}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {columns.map(col => {
                                    const val = row[col]
                                    if (!val) return null
                                    
                                    if (col.toLowerCase() === 'status') {
                                        return (
                                            <span key={col} className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", getStatusColor(String(val)))}>
                                                {String(val)}
                                            </span>
                                        )
                                    }

                                    return (
                                        <div key={col} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                            <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60">{col}</span>
                                            <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[100px]">{String(val)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/30 mt-1 shrink-0" />
                    </div>
                </div>
            ))}
            
            {/* Bottom spacer for safe area */}
            <div className="h-20" />
        </div>
    )
}
