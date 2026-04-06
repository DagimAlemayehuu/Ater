import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Trash2, RefreshCw, Eye, Edit3 } from "lucide-react";
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
                setLocalProps(res.metadata || {});
                const derivedSchema: Record<string, string> = {};
                Object.entries(res.metadata || {}).forEach(([k, v]) => {
                    derivedSchema[k] = Array.isArray(v) ? 'list' : typeof v === 'boolean' ? 'bool' : 'str';
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

    const handleTitleBlur = () => {
        // Renaming logic not implemented yet
    };

    const displayProps = databaseId ? properties : localProps;
    const displaySchema = databaseId ? schema : localSchema;
    const sortedPropertyKeys = Object.keys(displaySchema).sort();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-2xl w-full h-full flex flex-col p-0 gap-0 border-l border-border/40 bg-background shadow-2xl">
                
                <div className="px-6 py-4 border-b flex justify-between items-center bg-secondary/5">
                    <div className="flex-1 mr-4 overflow-hidden">
                        <Input 
                            value={localTitle} 
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            readOnly
                            className="text-lg font-black border-transparent hover:border-border/40 focus-visible:ring-0 bg-transparent px-0 h-auto w-full mb-0 tracking-tight truncate"
                        />
                        <SheetTitle className="sr-only">{localTitle}</SheetTitle>
                        <SheetDescription className="text-[10px] opacity-40 truncate">{relativePath}</SheetDescription>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                            className="p-1.5 hover:bg-secondary rounded transition-colors text-muted-foreground/50 hover:text-foreground"
                            title={mode === 'view' ? 'Edit Markdown' : 'View Markdown'}
                        >
                            {mode === 'view' ? <Edit3 size={14} /> : <Eye size={14} />}
                        </button>
                        {onDelete && (
                            <button onClick={() => {
                                if (confirm("Delete this note?")) {
                                    onDelete();
                                    onClose();
                                }
                            }} className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors text-muted-foreground/50">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                    {/* Properties Area */}
                    {sortedPropertyKeys.length > 0 && (
                        <div className="grid grid-cols-1 gap-y-2 pb-6 border-b border-border/10">
                            {sortedPropertyKeys.map((name) => (
                                <div key={name} className="flex items-center gap-4 group">
                                    <span className="w-24 text-[9px] font-black text-muted-foreground/30 uppercase tracking-tighter shrink-0 truncate hover:text-muted-foreground/60 transition-colors" title={name}>{name}</span>
                                    <div className="flex-1 min-w-0">
                                        <EditableCell
                                            initialValue={displayProps[name]}
                                            type={displaySchema[name]}
                                            onSave={(newValue) => handleUpdateLocalProp(name, newValue)}
                                            onNavigate={onNavigate}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Markdown Area */}
                    <div className="min-h-[500px]">
                        {loadingContent ? (
                            <div className="h-64 flex items-center justify-center opacity-10"><RefreshCw size={24} className="animate-spin" /></div>
                        ) : mode === 'edit' ? (
                            <textarea
                                value={content}
                                onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
                                className="w-full min-h-[600px] p-0 text-[13px] bg-transparent border-none rounded focus:outline-none font-mono leading-relaxed resize-none custom-scrollbar placeholder:opacity-10"
                                placeholder="Start writing..."
                            />
                        ) : (
                            <MarkdownViewer 
                                content={content} 
                                onNavigate={onNavigate} 
                            />
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

