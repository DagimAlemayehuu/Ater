import { useState, useEffect, useRef } from 'react'
import {
    Send,
    Zap,
    Wand2,
    Plus,
    Check,
    Sparkles,
    MessageSquare,
    Save,
    History,
    Trash2
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { DEFAULT_CONFIG } from '@/lib/config-types'
import type { CustomPersona, CustomSliderConfig } from '@/lib/config-types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { LucideIcon } from 'lucide-react'
import { slidersToPromptFragment } from '@/lib/slider-configs'

interface Message {
    role: 'user' | 'model'
    content: string
    isCommit?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commitData?: any;
}

interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    personaId: string;
    messages: Message[];
}

export default function Chat() {
    const { config, addCustomPersona } = useConfig()

    // Default to empty array for a new chat
    const [messages, setMessages] = useState<Message[]>([])
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('strategist')

    // Store all sessions
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        try {
            const v = localStorage.getItem('lifeos_chat_sessions');
            return v ? JSON.parse(v) : [];
        } catch {
            return [];
        }
    });

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (messages.length === 0) return;

        let id = currentSessionId;
        if (!id) {
            id = Date.now().toString();
            setCurrentSessionId(id);
        }

        const newSessions = [...sessions];
        const existingIdx = newSessions.findIndex(s => s.id === id);

        const title = messages.find(m => m.role === 'user')?.content.slice(0, 40) + '...' || 'New Conversation';

        const sessionData: ChatSession = {
            id,
            title,
            timestamp: Date.now(),
            personaId: selectedPersonaId,
            messages
        };

        if (existingIdx >= 0) {
            newSessions[existingIdx] = sessionData;
            // Move to top
            const [item] = newSessions.splice(existingIdx, 1);
            newSessions.unshift(item);
        } else {
            newSessions.unshift(sessionData);
        }

        setSessions(newSessions);
        localStorage.setItem('lifeos_chat_sessions', JSON.stringify(newSessions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, selectedPersonaId, currentSessionId]);

    const startNewChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setShowHistory(false);
    };

    const loadSession = (session: ChatSession) => {
        setMessages(session.messages);
        setCurrentSessionId(session.id);
        setSelectedPersonaId(session.personaId);
        setShowHistory(false);
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        localStorage.setItem('lifeos_chat_sessions', JSON.stringify(newSessions));
        if (currentSessionId === id) {
            startNewChat();
        }
    };

    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [installedPersonas, setInstalledPersonas] = useState<string[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    const corePersonas = [
        { id: 'strategist', name: 'Strategist', icon: Zap, promptKey: 'strategistPrompt' as const },
        { id: 'creator', name: 'Creator', icon: Wand2, promptKey: 'creatorPrompt' as const }
    ]

    const allPersonas = [
        ...corePersonas.map(p => ({
            id: p.id,
            name: p.name,
            icon: p.icon as LucideIcon,
            prompt: config?.[p.promptKey] || '',
            isCustom: false
        })),
        ...(config?.customPersonas || []).map(p => ({
            id: p.id,
            name: p.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            icon: (Icons as any)[p.icon] || MessageSquare,
            prompt: p.prompt,
            isCustom: true,
            customConfig: p.slidersConfig,
            slidersValues: p.slidersValues
        }))
    ]

    const activePersona = allPersonas.find(p => p.id === selectedPersonaId) || allPersonas[0];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseCommit = (text: string): any | null => {
        const match = text.match(/<PERSONA_COMMIT>\s*([\s\S]*?)\s*<\/PERSONA_COMMIT>/);
        if (!match) return null;
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            console.error("Failed to parse persona commit:", e);
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInstall = async (data: any, messageIdx: number) => {
        if (!data.name || (!data.systemPrompt && !data.prompt)) return;

        const systemPrompt = data.systemPrompt || data.prompt;
        const slidersConfig = (data.tuningSliders || data.slidersConfig || []) as CustomSliderConfig[];

        const newPersona: CustomPersona = {
            id: `custom-${Date.now()}`,
            name: data.name,
            description: data.description || '',
            icon: data.icon || 'MessageSquare',
            prompt: systemPrompt,
            slidersConfig: slidersConfig,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            slidersValues: slidersConfig.reduce((acc: any, s: CustomSliderConfig) => ({ ...acc, [s.id]: s.default }), {})
        };

        addCustomPersona(newPersona);
        setInstalledPersonas(prev => [...prev, `${messageIdx}`]);

        try {
            await sidecarApi.savePersonaPrompt(data.name, systemPrompt);
        } catch (e) {
            console.error("Failed to save persona to file system:", e);
        }
    }

    const handleSend = async (forcedQuery?: string) => {
        const text = forcedQuery || query
        if (!text.trim() || loading) return

        // 1. Check for confirmation keywords
        const lowerText = text.toLowerCase().trim();
        const confirmationKeywords = ['confirm creation', 'confirm', 'install', 'install persona', 'looks good', 'perfect'];

        if (confirmationKeywords.includes(lowerText)) {
            // Find most recent commit
            const lastCommitMsgIdx = [...messages].reverse().findIndex(m => m.isCommit && !installedPersonas.includes(`${messages.indexOf(m)}`));
            if (lastCommitMsgIdx !== -1) {
                const actualIdx = (messages.length - 1) - lastCommitMsgIdx;
                const msg = messages[actualIdx];
                if (msg.commitData) {
                    await handleInstall(msg.commitData, actualIdx);
                    setMessages(prev => [...prev,
                    { role: 'user', content: text },
                    { role: 'model', content: "Confirmed. The persona has been architected and installed into your system core. You can now select it from the sidebar or settings." }
                    ]);
                    setQuery('');
                    return;
                }
            }
        }

        setLoading(true)
        const userMsg: Message = { role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setQuery('')

        try {
            // Prepare context
            const profileContext = [
                { title: 'Personal', content: config?.profilePersonal },
                { title: 'Academic', content: config?.profileAcademic },
                { title: 'Financial', content: config?.profileFinancial },
                { title: 'Fitness', content: config?.profileFitness },
                { title: 'Master Plan', content: config?.profileMasterPlan },
            ]
                .filter(p => p.content?.trim())
                .map(p => `[PROFILE: ${p.title}]\n${p.content}`)
                .join('\n\n')

            const context = `USER PROFILES:\n${profileContext || 'No profiles configured yet.'}`

            const fallbackPrompt = activePersona.id === 'creator' ? DEFAULT_CONFIG.creatorPrompt : activePersona.id === 'strategist' ? DEFAULT_CONFIG.strategistPrompt : '';
            const coreSystemPrompt = activePersona.prompt?.trim() ? activePersona.prompt : fallbackPrompt;

            const slidersKey = activePersona.id === 'creator' ? 'creatorSliders' : (activePersona.id === 'strategist' ? 'strategistSliders' : '');

            let slidersValue = '';
            let personaCustomConfig: CustomSliderConfig[] | undefined;

            if (activePersona.isCustom) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customP = activePersona as any;
                slidersValue = JSON.stringify(customP.slidersValues || {});
                personaCustomConfig = customP.customConfig;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                slidersValue = (slidersKey && config) ? (config as any)[slidersKey] : '';
            }

            const calibrationFragment = slidersToPromptFragment(
                slidersValue,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                activePersona.isCustom ? 'custom' : (activePersona.id as any),
                personaCustomConfig
            );

            const fullSystemPrompt = `${coreSystemPrompt}\n\n${calibrationFragment}`;

            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const res = await sidecarApi.brainstorm(text, context, fullSystemPrompt || undefined, history)
            const commitData = parseCommit(res.response)

            const aiMsg: Message = {
                role: 'model',
                content: res.response.replace(/<PERSONA_COMMIT>[\s\S]*?<\/PERSONA_COMMIT>/g, '').trim(),
                isCommit: !!commitData,
                commitData: commitData || undefined
            }
            setMessages(prev => [...prev, aiMsg])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', content: `ERROR: ${error.message || 'Unknown error'}` }])
        } finally {
            setLoading(false)
        }
    }

    const suggestions = [
        "Create a health coach persona",
        "Design a sarcastic code reviewer",
        "Help me brainstorm a financial advisor",
        "Review my current growth strategy",
    ]

    const PersonaIcon = activePersona.icon;

    return (
        <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
            {/* Persona Header */}
            <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted text-muted-foreground">
                        <PersonaIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{activePersona.name}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {activePersona.id === 'creator' ? 'Architect Mode Active' : 'Neural Link Established'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border rounded-lg overflow-x-auto max-w-[50vw] no-scrollbar">
                        {allPersonas.map(p => {
                            const Icon = p.icon;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersonaId(p.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                        selectedPersonaId === p.id
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon size={14} />
                                    {p.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={cn(
                            "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            showHistory ? "bg-muted text-foreground" : "bg-background border border-input shadow-sm hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <History className="mr-2 h-4 w-4" />
                        History
                    </button>
                    <button
                        onClick={startNewChat}
                        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Chat
                    </button>

                    {showHistory && (
                        <div className="absolute top-full right-0 mt-2 w-80 max-h-[60vh] overflow-auto bg-popover text-popover-foreground border rounded-md shadow-md z-50 flex flex-col p-1 animate-in slide-in-from-top-2">
                            {sessions.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No chat history found.</div>
                            ) : (
                                sessions.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSession(session)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group",
                                            currentSessionId === session.id && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="truncate font-medium">{session.title}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(session.timestamp).toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={(e) => deleteSession(session.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 overflow-auto pr-4 custom-scrollbar space-y-6 pb-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        <div className="p-4 rounded-xl bg-muted/50 border border-border shadow-sm">
                            <PersonaIcon className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-2 max-w-md">
                            <h3 className="text-2xl font-semibold tracking-tight">Meet your {activePersona.name}</h3>
                            <p className="text-muted-foreground text-sm">
                                {activePersona.id === 'creator'
                                    ? "I'm ready to architect your next specialized AI. What role shall we design today?"
                                    : "I have full context of your goals and profiles. How can I guide you today?"}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full mt-4">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(s)}
                                    className="px-4 py-3 text-left border rounded-lg hover:bg-muted text-sm font-medium transition-colors group flex items-center justify-between shadow-sm bg-card"
                                >
                                    <span>{s}</span>
                                    <Plus size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className="flex gap-4 animate-in fade-in duration-300 py-6 border-b border-border/50 last:border-0 items-start">
                        <div className="shrink-0 mt-1">
                            {msg.role === 'user' ? (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <span className="text-[10px] font-bold text-primary">YOU</span>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                    <PersonaIcon size={16} className="text-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {msg.role === 'user' ? 'You' : activePersona.name}
                            </span>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>

                            {/* UI-based Install Block */}
                            {msg.isCommit && msg.commitData && (
                                <div className="mt-5 p-5 rounded-xl border border-border bg-background shadow-sm animate-in zoom-in-95 duration-500 max-w-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-muted text-muted-foreground">
                                                <Sparkles size={16} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold tracking-tight text-foreground">Persona Blueprint Ready</h4>
                                                <p className="text-xs text-muted-foreground">Architectural Handshake</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <span>Name: {msg.commitData.name}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 pl-3">
                                            {msg.commitData.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(msg.commitData.tuningSliders as any[])?.map((s: any, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded-md bg-muted/50 text-xs font-medium text-muted-foreground border">
                                                    {s.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleInstall(msg.commitData!, idx)}
                                        disabled={installedPersonas.includes(`${idx}`)}
                                        className={cn(
                                            "w-full h-9 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm",
                                            installedPersonas.includes(`${idx}`)
                                                ? "bg-muted text-muted-foreground border cursor-not-allowed"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        {installedPersonas.includes(`${idx}`) ? (
                                            <>
                                                <Check size={16} />
                                                Installed
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Install Persona
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-start gap-3 animate-in fade-in duration-300 pl-2">
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted border border-border rounded-2xl rounded-tl-sm shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-4 mt-auto">
                <div className="relative group max-w-4xl mx-auto w-full">
                    <div className="relative flex items-center bg-background border border-input rounded-xl focus-within:ring-1 focus-within:ring-ring transition-all duration-300 shadow-sm overflow-hidden">
                        <div className="pl-4 pr-2 py-3 bg-muted/30">
                            <PersonaIcon size={18} className="text-muted-foreground" />
                        </div>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={activePersona.id === 'creator' ? "Describe the persona you want to build..." : `Message ${activePersona.name}...`}
                            className="flex-1 bg-transparent border-none px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !query.trim()}
                            className="mr-2 h-8 w-8 flex items-center justify-center rounded-md bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-50 shadow-sm"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
