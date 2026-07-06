import React from 'react'
import { BookOpen, FlameKindling } from 'lucide-react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PracticeDashboardProps {
  view: string
  setView: (v: string) => void
  pastPractices: any[]
  analytics: { modalities: Record<string, number>; weakest_concepts: any[] }
  selectedHub: string
  handleReviewDueCards: () => void
}

export function PracticeDashboard({
  view,
  setView,
  pastPractices,
  analytics,
  handleReviewDueCards,
}: PracticeDashboardProps) {
  const getModalityScore = (types: string[]) => {
    let sum = 0
    let count = 0
    types.forEach(t => {
      if (analytics.modalities[t] !== undefined) {
        sum += analytics.modalities[t]
        count++
      }
    })
    return count > 0 ? Math.round((sum / count) * 100) : 0
  }

  const hasLogs = Object.keys(analytics.modalities).length > 0

  const safePractices = Array.isArray(pastPractices) ? pastPractices : []
  const validPractices = safePractices.filter(p => p?.completed && p?.score !== undefined)
  const totalPrecision = validPractices.length
    ? Math.round(validPractices.reduce((acc, p) => acc + parseInt(p.score || 0), 0) / validPractices.length)
    : 0
  const lastScores = validPractices.slice(-5).map(p => parseInt(p.score))
  let stability = 'New'
  if (lastScores.length >= 3) {
    const avg = lastScores.reduce((a, b) => a + b, 0) / lastScores.length
    const variance = lastScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lastScores.length
    stability = variance < 50 ? 'Stable' : 'Active'
  }

  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/45 mb-1.5">Practice</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-foreground font-sans">Practice Dashboard</h1>
              <p className="text-[9px] font-sans font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Spaced-repetition metrics and cognitive telemetry</p>
            </div>
            <div className="flex gap-2 shrink-0 items-center">
              <button
                data-tour="practice-due-btn"
                onClick={handleReviewDueCards}
                className="h-8 px-4 border border-foreground bg-foreground text-background hover:bg-foreground/85 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <FlameKindling size={11} />
                Review Due
              </button>
              <button
                data-tour="practice-custom-btn"
                onClick={() => setView('configuring')}
                className="h-8 px-4 border border-border bg-bento-card hover:bg-bento-item text-foreground hover:border-foreground/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                Custom Session
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div data-tour="practice-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-bento-card border border-border/40 rounded-[12px] flex flex-col gap-1.5 hover:border-foreground/25 hover:bg-bento-item/10 transition-all shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Average Score</span>
              <span className="text-3xl font-black tracking-tight text-foreground font-sans">{totalPrecision}%</span>
            </div>
            <div className="p-6 bg-bento-card border border-border/40 rounded-[12px] flex flex-col gap-1.5 hover:border-foreground/25 hover:bg-bento-item/10 transition-all shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Total Practices</span>
              <span className="text-3xl font-black tracking-tight text-foreground font-sans">{pastPractices.length}</span>
            </div>
            <div className="p-6 bg-bento-card border border-border/40 rounded-[12px] flex flex-col gap-1.5 hover:border-foreground/25 hover:bg-bento-item/10 transition-all shadow-sm">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Stability</span>
              <span className="text-3xl font-black tracking-tight uppercase text-foreground font-sans">{stability}</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Chart */}
              <div className="p-6 bg-bento-card border border-border/40 rounded-[12px] space-y-6 hover:border-foreground/25 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground font-sans">Trend Timeline</h3>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={validPractices.slice(-10).map((p, i) => ({ name: i + 1, score: parseInt(p.score) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,22,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '10px', color: '#fff' }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 2, fill: 'hsl(var(--background))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cognitive Modalities */}
              <div className="p-6 bg-bento-card border border-border/40 rounded-[12px] space-y-6 hover:border-foreground/25 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground font-sans flex items-center gap-2">
                    <span>Cognitive Modalities</span>
                    {!hasLogs && (
                      <span className="text-[8px] font-medium tracking-normal text-muted-foreground/30 normal-case">
                        (No practice logs yet. Start practicing to generate telemetry)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { type: 'Choice (MCQ/TF)', p: getModalityScore(['mcq', 'true_false']) },
                    { type: 'Synthesis & Analysis', p: getModalityScore(['synthesis', 'scenario']) },
                    { type: 'Logic & State Trace', p: getModalityScore(['trace']) },
                    { type: 'Sequence & Order', p: getModalityScore(['order']) },
                    { type: 'Debug & Extraction', p: getModalityScore(['debug']) },
                    { type: 'Relational Matching', p: getModalityScore(['matching']) },
                    { type: 'Technical Fill-in', p: getModalityScore(['fill_in']) },
                    { type: 'Edge Case Mastery', p: getModalityScore(['calculation', 'data_analysis']) },
                    { type: 'Industrial Application', p: getModalityScore(['code']) },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                        <span className="text-muted-foreground/60 truncate pr-1">{stat.type}</span>
                        <span className="text-foreground/90 shrink-0">{stat.p}%</span>
                      </div>
                      <div className="h-1 bg-[#18181a] border border-border/20 rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${stat.p}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
