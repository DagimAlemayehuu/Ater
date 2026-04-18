import React from 'react'
import { Trash } from 'lucide-react'
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
        if (columns && columns.length > 0) return columns;
        return Object.keys(schema || {}).filter(c => !hiddenProperties.includes(c));
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

    return (
        <div className="rounded-xl border border-border overflow-hidden h-full flex flex-col bg-background">
            {selectedIds.size > 0 && (
                <div className="bg-primary text-primary-foreground px-6 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300 z-40">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.size} items selected</span>
                        <button 
                            onClick={() => {
                                if (confirm(`Delete ${selectedIds.size} items?`)) {
                                    selectedIds.forEach(id => onDeleteRow(id));
                                    setSelectedIds(new Set());
                                }
                            }}
                            className="px-3 py-1 bg-background/20 hover:bg-background/30 rounded text-[9px] font-bold uppercase tracking-widest"
                        >
                            Bulk Delete
                        </button>
                    </div>
                    <button onClick={() => setSelectedIds(new Set())} className="text-[9px] font-bold hover:underline">Clear</button>
                </div>
            )}
            <div className="overflow-auto h-full custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/20">
                        <tr>
                            <th className="w-10 px-3 py-2 border-r border-border/10">
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(new Set(rows.map(r => r.id)));
                                        else setSelectedIds(new Set());
                                    }}
                                    checked={selectedIds.size === rows.length && rows.length > 0}
                                    className="accent-primary"
                                />
                            </th>
                            <th className="px-3 py-2 font-black uppercase tracking-wider text-[9px] text-muted-foreground whitespace-nowrap border-r border-border/10 min-w-[150px]">
                                Title
                            </th>
                            {effectiveColumns.map(col => (
                                <th key={col} className="px-3 py-2 font-black uppercase tracking-wider text-[9px] text-muted-foreground whitespace-nowrap border-r border-border/10 last:border-r-0 min-w-[120px]">
                                    {col}
                                </th>
                            ))}
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {finalGroups.map(group => (
                            <React.Fragment key={group.name || 'root'}>
                                {group.name && (
                                    <tr className="bg-muted/30">
                                        <td colSpan={effectiveColumns.length + 3} className="px-3 py-1.5 border-b border-border/10 bg-muted/30">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-muted-foreground">{groupBy}:</span>
                                                <span className="text-[10px] font-bold text-primary">{group.name}</span>
                                                <span className="text-[9px] font-black opacity-20 ml-auto text-muted-foreground">{group.items.length} items</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {group.items.map(row => {
                                    return (
                                        <tr key={row.id} className="hover:bg-muted/50 group">
                                            <td className="px-3 py-2 border-r border-border/10 bg-background group-hover:bg-muted/50 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={() => {
                                                        const next = new Set(selectedIds);
                                                        if (next.has(row.id)) next.delete(row.id);
                                                        else next.add(row.id);
                                                        setSelectedIds(next);
                                                    }}
                                                    className="accent-primary"
                                                />
                                            </td>
                                            <td 
                                                className={cn(
                                                    "px-3 py-2 whitespace-nowrap font-bold max-w-[200px] border-r border-border/5 cursor-pointer text-foreground hover:underline truncate group-hover:bg-muted/50 transition-colors",
                                                    row.depth > 0 && "text-muted-foreground font-medium"
                                                )} 
                                                style={{ paddingLeft: `${row.depth * 20 + 12}px` }}
                                                title={row.title}
                                                onClick={() => onSelectRow(row.id)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {row.hasChildren ? (
                                                        <button 
                                                            onClick={(e) => toggleExpand(e, row.id)}
                                                            className="p-0.5 hover:bg-muted rounded transition-colors mr-1"
                                                        >
                                                            <div className={cn("transition-transform duration-200", expandedRows.has(row.id) ? "rotate-90" : "")}>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                            </div>
                                                        </button>
                                                    ) : row.depth > 0 ? (
                                                        <span className="mr-2 opacity-30 text-muted-foreground">↳</span>
                                                    ) : (
                                                        <div className="w-4 mr-1" />
                                                    )}
                                                    {row.title}
                                                </div>
                                            </td>
                                            {effectiveColumns.map(col => {
                                                const val = row.properties[col]
                                                return (
                                                    <td key={col} className={cn("px-3 py-1.5 whitespace-nowrap border-r border-border/5 last:border-r-0", readonly && "pointer-events-none")}>
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
                                            <td className="px-3 py-2 text-right">
                                                {!readonly && (
                                                    <button onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-destructive transition-opacity">
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
                                <td colSpan={effectiveColumns.length + 3} className="px-3 py-8 text-center text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                                    No rows found
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {!loading && rows.length > 0 && (
                        <tfoot className="sticky bottom-0 bg-muted/90 backdrop-blur-md border-t border-border/20 z-30">
                            <tr>
                                <td className="px-3 py-2 border-r border-border/10"></td>
                                <td className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground border-r border-border/10 bg-muted/90">
                                    Count {rows.length}
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
                                        label = 'Percent Checked';
                                    } else if (type === 'select' || type === 'multi-select') {
                                        const unique = new Set(values.flat()).size;
                                        result = unique;
                                        label = 'Unique';
                                    }

                                    return (
                                        <td key={col} className="px-3 py-2 border-r border-border/10 group/footer relative">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[7px] font-bold uppercase tracking-tighter text-muted-foreground/40 opacity-0 group-hover/footer:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground">{result !== null ? result : ''}</span>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="px-3 py-2 w-10"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
