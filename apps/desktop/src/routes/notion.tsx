import { useState } from 'react'
import CommandCenter from './notion/CommandCenter'
import ScholarsLab from './notion/ScholarsLab'
import TheForge from './notion/TheForge'
import WealthVault from './notion/WealthVault'
import LibraryCRM from './notion/LibraryCRM'
import Databases from './notion/databases'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import { LayoutDashboard, GraduationCap, Dumbbell, Wallet, Database, RefreshCw, Library } from 'lucide-react'

type DashboardTab = 'command' | 'scholar' | 'forge' | 'wealth' | 'library' | 'vault';

export default function Notion() {
    const [activeTab, setActiveTab] = useState<DashboardTab>('command')

    const tabs = [
        { id: 'command', label: 'Command', icon: LayoutDashboard },
        { id: 'scholar', label: 'Scholar', icon: GraduationCap },
        { id: 'forge', label: 'Forge', icon: Dumbbell },
        { id: 'wealth', label: 'Wealth', icon: Wallet },
        { id: 'library', label: 'Library', icon: Library },
        { id: 'vault', label: 'Vault', icon: Database },
    ]

    return (
        <div className="h-full flex-1 flex flex-col space-y-4 md:flex w-full mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                    <h2 className="text-xl font-black tracking-tighter uppercase">Intelligence Hub</h2>
                    <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-foreground animate-pulse" />
                        Headless Engine Active
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={async () => {
                            const btn = document.getElementById('sync-all-btn');
                            if (btn) btn.classList.add('animate-spin');
                            try {
                                const dbs = ['2a9219ed-7519-8185-8d5d-fd7cf8081bc0', '2a9219ed-7519-81fb-a4ca-f81ce93f1501', '2a9219ed-7519-815f-ac0f-ebfcd1dcd003', '2a9219ed-7519-817e-aedb-da156d06134c', '2a9219ed-7519-816a-a0cf-ed1a32abce49', '2a9219ed-7519-8182-be2c-e7e7523dcf3b', '2a9219ed-7519-81cd-948b-fa3f60a50748', '2a9219ed-7519-813b-b977-cc9b3f329f81', '2a9219ed-7519-8189-9092-e8388fdc517e', '2a9219ed-7519-8115-9787-eded557f5203', '2a9219ed-7519-81a5-b213-e4d46a49743f', '2a9219ed-7519-81a7-9528-e8f12c07fb69'];
                                await Promise.all(dbs.map(id => sidecarApi.syncNotionDatabase(id)));
                                window.location.reload();
                            } catch (e) {
                                console.error('Sync failed', e);
                            } finally {
                                if (btn) btn.classList.remove('animate-spin');
                            }
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/10 border border-border/40 hover:bg-secondary/20 transition-all text-[9px] font-black uppercase tracking-tighter"
                    >
                        <RefreshCw id="sync-all-btn" size={10} />
                        Sync All
                    </button>
                    
                    <div className="flex items-center p-0.5 bg-secondary/5 rounded border border-border/20">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as DashboardTab)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-background text-foreground shadow-xs ring-1 ring-border/40"
                                        : "text-muted-foreground/50 hover:text-foreground"
                                )}
                            >
                                <tab.icon size={10} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-10">
                {activeTab === 'command' && <CommandCenter />}
                {activeTab === 'scholar' && <ScholarsLab />}
                {activeTab === 'forge' && <TheForge />}
                {activeTab === 'wealth' && <WealthVault />}
                {activeTab === 'library' && <LibraryCRM />}
                {activeTab === 'vault' && <Databases />}
            </div>
        </div>
    )
}
