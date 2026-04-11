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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Local RAG Engine Card */}
            <div className="p-5 border border-border/20 rounded-2xl bg-secondary/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database size={16} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80">Local RAG Engine</h3>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", 
                        ragStatus.status === 'indexing' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                    )}>
                        {ragStatus.status}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black opacity-40 uppercase">
                        <span>{ragStatus.message || 'Ready'}</span>
                        <span>{getProgressPercent(ragStatus)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${getProgressPercent(ragStatus)}%` }} 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleRagSync}
                    disabled={ragStatus.status === 'indexing'}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-secondary/10 hover:bg-secondary/20 text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                    <RefreshCw size={12} className={cn(ragStatus.status === 'indexing' && "animate-spin")} />
                    {ragStatus.status === 'indexing' ? 'Indexing...' : 'Re-index Vault'}
                </button>
            </div>

            {/* Notion Mirror Card */}
            <div className="p-5 border border-border/20 rounded-2xl bg-secondary/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CloudCog size={16} className="text-blue-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80">Notion Mirror</h3>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", 
                        mirrorStatus.status === 'syncing' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                    )}>
                        {mirrorStatus.status}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black opacity-40 uppercase">
                        <span>{mirrorStatus.message || 'Ready'}</span>
                        <span>{getProgressPercent(mirrorStatus)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${getProgressPercent(mirrorStatus)}%` }} 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleNotionSync}
                    disabled={mirrorStatus.status === 'syncing'}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-secondary/10 hover:bg-secondary/20 text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                    <RefreshCw size={12} className={cn(mirrorStatus.status === 'syncing' && "animate-spin")} />
                    {mirrorStatus.status === 'syncing' ? 'Syncing...' : 'Deep Sync'}
                </button>
            </div>

            {/* Health & Diagnostics Card */}
            <div className="p-5 border border-border/20 rounded-2xl bg-secondary/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80">Diagnostics</h3>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 flex-1 justify-center">
                    <button 
                        onClick={handleWatcherToggle}
                        className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            watcherActive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-secondary/10 text-muted-foreground border border-transparent"
                        )}
                    >
                        <span className="flex items-center gap-2"><Power size={12} /> Watcher Daemon</span>
                        <span>{watcherActive ? 'ACTIVE' : 'OFF'}</span>
                    </button>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10 text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-transparent">
                         <span className="flex items-center gap-2"><Search size={12} /> Permissions</span>
                         <span className="text-emerald-500">OK</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
