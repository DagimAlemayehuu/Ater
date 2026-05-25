import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sidecarApi } from '@/lib/sidecarApi'
import { useHeader } from '@/context/header-context'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { 
  Send, 
  Trash2, 
  Plus, 
  Search, 
  GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Oracle() {
  const navigate = useNavigate();
  const { setCenterContent, setRightContent } = useHeader();
  const { currentHub, history } = usePomodoroStore();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ater_oracle_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('ater_oracle_chat_history', JSON.stringify(messages));
  }, [messages]);
  
  useEffect(() => {
    setCenterContent(
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-[0.2em]">Ater</span>
      </div>
    );
    setRightContent(
      messages.length > 0 ? (
        <button 
          onClick={handleClearHistory}
          className="h-8 px-3 border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 rounded-none"
          title="Clear Conversation"
        >
          <Trash2 size={12} /> CLEAR
        </button>
      ) : null
    );
  }, [setCenterContent, setRightContent, messages.length]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleClearHistory = () => {
    setMessages([]);
    toast.success('Conversation history cleared.');
  };

  const handleWikiLinkClick = async (pageName: string) => {
    try {
      const searchRes = await sidecarApi.findVaultPage(pageName);
      if (searchRes.found && searchRes.path) {
        navigate(`/obsidian?path=${encodeURIComponent(searchRes.path)}`);
      } else {
        navigate(`/obsidian?search=${encodeURIComponent(pageName)}`);
      }
    } catch (err) {
      toast.error('Could not navigate to note.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;
    
    if (!textToSend) {
      setInput('');
    }
    
    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setIsLoading(true);
    setActiveStatus('Initiating query...');
    
    try {
      // 1. Run local RAG query (with intent classification check to bypass RAG pre-pass)
      let ragContext = '';
      const COMMAND_VERBS = /\b(add|create|delete|remove|update|set|navigate|go|show|open)\b/i;
      const SCHEMA_OBJECTS = /\b(course|semester|assignment|exam|year|hub|tab|view)\b/i;
      
      const shouldSkipRag = COMMAND_VERBS.test(text) && SCHEMA_OBJECTS.test(text);
      
      if (!shouldSkipRag) {
        setActiveStatus('Running semantic vector search...');
        try {
          const searchResults = await sidecarApi.search_similar(text, 5);
          if (searchResults && searchResults.length > 0) {
            ragContext = searchResults
              .map(r => `[Note: ${r.filename}] (Path: ${r.folder}/${r.filename})\nContent:\n${r.content}`)
              .join("\n\n");
          }
        } catch (ragErr) {
          console.error('[Oracle RAG] RAG fetch failed:', ragErr);
        }
      } else {
        console.info('[Oracle RAG] Command signature matched. Bypassing semantic RAG.');
      }
      
      // 2. Gather active user context
      const recentNotes = history
        .filter(item => item.type === 'note_focus')
        .slice(-3)
        .map(item => item.notePath)
        .filter(Boolean) as string[];
        
      const pomodoroState = usePomodoroStore.getState();
      const userContext = {
        active_hub: currentHub,
        recent_notes: recentNotes,
        pomodoro: {
          is_active: pomodoroState.isActive,
          time_left: pomodoroState.timeLeft,
          mode: pomodoroState.mode,
          session_count: pomodoroState.sessionCount,
          current_hub: pomodoroState.currentHub
        }
      };
      
      // 3. Call Assistant Stream API
      setActiveStatus('Contacting assistant...');
      const response = await sidecarApi.oracleChatStream({
        history: newMessages,
        rag_context: ragContext,
        user_context: userContext
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Initialize empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body has no reader.');
      }
      
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let assistantContent = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'status') {
                setActiveStatus(parsed.message);
              } else if (parsed.type === 'chunk') {
                setActiveStatus(null);
                assistantContent += parsed.content;
                setMessages(prev => {
                  const next = [...prev];
                  const lastIndex = next.length - 1;
                  if (lastIndex >= 0 && next[lastIndex].role === 'assistant') {
                    next[lastIndex] = {
                      ...next[lastIndex],
                      content: assistantContent
                    };
                  }
                  return next;
                });
              } else if (parsed.type === 'action') {
                // Navigation and UI action events from agent tools
                if (parsed.action === 'navigate' && parsed.route) {
                  navigate(parsed.route);
                } else if (parsed.action === 'toast' && parsed.message) {
                  const fn = parsed.variant === 'success' ? toast.success
                    : parsed.variant === 'error' ? toast.error
                    : parsed.variant === 'warning' ? toast.warning
                    : toast.info;
                  fn(parsed.message);
                } else if (parsed.action === 'pomodoro_start') {
                  const store = usePomodoroStore.getState();
                  store.setIsActive(true);
                  if (parsed.duration_minutes) {
                    store.setTimeLeft(parsed.duration_minutes * 60);
                  }
                  if (parsed.hub_id) {
                    store.setCurrentHub(parsed.hub_id);
                  }
                  toast.success(`Pomodoro timer started for ${parsed.duration_minutes || 25} minutes.`);
                } else if (parsed.action === 'pomodoro_pause') {
                  const store = usePomodoroStore.getState();
                  const nextActive = !store.isActive;
                  store.setIsActive(nextActive);
                  toast.info(nextActive ? 'Pomodoro timer resumed.' : 'Pomodoro timer paused.');
                } else if (parsed.action === 'pomodoro_stop') {
                  const store = usePomodoroStore.getState();
                  store.setIsActive(false);
                  store.setTimeLeft(25 * 60);
                  toast.info('Pomodoro timer stopped.');
                } else if (parsed.action === 'pomodoro_set_hub' && parsed.hub_id) {
                  const store = usePomodoroStore.getState();
                  store.setCurrentHub(parsed.hub_id);
                  toast.info(`Pomodoro hub set to ${parsed.hub_id}.`);
                }
              } else if (parsed.type === 'error') {
                toast.error(parsed.message);
              }
            } catch (jsonErr) {
              console.warn('[Oracle Stream] Failed to parse SSE JSON event:', dataStr, jsonErr);
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || err || 'Connection failed'}`);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      setActiveStatus(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const quickActions = [
    {
      title: "Add a New Course",
      prompt: "Add a new course named 'Distributed Systems' in Autumn 2026 to my academic dashboard.",
      icon: Plus,
      description: "Create a new course record."
    },
    {
      title: "Search My Vault",
      prompt: "What do my notes say about database normalization? Check my knowledge base.",
      icon: Search,
      description: "Search note contents."
    },
    {
      title: "Generate a Quiz",
      prompt: "Generate a 5-question MCQ quiz on Operating Systems.",
      icon: GraduationCap,
      description: "Create an interactive quiz."
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-background text-foreground overflow-hidden">
      {/* Messages View */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 min-w-0">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-16 space-y-10">
            {/* Title and description */}
            <div className="space-y-4 text-center">
              <h1 className="text-lg font-black uppercase tracking-[0.25em] text-foreground">
                Ater
              </h1>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                A context-aware assistant that helps you manage and search your vault and academic courses.
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 select-none block mb-1">
                Suggested Commands
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(action.prompt)}
                      className="flex flex-col items-start text-left p-4 border border-border/80 hover:border-foreground/40 bg-background hover:bg-muted/5 transition-all duration-150 rounded-none group shadow-sm"
                    >
                      <div className="size-7 bg-muted/10 border border-border group-hover:border-foreground/20 flex items-center justify-center mb-3 rounded-none transition-all">
                        <Icon size={12} className="text-muted-foreground group-hover:text-foreground" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-1 block">
                        {action.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-normal">
                        {action.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-2">
                {msg.role === 'user' ? (
                  <div className="flex justify-end w-full">
                    <div className="max-w-[80%] bg-muted/15 border border-border px-4 py-3 text-[13px] rounded-none text-foreground font-sans leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start w-full">
                    <div className="max-w-full w-full border border-border bg-background px-6 py-5 text-[13px] rounded-none text-foreground font-sans overflow-x-auto shadow-sm">
                      {/* Body Markdown */}
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/5 prose-pre:border prose-pre:border-border/30">
                        <AterMarkdown 
                          content={msg.content.replace(/\(\(([^)]+)\)\)/g, '[[$1]]')} 
                          onNavigate={handleWikiLinkClick}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Thinking indicator */}
            {isLoading && (
              <div className="flex justify-start w-full animate-pulse">
                <div className="border border-border bg-background px-5 py-4 rounded-none shadow-sm flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground select-none">
                    {activeStatus || 'Oracle is thinking...'}
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Action Bar */}
      <div className="p-6 border-t border-border bg-background shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-3 bg-background relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Oracle or search your vault..."
            className="flex-1 min-h-[44px] max-h-[120px] bg-background border border-border p-3 text-sm focus:outline-none focus:border-foreground/40 resize-none placeholder:text-muted-foreground/40 rounded-none transition-all font-mono leading-relaxed"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-11 px-5 flex items-center justify-center rounded-none border transition-all duration-150 shadow-sm",
              input.trim() && !isLoading
                ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
                : "bg-muted/10 border-border text-muted-foreground/30 cursor-not-allowed"
            )}
            title="Send Message"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
