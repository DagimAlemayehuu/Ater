import React, { useState, useEffect } from 'react'
import { 
    Check, 
    ChevronsUpDown, 
    Plus, 
    Loader2, 
    Calendar as CalendarIcon, 
    Hash, 
    Type, 
    CheckSquare, 
    List, 
    Link as LinkIcon, 
    ChevronDown,
    Clock,
    Sigma,
    Layers,
    Mail,
    Phone,
    Globe,
    ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { sidecarApi } from '@/lib/sidecarApi'
import { format } from "date-fns"
import { renderWikiLinks } from './WikiLink'

interface EditableCellProps {
    initialValue: any
    type: string | { type: string; source: string }
    onSave: (value: any) => void
    onNavigate?: (link: string) => void
    row?: any
    readonly?: boolean
}

// Deterministic color generator for badges - high-fidelity MONOCHROME aesthetic
const getBadgeColor = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 4;
    const variants = [
        "bg-muted/50 text-foreground border-border/40",
        "bg-foreground text-background border-foreground",
        "bg-muted/10 text-muted-foreground border-border/20",
        "bg-background text-foreground border-foreground/20 shadow-sm",
    ];
    return variants[index];
};

const renderInlineMarkdown = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic text-foreground">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="font-mono bg-muted text-foreground px-1 py-0.5 rounded text-[9px] border border-border/50">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

export function EditableCell({ initialValue, type, onSave, onNavigate, row, readonly }: EditableCellProps) {
    const [value, setValue] = useState<any>(initialValue)
    const [isFocused, setIsFocused] = useState(false)
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<string[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const safeType = type || 'str';
    const typeStr = typeof safeType === 'string' ? safeType : safeType.type;
    const source = typeof safeType === 'string' ? null : safeType.source;

    useEffect(() => {
        if (!isFocused && !open) {
            setValue(initialValue)
        }
    }, [initialValue, isFocused, open])

    const fetchOptions = async () => {
        if (!source) return
        setLoadingOptions(true)
        try {
            const res = await sidecarApi.getVaultOptions(source)
            setOptions(res.options || [])
        } catch (e) { console.error(e) } 
        finally { setLoadingOptions(false) }
    }

    useEffect(() => {
        if (open && source) fetchOptions()
    }, [open, source])

    const handleCreateOption = async () => {
        if (!source || !searchQuery) return
        try {
            setLoadingOptions(true)
            await sidecarApi.createVaultOption(source, searchQuery)
            const newValue = `[[${searchQuery}]]`
            setValue(newValue)
            onSave(newValue)
            setOpen(false)
            setSearchQuery("")
            fetchOptions()
        } catch (e) { console.error(e) } 
        finally { setLoadingOptions(false) }
    }

    const TypeIcon = () => {
        const iconSize = 10;
        const iconClass = "text-muted-foreground/40 shrink-0";
        switch (typeStr) {
            case 'number':
            case 'int':
            case 'float': return <Hash size={iconSize} className={iconClass} />;
            case 'progress': return <div className="flex gap-0.5 items-end h-[10px] w-[10px]"><div className="w-[2px] h-[4px] bg-muted-foreground/40" /><div className="w-[2px] h-[7px] bg-muted-foreground/40" /><div className="w-[2px] h-[10px] bg-muted-foreground/40" /></div>;
            case 'bool': return <CheckSquare size={iconSize} className={iconClass} />;
            case 'date': return <CalendarIcon size={iconSize} className={iconClass} />;
            case 'list': return <List size={iconSize} className={iconClass} />;
            case 'select':
            case 'relation': return <LinkIcon size={iconSize} className={iconClass} />;
            case 'multi-select': return <Layers size={iconSize} className={iconClass} />;
            case 'status': return <Clock size={iconSize} className={iconClass} />;
            case 'person': return <Loader2 size={iconSize} className={iconClass} />;
            case 'file': return <Plus size={iconSize} className={iconClass} />;
            case 'place': return <Globe size={iconSize} className={iconClass} />;
            case 'id': return <span className="text-[8px] font-black text-muted-foreground/40 shrink-0">ID</span>;
            case 'url': return <LinkIcon size={iconSize} className={iconClass} />;
            case 'email': return <Mail size={iconSize} className={iconClass} />;
            case 'phone': return <Phone size={iconSize} className={iconClass} />;
            case 'created_time':
            case 'last_edited_time': return <Clock size={iconSize} className={iconClass} />;
            case 'created_by':
            case 'last_edited_by': return <Type size={iconSize} className={iconClass} />;
            default: return <Type size={iconSize} className={iconClass} />;
        }
    }

    if (typeStr === 'rollup') {
        const [rollupVal, setRollupVal] = useState<any>("--");
        const config = typeof safeType === 'object' ? safeType : {} as any;
        const relationProp = config.relation;
        const targetProp = config.target;
        const calc = config.calc || 'sum';

        useEffect(() => {
            const compute = async () => {
                const relationVal = row?.properties?.[relationProp];
                if (!relationVal) return;
                const links = Array.isArray(relationVal) ? relationVal : [relationVal];
                const results: any[] = [];
                for (const link of links) {
                    const cleanLink = String(link).replace(/\[\[|\]\]/g, '');
                    try {
                        const search = await sidecarApi.findVaultPage(cleanLink);
                        if (search.found && search.path) {
                            const note = await sidecarApi.readObsidianNote(search.path);
                            if (note.metadata?.[targetProp] !== undefined) {
                                results.push(note.metadata[targetProp]);
                            }
                        }
                    } catch (e) {}
                }
                if (results.length === 0) {
                    setRollupVal("--");
                    return;
                }
                if (calc === 'sum') setRollupVal(results.reduce((a, b) => Number(a) + Number(b), 0));
                else if (calc === 'avg') setRollupVal(results.reduce((a, b) => Number(a) + Number(b), 0) / results.length);
                else if (calc === 'count') setRollupVal(results.length);
                else setRollupVal(results[0]);
            };
            compute();
        }, [row?.properties?.[relationProp], targetProp, calc]);

        return (
            <div className="flex items-center gap-2 w-full px-1.5 py-1 text-[10px] text-foreground font-black uppercase tracking-tighter">
                <Sigma size={10} className="text-muted-foreground/40" />
                <span className="truncate">{String(rollupVal)}</span>
            </div>
        );
    }

    if (['id', 'created_time', 'last_edited_time', 'created_by', 'last_edited_by'].includes(typeStr)) {
        let displayVal = value;
        if (typeStr.includes('time') && value) {
            try { displayVal = format(new Date(value), "MMM d, yyyy HH:mm"); } catch (e) {}
        }
        return (
            <div className="flex items-center gap-2 w-full px-1.5 py-1 text-[10px] text-muted-foreground/30 font-medium italic">
                <TypeIcon />
                <span className="truncate">{displayVal || "--"}</span>
            </div>
        )
    }

    if (['url', 'email', 'phone'].includes(typeStr)) {
        if (!isFocused && value) {
            const href = typeStr === 'email' ? `mailto:${value}` : typeStr === 'phone' ? `tel:${value}` : value.startsWith('http') ? value : `https://${value}`;
            return (
                <div className="flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:border-border/40 transition-all">
                    <TypeIcon />
                    <a 
                        href={href} 
                        target={typeStr === 'url' ? "_blank" : undefined}
                        rel="noreferrer"
                        className="text-foreground hover:underline truncate flex-1 font-bold tracking-tight"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {value}
                    </a>
                    <button onClick={() => setIsFocused(true)} className="opacity-0 group-hover:opacity-40 transition-opacity">
                        <ChevronDown size={10} className="text-muted-foreground" />
                    </button>
                </div>
            )
        }
    }

    if (typeStr === 'status' && !source) {
        const categories = {
            'TO_DO': { label: 'To-do', color: 'rgba(0,0,0,0.05)', text: 'rgba(0,0,0,0.3)' },
            'IN_PROGRESS': { label: 'In Progress', color: 'rgba(0,0,0,0.1)', text: 'rgba(0,0,0,0.8)' },
            'DONE': { label: 'Done', color: 'rgba(0,0,0,0.8)', text: 'white' }
        };
        const currentVal = String(value || "").toUpperCase().replace(" ", "_");
        const category = (categories as any)[currentVal] || categories.TO_DO;

        return (
            <div className="flex items-center w-full group/status">
                <select 
                    className={cn(
                        "h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-widest border-none focus:outline-none cursor-pointer hover:brightness-110 transition-all appearance-none",
                    )}
                    style={{ backgroundColor: category.color, color: category.text }}
                    value={currentVal}
                    onChange={(e) => {
                        const nv = e.target.value.replace("_", " ");
                        setValue(nv);
                        onSave(nv);
                    }}
                >
                    <option value="TO_DO">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                </select>
            </div>
        );
    }

    if (typeStr === 'bool') {
        const checked = !!value;
        return (
            <div className="flex items-center gap-2 group w-full px-1 py-1 rounded border border-transparent hover:border-border/20 transition-all cursor-pointer" onClick={() => {
                const nv = !checked;
                setValue(nv);
                onSave(nv);
            }}>
                <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    checked ? "bg-foreground border-foreground text-background" : "bg-background border-border group-hover:border-muted-foreground/40"
                )}>
                    {checked && <Check size={10} strokeWidth={4} />}
                </div>
                <span className={cn("text-[10px] uppercase font-black tracking-tighter opacity-0 group-hover:opacity-10 transition-opacity text-foreground", checked ? "opacity-5" : "")}>
                    {checked ? "True" : "False"}
                </span>
            </div>
        )
    }

    if (typeStr === 'button') {
        const config = typeof safeType === 'object' ? safeType : {} as any;
        const label = config.label || "Run";
        const actionStr = config.source || "";
        const [isRunning, setIsRunning] = useState(false);
        const handleRunAction = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!actionStr || isRunning) return;
            setIsRunning(true);
            try {
                const updates: Record<string, any> = {};
                const commands = actionStr.split(';').map((s: string) => s.trim()).filter(Boolean);
                commands.forEach((cmd: string) => {
                    if (cmd.startsWith('SET(') && cmd.endsWith(')')) {
                        const inner = cmd.slice(4, -1);
                        const [prop, ...rest] = inner.split(',').map(s => s.trim());
                        const valStr = rest.join(',').trim();
                        let val: any = valStr;
                        if (valStr === 'NOW') val = new Date().toISOString();
                        else if (valStr === 'TODAY') val = new Date().toISOString().split('T')[0];
                        else if (valStr.startsWith("'") && valStr.endsWith("'")) val = valStr.slice(1, -1);
                        else if (valStr === 'TRUE') val = true;
                        else if (valStr === 'FALSE') val = false;
                        else if (!isNaN(Number(valStr))) val = Number(valStr);
                        updates[prop] = val;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    for (const [p, v] of Object.entries(updates)) {
                        onSave({ [p]: v, _bulk: true });
                    }
                }
            } catch (err) { console.error("Action failed", err); } 
            finally { setTimeout(() => setIsRunning(false), 500); }
        };

        return (
            <div className="flex items-center w-full px-1.5 py-0.5">
                <button 
                    onClick={handleRunAction}
                    disabled={isRunning}
                    className={cn(
                        "w-full h-7 px-3 flex items-center justify-center gap-2 rounded border border-border/40 bg-background hover:bg-muted text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm active:scale-[0.98] transition-all",
                        isRunning && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isRunning ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    {label}
                </button>
            </div>
        );
    }

    if (typeStr === 'date') {
        const dateValue = value ? new Date(value) : null;
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "w-full flex items-center gap-2 bg-transparent border border-transparent hover:border-border/40 rounded px-1.5 py-1 transition-all text-[10px]",
                        !value && "text-muted-foreground/30 italic"
                    )}>
                        <CalendarIcon size={10} className="text-muted-foreground/40" />
                        <span className={cn("truncate font-bold tracking-tight", value ? "text-foreground" : "")}>{value ? format(dateValue!, "PPP") : "Set date..."}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border shadow-xl" align="start">
                    <Calendar
                        mode="single"
                        selected={dateValue || undefined}
                        onSelect={(date) => {
                            if (date) {
                                const iso = date.toISOString().split('T')[0];
                                setValue(iso);
                                onSave(iso);
                                setOpen(false);
                            }
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        )
    }

    if (['select', 'relation', 'status'].includes(typeStr) && source) {
        const cleanValue = String(value || "").replace(/^\[\[/, "").replace(/\]\]$/, "")
        const getStatusColor = (val: string) => {
            const low = val.toLowerCase();
            if (['todo', 'to-do', 'backlog', 'not started'].includes(low)) return "bg-muted/40 text-muted-foreground/60 border-border/20";
            if (['in progress', 'doing', 'reviewing', 'active'].includes(low)) return "bg-muted text-foreground border-border";
            if (['done', 'complete', 'finished', 'archived', 'mastered'].includes(low)) return "bg-foreground text-background border-foreground";
            return getBadgeColor(val);
        };

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "w-full justify-between flex items-center bg-transparent border border-transparent hover:border-border/20 rounded px-1.5 py-1 transition-all text-[10px] min-h-[1.5rem] group",
                        !value && "text-muted-foreground/20 italic"
                    )}>
                        <div className="flex items-center gap-2 truncate flex-1">
                            <TypeIcon />
                            {cleanValue ? (
                                <span className={cn(
                                    "px-2 py-0.5 rounded border text-[9px] font-black tracking-widest truncate",
                                    (onNavigate && typeStr !== 'status') && "cursor-pointer hover:opacity-80 transition-opacity",
                                    typeStr === 'status' ? getStatusColor(cleanValue) : getBadgeColor(cleanValue)
                                )}
                                onClick={(e) => {
                                    if (onNavigate && typeStr !== 'status') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onNavigate(cleanValue);
                                    }
                                }}>
                                    {cleanValue}
                                </span>
                            ) : ( "Select..." )}
                        </div>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-popover border-border shadow-xl overflow-hidden" align="start">
                    <Command className="bg-transparent" shouldFilter={true}>
                        <CommandInput placeholder="Search or create..." className="h-9 text-xs" value={searchQuery} onValueChange={setSearchQuery} />
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {loadingOptions ? (
                                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty className="p-0">
                                        <div className="py-4 px-2 text-[10px] text-muted-foreground text-center tracking-wider font-bold uppercase">No Results</div>
                                        {searchQuery && (
                                            <button onClick={handleCreateOption} className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-muted transition-colors text-foreground font-bold uppercase tracking-wider border-t border-border">
                                                <Plus className="h-3 w-3" /> Create "{searchQuery}"
                                            </button>
                                        )}
                                    </CommandEmpty>
                                    {(source || typeStr !== 'status') && (
                                        <CommandGroup heading={typeStr === 'status' ? "Status" : typeStr === 'select' ? "Options" : "Links"}>
                                            {options.map((opt) => (
                                                <CommandItem
                                                    key={opt}
                                                    onSelect={() => {
                                                        const newValue = typeStr === 'status' ? opt : `[[${opt}]]`
                                                        setValue(newValue); onSave(newValue); setOpen(false); setSearchQuery("");
                                                    }}
                                                    className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-muted"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", typeStr === 'status' ? getStatusColor(opt) : getBadgeColor(opt))}>{opt}</div>
                                                    </div>
                                                    <Check className={cn("h-3 w-3 text-foreground", cleanValue === opt ? "opacity-100" : "opacity-0")} />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        )
    }

    if (['list', 'multi-select'].includes(typeStr)) {
        const list = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(s=>s.trim()).filter(Boolean) : [])
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="flex flex-wrap gap-1 min-h-[1.5rem] items-center cursor-pointer w-full group py-0.5 px-1.5 hover:bg-muted/30 rounded border border-transparent hover:border-border/20 transition-all">
                        <TypeIcon />
                        {list.length === 0 ? (
                            <span className="text-muted-foreground/20 text-[10px] italic">Empty</span>
                        ) : (
                            list.map((item, i) => {
                                const clean = String(item).replace(/^\[\[/, "").replace(/\]\]$/, "")
                                return (
                                    <span key={i} className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm", onNavigate && "cursor-pointer hover:opacity-80 transition-opacity", getBadgeColor(clean))}
                                        onClick={(e) => {
                                            if (onNavigate) {
                                                e.preventDefault(); e.stopPropagation(); onNavigate(clean);
                                            }
                                        }}>
                                        {clean}
                                    </span>
                                );
                            })
                        )}
                        <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground" />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-popover border-border shadow-xl overflow-hidden" align="start">
                    <Command className="bg-transparent" shouldFilter={true}>
                        <CommandInput placeholder="Search or create..." className="h-9 text-xs" value={searchQuery} onValueChange={setSearchQuery} />
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {loadingOptions ? (
                                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty className="p-0">
                                        <div className="py-4 px-2 text-[10px] text-muted-foreground text-center tracking-wider font-bold uppercase">No Results</div>
                                        {searchQuery && (
                                            <button onClick={async () => {
                                                if (!source) {
                                                    const next = [...list, searchQuery]; setValue(next); onSave(next); setSearchQuery("");
                                                } else {
                                                    await sidecarApi.createVaultOption(source, searchQuery);
                                                    const next = [...list, `[[${searchQuery}]]`]; setValue(next); onSave(next); setSearchQuery(""); fetchOptions();
                                                }
                                            }} className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-muted transition-colors text-foreground font-bold uppercase tracking-wider border-t border-border">
                                                <Plus className="h-3 w-3" /> Create "{searchQuery}"
                                            </button>
                                        )}
                                    </CommandEmpty>
                                    <CommandGroup heading="Active Tags">
                                        {list.map((item) => {
                                            const clean = String(item).replace(/^\[\[/, "").replace(/\]\]$/, "")
                                            return (
                                                <CommandItem key={item} onSelect={() => { const next = list.filter(i => i !== item); setValue(next); onSave(next); }} className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-muted">
                                                    <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getBadgeColor(clean))}>{clean}</div>
                                                    <Check className="h-3 w-3 text-foreground opacity-100" />
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                    <CommandGroup heading="Available Options">
                                        {(options || []).filter(opt => !list.some(i => String(i).includes(opt))).map((opt) => (
                                            <CommandItem key={opt} onSelect={() => { const val = source ? `[[${opt}]]` : opt; const next = [...list, val]; setValue(next); onSave(next); }} className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-muted">
                                                <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getBadgeColor(opt))}>{opt}</div>
                                                <Check className="h-3 w-3 text-foreground opacity-0" />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        )
    }

    if (typeStr === 'progress') {
        const numVal = parseFloat(value);
        const percent = isNaN(numVal) ? 0 : (numVal <= 1 && parseFloat(value) > 0 ? numVal * 100 : numVal);
        const constrained = Math.max(0, Math.min(100, percent));
        return (
            <div className={cn("flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:bg-muted/30 transition-all cursor-pointer", isFocused && "border-border/40 bg-muted/20")}>
                <TypeIcon />
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden shrink-0 relative"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const newVal = Math.round((x / rect.width) * 100);
                            const final = numVal <= 1 && numVal > 0 ? newVal / 100 : newVal;
                            setValue(final); onSave(final);
                        }}>
                        <div className="h-full bg-foreground rounded-full transition-all duration-300" style={{ width: `${constrained}%` }} />
                    </div>
                    {isFocused ? (
                        <input className="w-10 bg-transparent border-none focus:ring-0 p-0 text-[10px] text-right font-mono text-foreground" autoFocus value={value || ''} onChange={e => setValue(e.target.value)} onBlur={() => { setIsFocused(false); if (String(initialValue||'') !== String(value||'')) onSave(value); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} />
                    ) : (
                        <span className="text-[9px] font-black text-foreground font-mono w-8 text-right bg-muted/20 px-1 rounded" onClick={() => setIsFocused(true)}>{!isNaN(numVal) ? `${Math.round(constrained)}%` : '--'}</span>
                     )}
                </div>
            </div>
        )
    }

    if (typeStr === 'formula') {
        let computed = "Error";
        try {
            const schemaMeta = typeof type === 'object' ? type : null;
            const expression = String(schemaMeta?.source || '');
            if (expression) {
                const replaced = expression.replace(/prop\("([^"]+)"\)/g, (_, propName) => {
                    const val = row?.properties?.[propName];
                    if (val === undefined || val === null) return '0';
                    return typeof val === 'number' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
                });
                const helpers = {
                    if: (cond: boolean, t: any, f: any) => cond ? t : f,
                    dateAdd: (d: string, n: number, unit: string) => {
                        const date = new Date(d);
                        if (unit === 'days') date.setDate(date.getDate() + n);
                        if (unit === 'months') date.setMonth(date.getMonth() + n);
                        return date.toISOString().split('T')[0];
                    },
                    dateDiff: (d1: string, d2: string, unit: string) => {
                        const diff = new Date(d1).getTime() - new Date(d2).getTime();
                        if (unit === 'days') return Math.floor(diff / (1000 * 60 * 60 * 24));
                        return diff;
                    },
                    concat: (...args: any[]) => args.join(''),
                    format: (v: any) => String(v)
                };
                const fn = new Function(...Object.keys(helpers), `return ${replaced}`);
                computed = fn(...Object.values(helpers));
            } else { computed = "No Expr"; }
        } catch (e) { computed = "Syntax Error"; }
        return (
            <div className="flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent bg-muted/10">
                <div className="flex items-center justify-center p-0.5 rounded bg-muted shrink-0">
                    <Sigma size={10} className="text-muted-foreground/40" />
                </div>
                <div className="flex-1 truncate text-[11px] font-black text-foreground tracking-tighter uppercase font-mono">{String(computed)}</div>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:border-border/20 transition-all", isFocused && "border-border/40 bg-muted/20", !isFocused && typeof value === 'string' && value && "cursor-text")} onClick={() => { if (!isFocused) setIsFocused(true) }}>
            <TypeIcon />
            {!isFocused && typeof value === 'string' ? (
                <div className="text-[10px] flex-1 truncate text-foreground font-bold tracking-tight">
                    {value ? (onNavigate ? renderWikiLinks(value, onNavigate) : renderInlineMarkdown(value)) : <span className="text-muted-foreground/20 italic">Empty</span>}
                </div>
            ) : (
                <input type="text" value={value || ''} autoFocus={isFocused} onFocus={() => setIsFocused(true)} onChange={(e) => setValue(e.target.value)} onBlur={() => { setIsFocused(false); if (String(initialValue || '') !== String(value || '')) onSave(value) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} className="bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-[10px] flex-1 truncate text-foreground font-bold tracking-tight" placeholder="Empty" />
            )}
        </div>
    )
}
