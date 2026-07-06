import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { dispatchWalkthroughTrigger } from '@/components/layout/InteractiveTour'
import { AdvancedPracticeConfig } from '@/types/practice'
import { DEFAULT_CONFIG } from '@/hooks/usePracticeConfig'

interface PracticeResultsProps {
  session: any
  view: string
  setView: (v: string) => void
  elapsedSec: number
  setAdvancedConfig: React.Dispatch<React.SetStateAction<AdvancedPracticeConfig>>
}

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  true_false: 'True/False',
  writing: 'Writing',
  fill_in: 'Fill Blank',
  debug: 'Debug',
  trace: 'Trace',
  order: 'Order',
  matching: 'Matching',
  synthesis: 'Synthesis',
  calculation: 'Calculation',
  data_analysis: 'Data Analysis',
  scenario: 'Scenario',
  code: 'Code',
}

export function PracticeResults({
  session,
  view,
  setView,
  elapsedSec,
  setAdvancedConfig,
}: PracticeResultsProps) {
  if (view !== 'results') return null

  const calculateScore = () => {
    let correct = 0
    const total = session.questions.length
    session.questions.forEach((q: any) => {
      if (session.scores[q.id] === true) correct++
    })
    return { score: Math.round((correct / (total || 1)) * 100), correct, total }
  }

  const { score, correct, total } = calculateScore()
  const avgTime = total > 0 ? Math.round(elapsedSec / total) : 0

  // Per-type breakdown
  const typeMap: Record<string, { correct: number; total: number }> = {}
  session.questions.forEach((q: any) => {
    const t = q.type || 'other'
    if (!typeMap[t]) typeMap[t] = { correct: 0, total: 0 }
    typeMap[t].total++
    if (session.scores[q.id] === true) typeMap[t].correct++
  })

  const bookmarkedQuestions = session.questions.filter((_: any, i: number) => session.bookmarked.has(i))

  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col p-10">
        <div className="max-w-3xl mx-auto w-full space-y-8 overflow-y-auto pr-2 custom-scrollbar pb-24">
          {/* Score hero */}
          <div className="p-6 bg-bento-card border border-border/40 rounded-[12px] flex items-end justify-between hover:border-foreground/20 transition-all duration-300 shadow-sm">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 mb-1.5 font-sans">
                Session Complete
              </div>
              <h1 className="text-8xl font-black tracking-tighter leading-none text-foreground font-sans">
                {score}
                <span className="text-2xl text-muted-foreground/45 ml-1">%</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2 pb-2 text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {correct} / {total} correct
              </div>
              {avgTime > 0 && (
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45 font-mono mt-0.5">
                  {avgTime}s avg per question
                </div>
              )}
              {bookmarkedQuestions.length > 0 && (
                <div className="text-[9px] font-black uppercase tracking-widest text-[#aaccff] mt-0.5 select-none">
                  {bookmarkedQuestions.length} bookmarked
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-[#18181a] border border-border/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Type breakdown */}
          {Object.entries(typeMap).length > 0 && (
            <div className="space-y-3">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Breakdown by Type
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(typeMap).map(([t, s]) => {
                  const pct = Math.round((s.correct / s.total) * 100)
                  return (
                    <div key={t} className="p-4 bg-bento-card border border-border/40 rounded-[12px] space-y-2 hover:border-foreground/25 hover:bg-bento-item/5 transition-all shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/65">
                          {TYPE_LABELS[t] || t}
                        </span>
                        <span className="text-[10px] font-black tabular-nums text-foreground/80">{pct}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#18181a] border border-border/20 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <div className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-widest font-mono select-none">
                        {s.correct}/{s.total} correct
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bookmarked questions review */}
          {bookmarkedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Bookmarked for Review
              </div>
              <div className="space-y-2.5">
                {bookmarkedQuestions.map((q: any, i: number) => (
                  <div key={i} className="p-5 bg-bento-card border border-border/40 hover:border-foreground/25 hover:bg-bento-item/5 rounded-[12px] space-y-3 transition-all text-left shadow-sm">
                    <div className="flex items-center gap-2 select-none">
                      <Badge variant="outline" className="text-[8px] border-border/45 rounded-[4px] px-2 py-0.5 bg-bento-item font-mono text-foreground/80">
                        {q.difficulty || '?'}
                      </Badge>
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/45">
                        {TYPE_LABELS[q.type] || q.type}
                      </span>
                      {session.scores[q.id] === true && (
                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-[#aaccff]">
                          Correct
                        </span>
                      )}
                      {session.scores[q.id] === false && (
                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-destructive/80">
                          Wrong
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-foreground/80 leading-relaxed text-left select-text selection:bg-foreground/10">{q.question}</div>
                    {(q as any).answer && (
                      <div className="text-[9px] font-black text-muted-foreground/45 border-t border-border/40 pt-2.5 mt-1 text-left select-text selection:bg-foreground/10">
                        Answer: <span className="text-foreground/65 font-medium">{String((q as any).answer)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/40">
            <button
              onClick={() => {
                session.reset()
                setView('configuring')
              }}
              className="h-11 flex-1 bg-bento-item border border-foreground/20 text-foreground hover:bg-bento-item/80 text-[10px] font-black uppercase tracking-widest rounded-[6px] transition-all cursor-pointer flex items-center justify-center font-sans shadow-sm"
            >
              Practice Again
            </button>
            <button
              onClick={() => {
                const distribution = Object.fromEntries(
                  Object.entries(typeMap).map(([t, s]) => [t, Math.max(0, s.total - s.correct)])
                ) as any
                session.reset()
                setAdvancedConfig({ ...DEFAULT_CONFIG, questionDistribution: distribution })
                setView('configuring')
              }}
              className="h-11 flex-1 border border-border/40 bg-bento-card hover:bg-bento-item hover:border-foreground/20 text-foreground text-[10px] font-black uppercase tracking-widest rounded-[6px] transition-all cursor-pointer flex items-center justify-center font-sans shadow-sm"
            >
              Retry Wrong Only
            </button>
            <button
              data-tour="finish-session-btn"
              onClick={() => {
                dispatchWalkthroughTrigger('practice_session_completed')
                session.reset()
                setView('dashboard')
              }}
              className="h-11 px-8 border border-border/40 bg-bento-card hover:bg-bento-item hover:border-foreground/20 text-foreground text-[10px] font-black uppercase tracking-widest rounded-[6px] transition-all cursor-pointer flex items-center justify-center font-sans shadow-sm"
            >
              Finish Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
