import React, { useState, useEffect } from 'react'
import {
    Database, Key, HardDrive, Trash2, Edit2, FolderOpen, ShieldCheck, Zap, Plus, X,
    User, BookOpen, DollarSign, Activity, Brain, ChevronLeft, ChevronRight, ArrowRight, Settings as SettingsIcon, Target, Check
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useConfig, SavedApiKey } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import RateLimitMonitor from '@/components/intelligence/RateLimitMonitor'

/* ─────────────────────── Types ─────────────────────── */

type SettingsSection = 'general'

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

    const [isAddingKey, setIsAddingKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newKeyProvider, setNewKeyProvider] = useState('google');

    const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false })
    const [aiTab, setAiTab] = useState<'primary' | 'planner' | 'utility'>('primary')
    const [testTarget, setTestTarget] = useState<'primary' | 'planner' | 'utility'>('primary')

    if (isLoading || !config) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-[12px] font-medium text-muted-foreground">Loading...</p>
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
            console.error(err);
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
                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">General</h2>
                    <p className="text-muted-foreground text-sm">Manage credentials and local vault integrations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* API Key Manager */}
                    <Card className="md:col-span-2">
                        <CardHeader 
                            title="Key Vault" 
                            description="Securely store and name your API keys." 
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
                                    Synthesis
                                </button>
                                <button 
                                    onClick={() => setAiTab('planner')}
                                    className={cn(
                                        "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                                        aiTab === 'planner' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Planning
                                </button>
                                <button 
                                    onClick={() => setAiTab('utility')}
                                    className={cn(
                                        "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                                        aiTab === 'utility' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Utility
                                </button>
                            </div>

                            {/* Saved Key Selection */}
                            <div className="space-y-2 pb-4 border-b border-border/50">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Key size={10} /> Saved Keys
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
                                                const defaultModel = 'gemini-2.0-flash';
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
                                                const defaultModel = 'gemini-1.5-flash-8b';
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
                                <RateLimitMonitor config={config || undefined} activeTier={aiTab} />
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
                            title="School Folder"
                            icon={<BookOpen size={18} />}
                            value="Folder for notes (relative to vault)"
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
                            title="Inbox"
                            icon={<Zap size={18} className="text-foreground" />}
                            value="Auto-process files"
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
                                            try { await sidecarApi.okaWatcherToggle(); } catch(e) { console.error(e); }
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


    return (
        <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-16 py-12">
                    {renderGeneral()}
                </div>
            </div>
        </div>
    )
}
