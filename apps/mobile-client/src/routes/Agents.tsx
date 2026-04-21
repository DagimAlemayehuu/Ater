import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

export default function Agents() {
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStatus()
        const it = setInterval(fetchStatus, 5000)
        return () => clearInterval(it)
    }, [])

    const fetchStatus = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setStatus(res)
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
                    <span className="label-sm text-secondary">INFRASTRUCTURE</span>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-primary">NEURAL REGISTRY</span>
                </nav>
                
                <h1 className="display-md mb-8">System Agents</h1>

                {/* Neural Heartbeat Widget (High Fidelity) */}
                <div className="bg-primary p-6 mb-10 overflow-hidden relative group">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', size: '20px 20px' }} />
                    
                    <div className="flex justify-between items-start relative z-10 mb-8">
                        <div>
                            <p className="label-sm text-on-primary/60 mb-1">SYSTEM_UPTIME</p>
                            <h2 className="display-md text-white text-[2rem]">99.98%</h2>
                        </div>
                        <div className="w-10 h-10 border border-white/20 flex items-center justify-center">
                             <span className="material-symbols-outlined text-white animate-pulse">monitor_heart</span>
                        </div>
                    </div>

                    <div className="flex gap-1 h-12 items-end relative z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                         {[40, 70, 45, 90, 65, 30, 80, 50, 60, 40, 75, 45, 85, 30].map((h, i) => (
                            <div 
                                key={i} 
                                className="flex-1 bg-white" 
                                style={{ height: `${h}%`, animation: `pulse 2s infinite ${i * 100}ms` }} 
                            />
                        ))}
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-surface-container-low p-5 ghost-border">
                        <div className="flex justify-between items-center mb-4">
                            <span className="material-symbols-outlined text-primary">terminal</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                        <span className="label-sm text-secondary block mb-1">Sidecar v0.10</span>
                        <span className="label-md text-primary uppercase font-black">Online</span>
                    </div>
                    <div className="bg-surface-container-low p-5 ghost-border">
                        <div className="flex justify-between items-center mb-4">
                            <span className="material-symbols-outlined text-primary">robot_2</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <span className="label-sm text-secondary block mb-1">OKA v23.0</span>
                        <span className="label-md text-primary uppercase font-black">Active</span>
                    </div>
                </div>

                {/* Execution logs (Manuscript Style) */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="label-sm text-secondary tracking-[0.3em]">SOVEREIGN_LOGS</h2>
                        <span className="label-sm text-[8px] bg-primary text-on-primary px-2 py-0.5">LIVE</span>
                    </div>
                    
                    <div className="bg-surface-container-low p-6 font-mono text-[10px] leading-relaxed space-y-3 ghost-border">
                        <div className="flex gap-3">
                            <span className="text-secondary">[20:04:12]</span>
                            <span className="text-primary font-bold">[BOOT]</span>
                            <span className="text-secondary opacity-60">NeuralRegistry synchronized with master manifold.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-secondary">[20:04:15]</span>
                            <span className="text-primary font-bold">[SYNC]</span>
                            <span className="text-secondary opacity-60">Vault parity check completed. 108 assets verified.</span>
                        </div>
                        <div className="flex gap-3 text-primary animate-pulse">
                            <span className="text-secondary">[20:05:01]</span>
                            <span className="font-bold">[OKA]</span>
                            <span>Listening for incoming PDF payloads...</span>
                        </div>
                        <div className="pt-4 border-t border-border/10">
                            <span className="text-primary font-black uppercase tracking-widest">{">"} READY_STAKEHOLDER_MODE_</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Spacing */}
            <div className="h-24 shrink-0" />
        </div>
    )
}
