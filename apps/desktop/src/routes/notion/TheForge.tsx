import { useState } from "react";
import { useNotionDB, notifyDB } from "@/hooks/useNotionDB";
import { NotionTable } from "@/components/notion/NotionTable";
import { NotionPageModal } from "@/components/notion/NotionPageModal";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { sidecarApi } from "@/lib/sidecarApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAILY_TRACKER_DB_ID = "2a9219ed-7519-81cd-948b-fa3f60a50748";
const WORKOUTS_DB_ID = "2a9219ed-7519-813b-b977-cc9b3f329f81";
const MEASUREMENTS_DB_ID = "2a9219ed-7519-8189-9092-e8388fdc517e";
const MUSCLES_DB_ID = "2a9219ed-7519-814c-8187-f73dbece70dc";
const EXERCISES_DB_ID = "2a9219ed-7519-81ce-9eec-d64821c61062";
const LOGGER_DB_ID = "2a9219ed-7519-81fe-b7a8-fed542505d07";
const MEALS_DB_ID = "2a9219ed-7519-8134-88c3-da8248a01020";
const FOOD_DB_ID = "2a9219ed-7519-815e-8c77-eb95a02d28e6";
const NUTRITION_DB_ID = "2a9219ed-7519-8181-9e81-ca35e1081dd5";
const INGREDIENTS_DB_ID = "2a9219ed-7519-8192-95c3-ce3b91a92696";
const MEALPLAN_DB_ID = "2a9219ed-7519-8193-8cb6-e764a9ab4240";
const GROCERIES_DB_ID = "2a9219ed-7519-81b3-9b77-f72ac2ae63e3";
const CART_DB_ID = "2a9219ed-7519-81e7-be16-d581ded931da";

export default function TheForge() {
    const tracker = useNotionDB(DAILY_TRACKER_DB_ID);
    const workouts = useNotionDB(WORKOUTS_DB_ID);
    const measurements = useNotionDB(MEASUREMENTS_DB_ID);
    const muscles = useNotionDB(MUSCLES_DB_ID);
    const exercises = useNotionDB(EXERCISES_DB_ID);
    const logger = useNotionDB(LOGGER_DB_ID);
    const meals = useNotionDB(MEALS_DB_ID);
    const food = useNotionDB(FOOD_DB_ID);
    const nutrition = useNotionDB(NUTRITION_DB_ID);
    const ingredients = useNotionDB(INGREDIENTS_DB_ID);
    const mealplan = useNotionDB(MEALPLAN_DB_ID);
    const groceries = useNotionDB(GROCERIES_DB_ID);
    const cart = useNotionDB(CART_DB_ID);

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

    const today = new Date().toISOString().split('T')[0];
    const todayStats = tracker.data.find(row => row.properties.Date?.date?.start === today);
    const calories = todayStats?.properties['Total Calories']?.rollup?.number || 0;
    const calorieGoal = todayStats?.properties['Calorie Goal']?.rollup?.number || 2500;
    const protein = todayStats?.properties['Total Protien']?.rollup?.number || 0;
    const proteinGoal = todayStats?.properties['Protein Goal']?.rollup?.number || 150;

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-secondary/5 border-none shadow-none">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Energy</span>
                        <span className="text-[10px] font-mono">{calories} / {calorieGoal}</span>
                    </div>
                    <Progress value={(calories / calorieGoal) * 100} className="h-1 bg-secondary/20" />
                </Card>
                <Card className="p-4 bg-secondary/5 border-none shadow-none">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Protein</span>
                        <span className="text-[10px] font-mono">{protein} / {proteinGoal}</span>
                    </div>
                    <Progress value={(protein / proteinGoal) * 100} className="h-1 bg-secondary/20" />
                </Card>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-sm bg-secondary/10 h-8 p-0.5 gap-0.5">
                    <TabsTrigger value="dashboard" className="text-[9px] uppercase font-bold tracking-tighter h-7">Bio</TabsTrigger>
                    <TabsTrigger value="workouts" className="text-[9px] uppercase font-bold tracking-tighter h-7">Gym</TabsTrigger>
                    <TabsTrigger value="nutrition" className="text-[9px] uppercase font-bold tracking-tighter h-7">Food</TabsTrigger>
                    <TabsTrigger value="groceries" className="text-[9px] uppercase font-bold tracking-tighter h-7">Log</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-4 space-y-6">
                    <NotionTable 
                        metadata={tracker.metadata} 
                        rows={tracker.data} 
                        onUpdate={tracker.updateProperty} 
                        onRowClick={(row) => openPage(row, tracker.metadata, tracker.updateProperty, tracker.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={tracker.refresh}
                        onAddRow={async () => {
                            const newPage = await tracker.addPage({ "Date": { title: [{ text: { content: "New Day" } }] } });
                            if (newPage) openPage(newPage, tracker.metadata, tracker.updateProperty, tracker.deletePage);
                        }}
                        isLoading={tracker.isLoading} 
                        maxColumns={5}
                    />
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Metrics</h3>
                        <NotionTable 
                            metadata={measurements.metadata} 
                            rows={measurements.data} 
                            onUpdate={measurements.updateProperty} 
                            onRowClick={(row) => openPage(row, measurements.metadata, measurements.updateProperty, measurements.deletePage)}
                            onNavigate={handleNavigate}
                            onRefresh={measurements.refresh}
                            onAddRow={async () => {
                                const newPage = await measurements.addPage({ "Notes": { title: [{ text: { content: "New Metric" } }] } });
                                if (newPage) openPage(newPage, measurements.metadata, measurements.updateProperty, measurements.deletePage);
                            }}
                            isLoading={measurements.isLoading} 
                            maxColumns={4}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="workouts" className="mt-4 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Workouts</h3>
                        <NotionTable metadata={workouts.metadata} rows={workouts.data} onUpdate={workouts.updateProperty} onRowClick={(row) => openPage(row, workouts.metadata, workouts.updateProperty, workouts.deletePage)} onNavigate={handleNavigate} onRefresh={workouts.refresh} onAddRow={async () => { const newPage = await workouts.addPage({ "Name": { title: [{ text: { content: "New Workout" } }] } }); if (newPage) openPage(newPage, workouts.metadata, workouts.updateProperty, workouts.deletePage); }} isLoading={workouts.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Logs</h3>
                        <NotionTable metadata={logger.metadata} rows={logger.data} onUpdate={logger.updateProperty} onRowClick={(row) => openPage(row, logger.metadata, logger.updateProperty, logger.deletePage)} onNavigate={handleNavigate} onRefresh={logger.refresh} onAddRow={async () => { const newPage = await logger.addPage({ "Name": { title: [{ text: { content: "New Log" } }] } }); if (newPage) openPage(newPage, logger.metadata, logger.updateProperty, logger.deletePage); }} isLoading={logger.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Exercises</h3>
                        <NotionTable metadata={exercises.metadata} rows={exercises.data} onUpdate={exercises.updateProperty} onRowClick={(row) => openPage(row, exercises.metadata, exercises.updateProperty, exercises.deletePage)} onNavigate={handleNavigate} onRefresh={exercises.refresh} onAddRow={async () => { const newPage = await exercises.addPage({ "Exercise Name": { title: [{ text: { content: "New Exercise" } }] } }); if (newPage) openPage(newPage, exercises.metadata, exercises.updateProperty, exercises.deletePage); }} isLoading={exercises.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Muscles</h3>
                        <NotionTable metadata={muscles.metadata} rows={muscles.data} onUpdate={muscles.updateProperty} onRowClick={(row) => openPage(row, muscles.metadata, muscles.updateProperty, muscles.deletePage)} onNavigate={handleNavigate} onRefresh={muscles.refresh} onAddRow={async () => { const newPage = await muscles.addPage({ "Name": { title: [{ text: { content: "New Group" } }] } }); if (newPage) openPage(newPage, muscles.metadata, muscles.updateProperty, muscles.deletePage); }} isLoading={muscles.isLoading} maxColumns={3} />
                    </div>
                </TabsContent>

                <TabsContent value="nutrition" className="mt-4 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Meals</h3>
                        <NotionTable metadata={meals.metadata} rows={meals.data} onUpdate={meals.updateProperty} onRowClick={(row) => openPage(row, meals.metadata, meals.updateProperty, meals.deletePage)} onNavigate={handleNavigate} onRefresh={meals.refresh} onAddRow={async () => { const newPage = await meals.addPage({ "Name": { title: [{ text: { content: "New Meal" } }] } }); if (newPage) openPage(newPage, meals.metadata, meals.updateProperty, meals.deletePage); }} isLoading={meals.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Plan</h3>
                        <NotionTable metadata={mealplan.metadata} rows={mealplan.data} onUpdate={mealplan.updateProperty} onRowClick={(row) => openPage(row, mealplan.metadata, mealplan.updateProperty, mealplan.deletePage)} onNavigate={handleNavigate} onRefresh={mealplan.refresh} onAddRow={async () => { const newPage = await mealplan.addPage({ "Day": { title: [{ text: { content: "New Plan" } }] } }); if (newPage) openPage(newPage, mealplan.metadata, mealplan.updateProperty, mealplan.deletePage); }} isLoading={mealplan.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Targets</h3>
                        <NotionTable metadata={nutrition.metadata} rows={nutrition.data} onUpdate={nutrition.updateProperty} onRowClick={(row) => openPage(row, nutrition.metadata, nutrition.updateProperty, nutrition.deletePage)} onNavigate={handleNavigate} onRefresh={nutrition.refresh} onAddRow={async () => { const newPage = await nutrition.addPage({ "Phase": { title: [{ text: { content: "New Target" } }] } }); if (newPage) openPage(newPage, nutrition.metadata, nutrition.updateProperty, nutrition.deletePage); }} isLoading={nutrition.isLoading} maxColumns={4} />
                    </div>
                </TabsContent>

                <TabsContent value="groceries" className="mt-4 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Food</h3>
                        <NotionTable metadata={food.metadata} rows={food.data} onUpdate={food.updateProperty} onRowClick={(row) => openPage(row, food.metadata, food.updateProperty, food.deletePage)} onNavigate={handleNavigate} onRefresh={food.refresh} onAddRow={async () => { const newPage = await food.addPage({ "Food": { title: [{ text: { content: "New Food" } }] } }); if (newPage) openPage(newPage, food.metadata, food.updateProperty, food.deletePage); }} isLoading={food.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Calc</h3>
                        <NotionTable metadata={ingredients.metadata} rows={ingredients.data} onUpdate={ingredients.updateProperty} onRowClick={(row) => openPage(row, ingredients.metadata, ingredients.updateProperty, ingredients.deletePage)} onNavigate={handleNavigate} onRefresh={ingredients.refresh} onAddRow={async () => { const newPage = await ingredients.addPage({ "Ingredient": { title: [{ text: { content: "New Item" } }] } }); if (newPage) openPage(newPage, ingredients.metadata, ingredients.updateProperty, ingredients.deletePage); }} isLoading={ingredients.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Shop</h3>
                        <NotionTable metadata={groceries.metadata} rows={groceries.data} onUpdate={groceries.updateProperty} onRowClick={(row) => openPage(row, groceries.metadata, groceries.updateProperty, groceries.deletePage)} onNavigate={handleNavigate} onRefresh={groceries.refresh} onAddRow={async () => { const newPage = await groceries.addPage({ "Name": { title: [{ text: { content: "New Item" } }] } }); if (newPage) openPage(newPage, groceries.metadata, groceries.updateProperty, groceries.deletePage); }} isLoading={groceries.isLoading} maxColumns={4} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-1">Cart</h3>
                        <NotionTable metadata={cart.metadata} rows={cart.data} onUpdate={cart.updateProperty} onRowClick={(row) => openPage(row, cart.metadata, cart.updateProperty, cart.deletePage)} onNavigate={handleNavigate} onRefresh={cart.refresh} onAddRow={async () => { const newPage = await cart.addPage({ "Item": { title: [{ text: { content: "New Item" } }] } }); if (newPage) openPage(newPage, cart.metadata, cart.updateProperty, cart.deletePage); }} isLoading={cart.isLoading} maxColumns={3} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
