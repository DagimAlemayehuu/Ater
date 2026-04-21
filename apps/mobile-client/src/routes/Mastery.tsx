import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { ActivityCalendar } from 'react-activity-calendar'
import { Target, TrendingUp, Award, ChevronRight, PlayCircle } from 'lucide-react'

export default function Mastery() {
  const [analytics, setAnalytics] = useState<any>(null)
  
  // Dummy data for activity calendar visualization
  const calendarData = [
    { date: '2024-01-01', count: 2, level: 1 },
    { date: '2024-01-02', count: 4, level: 3 },
    { date: '2024-01-03', count: 1, level: 1 },
  ]

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <span className="label-sm">Analytics</span>
        <h1 className="display-md uppercase">Core<br/><span className="text-muted-foreground/30 text-3xl">Mastery</span></h1>
      </div>

      {/* Activity Heatmap */}
      <div className="p-6 bg-accent/10 border border-border/10 rounded-md space-y-6 flex flex-col items-center">
        <h3 className="label-sm self-start tracking-[0.3em]">Synapse Activity</h3>
        <div className="w-full flex justify-center py-4">
          <ActivityCalendar 
            data={calendarData} 
            theme={{ 
                light: ['#f5f5f5', '#e5e5e5', '#a3a3a3', '#404040', '#0a0a0a'], 
                dark: ['#171717', '#262626', '#404040', '#737373', '#ffffff'] 
            }} 
            fontSize={8} 
            blockSize={8} 
            blockMargin={2} 
          />
        </div>
        <div className="w-full flex justify-between border-t border-border/10 pt-4">
            <div className="text-center">
                <p className="text-xl font-black tabular-nums tracking-tighter">142</p>
                <p className="text-[8px] font-black uppercase text-muted-foreground/50">Total XP</p>
            </div>
            <div className="text-center">
                <p className="text-xl font-black tabular-nums tracking-tighter">88%</p>
                <p className="text-[8px] font-black uppercase text-muted-foreground/50">Precision</p>
            </div>
            <div className="text-center">
                <p className="text-xl font-black tabular-nums tracking-tighter">12</p>
                <p className="text-[8px] font-black uppercase text-muted-foreground/50">Day Streak</p>
            </div>
        </div>
      </div>

      {/* Recommended Sessions */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="label-sm">Ready for Review</h3>
            <span className="text-[8px] font-black text-primary uppercase underline">View All</span>
        </div>
        
        <div className="space-y-3">
            {[
                { title: 'Database Methodology', course: 'CS304', stability: '82%' },
                { title: 'Relational Algebra', course: 'CS304', stability: '45%' },
            ].map((topic, i) => (
                <button key={i} className="w-full p-5 bg-background border border-border/20 rounded-md flex items-center justify-between group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent/20 rounded-sm flex items-center justify-center">
                            <PlayCircle size={20} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-left space-y-0.5">
                            <p className="text-[11px] font-black uppercase">{topic.title}</p>
                            <p className="text-[8px] font-black text-muted-foreground/40">{topic.course} · STABILITY {topic.stability}</p>
                        </div>
                    </div>
                    <ChevronRight size={14} className="text-border/40" />
                </button>
            ))}
        </div>
      </div>

      <button className="w-full h-16 bg-foreground text-background rounded-md flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-foreground/5">
        <Target size={18} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] ml-2">Init New Session</span>
      </button>
    </div>
  )
}
