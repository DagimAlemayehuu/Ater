import React from 'react'
import { FileText, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from '@/components/obsidian/EditableCell'

interface ListViewProps {
    rows: any[]
    columns: string[]
    schema: Record<string, any>
    onUpdate: (fileName: string, prop: string, val: any) => void
    onSelectRow: (fileName: string) => void
    onNavigate: (pageName: string) => void
    loading: boolean
}

export function ListView({
    rows,
    columns,
    schema,
    onUpdate,
    onSelectRow,
    onNavigate,
    loading
}: ListViewProps) {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 w-full bg-gray-100 animate-pulse rounded-md" />
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
        <div className="flex flex-col h-full bg-white rounded-md border border-gray-100 overflow-auto custom-scrollbar">
            <div className="flex flex-col divide-y divide-gray-50">
                {rows.map(row => (
                    <div 
                        key={row.id} 
                        onClick={() => onSelectRow(row.id)}
                        className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText size={14} className="text-gray-400 shrink-0 group-hover:text-black transition-colors" />
                            <span className="text-[13px] font-bold text-gray-900 truncate group-hover:underline">{row.title}</span>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 pr-2">
                            {columns.slice(1, 4).map(col => (
                                <div key={col} className="hidden md:flex flex-col gap-0.5 min-w-[80px]">
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">{col}</span>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <EditableCell 
                                            initialValue={row.properties[col]} 
                                            type={schema[col] || 'str'} 
                                            onSave={(val) => onUpdate(row.id, col, val)}
                                            onNavigate={onNavigate}
                                            row={row}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button className="p-1 hover:bg-gray-200 rounded text-gray-300 group-hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
