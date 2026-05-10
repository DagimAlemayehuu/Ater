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
import { MermaidWrapper } from './obsidian/MarkdownViewer';
import { usePomodoroStore } from '@/lib/pomodoroStore';

// Density optimized CodeBlock
const CodeBlock = ({ language, value }: { language: string | null, value: string }) => {
    const [copied, setCopied] = useState(false);
    const isDark = document.documentElement.classList.contains('dark');

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-2 rounded-lg border border-border/20 overflow-hidden bg-transparent  hover:border-border/40 not-prose">
            <div className={cn(
                "flex items-center justify-between px-3 py-1 border-b border-border/5 bg-muted/5 ",
                !language && "opacity-0 group-hover:opacity-100"
            )}>
                <div className="flex items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 select-none">
                        {language || 'code'}
                    </span>
                </div>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-muted/20 rounded text-muted-foreground/50 hover:text-foreground group/copy"
                    title="Copy Code"
                >
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover/copy:opacity-100 ">
                        {copied ? 'Copied' : 'Copy'}
                    </span>
                    {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} className="group-hover/copy:scale-110 transition-transform" />}
                </button>
            </div>
            
            <div className="relative overflow-hidden">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={isDark ? (vscDarkPlus as any) : (vs as any)}
                    PreTag="div"
                    customStyle={{
                        background: 'transparent',
                        padding: '0.75rem 1rem',
                        margin: 0,
                        fontSize: '11px',
                        lineHeight: '1.5',
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
    <div className="prose prose-xs prose-zinc dark:prose-invert max-w-none text-foreground/90 prose-p:my-0 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-p:inline prose-div:inline">
      <ReactMarkdown 
        remarkPlugins={[remarkMath, remarkGfm]} 
        rehypePlugins={[[rehypeKatex, {strict: false, throwOnError: false}]]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
            const language = match ? match[1] : null
            const isInline = !match && !String(children).includes('\n');
            
            if (language === 'mermaid') return <MermaidWrapper chart={String(children).replace(/\n$/, '')} />
            
            if (!isInline) {
              return <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />
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
  notePath?: string;
}

export default function MiniPracticeUI({ question, notePath }: MiniPracticeUIProps) {
  const { addPracticeResult, currentHub } = usePomodoroStore();
  const questions = Array.isArray(question) ? question : [question];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number | string, any>>({});
  const [revealedStates, setRevealedStates] = useState<Record<number, boolean>>({});
  const [scores, setScores] = useState<Record<number, boolean>>({});
  const [showScore, setShowScore] = useState(false);
  const [keywordChecks, setKeywordChecks] = useState<Record<string, boolean>>({});

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
    } else if (currentQ.type === 'fill_in') {
        const userAnswersArr = userAnswers[currentQ.id] || [];
        const rawAnswer = currentQ.answer || [];
        const correctAnswersArr = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];
        
        isCorrect = correctAnswersArr.every((ans: string, idx: number) => 
            String(userAnswersArr[idx] || '').trim().toLowerCase() === String(ans || '').trim().toLowerCase()
        );
        setScores({...scores, [currentIdx]: isCorrect});
    } else if (currentQ.type === 'matching') {
        const userPairs = userAnswers[currentQ.id] || {};
        const correctPairs = currentQ.pairs || [];
        isCorrect = Array.isArray(correctPairs) && correctPairs.every((p: any) => 
            String(userPairs[p.left] || '').trim().toLowerCase() === String(p.right || '').trim().toLowerCase()
        );
        setScores({...scores, [currentIdx]: isCorrect});
    } else if (currentQ.type === 'order') {
        const userOrder = userAnswers[currentQ.id] || currentQ.steps || [];
        const correctOrder = currentQ.answer || [];
        isCorrect = Array.isArray(correctOrder) && correctOrder.every((step: string, idx: number) => 
            String(userOrder[idx] || '').trim().toLowerCase() === String(step).trim().toLowerCase()
        );
        setScores({...scores, [currentIdx]: isCorrect});
    }
    
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
      setKeywordChecks({});
    }
  };

  const finishQuiz = () => {
    const score = Object.values(scores).filter(Boolean).length;
    addPracticeResult(currentHub, score, questions.length, notePath);
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
    const text = currentQ.textWithBlanks || currentQ.text_with_blanks || '';
    const parts = text.split(/\[\[.*?\]\]/);
    return parts.map((part: string, i: number) => (
      <React.Fragment key={i}>
        <div className="inline-block align-middle"><MarkdownBlock content={part} /></div>
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
                "mx-0.5 px-2 py-0.5 border border-primary/40 bg-muted/10 rounded focus:outline-none focus:border-primary w-32 text-center font-bold tracking-widest text-[12px] inline-block",
                isRevealed 
                  ? "border-muted-foreground/30 text-foreground/50 opacity-80"
                  : "border-primary/40 focus:border-primary text-foreground"
              )}
            />
            {isRevealed && String((userAnswers[currentQ.id] || [])[i] || '').toLowerCase() !== String((currentQ.answer || [])[i] || '').toLowerCase() && (
               <div className="text-[10px] text-primary font-bold mt-1">Correct: {String((currentQ.answer || [])[i] || '')}</div>
            )}
          </div>
        )}
      </React.Fragment>
    ));
  };

  if (!currentQ && !showScore) return null;

  return (
    <div className="my-1 border border-border rounded-xl overflow-hidden bg-background shadow-sm not-prose">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/5">
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
        <div className="p-4 flex flex-col items-center justify-center space-y-3 text-center   zoom-in ">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
            <Check size={24} className="text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-black tracking-tight text-foreground/90">Challenge Complete</h2>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Active recall sequence finished</p>
          </div>
          <div className="text-3xl font-black text-primary tabular-nums">
            {Object.values(scores).filter(Boolean).length} <span className="text-xl text-muted-foreground/30">/ {questions.length}</span>
          </div>
          <Button onClick={resetQuiz} className="mt-2 font-black uppercase tracking-[0.2em] text-[10px] h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20  active:scale-95">
            <RotateCcw size={12} className="mr-2" /> Restart
          </Button>
        </div>
      ) : (
        <div className="p-3 flex flex-col justify-center space-y-2 min-h-[120px]">
          <div className="space-y-2  slide-in-from-top-4  duration-700" key={`header-${currentQ.id}`}>
              <div className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/40 flex items-center gap-2">
    <Badge variant="outline" className="text-[7px] border-border/40 bg-muted/20 text-muted-foreground rounded-md px-1.5 py-0">{currentQ.difficulty || '1'}</Badge>
    <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/20" />
    <span>{(
        {
            'mcq': 'Multiple Choice',
            'true_false': 'True or False',
            'writing': 'Writing / Essay',
            'fill_in': 'Fill in the Blank',
            'debug': 'Debugging / Error Finding',
            'trace': 'Logic / Calculation Trace',
            'order': 'Ordering / Steps',
            'matching': 'Matching Pairs',
            'synthesis': 'Synthesis / Scenario',
            'calculation': 'Math / Calculation',
            'data_analysis': 'Data Analysis',
            'scenario': 'Scenario Analysis',
            'code': 'Code / Implementation'
        } as any)[currentQ.type as string] || (currentQ.type || '').replace('_', ' ')
    }</span>
    </div>
              {currentQ.type !== 'fill_in' && (
                <div className="text-[13px] font-bold tracking-tight leading-snug text-foreground/90 max-w-3xl">
                  <MarkdownBlock content={currentQ.question} />
                </div>
              )}
          </div>

          <div className="space-y-4   slide-in-from-bottom-2  delay-200" key={`body-${currentQ.id}`}>
              
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
                          "group flex items-center gap-2 p-1.5 border rounded-lg text-left  ", 
                          isCorrectHighlight 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : isSelected && !isRevealed 
                              ? "border-foreground bg-foreground/5 shadow-md" 
                              : "border-border/40 hover:border-foreground/20 hover:bg-muted/5", 
                          isRevealed && !isCorrectHighlight ? "opacity-30 grayscale" : ""
                      )}
                      >
                      <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-black border ", 
                          isCorrectHighlight || (isSelected && !isRevealed) 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "border-border text-muted-foreground/40 group-hover:border-foreground/30"
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

              {/* Fill In Blank */}
              
               {currentQ.type === 'order' && (
              <div className="space-y-1.5 max-w-2xl mx-auto">
              {(userAnswers[currentQ.id] || currentQ.steps || []).map((step: string, i: number) => {
                  const list = userAnswers[currentQ.id] || currentQ.steps || [];
                  const moveUp = () => { if(i>0) { const n = [...list]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleSelectAnswer(n); } };
                  const moveDown = () => { if(i<list.length-1) { const n = [...list]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleSelectAnswer(n); } };
                  const isCorrect = isRevealed && step === (currentQ.answer || [])[i];
                  return (
                      <div key={i} className={cn(
                          "group flex items-center gap-2 p-2 border rounded-lg ",
                          isCorrect 
                            ? "border-foreground bg-muted/20" 
                            : "border-border/40 bg-muted/5 hover:border-foreground/20"
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

              {currentQ.type === 'matching' && currentQ.pairs && (
              <div className="space-y-3 max-w-3xl mx-auto">
              {currentQ.pairs.map((pair: any, i: number) => {
                  const rights = currentQ.pairs.map((p: any) => p.right).sort();
                  const selected = (userAnswers[currentQ.id] || {})[pair.left] || "";
                  const isCorrect = isRevealed && selected === pair.right;
                  return (
                      <div key={i} className={cn(
                          "flex items-center gap-2 p-1.5 border rounded-lg ",
                          isCorrect ? "border-foreground bg-muted/20" : "border-border/40 bg-muted/5"
                      )}>
                          <div className="flex-1 font-black uppercase tracking-widest text-[8px] text-muted-foreground/60">{pair.left}</div>
                          <div className="flex-1">
                              <select 
                                disabled={isRevealed} 
                                value={selected} 
                                onChange={(e) => handleSelectAnswer({...userAnswers[currentQ.id], [pair.left]: e.target.value})} 
                                className="w-full px-3 py-2 bg-background border border-border/10 rounded-lg outline-none focus:border-foreground/50 text-[10px] font-black uppercase tracking-widest  appearance-none cursor-pointer hover:border-border/40"
                              >
                                  <option value="">Select Match...</option>
                                  {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                              </select>
                          </div>
                          {isRevealed && !isCorrect && (
                            <div className="flex-1  slide-in-from-right-2  ">
                                <div className="text-[8px] font-black uppercase text-foreground/40 mb-1">Correct Match</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-foreground">{pair.right}</div>
                            </div>
                          )}
                      </div>
                  )
              })}
              </div>
              )}

              {currentQ.type === 'fill_in' && (
                <div className="p-3 bg-muted/5 border border-border/50 rounded-lg leading-relaxed text-xs font-medium tracking-tight text-foreground/70 shadow-inner">
                  {renderFillInBlanks()}
                </div>
              )}

              {/* Writing / Scenario / Code / Debug / Synthesis */}
              {(!currentQ.type || ['debug', 'writing', 'scenario', 'code', 'synthesis', 'trace', 'calculation', 'data_analysis'].includes(currentQ.type)) && (
              <div className="space-y-3">
                   {(currentQ.content || currentQ.codeSnippet) && (
                  <div className="p-2 bg-muted/5 border border-border/50 rounded-lg shadow-inner">
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
                      placeholder=""
                      className="w-full min-h-[70px] p-3 bg-muted/20 border-2 border-primary/20 rounded-xl focus:outline-none focus:border-primary text-[12px] font-medium tracking-tight text-foreground  resize-y shadow-md"
                  />
              </div>
              )}

              {!isRevealed ? (
              <div className="pt-2">
                   <Button 
                   onClick={checkAnswer} 
                   disabled={userAnswers[currentQ.id] === undefined || userAnswers[currentQ.id] === '' || (Array.isArray(userAnswers[currentQ.id]) && userAnswers[currentQ.id].length === 0)}
                   className="w-full font-black tracking-widest uppercase text-[10px] h-9 rounded-lg "
                   >
                   Verify Understanding
                   </Button>
              </div>
              ) : (
                <div className="mt-2 space-y-2   slide-in-from-top-4 ">
                <div className="p-3 sm:p-4 border-2 border-border bg-muted/10 rounded-xl space-y-3 shadow-xl shadow-foreground/5">
                  <div className="flex items-center gap-2 text-foreground/80 font-black uppercase text-[10px] tracking-[0.2em]">
                    <div className="w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center">
                      <Check size={10} />
                    </div>
                    <span>Correct Answer</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Definitive Answer</div>
                    <div className="text-xs font-bold text-foreground/90 leading-relaxed">
                      {Array.isArray(currentQ.answer) ? currentQ.answer.join(', ') : currentQ.answer}
                    </div>
                  </div>
 
                  <div className="space-y-1 pt-2 border-t border-border/10">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Explanation</div>
                    <div className="text-xs font-medium leading-relaxed text-foreground/80">
                      <MarkdownBlock content={currentQ.explanation || "No explanation provided."} />
                    </div>
                  </div>

                  {currentQ.type === 'trace' && currentQ.steps && (
                    <div className="space-y-2 pt-3 border-t border-border/10">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-2">Causal Chain Logic</div>
                      <div className="space-y-1.5 pl-2">
                        {currentQ.steps.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            <div className="text-[11px] font-bold text-foreground/70 leading-snug">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {['writing', 'scenario', 'code', 'debug', 'synthesis', 'trace'].includes(currentQ.type) && Array.isArray(currentQ.required_keywords) && currentQ.required_keywords.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border/10">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Mandatory Concepts Checklist</div>
                        <div className="text-[10px] font-black tabular-nums text-muted-foreground/50">
                          {currentQ.required_keywords.filter((kw: string) => String(userAnswers[currentQ.id] || '').toLowerCase().includes(kw.toLowerCase())).length} / {currentQ.required_keywords.length} Found
                        </div>
                      </div>
                      
                      {currentQ.required_keywords.filter((kw: string) => !String(userAnswers[currentQ.id] || '').toLowerCase().includes(kw.toLowerCase())).length > 0 && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs font-bold text-destructive/90 mb-4">
                          Warning: Your answer is missing core concepts. Are you sure you mastered this?
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2">
                        {currentQ.required_keywords.map((kw: string, i: number) => {
                          const isFound = String(userAnswers[currentQ.id] || '').toLowerCase().includes(kw.toLowerCase());
                          return (
                            <label key={i} className={cn("flex items-center gap-3 p-3 border rounded-lg cursor-pointer ", isFound ? "border-primary/50 bg-primary/5" : "border-border/40 hover:bg-muted/10")}>
                              <input type="checkbox" checked={keywordChecks[kw] || false} onChange={(e) => setKeywordChecks({...keywordChecks, [kw]: e.target.checked})} className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary" />
                              <span className={cn("text-xs font-bold", isFound ? "text-foreground" : "text-muted-foreground")}>{kw} {isFound && <span className="text-[9px] uppercase tracking-widest text-primary ml-2">(Found in your answer)</span>}</span>
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
                      {['writing', 'scenario', 'code', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis'].includes(currentQ.type || 'writing') ? (
                          <>
                              <Button onClick={() => handleSelfGrade(false)} variant="outline" className="flex-1 font-black tracking-widest uppercase text-[10px] h-9 rounded-lg  border-destructive/20 text-destructive/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 active:scale-95 transition-all">
                                  Wrong
                              </Button>
                              <Button 
                                onClick={() => handleSelfGrade(true)} 
                                disabled={Array.isArray(currentQ.required_keywords) && currentQ.required_keywords.length > 0 && currentQ.required_keywords.some((kw: string) => !keywordChecks[kw])}
                                className="flex-1 bg-primary text-primary-foreground font-black tracking-widest uppercase text-[10px] h-9 rounded-lg  hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                              className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-lg  border-border hover:bg-muted/20"
                            >
                              <span>Next Question</span>
                              <ArrowRight size={14} className="ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              onClick={finishQuiz}
                              className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-lg "
                            >
                              <span>Finish & View Score</span>
                            </Button>
                          )
                      )}
                  </div>
              </div>
            </div>
          )}
    </div>
  );
}