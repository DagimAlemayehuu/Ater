import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { NotionCell } from "./NotionCell";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Filter, 
    ArrowUpDown, 
    Plus, 
    X, 
    SortAsc, 
    SortDesc,
    Search,
    Maximize2,
    RefreshCcw
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
    Command, 
    CommandEmpty, 
    CommandGroup, 
    CommandInput, 
    CommandItem, 
    CommandList 
} from "@/components/ui/command";

interface NotionTableProps {
    metadata: any;
    rows: any[];
    onUpdate: (pageId: string, propertyName: string, newValue: any) => void;
    onRowClick?: (row: any) => void;
    onNavigate?: (pageId: string) => void;
    onAddRow?: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    maxColumns?: number;
}

type SortConfig = {
    property: string;
    direction: 'asc' | 'desc';
} | null;

type FilterConfig = {
    property: string;
    value: string;
    type: string;
};

export function NotionTable({ metadata, rows, onUpdate, onRowClick, onNavigate, onAddRow, onRefresh, isLoading, maxColumns }: NotionTableProps) {
    const [sort, setSort] = useState<SortConfig>(null);
    const [filters, setFilters] = useState<FilterConfig[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const allProperties = useMemo(() => {
        if (!metadata?.properties) return [];
        return Object.entries(metadata.properties).map(([name, schema]: any) => ({
            name,
            type: schema.type,
            schema
        }));
    }, [metadata]);

    const visibleProperties = useMemo(() => {
        let props = [...allProperties].sort((a, b) => {
            if (a.type === 'title') return -1;
            if (b.type === 'title') return 1;
            const priority = ['status', 'select', 'multi_select', 'date', 'checkbox'];
            if (priority.includes(a.type) && !priority.includes(b.type)) return -1;
            if (!priority.includes(a.type) && priority.includes(b.type)) return 1;
            return 0;
        });

        if (maxColumns && maxColumns > 0) {
            props = props.slice(0, maxColumns);
        }
        return props;
    }, [allProperties, maxColumns]);

    const getPropertyStringValue = (prop: any): string => {
        if (!prop) return "";
        const type = prop.type;
        const val = prop[type];
        if (!val) return "";
        switch (type) {
            case 'title':
            case 'rich_text':
                return val.map?.((t: any) => t.plain_text).join("") || "";
            case 'select':
            case 'status':
                return val.name || "";
            case 'multi_select':
                return val.map?.((v: any) => v.name).join(", ") || "";
            case 'checkbox':
                return val.toString();
            case 'date':
                return val.start || "";
            case 'number':
                return val.toString();
            case 'relation':
                return val.length > 0 ? "related" : "";
            default:
                return String(val || "");
        }
    };

    const processedRows = useMemo(() => {
        let result = [...rows];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(row => Object.values(row.properties).some((prop: any) => getPropertyStringValue(prop).toLowerCase().includes(q)));
        }
        filters.forEach(f => {
            if (!f.value) return;
            result = result.filter(row => getPropertyStringValue(row.properties[f.property]).toLowerCase().includes(f.value.toLowerCase()));
        });
        if (sort) {
            result.sort((a, b) => {
                const valA = getPropertyStringValue(a.properties[sort.property]);
                const valB = getPropertyStringValue(b.properties[sort.property]);
                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [rows, sort, filters, searchQuery]);

    if (isLoading && rows.length === 0) {
        return (
            <div className="space-y-1 w-full">
                <Skeleton className="h-4 w-full opacity-20" />
                <Skeleton className="h-10 w-full opacity-10" />
                <Skeleton className="h-10 w-full opacity-5" />
            </div>
        );
    }

    if (!metadata) return null;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <div className="relative group">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-2.5 text-muted-foreground/30 group-focus-within:text-foreground/50 transition-colors" />
                    <Input 
                        placeholder="Search" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-6 h-6 text-[9px] w-32 bg-secondary/10 border-none focus-visible:ring-0 tracking-tighter placeholder:opacity-20"
                    />
                </div>

                {onRefresh && (
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRefresh(); }} className={cn("h-6 w-6 text-muted-foreground/40", isLoading && "animate-spin")} disabled={isLoading}>
                        <RefreshCcw size={10} />
                    </Button>
                )}

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px] px-1.5 font-bold opacity-40 hover:opacity-100 uppercase tracking-tighter">
                            <Filter size={10} className="mr-1 opacity-50" />
                            {filters.length > 0 ? filters.length : "Flt"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-0" align="start">
                        <Command className="bg-background border shadow-2xl">
                            <CommandInput placeholder="Prop" className="h-7 text-[9px]" />
                            <CommandList>
                                <CommandEmpty className="text-[9px] py-2">None</CommandEmpty>
                                <CommandGroup>
                                    {allProperties.map(prop => (
                                        <CommandItem key={prop.name} onSelect={() => { if (!filters.some(f => f.property === prop.name)) setFilters([...filters, { property: prop.name, type: prop.type, value: "" }]); }} className="text-[9px] py-1 cursor-pointer">
                                            {prop.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px] px-1.5 font-bold opacity-40 hover:opacity-100 uppercase tracking-tighter">
                            <ArrowUpDown size={10} className="mr-1 opacity-50" />
                            Sort
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-0" align="start">
                        <Command className="bg-background border shadow-2xl">
                            <CommandInput placeholder="Prop" className="h-7 text-[9px]" />
                            <CommandList>
                                <CommandEmpty className="text-[9px] py-2">None</CommandEmpty>
                                <CommandGroup>
                                    {allProperties.map(prop => (
                                        <CommandItem key={prop.name} onSelect={() => setSort({ property: prop.name, direction: sort?.property === prop.name && sort.direction === 'asc' ? 'desc' : 'asc' })} className="text-[9px] py-1 flex justify-between cursor-pointer">
                                            <span>{prop.name}</span>
                                            {sort?.property === prop.name && (sort.direction === 'asc' ? <SortAsc size={8} /> : <SortDesc size={10} />)}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {filters.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center pb-1">
                    {filters.map(f => (
                        <div key={f.property} className="flex items-center gap-1 bg-secondary/20 border border-border/20 rounded px-1 py-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                            <span className="text-[8px] font-black uppercase opacity-20 tracking-tighter">{f.property}</span>
                            <Input value={f.value} onChange={(e) => setFilters(filters.map(filt => f.property === filt.property ? { ...filt, value: e.target.value } : filt))} className="h-3 w-16 text-[8px] bg-transparent border-none focus-visible:ring-0 px-0 placeholder:opacity-10 font-medium" placeholder="..." autoFocus />
                            <button onClick={() => setFilters(filters.filter(filt => filt.property !== f.property))} className="hover:bg-secondary rounded p-0.5 opacity-30 hover:opacity-100"><X size={8} /></button>
                        </div>
                    ))}
                    <button className="text-[8px] font-bold opacity-20 hover:opacity-100 uppercase px-1" onClick={() => setFilters([])}>Clear</button>
                </div>
            )}

            <div className="rounded border border-border/30 bg-card/5 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="w-full border-collapse">
                        <TableHeader className="bg-secondary/10 border-b border-border/30">
                            <TableRow className="hover:bg-transparent h-auto">
                                {visibleProperties.map((prop: any) => (
                                    <TableHead key={prop.name} className={cn("text-[8px] font-black uppercase tracking-widest py-1.5 h-auto whitespace-nowrap cursor-pointer hover:bg-secondary/20 transition-colors text-muted-foreground/40", sort?.property === prop.name && "text-foreground opacity-100")} onClick={() => setSort({ property: prop.name, direction: sort?.property === prop.name && sort.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1 px-1">
                                            {prop.name}
                                            {sort?.property === prop.name && (sort.direction === 'asc' ? <SortAsc size={8} /> : <SortDesc size={8} />)}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedRows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-secondary/5 transition-colors cursor-pointer group border-b border-border/20 last:border-0 h-auto" onClick={() => onRowClick && onRowClick(row)}>
                                    {visibleProperties.map((prop: any, idx: number) => (
                                        <TableCell key={prop.name} className="p-0 border-r last:border-r-0 border-border/10 max-w-[200px] align-top relative h-full" onClick={(e) => { if (prop.schema.type !== 'title') e.stopPropagation(); }}>
                                            {idx === 0 && (
                                                <div className="absolute left-[-18px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => { e.stopPropagation(); onRowClick && onRowClick(row); }}>
                                                    <Button variant="outline" size="icon" className="h-4 w-4 bg-background shadow-xs border-border/40"><Maximize2 size={8} className="text-muted-foreground/50" /></Button>
                                                </div>
                                            )}
                                            <NotionCell type={prop.schema.type} schema={prop.schema} value={row.properties[prop.name]} onUpdate={(newVal) => onUpdate(row.id, prop.name, newVal)} onNavigate={onNavigate} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            {processedRows.length === 0 && (
                                <TableRow><TableCell colSpan={visibleProperties.length} className="text-center py-6 text-muted-foreground/20 italic text-[9px] tracking-tight">Empty</TableCell></TableRow>
                            )}
                            {onAddRow && (
                                <TableRow onClick={(e) => { e.stopPropagation(); onAddRow(); }} className="hover:bg-secondary/10 transition-colors cursor-pointer group border-t border-border/10">
                                    <TableCell colSpan={visibleProperties.length} className="py-1 px-2 text-muted-foreground/30 font-black text-[8px] uppercase tracking-[0.2em] group-hover:text-foreground/50 transition-colors">
                                        <div className="flex items-center gap-1.5"><Plus size={10} strokeWidth={4} /> New</div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
