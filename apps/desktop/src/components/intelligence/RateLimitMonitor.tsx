import React, { useState, useEffect } from 'react';
import { Activity, Zap, Clock, BarChart3 } from 'lucide-react';
import { sidecarApi } from '@/lib/sidecarApi';
import { cn } from '@/lib/utils';
import { AppConfig } from '@/lib/ConfigContext';

interface RateLimit {
    provider: string;
    model: string;
    requests_remaining: number | null;
    requests_limit: number | null;
    tokens_remaining: number | null;
    tokens_limit: number | null;
    retry_after: number | null;
    request_count: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    last_updated: string;
}

interface RateLimitMonitorProps {
    config?: AppConfig;
    activeTier?: 'primary' | 'planner' | 'utility';
}

export function RateLimitMonitor({ config, activeTier = 'primary' }: RateLimitMonitorProps) {
    const [limits, setLimits] = useState<Record<string, RateLimit>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchLimits = async () => {
        try {
            const data = await sidecarApi.getAiRateLimits();
            setLimits(data);
        } catch (err) {
            console.error('Failed to fetch rate limits:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLimits();
        // Slowed down polling to 10 seconds for performance and reduced noise
        const interval = setInterval(fetchLimits, 10000);
        return () => clearInterval(interval);
    }, []);

    const entries = Object.entries(limits);

    const getActiveKey = () => {
        if (!config) return null;
        let p = config.aiProvider;
        let m = config.aiModel;
        if (activeTier === 'planner') {
            p = config.plannerProvider || p;
            m = config.plannerModel || m;
        } else if (activeTier === 'utility') {
            p = config.utilityProvider || p;
            m = config.utilityModel || m;
        }
        return `${p}:${m}`;
    };

    const activeKey = getActiveKey();

    if (isLoading && entries.length === 0) {
        return (
            <div className="p-4 flex flex-col items-center justify-center border border-dashed border-border bg-muted/5 gap-2">
                <div className="h-4 w-4 rounded-none border-2 border-primary border-t-transparent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Connecting Tracker...</span>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-border bg-muted/5">
                <Activity size={20} className="text-muted-foreground/20" />
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">No usage data detected yet</p>
                    <p className="text-[10px] text-muted-foreground/40 leading-relaxed max-w-[200px] mx-auto">
                        Usage metrics will appear here automatically after your first API call or connection test.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    Usage Health
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-medium text-muted-foreground bg-muted px-2 py-0.5 uppercase tracking-tighter">Real-time</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {entries.map(([key, limit]) => {
                    const isActive = key === activeKey;
                    const reqPercent = limit.requests_limit ? (limit.requests_remaining! / limit.requests_limit) * 100 : null;
                    const tokenPercent = limit.tokens_limit ? (limit.tokens_remaining! / limit.tokens_limit) * 100 : null;
                    
                    const isLow = (reqPercent !== null && reqPercent < 20) || (tokenPercent !== null && tokenPercent < 20);
                    const isCritical = limit.retry_after !== null || (reqPercent !== null && reqPercent < 5);

                    return (
                        <div key={key} className={cn(
                            "group p-4 border relative overflow-hidden",
                            isActive ? "border-primary/40 bg-primary/[0.02]" : "border-border bg-background hover:border-muted-foreground/20",
                            isCritical ? "border-destructive/30 bg-destructive/[0.02]" : 
                            isLow ? "border-amber-500/30 bg-amber-500/[0.02]" : ""
                        )}>
                            {isActive && (
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest rounded-none">
                                    Current
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-[11px] font-bold uppercase tracking-wider", isActive ? "text-primary" : "text-foreground")}>{limit.provider}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium opacity-60">/ {limit.model}</span>
                                    </div>
                                    <div className="text-[9px] text-muted-foreground/40 tabular-nums">Sync: {new Date(limit.last_updated).toLocaleTimeString()}</div>
                                </div>
                                
                                {limit.retry_after ? (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive text-destructive-foreground">
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Throttled: {limit.retry_after}s</span>
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 border",
                                        isCritical ? "bg-destructive/10 text-destructive border-destructive/20" :
                                        isLow ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                        "bg-green-500/10 text-green-500 border-green-500/20"
                                    )}>
                                        <span className="text-[9px] font-black uppercase tracking-tighter">
                                            {isCritical ? 'Critical' : isLow ? 'Low' : 'Healthy'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Side: Remaining Bars (If available) */}
                                <div className="space-y-4">
                                    {limit.requests_limit ? (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                                                <span className="text-muted-foreground/60">Requests Left</span>
                                                <span className="text-foreground tabular-nums">{limit.requests_remaining} / {limit.requests_limit}</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full",
                                                        isCritical ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-primary"
                                                    )}
                                                    style={{ width: `${Math.max(2, reqPercent || 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 opacity-60">
                                            <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">Requests</div>
                                            <div className="text-[12px] font-black tabular-nums">{limit.request_count} <span className="text-[9px] font-bold opacity-40">TOTAL</span></div>
                                        </div>
                                    )}

                                    {limit.tokens_limit ? (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                                                <span className="text-muted-foreground/60">Tokens Left</span>
                                                <span className="text-foreground tabular-nums">{(limit.tokens_remaining!/1000).toFixed(1)}k</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full",
                                                        isCritical ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-primary"
                                                    )}
                                                    style={{ width: `${Math.max(2, tokenPercent || 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 opacity-60">
                                            <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">Tokens</div>
                                            <div className="text-[12px] font-black tabular-nums">{(limit.total_tokens/1000).toFixed(1)}k <span className="text-[9px] font-bold opacity-40">TOTAL</span></div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Usage Details */}
                                <div className="border-l border-border/50 pl-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Input</span>
                                        <span className="text-[11px] font-mono font-medium tabular-nums opacity-80">{(limit.prompt_tokens/1000).toFixed(1)}k</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Output</span>
                                        <span className="text-[11px] font-mono font-medium tabular-nums opacity-80">{(limit.completion_tokens/1000).toFixed(1)}k</span>
                                    </div>
                                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest flex items-center gap-1">
                                            Session
                                        </span>
                                        <span className="text-[11px] font-black tabular-nums text-primary">{(limit.total_tokens/1000).toFixed(1)}k</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
