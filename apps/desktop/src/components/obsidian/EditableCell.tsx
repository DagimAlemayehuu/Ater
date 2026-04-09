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
    Clock
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
}

// Deterministic color generator for badges
const getBadgeColor = (text: string) => {
    const colors = [
        "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        "bg-purple-500/10 text-purple-400 border-purple-500/20",
        "bg-orange-500/10 text-orange-400 border-orange-500/20",
        "bg-rose-500/10 text-rose-400 border-rose-500/20",
        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export function EditableCell({ initialValue, type, onSave, onNavigate }: EditableCellProps) {
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
        const iconClass = "opacity-20 shrink-0";
        switch (typeStr) {
            case 'number':
            case 'int':
            case 'float': return <Hash size={iconSize} className={iconClass} />;
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
                    className="accent-primary size-3 rounded cursor-pointer"
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
                        "w-full flex items-center gap-2 bg-transparent border border-transparent hover:border-border/40 rounded px-1.5 py-1 transition-all text-[10px]",
                        !value && "text-muted-foreground/30 italic"
                    )}>
                        <CalendarIcon size={10} className="opacity-20" />
                        <span className="truncate">{value ? format(dateValue!, "PPP") : "Set date..."}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border/40" align="start">
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
                        "w-full justify-between flex items-center bg-transparent border border-transparent hover:border-border/40 rounded px-1.5 py-1 transition-all text-[10px] min-h-[1.5rem] group",
                        !value && "text-muted-foreground/30 italic"
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
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-20 transition-opacity" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-background border-border/40 shadow-2xl overflow-hidden" align="start">
                    <Command className="bg-transparent" shouldFilter={true}>
                        <CommandInput placeholder="Search or create..." className="h-9 text-xs" value={searchQuery} onValueChange={setSearchQuery} />
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {loadingOptions ? (
                                <div className="py-10 flex flex-col items-center gap-2 opacity-20">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty className="p-0">
                                        <div className="py-4 px-2 text-[10px] opacity-40 text-center tracking-widest font-black uppercase">No Results</div>
                                        {searchQuery && (
                                            <button onClick={handleCreateOption} className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-primary/10 transition-colors text-primary font-black uppercase tracking-widest border-t border-border/10">
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
                                                className="text-xs py-2 px-3 cursor-pointer flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("size-2 rounded-full", getBadgeColor(opt).split(' ')[0])} />
                                                    {opt}
                                                </div>
                                                <Check className={cn("h-3 w-3 text-primary", cleanValue === opt ? "opacity-100" : "opacity-0")} />
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
                        <span className="text-muted-foreground/20 text-[10px] italic">No items</span>
                    ) : (
                        value.map((item, i) => {
                            const clean = String(item).replace(/^\[\[/, "").replace(/\]\]$/, "");
                            return (
                                <button 
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); if (onNavigate) onNavigate(clean); }}
                                    className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded border transition-all hover:scale-105",
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
                    className="flex-1 bg-transparent border-none focus:ring-0 rounded-none px-0 py-0.5 outline-none text-[10px]"
                    placeholder="Comma separated..."
                />
            </div>
        )
    }

    // Default String / Number
    const wikiMatch = !isFocused && typeof value === 'string' && value.match(/\[\[(.*?)\]\]/);
    
    return (
        <div className={cn(
            "flex items-center gap-2 group w-full px-1.5 py-1 rounded border border-transparent hover:border-border/40 transition-all",
            isFocused && "border-primary/40 bg-secondary/5"
        )}>
            <TypeIcon />
            {wikiMatch ? (
                <button 
                    onClick={() => onNavigate?.(wikiMatch[1])}
                    className="text-primary hover:underline font-bold text-[10px] truncate flex-1 text-left"
                >
                    {wikiMatch[1]}
                </button>
            ) : (
                <input 
                    type="text" 
                    value={value || ''}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => {
                        setIsFocused(false)
                        if (String(initialValue || '') !== String(value || '')) onSave(value)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="bg-transparent border-none focus:ring-0 p-0 outline-none text-[10px] flex-1 truncate"
                    placeholder="Empty"
                />
            )}
        </div>
    )
}
