import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, RotateCcw, BookOpen, BrainCircuit, Loader2 } from 'lucide-react';
import { AterMarkdown } from './obsidian/MarkdownViewer';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { Question, QuestionType } from '@/types/practice';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { AterExplainDialog, makePracticeExplainFetchers } from '@/components/obsidian/AterExplainDialog';
import { toast } from 'sonner';
import { extractArtifacts } from '@/lib/artifacts/parser';
import { UnifiedSandboxViewer } from '@/components/obsidian/UnifiedSandboxViewer';
import { sidecarApi } from '@/lib/sidecarApi';

export const MarkdownBlock = ({ content, variant = 'block' }: { content: string; variant?: 'block' | 'inline' }) => {
  if (variant === 'inline') {
    return (
      <AterMarkdown 
        content={content} 
        className="inline-block align-baseline text-[13px] text-foreground/90"
        components={{
          p: ({ children }: any) => <span className="inline text-[13px] text-foreground/90">{children}</span>
        }}
      />
    );
  }
  return (
    <AterMarkdown 
      content={content} 
      className="block w-full text-[13px] text-foreground/90 whitespace-pre-wrap break-words"
    />
  );
};

interface MiniPracticeUIProps {
    question: Question | Question[];
    notePath?: string;
    onComplete?: (score: number, total: number) => void;
}

export default function MiniPracticeUI({ question, notePath, onComplete }: MiniPracticeUIProps) {
  const { currentHub } = usePomodoroStore();
  const questions = Array.isArray(question) ? question : [question];

  const session = usePracticeSession();
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainQuestion, setExplainQuestion] = useState<Question | null>(null);

  // Mistake Diagnostic States
  const [diagnosticFeedback, setDiagnosticFeedback] = useState<string | null>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState<boolean>(false);
  const [fetchedDiagnosticQId, setFetchedDiagnosticQId] = useState<string | null>(null);

  // Initialize the session hook with the questions prop
  useEffect(() => {
    session.startSession(questions, {}, notePath);
  }, [question, notePath]);

  // Handle completion event callback
  useEffect(() => {
    if (session.showScore && onComplete) {
      const score = Object.values(session.scores).filter(Boolean).length;
      onComplete(score, questions.length);
    }
  }, [session.showScore]);

  const rawQ = session.currentQuestion;
  const currentQ = React.useMemo(() => {
    const q = rawQ as any;
    if (!q) return {} as Question;
    const inferredType = (q.type || (
      q.options || (q.choices && Object.keys(q.choices).length > 0)
        ? 'mcq'
        : q.pairs && q.pairs.length > 0
        ? 'matching'
        : q.steps && q.steps.length > 0
        ? 'order'
        : q.textWithBlanks || q.text_with_blanks
        ? 'fill_in'
        : 'writing'
    )) as QuestionType;
    return {
      ...rawQ,
      type: inferredType
    } as any as Question;
  }, [rawQ]) as Question;
  const isRevealed = session.isRevealed;
  const userAnswers = session.userAnswers;
  const scores = session.scores;
  const showScore = session.showScore;
  const keywordChecks = session.keywordChecks;
  const currentIdx = session.currentQuestionIdx;

  // Reset diagnostic feedback when active question changes
  useEffect(() => {
    setDiagnosticFeedback(null);
    setDiagnosticLoading(false);
    setFetchedDiagnosticQId(null);
  }, [currentQ?.id]);

  // Trigger active recall mistake diagnostics on incorrect answers
  useEffect(() => {
    if (isRevealed && currentQ && currentQ.id) {
      const isCorrect = scores[currentQ.id];
      if (isCorrect === false && fetchedDiagnosticQId !== String(currentQ.id)) {
        setFetchedDiagnosticQId(String(currentQ.id));
        setDiagnosticLoading(true);
        setDiagnosticFeedback(null);
        
        const rawAns = userAnswers[currentQ.id];
        const formattedUserAnswer = Array.isArray(rawAns)
          ? rawAns.join(', ')
          : typeof rawAns === 'object' && rawAns !== null
            ? JSON.stringify(rawAns)
            : rawAns !== undefined && rawAns !== null ? String(rawAns) : '';

        sidecarApi.explainQuestion({
          question: currentQ.question,
          type: currentQ.type,
          answer: Array.isArray(currentQ.answer) 
            ? currentQ.answer.join(', ') 
            : typeof currentQ.answer === 'object' && currentQ.answer !== null
              ? JSON.stringify(currentQ.answer)
              : String(currentQ.answer),
          explanation: currentQ.explanation || '',
          context: (currentQ as any).content || (currentQ as any).codeSnippet || '',
          userAnswer: formattedUserAnswer,
          is_correct: false,
          note_path: currentQ.note_id || notePath,
        }).then((res) => {
          if (res && res.explanation) {
            setDiagnosticFeedback(res.explanation);
          } else if (res && res.lesson) {
            setDiagnosticFeedback(res.lesson);
          }
        }).catch((err) => {
          console.error('[Diagnostics] Failed to fetch explanation:', err);
          setDiagnosticFeedback("Failed to load diagnostic breakdown.");
        }).finally(() => {
          setDiagnosticLoading(false);
        });
      }
    }
  }, [isRevealed, currentQ, scores, fetchedDiagnosticQId, userAnswers, notePath]);

  const [localArtifacts, setLocalArtifacts] = useState<any[]>([]);

  useEffect(() => {
    if (currentQ && currentQ.id) {
      const qText = `${currentQ.question || ''}\n${currentQ.explanation || ''}\n${currentQ.content || ''}`;
      const extracted = extractArtifacts(qText);
      if (extracted.artifacts.length > 0) {
        setLocalArtifacts(extracted.artifacts);
      } else if (currentQ.note_id || notePath) {
        const path = currentQ.note_id || notePath;
        if (path) {
          sidecarApi.readObsidianNote(path).then((res) => {
            const noteExtracted = extractArtifacts(res.content || '');
            setLocalArtifacts(noteExtracted.artifacts);
          }).catch(() => {
            setLocalArtifacts([]);
          });
        } else {
          setLocalArtifacts([]);
        }
      } else {
        setLocalArtifacts([]);
      }
    } else {
      setLocalArtifacts([]);
    }
  }, [currentQ, notePath]);

  if (!rawQ && !showScore) return null;

  const handleSelectAnswer = (val: any) => {
    session.selectAnswer(val);
  };

  const checkAnswer = () => {
    session.checkAnswer();
  };

  const handleSelfGrade = (isCorrect: boolean) => {
    session.selfGrade(isCorrect);
  };

  const nextQuestion = () => {
    session.nextQuestion();
  };

  const resetQuiz = () => {
    session.reset();
    session.startSession(questions, {}, notePath);
  };

  const handleExplainMore = () => {
    if (!currentQ) return;
    setExplainQuestion(currentQ);
    setExplainOpen(true);
  };

  const renderFillInBlanks = () => {
    let text = currentQ.textWithBlanks || currentQ.text_with_blanks || '';
    const rawAnswer = currentQ.answer || '';
    const ansArr = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];

    if (!text && currentQ.question) {
      let tempText = currentQ.question;
      let argIdx = 0;
      tempText = tempText.replace(/_{3,}/g, () => {
        const val = ansArr[argIdx++] || '';
        return `[[${val}]]`;
      });
      text = tempText;
    }

    const parts = text.split(/\[\[.*?\]\]/);
    return parts.map((part: string, i: number) => (
      <React.Fragment key={i}>
        <div className="inline-block align-middle"><MarkdownBlock content={part} variant="inline" /></div>
        {i < parts.length - 1 && (
          <div className="inline-flex flex-col items-center">
            <input
              type="text"
              disabled={isRevealed}
              value={(userAnswers[currentQ.id] || [])[i] || ''}
              onChange={(e) => {
                const newAns = [...(userAnswers[currentQ.id] || [])];
                newAns[i] = e.target.value;
                handleSelectAnswer(newAns);
              }}
              placeholder=""
              className={cn(
                "mx-0.5 px-2 py-0.5 border border-border bg-bento-item rounded-[8px] focus:outline-none focus:border-primary w-32 text-center font-bold tracking-widest text-[12px] inline-block",
                isRevealed 
                  ? "border-muted-foreground/30 text-foreground/50 opacity-80"
                  : "border-primary/40 focus:border-primary text-foreground"
              )}
            />
            {isRevealed && String((userAnswers[currentQ.id] || [])[i] || '').toLowerCase() !== String(ansArr[i] || '').toLowerCase() && (
               <div className="text-[10px] text-foreground font-black mt-1 uppercase tracking-widest bg-muted/30 px-1 rounded-[8px]">Correct: {String(ansArr[i] || '')}</div>
            )}
          </div>
        )}
      </React.Fragment>
    ));
  };

  const cleanTitle = (val: any): string => {
    if (val === undefined || val === null) return '';
    return String(val).replace(/\[\[(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim();
  };

  // Calculate Feynman properties for lock screen
  const currentCardPath = currentQ ? currentQ.note_id : null;
  const currentCard = currentCardPath ? session.srsCardsCache[currentCardPath] : null;

  const getRetrievability = (card: any): number => {
    if (!card) return 1.0;
    const stability = Math.max(0.01, card.stability || 0);
    if (!card.last_review) return 1.0;
    const lastReviewTime = new Date(card.last_review).getTime();
    const elapsedDays = Math.max(0, Date.now() - lastReviewTime) / (1000 * 60 * 60 * 24);
    return Math.pow(1 + elapsedDays / (9 * stability), -1);
  };

  const retrievability = currentCard ? getRetrievability(currentCard) : 1.0;
  const lapses = currentCard ? (currentCard.lapses || 0) : 0;
  const confidenceWager = currentQ ? (session.confidenceWagers[currentQ.id] || null) : null;

  return (
    <div data-tour="quiz-section" className="my-1 border border-border rounded-[12px] overflow-hidden bg-bento-panel shadow-sm not-prose relative">
      {/* ── Feynman Gate Locked Overlay ── */}
      {session.isFeynmanLocked && (
        <div className="absolute inset-0 z-40 bg-bento-panel/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-border bg-bento-panel p-4 rounded-[12px] space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <BrainCircuit className="text-primary shrink-0" size={18} />
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Cognitive Lock</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">FSRS Telemetry: Memory Decay</p>
              </div>
              <div className="ml-auto bg-destructive/10 border border-destructive/20 text-destructive text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[4px]">
                Locked
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-bento-item border border-border rounded-[8px] flex flex-col gap-0.5">
                <span className="text-[6px] font-black uppercase tracking-widest text-muted-foreground/40">Retrievability</span>
                <span className={cn("text-[10px] font-black tracking-tight", retrievability < 0.70 ? "text-destructive" : "text-foreground")}>
                  {(retrievability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2 bg-bento-item border border-border rounded-[8px] flex flex-col gap-0.5">
                <span className="text-[6px] font-black uppercase tracking-widest text-muted-foreground/40">Stability</span>
                <span className="text-[10px] font-black tracking-tight text-foreground">
                  {currentCard?.stability ? `${currentCard.stability.toFixed(2)}d` : '0d'}
                </span>
              </div>
              <div className="p-2 bg-bento-item border border-border rounded-[8px] flex flex-col gap-0.5">
                <span className="text-[6px] font-black uppercase tracking-widest text-muted-foreground/40">Lapses</span>
                <span className={cn("text-[10px] font-black tracking-tight", lapses >= 3 ? "text-destructive" : "text-foreground")}>
                  {lapses}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Feynman Explanation Challenge</h4>
              <p className="text-[10px] text-foreground/80 leading-relaxed">
                Explain <strong className="text-foreground">{cleanTitle(currentQ.note_title || currentCardPath)}</strong> in your own words to unlock this card.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                value={session.feynmanExplanation}
                onChange={(e) => session.setFeynmanExplanation(e.target.value)}
                disabled={session.isFeynmanValidating}
                rows={3}
                placeholder="Explain the core mechanisms, concepts, and rules..."
                className="w-full p-2 bg-bento-item border border-border rounded-[8px] text-[10px] font-medium focus:ring-1 focus:ring-primary/20 focus:border-primary/40 outline-none placeholder:opacity-20 resize-none"
              />

              {session.feynmanError && (
                <div className="p-2 bg-destructive/5 border border-destructive/20 text-destructive text-[9px] font-bold rounded-[8px] space-y-1">
                  <span className="uppercase tracking-widest text-[7px] font-black text-destructive/40 block">Failed</span>
                  <p>{session.feynmanError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!session.feynmanExplanation.trim()) {
                    toast.error("Please write an explanation first.");
                    return;
                  }
                  await session.submitFeynmanChallenge();
                }}
                disabled={session.isFeynmanValidating || !session.feynmanExplanation.trim()}
                className="w-full h-8 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest rounded-[6px]"
              >
                {session.isFeynmanValidating ? "Analyzing Telemetry..." : "Validate & Unlock"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bento-panel">
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
          <span>Recall Challenge</span>
        </div>
        {questions.length > 1 && !showScore && (
          <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
            <span className="text-foreground">{currentIdx + 1} / {questions.length}</span>
          </div>
        )}
      </div>
      
      {showScore ? (
        <div className="p-4 flex flex-col items-center justify-center space-y-3 text-center">
          <div className="w-12 h-12 rounded-[8px] bg-primary/10 flex items-center justify-center border-4 border-primary/20">
            <Check size={24} className="text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-black tracking-tight text-foreground/90">Challenge Complete</h2>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Active recall sequence finished</p>
          </div>
          <div className="text-3xl font-black text-primary tabular-nums">
            {Object.values(scores).filter(Boolean).length} <span className="text-xl text-muted-foreground/30">/ {questions.length}</span>
          </div>
          <Button onClick={resetQuiz} className="mt-2 font-black uppercase tracking-[0.2em] text-[10px] h-9 px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20  ">
            <RotateCcw size={12} className="mr-2" /> Restart
          </Button>
        </div>
      ) : (
        <div className={cn("flex flex-col md:flex-row gap-3 min-h-[120px]", localArtifacts.length > 0 && "p-1.5 bg-muted/5")}>
          <div className={cn("flex-1 p-3 flex flex-col justify-center space-y-2", localArtifacts.length > 0 && "md:max-w-[50%]")}>
            <div className="space-y-2" key={`header-${currentQ.id}`}>
            <div className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/40 flex items-center gap-2">
              <Badge variant="outline" className="text-[7px] border-border bg-bento-item text-muted-foreground rounded-[8px] px-1.5 py-0">{currentQ.difficulty || '1'}</Badge>
              <div className="w-0.5 h-0.5 rounded-[8px] bg-muted-foreground/20" />
              <span>{currentQ.type.replace('_', ' ')}</span>
            </div>
            {currentQ.type !== 'fill_in' && (
              <div className="text-[13px] font-bold tracking-tight leading-snug text-foreground/90 max-w-3xl">
                <MarkdownBlock content={currentQ.question} />
              </div>
            )}
          </div>

          <div className="space-y-4" key={`body-${currentQ.id}`}>
            {/* MCQ / True False */}
            {(currentQ.type === 'mcq' || currentQ.type === 'true_false') && (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(currentQ.options || (currentQ.type === 'true_false' ? {'True':'True', 'False':'False'} : {})).map(([key, val]) => { 
                  const isSelected = userAnswers[currentQ.id] === key; 
                  const isCorrectAnswer = key === currentQ.answer || String(val).toLowerCase() === String(currentQ.answer).toLowerCase();
                  const isCorrectHighlight = isRevealed && isCorrectAnswer;
                  return (
                    <button 
                      key={key} 
                      disabled={isRevealed} 
                      onClick={() => handleSelectAnswer(key)} 
                      className={cn(
                        "group flex items-center gap-2 p-1.5 border rounded-[8px] text-left  ", 
                        isCorrectHighlight 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : isSelected && !isRevealed 
                            ? "border-foreground bg-bento-item shadow-md" 
                            : "border-border bg-bento-panel hover:border-foreground/20 hover:bg-bento-item", 
                        isRevealed && !isCorrectHighlight ? "opacity-30 grayscale" : ""
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-[8px] flex items-center justify-center text-[9px] font-black border ", 
                        isCorrectHighlight || (isSelected && !isRevealed) 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "border-border bg-bento-item text-muted-foreground/40 group-hover:border-foreground/30"
                      )}>
                        {key}
                      </div>
                      <div className="flex-1 text-[11px] font-bold leading-tight tracking-tight text-foreground/80">
                        <MarkdownBlock content={String(val)} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Order */}
            {currentQ.type === 'order' && (
              <div className="space-y-1.5 max-w-2xl mx-auto">
                {(userAnswers[currentQ.id] || currentQ.steps || []).map((step: string, i: number) => {
                  const list = userAnswers[currentQ.id] || currentQ.steps || [];
                  const moveUp = () => { if(i>0) { const n = [...list]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleSelectAnswer(n); } };
                  const moveDown = () => { if(i<list.length-1) { const n = [...list]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleSelectAnswer(n); } };
                  const isCorrect = isRevealed && step === (currentQ.answer || [])[i];
                  return (
                    <div key={i} className={cn(
                      "group flex items-center gap-2 p-2 border rounded-[8px] ",
                      isCorrect 
                        ? "border-foreground bg-bento-item" 
                        : "border-border bg-bento-panel hover:border-foreground/20"
                    )}>
                      <div className="flex flex-col gap-1 border-r border-border/10 pr-2">
                        <button disabled={isRevealed || i===0} onClick={moveUp} className="text-[10px] p-0.5 opacity-20 hover:opacity-100 hover:text-foreground  disabled:opacity-5">▲</button>
                        <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-[10px] p-0.5 opacity-20 hover:opacity-100 hover:text-foreground  disabled:opacity-5">▼</button>
                      </div>
                      <div className="text-xs font-bold tracking-tight text-foreground/80 pl-1">{step}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Matching */}
            {currentQ.type === 'matching' && currentQ.pairs && (
              <div className="space-y-3 max-w-3xl mx-auto">
                {currentQ.pairs.map((pair: any, i: number) => {
                  const rights = currentQ.pairs.map((p: any) => p.right).sort();
                  const selected = (userAnswers[currentQ.id] || {})[pair.left] || "";
                  const isCorrect = isRevealed && selected === pair.right;
                  return (
                    <div key={i} className={cn(
                      "flex items-center gap-2 p-1.5 border rounded-[8px] ",
                      isCorrect ? "border-foreground bg-bento-item" : "border-border/40 bg-muted/5"
                    )}>
                      <div className="flex-1 font-black uppercase tracking-widest text-[8px] text-muted-foreground/60">{pair.left}</div>
                      <div className="flex-1">
                        <select 
                          disabled={isRevealed} 
                          value={selected} 
                          onChange={(e) => handleSelectAnswer({...userAnswers[currentQ.id], [pair.left]: e.target.value})} 
                          className="w-full px-3 py-2 bg-bento-item border border-border rounded-[8px] outline-none focus:border-foreground/50 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer hover:border-border/40"
                        >
                          <option value="">Select Match...</option>
                          {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                        </select>
                      </div>
                      {isRevealed && !isCorrect && (
                        <div className="flex-1">
                          <div className="text-[8px] font-black uppercase text-foreground/40 mb-1">Correct Match</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-foreground">{pair.right}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Fill In Blank */}
            {currentQ.type === 'fill_in' && (
              <div className="p-3 bg-bento-item border border-border rounded-[8px] leading-relaxed text-xs font-medium tracking-tight text-foreground/70 shadow-inner">
                {renderFillInBlanks()}
              </div>
            )}

            {/* Writing / Scenario / Code / Debug / Synthesis / Find Error */}
            {(!currentQ.type || ['debug', 'writing', 'scenario', 'code', 'synthesis', 'trace', 'calculation', 'data_analysis', 'find_error'].includes(currentQ.type)) && (
              <div className="space-y-3">
                {(currentQ.content || currentQ.codeSnippet || currentQ.buggyCode) && (
                  <div className="p-2 bg-bento-item border border-border rounded-[8px] shadow-inner">
                    <MarkdownBlock 
                      content={
                        ((['debug', 'code', 'trace', 'find_error'].includes(currentQ.type)) && !(currentQ.content || currentQ.codeSnippet || currentQ.buggyCode || "").includes('```')) 
                          ? `\`\`\`${currentQ.language || 'text'}\n${currentQ.content || currentQ.codeSnippet || currentQ.buggyCode || ""}\n\`\`\``
                          : (currentQ.content || currentQ.codeSnippet || currentQ.buggyCode || "")
                      } 
                    />
                  </div>
                )}
                <textarea
                  disabled={isRevealed}
                  value={userAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder=""
                  className="w-full min-h-[70px] p-3 bg-bento-item border border-border rounded-[8px] focus:outline-none focus:border-primary text-[12px] font-medium tracking-tight text-foreground resize-y shadow-md"
                />
              </div>
            )}

            {!isRevealed ? (
              <div className="pt-2 space-y-3">
                <div className="flex flex-col gap-2 p-3 border border-border rounded-[8px] bg-bento-panel">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-center">Confidence Wager</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => session.setConfidenceWager(String(currentQ.id), val)}
                        className={cn(
                          "flex-1 py-1.5 rounded-[8px] text-[10px] font-bold border transition-none",
                          confidenceWager === val ? "bg-primary text-primary-foreground border-primary" : "bg-bento-item border-border text-muted-foreground hover:border-foreground/30 hover:bg-bento-item/80"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={checkAnswer} 
                  data-tour="srs-btn-good"
                  disabled={userAnswers[currentQ.id] === undefined || userAnswers[currentQ.id] === '' || (Array.isArray(userAnswers[currentQ.id]) && userAnswers[currentQ.id].length === 0) || !confidenceWager}
                  className="w-full font-black tracking-widest uppercase text-[10px] h-9 rounded-[8px] "
                >
                  Verify Understanding
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="p-4 border border-border bg-bento-item rounded-[8px] space-y-3 shadow-xl shadow-foreground/5">
                  <div className="flex items-center gap-2 text-foreground/80 font-black uppercase text-[10px] tracking-[0.2em]">
                    <div className="w-4 h-4 rounded-[8px] bg-foreground/10 flex items-center justify-center">
                      <Check size={10} />
                    </div>
                    <span>Correct Answer</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Definitive Answer</div>
                    <div className="text-xs font-bold text-foreground/90 leading-relaxed">
                      {Array.isArray(currentQ.answer) 
                        ? currentQ.answer.join(', ') 
                        : typeof currentQ.answer === 'object' && currentQ.answer !== null
                          ? JSON.stringify(currentQ.answer)
                          : String(currentQ.answer)}
                    </div>
                  </div>
  
                  <div className="space-y-1 pt-2 border-t border-border">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Explanation</div>
                    <div className="text-xs font-medium leading-relaxed text-foreground/80">
                      <MarkdownBlock content={currentQ.explanation || "No explanation provided."} />
                    </div>
                  </div>

                  {(diagnosticLoading || diagnosticFeedback) && (
                    <div className="space-y-1 pt-3 border-t border-border/40 mt-3 animate-in fade-in duration-300">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1.5 font-bold">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Active Mistake Diagnostic</span>
                      </div>
                      <div className="text-xs font-medium leading-relaxed text-foreground/80 border border-amber-500/20 bg-amber-500/5 p-3.5 rounded-[8px] mt-1">
                        {diagnosticLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest py-1">
                            <Loader2 size={12} className="animate-spin text-amber-500" />
                            <span>Diagnosing misconception...</span>
                          </div>
                        ) : (
                          <MarkdownBlock content={diagnosticFeedback || ''} />
                        )}
                      </div>
                    </div>
                  )}

                  {currentQ.type === 'trace' && currentQ.steps && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-2">Causal Chain Logic</div>
                      <div className="space-y-1.5 pl-2">
                        {currentQ.steps.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="mt-1 w-1.5 h-1.5 rounded-[8px] bg-primary/40 shrink-0" />
                            <div className="text-[11px] font-bold text-foreground/70 leading-snug">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {['writing', 'scenario', 'code', 'debug', 'synthesis', 'trace'].includes(currentQ.type) && Array.isArray(currentQ.required_keywords) && currentQ.required_keywords.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Mandatory Concepts Checklist</div>
                        <div className="text-[10px] font-black tabular-nums text-muted-foreground/50">
                          {currentQ.required_keywords.filter((kw: string) => String(userAnswers[currentQ.id] || '').toLowerCase().includes(kw.toLowerCase())).length} / {currentQ.required_keywords.length} Found
                        </div>
                      </div>
                      
                      {currentQ.required_keywords.filter((kw: string) => !String(userAnswers[currentQ.id] || '').toLowerCase().includes(kw.toLowerCase())).length > 0 && (
                        <div className="p-3 text-xs font-bold text-destructive/90 mb-4">
                          Warning: Your answer is missing core concepts. Are you sure you mastered this?
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2">
                        {currentQ.required_keywords.map((kw: string, i: number) => {
                          const isFound = String(userAnswers[currentQ.id] || '').toLowerCase().includes(kw.toLowerCase());
                          return (
                            <label key={i} className={cn("flex items-center gap-3 p-3 border rounded-[8px] cursor-pointer ", isFound ? "border-primary/50 bg-primary/5" : "border-border hover:bg-bento-item")}>
                              <input 
                                type="checkbox" 
                                checked={keywordChecks[kw] || false} 
                                onChange={(e) => session.setKeywordCheck(kw, e.target.checked)} 
                                className="w-4 h-4 shrink-0 appearance-none border border-border bg-bento-card rounded-[8px] checked:bg-foreground/10 checked:border-border/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3px] after:h-[7px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 cursor-pointer transition-all hover:border-border/20"
                              />
                              <span className={cn("text-xs font-bold", isFound ? "text-foreground" : "text-muted-foreground")}>{kw} {isFound && <span className="text-[9px] uppercase tracking-widest text-foreground opacity-40 ml-2">(Found in your answer)</span>}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              {isRevealed && (
                <Button 
                  onClick={handleExplainMore}
                  variant="outline"
                  className="h-9 px-3 border border-border bg-bento-item hover:border-foreground/40 text-foreground/80 hover:text-foreground text-[10px] font-black uppercase tracking-wider rounded-[8px] flex items-center justify-center gap-1.5 transition-colors"
                  title="Explain more about this question"
                >
                  <BookOpen size={12} />
                  <span>Explain</span>
                </Button>
              )}
              {['writing', 'scenario', 'code', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis', 'find_error'].includes(currentQ.type || 'writing') ? (
                <>
                  <Button onClick={() => handleSelfGrade(false)} variant="outline" className="flex-1 font-black tracking-widest uppercase text-[10px] h-9 rounded-[8px]  border-destructive/20 text-destructive/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-none">
                    Wrong
                  </Button>
                  <Button 
                    onClick={() => handleSelfGrade(true)} 
                    disabled={Array.isArray(currentQ.required_keywords) && currentQ.required_keywords.length > 0 && currentQ.required_keywords.some((kw: string) => !keywordChecks[kw])}
                    className="flex-1 bg-primary text-primary-foreground font-black tracking-widest uppercase text-[10px] h-9 rounded-[8px] hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-none"
                    title={Array.isArray(currentQ.required_keywords) && currentQ.required_keywords.some((kw: string) => !keywordChecks[kw]) ? "Check all mandatory concepts to mark as correct" : ""}
                  >
                    Correct
                  </Button>
                </>
              ) : (
                currentIdx < questions.length - 1 ? (
                  <Button 
                    onClick={nextQuestion}
                    variant="outline"
                    className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-[8px] border-border bg-bento-item hover:bg-bento-item/80"
                  >
                    <span>Next Question</span>
                    <ArrowRight size={14} className="ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={nextQuestion}
                    className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-[8px] "
                  >
                    <span>Finish & View Score</span>
                  </Button>
                )
              )}
            </div>
          </div>
          {localArtifacts.length > 0 && (
            <div className="flex-1 min-w-[360px] border-t md:border-t-0 md:border-l border-border h-[420px] rounded-[8px] overflow-hidden bg-bento-panel flex flex-col shrink-0">
              <UnifiedSandboxViewer shielded={false} customArtifacts={localArtifacts} onClose={() => {}} />
            </div>
          )}
        </div>
      </div>
      )}

      {explainOpen && explainQuestion && (() => {
        const rawAns = userAnswers[explainQuestion.id];
        const formattedUserAnswer = Array.isArray(rawAns)
          ? rawAns.join(', ')
          : typeof rawAns === 'object' && rawAns !== null
            ? JSON.stringify(rawAns)
            : rawAns !== undefined && rawAns !== null ? String(rawAns) : '';
        const { initialFetcher, followUpFetcher } = makePracticeExplainFetchers({
          question: explainQuestion.question,
          type: explainQuestion.type,
          answer: (explainQuestion as any).answer,
          explanation: explainQuestion.explanation,
          context: (explainQuestion as any).content || (explainQuestion as any).codeSnippet || '',
          userAnswer: formattedUserAnswer,
          isCorrect: scores[explainQuestion.id] ?? false,
          notePath: explainQuestion.note_id || notePath,
        });
        return (
          <AterExplainDialog
            isOpen={explainOpen}
            onClose={() => { setExplainOpen(false); setExplainQuestion(null); }}
            contextLabel={explainQuestion.question}
            initialFetcher={initialFetcher}
            followUpFetcher={followUpFetcher}
          />
        );
      })()}
    </div>
  );
}