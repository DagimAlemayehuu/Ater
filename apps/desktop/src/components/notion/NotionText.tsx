import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NotionTextProps {
    value: string;
    onUpdate: (newValue: string) => void;
    disabled?: boolean;
    className?: string;
    numeric?: boolean;
}

export function NotionText({ value, onUpdate, disabled, className, numeric }: NotionTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onUpdate(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === 'Escape') {
            setLocalValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing && !disabled) {
        return (
            <Input
                type={numeric ? "number" : "text"}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="h-7 text-xs px-2 py-0 min-w-[100px]"
            />
        );
    }

    return (
        <div 
            onClick={(e) => {
                if (!disabled) {
                    e.stopPropagation();
                    setIsEditing(true);
                }
            }}
            className={cn(
                "px-2 py-1 text-xs min-h-[24px] cursor-text rounded transition-colors hover:bg-muted/50 whitespace-normal break-words leading-relaxed",
                !value && "text-muted-foreground/30 italic",
                className
            )}
        >
            {value || "Empty"}
        </div>
    );
}
