import React from 'react'
import { Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from '@/components/obsidian/EditableCell'

interface TableViewProps {
    rows: any[]
    columns: string[]
    schema: Record<string, any>
    onUpdate: (fileName: string, prop: string, val: any) => void
    onDeleteRow: (fileName: string) => void
    onSelectRow: (fileName: string) => void
    onNavigate: (pageName: string) => void
    loading: boolean
}

export function TableView({
    rows,
    columns,
    schema,
    onUpdate,
    onDeleteRow,
    onSelectRow,
    onNavigate,
    loading
}: TableViewProps) {
    return (
        <div className="rounded-md border border-border/40 overflow-hidden h-full">
            <div className="overflow-auto h-full custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-secondary/20 sticky top-0 z-10 backdrop-blur-md border-b border-border/40">
                        <tr>
                            <th className="px-3 py-2 font-black uppercase tracking-wider text-[9px] text-muted-foreground whitespace-nowrap border-r border-border/10 min-w-[150px]">
                                Title
                            </th>
                            {columns.slice(1).map(col => (
                                <th key={col} className="px-3 py-2 font-black uppercase tracking-wider text-[9px] text-muted-foreground whitespace-nowrap border-r border-border/10 last:border-r-0 min-w-[120px]">
                                    {col}
                                </th>
                            ))}
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {rows.map(row => (
                            <tr key={row.id} className="hover:bg-secondary/10 group">
                                <td 
                                    className="px-3 py-2 whitespace-nowrap font-bold max-w-[200px] truncate cursor-pointer text-primary hover:underline" 
                                    title={row.title}
                                    onClick={() => onSelectRow(row.id)}
                                >
                                    {row.title}
                                </td>
                                {columns.slice(1).map(col => {
                                    const val = row.properties[col]
                                    return (
                                        <td key={col} className="px-3 py-1.5 whitespace-nowrap border-r border-border/5 last:border-r-0">
                                            <EditableCell 
                                                initialValue={val} 
                                                type={schema[col] || 'str'} 
                                                onSave={(newValue) => onUpdate(row.id, col, newValue)} 
                                                onNavigate={onNavigate}
                                            />
                                        </td>
                                    )
                                })}
                                <td className="px-3 py-2 text-right">
                                    <button onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-destructive transition-opacity">
                                        <Trash size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && !loading && (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-3 py-8 text-center text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                                    No rows found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
