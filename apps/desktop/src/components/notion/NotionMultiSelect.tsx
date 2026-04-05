import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";

interface NotionSelectOption {
    id: string;
    name: string;
    color: string;
}

interface NotionMultiSelectProps {
    value: NotionSelectOption[];
    options: NotionSelectOption[];
    onUpdate: (newOptions: NotionSelectOption[]) => void;
    disabled?: boolean;
}

export function NotionMultiSelect({ value = [], options, onUpdate, disabled }: NotionMultiSelectProps) {
    const handleToggle = (option: NotionSelectOption) => {
        const isSelected = value.some(v => v.id === option.id);
        if (isSelected) {
            onUpdate(value.filter(v => v.id !== option.id));
        } else {
            onUpdate([...value, option]);
        }
    };

    const handleRemove = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onUpdate(value.filter(v => v.id !== id));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={disabled} className="outline-none focus:outline-none ring-0 focus:ring-0 w-full text-left">
                <div className={cn(
                    "flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-muted/50 border min-h-[24px]",
                    value.length === 0 && "border-dashed border-muted-foreground/30"
                )}
                onClick={(e) => e.stopPropagation()}
                >
                    {value.length > 0 ? (
                        value.map(v => (
                            <span key={v.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/40 text-secondary-foreground">
                                {v.name}
                                {!disabled && (
                                    <X 
                                        size={8} 
                                        className="hover:text-foreground cursor-pointer opacity-50 hover:opacity-100" 
                                        onClick={(e) => handleRemove(e, v.id)}
                                    />
                                )}
                            </span>
                        ))
                    ) : (
                        <span className="text-muted-foreground/40 italic">Empty</span>
                    )}
                    {!disabled && <ChevronDown size={8} className="text-muted-foreground/50 ml-auto" />}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px] p-1 bg-background border shadow-xl">
                {options.map((option) => {
                    const isSelected = value.some(v => v.id === option.id);
                    return (
                        <DropdownMenuItem 
                            key={option.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(option);
                            }}
                            className={cn(
                                "flex items-center justify-between gap-2 cursor-pointer py-1 px-2 rounded-md",
                                isSelected && "bg-secondary/20"
                            )}
                        >
                            <span className="text-[10px] font-medium">
                                {option.name}
                            </span>
                            {isSelected && <span className="text-[8px] font-bold">✓</span>}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
