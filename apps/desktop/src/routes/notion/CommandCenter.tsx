import { useState } from "react";
import { useNotionDB, notifyDB } from "@/hooks/useNotionDB";
import { NotionTable } from "@/components/notion/NotionTable";
import { NotionPageModal } from "@/components/notion/NotionPageModal";
import { Card } from "@/components/ui/card";
import { sidecarApi } from "@/lib/sidecarApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TASKS_DB_ID = "2a9219ed-7519-8185-8d5d-fd7cf8081bc0";
const PROJECTS_DB_ID = "2a9219ed-7519-81fb-a4ca-f81ce93f1501";
const GOALS_DB_ID = "2a9219ed-7519-815f-ac0f-ebfcd1dcd003";
const TIMEBLOCK_DB_ID = "2df219ed-7519-805e-a692-c77fbfb55778";
const CALENDAR_DB_ID = "2a9219ed-7519-81f8-bfab-cccbc720a78c";
const TRACKER_DB_ID = "2a9219ed-7519-81cd-948b-fa3f60a50748";

export default function CommandCenter() {
    const tasks = useNotionDB(TASKS_DB_ID);
    const projects = useNotionDB(PROJECTS_DB_ID);
    const goals = useNotionDB(GOALS_DB_ID);
    const timeblocks = useNotionDB(TIMEBLOCK_DB_ID);
    const calendar = useNotionDB(CALENDAR_DB_ID);
    const tracker = useNotionDB(TRACKER_DB_ID);

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
                notifyDB({ databaseId: dbId, type: 'update', pageId: id, properties: { [prop]: val } });
                await sidecarApi.updateNotionPage(id, { [prop]: val });
            }, async (id: string) => {
                notifyDB({ databaseId: dbId, type: 'delete', pageId: id });
                await sidecarApi.deleteNotionPage(id);
            });
        } catch (e) {
            window.open(`https://notion.so/${pageId.replace(/-/g, '')}`, '_blank');
        }
    };

    const activeTasks = tasks.data.filter(row => !row.properties.Done?.checkbox);
    const activeProjects = projects.data.filter(row => row.properties.Status?.status?.name !== 'Done');
    const today = new Date().toISOString().split('T')[0];
    const todayBlocks = timeblocks.data.filter(row => row.properties.Date?.date?.start === today);

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
                        ...prev, properties: { ...prev.properties, [prop]: { ...prev.properties[prop], ...val } }
                    }));
                }}
                onDelete={(id) => { if (activeDeleter) activeDeleter(id); }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-secondary/5 border-none shadow-none p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-20">Tasks</p>
                    <h3 className="text-xl font-black">{tasks.isLoading ? "..." : activeTasks.length}</h3>
                </Card>
                <Card className="bg-secondary/5 border-none shadow-none p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-20">Projects</p>
                    <h3 className="text-xl font-black">{projects.isLoading ? "..." : activeProjects.length}</h3>
                </Card>
                <Card className="bg-secondary/5 border-none shadow-none p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-20">Goals</p>
                    <h3 className="text-xl font-black">{goals.isLoading ? "..." : goals.data.length}</h3>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Today</h3>
                        <NotionTable 
                            metadata={timeblocks.metadata} 
                            rows={todayBlocks} 
                            onUpdate={timeblocks.updateProperty} 
                            onRowClick={(row) => openPage(row, timeblocks.metadata, timeblocks.updateProperty, timeblocks.deletePage)}
                            onNavigate={handleNavigate}
                            onRefresh={timeblocks.refresh}
                            onAddRow={async () => {
                                const newPage = await timeblocks.addPage({ "Name": { title: [{ text: { content: "New Block" } }] }, "Date": { date: { start: today } } });
                                if (newPage) openPage(newPage, timeblocks.metadata, timeblocks.updateProperty, timeblocks.deletePage);
                            }}
                            isLoading={timeblocks.isLoading} 
                            maxColumns={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Priority</h3>
                        <NotionTable 
                            metadata={tasks.metadata} 
                            rows={activeTasks.slice(0, 10)} 
                            onUpdate={tasks.updateProperty} 
                            onRowClick={(row) => openPage(row, tasks.metadata, tasks.updateProperty, tasks.deletePage)}
                            onNavigate={handleNavigate}
                            onRefresh={tasks.refresh}
                            onAddRow={async () => {
                                const newPage = await tasks.addPage({ "Name": { title: [{ text: { content: "New Task" } }] } });
                                if (newPage) openPage(newPage, tasks.metadata, tasks.updateProperty, tasks.deletePage);
                            }}
                            isLoading={tasks.isLoading} 
                            maxColumns={5}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <Tabs defaultValue="projects" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-secondary/10 h-8 p-0.5 gap-0.5 max-w-sm">
                            <TabsTrigger value="projects" className="text-[9px] uppercase font-bold tracking-tighter h-7">Projects</TabsTrigger>
                            <TabsTrigger value="goals" className="text-[9px] uppercase font-bold tracking-tighter h-7">Goals</TabsTrigger>
                            <TabsTrigger value="calendar" className="text-[9px] uppercase font-bold tracking-tighter h-7">Events</TabsTrigger>
                            <TabsTrigger value="tracker" className="text-[9px] uppercase font-bold tracking-tighter h-7">Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="mt-4">
                            <NotionTable 
                                metadata={projects.metadata} 
                                rows={activeProjects} 
                                onUpdate={projects.updateProperty} 
                                onRowClick={(row) => openPage(row, projects.metadata, projects.updateProperty, projects.deletePage)}
                                onNavigate={handleNavigate}
                                onRefresh={projects.refresh}
                                onAddRow={async () => {
                                    const newPage = await projects.addPage({ "Name": { title: [{ text: { content: "New Project" } }] } });
                                    if (newPage) openPage(newPage, projects.metadata, projects.updateProperty, projects.deletePage);
                                }}
                                isLoading={projects.isLoading} 
                                maxColumns={5}
                            />
                        </TabsContent>

                        <TabsContent value="goals" className="mt-4">
                            <NotionTable metadata={goals.metadata} rows={goals.data} onUpdate={goals.updateProperty} onRowClick={(row) => openPage(row, goals.metadata, goals.updateProperty, goals.deletePage)} onNavigate={handleNavigate} onRefresh={goals.refresh} onAddRow={async () => { const newPage = await goals.addPage({ "Name": { title: [{ text: { content: "New Goal" } }] } }); if (newPage) openPage(newPage, goals.metadata, goals.updateProperty, goals.deletePage); }} isLoading={goals.isLoading} maxColumns={4} />
                        </TabsContent>

                        <TabsContent value="calendar" className="mt-4">
                            <NotionTable metadata={calendar.metadata} rows={calendar.data} onUpdate={calendar.updateProperty} onRowClick={(row) => openPage(row, calendar.metadata, calendar.updateProperty, calendar.deletePage)} onNavigate={handleNavigate} onRefresh={calendar.refresh} onAddRow={async () => { const newPage = await calendar.addPage({ "Name": { title: [{ text: { content: "New Event" } }] } }); if (newPage) openPage(newPage, calendar.metadata, calendar.updateProperty, calendar.deletePage); }} isLoading={calendar.isLoading} maxColumns={5} />
                        </TabsContent>

                        <TabsContent value="tracker" className="mt-4">
                            <NotionTable metadata={tracker.metadata} rows={tracker.data} onUpdate={tracker.updateProperty} onRowClick={(row) => openPage(row, tracker.metadata, tracker.updateProperty, tracker.deletePage)} onNavigate={handleNavigate} onRefresh={tracker.refresh} onAddRow={async () => { const newPage = await tracker.addPage({ "Date": { title: [{ text: { content: "New Day" } }] } }); if (newPage) openPage(newPage, tracker.metadata, tracker.updateProperty, tracker.deletePage); }} isLoading={tracker.isLoading} maxColumns={5} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
