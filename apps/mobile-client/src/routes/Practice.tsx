import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { useNavigate } from 'react-router-dom'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts'

const MOCK_MASTERY_DATA = [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 68 },
    { day: 'Wed', score: 75 },
    { day: 'Thu', score: 72 },
    { day: 'Fri', score: 84 },
    { day: 'Sat', score: 89 },
    { day: 'Sun', score: 84 },
]

export default function Practice() {
    const [practices, setPractices] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchPractices()
    }, [])

    const fetchPractices = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listPractices()
            setPractices(res.practices || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 overflow-y-auto custom-scrollbar">
             {/* Header Content */}
             <div className="px-6 pt-12 pb-8">
                <nav className="flex items-center gap-2 mb-6">
                    <span className="label-sm text-secondary">PEDAGOGY</span>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-primary">SOCRATIC LAB</span>
                </nav>
                
                <h1 className="display-md mb-8">Mastery Lab</h1>

                {/* Mastery Trend Widget (High Fidelity) */}
                <div className="bg-surface-container-low p-6 mb-10 ghost-border relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <p className="label-sm text-secondary mb-1">AGGREGATE PROFICIENCY</p>
                            <h2 className="display-md text-[2rem]">84.2%</h2>
                        </div>
                        <div className="bg-primary text-on-primary p-2">
                             <span className="material-symbols-outlined text-[20px]">trending_up</span>
                        </div>
                    </div>
                    
                    <div className="h-32 w-full mt-4 -mx-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_MASTERY_DATA}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="black" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="black" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="black" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-surface-container-lowest p-5 ghost-border">
                        <span className="label-sm text-secondary block mb-2">PROBES_FIRED</span>
                        <span className="headline-sm">{practices.length * 12}</span>
                    </div>
                    <div className="bg-surface-container-lowest p-5 ghost-border">
                        <span className="label-sm text-secondary block mb-2">STABILITY_AVG</span>
                        <span className="headline-sm">0.72</span>
                    </div>
                </div>

                {/* Active Sessions List */}
                <section className="space-y-6">
                    <h2 className="label-sm text-secondary tracking-[0.3em]">ACTIVE MASTERIES</h2>
                    
                    {loading ? (
                         <div className="py-20 text-center opacity-40">
                             <span className="material-symbols-outlined animate-spin text-[32px]">refresh</span>
                         </div>
                    ) : practices.length > 0 ? (
                        <div className="space-y-4">
                            {practices.map((p, i) => (
                                <button
                                    key={i}
                                    className="w-full bg-surface-container-low p-6 flex flex-col gap-4 text-left hover:bg-accent transition-colors group border-l-4 border-primary"
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="headline-sm text-[1.25rem]">{p.name || 'Core Synthesis'}</h3>
                                        <span className="material-symbols-outlined text-primary">play_circle</span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 opacity-60">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="uppercase">COMPLETION</span>
                                            <span>75%</span>
                                        </div>
                                        <div className="h-1 bg-border/20 w-full">
                                            <div className="h-full bg-primary w-3/4" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                                            <span className="label-sm text-[8px]">12 CLUSTERS</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <span className="material-symbols-outlined text-[14px]">timer</span>
                                            <span className="label-sm text-[8px]">4d LEFT</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 border-2 border-dashed border-border flex flex-col items-center justify-center text-center px-10 opacity-40">
                            <span className="material-symbols-outlined text-[48px] mb-4">school</span>
                            <p className="body-md italic tracking-tight">No active mastery sessions generated. Complete ingestion to trigger Socratic loops.</p>
                        </div>
                    )}
                </section>
             </div>

             {/* Bottom Spacing */}
             <div className="h-24 shrink-0" />
        </div>
    )
}
