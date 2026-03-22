import { useState } from 'react'
import Academics from './notion/academics'
import Goals from './notion/goals'
import Databases from './notion/databases'
import { cn } from '@/lib/utils'
import { GraduationCap, Target, Database } from 'lucide-react'

export default function Notion() {
    const [activeTab, setActiveTab] = useState<'academics' | 'goals' | 'vault'>('vault')

    const tabs = [
        { id: 'vault', label: 'Notion Vault', icon: Database },
        { id: 'academics', label: 'Academics', icon: GraduationCap },
        { id: 'goals', label: 'Goals', icon: Target },
    ]

    return (
        <div className="h-full flex-1 flex flex-col space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notion Registry</h2>
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                        Real-time interface to your Notion-managed knowledge assets
                    </p>
                </div>
                
                <div className="flex items-center p-1 bg-muted/50 rounded-md">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'vault' && <Databases />}
                {activeTab === 'academics' && <Academics />}
                {activeTab === 'goals' && <Goals />}
            </div>
        </div>
    )
}
