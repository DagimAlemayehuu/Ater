import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface NotionSelectOption {
    id: string;
    name: string;
    color: string;
}

interface NotionSelectProps {
    value: NotionSelectOption | null;
    options: NotionSelectOption[];
    onUpdate: (newOption: NotionSelectOption) => void;
    disabled?: boolean;
}

// Strictly grayscale for all Notion options
const GRAYSCALE_CLASSES = "bg-secondary/50 text-secondary-foreground border-transparent hover:bg-secondary/80";

export function NotionSelect({ value, options, onUpdate, disabled }: NotionSelectProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={disabled} className="outline-none focus:outline-none ring-0 focus:ring-0">
                <div className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-muted/50 border",
                    !value && "border-dashed border-muted-foreground/30",
                    value && "bg-secondary/30 text-secondary-foreground"
                )}>
                    {value ? (
                        <span>{value.name}</span>
                    ) : (
                        <span className="text-muted-foreground/40 italic">Empty</span>
                    )}
                    {!disabled && <ChevronDown size={8} className="text-muted-foreground/50" />}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px] p-1 bg-background border shadow-xl">
                {options.map((option) => (
                    <DropdownMenuItem 
                        key={option.id}
                        onClick={() => onUpdate(option)}
                        className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-secondary transition-colors"
                    >
                        <span className="text-[10px] font-medium">
                            {option.name}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
