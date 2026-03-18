import { useState } from 'react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import Academics from './notion/academics'
import Goals from './notion/goals'
import { cn } from '@/lib/utils'
import { GraduationCap, Target } from 'lucide-react'

export default function Notion() {
    const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'goals'>('academics')

    const tabs = [
        { id: 'academics', label: 'Academics', icon: GraduationCap },
        { id: 'goals', label: 'Goals', icon: Target },
    ]

    return (
        <>
            <Header>
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                </div>
            </Header>

            <Main>
                <div className="h-full flex-1 flex flex-col space-y-6 md:flex max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
                    <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Notion Hub</h2>
                            <p className="text-muted-foreground">
                                Managed workspace for your academics and goals.
                            </p>
                        </div>
                        
                        <div className="flex items-center p-1 bg-muted/50 rounded-md">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        {activeTab === 'academics' && <Academics />}
                        {activeTab === 'goals' && <Goals />}
                    </div>
                </div>
            </Main>
        </>
    )
}
