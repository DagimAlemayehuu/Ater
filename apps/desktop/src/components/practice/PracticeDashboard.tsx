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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex bg-bento-card p-1 rounded-[8px] border border-border w-auto">
              <button
                onClick={() => setView('dashboard')}
                className={cn(
                  'flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] ',
                  view === 'dashboard'
                    ? 'bg-bento-item text-foreground border border-border'
                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-bento-item/50'
                )}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('history')}
                className={cn(
                  'flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] ',
                  view === 'history'
                    ? 'bg-bento-item text-foreground border border-border'
                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-bento-item/50'
                )}
              >
                History
              </button>
              <button
                onClick={() => setView('vault')}
                className={cn(
                  'flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] flex items-center gap-1',
                  view === 'vault'
                    ? 'bg-bento-item text-foreground border border-border'
                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-bento-item/50'
                )}
              >
                <BookOpen size={10} />
                Reference Vault
              </button>
            </div>
            <div className="flex gap-2 w-auto">
              <Button
                data-tour="practice-due-btn"
                onClick={handleReviewDueCards}
                className="h-9 flex-none px-6 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-[8px] font-black uppercase tracking-widest text-[9px] transition-none"
              >
                <FlameKindling size={10} className="mr-1" />
                Review Due
              </Button>
              <Button
                data-tour="practice-custom-btn"
                onClick={() => setView('configuring')}
                className="h-9 flex-none px-6 bg-bento-card border border-border hover:border-foreground/50 text-foreground rounded-[8px] font-black uppercase tracking-widest text-[9px] transition-none"
              >
                Custom
              </Button>
            </div>
          </div>

          <div data-tour="practice-stats-grid" className="grid grid-cols-3 gap-4">
            <div className="p-6 bg-bento-card border border-border rounded-[12px] flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Average Score</span>
              <span className="text-2xl font-black tracking-tight">{totalPrecision}%</span>
            </div>
            <div className="p-6 bg-bento-card border border-border rounded-[12px] flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Total Practices</span>
              <span className="text-2xl font-black tracking-tight">{pastPractices.length}</span>
            </div>
            <div className="p-6 bg-bento-card border border-border rounded-[12px] flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Stability</span>
              <span className="text-2xl font-black tracking-tight uppercase text-foreground">{stability}</span>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 bg-bento-card border border-border rounded-[12px] space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Trend</h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={validPractices.slice(-10).map((p, i) => ({ name: i + 1, score: parseInt(p.score) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.1)" />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 2, fill: 'hsl(var(--background))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8 bg-bento-card border border-border rounded-[12px] space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2">
                  <span>Cognitive Modalities</span>
                  {!hasLogs && (
                    <span className="text-[8px] font-medium tracking-normal text-muted-foreground/30 normal-case">
                      (No practice logs yet. Start practicing to generate telemetry)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-3 gap-x-12 gap-y-8">
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
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em]">
                        <span className="text-muted-foreground/40">{stat.type}</span>
                        <span className="text-foreground/90">{stat.p}%</span>
                      </div>
                      <div className="h-1.5 bg-bento-item rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60" style={{ width: `${stat.p}%` }}></div>
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
