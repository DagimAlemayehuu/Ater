import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AterMarkdown } from './MarkdownViewer';
import { 
    X, Send, RefreshCw, Check, ArrowRight, Loader2
} from 'lucide-react';
import { sidecarApi } from '@/lib/sidecarApi';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface QuizQuestion {
    question: string;
    type: 'multiple-choice' | 'true-false';
    options: string[];
    answer: string;
    explanation: string;
}

interface AiSidecarProps {
    selection: string;
    path: string;
    page?: number;
    onClose: () => void;
    initialMode?: 'explain' | 'quiz';
    /** v33.0: active note metadata for persona-aware explain */
    noteMode?: string;
    noteTitle?: string;
    noteCourse?: string;
}

export const AiSidecar: React.FC<AiSidecarProps> = ({ 
    selection, 
    path, 
    page, 
    onClose,
    initialMode = 'explain',
    noteMode,
    noteTitle,
    noteCourse,
}) => {
    const [mode, setMode] = useState<'explain' | 'quiz'>(initialMode);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [personaLabel, setPersonaLabel] = useState('AI Tutor');
    
    // Quiz State
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [score, setScore] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleInitialExplain = useCallback(async () => {
        setIsThinking(true);
        setMessages([]);
        try {
            const data = await sidecarApi.explainPdfSelection({ 
                path, 
                selection, 
                page,
                note_mode: noteMode,
                note_title: noteTitle,
                note_course: noteCourse,
            });
            // v33.0: Update persona label from response
            if (data.persona) {
                setPersonaLabel(data.persona);
            }
            setMessages([{ role: 'assistant', content: data.answer }]);
        } catch (e: unknown) {
            setMessages([{ role: 'assistant', content: `Error: ${(e as Error).message}` }]);
        } finally {
            setIsThinking(false);
        }
    }, [path, selection, page, noteMode, noteTitle, noteCourse]);

    const handleInitialQuiz = useCallback(async () => {
        setIsThinking(true);
        setQuizQuestions([]);
        setCurrentQuestionIndex(0);
        setIsAnswered(false);
        setQuizFeedback(null);
        setScore(0);
        try {
            const data = await sidecarApi.aterInteractiveQuiz({ selection });
            setQuizQuestions(data.questions);
        } catch (e: unknown) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    }, [selection]);

    useEffect(() => {
        if (initialMode === 'explain') {
            handleInitialExplain();
        } else {
            handleInitialQuiz();
        }
    }, [selection, path, page, initialMode, handleInitialExplain, handleInitialQuiz]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isThinking) return;
        
        const newMsg: Message = { role: 'user', content: chatInput };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setChatInput('');
        setIsThinking(true);

        try {
            const data = await sidecarApi.aterChat({ 
                path, 
                selection, 
                page, 
                messages: updatedMessages 
            });
            setMessages([...updatedMessages, { role: 'assistant', content: data.answer }]);
        } catch (e: unknown) {
            setMessages([...updatedMessages, { role: 'assistant', content: `Error: ${(e as Error).message}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleAnswerQuiz = (answer: string) => {
        if (isAnswered) return;
        setUserAnswer(answer);
        setIsAnswered(true);
        
        const currentQ = quizQuestions[currentQuestionIndex];
        const isCorrect = String(answer || "").toLowerCase() === String(currentQ.answer || "").toLowerCase();
        
        if (isCorrect) setScore(score + 1);
        
        setQuizFeedback({
            correct: isCorrect,
            message: currentQ.explanation
        });
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setIsAnswered(false);
            setUserAnswer(null);
            setQuizFeedback(null);
        } else {
            // End of quiz
            setMode('explain');
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `### Quiz Completed!\n**Score:** ${score + (quizFeedback?.correct ? 1 : 0)}/${quizQuestions.length}\n\nGreat job! You've completed the interactive retrieval practice for this section.` 
            }]);
        }
    };

    // v33.0: dynamic header subtitle based on mode
    const modeSubtitle = noteTitle
        ? noteTitle.replace(/_/g, ' ')
        : (selection.slice(0, 40) + (selection.length > 40 ? '…' : ''));

    return (
        <div className="w-80 h-full border-l border-border bg-background flex flex-col shadow-2xl stop-selection-clear transition-none">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-background sticky top-0 z-10">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground italic">
                            {personaLabel}
                        </h3>
                        {modeSubtitle && (
                            <span className="text-[9px] text-muted-foreground/40 font-medium truncate max-w-[180px]">
                                {modeSubtitle}
                            </span>
                        )}
                    </div>
                    <div className="flex bg-muted/20 p-1 rounded-[10px] border border-border/40">
                        <button
                          onClick={() => setMode('explain')}
                          className={cn(
                            "flex-1 h-8 px-3 text-[9px] font-black uppercase tracking-widest rounded-[8px] transition-all",
                            mode === 'explain' 
                                ? "bg-foreground text-background shadow-sm" 
                                : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Explain
                        </button>
                        <button
                          onClick={() => { setMode('quiz'); if (quizQuestions.length === 0) handleInitialQuiz(); }}
                          className={cn(
                            "flex-1 h-8 px-3 text-[9px] font-black uppercase tracking-widest rounded-[8px] transition-all",
                            mode === 'quiz' 
                                ? "bg-foreground text-background shadow-sm" 
                                : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Quiz
                        </button>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-foreground/5 rounded-none text-muted-foreground hover:text-foreground  transition-none"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar">
                {/* Selection Context */}
                <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Selection</span>
                    <div className="p-4 bg-muted/20 rounded-none border border-border group hover:bg-muted/30 transition-none">
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-none">"{selection}"</p>
                    </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

                {mode === 'explain' ? (
                    /* Chat View */
                    <div className="space-y-6 pb-20">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex flex-col space-y-2",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-4 py-3 rounded-none max-w-[95%] text-[12px] leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-foreground/10 text-foreground rounded-none border border-border/50 shadow-sm" 
                                        : "bg-muted/30 border border-border rounded-none"
                                )}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <AterMarkdown content={msg.content} path={path} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-center gap-2 text-muted-foreground/20">
                                <div className="w-1.5 h-1.5 rounded-none bg-foreground/20 animate-none" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-none bg-foreground/20 animate-none" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-none bg-foreground/20 animate-none" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Quiz View */
                    <div className="space-y-6 pb-20">
                        {!isThinking && quizQuestions.length > 0 ? (
                            <div className="space-y-8">
                                {/* Quiz Progress */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Question {currentQuestionIndex + 1}/{quizQuestions.length}</span>
                                    <div className="flex gap-1">
                                        {quizQuestions.map((_, i) => (
                                            <div key={i} className={cn(
                                                "h-1 rounded-none transition-none duration-300",
                                                i === currentQuestionIndex ? "bg-foreground/40 w-6" : i < currentQuestionIndex ? "bg-foreground/20 w-3" : "bg-muted w-3"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="space-y-6">
                                    <h4 className="text-[14px] font-black text-foreground leading-tight tracking-tight">
                                        {quizQuestions[currentQuestionIndex].question}
                                    </h4>

                                    <div className="space-y-2">
                                        {quizQuestions[currentQuestionIndex].type === 'multiple-choice' ? (
                                            quizQuestions[currentQuestionIndex].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAnswerQuiz(opt)}
                                                    disabled={isAnswered}
                                                    className={cn(
                                                        "w-full px-4 py-3 rounded-none border text-[12px] text-left transition-none [0.98] flex items-center justify-between group",
                                                        isAnswered 
                                                            ? (String(opt || "").toLowerCase() === String(quizQuestions[currentQuestionIndex].answer || "").toLowerCase() 
                                                                ? "bg-foreground/10 border-foreground/30 text-foreground font-black" 
                                                                : (userAnswer === opt ? "bg-destructive/5 border-destructive/20 text-destructive/60" : "bg-muted/10 border-border/40 opacity-40"))
                                                            : "bg-muted/20 border-border hover:border-foreground/40 hover:bg-foreground/[0.02] text-foreground"
                                                    )}
                                                >
                                                    <span>{opt}</span>
                                                    {isAnswered && String(opt || "").toLowerCase() === String(quizQuestions[currentQuestionIndex].answer || "").toLowerCase() && <Check size={14} />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {['True', 'False'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleAnswerQuiz(opt)}
                                                        disabled={isAnswered}
                                                        className={cn(
                                                            "px-4 py-4 rounded-none border text-[10px] font-black uppercase tracking-widest transition-none  flex flex-col items-center gap-2",
                                                            isAnswered 
                                                                ? (String(opt || "").toLowerCase() === String(quizQuestions[currentQuestionIndex].answer || "").toLowerCase() 
                                                                    ? "bg-foreground/10 border-foreground/30 text-foreground font-black" 
                                                                    : (userAnswer === opt ? "bg-destructive/5 border-destructive/20 text-destructive/60" : "bg-muted/10 border-border/40 opacity-40"))
                                                                : "bg-muted/20 border-border hover:border-foreground/40 hover:bg-foreground/[0.02] text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <span>{opt}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Feedback */}
                                {quizFeedback && (
                                    <div className={cn(
                                        "p-5 rounded-none border space-y-4",
                                        quizFeedback.correct ? "bg-muted/20 border-border/50" : "bg-destructive/5 border-destructive/10"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                quizFeedback.correct ? "text-foreground" : "text-destructive/60"
                                            )}>
                                                {quizFeedback.correct ? 'Correct' : 'Incorrect'}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed italic">
                                            {quizFeedback.message}
                                        </p>
                                        <button 
                                            onClick={nextQuestion}
                                            className="w-full h-10 bg-foreground text-background rounded-[8px] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-foreground/90 shadow-sm"
                                        >
                                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next' : 'Finish'}
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            isThinking && (
                                <div className="space-y-4 py-12 flex flex-col items-center justify-center">
                                    <RefreshCw size={24} className="text-muted-foreground/10" />
                                    <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Preparing Quiz...</span>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Input (Explain Mode) */}
            {mode === 'explain' && (
                <div className="p-4 border-t border-border bg-background">
                    <div className="relative flex items-center">
                        <input 
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask follow-up..."
                            className="w-full bg-muted/40 border-border/40 rounded-none pl-5 pr-12 py-3 text-[12px] focus:ring-1 focus:ring-border focus:border-border placeholder:text-muted-foreground/20 placeholder:font-black placeholder:uppercase placeholder:tracking-widest text-foreground"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isThinking}
                            className={cn(
                                "absolute right-2 p-2 rounded-none transition-none ",
                                chatInput.trim() && !isThinking ? "bg-foreground/10 text-foreground" : "text-muted-foreground/20"
                            )}
                        >
                            {isThinking ? <Loader2 size={16} /> : <Send size={16} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
