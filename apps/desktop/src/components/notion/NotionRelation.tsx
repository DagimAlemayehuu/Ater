import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { sidecarApi } from "@/lib/sidecarApi";
import { FileText, Plus, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface NotionRelationProps {
    relationData: any[]; // Array of { id: string }
    onNavigate?: (pageId: string) => void;
    onUpdate?: (newRelation: { id: string }[]) => void;
    schema?: any;
}

export function NotionRelation({ relationData, onNavigate, onUpdate, schema }: NotionRelationProps) {
    const [titles, setTitles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [searchData, setSearchData] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchTitles = async () => {
            if (!relationData || relationData.length === 0) {
                setLoading(false);
                return;
            }
            
            const newTitles: Record<string, string> = {};
            for (const rel of relationData) {
                if (titles[rel.id]) {
                    newTitles[rel.id] = titles[rel.id];
                    continue;
                }
                try {
                    const page = await sidecarApi.getNotionPage(rel.id);
                    if (!page || !page.properties) continue;
                    
                    const titleKey = Object.keys(page.properties).find(k => page.properties[k].type === 'title') || 'Name';
                    const titleArr = page.properties[titleKey]?.title;
                    if (titleArr && titleArr.length > 0) {
                        newTitles[rel.id] = titleArr.map((t: any) => t.plain_text).join('');
                    } else {
                        newTitles[rel.id] = "Untitled";
                    }
                } catch (e) {
                    newTitles[rel.id] = "Unknown Page";
                }
            }
            if (isMounted) {
                setTitles(prev => ({ ...prev, ...newTitles }));
                setLoading(false);
            }
        };

        fetchTitles();
        return () => { isMounted = false; };
    }, [relationData]);

    const fetchSearchData = async () => {
        if (!schema?.relation?.database_id || isSearching) return;
        setIsSearching(true);
        try {
            const dbId = schema.relation.database_id.replace(/-/g, '');
            const res = await sidecarApi.getNotionDatabaseData(dbId);
            setSearchData(res.rows);
        } catch (e) {
            console.error("Failed to fetch relation search data", e);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleRelation = (pageId: string) => {
        if (!onUpdate) return;
        const exists = relationData.some(r => r.id === pageId);
        if (exists) {
            onUpdate(relationData.filter(r => r.id !== pageId));
        } else {
            onUpdate([...relationData, { id: pageId }]);
        }
    };

    const getPageTitle = (page: any) => {
        const titleKey = Object.keys(page.properties).find(k => page.properties[k].type === 'title') || 'Name';
        const titleArr = page.properties[titleKey]?.title;
        return titleArr?.map((t: any) => t.plain_text).join('') || "Untitled";
    };

    const isEmpty = !relationData || relationData.length === 0;

    return (
        <div className="flex flex-wrap gap-1 items-center">
            {!isEmpty && relationData.map((rel) => (
                <Badge 
                    key={rel.id} 
                    variant="outline" 
                    className="text-[10px] cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 bg-background group pr-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) {
                            onNavigate(rel.id);
                        } else {
                            window.open(`https://notion.so/${rel.id.replace(/-/g, '')}`, '_blank');
                        }
                    }}
                >
                    <FileText size={10} className="opacity-50" />
                    <span className="max-w-[120px] truncate">{titles[rel.id] || (loading ? "..." : "Untitled")}</span>
                    {onUpdate && (
                        <X 
                            size={10} 
                            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all" 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleRelation(rel.id);
                            }}
                        />
                    )}
                </Badge>
            ))}

            {onUpdate && schema?.relation?.database_id && (
                <Popover open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (val && searchData.length === 0) fetchSearchData();
                }}>
                    <PopoverTrigger asChild>
                        <button 
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed text-[10px] hover:bg-accent transition-colors",
                                isEmpty ? "text-muted-foreground opacity-50" : "text-primary opacity-70"
                            )}
                        >
                            <Plus size={10} />
                            {isEmpty && "Add Relation"}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[250px]" align="start" onClick={(e) => e.stopPropagation()}>
                        <Command>
                            <CommandInput placeholder="Search pages..." />
                            <CommandList className="custom-scrollbar">
                                <CommandEmpty>{isSearching ? "Loading database..." : "No results found."}</CommandEmpty>
                                <CommandGroup>
                                    {searchData.map((page) => {
                                        const isSelected = relationData.some(r => r.id === page.id);
                                        return (
                                            <CommandItem
                                                key={page.id}
                                                onSelect={() => {
                                                    toggleRelation(page.id);
                                                    setTitles(prev => ({ ...prev, [page.id]: getPageTitle(page) }));
                                                }}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileText size={14} className="opacity-50 shrink-0" />
                                                    <span className="truncate">{getPageTitle(page)}</span>
                                                </div>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}

            {isEmpty && !onUpdate && (
                <div className="text-[10px] text-muted-foreground/30 italic px-2 font-medium">Empty</div>
            )}
        </div>
    );
}
