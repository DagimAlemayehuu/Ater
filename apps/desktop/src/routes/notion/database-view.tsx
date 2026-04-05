import { useState } from 'react'
import { ArrowLeft, RefreshCw, Table as TableIcon, ExternalLink } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { useNotionDB } from '@/hooks/useNotionDB'
import { NotionTable } from '@/components/notion/NotionTable'
import { NotionPageModal } from '@/components/notion/NotionPageModal'

interface DatabaseViewProps {
    database: {
        id: string
        title: any[]
        url: string
    }
    onBack: () => void
}

export default function DatabaseView({ database, onBack }: DatabaseViewProps) {
    const { data, metadata, isLoading, error, refresh, updateProperty, addPage, deletePage } = useNotionDB(database.id);
    const [selectedPage, setSelectedPage] = useState<any | null>(null)
    const [selectedDbMeta, setSelectedDbMeta] = useState<any | null>(null)

    const handleNavigate = async (pageId: string) => {
        try {
            const page = await sidecarApi.getNotionPage(pageId);
            const dbId = page.parent.database_id.replace(/-/g, '');
            const dbData = await sidecarApi.getNotionDatabaseData(dbId);
            setSelectedPage(page);
            setSelectedDbMeta(dbData.metadata);
        } catch (e) {
            window.open(`https://notion.so/${pageId.replace(/-/g, '')}`, '_blank');
        }
    };

    const getTitle = () => {
        if (!database.title) return 'Untitled'
        if (typeof database.title === 'string') return database.title
        return database.title.map((t: any) => t.plain_text).join('') || 'Untitled'
    }

    return (
        <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4 duration-300">
            <NotionPageModal
                isOpen={!!selectedPage}
                onClose={() => { setSelectedPage(null); setSelectedDbMeta(null); }}
                page={selectedPage}
                metadata={selectedDbMeta || metadata}
                onUpdate={(id, prop, val) => {
                    if (selectedDbMeta) { sidecarApi.updateNotionPage(id, { [prop]: val }); } 
                    else { updateProperty(id, prop, val); }
                    setSelectedPage((prev: any) => ({
                        ...prev, properties: { ...prev.properties, [prop]: { ...prev.properties[prop], ...val } }
                    }));
                }}
                onDelete={(id) => {
                    if (selectedDbMeta) { sidecarApi.deleteNotionPage(id); } 
                    else { deletePage(id); }
                }}
            />

            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground/50 hover:text-foreground"><ArrowLeft size={14} /></button>
                    <div className="flex items-center gap-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{getTitle()}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <button onClick={() => refresh()} disabled={isLoading} className="p-1.5 opacity-20 hover:opacity-100 transition-opacity"><RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /></button>
                    <a href={database.url} target="_blank" rel="noreferrer" className="p-1.5 opacity-20 hover:opacity-100 transition-opacity"><ExternalLink size={12} /></a>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 p-6 text-center"><p className="text-[10px] font-black uppercase tracking-widest">{error}</p></div>
                ) : (
                    <div className="pb-10">
                        <NotionTable
                            metadata={metadata}
                            rows={data}
                            onUpdate={updateProperty}
                            onRowClick={(row) => { setSelectedPage(row); setSelectedDbMeta(null); }}
                            onNavigate={handleNavigate}
                            onRefresh={refresh}
                            onAddRow={async () => {
                                const newPage = await addPage({ "Name": { title: [{ text: { content: "New Page" } }] }, "Title": { title: [{ text: { content: "New Page" } }] } });
                                if (newPage) { setSelectedPage(newPage); setSelectedDbMeta(null); }
                            }}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
