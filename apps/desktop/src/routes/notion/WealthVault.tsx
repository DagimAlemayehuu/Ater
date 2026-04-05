import { useState } from "react";
import { useNotionDB } from "@/hooks/useNotionDB";
import { NotionTable } from "@/components/notion/NotionTable";
import { NotionPageModal } from "@/components/notion/NotionPageModal";
import { Wallet, TrendingUp, TrendingDown, Landmark, ArrowLeftRight, PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { sidecarApi } from "@/lib/sidecarApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BANK_ACCOUNTS_DB_ID = "2a9219ed-7519-8115-9787-eded557f5203";
const INCOME_DB_ID = "2a9219ed-7519-81a5-b213-e4d46a49743f";
const EXPENSES_DB_ID = "2a9219ed-7519-81a7-9528-e8f12c07fb69";
const INCOME_TYPE_DB_ID = "2a9219ed-7519-819d-aa9e-d7a3a6997845";
const EXPENSE_TYPE_DB_ID = "2a9219ed-7519-81c9-acc9-d428ca071c4f";
const TRANSFER_DB_ID = "2a9219ed-7519-81a1-b7c6-d4379a5db942";

export default function WealthVault() {
    const accounts = useNotionDB(BANK_ACCOUNTS_DB_ID);
    const income = useNotionDB(INCOME_DB_ID);
    const expenses = useNotionDB(EXPENSES_DB_ID);
    const incomeType = useNotionDB(INCOME_TYPE_DB_ID);
    const expenseType = useNotionDB(EXPENSE_TYPE_DB_ID);
    const transfers = useNotionDB(TRANSFER_DB_ID);

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

    const netWorth = accounts.data.reduce((acc, row) => acc + (row.properties.Balance?.formula?.number || 0), 0);

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

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Landmark size={14} className="opacity-20" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30">Accounts</h3>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-20">Total Assets</p>
                    <h4 className="text-xl font-black tabular-nums">${netWorth.toLocaleString()}</h4>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts.isLoading ? (
                    [1,2,3,4].map(i => <Card key={i} className="h-16 bg-secondary/5 border-none animate-pulse" />)
                ) : (
                    accounts.data.map(account => (
                        <Card 
                            key={account.id} 
                            onClick={() => openPage(account, accounts.metadata, accounts.updateProperty, accounts.deletePage)}
                            className="p-3 bg-secondary/5 border-none shadow-none hover:bg-secondary/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-bold uppercase opacity-20 tracking-tighter">
                                        {account.properties.Type?.select?.name || 'Bank'}
                                    </p>
                                    <h4 className="font-bold text-[11px] truncate max-w-[100px]">{account.properties['Account Name']?.title[0]?.plain_text}</h4>
                                </div>
                                <span className="text-[11px] font-black tabular-nums opacity-60">
                                    ${(account.properties.Balance?.formula?.number || 0).toLocaleString()}
                                </span>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Tabs defaultValue="ledger" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-secondary/10 h-8 p-0.5 gap-0.5 max-w-sm">
                    <TabsTrigger value="ledger" className="text-[9px] uppercase font-bold tracking-tighter h-7">Ledger</TabsTrigger>
                    <TabsTrigger value="types" className="text-[9px] uppercase font-bold tracking-tighter h-7">Budget</TabsTrigger>
                    <TabsTrigger value="transfers" className="text-[9px] uppercase font-bold tracking-tighter h-7">Flow</TabsTrigger>
                </TabsList>

                <TabsContent value="ledger" className="mt-4 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 flex items-center gap-2">
                                <TrendingUp size={10} /> Income
                            </h3>
                            <NotionTable 
                                metadata={income.metadata} 
                                rows={income.data} 
                                onUpdate={income.updateProperty} 
                                onRowClick={(row) => openPage(row, income.metadata, income.updateProperty, income.deletePage)}
                                onNavigate={handleNavigate}
                                onRefresh={income.refresh}
                                onAddRow={async () => {
                                    const newPage = await income.addPage({ "Name of Record": { title: [{ text: { content: "New Income" } }] } });
                                    if (newPage) openPage(newPage, income.metadata, income.updateProperty, income.deletePage);
                                }}
                                isLoading={income.isLoading} 
                                maxColumns={5}
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 flex items-center gap-2">
                                <TrendingDown size={10} /> Expenses
                            </h3>
                            <NotionTable 
                                metadata={expenses.metadata} 
                                rows={expenses.data} 
                                onUpdate={expenses.updateProperty} 
                                onRowClick={(row) => openPage(row, expenses.metadata, expenses.updateProperty, expenses.deletePage)}
                                onNavigate={handleNavigate}
                                onRefresh={expenses.refresh}
                                onAddRow={async () => {
                                    const newPage = await expenses.addPage({ "Name of Record": { title: [{ text: { content: "New Expense" } }] } });
                                    if (newPage) openPage(newPage, expenses.metadata, expenses.updateProperty, expenses.deletePage);
                                }}
                                isLoading={expenses.isLoading} 
                                maxColumns={5}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="types" className="mt-4 space-y-8">
                    <div className="space-y-6">
                        <NotionTable metadata={incomeType.metadata} rows={incomeType.data} onUpdate={incomeType.updateProperty} onRowClick={(row) => openPage(row, incomeType.metadata, incomeType.updateProperty, incomeType.deletePage)} onNavigate={handleNavigate} onRefresh={incomeType.refresh} onAddRow={async () => { const newPage = await incomeType.addPage({ "Income": { title: [{ text: { content: "New Type" } }] } }); if (newPage) openPage(newPage, incomeType.metadata, incomeType.updateProperty, incomeType.deletePage); }} isLoading={incomeType.isLoading} maxColumns={4} />
                        <NotionTable metadata={expenseType.metadata} rows={expenseType.data} onUpdate={expenseType.updateProperty} onRowClick={(row) => openPage(row, expenseType.metadata, expenseType.updateProperty, expenseType.deletePage)} onNavigate={handleNavigate} onRefresh={expenseType.refresh} onAddRow={async () => { const newPage = await expenseType.addPage({ "Expense": { title: [{ text: { content: "New Type" } }] } }); if (newPage) openPage(newPage, expenseType.metadata, expenseType.updateProperty, expenseType.deletePage); }} isLoading={expenseType.isLoading} maxColumns={4} />
                    </div>
                </TabsContent>

                <TabsContent value="transfers" className="mt-4 space-y-4">
                    <NotionTable 
                        metadata={transfers.metadata} 
                        rows={transfers.data} 
                        onUpdate={transfers.updateProperty} 
                        onRowClick={(row) => openPage(row, transfers.metadata, transfers.updateProperty, transfers.deletePage)}
                        onNavigate={handleNavigate}
                        onRefresh={transfers.refresh}
                        onAddRow={async () => {
                            const newPage = await transfers.addPage({ "Transfer": { title: [{ text: { content: "New Transfer" } }] } });
                            if (newPage) openPage(newPage, transfers.metadata, transfers.updateProperty, transfers.deletePage);
                        }}
                        isLoading={transfers.isLoading} 
                        maxColumns={5}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
