"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type WaitlistEntry = {
  id: string;
  email: string;
  full_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalApproved: 0,
    waitlistPending: 0,
    totalTokens: 0,
    totalRejected: 0,
  });
  const [recentEntries, setRecentEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function fetchStats() {
    setError(null);
    try {
      const [approvedRes, pendingRes, rejectedRes, logsRes, recentRes] = await Promise.all([
        supabase.from("waiting_list").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("waiting_list").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("waiting_list").select("id", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("usage_logs").select("token_count"),
        supabase
          .from("waiting_list")
          .select("id, email, full_name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (approvedRes.error) throw approvedRes.error;
      if (pendingRes.error) throw pendingRes.error;
      if (rejectedRes.error) throw rejectedRes.error;
      if (logsRes.error) throw logsRes.error;
      if (recentRes.error) throw recentRes.error;

      setStats({
        totalApproved: approvedRes.count || 0,
        waitlistPending: pendingRes.count || 0,
        totalRejected: rejectedRes.count || 0,
        totalTokens: logsRes.data?.reduce((acc, l) => acc + (l.token_count || 0), 0) || 0,
      });

      if (recentRes.data) setRecentEntries(recentRes.data);
      setLastRefreshed(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime changes for waiting_list
    const channel = supabase
      .channel("admin-dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waiting_list" },
        () => {
          // Re-fetch stats when waitlist changes
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "usage_logs" },
        () => {
          // Re-fetch stats when new usage logs are added (token count)
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: "Approved", value: stats.totalApproved, sub: "Active users" },
    { label: "Pending", value: stats.waitlistPending, sub: "Awaiting review" },
    { label: "Rejected", value: stats.totalRejected, sub: "Access denied" },
    { label: "Tokens Used", value: stats.totalTokens > 0 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : "0", sub: "Total usage" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans overflow-auto custom-scrollbar">
      <header className="bg-background border-b border-border py-6 sm:py-8 px-4 sm:px-10 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase">
              Overview
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {error && (
              <p className="text-[10px] font-black uppercase text-destructive">{error}</p>
            )}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card hover:bg-accent text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <div key={i} className="p-6 bg-card border border-border">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {stat.sub}
                </div>
                {loading ? (
                  <Skeleton className="h-9 w-20 mb-1" />
                ) : (
                  <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
                    {stat.value}
                  </p>
                )}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Applicants */}
          <div className="bg-card border border-border">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground">
                  Recent Applicants
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                  Last 5 entries
                </p>
              </div>
              {lastRefreshed && (
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                    User
                  </th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-8 py-5">
                          <Skeleton className="h-4 w-48" />
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Skeleton className="h-5 w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  : recentEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-accent/20">
                        <td className="px-8 py-5">
                          <div className="font-bold text-foreground text-[13px]">
                            {entry.full_name || "—"}
                          </div>
                          <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {entry.email}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span
                            className={cn(
                              "px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                              entry.status === "approved"
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : entry.status === "rejected"
                                ? "bg-destructive/10 border-destructive/20 text-destructive"
                                : "bg-muted/30 border-border text-muted-foreground"
                            )}
                          >
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            </div>

            {!loading && recentEntries.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  No applicants yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
