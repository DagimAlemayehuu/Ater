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
        <div className="max-w-3xl mx-auto w-full space-y-8 overflow-y-auto pr-2 custom-scrollbar">
          {/* Score hero */}
          <div className="flex items-end justify-between border-b border-border pb-6">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">
                Session Complete
              </div>
              <h1 className="text-9xl font-black tracking-tighter leading-none text-foreground">
                {score}
                <span className="text-3xl text-muted-foreground/30">%</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2 pb-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                {correct} / {total} correct
              </div>
              {avgTime > 0 && (
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">
                  {avgTime}s avg per question
                </div>
              )}
              {bookmarkedQuestions.length > 0 && (
                <div className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                  {bookmarkedQuestions.length} bookmarked
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full bg-bento-card rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-[#e4e4e7] rounded-none transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Type breakdown */}
          {Object.entries(typeMap).length > 0 && (
            <div className="space-y-3">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                Breakdown by Type
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeMap).map(([t, s]) => {
                  const pct = Math.round((s.correct / s.total) * 100)
                  return (
                    <div key={t} className="p-4 bg-bento-card border border-border rounded-[12px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                          {TYPE_LABELS[t] || t}
                        </span>
                        <span className="text-[10px] font-black tabular-nums text-foreground/80">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-bento-item rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 80
                                ? 'white'
                                : pct >= 50
                                ? 'rgba(255,255,255,0.4)'
                                : 'rgba(239, 68, 68, 0.6)',
                          }}
                        />
                      </div>
                      <div className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">
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
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                Bookmarked for Review
              </div>
              <div className="space-y-2">
                {bookmarkedQuestions.map((q: any, i: number) => (
                  <div key={i} className="p-4 bg-bento-card border border-border rounded-[8px] space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] border-border rounded-[4px] px-1.5 bg-bento-item">
                        {q.difficulty || '?'}
                      </Badge>
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
                        {TYPE_LABELS[q.type] || q.type}
                      </span>
                      {session.scores[q.id] === true && (
                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-foreground/40">
                          Correct
                        </span>
                      )}
                      {session.scores[q.id] === false && (
                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-destructive/60">
                          Wrong
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-foreground/80 leading-relaxed text-left">{q.question}</div>
                    {(q as any).answer && (
                      <div className="text-[9px] font-black text-muted-foreground/40 border-t border-border/55 pt-2 mt-1 text-left">
                        Answer: <span className="text-foreground/60">{String((q as any).answer)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-row gap-3 pt-6 border-t border-border">
            <Button
              onClick={() => {
                session.reset()
                setView('configuring')
              }}
              className="h-11 flex-1 bg-[#e4e4e7] text-background border border-foreground hover:bg-[#e4e4e7]/90 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-colors"
            >
              Practice Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const distribution = Object.fromEntries(
                  Object.entries(typeMap).map(([t, s]) => [t, Math.max(0, s.total - s.correct)])
                ) as any
                session.reset()
                setAdvancedConfig({ ...DEFAULT_CONFIG, questionDistribution: distribution })
                setView('configuring')
              }}
              className="h-11 flex-1 border-border bg-bento-card hover:bg-[#e4e4e7]/5 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-colors"
            >
              Retry Wrong Only
            </Button>
            <Button
              data-tour="finish-session-btn"
              variant="outline"
              onClick={() => {
                dispatchWalkthroughTrigger('practice_session_completed')
                session.reset()
                setView('dashboard')
              }}
              className="h-11 px-6 border-border bg-bento-card hover:bg-[#e4e4e7]/5 text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-colors"
            >
              Finish Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
