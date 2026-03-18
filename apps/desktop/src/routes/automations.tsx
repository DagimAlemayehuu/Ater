import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Zap, AlertCircle } from 'lucide-react'

export default function Automations() {
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
                            <h2 className="text-2xl font-bold tracking-tight">Automations</h2>
                            <p className="text-muted-foreground">Configure triggers and background workflows.</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center">
                        <Zap size={48} strokeWidth={1} className="mb-2" />
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle size={16} />
                            Automation Engine Offline
                        </div>
                        <p className="text-xs max-w-[250px]">
                            This module will be activated in the next development cycle for event-based triggers.
                        </p>
                    </div>
                </div>
            </Main>
        </>
    )
}
