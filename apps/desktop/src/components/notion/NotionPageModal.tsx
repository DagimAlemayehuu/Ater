import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NotionCell } from "./NotionCell";
import { Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { sidecarApi } from "@/lib/sidecarApi";
import { Input } from "@/components/ui/input";

interface NotionPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    page: any;
    metadata: any;
    onUpdate: (pageId: string, propertyName: string, newValue: any) => void;
    onDelete?: (pageId: string) => void;
}

export function NotionPageModal({ isOpen, onClose, page, metadata, onUpdate, onDelete }: NotionPageModalProps) {
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [rawMarkdown, setRawMarkdown] = useState<string>("");
    const [isDirty, setIsDirty] = useState(false);
    const [localTitle, setLocalTitle] = useState("");
    const lastPageId = useRef<string | null>(null);

    const titleKey = metadata ? Object.keys(metadata.properties).find(k => metadata.properties[k].type === 'title') || 'Name' : 'Name';

    useEffect(() => {
        if (isOpen && page?.id) {
            // Only reset local title and fetch blocks if it's a NEW page, 
            // OR if it just transitioned from optimistic to real (ID change)
            if (page.id !== lastPageId.current) {
                const titleArr = page.properties[titleKey]?.title;
                const currentTitle = titleArr?.map((t: any) => t.plain_text).join('') || '';
                setLocalTitle(currentTitle);
                
                if (!page.isOptimistic) {
                    fetchBlocks();
                } else {
                    setRawMarkdown("");
                }
                lastPageId.current = page.id;
            }
        }
    }, [isOpen, page?.id, titleKey, page?.isOptimistic]);

    useEffect(() => {
        if (!isDirty || !page?.id || page.isOptimistic) return;
        const timer = setTimeout(async () => {
            try {
                await sidecarApi.updateNotionPageContent(page.id, rawMarkdown);
                setIsDirty(false);
            } catch (err) {
                console.error("Failed auto-save", err);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [rawMarkdown, isDirty, page?.id, page?.isOptimistic]);

    const fetchBlocks = async () => {
        if (!page?.id || page.isOptimistic) return;
        setLoadingBlocks(true);
        try {
            const res = await sidecarApi.getNotionPageContent(page.id);
            const text = (res.blocks || []).map((b: any) => {
                const type = b.type;
                const content = b[type];
                return content?.rich_text?.map((t: any) => t.plain_text).join('') || '';
            }).join('\n\n');
            setRawMarkdown(text);
            setIsDirty(false);
        } catch (err) {
            console.error("Failed blocks", err);
        } finally {
            setLoadingBlocks(false);
        }
    };

    if (!page || !metadata) return null;

    const handleTitleBlur = () => {
        const titleArr = page.properties[titleKey]?.title;
        const originalTitle = titleArr?.map((t: any) => t.plain_text).join('') || '';
        if (localTitle !== originalTitle) {
            onUpdate(page.id, titleKey, { title: [{ text: { content: localTitle } }] });
        }
    };

    const properties = Object.entries(metadata.properties)
        .filter(([name, schema]: any) => schema.type !== 'title')
        .sort((a: any, b: any) => {
            const priority = ['status', 'select', 'multi_select', 'date', 'checkbox'];
            if (priority.includes(a[1].type) && !priority.includes(b[1].type)) return -1;
            if (!priority.includes(a[1].type) && priority.includes(b[1].type)) return 1;
            return 0;
        });

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-xl w-full h-full flex flex-col p-0 gap-0 border-l border-border/40 bg-background shadow-2xl">
                
                <div className="px-6 py-6 border-b flex justify-between items-start bg-secondary/5">
                    <div className="flex-1 mr-4">
                        <Input 
                            value={localTitle} 
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            className="text-xl font-black border-transparent hover:border-border/40 focus-visible:ring-0 bg-transparent px-0 h-auto w-full mb-0 tracking-tight"
                            placeholder="Untitled"
                        />
                        <SheetTitle className="sr-only">{localTitle}</SheetTitle>
                        <SheetDescription className="sr-only">Details</SheetDescription>
                    </div>
                    <div className="flex gap-1 shrink-0 mt-1">
                        <a href={page.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-secondary rounded transition-colors text-muted-foreground/50 hover:text-foreground" title="Notion">
                            <ExternalLink size={14} />
                        </a>
                        {onDelete && (
                            <button onClick={() => {
                                if (confirm("Delete?")) {
                                    onDelete(page.id);
                                    onClose();
                                }
                            }} className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors text-muted-foreground/50" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <div className="grid grid-cols-1 gap-y-3">
                        {properties.map(([name, schema]: any) => {
                            const propValue = page.properties[name];
                            return (
                                <div key={name} className="flex items-center gap-4 group">
                                    <span className="w-24 text-[8px] font-black text-muted-foreground/30 uppercase tracking-tighter shrink-0 truncate">{name}</span>
                                    <div className="flex-1 min-w-0">
                                        <NotionCell
                                            type={schema.type}
                                            schema={schema}
                                            value={propValue}
                                            onUpdate={(newVal) => onUpdate(page.id, name, newVal)}
                                            onNavigate={() => onClose()}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-border/20">
                        {loadingBlocks ? (
                            <div className="h-32 flex items-center justify-center opacity-10"><RefreshCw size={16} className="animate-spin" /></div>
                        ) : (
                            <textarea
                                value={rawMarkdown}
                                onChange={(e) => { setRawMarkdown(e.target.value); setIsDirty(true); }}
                                className="w-full min-h-[400px] p-0 text-xs bg-transparent border-none rounded focus:outline-none font-mono leading-relaxed resize-none custom-scrollbar placeholder:opacity-10"
                                placeholder="..."
                                disabled={page.isOptimistic}
                            />
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
