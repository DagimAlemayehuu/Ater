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
        } catch (e) { console.error(e); }
    };

    const handleNotionSync = async () => {
        try {
            setMirrorStatus({ status: 'syncing', progress: 0, total: 0, message: 'Starting...' });
            await sidecarApi.syncNotionMirror();
        } catch (e) { console.error(e); }
    };

    const handleWatcherToggle = async () => {
        try {
            const res = await sidecarApi.ragWatcherToggle();
            setWatcherActive(res.status === 'started');
        } catch (e) { console.error(e); }
    };

    const getProgressPercent = (status: any) => {
        if (status.total === 0) return 0;
        return Math.round((status.progress / status.total) * 100);
    };

    return (
        <div className="flex flex-col gap-10 p-2 bg-background text-foreground">
            {/* Local RAG Engine Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Local RAG Engine</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-extrabold tracking-tighter text-foreground leading-none">{ragStatus.status}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{ragStatus.message || 'Ready'}</span>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${getProgressPercent(ragStatus)}%` }} />
                        </div>
                        <span className="text-sm font-black text-muted-foreground tabular-nums">{getProgressPercent(ragStatus)}%</span>
                    </div>
                </div>
                <button 
                    onClick={handleRagSync}
                    disabled={ragStatus.status === 'indexing'}
                    className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-background border border-border text-foreground hover:bg-muted rounded-md transition-all disabled:opacity-50 inline-block w-max shadow-sm"
                >
                    {ragStatus.status === 'indexing' ? 'Indexing...' : 'Re-index Vault'}
                </button>
            </div>

            {/* Notion Mirror Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Notion Mirror</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-extrabold tracking-tighter text-foreground leading-none">{mirrorStatus.status}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{mirrorStatus.message || 'Ready'}</span>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${getProgressPercent(mirrorStatus)}%` }} />
                        </div>
                        <span className="text-sm font-black text-muted-foreground tabular-nums">{getProgressPercent(mirrorStatus)}%</span>
                    </div>
                </div>
                <button 
                    onClick={handleNotionSync}
                    disabled={mirrorStatus.status === 'syncing'}
                    className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-background border border-border text-foreground hover:bg-muted rounded-md transition-all disabled:opacity-50 inline-block w-max shadow-sm"
                >
                    {mirrorStatus.status === 'syncing' ? 'Syncing...' : 'Deep Sync'}
                </button>
            </div>

            {/* Diagnostics Section */}
            <div className="pt-8 border-t border-border space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Diagnostics</h3>
                
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Watcher Daemon</span>
                        <div className="flex items-center gap-4">
                            <span className={cn("text-xl font-extrabold tracking-tight", watcherActive ? "text-emerald-500" : "text-muted-foreground/30")}>
                                {watcherActive ? 'Active' : 'Offline'}
                            </span>
                            <button 
                                onClick={handleWatcherToggle}
                                className="p-1.5 rounded-lg bg-muted hover:bg-accent border border-border transition-all group"
                            >
                                <Power size={12} className={watcherActive ? "text-emerald-500" : "text-muted-foreground/50 group-hover:text-foreground"} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Security Permissions</span>
                        <span className="text-xl font-extrabold tracking-tight text-emerald-500">Authorized</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
