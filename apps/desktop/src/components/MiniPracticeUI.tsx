import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, BrainCircuit, ArrowRight, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const MarkdownBlock = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-foreground/90 prose-p:my-0 prose-pre:my-2 prose-pre:bg-muted/10 prose-pre:border prose-pre:border-border/50">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[[rehypeKatex, {strict: false, throwOnError: false}]]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n');
            if (!isInline && match) {
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ background: 'transparent', margin: 0, padding: '1rem', fontSize: '12px' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
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
  // Support both single question object or array of questions
  const questions = Array.isArray(question) ? question : [question];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number | string, any>>({});
  const [revealedStates, setRevealedStates] = useState<Record<number, boolean>>({});

  const currentQ = questions[currentIdx];
  if (!currentQ) return null;

  const isRevealed = revealedStates[currentIdx] || false;

  const handleSelectAnswer = (val: any) => {
    if (!isRevealed) setUserAnswers({ ...userAnswers, [currentQ.id]: val });
  };

  const checkAnswer = () => {
    const ans = userAnswers[currentQ.id];
    if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) return;
    setRevealedStates({ ...revealedStates, [currentIdx]: true });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setUserAnswers({});
    setRevealedStates({});
  };

  const renderFillInBlanks = () => {
    const text = currentQ.textWithBlanks || '';
    const parts = text.split(/\[\[.*?\]\]/);
    return parts.map((part: string, i: number) => (
      <React.Fragment key={i}>
        {part}
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
                ? (String((userAnswers[currentQ.id] || [])[i] || '').toLowerCase() === String((currentQ.answer || [])[i] || '').toLowerCase() ? "border-primary text-primary" : "border-destructive text-destructive")
                : "border-muted-foreground/20 focus:border-foreground text-foreground"
            )}
          />
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="my-6 border border-border rounded-xl overflow-hidden bg-background shadow-sm not-prose">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/5">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          <BrainCircuit size={12} className="text-primary" />
          <span>Active Recall Challenge</span>
        </div>
        {questions.length > 1 && (
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            Progress: <span className="text-foreground">{currentIdx + 1} / {questions.length}</span>
          </div>
        )}
      </div>
      
      <div className="p-5 lg:p-6 flex flex-col justify-center space-y-6">
        <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-700" key={`header-${currentQ.id}`}>
            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            <Badge variant="outline" className="text-[7px] px-1.5 py-0 border-border/50 rounded-sm uppercase bg-muted/5">
                {currentQ.difficulty || 'L3'}
            </Badge>
            <div className="w-1 h-1 rounded-full bg-border/50"/>
            <span>{(currentQ.type || 'Application Challenge').replace('_', ' ')}</span>
            </div>
            <div className="text-base lg:text-lg font-bold tracking-tight leading-snug text-foreground">
              <MarkdownBlock content={currentQ.question} />
            </div>
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
            {currentQ.type === 'fill_in' && (
              <div className="p-5 bg-muted/5 border border-border/50 rounded-lg leading-[2] text-xs font-medium tracking-tight text-foreground/70 shadow-inner">
                {renderFillInBlanks()}
              </div>
            )}

            {/* Writing / Scenario / Code / Debug / Synthesis */}
            {(!currentQ.type || ['debug', 'writing', 'scenario', 'code', 'synthesis'].includes(currentQ.type)) && (
            <div className="space-y-3">
                {(currentQ.content || currentQ.codeSnippet) && (
                <div className="p-4 bg-muted/5 border border-border/50 rounded-lg shadow-inner">
                    <MarkdownBlock content={currentQ.content || currentQ.codeSnippet} />
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
            <div className="mt-4 space-y-3">
                <div className="p-5 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                    <Check size={14} />
                    <span>Explanation & Solution</span>
                    </div>
                    <div className="text-xs font-medium leading-relaxed text-foreground/80">
                      <MarkdownBlock content={currentQ.explanation || "No explanation provided."} />
                    </div>
                </div>
                
                {currentIdx < questions.length - 1 ? (
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
                    onClick={resetQuiz}
                    variant="outline"
                    className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-lg transition-all border-border hover:bg-muted/20"
                  >
                    <RotateCcw size={14} className="mr-2" />
                    <span>Restart Challenge</span>
                  </Button>
                )}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}