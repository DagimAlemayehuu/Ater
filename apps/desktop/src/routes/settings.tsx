import React, { useState, useEffect } from 'react'
import {
    Database, Key, HardDrive, Trash2, Edit2, FolderOpen, ShieldCheck, Sun, Moon, Zap, Plus, X,
    User, BookOpen, DollarSign, Activity, Brain, Bot, Sliders, ChevronLeft, ChevronRight, ArrowRight, Wand2, Info, Settings as SettingsIcon, Target, MessageSquare, RefreshCw, Check
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useConfig, SavedApiKey } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import ProfileEditor from '@/components/profiles/ProfileEditor'
import RateLimitMonitor from '@/components/intelligence/RateLimitMonitor'
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
]

/* ─────────────────── Components ─────────────────── */

function Card({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("rounded-lg border border-border bg-background shadow-sm overflow-hidden", className)}>{children}</div>
}

function CardHeader({ title, description, icon }: { title: string, description?: React.ReactNode, icon?: React.ReactNode }) {
    return (
        <div className="flex flex-row items-center justify-between p-6 pb-4 border-b border-border/50 bg-muted/20">
            <div className="space-y-1">
                <h3 className="tracking-tight text-lg font-bold text-foreground">{title}</h3>
                {description && <p className="text-[13px] text-muted-foreground font-medium">{description}</p>}
            </div>
            {icon && icon}
        </div>
    )
}

function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("p-6", className)}>{children}</div>
}

const SettingsCard = ({ title, icon, value, children, onEdit, isEditing, onSave, onCancel }: any) => (
    <Card className="flex flex-col justify-between h-full">
        <CardHeader title={title} description={value} icon={<div className="text-muted-foreground">{icon}</div>} />
        <CardContent className="flex-1 flex flex-col justify-between">
            <div className="w-full pb-4">{children}</div>

            <div className="flex justify-end pt-4 border-t border-border mt-auto">
                {!isEditing ? (
                    <button onClick={onEdit} className="inline-flex items-center justify-center rounded px-4 py-2 text-[12px] font-medium text-muted-foreground bg-background border border-border hover:bg-muted transition-colors">
                        <Edit2 size={14} className="mr-2" /> Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="inline-flex items-center justify-center rounded px-4 py-2 text-[12px] font-medium text-muted-foreground bg-background border border-border hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button onClick={onSave} className="inline-flex items-center justify-center rounded px-4 py-2 text-[12px] font-medium text-primary-foreground bg-primary hover:opacity-90 transition-colors">
                            Save
                        </button>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
)

/* ─────────────────── Main Component ─────────────────── */

export default function Settings() {
    const { config, saveConfig, isLoading, addApiKey, deleteApiKey } = useConfig()
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [activeSection, setActiveSection] = useState<SettingsSection>('general')
    const [activeProfileId, setActiveProfileId] = useState<ProfileId | null>(null)

    const [isAddingKey, setIsAddingKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newKeyProvider, setNewKeyProvider] = useState('google');

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
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-[12px] font-medium text-muted-foreground">Initializing engine settings...</p>
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
                    className="flex items-center gap-2 mb-2 text-[12px] font-medium hover:underline text-muted-foreground hover:text-foreground w-max"
                >
                    <ChevronLeft size={16} />
                    All Profiles
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{card.title} Profile</h2>
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
        const handleAddNewKey = () => {
            if (!newKeyName || !newKeyValue) return;
            addApiKey({
                id: crypto.randomUUID(),
                name: newKeyName,
                key: newKeyValue,
                provider: newKeyProvider
            });
            setNewKeyName('');
            setNewKeyValue('');
            setIsAddingKey(false);
        };

        const selectSavedKey = (level: 'primary' | 'planner' | 'utility', keyObj: SavedApiKey) => {
            if (level === 'primary') {
                saveConfig({ aiProvider: keyObj.provider, aiApiKey: keyObj.key });
            } else if (level === 'planner') {
                saveConfig({ plannerProvider: keyObj.provider, plannerApiKey: keyObj.key });
            } else {
                saveConfig({ utilityProvider: keyObj.provider, utilityApiKey: keyObj.key });
            }
        };

        return (
            <div className="w-full space-y-8 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">General Settings</h2>
                    <p className="text-muted-foreground text-sm">Manage credentials and local vault integrations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* API Key Manager */}
                    <Card className="md:col-span-2">
                        <CardHeader 
                            title="Local API Key Vault" 
                            description="Securely store and name your API keys for easy switching." 
                            icon={<ShieldCheck size={18} className="text-muted-foreground" />} 
                        />
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {config?.savedApiKeys?.map((k) => (
                                    <div key={k.id} className="group relative flex flex-col p-3 rounded border border-border bg-muted/20 hover:border-primary/30 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground truncate max-w-[120px]">{k.name}</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-background border border-border font-bold uppercase text-muted-foreground">{k.provider}</span>
                                        </div>
                                        <div className="text-[12px] font-mono text-muted-foreground truncate opacity-60">••••••••{k.key.slice(-4)}</div>
                                        
                                        <button 
                                            onClick={() => { if(confirm(`Delete ${k.name}?`)) deleteApiKey(k.id) }}
                                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}

                                {isAddingKey ? (
                                    <div className="flex flex-col p-3 rounded border border-primary/50 bg-primary/5 space-y-2 animate-in zoom-in-95 duration-200">
                                        <input 
                                            placeholder="Key Name (e.g. My Gemini Pro)"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-[11px] focus:outline-none"
                                            autoFocus
                                        />
                                        <select
                                            value={newKeyProvider}
                                            onChange={(e) => setNewKeyProvider(e.target.value)}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-[11px] focus:outline-none"
                                        >
                                            <option value="google">Google</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="groq">Groq</option>
                                            <option value="openrouter">OpenRouter</option>
                                        </select>
                                        <input 
                                            type="password"
                                            placeholder="Paste API Key"
                                            value={newKeyValue}
                                            onChange={(e) => setNewKeyValue(e.target.value)}
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-[11px] focus:outline-none font-mono"
                                        />
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={handleAddNewKey} className="flex-1 bg-primary text-primary-foreground rounded py-1 text-[10px] font-bold uppercase tracking-widest">Add</button>
                                            <button onClick={() => setIsAddingKey(false)} className="px-2 bg-muted text-muted-foreground rounded py-1 text-[10px]"><X size={12}/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingKey(true)}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-dashed border-border hover:border-primary/30 hover:bg-muted/10 transition-all text-muted-foreground gap-1"
                                    >
                                        <Plus size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">New Key</span>
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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
                        <div className="space-y-6 text-foreground">
                            {/* Tabs Header */}
                            <div className="flex border-b border-border mb-4">
                                <button 
                                    onClick={() => setAiTab('primary')}
                                    className={cn(
                                        "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                                        aiTab === 'primary' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    L1: Synthesis
                                </button>
                                <button 
                                    onClick={() => setAiTab('planner')}
                                    className={cn(
                                        "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                                        aiTab === 'planner' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    L2: Planning
                                </button>
                                <button 
                                    onClick={() => setAiTab('utility')}
                                    className={cn(
                                        "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                                        aiTab === 'utility' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    L3: Utility
                                </button>
                            </div>

                            {/* Saved Key Selection */}
                            <div className="space-y-2 pb-4 border-b border-border/50">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Key size={10} /> Quick Load Saved Key
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {config?.savedApiKeys?.length === 0 && (
                                        <p className="text-[11px] text-muted-foreground/40 italic">No keys saved in vault yet.</p>
                                    )}
                                    {config?.savedApiKeys?.map(k => {
                                        const isSelected = (aiTab === 'primary' && config.aiApiKey === k.key) ||
                                                           (aiTab === 'planner' && config.plannerApiKey === k.key) ||
                                                           (aiTab === 'utility' && config.utilityApiKey === k.key);
                                        return (
                                            <button
                                                key={k.id}
                                                onClick={() => selectSavedKey(aiTab, k)}
                                                className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1.5",
                                                    isSelected 
                                                        ? "bg-primary border-primary text-primary-foreground" 
                                                        : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50"
                                                )}
                                            >
                                                {isSelected && <Check size={10} />}
                                                {k.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {aiTab === 'primary' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
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
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
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
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                                                autoFocus
                                                placeholder={`Enter ${config?.aiProvider.toUpperCase()} Key`}
                                            />
                                        ) : (
                                            <div className="px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent">
                                                <span>{config?.aiApiKey ? '••••••••' + config?.aiApiKey.slice(-4) : 'Not configured'}</span>
                                                <Key size={14} className="text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L1 Model ID</label>
                                        <input
                                            type="text"
                                            value={config?.aiModel || ''}
                                            onChange={(e) => saveConfig({ aiModel: e.target.value })}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleTestConnection('primary')}
                                            disabled={testStatus.loading || !config?.aiApiKey}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[12px] font-medium transition-all border",
                                                testStatus.loading && testTarget === 'primary' ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                                    testStatus.success === true && testTarget === 'primary' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                        testStatus.success === false && testTarget === 'primary' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                                            "bg-background hover:bg-muted text-muted-foreground border-border"
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
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L2 Provider</label>
                                        <select
                                            value={config?.plannerProvider || 'google'}
                                            onChange={(e) => {
                                                const provider = e.target.value;
                                                let defaultModel = 'gemini-2.0-flash';
                                                saveConfig({ plannerProvider: provider, plannerModel: defaultModel });
                                            }}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
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
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                                                autoFocus
                                                placeholder="Defaults to L1 Key"
                                            />
                                        ) : (
                                            <div className="px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent">
                                                <span>{config?.plannerApiKey ? '••••••••' + config?.plannerApiKey.slice(-4) : 'Using L1 Key'}</span>
                                                <Key size={14} className="text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L2 Model ID</label>
                                        <input
                                            type="text"
                                            value={config?.plannerModel || ''}
                                            onChange={(e) => saveConfig({ plannerModel: e.target.value })}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleTestConnection('planner')}
                                            disabled={testStatus.loading || (!config?.plannerApiKey && !config?.aiApiKey)}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[12px] font-medium transition-all border",
                                                testStatus.loading && testTarget === 'planner' ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                                    testStatus.success === true && testTarget === 'planner' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                        testStatus.success === false && testTarget === 'planner' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                                            "bg-background hover:bg-muted text-muted-foreground border-border"
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
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L3 Provider</label>
                                        <select
                                            value={config?.utilityProvider || 'google'}
                                            onChange={(e) => {
                                                const provider = e.target.value;
                                                let defaultModel = 'gemini-1.5-flash-8b';
                                                saveConfig({ utilityProvider: provider, utilityModel: defaultModel });
                                            }}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
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
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                                                autoFocus
                                                placeholder="Defaults to L2 Key"
                                            />
                                        ) : (
                                            <div className="px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent">
                                                <span>{config?.utilityApiKey ? '••••••••' + config?.utilityApiKey.slice(-4) : 'Using L2 Key'}</span>
                                                <Key size={14} className="text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">L3 Model ID</label>
                                        <input
                                            type="text"
                                            value={config?.utilityModel || ''}
                                            onChange={(e) => saveConfig({ utilityModel: e.target.value })}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleTestConnection('utility')}
                                            disabled={testStatus.loading || (!config?.utilityApiKey && !config?.plannerApiKey && !config?.aiApiKey)}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[12px] font-medium transition-all border",
                                                testStatus.loading && testTarget === 'utility' ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                                    testStatus.success === true && testTarget === 'utility' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                        testStatus.success === false && testTarget === 'utility' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                                            "bg-background hover:bg-muted text-muted-foreground border-border"
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
                                    "text-[11px] mt-2 px-2 py-1.5 rounded border font-medium",
                                    testStatus.success ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-destructive/10 border-destructive/20 text-destructive"
                                )}>
                                    {testStatus.message}
                                </p>
                            )}

                            {/* Real-time Rate Limit Tracker */}
                            <div className="pt-6 border-t border-border/50 mt-6">
                                <RateLimitMonitor config={config} activeTier={aiTab} />
                            </div>
                        </div>
                    </SettingsCard>

                    {/* Obsidian & Inbox */}
                    <div className="flex flex-col gap-6">
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
                                <div className="flex-1 px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent overflow-hidden">
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
                                        className="inline-flex items-center justify-center rounded bg-background text-muted-foreground transition-colors hover:bg-muted border border-border px-3 py-2 shrink-0"
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
                                <div className="flex-1 px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent overflow-hidden">
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
                                        className="inline-flex items-center justify-center rounded bg-background text-muted-foreground transition-colors hover:bg-muted border border-border px-3 py-2 shrink-0"
                                    >
                                        <FolderOpen size={16} />
                                    </button>
                                )}
                            </div>
                        </SettingsCard>

                        <SettingsCard
                            title="Inbox Watcher"
                            icon={<Zap size={18} className="text-foreground" />}
                            value="Autonomous file ingestion pipeline"
                            isEditing={editingKey === 'inboxPath'}
                            onEdit={() => startEditing('inboxPath', config?.inboxPath || '')}
                            onSave={handleSave}
                            onCancel={() => setEditingKey(null)}
                        >
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1 px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent overflow-hidden">
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
                                            className="inline-flex items-center justify-center rounded bg-background text-muted-foreground transition-colors hover:bg-muted border border-border px-3 py-2 shrink-0"
                                        >
                                            <FolderOpen size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 rounded border border-border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Auto-Deploy</label>
                                        <p className="text-[11px] text-muted-foreground/60">Automatically process new files</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const newVal = !config?.autoDeploy;
                                            await saveConfig({ autoDeploy: newVal });
                                            try { await sidecarApi.okaWatcherToggle(); } catch(e) {}
                                        }}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                                            config?.autoDeploy ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
                                            config?.autoDeploy ? "translate-x-4" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </SettingsCard>
                    </div>
                </div>

                <div className="mt-12">
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader title="Danger Zone" description="Permanent data deletion" />
                        <CardContent>
                            <button
                                onClick={handleClear}
                                className="inline-flex items-center justify-center rounded text-[12px] font-medium transition-colors hover:bg-destructive/90 bg-destructive text-destructive-foreground shadow-sm h-9 px-4 py-2"
                            >
                                <Trash2 size={14} className="mr-2" />
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
            <div className="w-full space-y-8 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Identity Profiles</h2>
                    <p className="text-muted-foreground text-sm">Manage your core foundational profiles.</p>
                </div>
                {renderProfileCategory('Domains', PROFILE_CARDS)}
            </div>
        )
    }

    function renderProfileCategory(title: string, cards: ProfileCardDef[]) {
        return (
            <div className="space-y-4">
                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => (
                        <button
                            key={card.id}
                            onClick={() => setActiveProfileId(card.id)}
                            className="group flex items-start gap-4 p-5 rounded-lg border border-border bg-background shadow-sm hover:border-muted-foreground/30 transition-all text-left"
                        >
                            <div className="p-2 rounded bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground transition-colors">
                                {card.icon}
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <h4 className="font-bold text-foreground">{card.title}</h4>
                                <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">{card.description}</p>
                            </div>
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0 text-muted-foreground" />
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    /* ────── Intelligence Section ────── */
    function renderIntelligence() {
        return (
            <div className="w-full space-y-8 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Intelligence Tuning</h2>
                    <p className="text-muted-foreground text-sm">Calibrate memory and persona directives.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader title="Memory & Context (RAG Engine)" description="Manage the local vector database." icon={<Database size={18} className="text-muted-foreground" />} />
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 p-4 rounded bg-muted/30 border border-border">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[13px] font-bold text-foreground">Vault Sync</div>
                                        <div className="text-[12px] text-muted-foreground">Force re-read of Obsidian Vault.</div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (ragStatus?.status === 'syncing') return;
                                            setRagStatus(prev => ({ ...(prev || { progress: 0, total: 0 }), status: 'syncing', message: 'Syncing...' }));
                                            try { await sidecarApi.ragSyncVault() } catch (e: any) { alert(e.message) }
                                        }}
                                        disabled={ragStatus?.status === 'syncing'}
                                        className="text-[12px] font-medium bg-background border border-border text-muted-foreground hover:bg-muted px-4 py-2 rounded transition-colors disabled:opacity-50"
                                    >
                                        {ragStatus?.status === 'syncing' ? 'Syncing...' : 'Force Sync Vault'}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {renderProfileCategory('Logic & Ground Truth', PROFILE_CARDS.filter(c => c.category !== 'profiles'))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-64 shrink-0 border-r border-border bg-background pt-10 px-4">
                    <div className="mb-10 px-2 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            <span>System</span>
                            <span className="material-symbols-outlined text-[12px]"><ChevronRight size={12}/></span>
                            <span className="text-muted-foreground">Settings</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Config</h1>
                    </div>

                    <nav className="flex flex-col space-y-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.section}
                                onClick={() => { setActiveSection(item.section); setActiveProfileId(null); }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded text-[13px] font-medium transition-colors",
                                    activeSection === item.section 
                                        ? "bg-muted text-foreground" 
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <span className={cn("shrink-0", activeSection === item.section ? "text-foreground" : "text-muted-foreground")}>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-10 p-4 border-t border-border">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Immutable Rule</p>
                        <p className="text-[12px] text-muted-foreground/60 leading-relaxed">
                            System configuration is persisted locally. Core engine parameters are immutable unless audited.
                        </p>
                    </div>
                </aside>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto px-16 py-12">
                        {activeProfileId ? renderProfileDetail() : (
                            activeSection === 'general' ? renderGeneral() :
                                activeSection === 'profiles' ? renderProfiles() :
                                    activeSection === 'intelligence' ? renderIntelligence() :
                                        renderGeneral()
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
