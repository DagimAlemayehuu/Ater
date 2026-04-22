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
        handleInitialExplain();
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
            const data = await sidecarApi.brainstorm(
                `Please explain this selection from the document: "${selection}"`,
                `Source: ${path}${page ? ` (Page ${page})` : ''}`,
                "You are an expert academic assistant. Provide a concise, insightful explanation of the provided text selection."
            );
            setMessages([{ role: 'assistant', content: data.response }]);
        } catch (e: any) {
            setMessages([{ role: 'assistant', content: `Error: ${e.message}` }]);
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

    return (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                        <Sparkles size={18} className="text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                            Intelligence
                        </h3>
                        <div className="flex gap-3 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Explanation</span>
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
