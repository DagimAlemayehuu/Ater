import { useState } from "react";
import { useNotionDB } from "@/hooks/useNotionDB";
import { NotionTable } from "@/components/notion/NotionTable";
import { NotionPageModal } from "@/components/notion/NotionPageModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sidecarApi } from "@/lib/sidecarApi";

const NOTES_ARCHIVE_DB_ID = "2a9219ed751981508f1fdbea104e37d7";
const SUMMARY_ARCHIVE_DB_ID = "2a9219ed75198137b61ac632d7aca9f4";
const PROMPT_LIBRARY_DB_ID = "2a9219ed751981a082a8d2220372e4f9";
const JOURNAL_DB_ID = "2a9219ed75198110b509e05d052b3fe8";
const CRM_DB_ID = "2a9219ed75198126a08fc31d107035ee";
const SCRATCHPAD_DB_ID = "2a9219ed7519816fbcd9f1bcc9d3aa78";

export default function LibraryCRM() {
    const notes = useNotionDB(NOTES_ARCHIVE_DB_ID);
    const summaries = useNotionDB(SUMMARY_ARCHIVE_DB_ID);
    const prompts = useNotionDB(PROMPT_LIBRARY_DB_ID);
    const journal = useNotionDB(JOURNAL_DB_ID);
    const crm = useNotionDB(CRM_DB_ID);
    const scratchpad = useNotionDB(SCRATCHPAD_DB_ID);

    const [selectedPage, setSelectedPage] = useState<any | null>(null);
    const [selectedDbMeta, setSelectedDbMeta] = useState<any | null>(null);
    const [activeUpdater, setActiveUpdater] = useState<any | null>(null);
    const [activeDeleter, setActiveDeleter] = useState<any | null>(null);

    const openPage = (page: any, metadata: any, updateFn: any, deleteFn: any) => {
        setSelectedPage(page);
        setSelectedDbMeta(metadata);
        setActiveUpdater(() => updateFn);
        setActiveDeleter(() => deleteFn);
    };

    const handleNavigate = async (pageId: string) => {
        try {
            const page = await sidecarApi.getNotionPage(pageId);
            const dbId = page.parent.database_id.replace(/-/g, '');
            const dbData = await sidecarApi.getNotionDatabaseData(dbId);
            openPage(page, dbData.metadata, async (id: string, prop: string, val: any) => {
                await sidecarApi.updateNotionPage(id, { [prop]: val });
            }, async (id: string) => {
                await sidecarApi.deleteNotionPage(id);
            });
        } catch (e) {
            window.open(`https://notion.so/${pageId.replace(/-/g, '')}`, '_blank');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <NotionPageModal
                isOpen={!!selectedPage}
                onClose={() => { setSelectedPage(null); setSelectedDbMeta(null); }}
                page={selectedPage}
                metadata={selectedDbMeta}
                onUpdate={(id, prop, val) => {
                    if (activeUpdater) activeUpdater(id, prop, val);
                    setSelectedPage((prev: any) => ({
                        ...prev,
                        properties: { ...prev.properties, [prop]: { ...prev.properties[prop], ...val } }
                    }));
                }}
                onDelete={(id) => { if (activeDeleter) activeDeleter(id); }}
            />

            <Tabs defaultValue="library" className="w-full">
                <TabsList className="grid w-full grid-cols-6 max-w-lg bg-secondary/10 h-8 p-0.5 gap-0.5">
                    <TabsTrigger value="library" className="text-[9px] uppercase font-bold tracking-tighter h-7">Notes</TabsTrigger>
                    <TabsTrigger value="summaries" className="text-[9px] uppercase font-bold tracking-tighter h-7">Sum</TabsTrigger>
                    <TabsTrigger value="prompts" className="text-[9px] uppercase font-bold tracking-tighter h-7">AI</TabsTrigger>
                    <TabsTrigger value="journal" className="text-[9px] uppercase font-bold tracking-tighter h-7">Log</TabsTrigger>
                    <TabsTrigger value="crm" className="text-[9px] uppercase font-bold tracking-tighter h-7">CRM</TabsTrigger>
                    <TabsTrigger value="scratchpad" className="text-[9px] uppercase font-bold tracking-tighter h-7">Draft</TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="mt-4">
                    <NotionTable 
                        metadata={notes.metadata} 
                        rows={notes.data} 
                        onUpdate={notes.updateProperty} 
                        onRowClick={(row) => openPage(row, notes.metadata, notes.updateProperty, notes.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={notes.refresh}
                        onAddRow={async () => {
                            const newPage = await notes.addPage({ "Name": { title: [{ text: { content: "New Note" } }] } });
                            if (newPage) openPage(newPage, notes.metadata, notes.updateProperty, notes.deletePage);
                        }}
                        isLoading={notes.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="summaries" className="mt-4">
                    <NotionTable 
                        metadata={summaries.metadata} 
                        rows={summaries.data} 
                        onUpdate={summaries.updateProperty} 
                        onRowClick={(row) => openPage(row, summaries.metadata, summaries.updateProperty, summaries.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={summaries.refresh}
                        onAddRow={async () => {
                            const newPage = await summaries.addPage({ "Name": { title: [{ text: { content: "New Summary" } }] } });
                            if (newPage) openPage(newPage, summaries.metadata, summaries.updateProperty, summaries.deletePage);
                        }}
                        isLoading={summaries.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="prompts" className="mt-4">
                    <NotionTable 
                        metadata={prompts.metadata} 
                        rows={prompts.data} 
                        onUpdate={prompts.updateProperty} 
                        onRowClick={(row) => openPage(row, prompts.metadata, prompts.updateProperty, prompts.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={prompts.refresh}
                        onAddRow={async () => {
                            const newPage = await prompts.addPage({ "Name": { title: [{ text: { content: "New Prompt" } }] } });
                            if (newPage) openPage(newPage, prompts.metadata, prompts.updateProperty, prompts.deletePage);
                        }}
                        isLoading={prompts.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="journal" className="mt-4">
                    <NotionTable 
                        metadata={journal.metadata} 
                        rows={journal.data} 
                        onUpdate={journal.updateProperty} 
                        onRowClick={(row) => openPage(row, journal.metadata, journal.updateProperty, journal.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={journal.refresh}
                        onAddRow={async () => {
                            const newPage = await journal.addPage({ "Name": { title: [{ text: { content: "New Entry" } }] } });
                            if (newPage) openPage(newPage, journal.metadata, journal.updateProperty, journal.deletePage);
                        }}
                        isLoading={journal.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="crm" className="mt-4">
                    <NotionTable 
                        metadata={crm.metadata} 
                        rows={crm.data} 
                        onUpdate={crm.updateProperty} 
                        onRowClick={(row) => openPage(row, crm.metadata, crm.updateProperty, crm.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={crm.refresh}
                        onAddRow={async () => {
                            const newPage = await crm.addPage({ "Name": { title: [{ text: { content: "New Contact" } }] } });
                            if (newPage) openPage(newPage, crm.metadata, crm.updateProperty, crm.deletePage);
                        }}
                        isLoading={crm.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="scratchpad" className="mt-4">
                    <NotionTable 
                        metadata={scratchpad.metadata} 
                        rows={scratchpad.data} 
                        onUpdate={scratchpad.updateProperty} 
                        onRowClick={(row) => openPage(row, scratchpad.metadata, scratchpad.updateProperty, scratchpad.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={scratchpad.refresh}
                        onAddRow={async () => {
                            const newPage = await scratchpad.addPage({ "Name": { title: [{ text: { content: "New Entry" } }] } });
                            if (newPage) openPage(newPage, scratchpad.metadata, scratchpad.updateProperty, scratchpad.deletePage);
                        }}
                        isLoading={scratchpad.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
