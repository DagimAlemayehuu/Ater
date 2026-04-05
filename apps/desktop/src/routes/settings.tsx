import React, { useState, useEffect } from 'react'
import {
    Database, Key, HardDrive, Trash2, Edit2, FolderOpen, ShieldCheck, Sun, Moon, Zap,
    User, BookOpen, DollarSign, Activity, Brain, Bot, Sliders, ChevronLeft, ArrowRight, Wand2, Info, Settings as SettingsIcon, Target, MessageSquare, RefreshCw
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useConfig } from '@/lib/ConfigContext'
import { useTheme } from '@/context/theme-provider'
import { open } from '@tauri-apps/plugin-dialog'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import ProfileEditor from '@/components/profiles/ProfileEditor'
import StrategistSliders from '@/components/profiles/StrategistSliders'
import {
    PERSONAL_PROFILE_SCHEMA,
    ACADEMIC_PROFILE_SCHEMA,
    FINANCIAL_PROFILE_SCHEMA,
    FITNESS_PROFILE_SCHEMA,
} from '@/components/profiles/schemas'

/* ─────────────────────── Types ─────────────────────── */

type SettingsSection = 'general' | 'profiles' | 'intelligence'
type ProfileId = string

interface ProfileCardDef {
    id: string
    title: string
    icon: React.ReactNode
    description: string
    category: 'profiles' | 'master_plan' | 'ai_tuning' | 'system_prompts' | 'custom_prompts'
    configKey?: string
    schema?: any
}

const PROFILE_CARDS: ProfileCardDef[] = [
    {
        id: 'personal', title: 'Personal', icon: <User size={16} />,
        description: 'Identity, daily rhythm, and values.',
        category: 'profiles', configKey: 'profilePersonal', schema: PERSONAL_PROFILE_SCHEMA,
    },
    {
        id: 'academic', title: 'Academic', icon: <BookOpen size={16} />,
        description: 'Studies, coursework, and career goals.',
        category: 'profiles', configKey: 'profileAcademic', schema: ACADEMIC_PROFILE_SCHEMA,
    },
    {
        id: 'financial', title: 'Financial', icon: <DollarSign size={16} />,
        description: 'Income, expenses, assets, and wealth strategy.',
        category: 'profiles', configKey: 'profileFinancial', schema: FINANCIAL_PROFILE_SCHEMA,
    },
    {
        id: 'fitness', title: 'Fitness', icon: <Activity size={16} />,
        description: 'Body data, training plan, nutrition, and recovery.',
        category: 'profiles', configKey: 'profileFitness', schema: FITNESS_PROFILE_SCHEMA,
    },
    {
        id: 'master_plan', title: 'Master Strategic Plan', icon: <Target size={16} />,
        description: 'The "Ground Truth" for your life. Vision, Kadence, and Core Process.',
        category: 'master_plan', configKey: 'profileMasterPlan',
    },
    {
        id: 'strategist_prompt', title: 'Strategist Prompt', icon: <Bot size={16} />,
        description: 'The high-level system instructions for the AI Strategist.',
        category: 'system_prompts', configKey: 'strategistPrompt',
    },
]

/* ─────────────────── Components ─────────────────── */

function Card({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>{children}</div>
}

function CardHeader({ title, description, icon }: { title: string, description?: React.ReactNode, icon?: React.ReactNode }) {
    return (
        <div className="flex flex-row items-center justify-between p-6 pb-4 space-y-0 text-sm font-medium">
            <div className="space-y-1">
                <h3 className="tracking-tight text-lg font-semibold">{title}</h3>
                {description && <p className="text-sm text-muted-foreground font-normal">{description}</p>}
            </div>
            {icon && icon}
        </div>
    )
}

function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("p-6 pt-0", className)}>{children}</div>
}

const SettingsCard = ({ title, icon, value, children, onEdit, isEditing, onSave, onCancel }: any) => (
    <Card className="flex flex-col justify-between h-full">
        <CardHeader title={title} description={value} icon={<div className="text-muted-foreground p-2 rounded-md bg-muted/50">{icon}</div>} />
        <CardContent className="flex-1 flex flex-col justify-between">
            <div className="w-full pb-4">{children}</div>

            <div className="flex justify-end pt-4 border-t border-border mt-auto">
                {!isEditing ? (
                    <button onClick={onEdit} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 border border-input bg-background shadow-sm">
                        <Edit2 size={14} className="mr-2" /> Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 border border-input bg-background shadow-sm">
                            Cancel
                        </button>
                        <button onClick={onSave} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                            Save
                        </button>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
)

/* ─────────── Debounced Strategist Prompt Textarea ─────────── */

function StrategistPromptTextarea({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder?: string }) {
    const [local, setLocal] = React.useState(value);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => { setLocal(value); }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const v = e.target.value;
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onSave(v), 800);
    };

    return (
        <div className="space-y-4">
            <textarea
                value={local}
                onChange={handleChange}
                className="w-full h-[400px] bg-background text-sm p-4 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed resize-none overflow-y-auto custom-scrollbar shadow-sm"
                placeholder={placeholder || "Enter core directives..."}
            />
            <div className="p-4 rounded-md bg-muted/50 border flex items-start gap-3">
                <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                    The sliders associated with this persona are automatically appended to these directives when communicating with the AI. Use this space for behavioral constraints and methodology.
                </p>
            </div>
        </div>
    );
}

/* ─────────────────── Main Component ─────────────────── */

export default function Settings() {
    const { config, saveConfig, isLoading } = useConfig()
    const { theme, setTheme } = useTheme()
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [activeSection, setActiveSection] = useState<SettingsSection>('general')
    const [activeProfileId, setActiveProfileId] = useState<ProfileId | null>(null)

    const [ragStatus, setRagStatus] = useState<{status: string, progress: number, total: number, message: string} | null>(null)
    const [notionStatus, setNotionStatus] = useState<{status: string, progress: number, total: number, message: string} | null>(null)
    const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false })
    const [aiTab, setAiTab] = useState<'primary' | 'planner' | 'utility'>('primary')
    const [testTarget, setTestTarget] = useState<'primary' | 'planner' | 'utility'>('primary')

    useEffect(() => {
        if (activeSection !== 'intelligence') return;
        
        let interval: ReturnType<typeof setInterval>;
        const poll = async () => {
            try {
                const ragRes = await sidecarApi.ragSyncStatus();
                setRagStatus(ragRes);
                const notionRes = await sidecarApi.syncNotionMirrorStatus();
                setNotionStatus(notionRes);
            } catch (e) {
                // Handle silently
            }
        };

        poll();
        interval = setInterval(poll, 1000);
        return () => clearInterval(interval);
    }, [activeSection]);

    if (isLoading || !config) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-medium text-muted-foreground">Initializing engine settings...</p>
                </div>
            </div>
        )
    }

    const startEditing = (key: string, current: string) => {
        setEditingKey(key)
        setEditValue(current)
    }

    const handleSave = async () => {
        if (!editingKey) return
        try {
            await saveConfig({ [editingKey]: editValue })
            setEditingKey(null)
        } catch (err) {
            alert('Failed to save setting')
        }
    }

    const handleTestConnection = async (target: 'primary' | 'planner' | 'utility' = 'primary') => {
        setTestTarget(target)
        setTestStatus({ loading: true })
        try {
            const res = await sidecarApi.testAiConnection(target)
            if (res.success) {
                setTestStatus({ loading: false, success: true, message: res.message || 'Connected successfully!' })
            } else {
                setTestStatus({ loading: false, success: false, message: res.error || 'Connection failed.' })
            }
        } catch (err: any) {
            setTestStatus({ loading: false, success: false, message: err.message || 'System error' })
        }
        // Reset status after 5s
        setTimeout(() => setTestStatus({ loading: false }), 5000)
    }

    const handleClear = async () => {
        if (confirm('Are you sure? This will reset all API keys and local paths.')) {
            await saveConfig({
                notionApiKey: '',
                aiApiKey: '',
                obsidianVaultPath: '',
            })
            window.location.reload()
        }
    }

    /* ────── Sidebar ────── */
    const sidebarItems: { section: SettingsSection; label: string; icon: React.ReactNode }[] = [
        { section: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
        { section: 'profiles', label: 'Profiles', icon: <User size={16} /> },
        { section: 'intelligence', label: 'Intelligence', icon: <Zap size={16} /> },
    ]

    /* ────── Profile Detail View ────── */
    function renderProfileDetail() {
        if (!activeProfileId) return null
        const card = PROFILE_CARDS.find(c => c.id === activeProfileId)
        if (!card) return null
        const profileValue = (config as any)?.[card.configKey!] || ''

        return (
            <div className="w-full animate-in fade-in duration-300 space-y-6 flex flex-col h-full pb-8">
                <button
                    onClick={() => setActiveProfileId(null)}
                    className="flex items-center gap-2 mb-2 text-sm font-medium hover:underline text-muted-foreground hover:text-foreground w-max"
                >
                    <ChevronLeft size={16} />
                    All Profiles
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{card.title} Profile</h2>
                        <p className="text-muted-foreground mt-1">{card.description}</p>
                    </div>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <div className="h-[600px] w-full p-4">
                            <ProfileEditor
                                id={activeProfileId}
                                title={card.title}
                                value={profileValue}
                                schema={card.schema}
                                onChange={(newValue) => saveConfig({ [card.configKey!]: newValue })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    /* ────── General Settings ────── */
    function renderGeneral() {
        return (
            <div className="w-full space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                    <p className="text-muted-foreground">Manage credentials and integrations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Theme */}
                    <Card className="flex flex-col">
                        <CardHeader title="Appearance" description="Select the interface theme." icon={theme === 'light' ? <Sun size={18} className="text-muted-foreground" /> : <Moon size={18} className="text-muted-foreground" />} />
                        <CardContent className="mt-auto">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => theme === 'dark' && setTheme('light')}
                                    className={cn(
                                        "flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 border shadow-sm",
                                        theme === 'light' ? "bg-background border-primary text-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent"
                                    )}
                                >
                                    <Sun size={14} className="mr-2" /> Light
                                </button>
                                <button
                                    onClick={() => theme === 'light' && setTheme('dark')}
                                    className={cn(
                                        "flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 border shadow-sm",
                                        theme === 'dark' ? "bg-background border-primary text-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent"
                                    )}
                                >
                                    <Moon size={14} className="mr-2" /> Dark
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notion */}
                    <SettingsCard
                        title="Notion Integration"
                        icon={<Database size={18} />}
                        value="Workspace synchronization API key"
                        isEditing={editingKey === 'notionApiKey'}
                        onEdit={() => startEditing('notionApiKey', config?.notionApiKey || '')}
                        onSave={handleSave}
                        onCancel={() => setEditingKey(null)}
                    >
                        {editingKey === 'notionApiKey' ? (
                            <input
                                type="password"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                autoFocus
                            />
                        ) : (
                            <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm border border-transparent">
                                <span>{config?.notionApiKey ? '••••••••' + config?.notionApiKey.slice(-4) : 'Not configured'}</span>
                                <ShieldCheck size={14} className="opacity-50" />
                            </div>
                        )}
                    </SettingsCard>

                    {/* Google Calendar */}
                    <SettingsCard
                        title="Google Calendar"
                        icon={<Icons.Calendar size={18} />}
                        value="Connect your unified timeline"
                        isEditing={editingKey === 'googleCalendarToken'}
                        onEdit={() => startEditing('googleCalendarToken', config?.googleCalendarToken || '')}
                        onSave={handleSave}
                        onCancel={() => setEditingKey(null)}
                    >
                        {editingKey === 'googleCalendarToken' ? (
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder='Paste Authorized User JSON here...'
                                className="w-full h-24 bg-background border border-input rounded-md px-3 py-2 text-[10px] font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                autoFocus
                            />
                        ) : (
                            <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm">
                                <span>{config?.googleCalendarToken ? 'Connected (JSON Set)' : 'Not connected'}</span>
                                <Icons.Lock size={14} className="opacity-50" />
                            </div>
                        )}
                    </SettingsCard>

                    {/* AI Engine */}
                    <SettingsCard
                        title="AI Engine"
                        icon={<Brain size={18} />}
                        value="Select Provider and Configure API Keys"
                        isEditing={editingKey === 'aiApiKey' || editingKey === 'plannerApiKey' || editingKey === 'utilityApiKey'}
                        onEdit={() => {
                            if (aiTab === 'primary') startEditing('aiApiKey', config?.aiApiKey || '')
                            else if (aiTab === 'planner') startEditing('plannerApiKey', config?.plannerApiKey || '')
                            else startEditing('utilityApiKey', config?.utilityApiKey || '')
                        }}
                        onSave={handleSave}
                        onCancel={() => setEditingKey(null)}
                    >
                        <div className="space-y-4">
                            {/* Tabs Header */}
                            <div className="flex p-1 bg-muted rounded-lg border">
                                <button 
                                    onClick={() => setAiTab('primary')}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                        aiTab === 'primary' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    L1: Synthesis
                                </button>
                                <button 
                                    onClick={() => setAiTab('planner')}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                        aiTab === 'planner' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    L2: Planning
                                </button>
                                <button 
                                    onClick={() => setAiTab('utility')}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                        aiTab === 'utility' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    L3: Utility
                                </button>
                            </div>

                            {aiTab === 'primary' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L1 Provider</label>
                                        <select
                                            value={config?.aiProvider || 'google'}
                                            onChange={(e) => {
                                                const provider = e.target.value;
                                                let defaultModel = 'gemini-2.0-flash';
                                                if (provider === 'openai') defaultModel = 'gpt-4o';
                                                if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-latest';
                                                if (provider === 'groq') defaultModel = 'llama-3.3-70b-versatile';
                                                if (provider === 'openrouter') defaultModel = 'google/gemini-2.0-flash-001';
                                                saveConfig({ aiProvider: provider, aiModel: defaultModel });
                                            }}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="google">Google Gemini</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="groq">Groq (Fast/Free)</option>
                                            <option value="openrouter">OpenRouter</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L1 API Key</label>
                                        {editingKey === 'aiApiKey' ? (
                                            <input
                                                type="password"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                autoFocus
                                                placeholder={`Enter ${config?.aiProvider.toUpperCase()} Key`}
                                            />
                                        ) : (
                                            <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm">
                                                <span>{config?.aiApiKey ? '••••••••' + config?.aiApiKey.slice(-4) : 'Not configured'}</span>
                                                <Key size={14} className="opacity-50" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L1 Model ID</label>
                                        <input
                                            type="text"
                                            value={config?.aiModel || ''}
                                            onChange={(e) => saveConfig({ aiModel: e.target.value })}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleTestConnection('primary')}
                                            disabled={testStatus.loading || !config?.aiApiKey}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all border shadow-sm",
                                                testStatus.loading && testTarget === 'primary' ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                                    testStatus.success === true && testTarget === 'primary' ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                                                        testStatus.success === false && testTarget === 'primary' ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" :
                                                            "bg-background hover:bg-accent text-foreground"
                                            )}
                                        >
                                            {testStatus.loading && testTarget === 'primary' ? (
                                                <><Icons.Loader2 size={14} className="animate-spin" /> Testing...</>
                                            ) : (
                                                <><Zap size={14} className={cn(testStatus.success && testTarget === 'primary' ? "fill-current" : "")} /> Test L1 Connection</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {aiTab === 'planner' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L2 Provider</label>
                                        <select
                                            value={config?.plannerProvider || 'google'}
                                            onChange={(e) => {
                                                const provider = e.target.value;
                                                let defaultModel = 'gemini-2.0-flash';
                                                saveConfig({ plannerProvider: provider, plannerModel: defaultModel });
                                            }}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="google">Google Gemini</option>
                                            <option value="groq">Groq</option>
                                            <option value="openrouter">OpenRouter</option>
                                            <option value="openai">OpenAI</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L2 API Key (Optional)</label>
                                        {editingKey === 'plannerApiKey' ? (
                                            <input
                                                type="password"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                autoFocus
                                                placeholder="Defaults to L1 Key"
                                            />
                                        ) : (
                                            <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm">
                                                <span>{config?.plannerApiKey ? '••••••••' + config?.plannerApiKey.slice(-4) : 'Using L1 Key'}</span>
                                                <Key size={14} className="opacity-50" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L2 Model ID</label>
                                        <input
                                            type="text"
                                            value={config?.plannerModel || ''}
                                            onChange={(e) => saveConfig({ plannerModel: e.target.value })}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleTestConnection('planner')}
                                            disabled={testStatus.loading || (!config?.plannerApiKey && !config?.aiApiKey)}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all border shadow-sm",
                                                testStatus.loading && testTarget === 'planner' ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                                    testStatus.success === true && testTarget === 'planner' ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                                                        testStatus.success === false && testTarget === 'planner' ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" :
                                                            "bg-background hover:bg-accent text-foreground"
                                            )}
                                        >
                                            {testStatus.loading && testTarget === 'planner' ? (
                                                <><Icons.Loader2 size={14} className="animate-spin" /> Testing...</>
                                            ) : (
                                                <><Zap size={14} className={cn(testStatus.success && testTarget === 'planner' ? "fill-current" : "")} /> Test L2 Connection</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {aiTab === 'utility' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L3 Provider</label>
                                        <select
                                            value={config?.utilityProvider || 'google'}
                                            onChange={(e) => {
                                                const provider = e.target.value;
                                                let defaultModel = 'gemini-1.5-flash-8b';
                                                saveConfig({ utilityProvider: provider, utilityModel: defaultModel });
                                            }}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="google">Google Gemini (Recommended)</option>
                                            <option value="groq">Groq</option>
                                            <option value="openrouter">OpenRouter</option>
                                            <option value="openai">OpenAI</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L3 API Key (Optional)</label>
                                        {editingKey === 'utilityApiKey' ? (
                                            <input
                                                type="password"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                autoFocus
                                                placeholder="Defaults to L2 Key"
                                            />
                                        ) : (
                                            <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm">
                                                <span>{config?.utilityApiKey ? '••••••••' + config?.utilityApiKey.slice(-4) : 'Using L2 Key'}</span>
                                                <Key size={14} className="opacity-50" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L3 Model ID</label>
                                        <input
                                            type="text"
                                            value={config?.utilityModel || ''}
                                            onChange={(e) => saveConfig({ utilityModel: e.target.value })}
                                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleTestConnection('utility')}
                                            disabled={testStatus.loading || (!config?.utilityApiKey && !config?.plannerApiKey && !config?.aiApiKey)}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all border shadow-sm",
                                                testStatus.loading && testTarget === 'utility' ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                                    testStatus.success === true && testTarget === 'utility' ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                                                        testStatus.success === false && testTarget === 'utility' ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" :
                                                            "bg-background hover:bg-accent text-foreground"
                                            )}
                                        >
                                            {testStatus.loading && testTarget === 'utility' ? (
                                                <><Icons.Loader2 size={14} className="animate-spin" /> Testing...</>
                                            ) : (
                                                <><Zap size={14} className={cn(testStatus.success && testTarget === 'utility' ? "fill-current" : "")} /> Test L3 Connection</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {testStatus.message && (
                                <p className={cn(
                                    "text-[10px] mt-2 px-2 py-1 rounded border animate-in fade-in zoom-in-95",
                                    testStatus.success ? "bg-green-500/5 border-green-500/10 text-green-600 dark:text-green-500" : "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-500"
                                )}>
                                    {testStatus.message}
                                </p>
                            )}
                        </div>
                    </SettingsCard>

                    {/* Obsidian & Inbox */}
                    <div className="flex flex-col gap-4">
                        <SettingsCard
                            title="Obsidian Vault"
                            icon={<HardDrive size={18} />}
                            value="Local directory for markdown notes"
                            isEditing={editingKey === 'obsidianVaultPath'}
                            onEdit={() => startEditing('obsidianVaultPath', config?.obsidianVaultPath || '')}
                            onSave={handleSave}
                            onCancel={() => setEditingKey(null)}
                        >
                            <div className="flex gap-2">
                                <div className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm overflow-hidden border border-transparent">
                                    <span className="truncate pr-2">{editingKey === 'obsidianVaultPath' ? editValue : (config?.obsidianVaultPath || 'Not selected')}</span>
                                </div>
                                {editingKey === 'obsidianVaultPath' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const selected = await open({ directory: true, multiple: false, title: 'Select Obsidian Vault' });
                                                if (selected) setEditValue(selected as string);
                                            } catch (err) { console.error(err); }
                                        }}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent border border-input bg-background shadow-sm px-3 py-2 shrink-0"
                                    >
                                        <FolderOpen size={16} />
                                    </button>
                                )}
                            </div>
                        </SettingsCard>

                        <SettingsCard
                            title="Academic Base Folder"
                            icon={<BookOpen size={18} />}
                            value="Folder for academic notes (relative to vault)"
                            isEditing={editingKey === 'academicFolderPath'}
                            onEdit={() => startEditing('academicFolderPath', config?.academicFolderPath || '1-Academic')}
                            onSave={handleSave}
                            onCancel={() => setEditingKey(null)}
                        >
                            <div className="flex gap-2">
                                <div className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm overflow-hidden border border-transparent">
                                    <span className="truncate pr-2">{editingKey === 'academicFolderPath' ? editValue : (config?.academicFolderPath || '1-Academic')}</span>
                                </div>
                                {editingKey === 'academicFolderPath' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const selected = await open({ 
                                                    directory: true, 
                                                    multiple: false, 
                                                    title: 'Select Academic Folder',
                                                    defaultPath: config?.obsidianVaultPath
                                                });
                                                if (selected) setEditValue(selected as string);
                                            } catch (err) { console.error(err); }
                                        }}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent border border-input bg-background shadow-sm px-3 py-2 shrink-0"
                                    >
                                        <FolderOpen size={16} />
                                    </button>
                                )}
                            </div>
                        </SettingsCard>

                        <SettingsCard
                            title="Inbox Watcher"
                            icon={<Zap size={18} className="text-primary" />}
                            value="Autonomous file ingestion pipeline"
                            isEditing={editingKey === 'inboxPath'}
                            onEdit={() => startEditing('inboxPath', config?.inboxPath || '')}
                            onSave={handleSave}
                            onCancel={() => setEditingKey(null)}
                        >
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm overflow-hidden">
                                        <span className="truncate pr-2">{editingKey === 'inboxPath' ? editValue : (config?.inboxPath || 'Not selected')}</span>
                                    </div>
                                    {editingKey === 'inboxPath' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const selected = await open({ directory: true, multiple: false, title: 'Select Inbox Folder' });
                                                    if (selected) setEditValue(selected as string);
                                                } catch (err) { console.error(err); }
                                            }}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent border border-input bg-background shadow-sm px-3 py-2 shrink-0"
                                        >
                                            <FolderOpen size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto-Deploy</label>
                                        <p className="text-[10px] text-muted-foreground">Automatically process new files</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const newVal = !config?.autoDeploy;
                                            await saveConfig({ autoDeploy: newVal });
                                            try { await sidecarApi.okaWatcherToggle(); } catch(e) {}
                                        }}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                            config?.autoDeploy ? "bg-primary" : "bg-input"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                            config?.autoDeploy ? "translate-x-4" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </SettingsCard>
                    </div>
                </div>

                <div className="mt-8">
                    <Card className="border-destructive/30 border">
                        <CardHeader title="Danger Zone" description="Permanent data deletion" />
                        <CardContent>
                            <button
                                onClick={handleClear}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-destructive/90 bg-destructive text-destructive-foreground shadow h-9 px-4 py-2"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Reset Config
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    /* ────── Profiles Section ────── */
    function renderProfiles() {
        return (
            <div className="w-full space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Identity Profiles</h2>
                    <p className="text-muted-foreground">Manage your core foundational profiles.</p>
                </div>
                {renderProfileCategory('Domains', PROFILE_CARDS)}
            </div>
        )
    }

    function renderProfileCategory(title: string, cards: ProfileCardDef[]) {
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => (
                        <button
                            key={card.id}
                            onClick={() => setActiveProfileId(card.id)}
                            className="group flex items-start gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors text-left"
                        >
                            <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors mt-0.5">
                                {card.icon}
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <h4 className="font-semibold">{card.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                            </div>
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-50 transition-opacity mt-1 shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    /* ────── Intelligence Section ────── */
    function renderIntelligence() {
        return (
            <div className="w-full space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Intelligence Tuning</h2>
                    <p className="text-muted-foreground">Calibrate memory and persona directives.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader title="Memory & Context (RAG Engine)" description="Manage the local vector database." icon={<Database size={18} className="text-primary" />} />
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-3 p-3 rounded-md bg-muted/50 border">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium">Vault Sync</div>
                                            <div className="text-xs text-muted-foreground">Force re-read of Obsidian Vault.</div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (ragStatus?.status === 'syncing') return;
                                                setRagStatus(prev => ({ ...(prev || { progress: 0, total: 0 }), status: 'syncing', message: 'Syncing...' }));
                                                try { await sidecarApi.ragSyncVault() } catch (e: any) { alert(e.message) }
                                            }}
                                            disabled={ragStatus?.status === 'syncing'}
                                            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {ragStatus?.status === 'syncing' ? 'Syncing...' : 'Force Sync Vault'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 p-3 rounded-md bg-muted/50 border">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-medium">Notion Mirror</div>
                                            <div className="text-xs text-muted-foreground">Pull all Notion databases to Obsidian.</div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (notionStatus?.status === 'syncing') return;
                                                setNotionStatus(prev => ({ ...(prev || { progress: 0, total: 0 }), status: 'syncing', message: 'Syncing...' }));
                                                try { await sidecarApi.syncNotionMirror() } catch (e: any) { alert(e.message) }
                                            }}
                                            disabled={notionStatus?.status === 'syncing'}
                                            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {notionStatus?.status === 'syncing' ? 'Syncing...' : 'Sync Notion'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title="Strategist Blueprint" description="Visual trait calibration." icon={<Sliders size={18} className="text-primary" />} />
                        <CardContent>
                            <StrategistSliders value={config?.strategistSliders || '{}'} onChange={(val) => saveConfig({ strategistSliders: val })} type="strategist" />
                        </CardContent>
                    </Card>

                    {renderProfileCategory('Logic & Ground Truth', PROFILE_CARDS.filter(c => c.category !== 'profiles'))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 md:block w-full mx-auto animate-in fade-in duration-300">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <SettingsIcon size={24} className="text-muted-foreground" />
                    Settings
                </h2>
                <p className="text-muted-foreground">Manage your architecture and credentials.</p>
            </div>

            <div className="shrink-0 bg-border h-[1px] w-full my-6" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-4 lg:pb-0 px-4 pt-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.section}
                                onClick={() => { setActiveSection(item.section); setActiveProfileId(null); }}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground justify-start shrink-0 lg:w-full",
                                    activeSection === item.section ? "bg-muted text-foreground" : "text-muted-foreground"
                                )}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <div className="flex-1 lg:max-w-4xl min-w-0">
                    {activeProfileId ? renderProfileDetail() : (
                        activeSection === 'general' ? renderGeneral() :
                            activeSection === 'profiles' ? renderProfiles() :
                                activeSection === 'intelligence' ? renderIntelligence() :
                                    renderGeneral()
                    )}
                </div>
            </div>
        </div>
    )
}
