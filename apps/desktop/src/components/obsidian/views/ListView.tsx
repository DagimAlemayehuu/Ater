import React from 'react'
import { FileText, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from '@/components/obsidian/EditableCell'

interface ListViewProps {
    rows: any[]
    columns?: string[]
    schema: Record<string, any>
    onUpdateRow: (fileName: string, prop: string, val: any) => void
    onSelectRow: (fileName: string) => void
    onNavigate: (pageName: string) => void
    loading: boolean
}

export function ListView({
    rows,
    columns,
    schema,
    onUpdateRow,
    onSelectRow,
    onNavigate,
    loading
}: ListViewProps) {
    const effectiveColumns = React.useMemo(() => {
        if (columns && columns.length > 0) return columns.filter(c => c !== 'title');
        return Object.keys(schema || {}).filter(c => c !== 'title');
    }, [columns, schema]);

    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 w-full bg-gray-100 dark:bg-muted/20 animate-pulse rounded-md" />
                ))}
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <span className="text-[11px] font-bold uppercase tracking-wider">No items found</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-background rounded-md border border-gray-100 dark:border-border/10 overflow-auto custom-scrollbar">
            <div className="flex flex-col divide-y divide-gray-50 dark:divide-border/10">
                {rows.map(row => (
                    <div 
                        key={row.id} 
                        onClick={() => onSelectRow(row.id)}
                        className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors cursor-pointer relative"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText size={14} className="text-gray-400 dark:text-muted-foreground shrink-0 group-hover:text-black dark:group-hover:text-white transition-colors" />
                            <span className="text-[13px] font-bold text-gray-900 dark:text-foreground truncate group-hover:underline">{row.title}</span>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 pr-2">
                            {effectiveColumns.slice(0, 3).map(col => (
                                <div key={col} className="hidden md:flex flex-col gap-0.5 min-w-[80px]">
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400 dark:text-muted-foreground">{col}</span>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <EditableCell 
                                            initialValue={row.properties[col]} 
                                            type={schema[col] || 'str'} 
                                            onSave={(val) => onUpdateRow(row.id, col, val)}
                                            onNavigate={onNavigate}
                                            row={row}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-muted rounded text-gray-300 dark:text-muted-foreground group-hover:text-gray-600 dark:group-hover:text-foreground transition-all opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
