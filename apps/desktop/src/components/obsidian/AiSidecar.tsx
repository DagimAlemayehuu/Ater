import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    Sparkles, Zap, X, Quote, Send, 
    RefreshCw, Check, Copy, MessageSquare, 
    BookOpen, HelpCircle, ArrowRight, Loader2,
    ThumbsUp, ThumbsDown
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
}

export const AiSidecar: React.FC<AiSidecarProps> = ({ 
    selection, 
    path, 
    page, 
    onClose,
    initialMode = 'explain'
}) => {
    const [mode, setMode] = useState<'explain' | 'quiz'>(initialMode);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Quiz State
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [score, setScore] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialMode === 'explain') {
            handleInitialExplain();
        } else {
            handleInitialQuiz();
        }
    }, [selection, path, page]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, quizFeedback, isThinking]);

    const handleInitialExplain = async () => {
        setIsThinking(true);
        setMessages([]);
        try {
            const data = await sidecarApi.explainPdfSelection({ path, selection, page });
            setMessages([{ role: 'assistant', content: data.answer }]);
        } catch (e: any) {
            setMessages([{ role: 'assistant', content: `Error: ${e.message}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleInitialQuiz = async () => {
        setIsThinking(true);
        setQuizQuestions([]);
        setCurrentQuestionIndex(0);
        setIsAnswered(false);
        setQuizFeedback(null);
        setScore(0);
        try {
            const data = await sidecarApi.okaInteractiveQuiz({ selection });
            setQuizQuestions(data.questions);
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isThinking) return;
        
        const newMsg: Message = { role: 'user', content: chatInput };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setChatInput('');
        setIsThinking(true);

        try {
            const data = await sidecarApi.okaChat({ 
                path, 
                selection, 
                page, 
                messages: updatedMessages 
            });
            setMessages([...updatedMessages, { role: 'assistant', content: data.answer }]);
        } catch (e: any) {
            setMessages([...updatedMessages, { role: 'assistant', content: `Error: ${e.message}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleAnswerQuiz = (answer: string) => {
        if (isAnswered) return;
        setUserAnswer(answer);
        setIsAnswered(true);
        
        const currentQ = quizQuestions[currentQuestionIndex];
        const isCorrect = answer.toLowerCase() === currentQ.answer.toLowerCase();
        
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

    return (
        <div className="w-80 h-full border-l border-border bg-background flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 stop-selection-clear">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-black/10">
                        {mode === 'explain' ? <Sparkles size={14} className="text-primary-foreground" /> : <Zap size={14} className="text-primary-foreground" />}
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground italic">
                            {mode === 'explain' ? 'Pedagogical AI' : 'Active Recall'}
                        </h3>
                        <div className="flex gap-2 mt-0.5">
                            <span className={cn(
                                "text-[8px] font-bold uppercase tracking-widest",
                                mode === 'explain' ? "text-indigo-500" : "text-muted-foreground cursor-pointer hover:text-indigo-400 transition-colors"
                            )} onClick={() => setMode('explain')}>Explain</span>
                            <span className="text-[8px] text-muted-foreground/30">|</span>
                            <span className={cn(
                                "text-[8px] font-bold uppercase tracking-widest",
                                mode === 'quiz' ? "text-amber-500" : "text-muted-foreground cursor-pointer hover:text-amber-400 transition-colors"
                            )} onClick={() => { setMode('quiz'); if (quizQuestions.length === 0) handleInitialQuiz(); }}>Interactive Quiz</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-95"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar scroll-smooth">
                {/* Selection Context */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Quote size={10} className="text-muted-foreground/40" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Context Selection</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border border-l-4 border-l-primary group transition-all hover:bg-muted/50">
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all">"{selection}"</p>
                    </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />

                {mode === 'explain' ? (
                    /* Chat View */
                    <div className="space-y-6 pb-20">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl max-w-[90%] text-[12px] leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" 
                                        : "bg-muted border border-border rounded-tl-none shadow-sm prose prose-zinc dark:prose-invert prose-sm text-foreground prose-headings:text-foreground prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-[11px] prose-strong:text-foreground"
                                )}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-center gap-3 text-muted-foreground/40 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest ml-2">Processing...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Quiz View */
                    <div className="space-y-6 pb-20">
                        {!isThinking && quizQuestions.length > 0 ? (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                {/* Quiz Progress */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Question {currentQuestionIndex + 1}/{quizQuestions.length}</span>
                                    <div className="flex gap-1">
                                        {quizQuestions.map((_, i) => (
                                            <div key={i} className={cn(
                                                "w-4 h-1 rounded-full transition-all duration-300",
                                                i === currentQuestionIndex ? "bg-amber-500 w-8" : i < currentQuestionIndex ? "bg-primary/20" : "bg-muted"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="space-y-6">
                                    <h4 className="text-[14px] font-black text-foreground leading-tight tracking-tight">
                                        {quizQuestions[currentQuestionIndex].question}
                                    </h4>

                                    <div className="space-y-3">
                                        {quizQuestions[currentQuestionIndex].type === 'multiple-choice' ? (
                                            quizQuestions[currentQuestionIndex].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAnswerQuiz(opt)}
                                                    disabled={isAnswered}
                                                    className={cn(
                                                        "w-full px-4 py-3 rounded-xl border text-[12px] text-left transition-all active:scale-[0.98] flex items-center justify-between group",
                                                        isAnswered 
                                                            ? (opt.toLowerCase() === quizQuestions[currentQuestionIndex].answer.toLowerCase() 
                                                                ? "bg-green-500/10 border-green-500/20 text-green-600 font-bold" 
                                                                : (userAnswer === opt ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-muted/30 border-border opacity-50"))
                                                            : "bg-muted/50 border-border hover:border-primary hover:shadow-md text-foreground"
                                                    )}
                                                >
                                                    <span>{opt}</span>
                                                    {isAnswered && opt.toLowerCase() === quizQuestions[currentQuestionIndex].answer.toLowerCase() && <Check size={14} />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {['True', 'False'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleAnswerQuiz(opt)}
                                                        disabled={isAnswered}
                                                        className={cn(
                                                            "px-4 py-4 rounded-xl border text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center gap-2",
                                                            isAnswered 
                                                                ? (opt.toLowerCase() === quizQuestions[currentQuestionIndex].answer.toLowerCase() 
                                                                    ? "bg-green-500/10 border-green-500/20 text-green-600" 
                                                                    : (userAnswer === opt ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-muted/30 border-border opacity-50"))
                                                                : "bg-muted/50 border-border hover:border-primary hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {opt === 'True' ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
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
                                        "p-5 rounded-2xl border-2 animate-in slide-in-from-top-4 duration-500",
                                        quizFeedback.correct ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                                    )}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-white",
                                                quizFeedback.correct ? "bg-green-500" : "bg-red-500"
                                            )}>
                                                {quizFeedback.correct ? <Check size={12} /> : <X size={12} />}
                                            </div>
                                            <span className={cn(
                                                "text-[11px] font-black uppercase tracking-widest",
                                                quizFeedback.correct ? "text-green-600" : "text-red-600"
                                            )}>
                                                {quizFeedback.correct ? 'Brilliant' : 'Incorrect'}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-foreground/80 leading-relaxed mb-6 italic">
                                            {quizFeedback.message}
                                        </p>
                                        <button 
                                            onClick={nextQuestion}
                                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
                                        >
                                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Challenge' : 'Finish Quiz'}
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            isThinking && (
                                <div className="space-y-4 py-8 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <RefreshCw size={40} className="text-muted/20 animate-spin" />
                                        <Zap size={20} className="text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <span className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] text-center max-w-[150px]">Architecting Interactive Quiz...</span>
                                </div>
                            )
                        )}
                        {!isThinking && quizQuestions.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed border-border rounded-3xl">
                                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-relaxed">Failed to generate quiz for this context.</p>
                                <button onClick={handleInitialQuiz} className="mt-4 text-amber-500 font-black text-[9px] uppercase tracking-widest hover:underline">Retry Generation</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Input (Explain Mode) */}
            {mode === 'explain' && (
                <div className="p-4 border-t border-border bg-background shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                    <div className="relative flex items-center">
                        <input 
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask follow-up..."
                            className="w-full bg-muted border-none rounded-2xl pl-5 pr-12 py-4 text-[12px] focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground/30 placeholder:font-bold placeholder:uppercase placeholder:tracking-widest text-foreground"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isThinking}
                            className={cn(
                                "absolute right-2 p-2 rounded-xl transition-all active:scale-90",
                                chatInput.trim() && !isThinking ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground/30"
                            )}
                        >
                            {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    <div className="mt-3 flex justify-center">
                        <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest opacity-50">Pedagogical Assistant • Alpha v3.0</p>
                    </div>
                </div>
            )}
        </div>
    );
};
