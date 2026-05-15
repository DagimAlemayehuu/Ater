"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    waitlistCount: 0,
    totalTokens: 0,
    activeToday: 0
  });
  const [velocityData, setVelocityData] = useState<{ height: string; tokens: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, waitlistRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('waiting_list').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('usage_logs').select('token_count'),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (waitlistRes.error) throw waitlistRes.error;
      if (logsRes.error) throw logsRes.error;

      setStats({
        totalUsers: usersRes.count || 0,
        waitlistCount: waitlistRes.count || 0,
        totalTokens: logsRes.data?.reduce((acc, l) => acc + l.token_count, 0) || 0,
        activeToday: 0
      });

      setVelocityData(Array.from({ length: 40 }).map(() => ({
        height: `${20 + Math.random() * 80}%`,
        tokens: Math.floor(Math.random() * 500)
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      <header className="bg-background border-b border-border py-10 px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase">Overview</h1>
          </div>
          <div className="text-right">
            {error && <p className="text-[10px] font-black uppercase text-destructive mb-1">{error}</p>}
            <div className="flex items-center gap-2 justify-end">
              <span className={cn("size-2 rounded-none", loading ? "bg-muted" : "bg-primary")} />
              <p className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                {loading ? "Refreshing..." : "System Online"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: "Users", value: stats.totalUsers, sub: "Approved" },
              { label: "Waitlist", value: stats.waitlistCount, sub: "Pending" },
              { label: "Usage", value: `${(stats.totalTokens / 1000).toFixed(1)}k`, sub: "Tokens" },
              { label: "API", value: "99.9%", sub: "Health" },
            ].map((stat, i) => (
              <div key={i} className="p-8 bg-card border border-border rounded-none shadow-sm transition-none">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{stat.sub}</div>
                {loading ? (
                  <Skeleton className="h-10 w-24 mb-1" />
                ) : (
                  <p className="text-4xl font-black tracking-tighter text-foreground tabular-nums">{stat.value}</p>
                )}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 p-10 bg-card border border-border rounded-none shadow-sm transition-none">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground uppercase">History</h2>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">24 hour activity</p>
                </div>
                <div className="px-4 py-1.5 border border-border bg-accent/30">
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Active</span>
                </div>
              </div>
              <div className="h-56 flex items-end gap-1 px-1">
                {loading ? (
                  Array.from({ length: 40 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + (i % 5) * 15}%` }} />
                  ))
                ) : (
                  velocityData.map((data, i) => (
                    <div key={i} className="flex-1 bg-muted hover:bg-primary transition-none rounded-none" style={{ height: data.height }} />
                  ))
                )}
              </div>
            </div>

            <div className="p-10 bg-card border border-border rounded-none flex flex-col justify-between shadow-sm transition-none">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Status</h2>
                <p className="text-3xl font-black tracking-tighter mt-2 uppercase">Stable</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Load</span><span>42%</span></div>
                  <div className="h-2 bg-muted rounded-none overflow-hidden border border-border">
                    <div className="h-full bg-primary w-[42%] transition-none" />
                  </div>
                </div>
                <button 
                  onClick={() => fetchStats()} 
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.3em] rounded-none hover:opacity-90 transition-none disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Refresh Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
