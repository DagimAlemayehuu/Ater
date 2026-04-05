import { Checkbox } from "@/components/ui/checkbox";

interface NotionCheckboxProps {
    value: boolean;
    onUpdate: (newValue: boolean) => void;
    disabled?: boolean;
}

export function NotionCheckbox({ value, onUpdate, disabled }: NotionCheckboxProps) {
    return (
        <div className="flex items-center justify-center">
            <Checkbox 
                checked={value} 
                onCheckedChange={(checked) => onUpdate(!!checked)}
                disabled={disabled}
                className="h-4 w-4 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
        </div>
    );
}
