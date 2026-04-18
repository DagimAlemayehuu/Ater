import React from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from '@/components/obsidian/EditableCell'

interface BoardViewProps {
    rows: any[]
    schema: Record<string, any>
    groupBy?: string | null
    onUpdateRow: (fileName: string, prop: string, val: any) => void
    onSelectRow: (fileName: string) => void
    onNavigate: (pageName: string) => void
}

export function BoardView({
    rows,
    schema,
    groupBy = 'status',
    onUpdateRow,
    onSelectRow,
    onNavigate
}: BoardViewProps) {
    const effectiveGroupBy = groupBy || 'status';
    // Determine unique groups based on the groupBy property
    // We get unique values from the rows for that property
    const groupValues = Array.from(new Set(rows.map(r => r.properties[effectiveGroupBy] || 'Untitled')))
    if (groupValues.length === 0) groupValues.push('Other')

    return (
        <div className="flex gap-4 overflow-x-auto pb-6 h-full custom-scrollbar">
            {groupValues.map(group => {
                const groupRows = rows.filter(r => (r.properties[effectiveGroupBy] || 'Untitled') === group)
                
                return (
                    <div key={String(group)} className="flex-none w-72 flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                    "bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground"
                                )}>
                                    {String(group)}
                                </span>
                                <span className="text-[10px] font-bold opacity-30">{groupRows.length}</span>
                            </div>
                            <button className="opacity-20 hover:opacity-100 transition-opacity"><MoreHorizontal size={14} /></button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {groupRows.map(row => (
                                <div 
                                    key={row.id} 
                                    onClick={() => onSelectRow(row.id)}
                                    className="p-3 bg-white dark:bg-background border border-gray-200 dark:border-border/10 rounded-lg hover:border-gray-400 dark:hover:border-border transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                >
                                    <h4 className="text-xs font-bold mb-3 group-hover:text-primary transition-colors">{row.title}</h4>
                                    
                                    <div className="space-y-2">
                                        {Object.entries(row.properties).map(([key, val]) => {
                                            if (key === effectiveGroupBy || !val) return null;
                                            return (
                                                <div key={key} className="flex flex-col gap-0.5">
                                                    <span className="text-[8px] font-black uppercase opacity-30 tracking-tighter">{key}</span>
                                                    <div className="text-[10px] opacity-80" onClick={(e) => e.stopPropagation()}>
                                                        <EditableCell 
                                                            initialValue={val} 
                                                            type={schema[key] || 'str'} 
                                                            onSave={(nv) => onUpdateRow(row.id, key, nv)} 
                                                            onNavigate={onNavigate} 
                                                            row={row}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                            
                            <button className="flex items-center gap-2 p-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-opacity hover:bg-gray-50 dark:hover:bg-muted rounded-lg">
                                <Plus size={12} /> New Page
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
