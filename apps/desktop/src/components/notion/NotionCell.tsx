import { NotionCheckbox } from "./NotionCheckbox";
import { NotionSelect } from "./NotionSelect";
import { NotionMultiSelect } from "./NotionMultiSelect";
import { NotionText } from "./NotionText";
import { NotionDate } from "./NotionDate";
import { NotionRelation } from "./NotionRelation";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail, Phone, Calendar, FileIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotionCellProps {
    type: string;
    value: any;
    schema: any;
    onUpdate: (newValue: any) => void;
    disabled?: boolean;
    onNavigate?: (pageId: string) => void;
}

export function NotionCell({ type, value, schema, onUpdate, disabled, onNavigate }: NotionCellProps) {
    if (!value) return <div className="px-2 text-muted-foreground/20 italic text-[10px]">null</div>;

    if (type === 'checkbox') {
        return <NotionCheckbox value={!!value.checkbox} onUpdate={(v) => onUpdate({ checkbox: v })} disabled={disabled} />;
    }

    if (type === 'select' || type === 'status') {
        const option = type === 'select' ? value.select : value.status;
        const options = (type === 'select' ? schema.select?.options : schema.status?.options) || [];
        return (
            <NotionSelect 
                value={option || null} 
                options={options} 
                onUpdate={(opt) => onUpdate({ [type]: opt })} 
                disabled={disabled} 
            />
        );
    }

    if (type === 'multi_select') {
        const selected = value.multi_select || [];
        const options = schema.multi_select?.options || [];
        return (
            <NotionMultiSelect 
                value={selected} 
                options={options} 
                onUpdate={(opts) => onUpdate({ multi_select: opts })} 
                disabled={disabled} 
            />
        );
    }

    if (type === 'title') {
        const text = value.title?.map((t: any) => t.plain_text).join("") || "";
        return (
            <div className="px-1.5 py-0.5 text-[11px] font-bold truncate tracking-tight">
                {text || "Untitled"}
            </div>
        );
    }

    if (type === 'rich_text') {
        const text = value.rich_text?.map((t: any) => t.plain_text).join("") || "";
        return (
            <NotionText 
                value={text} 
                onUpdate={(v) => onUpdate({ rich_text: [{ text: { content: v } }] })} 
                disabled={disabled} 
            />
        );
    }

    if (type === 'number') {
        return (
            <NotionText 
                value={String(value.number ?? "")} 
                onUpdate={(v) => onUpdate({ number: parseFloat(v) })} 
                disabled={disabled} 
                numeric 
            />
        );
    }

    if (type === 'date') {
        return (
            <NotionDate 
                value={value.date?.start || null} 
                onUpdate={(v) => onUpdate({ date: v ? { start: v } : null })} 
                disabled={disabled} 
            />
        );
    }

    if (type === 'url') {
        return (
            <div className="flex items-center gap-1 group px-1.5">
                <NotionText 
                    value={value.url || ""} 
                    onUpdate={(v) => onUpdate({ url: v })} 
                    disabled={disabled} 
                />
                {value.url && (
                    <a href={value.url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={10} className="text-muted-foreground hover:text-foreground" />
                    </a>
                )}
            </div>
        );
    }

    if (type === 'email') {
        return (
            <div className="flex items-center gap-1 group px-1.5">
                <NotionText 
                    value={value.email || ""} 
                    onUpdate={(v) => onUpdate({ email: v })} 
                    disabled={disabled} 
                />
                {value.email && (
                    <a href={`mailto:${value.email}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Mail size={10} className="text-muted-foreground hover:text-foreground" />
                    </a>
                )}
            </div>
        );
    }

    if (type === 'phone_number') {
        return (
            <div className="flex items-center gap-1 group px-1.5">
                <NotionText 
                    value={value.phone_number || ""} 
                    onUpdate={(v) => onUpdate({ phone_number: v })} 
                    disabled={disabled} 
                />
                {value.phone_number && (
                    <a href={`tel:${value.phone_number}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Phone size={10} className="text-muted-foreground hover:text-foreground" />
                    </a>
                )}
            </div>
        );
    }

    if (type === 'files') {
        const files = value.files || [];
        return (
            <div className="flex flex-wrap gap-1 px-1.5">
                {files.map((file: any, i: number) => {
                    const url = file.file?.url || file.external?.url;
                    return (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-secondary/30 px-1.5 py-0.5 rounded text-[9px] hover:bg-secondary/50 transition-colors">
                            <FileIcon size={8} />
                            <span className="max-w-[60px] truncate">{file.name}</span>
                        </a>
                    );
                })}
                {files.length === 0 && <span className="text-[9px] text-muted-foreground/30 italic">No files</span>}
            </div>
        );
    }

    if (type === 'people') {
        const people = value.people || [];
        return (
            <div className="flex flex-wrap gap-1 px-1.5">
                {people.map((person: any, i: number) => (
                    <div key={i} className="flex items-center gap-1 bg-secondary/30 px-1.5 py-0.5 rounded text-[9px]">
                        {person.avatar_url ? (
                            <img src={person.avatar_url} className="w-2.5 h-2.5 rounded-full" alt="" />
                        ) : (
                            <User size={8} />
                        )}
                        <span>{person.name || "User"}</span>
                    </div>
                ))}
                {people.length === 0 && <span className="text-[9px] text-muted-foreground/30 italic">Unassigned</span>}
            </div>
        );
    }

    if (type === 'created_time' || type === 'last_edited_time') {
        const date = value[type];
        if (!date) return null;
        return (
            <div className="px-1.5 py-0.5 text-[9px] text-muted-foreground flex items-center gap-1">
                <Calendar size={8} />
                {new Date(date).toLocaleDateString()}
            </div>
        );
    }

    if (type === 'created_by' || type === 'last_edited_by') {
        const person = value[type];
        if (!person) return null;
        return (
            <div className="px-1.5 py-0.5 text-[9px] text-muted-foreground flex items-center gap-1">
                <User size={8} />
                {person.name || "System"}
            </div>
        );
    }

    if (type === 'formula') {
        const formulaData = value.formula;
        if (!formulaData) return null;
        const formulaValue = formulaData[formulaData.type];
        return <div className="px-1.5 py-0.5 text-[10px] font-mono opacity-60">{String(formulaValue ?? "")}</div>;
    }

    if (type === 'rollup') {
        const rollupData = value.rollup;
        if (!rollupData) return null;
        const rollupValue = rollupData[rollupData.type];
        const display = Array.isArray(rollupValue) ? rollupValue.length : rollupValue;
        return <div className="px-1.5 py-0.5 text-[10px] font-mono opacity-60">{String(display ?? "")}</div>;
    }

    if (type === 'relation') {
        return <NotionRelation relationData={value.relation} onNavigate={onNavigate} onUpdate={(val) => onUpdate({ relation: val })} schema={schema} />;
    }

    return <div className="text-[9px] text-muted-foreground opacity-20 px-1.5 italic lowercase">{type}</div>;
}
