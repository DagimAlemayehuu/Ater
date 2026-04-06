import React, { useState, useEffect } from 'react'

interface EditableCellProps {
    initialValue: any
    type: string
    onSave: (value: any) => void
    onNavigate?: (link: string) => void
}

export function EditableCell({ initialValue, type, onSave, onNavigate }: EditableCellProps) {
    const [value, setValue] = useState<any>(initialValue)
    const [isFocused, setIsFocused] = useState(false)

    // Only sync from parent if we aren't currently editing
    useEffect(() => {
        if (!isFocused) {
            setValue(initialValue)
        }
    }, [initialValue, isFocused])

    if (type === 'bool') {
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

    if (type === 'list') {
        const displayValue = Array.isArray(value) ? value.join(', ') : value || ''
        
        // If not focused, show as clickable links if they match [[...]]
        if (!isFocused && onNavigate && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1 min-h-[1.5rem] items-center">
                    {value.length === 0 ? (
                        <span className="text-muted-foreground/30 text-[10px] italic">Empty</span>
                    ) : (
                        value.map((item, i) => {
                            const match = String(item).match(/^\[\[(.*?)\]\]$/);
                            if (match) {
                                const pageName = match[1];
                                return (
                                    <button 
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate(pageName);
                                        }}
                                        className="text-primary hover:underline font-bold text-[10px] transition-all"
                                    >
                                        {pageName}
                                    </button>
                                );
                            }
                            return <span key={i} className="text-[10px]">{item}</span>;
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
    const singleMatch = !isFocused && onNavigate && typeof value === 'string' && value.match(/^\[\[(.*?)\]\]$/);
    if (singleMatch) {
        const pageName = singleMatch[1];
        return (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(pageName);
                }}
                className="text-primary hover:underline font-bold text-[10px] transition-all"
            >
                {pageName}
            </button>
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
