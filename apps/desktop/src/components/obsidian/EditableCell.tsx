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
    Sigma
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

export function EditableCell({ initialValue, type, onSave, onNavigate, row }: EditableCellProps) {
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
            default: return <Type size={iconSize} className={iconClass} />;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RENDERERS
    // ──────────────────────────────────────────────────────────────────────────

    // 1. Checkbox
    if (typeStr === 'bool') {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <input 
                    type="checkbox" 
                    checked={!!value} 
                    onChange={(e) => {
                        const checked = e.target.checked
                        setValue(checked)
                        onSave(checked)
                    }} 
                    className="accent-black w-3 h-3 rounded cursor-pointer"
                />
            </div>
        )
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

    // 3. Select / Relation (Badges)
    if ((typeStr === 'select' || typeStr === 'relation') && source) {
        const cleanValue = String(value || "").replace(/^\[\[/, "").replace(/\]\]$/, "")
        
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
                                    "px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-tight truncate",
                                    getBadgeColor(cleanValue)
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
                                    <CommandGroup heading={typeStr === 'select' ? "Options" : "Links"}>
                                        {options.map((opt) => (
                                            <CommandItem
                                                key={opt}
                                                onSelect={() => {
                                                    const newValue = `[[${opt}]]`
                                                    setValue(newValue); onSave(newValue); setOpen(false); setSearchQuery("");
                                                }}
                                                className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {opt}
                                                </div>
                                                <Check className={cn("h-3 w-3 text-black", cleanValue === opt ? "opacity-100" : "opacity-0")} />
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

    // 4. List (Pill Tags)
    if (typeStr === 'list') {
        const displayValue = Array.isArray(value) ? value.join(', ') : value || ''
        
        if (!isFocused && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1 min-h-[1.5rem] items-center cursor-text w-full group py-0.5" onClick={() => setIsFocused(true)}>
                    <TypeIcon />
                    {value.length === 0 ? (
                        <span className="text-gray-400 text-[10px] italic">No items</span>
                    ) : (
                        value.map((item, i) => {
                            const clean = String(item).replace(/^\[\[/, "").replace(/\]\]$/, "");
                            return (
                                <button 
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); if (onNavigate) onNavigate(clean); }}
                                    className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded border transition-all hover:bg-gray-200",
                                        getBadgeColor(clean)
                                    )}
                                >
                                    {clean}
                                </button>
                            );
                        })
                    )}
                </div>
            )
        }

        return (
            <div className="flex items-center gap-2 w-full">
                <TypeIcon />
                <input 
                    type="text" 
                    value={displayValue}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => setValue(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
                    onBlur={() => {
                        setIsFocused(false)
                        const original = Array.isArray(initialValue) ? initialValue.join(', ') : initialValue || ''
                        const current = Array.isArray(value) ? value.join(', ') : value || ''
                        if (original !== current) onSave(value)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 rounded-none px-0 py-0.5 text-[10px] text-[#111827]"
                    placeholder="Comma separated..."
                />
            </div>
        )
    }

    // 5. Progress Bar
    if (typeStr === 'progress') {
        const numVal = parseFloat(value);
        const percent = isNaN(numVal) ? 0 : (numVal <= 1 && parseFloat(value) > 0 ? numVal * 100 : numVal);
        const constrained = Math.max(0, Math.min(100, percent));
        
        return (
            <div className={cn(
                "flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-200 transition-all",
                isFocused && "border-gray-300 bg-gray-50"
            )} onClick={() => { if (!isFocused) setIsFocused(true) }}>
                <TypeIcon />
                <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 max-w-[60px] h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
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
                        <span className="text-[9px] font-bold text-gray-500 font-mono w-6 text-right">
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
                computed = new Function(`return ${replaced}`)();
            } else {
                computed = "No Expr";
            }
        } catch (e) {
            computed = "Syntax Error";
        }

        return (
            <div className="flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent">
                <div className="flex items-center justify-center p-0.5 rounded bg-gray-100 shrink-0">
                    <Sigma size={10} className="text-gray-500" />
                </div>
                <div className="flex-1 truncate text-[11px] font-bold text-[#111827] font-mono">
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
