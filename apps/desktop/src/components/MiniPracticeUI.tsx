import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, RotateCcw, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, value }: { language: string | null, value: string }) => {
    const [copied, setCopied] = useState(false);
    const isDark = document.documentElement.classList.contains('dark');

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded-xl border border-border/20 overflow-hidden bg-transparent transition-all hover:border-border/40 not-prose">
            <div className={cn(
                "flex items-center justify-between px-5 py-1.5 border-b border-border/5 bg-muted/5 transition-opacity",
                !language && "opacity-0 group-hover:opacity-100"
            )}>
                <div className="flex items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 select-none">
                        {language || 'code'}
                    </span>
                </div>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-muted/20 rounded-md transition-all text-muted-foreground/50 hover:text-foreground group/copy"
                    title="Copy Code"
                >
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover/copy:opacity-100 transition-opacity">
                        {copied ? 'Copied' : 'Copy'}
                    </span>
                    {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} className="group-hover/copy:scale-110 transition-transform" />}
                </button>
            </div>
            
            <div className="relative overflow-hidden">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={isDark ? (vscDarkPlus as any) : (vs as any)}
                    PreTag="div"
                    customStyle={{
                        background: 'transparent',
                        padding: language ? '1.25rem 1.5rem' : '1.5rem',
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.7',
                        fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace',
                        overflowX: 'auto',
                        WebkitFontSmoothing: 'antialiased'
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            background: 'transparent'
                        }
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export const MarkdownBlock = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-foreground/90 prose-p:my-0 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0">
      <ReactMarkdown 
        remarkPlugins={[remarkMath, remarkGfm]} 
        rehypePlugins={[[rehypeKatex, {strict: false, throwOnError: false}]]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n');
            if (!isInline) {
              return <CodeBlock language={match ? match[1] : null} value={String(children).replace(/\n$/, '')} />
            }
            return <code className={cn("bg-muted/30 px-1 py-0.5 rounded text-[11px] font-mono", className)} {...props}>{children}</code>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface MiniPracticeUIProps {
  question: any;
}

export default function MiniPracticeUI({ question }: MiniPracticeUIProps) {
  const questions = Array.isArray(question) ? question : [question];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number | string, any>>({});
  const [revealedStates, setRevealedStates] = useState<Record<number, boolean>>({});
  const [scores, setScores] = useState<Record<number, boolean>>({});
  const [showScore, setShowScore] = useState(false);

  const currentQ = questions[currentIdx];

  const isRevealed = revealedStates[currentIdx] || false;

  const handleSelectAnswer = (val: any) => {
    if (!isRevealed) setUserAnswers({ ...userAnswers, [currentQ.id]: val });
  };

  const checkAnswer = () => {
    const ans = userAnswers[currentQ.id];
    if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) return;

    let isCorrect = false;
    const userVal = String(ans).trim().toLowerCase();
    const correctVal = String(currentQ.answer).trim().toLowerCase();

    if (currentQ.type === 'true_false') {
        isCorrect = userVal === correctVal;
        setScores({...scores, [currentIdx]: isCorrect});
    } else if (currentQ.type === 'mcq') {
        isCorrect = userVal === correctVal;
        if (currentQ.options && !isCorrect) {
            const correctText = String(currentQ.options[currentQ.answer] || '').trim().toLowerCase();
            isCorrect = userVal === correctText;
        }
        setScores({...scores, [currentIdx]: isCorrect});
    }
    // fill_in, writing, debug, etc. will now be self-graded by the user via Correct/Wrong buttons.
    
    setRevealedStates({ ...revealedStates, [currentIdx]: true });
  };

  const handleSelfGrade = (isCorrect: boolean) => {
    setScores({...scores, [currentIdx]: isCorrect});
    if (currentIdx < questions.length - 1) {
      nextQuestion();
    } else {
      finishQuiz();
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const finishQuiz = () => {
    setShowScore(true);
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setUserAnswers({});
    setRevealedStates({});
    setScores({});
    setShowScore(false);
  };

  const renderFillInBlanks = () => {
    const text = currentQ.textWithBlanks || '';
    const parts = text.split(/\[\[.*?\]\]/);
    return parts.map((part: string, i: number) => (
      <React.Fragment key={i}>
        <div className="inline-block align-middle"><MarkdownBlock content={part} /></div>
        {i < parts.length - 1 && (
          <input
            type="text"
            disabled={isRevealed}
            value={(userAnswers[currentQ.id] || [])[i] || ''}
            onChange={(e) => {
              const newAns = [...(userAnswers[currentQ.id] || [])];
              newAns[i] = e.target.value;
              handleSelectAnswer(newAns);
            }}
            placeholder="..."
            className={cn(
              "mx-1 px-2 py-0.5 border-b-2 bg-transparent focus:outline-none transition-all w-32 text-center placeholder:opacity-20 font-bold tracking-widest text-[12px] inline-block",
              isRevealed 
                ? "border-muted-foreground/30 text-foreground"
                : "border-muted-foreground/20 focus:border-foreground text-foreground"
            )}
          />
        )}
      </React.Fragment>
    ));
  };

  if (!currentQ && !showScore) return null;

  return (
    <div className="my-6 border border-border rounded-xl overflow-hidden bg-background shadow-sm not-prose">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/5">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          <span>Active Recall Challenge</span>
        </div>
        {questions.length > 1 && !showScore && (
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            Progress: <span className="text-foreground">{currentIdx + 1} / {questions.length}</span>
          </div>
        )}
      </div>
      
      {showScore ? (
        <div className="p-10 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
          <h2 className="text-xl font-black tracking-tight text-foreground/80">Challenge Complete</h2>
          <div className="text-5xl font-black text-primary">
            {Object.values(scores).filter(Boolean).length} <span className="text-2xl text-muted-foreground">/ {questions.length}</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Final Score</p>
          <Button onClick={resetQuiz} className="mt-4 font-black uppercase tracking-widest text-[10px] h-10 px-8 rounded-lg">
            <RotateCcw size={14} className="mr-2" /> Restart Challenge
          </Button>
        </div>
      ) : (
        <div className="p-5 lg:p-6 flex flex-col justify-center space-y-6">
          <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-700" key={`header-${currentQ.id}`}>
              <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              <Badge variant="outline" className="text-[7px] px-1.5 py-0 border-border/50 rounded-sm uppercase bg-muted/5">
                  {currentQ.difficulty || 'L3'}
              </Badge>
              <div className="w-1 h-1 rounded-full bg-border/50"/>
              <span>{(currentQ.type || 'Application Challenge').replace('_', ' ')}</span>
              </div>
              {currentQ.type !== 'fill_in' && (
                <div className="text-base lg:text-lg font-bold tracking-tight leading-snug text-foreground">
                  <MarkdownBlock content={currentQ.question} />
                </div>
              )}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200" key={`body-${currentQ.id}`}>
              
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
                          "group flex items-center gap-4 p-3 border-2 rounded-lg text-left transition-all duration-300", 
                          isCorrectHighlight 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : isSelected && !isRevealed 
                              ? "border-foreground bg-foreground/5 shadow-md scale-[1.01]" 
                              : "border-border/40 hover:border-foreground/20 hover:bg-muted/5", 
                          isRevealed && !isCorrectHighlight ? "opacity-30 grayscale scale-[0.98]" : ""
                      )}
                      >
                      <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border transition-all", 
                          isCorrectHighlight || (isSelected && !isRevealed) 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/10 border-border/50 text-muted-foreground/40 group-hover:border-foreground/40 group-hover:text-foreground/60"
                      )}>
                          {key}
                      </div>
                      <div className="text-xs font-semibold tracking-tight text-foreground/80 group-hover:text-foreground">
                          <MarkdownBlock content={String(val)} />
                      </div>
                      </button>
                  );
                  })}
              </div>
              )}

              {/* Fill In Blank */}
              
              {currentQ.type === 'order' && (
              <div className="space-y-3">
              {(userAnswers[currentQ.id] || currentQ.steps || []).map((step: string, i: number) => {
                  const list = userAnswers[currentQ.id] || currentQ.steps || [];
                  const moveUp = () => { if(i>0) { const n = [...list]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleSelectAnswer(n); } };
                  const moveDown = () => { if(i<list.length-1) { const n = [...list]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleSelectAnswer(n); } };
                  const isCorrect = isRevealed && step === (currentQ.answer || [])[i];
                  return (
                      <div key={i} className={`flex items-center gap-3 p-4 border rounded-lg ${isCorrect ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/40 hover:bg-muted/5'}`}>
                          <div className="flex flex-col gap-1 border-r border-border/50 pr-3">
                              <button disabled={isRevealed || i===0} onClick={moveUp} className="text-[10px] px-1 opacity-50 hover:opacity-100 hover:text-primary transition-colors">▲</button>
                              <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-[10px] px-1 opacity-50 hover:opacity-100 hover:text-primary transition-colors">▼</button>
                          </div>
                          <div className="text-xs font-medium tracking-tight text-foreground/90 pl-1">{step}</div>
                      </div>
                  )
              })}
              </div>
              )}

              {currentQ.type === 'matching' && currentQ.pairs && (
              <div className="space-y-4">
              {currentQ.pairs.map((pair: any, i: number) => {
                  const rights = currentQ.pairs.map((p: any) => p.right).sort();
                  const selected = (userAnswers[currentQ.id] || {})[pair.left] || "";
                  const isCorrect = isRevealed && selected === pair.right;
                  return (
                      <div key={i} className={`flex items-center gap-4 p-4 border rounded-lg ${isCorrect ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/40'}`}>
                          <div className="flex-1 font-medium tracking-tight text-xs text-foreground/90">{pair.left}</div>
                          <div className="flex-1">
                              <select disabled={isRevealed} value={selected} onChange={(e) => handleSelectAnswer({...userAnswers[currentQ.id], [pair.left]: e.target.value})} className="w-full p-2.5 bg-background border border-border/50 rounded-md outline-none focus:border-foreground/50 text-xs font-medium text-foreground/80 transition-colors">
                                  <option value="">Select match...</option>
                                  {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                              </select>
                          </div>
                          {isRevealed && !isCorrect && <div className="text-[10px] uppercase tracking-widest text-primary font-bold w-1/3 break-words">{pair.right}</div>}
                      </div>
                  )
              })}
              </div>
              )}

              {currentQ.type === 'fill_in' && (
                <div className="p-5 bg-muted/5 border border-border/50 rounded-lg leading-[2] text-xs font-medium tracking-tight text-foreground/70 shadow-inner">
                  {renderFillInBlanks()}
                </div>
              )}

              {/* Writing / Scenario / Code / Debug / Synthesis */}
              {(!currentQ.type || ['debug', 'writing', 'scenario', 'code', 'synthesis', 'trace'].includes(currentQ.type)) && (
              <div className="space-y-3">
                  {(currentQ.content || currentQ.codeSnippet) && (
                  <div className="p-4 bg-muted/5 border border-border/50 rounded-lg shadow-inner">
                      <MarkdownBlock 
                        content={
                          ['debug', 'code', 'trace'].includes(currentQ.type) && !(currentQ.content || currentQ.codeSnippet).includes('```') 
                            ? `\`\`\`${currentQ.language || 'text'}\n${currentQ.content || currentQ.codeSnippet}\n\`\`\``
                            : (currentQ.content || currentQ.codeSnippet)
                        } 
                      />
                  </div>
                  )}
                  <textarea
                      disabled={isRevealed}
                      value={userAnswers[currentQ.id] || ''}
                      onChange={(e) => handleSelectAnswer(e.target.value)}
                      placeholder="Write your analysis here..."
                      className="w-full min-h-[80px] p-4 bg-background border-2 border-border/40 rounded-lg focus:outline-none focus:border-foreground/50 text-xs font-medium tracking-tight text-foreground/80 transition-colors resize-y"
                  />
              </div>
              )}

              {!isRevealed ? (
              <div className="pt-2">
                  <Button 
                  onClick={checkAnswer} 
                  disabled={userAnswers[currentQ.id] === undefined || userAnswers[currentQ.id] === '' || (Array.isArray(userAnswers[currentQ.id]) && userAnswers[currentQ.id].length === 0)}
                  className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-lg transition-all"
                  >
                  Verify Understanding
                  </Button>
              </div>
              ) : (
              <div className="mt-4 space-y-4">
                  <div className="p-6 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                        <Check size={14} />
                        <span>Explanation & Solution</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Correct Answer</div>
                        <div className="text-xs font-bold text-foreground">
                          {Array.isArray(currentQ.answer) ? currentQ.answer.join(', ') : currentQ.answer}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Explanation</div>
                        <div className="text-xs font-medium leading-relaxed text-foreground/80">
                          <MarkdownBlock content={currentQ.explanation || "No explanation provided."} />
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex gap-3">
                      {['fill_in', 'writing', 'scenario', 'code', 'debug', 'synthesis', 'trace'].includes(currentQ.type || 'writing') ? (
                          <>
                              <Button onClick={() => handleSelfGrade(false)} variant="outline" className="flex-1 font-black tracking-widest uppercase text-[10px] h-10 rounded-lg transition-all border-destructive/20 text-destructive/60 hover:bg-destructive/5 hover:text-destructive">
                                  Wrong
                              </Button>
                              <Button onClick={() => handleSelfGrade(true)} className="flex-1 bg-primary text-primary-foreground font-black tracking-widest uppercase text-[10px] h-10 rounded-lg transition-all hover:bg-primary/90">
                                  Correct
                              </Button>
                          </>
                      ) : (
                          currentIdx < questions.length - 1 ? (
                            <Button 
                              onClick={nextQuestion}
                              variant="outline"
                              className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-lg transition-all border-border hover:bg-muted/20"
                            >
                              <span>Next Question</span>
                              <ArrowRight size={14} className="ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              onClick={finishQuiz}
                              className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-lg transition-all"
                            >
                              <span>Finish & View Score</span>
                            </Button>
                          )
                      )}
                  </div>
              </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}