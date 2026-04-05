import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface NotionDateProps {
    value: string | null; // ISO string
    onUpdate: (newValue: string | null) => void;
    disabled?: boolean;
}

export function NotionDate({ value, onUpdate, disabled }: NotionDateProps) {
    const date = value ? new Date(value) : undefined;

    return (
        <Popover>
            <PopoverTrigger asChild disabled={disabled}>
                <button
                    className={cn(
                        "flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted/50 transition-colors w-full text-left",
                        !date && "text-muted-foreground/30 italic"
                    )}
                >
                    <CalendarIcon className="h-3 w-3 opacity-50" />
                    {date ? format(date, "MMM d, yyyy") : "Empty"}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => onUpdate(d ? d.toISOString() : null)}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
