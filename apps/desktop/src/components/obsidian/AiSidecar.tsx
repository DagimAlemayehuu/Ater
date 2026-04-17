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
        <div className="w-80 h-full border-l border-gray-100 bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 stop-selection-clear">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
                        {mode === 'explain' ? <Sparkles size={14} className="text-white" /> : <Zap size={14} className="text-white" />}
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black italic">
                            {mode === 'explain' ? 'Pedagogical AI' : 'Active Recall'}
                        </h3>
                        <div className="flex gap-2 mt-0.5">
                            <span className={cn(
                                "text-[8px] font-bold uppercase tracking-widest",
                                mode === 'explain' ? "text-indigo-500" : "text-gray-400 cursor-pointer hover:text-indigo-400 transition-colors"
                            )} onClick={() => setMode('explain')}>Explain</span>
                            <span className="text-[8px] text-gray-200">|</span>
                            <span className={cn(
                                "text-[8px] font-bold uppercase tracking-widest",
                                mode === 'quiz' ? "text-amber-500" : "text-gray-400 cursor-pointer hover:text-amber-400 transition-colors"
                            )} onClick={() => { setMode('quiz'); if (quizQuestions.length === 0) handleInitialQuiz(); }}>Interactive Quiz</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-black active:scale-95"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar scroll-smooth">
                {/* Selection Context */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Quote size={10} className="text-gray-300" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Context Selection</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 border-l-4 border-l-black group transition-all hover:bg-white hover:shadow-sm">
                        <p className="text-[11px] text-gray-500 leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all">"{selection}"</p>
                    </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent my-2" />

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
                                        ? "bg-black text-white rounded-tr-none shadow-md shadow-black/5" 
                                        : "bg-white border border-gray-100 rounded-tl-none shadow-sm prose prose-zinc prose-sm text-gray-600 prose-headings:text-black prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-[11px] prose-strong:text-black"
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
                            <div className="flex items-center gap-3 text-gray-300 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Question {currentQuestionIndex + 1}/{quizQuestions.length}</span>
                                    <div className="flex gap-1">
                                        {quizQuestions.map((_, i) => (
                                            <div key={i} className={cn(
                                                "w-4 h-1 rounded-full transition-all duration-300",
                                                i === currentQuestionIndex ? "bg-amber-500 w-8" : i < currentQuestionIndex ? "bg-black/20" : "bg-gray-100"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="space-y-6">
                                    <h4 className="text-[14px] font-black text-black leading-tight tracking-tight">
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
                                                                ? "bg-green-50 border-green-200 text-green-700 font-bold" 
                                                                : (userAnswer === opt ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-100 opacity-50"))
                                                            : "bg-white border-gray-200 hover:border-black hover:shadow-md text-gray-600"
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
                                                                    ? "bg-green-50 border-green-200 text-green-700" 
                                                                    : (userAnswer === opt ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-100 opacity-50"))
                                                                : "bg-white border-gray-200 hover:border-black hover:bg-gray-50 text-gray-400 hover:text-black"
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
                                        quizFeedback.correct ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
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
                                                quizFeedback.correct ? "text-green-700" : "text-red-700"
                                            )}>
                                                {quizFeedback.correct ? 'Brilliant' : 'Incorrect'}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-gray-600 leading-relaxed mb-6 italic">
                                            {quizFeedback.message}
                                        </p>
                                        <button 
                                            onClick={nextQuestion}
                                            className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/10"
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
                                        <RefreshCw size={40} className="text-gray-100 animate-spin" />
                                        <Zap size={20} className="text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] text-center max-w-[150px]">Architecting Interactive Quiz...</span>
                                </div>
                            )
                        )}
                        {!isThinking && quizQuestions.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed">Failed to generate quiz for this context.</p>
                                <button onClick={handleInitialQuiz} className="mt-4 text-amber-500 font-black text-[9px] uppercase tracking-widest hover:underline">Retry Generation</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Input (Explain Mode) */}
            {mode === 'explain' && (
                <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)] selection:bg-black selection:text-white">
                    <div className="relative flex items-center">
                        <input 
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask follow-up..."
                            className="w-full bg-gray-50 border-none rounded-2xl pl-5 pr-12 py-4 text-[12px] focus:ring-2 focus:ring-black transition-all placeholder:text-gray-300 placeholder:font-bold placeholder:uppercase placeholder:tracking-widest"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isThinking}
                            className={cn(
                                "absolute right-2 p-2 rounded-xl transition-all active:scale-90",
                                chatInput.trim() && !isThinking ? "bg-black text-white shadow-lg" : "text-gray-300"
                            )}
                        >
                            {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    <div className="mt-3 flex justify-center">
                        <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest opacity-50">Pedagogical Assistant • Alpha v3.0</p>
                    </div>
                </div>
            )}
        </div>
    );
};
