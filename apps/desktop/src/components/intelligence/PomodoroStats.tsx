import React, { useMemo, useState } from 'react';
import { X, Clock, Zap, Target, BarChart2 } from 'lucide-react';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { cn } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function PomodoroStats() {
  const { history, setShowStats } = usePomodoroStore();
  const [activeTab, setActiveTab] = useState<'OVERALL' | 'NOTES' | 'PRACTICE'>('OVERALL');
  const [timeFilter, setTimeFilter] = useState<'D' | 'W' | 'M' | 'Y'>('Y');

  const [referenceNow] = useState(() => Date.now());
  const filteredHistory = useMemo(() => {
    const now = referenceNow;
    const dayMs = 24 * 60 * 60 * 1000;
    const filters = { D: dayMs, W: dayMs * 7, M: dayMs * 30, Y: dayMs * 365 };
    return (history || []).filter(s => (now - s.timestamp) <= filters[timeFilter]);
  }, [history, timeFilter, referenceNow]);

  const stats = useMemo(() => {
    // Basic metrics
    const sessions = filteredHistory.filter(h => h.type === 'session');
    const notes = filteredHistory.filter(h => h.type === 'note_focus');
    const practices = filteredHistory.filter(h => h.type === 'practice');

    const totalSessions = sessions.length;
    const totalMinutes = Math.round(filteredHistory.reduce((acc, s) => acc + (s.duration || 0), 0));
    
    // Hub Distribution
    const hubs: Record<string, number> = {};
    sessions.forEach(s => { hubs[s.hub || 'Unknown'] = (hubs[s.hub || 'Unknown'] || 0) + 1; });
    const categories = Object.entries(hubs)
      .map(([name, count]) => ({ 
        name, count, percent: Math.round((count / (totalSessions || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    // Note focus breakdown
    const noteTime: Record<string, number> = {};
    notes.forEach(n => {
      const name = n.notePath?.split('/').pop()?.replace('.md', '') || 'Unknown';
      noteTime[name] = (noteTime[name] || 0) + (n.duration || 0);
    });
    const noteData = Object.entries(noteTime)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value).slice(0, 10);

    // Practice scores
    const practiceData = practices.map(p => ({
      name: p.notePath?.split('/').pop()?.replace('.md', '') || 'Quiz',
      score: p.score && p.totalQuestions ? (p.score / p.totalQuestions) * 100 : 0,
      date: new Date(p.timestamp).toLocaleDateString()
    })).slice(-20);

    // Activity distribution chart data
    let barData: { name: string, value: number }[] = [];
    const now = new Date(referenceNow);
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

    return { totalSessions, totalMinutes, categories, barData, noteData, practiceData, sessions, notes, practices };
  }, [filteredHistory, timeFilter, referenceNow]);

  return (
    <div className="bg-background border border-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-none w-[1000px] h-[640px] overflow-hidden flex flex-col text-foreground">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-8 bg-muted/10 shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <BarChart2 size={18} className="text-muted-foreground/40" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Analytics Engine</span>
           </div>
           
           <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-md border border-border">
             {(['OVERALL', 'NOTES', 'PRACTICE'] as const).map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={cn(
                   "px-4 h-7 text-[9px] font-black uppercase tracking-widest rounded-md",
                   activeTab === tab 
                     ? "bg-background text-foreground shadow-sm border border-border/50" 
                     : "text-muted-foreground/40 hover:text-foreground"
                 )}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center bg-muted/30 p-1 rounded-none border border-border">
              {['D', 'W', 'M', 'Y'].map((f) => (
                <button 
                  key={f}
                  onClick={() => setTimeFilter(f as any)}
                  className={cn(
                    "px-4 h-7 text-[10px] font-bold rounded-md transition-none uppercase tracking-widest",
                    timeFilter === f 
                      ? "bg-background text-foreground shadow-sm border border-border/50" 
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStats(false)} className="p-2 hover:bg-muted rounded-md border border-transparent hover:border-border transition-none">
              <X size={20} className="text-muted-foreground/40" />
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'OVERALL' && (
          <div className="flex-1 flex p-10 gap-10">
            <div className="flex-1 flex flex-col space-y-10 overflow-hidden">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-2">Focus Volume</span>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-bold tracking-tighter tabular-nums text-foreground">{stats.totalSessions}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Sessions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="bg-muted/10 border border-border/60 rounded-none p-6 flex flex-col gap-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total Focused Time</div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalMinutes}m</div>
                </div>
                <div className="bg-muted/10 border border-border/60 rounded-none p-6 flex flex-col gap-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Active Hubs</div>
                  <div className="text-2xl font-bold text-foreground">{stats.categories.length}</div>
                </div>
              </div>

              <div className="flex-1 bg-muted/5 border border-border/40 rounded-none p-10 relative overflow-hidden">
                <div className="absolute top-8 left-10 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">Temporal Intensity</div>
                <div className="h-full w-full pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.barData}>
                      <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.05} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 9, fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.1, fontSize: 9, fontWeight: 900 }} />
                      <Tooltip cursor={{ fill: 'currentColor', fillOpacity: 0.02 }} contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0', fontSize: '10px' }} />
                      <Bar dataKey="value" fill="currentColor" fillOpacity={0.6} radius={[0, 0, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="w-[320px] flex flex-col space-y-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Hub Weight</div>
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {stats.categories.map((cat) => (
                  <div key={cat.name} className="bg-muted/10 border border-border/60 rounded-none p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate">{cat.name}</span>
                      <span className="text-xl font-bold text-foreground">{cat.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-none overflow-hidden">
                      <div className="h-full bg-foreground/20" style={{ width: `${cat.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'NOTES' && (
          <div className="flex-1 flex flex-col p-10 gap-8 overflow-hidden">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-2">Epistemic Effort</span>
              <div className="flex items-baseline gap-4">
                <span className="text-7xl font-bold tracking-tighter tabular-nums text-foreground">{stats.notes.length}</span>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Notes Deep-dived</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-10 overflow-hidden">
               <div className="bg-muted/5 border border-border/40 rounded-none p-10 flex flex-col">
                 <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 mb-8">Focus Time per Note (Min)</div>
                 <div className="flex-1">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={stats.noteData} layout="vertical" margin={{ left: 40 }}>
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 8, fontWeight: 900 }} width={100} />
                       <Bar dataKey="value" fill="currentColor" fillOpacity={0.6} radius={[0, 0, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div className="flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-2">
                 <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">Recent Note Sessions</div>
                 {stats.notes.slice(-10).reverse().map((n, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-muted/10 border border-border/60 rounded-none">
                     <span className="text-[10px] font-black uppercase truncate pr-4">{n.notePath?.split('/').pop()?.replace('.md', '')}</span>
                     <span className="text-[10px] font-bold tabular-nums opacity-60">{Math.round(n.duration || 0)}m</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'PRACTICE' && (
          <div className="flex-1 flex flex-col p-10 gap-8 overflow-hidden">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mb-2">Recall Mastery</span>
              <div className="flex items-baseline gap-4">
                <span className="text-7xl font-bold tracking-tighter tabular-nums text-foreground">
                  {Math.round(stats.practices.reduce((acc, p) => acc + ((p.score ?? 0) / (p.totalQuestions ?? 1)), 0) / (stats.practices.length || 1) * 100)}%
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Average Performance</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-10 overflow-hidden">
               <div className="bg-muted/5 border border-border/40 rounded-none p-10 flex flex-col">
                 <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 mb-8">Performance Trend</div>
                 <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.practiceData}>
                        <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.05} />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Bar dataKey="score" fill="currentColor" fillOpacity={0.6} radius={[0, 0, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               <div className="flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-2">
                 <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">Practice History</div>
                 {stats.practices.slice(-10).reverse().map((p, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-muted/10 border border-border/60 rounded-none">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase truncate">{p.notePath?.split('/').pop()?.replace('.md', '') || p.hub}</span>
                       <span className="text-[8px] font-bold opacity-30">{new Date(p.timestamp).toLocaleDateString()}</span>
                     </div>
                     <span className={cn(
                       "text-[10px] font-black",
                       (p.score || 0) / (p.totalQuestions || 1) >= 0.8 ? "text-foreground" : 
                       (p.score || 0) / (p.totalQuestions || 1) >= 0.5 ? "text-foreground/60" : "text-foreground/30"
                     )}>
                       {p.score}/{p.totalQuestions}
                     </span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
