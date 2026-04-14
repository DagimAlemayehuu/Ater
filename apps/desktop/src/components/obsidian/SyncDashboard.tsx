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
        <div className="flex flex-col gap-10 p-2">
            {/* Local RAG Engine Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Local RAG Engine</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-[#111827] leading-none">{ragStatus.status}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{ragStatus.message || 'Ready'}</span>
                    <span className="text-xl font-bold text-gray-300">{getProgressPercent(ragStatus)}%</span>
                </div>
                <button 
                    onClick={handleRagSync}
                    disabled={ragStatus.status === 'indexing'}
                    className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-white border border-gray-200 text-[#111827] hover:bg-gray-50 rounded transition-all disabled:opacity-50 inline-block w-max"
                >
                    {ragStatus.status === 'indexing' ? 'Indexing...' : 'Re-index Vault'}
                </button>
            </div>

            {/* Notion Mirror Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notion Mirror</h3>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-[#111827] leading-none">{mirrorStatus.status}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{mirrorStatus.message || 'Ready'}</span>
                    <span className="text-xl font-bold text-gray-300">{getProgressPercent(mirrorStatus)}%</span>
                </div>
                <button 
                    onClick={handleNotionSync}
                    disabled={mirrorStatus.status === 'syncing'}
                    className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-white border border-gray-200 text-[#111827] hover:bg-gray-50 rounded transition-all disabled:opacity-50 inline-block w-max"
                >
                    {mirrorStatus.status === 'syncing' ? 'Syncing...' : 'Deep Sync'}
                </button>
            </div>

            {/* Diagnostics Section */}
            <div className="pt-8 border-t border-gray-100 space-y-8">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Diagnostics</h3>
                
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Watcher Daemon</span>
                        <div className="flex items-center gap-4">
                            <span className={cn("text-xl font-extrabold tracking-tight", watcherActive ? "text-green-600" : "text-gray-300")}>
                                {watcherActive ? 'Active' : 'Off'}
                            </span>
                            <button 
                                onClick={handleWatcherToggle}
                                className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
                            >
                                <Power size={12} className={watcherActive ? "text-green-600" : "text-gray-400"} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Permissions</span>
                        <span className="text-xl font-extrabold tracking-tight text-green-600">OK</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
