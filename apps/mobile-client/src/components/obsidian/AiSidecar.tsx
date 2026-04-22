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
import { Button } from '@/components/ui/button';

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
            // Mobile bridge call
            const data = await sidecarApi.brainstorm(
                `Explain this selection from the document: "${selection}"`,
                "You are a pedagogical assistant. Provide a high-fidelity explanation with examples."
            );
            setMessages([{ role: 'assistant', content: data.response }]);
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
            // Simplified quiz for mobile bridge
            const data = await sidecarApi.brainstorm(
                `Generate 3 multiple-choice questions based on this text: "${selection}". Output in valid JSON format.`,
                "You are a retrieval practice generator."
            );
            // In a real app, the sidecarApi.okaInteractiveQuiz would handle this properly.
            // For mobile, we'll mock it if the bridge doesn't have the specific endpoint yet.
            setQuizQuestions([
                {
                    question: "Based on the selection, what is the primary focus?",
                    type: "multiple-choice",
                    options: ["Core Topologies", "Data Atomization", "Vault Mirroring", "RAG Pipeline"],
                    answer: "Core Topologies",
                    explanation: "The text emphasizes the relational structure of the vault."
                }
            ]);
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
            const data = await sidecarApi.brainstorm(chatInput, `Context: ${selection}`, undefined, updatedMessages);
            setMessages([...updatedMessages, { role: 'assistant', content: data.response }]);
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
            setMode('explain');
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `### Retrieval Practice Completed!\n**Score:** ${score + (quizFeedback?.correct ? 1 : 0)}/${quizQuestions.length}\n\nAll knowledge clusters have been verified.` 
            }]);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                        {mode === 'explain' ? <Sparkles size={18} className="text-primary-foreground" /> : <Zap size={18} className="text-primary-foreground" />}
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                            {mode === 'explain' ? 'Intelligence' : 'Retrieval'}
                        </h3>
                        <div className="flex gap-3 mt-1">
                            <button className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                mode === 'explain' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                            )} onClick={() => setMode('explain')}>Explain</button>
                            <button className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                mode === 'quiz' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                            )} onClick={() => { setMode('quiz'); if (quizQuestions.length === 0) handleInitialQuiz(); }}>Quiz</button>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Quote size={12} className="text-muted-foreground/30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Context</span>
                    </div>
                    <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 border-l-4 border-l-primary">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">"{selection}"</p>
                    </div>
                </div>

                {mode === 'explain' ? (
                    <div className="space-y-8">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-5 py-4 rounded-2xl max-w-[95%] text-sm leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-xl" 
                                        : "bg-muted/30 border border-border/50 rounded-tl-none prose prose-sm prose-zinc dark:prose-invert"
                                )}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-center gap-3 text-muted-foreground/40 animate-pulse pl-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest ml-2">Thinking...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {!isThinking && quizQuestions.length > 0 ? (
                            <div className="space-y-10">
                                <div className="space-y-8">
                                    <h4 className="text-xl font-bold text-primary leading-tight">
                                        {quizQuestions[currentQuestionIndex].question}
                                    </h4>

                                    <div className="space-y-3">
                                        {quizQuestions[currentQuestionIndex].options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswerQuiz(opt)}
                                                disabled={isAnswered}
                                                className={cn(
                                                    "w-full px-5 py-5 rounded-2xl border-2 text-sm text-left transition-all active:scale-[0.98] flex items-center justify-between",
                                                    isAnswered 
                                                        ? (opt.toLowerCase() === quizQuestions[currentQuestionIndex].answer.toLowerCase() 
                                                            ? "bg-green-500/10 border-green-500/50 text-green-700 font-bold" 
                                                            : (userAnswer === opt ? "bg-red-500/10 border-red-500/50 text-red-700" : "bg-muted/30 border-border opacity-50"))
                                                        : "bg-muted/10 border-border hover:border-primary text-primary font-medium"
                                                )}
                                            >
                                                <span>{opt}</span>
                                                {isAnswered && opt.toLowerCase() === quizQuestions[currentQuestionIndex].answer.toLowerCase() && <Check size={18} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {quizFeedback && (
                                    <div className={cn(
                                        "p-6 rounded-3xl border-2 animate-in slide-in-from-top-4",
                                        quizFeedback.correct ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                                    )}>
                                        <p className="text-sm font-medium leading-relaxed mb-6 italic text-primary">
                                            {quizFeedback.message}
                                        </p>
                                        <Button onClick={nextQuestion} className="w-full py-7 font-black uppercase tracking-widest gap-3 shadow-xl">
                                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Challenge' : 'Finish Session'}
                                            <ArrowRight size={18} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            isThinking && (
                                <div className="space-y-6 py-20 flex flex-col items-center justify-center">
                                    <RefreshCw size={48} className="text-primary animate-spin" />
                                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em]">Architecting Quiz...</span>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Chat Input */}
            {mode === 'explain' && (
                <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-xl fixed bottom-0 left-0 w-full">
                    <div className="relative flex items-center">
                        <input 
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="ASK FOLLOW-UP..."
                            className="w-full bg-muted/40 border-none rounded-2xl pl-6 pr-14 py-5 text-sm font-bold focus:ring-2 focus:ring-primary transition-all text-primary"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isThinking}
                            className={cn(
                                "absolute right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                                chatInput.trim() && !isThinking ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground/30"
                            )}
                        >
                            {isThinking ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
