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

interface EditableCellProps {
    initialValue: any
    type: string | { type: string; source: string }
    onSave: (value: any) => void
    onNavigate?: (link: string) => void
    row?: any
    readonly?: boolean
}

// Deterministic color generator for badges - strictly monochrome high-fidelity aesthetic
const monochromeVariants = [
    "bg-gray-100 text-gray-900 border-gray-200",
    "bg-[#111827] text-white border-black",
    "bg-neutral-100 text-neutral-900 border-neutral-200",
    "bg-stone-200 text-stone-900 border-stone-300",
    "bg-zinc-100 text-zinc-900 border-zinc-200",
    "bg-white text-gray-700 border-gray-300 shadow-sm",
    "bg-gray-800 text-gray-100 border-gray-950",
];

const getBadgeColor = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % monochromeVariants.length;
    return monochromeVariants[index];
};

const renderInlineMarkdown = (text: string) => {
    if (!text) return text;
    // VERY simple inline parser for bold, italic, code
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="font-mono bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-[9px]">{part.slice(1, -1)}</code>;
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
        const iconClass = "text-gray-400 shrink-0";
        switch (typeStr) {
            case 'number':
            case 'int':
            case 'float': return <Hash size={iconSize} className={iconClass} />;
            case 'progress': return <div className="flex gap-0.5 items-end h-[10px] w-[10px]"><div className="w-[2px] h-[4px] bg-gray-400" /><div className="w-[2px] h-[7px] bg-gray-400" /><div className="w-[2px] h-[10px] bg-gray-400" /></div>;
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
            case 'id': return <span className="text-[8px] font-black text-gray-400 shrink-0">ID</span>;
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

    // ──────────────────────────────────────────────────────────────────────────
    // RENDERERS
    // ──────────────────────────────────────────────────────────────────────────

    // 1. Rollup Calculation
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
                let results: any[] = [];
                
                for (const link of links) {
                    const cleanLink = String(link).replace(/\[\[|\]\]/g, '');
                    try {
                        // Find the actual path of the related note
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
            <div className="flex items-center gap-2 w-full px-1.5 py-1 text-[10px] text-[#111827] font-black uppercase tracking-tighter">
                <Sigma size={10} className="text-gray-400" />
                <span className="truncate">{String(rollupVal)}</span>
            </div>
        );
    }

    // 2. Read-Only Metadata
    if (['id', 'created_time', 'last_edited_time', 'created_by', 'last_edited_by'].includes(typeStr)) {
        let displayVal = value;
        if (typeStr.includes('time') && value) {
            try { displayVal = format(new Date(value), "MMM d, yyyy HH:mm"); } catch (e) {}
        }
        return (
            <div className="flex items-center gap-2 w-full px-1.5 py-1 text-[10px] text-gray-500 font-medium italic opacity-60">
                <TypeIcon />
                <span className="truncate">{displayVal || "--"}</span>
            </div>
        )
    }

    // 2. Links (URL, Email, Phone)
    if (['url', 'email', 'phone'].includes(typeStr)) {
        if (!isFocused && value) {
            const href = typeStr === 'email' ? `mailto:${value}` : typeStr === 'phone' ? `tel:${value}` : value.startsWith('http') ? value : `https://${value}`;
            return (
                <div className="flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-200 transition-all">
                    <TypeIcon />
                    <a 
                        href={href} 
                        target={typeStr === 'url' ? "_blank" : undefined}
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate flex-1 font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {value}
                    </a>
                    <button onClick={() => setIsFocused(true)} className="opacity-0 group-hover:opacity-40 transition-opacity">
                        <ChevronDown size={10} />
                    </button>
                </div>
            )
        }
    }
    // 1. Status (Specialized Select)
    if (typeStr === 'status') {
        const categories = {
            'TO_DO': { label: 'To-do', color: '#E1E1E1', text: '#5F5F5F' },
            'IN_PROGRESS': { label: 'In Progress', color: '#D3E5EF', text: '#183347' },
            'DONE': { label: 'Done', color: '#DBEDDB', text: '#1C3829' }
        };
        // Map common strings to categories
        const currentVal = String(value || "").toUpperCase().replace(" ", "_");
        const category = (categories as any)[currentVal] || categories.TO_DO;

        return (
            <div className="flex items-center w-full group/status">
                <select 
                    className={cn(
                        "h-6 px-2 rounded-full text-[9px] font-black uppercase tracking-widest border-none focus:outline-none cursor-pointer hover:brightness-95 transition-all appearance-none",
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
    // 5. Checkbox (Boolean)
    if (typeStr === 'bool') {
        const checked = !!value;
        return (
            <div className="flex items-center gap-2 group w-full px-1 py-1 rounded border border-transparent hover:border-gray-200 transition-all cursor-pointer" onClick={() => {
                const nv = !checked;
                setValue(nv);
                onSave(nv);
            }}>
                <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    checked ? "bg-[#111827] border-black text-white" : "bg-white border-gray-200 group-hover:border-gray-400"
                )}>
                    {checked && <Check size={10} strokeWidth={4} />}
                </div>
                <span className={cn("text-[10px] uppercase font-black tracking-tighter opacity-0 group-hover:opacity-20 transition-opacity", checked ? "opacity-10" : "")}>
                    {checked ? "True" : "False"}
                </span>
            </div>
        )
    }

    // 6. Button (Action Trigger)
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
                // Mini-Action Logic: "SET(Prop, Val)"
                const updates: Record<string, any> = {};
                const commands = actionStr.split(';').map((s: string) => s.trim()).filter(Boolean);
                
                commands.forEach((cmd: string) => {
                    if (cmd.startsWith('SET(') && cmd.endsWith(')')) {
                        const inner = cmd.slice(4, -1);
                        const [prop, ...rest] = inner.split(',').map(s => s.trim());
                        let valStr = rest.join(',').trim();
                        
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
                    // Update locally and remotely for each prop
                    for (const [p, v] of Object.entries(updates)) {
                        onSave({ [p]: v, _bulk: true }); // Special flag for parent to handle multiple
                    }
                }
            } catch (err) {
                console.error("Action execution failed", err);
            } finally {
                setTimeout(() => setIsRunning(false), 500);
            }
        };

        return (
            <div className="flex items-center w-full px-1.5 py-0.5">
                <button 
                    onClick={handleRunAction}
                    disabled={isRunning}
                    className={cn(
                        "w-full h-7 px-3 flex items-center justify-center gap-2 rounded border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest text-[#111827] shadow-sm active:scale-[0.98] transition-all",
                        isRunning && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isRunning ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    {label}
                </button>
            </div>
        );
    }

    // 2. Date Picker
    if (typeStr === 'date') {
        const dateValue = value ? new Date(value) : null;
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "w-full flex items-center gap-2 bg-transparent border border-transparent hover:border-gray-200 rounded px-1.5 py-1 transition-all text-[10px]",
                        !value && "text-gray-400 italic"
                    )}>
                        <CalendarIcon size={10} className="text-gray-400" />
                        <span className={cn("truncate", value ? "text-[#111827]" : "")}>{value ? format(dateValue!, "PPP") : "Set date..."}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-xl" align="start">
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

    // 3. Status & Select
    if (['select', 'relation', 'status'].includes(typeStr) && source) {
        const cleanValue = String(value || "").replace(/^\[\[/, "").replace(/\]\]$/, "")
        
        const getStatusColor = (val: string) => {
            const low = val.toLowerCase();
            if (['todo', 'to-do', 'backlog', 'not started'].includes(low)) return "bg-gray-100 text-gray-500 border-gray-200";
            if (['in progress', 'doing', 'reviewing', 'active'].includes(low)) return "bg-blue-50 text-blue-600 border-blue-100";
            if (['done', 'complete', 'finished', 'archived', 'mastered'].includes(low)) return "bg-green-50 text-green-600 border-green-100";
            return getBadgeColor(val);
        };

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "w-full justify-between flex items-center bg-transparent border border-transparent hover:border-gray-200 rounded px-1.5 py-1 transition-all text-[10px] min-h-[1.5rem] group",
                        !value && "text-gray-400 italic"
                    )}>
                        <div className="flex items-center gap-2 truncate flex-1">
                            <TypeIcon />
                            {cleanValue ? (
                                <span className={cn(
                                    "px-2 py-0.5 rounded border text-[9px] font-bold tracking-tight truncate",
                                    typeStr === 'status' ? getStatusColor(cleanValue) : getBadgeColor(cleanValue)
                                )}>
                                    {cleanValue}
                                </span>
                            ) : (
                                "Select..."
                            )}
                        </div>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-gray-500" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-white border-gray-200 shadow-xl overflow-hidden" align="start">
                    <Command className="bg-transparent" shouldFilter={true}>
                        <CommandInput placeholder="Search or create..." className="h-9 text-xs" value={searchQuery} onValueChange={setSearchQuery} />
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {loadingOptions ? (
                                <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty className="p-0">
                                        <div className="py-4 px-2 text-[10px] text-gray-400 text-center tracking-wider font-bold uppercase">No Results</div>
                                        {searchQuery && (
                                            <button onClick={handleCreateOption} className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-gray-50 transition-colors text-[#111827] font-bold uppercase tracking-wider border-t border-gray-100">
                                                <Plus className="h-3 w-3" /> Create "{searchQuery}"
                                            </button>
                                        )}
                                    </CommandEmpty>
                                    
                                    {typeStr === 'status' && !source && (
                                        <>
                                            <CommandGroup heading="To-do">
                                                {['Not Started', 'Backlog', 'Todo'].map(opt => (
                                                    <CommandItem key={opt} onSelect={() => { setValue(opt); onSave(opt); setOpen(false); }} className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                                                        <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getStatusColor(opt))}>{opt}</div>
                                                        <Check className={cn("h-3 w-3 text-black", cleanValue === opt ? "opacity-100" : "opacity-0")} />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                            <CommandGroup heading="In Progress">
                                                {['In Progress', 'Doing', 'Reviewing'].map(opt => (
                                                    <CommandItem key={opt} onSelect={() => { setValue(opt); onSave(opt); setOpen(false); }} className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                                                        <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getStatusColor(opt))}>{opt}</div>
                                                        <Check className={cn("h-3 w-3 text-black", cleanValue === opt ? "opacity-100" : "opacity-0")} />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                            <CommandGroup heading="Complete">
                                                {['Done', 'Complete', 'Finished', 'Mastered'].map(opt => (
                                                    <CommandItem key={opt} onSelect={() => { setValue(opt); onSave(opt); setOpen(false); }} className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                                                        <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getStatusColor(opt))}>{opt}</div>
                                                        <Check className={cn("h-3 w-3 text-black", cleanValue === opt ? "opacity-100" : "opacity-0")} />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}

                                    {(source || typeStr !== 'status') && (
                                        <CommandGroup heading={typeStr === 'status' ? "Status" : typeStr === 'select' ? "Options" : "Links"}>
                                            {options.map((opt) => (
                                                <CommandItem
                                                    key={opt}
                                                    onSelect={() => {
                                                        const newValue = typeStr === 'status' ? opt : `[[${opt}]]`
                                                        setValue(newValue); onSave(newValue); setOpen(false); setSearchQuery("");
                                                    }}
                                                    className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "px-2 py-0.5 rounded border text-[9px] font-bold",
                                                            typeStr === 'status' ? getStatusColor(opt) : getBadgeColor(opt)
                                                        )}>{opt}</div>
                                                    </div>
                                                    <Check className={cn("h-3 w-3 text-black", cleanValue === opt ? "opacity-100" : "opacity-0")} />
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

    // 4. Multi-Select & List (Pill Tags)
    if (['list', 'multi-select'].includes(typeStr)) {
        const list = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(s=>s.trim()).filter(Boolean) : [])
        
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="flex flex-wrap gap-1 min-h-[1.5rem] items-center cursor-pointer w-full group py-0.5 px-1.5 hover:bg-gray-50/50 rounded border border-transparent hover:border-gray-200 transition-all">
                        <TypeIcon />
                        {list.length === 0 ? (
                            <span className="text-gray-400 text-[10px] italic">Empty</span>
                        ) : (
                            list.map((item, i) => {
                                const clean = String(item).replace(/^\[\[/, "").replace(/\]\]$/, "")
                                return (
                                    <span key={i} className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm", getBadgeColor(clean))}>
                                        {clean}
                                    </span>
                                );
                            })
                        )}
                        <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-gray-500" />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-white border-gray-200 shadow-xl overflow-hidden" align="start">
                    <Command className="bg-transparent" shouldFilter={true}>
                        <CommandInput placeholder="Search or create..." className="h-9 text-xs" value={searchQuery} onValueChange={setSearchQuery} />
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {loadingOptions ? (
                                <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty className="p-0">
                                        <div className="py-4 px-2 text-[10px] text-gray-400 text-center tracking-wider font-bold uppercase">No Results</div>
                                        {searchQuery && (
                                            <button onClick={async () => {
                                                if (!source) {
                                                    const next = [...list, searchQuery];
                                                    setValue(next); onSave(next); setSearchQuery("");
                                                } else {
                                                    await sidecarApi.createVaultOption(source, searchQuery);
                                                    const next = [...list, `[[${searchQuery}]]`];
                                                    setValue(next); onSave(next); setSearchQuery("");
                                                    fetchOptions();
                                                }
                                            }} className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-gray-50 transition-colors text-[#111827] font-bold uppercase tracking-wider border-t border-gray-100">
                                                <Plus className="h-3 w-3" /> Create "{searchQuery}"
                                            </button>
                                        )}
                                    </CommandEmpty>
                                    <CommandGroup heading="Active Tags">
                                        {list.map((item) => {
                                            const clean = String(item).replace(/^\[\[/, "").replace(/\]\]$/, "")
                                            return (
                                                <CommandItem
                                                    key={item}
                                                    onSelect={() => {
                                                        const next = list.filter(i => i !== item);
                                                        setValue(next); onSave(next);
                                                    }}
                                                    className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                                                >
                                                    <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getBadgeColor(clean))}>{clean}</div>
                                                    <Check className="h-3 w-3 text-black opacity-100" />
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                    <CommandGroup heading="Available Options">
                                        {(options || []).filter(opt => !list.some(i => String(i).includes(opt))).map((opt) => (
                                            <CommandItem
                                                key={opt}
                                                onSelect={() => {
                                                    const val = source ? `[[${opt}]]` : opt;
                                                    const next = [...list, val];
                                                    setValue(next); onSave(next);
                                                }}
                                                className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                                            >
                                                <div className={cn("px-2 py-0.5 rounded border text-[9px] font-bold", getBadgeColor(opt))}>{opt}</div>
                                                <Check className="h-3 w-3 text-black opacity-0" />
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

    // 5. Progress Bar
    if (typeStr === 'progress') {
        const numVal = parseFloat(value);
        const percent = isNaN(numVal) ? 0 : (numVal <= 1 && parseFloat(value) > 0 ? numVal * 100 : numVal);
        const constrained = Math.max(0, Math.min(100, percent));
        
        return (
            <div className={cn(
                "flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:bg-gray-50/50 transition-all cursor-pointer",
                isFocused && "border-gray-300 bg-gray-50"
            )}>
                <TypeIcon />
                <div className="flex-1 flex items-center gap-2">
                    <div 
                        className="flex-1 max-w-[80px] h-2 bg-gray-200 rounded-full overflow-hidden shrink-0 relative"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const newVal = Math.round((x / rect.width) * 100);
                            const final = numVal <= 1 && numVal > 0 ? newVal / 100 : newVal;
                            setValue(final);
                            onSave(final);
                        }}
                    >
                        <div className="h-full bg-[#111827] rounded-full transition-all duration-300" style={{ width: `${constrained}%` }} />
                    </div>
                    {isFocused ? (
                        <input 
                            className="w-10 bg-transparent border-none focus:ring-0 p-0 text-[10px] text-right font-mono text-[#111827]" 
                            autoFocus
                            value={value || ''}
                            onChange={e => setValue(e.target.value)}
                            onBlur={() => {
                                setIsFocused(false);
                                if (String(initialValue||'') !== String(value||'')) onSave(value);
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        />
                    ) : (
                        <span className="text-[9px] font-black text-[#111827] font-mono w-8 text-right bg-gray-100/50 px-1 rounded" onClick={() => setIsFocused(true)}>
                            {!isNaN(numVal) ? `${Math.round(constrained)}%` : '--'}
                        </span>
                     )}
                </div>
            </div>
        )
    }

    // 6. Formula Engine
    if (typeStr === 'formula') {
        let computed = "Error";
        try {
            const schemaMeta = typeof type === 'object' ? type : null;
            const expression = String(schemaMeta?.source || '');
            if (expression) {
                // simple prop("Name") replacement
                const replaced = expression.replace(/prop\("([^"]+)"\)/g, (_, propName) => {
                    const val = row?.properties?.[propName];
                    if (val === undefined || val === null) return '0';
                    return typeof val === 'number' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
                });

                // Inject helpers
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
            } else {
                computed = "No Expr";
            }
        } catch (e) {
            computed = "Syntax Error";
        }

        return (
            <div className="flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent bg-gray-50/20 backdrop-blur-sm">
                <div className="flex items-center justify-center p-0.5 rounded bg-gray-100 shrink-0">
                    <Sigma size={10} className="text-gray-500" />
                </div>
                <div className="flex-1 truncate text-[11px] font-black text-[#111827] tracking-tighter uppercase font-mono">
                    {String(computed)}
                </div>
            </div>
        );
    }

    // Default String / Number
    const wikiMatch = !isFocused && typeof value === 'string' && value.match(/\[\[(.*?)\]\]/);
    
    return (
        <div className={cn(
            "flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-200 transition-all",
            isFocused && "border-gray-300 bg-gray-50",
            !isFocused && typeof value === 'string' && value && "cursor-text"
        )} onClick={() => { if (!isFocused && !wikiMatch) setIsFocused(true) }}>
            <TypeIcon />
            {wikiMatch ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate?.(wikiMatch[1]); }}
                    className="text-[#111827] hover:underline font-bold text-[10px] truncate flex-1 text-left"
                >
                    {wikiMatch[1]}
                </button>
            ) : !isFocused && typeof value === 'string' ? (
                <div className="text-[10px] flex-1 truncate text-[#111827]">
                    {value ? renderInlineMarkdown(value) : <span className="text-gray-400 italic">Empty</span>}
                </div>
            ) : (
                <input 
                    type="text" 
                    value={value || ''}
                    autoFocus={isFocused}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => {
                        setIsFocused(false)
                        if (String(initialValue || '') !== String(value || '')) onSave(value)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-[10px] flex-1 truncate text-[#111827]"
                    placeholder="Empty"
                />
            )}
        </div>
    )
}
