"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  UserPlus, 
  Activity, 
  Zap, 
  BarChart3,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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

      if (usersRes.error) console.error("Profiles Error:", usersRes.error);
      if (waitlistRes.error) console.error("Waitlist Error:", waitlistRes.error);
      if (logsRes.error) console.error("Logs Error:", logsRes.error);

      if (usersRes.error || waitlistRes.error) {
        setError("Connectivity degraded. Some Oracle sectors are unreachable.");
      }

      setStats({
        totalUsers: usersRes.count || 0,
        waitlistCount: waitlistRes.count || 0,
        totalTokens: logsRes.data?.reduce((acc, l) => acc + l.token_count, 0) || 0,
        activeToday: 0
      });

      // Generate random chart data only on client
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

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/5 py-12 px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300 mb-3">Sovereign Control</p>
            <h1 className="text-7xl font-black tracking-tighter text-black leading-[0.8]">Oracle</h1>
          </div>
          <div className="text-right pb-1">
            {error && (
              <div className="flex items-center gap-2 text-red-400 mb-2 justify-end">
                <AlertCircle className="size-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-1">Infrastructure</p>
            <div className="flex items-center gap-2 justify-end">
              <span className={cn("size-2 rounded-full", error ? "bg-red-400" : "bg-black")} />
              <p className="text-[14px] font-bold tracking-tight">Active Node</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: "Sovereign Users", value: stats.totalUsers, icon: Users, sub: "Verified Base" },
              { label: "Waitlist", value: stats.waitlistCount, icon: UserPlus, sub: "Pending Approval" },
              { label: "Token Burn", value: `${(stats.totalTokens / 1000).toFixed(1)}k`, icon: Zap, sub: "Cumulative" },
              { label: "API Health", value: "99.9%", icon: Activity, sub: "Oracle Uptime" },
            ].map((stat, i) => (
              <div key={i} className="group p-8 bg-white border border-black/5 rounded-[2.5rem] hover:border-black/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="size-10 bg-gray-50 border border-black/5 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                    <stat.icon className="size-4 text-gray-300 group-hover:text-white" />
                  </div>
                  <ArrowUpRight className="size-3 text-gray-200" />
                </div>
                <p className="text-4xl font-black tracking-tighter text-black tabular-nums">{loading ? "---" : stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Large Monitoring Section */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 p-10 bg-white border border-black/5 rounded-[3rem] relative overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-black">Transmission Velocity</h2>
                  <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-1">Real-time token distribution</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-black/5">
                  <TrendingUp className="size-3.5 text-black" />
                  <span className="text-[11px] font-black text-black uppercase tracking-widest">Stable</span>
                </div>
              </div>
              
              <div className="h-56 flex items-end gap-1.5 px-2">
                {velocityData.map((data, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-black/5 rounded-xl hover:bg-black transition-all cursor-help"
                    style={{ height: data.height }}
                  />
                ))}
              </div>
              <div className="mt-8 flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-200">
                <span>T-24H</span>
                <span>Present</span>
              </div>
            </div>

            <div className="p-10 bg-black text-white rounded-[3rem] flex flex-col justify-between shadow-2xl shadow-black/20">
              <div>
                <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                  <Cpu className="size-6 text-white" />
                </div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] opacity-40">System Architecture</h2>
                <p className="text-4xl font-black tracking-tighter mt-2">Optimal</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                    <span>Concurrency</span>
                    <span>42%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[42%] transition-all" />
                  </div>
                </div>
                <button className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-all">
                  Access Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
