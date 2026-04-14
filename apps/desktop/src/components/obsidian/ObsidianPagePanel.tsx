import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Trash2, RefreshCw, Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidecarApi } from "@/lib/sidecarApi";
import { Input } from "@/components/ui/input";
import { EditableCell } from "./EditableCell";
import { MarkdownViewer } from "./MarkdownViewer";

interface ObsidianPagePanelProps {
    isOpen: boolean;
    onClose: () => void;
    databaseId?: string; // Optional for generic notes
    rowId?: string; // Filename, or used for title
    fullPath?: string; // Required for generic notes, or if not in 3-Database
    schema?: Record<string, string>;
    properties?: Record<string, any>;
    onUpdateProperty?: (propertyName: string, newValue: any) => void;
    onNavigate: (pageName: string) => void;
    onDelete?: () => void;
}

export function ObsidianPagePanel({ 
    isOpen, 
    onClose, 
    databaseId, 
    rowId, 
    fullPath,
    schema = {}, 
    properties = {}, 
    onUpdateProperty, 
    onNavigate,
    onDelete 
}: ObsidianPagePanelProps) {
    const [loadingContent, setLoadingContent] = useState(false);
    const [content, setContent] = useState<string>("");
    const [isDirty, setIsDirty] = useState(false);
    const [localTitle, setLocalTitle] = useState("");
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    
    // Internal state for generic note properties/schema
    const [localProps, setLocalProps] = useState<Record<string, any>>(properties);
    const [localSchema, setLocalSchema] = useState<Record<string, string>>(schema);

    // Resolve the path
    const relativePath = fullPath || (databaseId && rowId ? `3-Database/${databaseId}/${rowId}` : "");

    useEffect(() => {
        if (isOpen && relativePath) {
            // Extract filename from path for title
            const filename = relativePath.split('/').pop() || "";
            setLocalTitle(filename.replace(".md", ""));
            fetchContent();
            setMode('view');
        }
    }, [isOpen, relativePath]);

    const fetchContent = async () => {
        if (!relativePath) return;
        setLoadingContent(true);
        try {
            const res = await sidecarApi.readObsidianNote(relativePath);
            setContent(res.content || "");
            
            // If we're a generic note, we might want to show its metadata
            if (!databaseId) {
                const metadata = res.metadata || {};
                setLocalProps(metadata);
                const derivedSchema: Record<string, string> = {};
                Object.entries(metadata).forEach(([k, v]) => {
                    if (k === 'last_synced' || k === 'links') return;
                    derivedSchema[k] = Array.isArray(v) ? 'list' : 
                                     typeof v === 'boolean' ? 'bool' : 
                                     typeof v === 'number' ? (Number.isInteger(v) ? 'int' : 'float') : 'str';
                });
                setLocalSchema(derivedSchema);
            } else {
                setLocalProps(properties);
                setLocalSchema(schema);
            }
            setIsDirty(false);
        } catch (err) {
            console.error("Failed to fetch obsidian note content", err);
        } finally {
            setLoadingContent(false);
        }
    };

    const handleUpdateLocalProp = async (name: string, val: any) => {
        if (onUpdateProperty) {
            onUpdateProperty(name, val);
        } else {
            // Generic note update
            setLocalProps(prev => ({ ...prev, [name]: val }));
            try {
                // We'd need a generic update property API or just update frontmatter via full content update.
                // SidecarApi has updateObsidianNote which replaces full content (including frontmatter).
                // But usually we want to keep them synced.
            } catch (e) { console.error(e); }
        }
    };

    useEffect(() => {
        if (!isDirty || !isOpen || !relativePath) return;
        const timer = setTimeout(async () => {
            try {
                await sidecarApi.updateObsidianNote(relativePath, content);
                setIsDirty(false);
            } catch (err) {
                console.error("Failed to auto-save obsidian content", err);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [content, isDirty, isOpen, relativePath]);

    const handleTitleSave = async (newTitle: string) => {
        if (!newTitle || newTitle === localTitle) return;
        try {
            // Use the same rename logic as in the database view
            await sidecarApi.renameVaultFile(databaseId || 'generic', rowId || relativePath, newTitle);
            setLocalTitle(newTitle);
            // Parent will refresh rows
        } catch (e) {
            console.error("Rename failed", e);
        }
    };

    const displayProps = databaseId ? properties : localProps;
    const displaySchema = databaseId ? schema : localSchema;
    const sortedPropertyKeys = Object.keys(displaySchema).sort();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-2xl w-full h-full flex flex-col p-0 gap-0 border-l border-gray-200 bg-white shadow-xl">
                <SheetTitle className="sr-only">{localTitle}</SheetTitle>
                <SheetDescription className="sr-only">Viewing {relativePath}</SheetDescription>

                {/* Page Chrome: Cover & Icon */}
                <div className="relative group/chrome shrink-0">
                    <div className="h-32 w-full bg-gray-50 relative overflow-hidden">
                        {displayProps.cover ? (
                            <img src={displayProps.cover} className="w-full h-full object-cover opacity-80 group-hover/chrome:opacity-100 transition-opacity" alt="" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-b from-secondary/20 to-transparent" />
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/chrome:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {displayProps.icon && (
                        <div className="absolute -bottom-6 left-8 text-5xl bg-white p-2 rounded-2xl border border-gray-200/20 shadow-xl z-10 hover:scale-105 transition-transform cursor-default">
                            {displayProps.icon}
                        </div>
                    )}
                </div>

                <div className="px-8 pt-10 pb-4 flex justify-between items-start gap-4 shrink-0">
                    <div className="flex-1 min-w-0">
                        <Input 
                            value={localTitle} 
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={(e) => handleTitleSave(e.target.value)}
                            className="text-3xl font-black border-none focus-visible:ring-0 bg-transparent px-0 h-auto w-full tracking-tighter truncate leading-none mb-1 shadow-none"
                        />
                        <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest opacity-20 hover:opacity-100 transition-opacity">
                            <RefreshCw size={10} className={loadingContent ? "animate-spin" : ""} />
                            {relativePath}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        {onDelete && (
                            <button onClick={() => {
                                if (confirm("Delete this note?")) {
                                    onDelete();
                                    onClose();
                                }
                            }} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors text-muted-foreground/30">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                    {/* Properties Area */}
                    {sortedPropertyKeys.length > 0 && (
                        <div className="grid grid-cols-1 gap-y-2 pb-6 border-b border-gray-200">
                            {sortedPropertyKeys.map((name) => (
                                <div key={name} className="flex items-center gap-4 group">
                                    <span className="w-24 text-[9px] font-black text-muted-foreground/30 uppercase tracking-tighter shrink-0 truncate hover:text-muted-foreground/60 transition-colors" title={name}>{name}</span>
                                    <div className="flex-1 min-w-0">
                                            <EditableCell
                                                initialValue={displayProps[name]}
                                                type={displaySchema[name]}
                                                onSave={(newValue) => handleUpdateLocalProp(name, newValue)}
                                                onNavigate={onNavigate}
                                                row={{ properties: displayProps }}
                                            />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Markdown Area: Combined View/Edit */}
                    <div className="min-h-[500px]">
                        {loadingContent ? (
                            <div className="h-64 flex items-center justify-center opacity-10"><RefreshCw size={24} className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-8">
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <textarea
                                        value={content}
                                        onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
                                        className="w-full min-h-[300px] p-0 text-[13px] bg-transparent border-none rounded focus:outline-none font-mono leading-relaxed resize-none custom-scrollbar placeholder:opacity-10"
                                        placeholder="Note content..."
                                    />
                                </div>
                                <div className="pt-8 border-t border-gray-200/5">
                                    <div className="mb-4 text-[10px] font-black uppercase tracking-widest opacity-20">Preview</div>
                                    <MarkdownViewer 
                                        content={content} 
                                        onNavigate={onNavigate} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

