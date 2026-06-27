import React from 'react'
import { BrainCircuit, BookOpen, Bookmark, Check, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AterExplainDialog, makePracticeExplainFetchers } from '@/components/obsidian/AterExplainDialog'
import { UnifiedSandboxViewer } from '@/components/obsidian/UnifiedSandboxViewer'
import { MarkdownBlock } from '@/components/MiniPracticeUI'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Question } from '@/types/practice'
import { Hub } from '@/hooks/usePracticeConfig'
import { cleanTitle } from './utils'

interface PracticeSessionProps {
  session: any
  view: string
  setView: (v: string) => void
  selectedHub: string
  hubs: Hub[]
  explainOpen: boolean
  setExplainOpen: (v: boolean) => void
  explainQuestion: Question | null
  setExplainQuestion: (q: Question | null) => void
  artifacts: any[]
  isPanelOpen: boolean
  panelWidth: number
  setIsDraggingSplit: (v: boolean) => void
  handleSubmitAnswer: () => void
  nextQuestion: (latestGrade?: boolean) => void
  resetSession: () => void
  handleSelectAnswer: (val: any) => void
  handleExplainMore: () => void
}

export function PracticeSession({
  session,
  view,
  setView,
  selectedHub,
  hubs,
  explainOpen,
  setExplainOpen,
  explainQuestion,
  setExplainQuestion,
  artifacts,
  isPanelOpen,
  panelWidth,
  setIsDraggingSplit,
  handleSubmitAnswer,
  nextQuestion,
  resetSession,
  handleSelectAnswer,
  handleExplainMore,
}: PracticeSessionProps) {
  if (view !== 'session' || !session.currentQuestion) return null

  const progress = ((session.currentQuestionIdx + 1) / session.questions.length) * 100
  const currentQuestion = session.currentQuestion
  const currentQuestionIdx = session.currentQuestionIdx
  const questions = session.questions
  const isRevealed = session.isRevealed
  const userAnswers = session.userAnswers
  const globalTimeLeft = session.globalTimeLeft
  const questionTimeLeft = session.questionTimeLeft
  const bookmarked = session.bookmarked
  const keywordChecks = session.keywordChecks

  const currentCardPath = currentQuestion.note_id
  const currentCard = currentCardPath ? session.srsCardsCache[currentCardPath] : null

  const getRetrievability = (card: any): number => {
    if (!card) return 1.0
    const stability = Math.max(0.01, card.stability || 0)
    if (!card.last_review) return 1.0
    const lastReviewTime = new Date(card.last_review).getTime()
    const elapsedDays = Math.max(0, Date.now() - lastReviewTime) / (1000 * 60 * 60 * 24)
    return Math.pow(1 + elapsedDays / (9 * stability), -1)
  }

  const retrievability = currentCard ? getRetrievability(currentCard) : 1.0
  const lapses = currentCard ? currentCard.lapses || 0 : 0

  const isTutorSession = !!session.sessionPath

  return (
    <div data-tour="practice-session-card" className="h-full w-full flex flex-row min-w-0 bg-transparent text-foreground overflow-hidden relative gap-3">
      <div
        className="bg-bento-panel rounded-[12px] border border-border/40 shadow-sm relative flex flex-col min-w-0 panel-transition flex-1 h-full min-h-0 overflow-hidden"
        style={{
          width: !isTutorSession && isPanelOpen && artifacts.length > 0 ? `${100 - panelWidth}%` : '100%',
          flex: !isTutorSession && isPanelOpen && artifacts.length > 0 ? 'none' : '1 1 0%',
        }}
      >
        {/* ── Feynman Gate Locked Overlay ── */}
        {session.isFeynmanLocked && (
          <div className="absolute inset-0 z-40 bg-bento-panel/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="max-w-xl w-full border border-border bg-bento-panel p-8 rounded-[12px] space-y-6 shadow-2xl relative">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <BrainCircuit className="text-primary shrink-0" size={24} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Cognitive Lock Engaged</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                    FSRS Telemetry: Memory Decay Detected
                  </p>
                </div>
                <div className="ml-auto bg-destructive/10 border border-destructive/20 text-destructive text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[6px]">
                  Locked
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-bento-item border border-border rounded-[8px] flex flex-col gap-0.5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">
                    Retrievability
                  </span>
                  <span className={cn('text-xs font-black tracking-tight', retrievability < 0.7 ? 'text-destructive' : 'text-foreground')}>
                    {(retrievability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-bento-item border border-border rounded-[8px] flex flex-col gap-0.5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">
                    Stability
                  </span>
                  <span className="text-xs font-black tracking-tight text-foreground">
                    {currentCard?.stability ? `${currentCard.stability.toFixed(2)}d` : '0d'}
                  </span>
                </div>
                <div className="p-3 bg-bento-item border border-border rounded-[8px] flex flex-col gap-0.5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Lapses</span>
                  <span className={cn('text-xs font-black tracking-tight', lapses >= 3 ? 'text-destructive' : 'text-foreground')}>
                    {lapses}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  The Feynman Challenge
                </h4>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Your memory weights for{' '}
                  <strong className="text-foreground">{cleanTitle(currentQuestion.note_title || currentCardPath)}</strong>{' '}
                  indicate high fading. Write a clear, comprehensive explanation of this topic in your own words to unlock.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={session.feynmanExplanation}
                  onChange={(e) => session.setFeynmanExplanation(e.target.value)}
                  disabled={session.isFeynmanValidating}
                  rows={5}
                  placeholder="Explain the core concepts, mechanisms, and rules of this topic..."
                  className="w-full p-4 bg-bento-item border border-border rounded-[8px] text-xs font-medium focus:ring-1 focus:ring-primary/20 focus:border-primary/40 outline-none placeholder:opacity-20 resize-none"
                />

                {session.feynmanError && (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 text-destructive text-[10px] font-bold rounded-[8px] space-y-2">
                    <span className="uppercase tracking-widest text-[8px] font-black text-destructive/40 block">
                      Unlocking Failed
                    </span>
                    <p>{session.feynmanError}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={resetSession}
                  disabled={session.isFeynmanValidating}
                  className="h-10 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border bg-bento-item rounded-[8px]"
                >
                  Exit Session
                </Button>
                <Button
                  onClick={async () => {
                    if (!session.feynmanExplanation.trim()) {
                      toast.error('Please write an explanation first.')
                      return
                    }
                    await session.submitFeynmanChallenge()
                  }}
                  disabled={session.isFeynmanValidating || !session.feynmanExplanation.trim()}
                  className="h-10 flex-1 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest rounded-[8px]"
                >
                  {session.isFeynmanValidating ? 'Analyzing Telemetry...' : 'Validate & Unlock'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Explain More Dialog ── */}
        {explainOpen && explainQuestion && (() => {
          const rawAns = session.userAnswers[explainQuestion.id]
          const formattedUserAnswer = Array.isArray(rawAns)
            ? rawAns.join(', ')
            : typeof rawAns === 'object' && rawAns !== null
            ? JSON.stringify(rawAns)
            : rawAns !== undefined && rawAns !== null
            ? String(rawAns)
            : ''
          const { initialFetcher, followUpFetcher } = makePracticeExplainFetchers({
            question: explainQuestion.question,
            type: explainQuestion.type,
            answer: (explainQuestion as any).answer,
            explanation: explainQuestion.explanation,
            context: (explainQuestion as any).content || (explainQuestion as any).codeSnippet || '',
            userAnswer: formattedUserAnswer,
          })
          return (
            <AterExplainDialog
              isOpen={explainOpen}
              onClose={() => {
                setExplainOpen(false)
                setExplainQuestion(null)
              }}
              contextLabel={explainQuestion.question}
              initialFetcher={initialFetcher}
              followUpFetcher={followUpFetcher}
            />
          )
        })()}

        <div className="px-8 py-3 border-b border-border flex flex-row items-center justify-between gap-3">
          <div className="flex flex-row items-center gap-8 w-auto">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Practice</span>
              <div className="text-xs font-black uppercase tracking-tight truncate max-w-[200px]">
                {cleanTitle(hubs.find((h) => h.id === selectedHub)?.title || '')}
              </div>
            </div>
            <div className="flex-1 w-64 h-1 bg-muted/20 rounded-none overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-end w-auto gap-6 text-[9px] font-black uppercase tracking-widest">
            {globalTimeLeft !== null && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-muted-foreground/20 text-[7px]">Total</span>
                <div
                  className={cn(
                    'px-2 py-0.5 rounded-none border',
                    globalTimeLeft < 60 ? 'border-destructive text-destructive' : 'border-border text-muted-foreground/60'
                  )}
                >
                  {Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}
                </div>
              </div>
            )}
            {questionTimeLeft !== null && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-muted-foreground/20 text-[7px]">Q-Time</span>
                <div
                  className={cn(
                    'px-2 py-0.5 rounded-none border',
                    questionTimeLeft < 10 ? 'border-destructive text-destructive' : 'border-border text-primary'
                  )}
                >
                  {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
                </div>
              </div>
            )}
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-muted-foreground/20 text-[7px]">Progress</span>
              <div className="px-2 py-0.5 rounded-none border border-border">
                {currentQuestionIdx + 1} / {questions.length}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-8 px-10">
          <div className="max-w-3xl w-full space-y-8">
            <div className="space-y-4">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[8px] border-primary/20 bg-primary/5 text-primary rounded-[6px] px-1.5 py-0"
                >
                  {currentQuestion.difficulty || '1'}
                </Badge>
                <div className="w-1 h-1 rounded-none bg-primary/20" />
                <span>
                  {
                    (
                      {
                        mcq: 'Multiple Choice',
                        true_false: 'True or False',
                        writing: 'Writing / Essay',
                        fill_in: 'Fill in the Blank',
                        debug: 'Debugging / Error Finding',
                        trace: 'Logic / Calculation Trace',
                        order: 'Ordering / Steps',
                        matching: 'Matching Pairs',
                        synthesis: 'Synthesis / Scenario',
                        calculation: 'Math / Calculation',
                        data_analysis: 'Data Analysis',
                        scenario: 'Scenario Analysis',
                        code: 'Code / Implementation',
                      } as any
                    )[currentQuestion.type as string] || (currentQuestion.type || '').replace('_', ' ')
                  }{' '}
                  MODE
                </span>
                <button
                  onClick={() => session.toggleBookmark(currentQuestionIdx)}
                  className={cn(
                    'ml-auto transition-none',
                    bookmarked.has(currentQuestionIdx) ? 'text-primary' : 'text-muted-foreground/20 hover:text-foreground'
                  )}
                  title="Bookmark Question"
                >
                  <Bookmark size={14} className={bookmarked.has(currentQuestionIdx) ? 'fill-primary' : ''} />
                </button>
              </div>
              <div className="text-2xl font-black tracking-tight leading-snug text-foreground/90">
                <MarkdownBlock content={currentQuestion.question} />
              </div>
            </div>

            <div className="space-y-6">
              {currentQuestion.type === 'mcq' && (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(currentQuestion.options || {}).map(([key, val]) => {
                    const isSelected = userAnswers[currentQuestion.id] === key
                    const isCorrect =
                      isRevealed &&
                      (key === currentQuestion.answer ||
                        String(val).toLowerCase() === String(currentQuestion.answer).toLowerCase())
                    const isWrongSelected = isRevealed && isSelected && !isCorrect
                    return (
                      <button
                        key={key}
                        disabled={isRevealed}
                        onClick={() => handleSelectAnswer(key)}
                        className={cn(
                          'p-4 border rounded-[8px] text-left text-sm font-bold flex items-start w-full transition-all duration-150',
                          isCorrect
                            ? 'bg-primary/10 border-primary text-primary'
                            : isWrongSelected
                            ? 'bg-destructive/10 border-destructive text-destructive'
                            : isRevealed
                            ? 'border-border opacity-30 grayscale'
                            : isSelected
                            ? 'bg-bento-item border-foreground text-foreground'
                            : 'border-border bg-bento-panel hover:bg-bento-item text-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'shrink-0 mt-0.5 mr-3 px-2 py-0.5 border text-xs font-bold rounded-[6px]',
                            isSelected ? 'border-foreground bg-foreground/10 text-foreground' : 'border-border bg-bento-item text-muted-foreground/50'
                          )}
                        >
                          {key}
                        </span>
                        <div className="flex-1 overflow-x-auto">
                          <MarkdownBlock content={String(val)} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {(!currentQuestion.type ||
                ['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(
                  currentQuestion.type
                )) && (
                <div className="space-y-6">
                  {['debug', 'code'].includes(currentQuestion.type) &&
                    (currentQuestion.content || currentQuestion.codeSnippet) && (
                      <div className="p-1 border border-border rounded-[8px] bg-bento-panel">
                        <MarkdownBlock
                          content={`\`\`\`${currentQuestion.language || 'text'}\n${
                            currentQuestion.content || currentQuestion.codeSnippet
                          }\n\`\`\``}
                        />
                      </div>
                    )}
                  {['trace', 'calculation', 'data_analysis', 'scenario', 'synthesis', 'writing'].includes(
                    currentQuestion.type
                  ) &&
                    currentQuestion.content && (
                      <div className="p-4 border border-border/40 rounded-[8px] bg-bento-panel text-sm text-foreground/80">
                        <MarkdownBlock content={currentQuestion.content} />
                      </div>
                    )}
                  <textarea
                    rows={6}
                    disabled={isRevealed}
                    className="w-full p-4 bg-bento-item border border-border rounded-[8px] text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none placeholder:opacity-20"
                    placeholder="Synthesize your technical analysis here..."
                    value={userAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleSelectAnswer(e.target.value)}
                  />
                  {isRevealed && (
                    <div className="p-4 border border-primary/20 bg-primary/5 rounded-[8px] space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                        Correct Answer
                      </div>
                      <div className="text-xs font-bold leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        <MarkdownBlock content={String(currentQuestion.answer || '')} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((v) => {
                    const isSelected = userAnswers[currentQuestion.id] === v
                    const isCorrect = isRevealed && v.toLowerCase() === String(currentQuestion.answer).toLowerCase()
                    const isWrongSelected = isRevealed && isSelected && !isCorrect
                    return (
                      <button
                        key={v}
                        disabled={isRevealed}
                        onClick={() => handleSelectAnswer(v)}
                        className={cn(
                          'h-24 border rounded-[8px] text-xs font-bold uppercase tracking-widest transition-all duration-150',
                          isCorrect
                            ? 'bg-primary/10 border-primary text-primary font-extrabold ring-1 ring-inset ring-primary'
                            : isWrongSelected
                            ? 'bg-destructive/10 border-destructive text-destructive ring-1 ring-inset ring-destructive'
                            : isRevealed
                            ? 'border-border opacity-30 grayscale text-muted-foreground/40'
                            : isSelected
                            ? 'bg-bento-item border-foreground text-foreground ring-1 ring-inset ring-foreground'
                            : 'border-border bg-bento-panel hover:bg-bento-item text-foreground/80'
                        )}
                      >
                        {v}
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'order' && (
                <div className="space-y-3">
                  {(userAnswers[currentQuestion.id] || currentQuestion.steps || []).map((step: string, i: number) => {
                    const list = userAnswers[currentQuestion.id] || currentQuestion.steps || []
                    const moveUp = () => {
                      if (i > 0) {
                        const n = [...list]
                        ;[n[i - 1], n[i]] = [n[i], n[i - 1]]
                        handleSelectAnswer(n)
                      }
                    }
                    const moveDown = () => {
                      if (i < list.length - 1) {
                        const n = [...list]
                        ;[n[i], n[i + 1]] = [n[i + 1], n[i]]
                        handleSelectAnswer(n)
                      }
                    }
                    const isCorrect = isRevealed && step === (currentQuestion.answer || [])[i]
                    const isWrong = isRevealed && step !== (currentQuestion.answer || [])[i]
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-4 p-3 border rounded-[8px] ',
                          isCorrect
                            ? 'border-primary bg-primary/5'
                            : isWrong
                            ? 'border-destructive/20 bg-destructive/5'
                            : 'border-border bg-bento-item hover:border-border/60'
                        )}
                      >
                        <div className="flex flex-col gap-1.5 border-r border-border/10 pr-4">
                          <button
                            disabled={isRevealed || i === 0}
                            onClick={moveUp}
                            className="text-xs p-1 opacity-20 hover:opacity-100 hover:text-primary disabled:opacity-0"
                          >
                            ▲
                          </button>
                          <button
                            disabled={isRevealed || i === list.length - 1}
                            onClick={moveDown}
                            className="text-xs p-1 opacity-20 hover:opacity-100 hover:text-primary disabled:opacity-0"
                          >
                            ▼
                          </button>
                        </div>
                        <div className="text-sm font-bold tracking-tight text-foreground/80 pl-1">{step}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'matching' && currentQuestion.pairs && (
                <div className="space-y-4">
                  {currentQuestion.pairs.map((pair: any, i: number) => {
                    const rights = currentQuestion.pairs.map((p: any) => p.right).sort()
                    const selected = (userAnswers[currentQuestion.id] || {})[pair.left] || ''
                    const isCorrect = isRevealed && selected === pair.right
                    const isWrong = isRevealed && selected !== pair.right
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-4 p-3 border rounded-[8px] ',
                          isCorrect
                            ? 'border-primary bg-primary/5'
                            : isWrong
                            ? 'border-destructive/20 bg-destructive/5'
                            : 'border-border bg-bento-item hover:border-border/60'
                        )}
                      >
                        <div className="flex-1 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground/60 text-left">
                          {pair.left}
                        </div>
                        <div className="flex-1">
                          <select
                            disabled={isRevealed}
                            value={selected}
                            onChange={(e) =>
                              handleSelectAnswer({ ...userAnswers[currentQuestion.id], [pair.left]: e.target.value })
                            }
                            className="w-full p-3 bg-bento-item hover:bg-bento-item/80 border border-border focus:border-primary rounded-[8px] outline-none text-xs font-bold text-foreground cursor-pointer transition-colors"
                          >
                            <option value="">Select match...</option>
                            {rights.map((r: string, j: number) => (
                              <option key={j} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        {isRevealed && isWrong && (
                          <div className="flex-1">
                            <div className="text-[8px] font-black uppercase text-primary/40 mb-1">Correct Match</div>
                            <div className="text-xs font-black uppercase tracking-widest text-primary text-left">
                              {pair.right}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'fill_in' && (
                <div className="p-5 bg-bento-panel border border-border rounded-[8px] text-base font-medium leading-relaxed flex flex-wrap items-center gap-y-3">
                  {(() => {
                    let text = currentQuestion.textWithBlanks || currentQuestion.text_with_blanks || ''
                    const rawAnswer = currentQuestion.answer || []
                    const ansArr = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer]

                    if (!text && currentQuestion.question) {
                      let tempText = currentQuestion.question
                      let argIdx = 0
                      tempText = tempText.replace(/_{3,}/g, () => {
                        const val = ansArr[argIdx++] || ''
                        return `[[${val}]]`
                      })
                      text = tempText
                    }

                    const parts = text.split(/\[\[.*?\]\]/)
                    return parts.map((part: string, i: number) => (
                      <React.Fragment key={i}>
                        <div className="inline-block align-middle">
                          <MarkdownBlock content={part} variant="inline" />
                        </div>
                        {i < parts.length - 1 && (
                          <div className="inline-flex flex-col items-center">
                            <input
                              type="text"
                              disabled={isRevealed}
                              value={(userAnswers[currentQuestion.id] || [])[i] || ''}
                              onChange={(e) => {
                                const newAns = [...(userAnswers[currentQuestion.id] || [])]
                                newAns[i] = e.target.value
                                handleSelectAnswer(newAns)
                              }}
                              className={cn(
                                'mx-2 border-b-2 bg-bento-item hover:bg-bento-item/80 outline-none w-36 focus:w-40 text-center text-sm font-bold uppercase shrink-0 px-2 py-0.5 transition-all duration-150 rounded-[6px]',
                                isRevealed
                                  ? String((userAnswers[currentQuestion.id] || [])[i] || '')
                                      .trim()
                                      .toLowerCase() ===
                                    String(ansArr[i] || '')
                                      .trim()
                                      .toLowerCase()
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-destructive bg-destructive/10 text-destructive'
                                  : 'border-border focus:border-primary text-foreground'
                              )}
                            />
                            {isRevealed &&
                              String((userAnswers[currentQuestion.id] || [])[i] || '')
                                .trim()
                                .toLowerCase() !==
                                String(ansArr[i] || '')
                                  .trim()
                                  .toLowerCase() && (
                                <div className="text-[10px] text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 font-black uppercase mt-1 tracking-wider whitespace-nowrap">
                                  Correct: {String(ansArr[i] || '')}
                                </div>
                              )}
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  })()}
                </div>
              )}

              {isRevealed && currentQuestion.explanation && (
                <div className="p-5 border border-border/10 rounded-none bg-muted/5 text-[13px] font-medium text-muted-foreground/80 italic leading-relaxed text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mb-2 not-italic">
                    Explanation
                  </div>
                  <MarkdownBlock content={currentQuestion.explanation} />
                </div>
              )}

              {session.retryActive?.[currentQuestion.id] && session.questionHint?.[currentQuestion.id] && (
                <div className="p-5 border border-amber-500/20 bg-amber-500/5 rounded-[8px] space-y-2 text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    Tutor Hint (Attempt 1)
                  </div>
                  <div className="text-sm font-bold text-amber-500/90">
                    <MarkdownBlock content={session.questionHint[currentQuestion.id]} />
                  </div>
                </div>
              )}

              {isRevealed && session.misconceptionText?.[currentQuestion.id] && (
                <div className="p-5 border border-destructive/20 bg-destructive/5 rounded-[8px] space-y-3 text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-destructive">
                    Misconception Diagnosis (Attempt 2)
                  </div>
                  <div className="text-xs font-bold leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    <MarkdownBlock content={session.misconceptionText[currentQuestion.id]} />
                  </div>
                  {session.remediationQuestion?.[currentQuestion.id] && (
                    <Button
                      onClick={session.handleTakeRemediation}
                      className="mt-3 w-full bg-destructive text-destructive-foreground font-black uppercase text-[10px] tracking-widest rounded-none hover:bg-destructive/90"
                    >
                      Take Remediation Challenge
                    </Button>
                  )}
                </div>
              )}

              {isRevealed &&
                ['writing', 'scenario', 'code', 'debug', 'synthesis', 'trace'].includes(currentQuestion.type) &&
                Array.isArray(currentQuestion.required_keywords) &&
                currentQuestion.required_keywords.length > 0 && (
                  <div className="p-8 border border-border rounded-[8px] bg-bento-panel space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                        Mandatory Concepts Checklist
                      </div>
                      <div className="text-[10px] font-black tabular-nums text-muted-foreground/50">
                        {
                          currentQuestion.required_keywords.filter((kw: string) =>
                            String(userAnswers[currentQuestion.id] || '')
                              .toLowerCase()
                              .includes(kw.toLowerCase())
                          ).length
                        }{' '}
                        / {currentQuestion.required_keywords.length} Found
                      </div>
                    </div>

                    {currentQuestion.required_keywords.filter(
                      (kw: string) =>
                        !String(userAnswers[currentQuestion.id] || '')
                          .toLowerCase()
                          .includes(kw.toLowerCase())
                    ).length > 0 && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-[8px] text-sm font-bold text-destructive/90 mb-4 text-left">
                        Warning: Your answer is missing core concepts. Are you sure you mastered this?
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion.required_keywords.map((kw: string, i: number) => {
                        const isFound = String(userAnswers[currentQuestion.id] || '')
                          .toLowerCase()
                          .includes(kw.toLowerCase())
                        return (
                          <label
                            key={i}
                            className={cn(
                              'flex items-center gap-4 p-4 border rounded-[8px] cursor-pointer transition-colors shadow-sm text-left',
                              isFound ? 'border-primary/50 bg-primary/5' : 'border-border bg-bento-card hover:bg-bento-item'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={keywordChecks[kw] || false}
                              onChange={(e) => session.setKeywordCheck(kw, e.target.checked)}
                              className="w-5 h-5 shrink-0 appearance-none border border-border bg-bento-item rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[5px] after:top-[1px] after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 cursor-pointer transition-all hover:border-foreground/20"
                            />
                            <span className={cn('text-sm font-bold transition-colors', isFound ? 'text-foreground' : 'text-muted-foreground')}>
                              {kw}{' '}
                              {isFound && (
                                <span className="text-[10px] uppercase tracking-widest text-primary ml-3 font-black">
                                  (Found in your answer)
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/10 bg-transparent">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={resetSession} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Exit
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleExplainMore}
                className="h-10 px-4 text-[10px] font-black uppercase tracking-widest border border-border bg-bento-item hover:border-foreground/60 text-foreground/70 hover:text-foreground rounded-[8px] flex items-center gap-2 transition-colors duration-150"
                title="Get a detailed lesson on this question's concept"
              >
                <BookOpen size={12} />
                Explain More
              </Button>
              <div className="flex items-center gap-2">
                {session.retryActive?.[currentQuestion.id] ? (
                  <Button
                    onClick={session.handleRetry}
                    className="h-10 px-10 bg-amber-500 hover:bg-amber-600 text-amber-foreground text-[10px] font-black uppercase tracking-widest rounded-none"
                  >
                    Try Again
                  </Button>
                ) : !isRevealed ? (
                  <Button
                    data-tour="submit-answer-btn"
                    onClick={handleSubmitAnswer}
                    disabled={
                      session.isSubmitting || (
                        !userAnswers[currentQuestion.id] &&
                        ![
                          'writing',
                          'synthesis',
                          'debug',
                          'trace',
                          'calculation',
                          'data_analysis',
                          'scenario',
                          'code',
                        ].includes(currentQuestion.type)
                      )
                    }
                    className="h-10 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-none"
                  >
                    {session.isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {session.scores[currentQuestion.id] === undefined &&
                      ['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(
                        currentQuestion.type
                      ) && (
                        <>
                          <Button
                            onClick={() => {
                              nextQuestion(false)
                            }}
                            variant="outline"
                            className="h-10 px-6 text-[9px] font-black uppercase border-destructive/20 text-destructive/40"
                          >
                            Wrong
                          </Button>
                          <Button
                            onClick={() => {
                              nextQuestion(true)
                            }}
                            disabled={
                              Array.isArray(currentQuestion.required_keywords) &&
                              currentQuestion.required_keywords.length > 0 &&
                              currentQuestion.required_keywords.some((kw: string) => !keywordChecks[kw])
                            }
                            className="h-10 px-6 bg-primary text-primary-foreground text-[9px] font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              Array.isArray(currentQuestion.required_keywords) &&
                              currentQuestion.required_keywords.some((kw: string) => !keywordChecks[kw])
                                ? 'Check all mandatory concepts to mark as correct'
                                : ''
                            }
                          >
                            Correct
                          </Button>
                        </>
                      )}
                    {((!['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(
                      currentQuestion.type
                    )) ||
                      session.scores[currentQuestion.id] !== undefined) && (
                      <Button
                        onClick={() => nextQuestion()}
                        className="h-10 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-none"
                      >
                        Next
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isTutorSession && isPanelOpen && artifacts.length > 0 && (
        <>
          <button
            type="button"
            aria-label="Resize artifact panel"
            onMouseDown={(event) => {
              event.preventDefault()
              setIsDraggingSplit(true)
            }}
            className="w-1.5 shrink-0 cursor-col-resize border-x border-border/40 bg-muted hover:bg-foreground/20 rounded-[6px]"
          />
          <div
            className="min-w-[420px] max-w-[82%] rounded-[12px] overflow-hidden border border-border/40 bg-bento-panel shadow-sm shrink-0 h-full"
            style={{ width: `${panelWidth}%` }}
          >
            <UnifiedSandboxViewer shielded={isPanelOpen} />
          </div>
        </>
      )}
    </div>
  )
}
