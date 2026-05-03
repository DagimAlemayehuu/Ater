import React from 'react'
import { Trash, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from '@/components/obsidian/EditableCell'

interface TableViewProps {
    rows: any[]
    columns?: string[]
    schema: Record<string, any>
    onUpdateRow: (fileName: string, prop: string, val: any) => void
    onDeleteRow: (fileName: string) => void
    onSelectRow: (fileName: string) => void
    onNavigate: (pageName: string) => void
    loading: boolean
    groupBy?: string | null
    readonly?: boolean
    hiddenProperties?: string[]
}

export function TableView({
    rows,
    columns,
    schema,
    onUpdateRow,
    onDeleteRow,
    onSelectRow,
    onNavigate,
    loading,
    groupBy,
    readonly,
    hiddenProperties = []
}: TableViewProps) {
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    // Compute effective columns if not provided
    const effectiveColumns = React.useMemo(() => {
        if (columns && columns.length > 0) return columns.filter(c => c !== 'title');
        return Object.keys(schema || {}).filter(c => !hiddenProperties.includes(c) && c !== 'title');
    }, [columns, schema, hiddenProperties]);

    const toggleExpand = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = new Set(expandedRows);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedRows(next);
    }

    const visibleRows = React.useMemo(() => {
        const result: any[] = [];
        const childrenMap: Record<string, any[]> = {};
        const roots: any[] = [];

        rows.forEach(r => {
            const parent = r.properties['Parent'];
            if (parent) {
                const parentName = String(parent).replace(/\[\[|\]\]/g, '');
                if (!childrenMap[parentName]) childrenMap[parentName] = [];
                childrenMap[parentName].push(r);
            } else {
                roots.push(r);
            }
        });

        const addRow = (row: any, depth: number) => {
            result.push({ ...row, depth, hasChildren: (childrenMap[row.title] || []).length > 0 });
            if (expandedRows.has(row.id)) {
                (childrenMap[row.title] || []).forEach(child => addRow(child, depth + 1));
            }
        };

        roots.forEach(r => addRow(r, 0));
        return result;
    }, [rows, expandedRows]);

    const finalGroups = React.useMemo(() => {
        if (!groupBy) return [{ name: null, items: visibleRows }];
        const map: Record<string, any[]> = {};
        rows.forEach(r => {
            const val = r.properties[groupBy] || 'Untitled';
            const key = Array.isArray(val) ? val.join(', ') : String(val);
            if (!map[key]) map[key] = [];
            map[key].push({ ...r, depth: 0, hasChildren: false });
        });
        return Object.entries(map).map(([name, items]) => ({ name, items }));
    }, [visibleRows, rows, groupBy]);

    const handleDeleteRows = () => {
        selectedIds.forEach(id => onDeleteRow(id));
        setSelectedIds(new Set());
    }

    return (
        <div className="rounded-xl border border-border/40 overflow-hidden h-full flex flex-col bg-background">
            {selectedIds.size > 0 && (
                <div className="bg-foreground text-background px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-300 z-40 border-b border-border/10">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedIds.size} Items Command</span>
                        <button 
                            onClick={handleDeleteRows}
                            className="px-4 py-1 bg-background text-foreground hover:bg-background/90 rounded text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Bulk Purge
                        </button>
                    </div>
                    <button onClick={() => setSelectedIds(new Set())} className="text-[9px] font-black uppercase tracking-widest hover:opacity-50 transition-opacity">Abort</button>
                </div>
            )}
            <div className="overflow-auto h-full custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/[0.03] backdrop-blur-md sticky top-0 z-10 border-b border-border/20">
                        <tr>
                            <th className="w-10 px-4 py-3 border-r border-border/5">
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(rows.map(r => r.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                    checked={selectedIds.size === rows.length && rows.length > 0}
                                    className="accent-foreground w-3 h-3 rounded-none bg-transparent border border-border"
                                />
                            </th>
                            <th className="px-5 py-3 font-black uppercase tracking-[0.2em] text-[9px] text-foreground/40 whitespace-nowrap border-r border-border/5 min-w-[180px]">
                                Label
                            </th>
                            {effectiveColumns.map(col => (
                                <th key={col} className="px-5 py-3 font-black uppercase tracking-[0.2em] text-[9px] text-foreground/40 whitespace-nowrap border-r border-border/5 last:border-r-0 min-w-[140px]">
                                    {col}
                                </th>
                            ))}
                            <th className="px-3 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/5">
                        {finalGroups.map(group => (
                            <React.Fragment key={group.name || 'root'}>
                                {group.name && (
                                    <tr className="bg-muted/10">
                                        <td colSpan={effectiveColumns.length + 3} className="px-5 py-2 border-b border-border/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20 text-foreground">{groupBy}:</span>
                                                <span className="text-[10px] font-black uppercase text-foreground/80 tracking-tighter">{group.name}</span>
                                                <span className="text-[9px] font-black opacity-10 ml-auto uppercase tracking-widest tabular-nums">{group.items.length} units</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {group.items.map(row => {
                                    return (
                                        <tr key={row.id} className="hover:bg-muted/[0.02] group/row transition-colors">
                                            <td className="px-4 py-2.5 border-r border-border/5 bg-background group-hover/row:bg-muted/[0.02] transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={() => {
                                                        const next = new Set(selectedIds);
                                                        if (next.has(row.id)) next.delete(row.id);
                                                        else next.add(row.id);
                                                        setSelectedIds(next);
                                                    }}
                                                    className="accent-foreground w-3 h-3 rounded-none bg-transparent border border-border"
                                                />
                                            </td>
                                            <td 
                                                className={cn(
                                                    "px-5 py-2.5 whitespace-nowrap font-black tracking-tight max-w-[240px] border-r border-border/5 cursor-pointer text-foreground/70 hover:text-foreground truncate transition-colors",
                                                    row.depth > 0 && "text-foreground/40 font-bold"
                                                )} 
                                                style={{ paddingLeft: `${row.depth * 24 + 20}px` }}
                                                title={row.title}
                                                onClick={() => onSelectRow(row.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {row.hasChildren ? (
                                                        <button 
                                                            onClick={(e) => toggleExpand(e, row.id)}
                                                            className="p-1 hover:bg-muted/50 rounded transition-colors mr-1"
                                                        >
                                                            <ChevronRight size={12} className={cn("transition-transform duration-300 text-foreground/20", expandedRows.has(row.id) ? "rotate-90 text-foreground/60" : "")} />
                                                        </button>
                                                    ) : row.depth > 0 ? (
                                                        <span className="mr-3 opacity-10 text-foreground">↳</span>
                                                    ) : (
                                                        <div className="w-4 mr-2" />
                                                    )}
                                                    <span className="uppercase text-[11px]">{row.title}</span>
                                                </div>
                                            </td>
                                            {effectiveColumns.map(col => {
                                                const val = row.properties[col]
                                                return (
                                                    <td key={col} className={cn("px-4 py-2 border-r border-border/5 last:border-r-0", readonly && "pointer-events-none")}>
                                                        <EditableCell 
                                                            initialValue={val} 
                                                            type={schema[col] || 'str'} 
                                                            onSave={(newValue) => onUpdateRow(row.id, col, newValue)} 
                                                            onNavigate={onNavigate}
                                                            row={row}
                                                            readonly={readonly}
                                                        />
                                                    </td>
                                                )
                                            })}
                                            <td className="px-4 py-2 text-right">
                                                {!readonly && (
                                                    <button onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover/row:opacity-20 hover:!opacity-100 text-foreground transition-opacity">
                                                        <Trash size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        {rows.length === 0 && !loading && (
                            <tr>
                                <td colSpan={effectiveColumns.length + 3} className="px-5 py-20 text-center text-foreground/10 text-[10px] font-black uppercase tracking-[0.5em]">
                                    Module Empty
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {!loading && rows.length > 0 && (
                        <tfoot className="sticky bottom-0 bg-muted/[0.03] backdrop-blur-md border-t border-border/20 z-30">
                            <tr>
                                <td className="px-4 py-3 border-r border-border/5"></td>
                                <td className="px-5 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 border-r border-border/5 bg-muted/[0.01]">
                                    Registry Count {rows.length}
                                </td>
                                {effectiveColumns.map(col => {
                                    const type = schema[col] || 'str';
                                    const values = rows.map(r => r.properties[col]).filter(v => v !== undefined && v !== null && v !== '');
                                    
                                    let result: string | number | null = null;
                                    let label = 'Calculate';
                                    
                                    if (type === 'number' || type === 'progress') {
                                        const nums = values.map(v => Number(v)).filter(v => !isNaN(v));
                                        if (nums.length > 0) {
                                            const sum = nums.reduce((a, b) => a + b, 0);
                                            result = parseFloat(sum.toFixed(2)).toLocaleString();
                                            label = 'Sum';
                                        }
                                    } else if (type === 'bool') {
                                        const checkedCount = values.filter(v => v === true).length;
                                        result = `${Math.round((checkedCount / rows.length) * 100)}%`;
                                        label = 'Saturation';
                                    } else if (type === 'select' || type === 'multi-select') {
                                        const unique = new Set(values.flat()).size;
                                        result = unique;
                                        label = 'Density';
                                    }

                                    return (
                                        <td key={col} className="px-5 py-3 border-r border-border/5 group/footer relative">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[7px] font-black uppercase tracking-widest text-foreground/10 opacity-0 group-hover/footer:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
                                                <span className="text-[10px] font-black tracking-tight text-foreground/40 tabular-nums">{result !== null ? result : ''}</span>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="px-3 py-3 w-10"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
