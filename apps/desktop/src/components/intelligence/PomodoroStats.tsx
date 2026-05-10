import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Zap, Target, BarChart2 } from 'lucide-react';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { cn } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function PomodoroStats() {
  const { history, setShowStats } = usePomodoroStore();
  const [timeFilter, setTimeFilter] = useState<'D' | 'W' | 'M' | 'Y'>('Y');

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const filters = {
      D: dayMs,
      W: dayMs * 7,
      M: dayMs * 30,
      Y: dayMs * 365
    };
    return (history || []).filter(s => (now - s.timestamp) <= filters[timeFilter]);
  }, [history, timeFilter]);

  const stats = useMemo(() => {
    const totalSessions = filteredHistory.length;
    const totalMinutes = Math.round(filteredHistory.reduce((acc, s) => acc + s.duration, 0));
    const avgSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    
    const hubs: Record<string, number> = {};
    filteredHistory.forEach(s => {
      hubs[s.hub] = (hubs[s.hub] || 0) + 1;
    });

    const categories = Object.entries(hubs)
      .map(([name, count]) => ({ 
        name, 
        count,
        percent: Math.round((count / (totalSessions || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topHub = categories[0]?.name || 'None';

    let barData: { name: string, value: number }[] = [];
    const now = new Date();

    if (timeFilter === 'D') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = d.getHours();
        barData.push({ 
          name: `${hour}h`, 
          value: filteredHistory.filter(s => new Date(s.timestamp).getHours() === hour && new Date(s.timestamp).getDate() === d.getDate()).length 
        });
      }
    } else if (timeFilter === 'W') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        barData.push({ name: days[d.getDay()], value: filteredHistory.filter(s => new Date(s.timestamp).getDate() === d.getDate()).length });
      }
    } else if (timeFilter === 'M') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        barData.push({ name: d.getDate().toString(), value: filteredHistory.filter(s => new Date(s.timestamp).getDate() === d.getDate()).length });
      }
    } else {
      const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      barData = months.map((m, i) => ({ name: m, value: filteredHistory.filter(s => new Date(s.timestamp).getMonth() === i).length }));
    }

    return { totalSessions, totalMinutes, avgSession, topHub, categories, barData };
  }, [filteredHistory, timeFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background border border-border shadow-[0_40px_120px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_120px_rgba(0,0,0,1)] rounded-2xl w-[1000px] h-[640px] overflow-hidden flex flex-col text-foreground"
    >
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-8 bg-muted/10">
        <div className="flex items-center gap-3">
           <BarChart2 size={18} className="text-muted-foreground/40" />
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border">
              {['D', 'W', 'M', 'Y'].map((f) => (
                <button 
                  key={f}
                  onClick={() => setTimeFilter(f as any)}
                  className={cn(
                    "px-4 h-7 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest",
                    timeFilter === f 
                      ? "bg-background text-foreground shadow-sm border border-border/50" 
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStats(false)} className="p-2 hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all">
              <X size={20} className="text-muted-foreground/40" />
            </button>
        </div>
      </div>

      <div className="flex-1 flex p-10 gap-10 overflow-hidden">
        {/* Left: Analytics */}
        <div className="flex-1 flex flex-col space-y-10 overflow-hidden">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-2">Total Focus Intensity</span>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-bold tracking-tighter tabular-nums text-foreground">{stats.totalSessions}</span>
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Completed Flows</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-5">
             {[
               { label: 'Time Focused', value: `${stats.totalMinutes}m`, icon: Clock },
               { label: 'Avg Session', value: `${stats.avgSession}m`, icon: Target },
               { label: 'Primary Hub', value: stats.topHub, icon: Zap }
             ].map((m, i) => (
               <div key={i} className="bg-muted/10 border border-border/60 rounded-2xl p-6 flex flex-col gap-2 group hover:bg-muted/20 transition-all">
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                   <m.icon size={12} /> {m.label}
                 </div>
                 <div className="text-2xl font-bold truncate text-foreground">{m.value}</div>
               </div>
             ))}
          </div>

          {/* Activity distribution area */}
          <div className="flex-1 bg-muted/5 border border-border/40 rounded-2xl p-10 relative overflow-hidden">
             <div className="absolute top-8 left-10 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">Activity Distribution</div>
             <div className="h-full w-full pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.barData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.05} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 9, fontWeight: 900 }}
                      dy={10}
                      interval={timeFilter === 'M' ? 4 : 0}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', opacity: 0.1, fontSize: 9, fontWeight: 900 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', fillOpacity: 0.02 }}
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        fontSize: '10px',
                        color: 'var(--foreground)'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="currentColor" 
                      fillOpacity={0.6}
                      radius={[2, 2, 0, 0]} 
                      barSize={timeFilter === 'M' ? 10 : 24}
                    />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Right: Hub Breakdown */}
        <div className="w-[320px] flex flex-col space-y-6 overflow-hidden">
           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Hub Distribution</div>
           <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {stats.categories.map((cat) => (
                <div key={cat.name} className="bg-muted/10 border border-border/60 rounded-2xl p-6 group hover:bg-muted/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate">{cat.name}</span>
                      <span className="text-3xl font-bold text-foreground">{cat.count}</span>
                    </div>
                    <div className="w-14 h-14 relative shrink-0">
                       <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: cat.percent }, { value: 100 - cat.percent }]}
                            innerRadius={20}
                            outerRadius={24}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="currentColor" fillOpacity={0.6} />
                            <Cell fill="currentColor" fillOpacity={0.05} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black opacity-30">{cat.percent}%</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-foreground/20"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
