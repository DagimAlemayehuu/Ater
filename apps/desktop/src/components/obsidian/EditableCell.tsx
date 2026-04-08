import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
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
import { sidecarApi } from '@/lib/sidecarApi'

interface EditableCellProps {
    initialValue: any
    type: string | { type: string; source: string }
    onSave: (value: any) => void
    onNavigate?: (link: string) => void
}

export function EditableCell({ initialValue, type, onSave, onNavigate }: EditableCellProps) {
    const [value, setValue] = useState<any>(initialValue)
    const [isFocused, setIsFocused] = useState(false)
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<string[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const typeStr = typeof type === 'string' ? type : type.type;
    const source = typeof type === 'string' ? null : type.source;

    // Only sync from parent if we aren't currently editing
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
        } catch (e) {
            console.error("Failed to fetch options", e)
        } finally {
            setLoadingOptions(false)
        }
    }

    useEffect(() => {
        if (open && source) {
            fetchOptions()
        }
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
        } catch (e) {
            console.error("Failed to create option", e)
        } finally {
            setLoadingOptions(false)
        }
    }

    if (typeStr === 'bool') {
        return (
            <input 
                type="checkbox" 
                checked={!!value} 
                onChange={(e) => {
                    const checked = e.target.checked
                    setValue(checked)
                    onSave(checked)
                }} 
                className="accent-primary"
            />
        )
    }

    if ((typeStr === 'select' || typeStr === 'relation') && source) {
        // Strip brackets for display in select
        const cleanValue = String(value || "").replace(/^\[\[/, "").replace(/\]\]$/, "")
        
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "w-full justify-between flex items-center bg-transparent border border-transparent hover:border-border/40 rounded px-1 py-0.5 transition-colors text-[10px] text-left min-h-[1.5rem]",
                            !value && "text-muted-foreground/30 italic"
                        )}
                    >
                        <span className="truncate flex-1">
                            {cleanValue || "Select..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-20" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 bg-background border-border/40 shadow-xl" align="start">
                    <Command className="bg-transparent" shouldFilter={true}>
                        <CommandInput 
                            placeholder="Search or create..." 
                            className="h-8 text-[11px]" 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList className="max-h-[300px] custom-scrollbar">
                            {loadingOptions ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin opacity-20" />
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty className="p-0">
                                        <div className="py-2 px-2 text-[10px] opacity-40 text-center">No options found.</div>
                                        {searchQuery && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleCreateOption();
                                                }}
                                                className="w-full flex items-center gap-2 px-2 py-2 text-[11px] hover:bg-secondary/50 transition-colors text-primary font-bold border-t border-border/10"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Create "{searchQuery}"
                                            </button>
                                        )}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {options.map((opt) => (
                                            <CommandItem
                                                key={opt}
                                                value={opt}
                                                onSelect={() => {
                                                    const newValue = `[[${opt}]]`
                                                    setValue(newValue)
                                                    onSave(newValue)
                                                    setOpen(false)
                                                    setSearchQuery("")
                                                }}
                                                className="text-[11px] py-1.5 cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-3 w-3",
                                                        cleanValue === opt ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {opt}
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

    if (typeStr === 'list') {
        const displayValue = Array.isArray(value) ? value.join(', ') : value || ''
        
        // If not focused, show as clickable links if they match [[...]]
        if (!isFocused && onNavigate && Array.isArray(value)) {
            return (
                <div 
                    className="flex flex-wrap gap-1 min-h-[1.5rem] items-center cursor-text w-full"
                    onClick={() => setIsFocused(true)}
                >
                    {value.length === 0 ? (
                        <span className="text-muted-foreground/30 text-[10px] italic">Empty</span>
                    ) : (
                        value.map((item, i) => {
                            const match = String(item).match(/\[\[(.*?)\]\]/);
                            if (match) {
                                const pageName = match[1];
                                return (
                                    <button 
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate(pageName);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setIsFocused(true);
                                        }}
                                        className="text-primary hover:underline font-bold text-[10px] transition-all bg-primary/5 px-1.5 py-0.5 rounded"
                                    >
                                        {pageName}
                                    </button>
                                );
                            }
                            return <span key={i} className="text-[10px] bg-secondary/20 px-1.5 py-0.5 rounded opacity-70">{item}</span>;
                        })
                    )}
                </div>
            )
        }

        return (
            <input 
                type="text" 
                value={displayValue}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setValue(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
                onBlur={() => {
                    setIsFocused(false)
                    // If the formatted string representation hasn't changed, skip save
                    const original = Array.isArray(initialValue) ? initialValue.join(', ') : initialValue || ''
                    const current = Array.isArray(value) ? value.join(', ') : value || ''
                    if (original !== current) {
                        onSave(value)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.currentTarget.blur()
                    }
                }}
                className="w-full bg-transparent border border-transparent hover:border-border/40 focus:border-primary/50 rounded px-1 py-0.5 outline-none transition-colors text-[10px]"
                placeholder="[[Link]], ..."
            />
        )
    }

    // Default String/Int
    // Check if single value is a wikilink
    const singleMatch = !isFocused && onNavigate && typeof value === 'string' && value.match(/\[\[(.*?)\]\]/);
    if (singleMatch) {
        const pageName = singleMatch[1];
        return (
            <div 
                className="cursor-text w-full min-h-[1.5rem] flex items-center"
                onClick={() => setIsFocused(true)}
            >
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(pageName);
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        setIsFocused(true);
                    }}
                    className="text-primary hover:underline font-bold text-[10px] transition-all"
                >
                    {pageName}
                </button>
            </div>
        );
    }

    return (
        <input 
            type="text" 
            value={value || ''}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
                setIsFocused(false)
                if (String(initialValue || '') !== String(value || '')) {
                    onSave(value)
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur()
                }
            }}
            className="w-full bg-transparent border border-transparent hover:border-border/40 focus:border-primary/50 rounded px-1 py-0.5 outline-none transition-colors text-[10px]"
            placeholder="Empty"
        />
    )
}
