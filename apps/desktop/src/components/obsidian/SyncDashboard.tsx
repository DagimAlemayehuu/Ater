import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CloudCog, ShieldCheck, Power, Search, Zap } from 'lucide-react';
import { sidecarApi } from '@/lib/sidecarApi';
import { cn } from '@/lib/utils';

export function SyncDashboard() {
    const [ragStatus, setRagStatus] = useState({ status: 'idle', progress: 0, total: 0, message: '' });
    const [mirrorStatus, setMirrorStatus] = useState({ status: 'idle', progress: 0, total: 0, message: '' });
    const [watcherActive, setWatcherActive] = useState(false);
    
    const fetchStatuses = async () => {
        try {
            const [rag, mirror] = await Promise.all([
                sidecarApi.ragSyncStatus().catch(() => ({ status: 'error', progress: 0, total: 0, message: 'Failed to fetch' })),
                sidecarApi.syncNotionMirrorStatus().catch(() => ({ status: 'error', progress: 0, total: 0, message: 'Failed to fetch' }))
            ]);
            setRagStatus(rag);
            setMirrorStatus(mirror);
            
            // Assume watcher is active if RAG is ready/indexing. (Simplification as we don't have a dedicated status endpoint for watcher other than toggle)
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRagSync = async () => {
        try {
            setRagStatus({ status: 'indexing', progress: 0, total: 0, message: 'Starting...' });
            await sidecarApi.ragSyncVault();
        } catch (e) {
            console.error(e);
        }
    };

    const handleNotionSync = async () => {
        try {
            setMirrorStatus({ status: 'syncing', progress: 0, total: 0, message: 'Starting...' });
            await sidecarApi.syncNotionMirror();
        } catch (e) {
            console.error(e);
        }
    };

    const handleWatcherToggle = async () => {
        try {
            const res = await sidecarApi.ragWatcherToggle();
            setWatcherActive(res.status === 'started');
        } catch (e) {
            console.error(e);
        }
    };

    const getProgressPercent = (status: any) => {
        if (status.total === 0) return 0;
        return Math.round((status.progress / status.total) * 100);
    };

    return (
        <div className="flex flex-col gap-12 p-2">
            {/* Local RAG Engine Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Local RAG Engine</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black uppercase leading-none">{ragStatus.status}</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{ragStatus.message || 'Ready'}</span>
                    <span className="text-xl font-black opacity-10">{getProgressPercent(ragStatus)}%</span>
                </div>
                <button 
                    onClick={handleRagSync}
                    disabled={ragStatus.status === 'indexing'}
                    className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-all disabled:opacity-30"
                >
                    {ragStatus.status === 'indexing' ? 'Indexing...' : 'Re-index Vault'}
                </button>
            </div>

            {/* Notion Mirror Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Notion Mirror</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black uppercase leading-none">{mirrorStatus.status}</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{mirrorStatus.message || 'Ready'}</span>
                    <span className="text-xl font-black opacity-10">{getProgressPercent(mirrorStatus)}%</span>
                </div>
                <button 
                    onClick={handleNotionSync}
                    disabled={mirrorStatus.status === 'syncing'}
                    className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-all disabled:opacity-30"
                >
                    {mirrorStatus.status === 'syncing' ? 'Syncing...' : 'Deep Sync'}
                </button>
            </div>

            {/* Diagnostics Section */}
            <div className="pt-8 border-t border-border/10 space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Diagnostics</h3>
                
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Watcher Daemon</span>
                        <div className="flex items-center gap-4">
                            <span className={cn("text-xl font-black uppercase", watcherActive ? "text-emerald-500" : "text-foreground/20")}>
                                {watcherActive ? 'Active' : 'Off'}
                            </span>
                            <button 
                                onClick={handleWatcherToggle}
                                className="p-1.5 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-all"
                            >
                                <Power size={12} className={watcherActive ? "text-emerald-500" : "text-muted-foreground/40"} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Permissions</span>
                        <span className="text-xl font-black uppercase text-emerald-500">OK</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
