import { useState } from "react";
import { useNotionDB, notifyDB } from "@/hooks/useNotionDB";
import { NotionTable } from "@/components/notion/NotionTable";
import { NotionPageModal } from "@/components/notion/NotionPageModal";
import { PenTool, AlertTriangle } from "lucide-react";
import { sidecarApi } from "@/lib/sidecarApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COURSES_DB_ID = "2a9219ed-7519-817e-aedb-da156d06134c";
const ASSIGNMENTS_DB_ID = "2a9219ed-7519-816a-a0cf-ed1a32abce49";
const EXAMS_DB_ID = "2a9219ed-7519-8182-be2c-e7e7523dcf3b";
const SEMESTERS_DB_ID = "2a9219ed-7519-8106-8a97-dfdc9c88911b";
const STUDY_PLANNER_DB_ID = "2a9219ed-7519-81e2-81f8-de21e47c26fc";

export default function ScholarsLab() {
    const courses = useNotionDB(COURSES_DB_ID);
    const assignments = useNotionDB(ASSIGNMENTS_DB_ID);
    const exams = useNotionDB(EXAMS_DB_ID);
    const semesters = useNotionDB(SEMESTERS_DB_ID);
    const studyPlanner = useNotionDB(STUDY_PLANNER_DB_ID);

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

    const pendingAssignments = assignments.data.filter(row => row.properties.Status?.status?.name !== 'Done');
    const upcomingExams = exams.data.filter(row => {
        const date = row.properties['Exam Date']?.date?.start;
        return date && new Date(date) >= new Date();
    });

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

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-sm bg-secondary/10 h-8 p-0.5 gap-0.5">
                    <TabsTrigger value="courses" className="text-[9px] uppercase font-bold tracking-tighter h-7">Courses</TabsTrigger>
                    <TabsTrigger value="workload" className="text-[9px] uppercase font-bold tracking-tighter h-7">Workload</TabsTrigger>
                    <TabsTrigger value="planner" className="text-[9px] uppercase font-bold tracking-tighter h-7">Planner</TabsTrigger>
                    <TabsTrigger value="semesters" className="text-[9px] uppercase font-bold tracking-tighter h-7">Semesters</TabsTrigger>
                </TabsList>

                <TabsContent value="courses" className="mt-4">
                    <NotionTable 
                        metadata={courses.metadata} 
                        rows={courses.data} 
                        onUpdate={courses.updateProperty} 
                        onRowClick={(row) => openPage(row, courses.metadata, courses.updateProperty, courses.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={courses.refresh}
                        onAddRow={async () => {
                            const newPage = await courses.addPage({ "Course Name": { title: [{ text: { content: "New Course" } }] } });
                            if (newPage) openPage(newPage, courses.metadata, courses.updateProperty, courses.deletePage);
                        }}
                        isLoading={courses.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="workload" className="mt-4 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 flex items-center gap-2">
                                <PenTool size={10} /> Pending
                            </h3>
                            <NotionTable 
                                metadata={assignments.metadata} 
                                rows={pendingAssignments} 
                                onUpdate={assignments.updateProperty} 
                                onRowClick={(row) => openPage(row, assignments.metadata, assignments.updateProperty, assignments.deletePage)}
                                onNavigate={handleNavigate}
                                onRefresh={assignments.refresh}
                                onAddRow={async () => {
                                    const newPage = await assignments.addPage({ "Name": { title: [{ text: { content: "New Assignment" } }] } });
                                    if (newPage) openPage(newPage, assignments.metadata, assignments.updateProperty, assignments.deletePage);
                                }}
                                isLoading={assignments.isLoading} 
                                maxColumns={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 flex items-center gap-2">
                                <AlertTriangle size={10} /> Exams
                            </h3>
                            <NotionTable 
                                metadata={exams.metadata} 
                                rows={upcomingExams} 
                                onUpdate={exams.updateProperty} 
                                onRowClick={(row) => openPage(row, exams.metadata, exams.updateProperty, exams.deletePage)}
                                onNavigate={handleNavigate}
                                onRefresh={exams.refresh}
                                onAddRow={async () => {
                                    const newPage = await exams.addPage({ "Name": { title: [{ text: { content: "New Exam" } }] } });
                                    if (newPage) openPage(newPage, exams.metadata, exams.updateProperty, exams.deletePage);
                                }}
                                isLoading={exams.isLoading} 
                                maxColumns={4}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="planner" className="mt-4">
                    <NotionTable 
                        metadata={studyPlanner.metadata} 
                        rows={studyPlanner.data} 
                        onUpdate={studyPlanner.updateProperty} 
                        onRowClick={(row) => openPage(row, studyPlanner.metadata, studyPlanner.updateProperty, studyPlanner.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={studyPlanner.refresh}
                        onAddRow={async () => {
                            const newPage = await studyPlanner.addPage({ "Name": { title: [{ text: { content: "New Plan" } }] } });
                            if (newPage) openPage(newPage, studyPlanner.metadata, studyPlanner.updateProperty, studyPlanner.deletePage);
                        }}
                        isLoading={studyPlanner.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>

                <TabsContent value="semesters" className="mt-4">
                    <NotionTable 
                        metadata={semesters.metadata} 
                        rows={semesters.data} 
                        onUpdate={semesters.updateProperty} 
                        onRowClick={(row) => openPage(row, semesters.metadata, semesters.updateProperty, semesters.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={semesters.refresh}
                        onAddRow={async () => {
                            const newPage = await semesters.addPage({ "Name": { title: [{ text: { content: "New Semester" } }] } });
                            if (newPage) openPage(newPage, semesters.metadata, semesters.updateProperty, semesters.deletePage);
                        }}
                        isLoading={semesters.isLoading} 
                        maxColumns={4}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
