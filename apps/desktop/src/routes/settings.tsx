import React, { useState, useEffect } from 'react'
import {
    Database, Key, HardDrive, Trash2, Edit2, FolderOpen, ShieldCheck, Sun, Moon,
    User, BookOpen, DollarSign, Activity, Brain, Bot, Sliders, ChevronLeft, ArrowRight, Wand2, Info, Settings as SettingsIcon, Target, MessageSquare
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useConfig } from '@/lib/ConfigContext'
import { useTheme } from '@/context/theme-provider'
import { open } from '@tauri-apps/plugin-dialog'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import ProfileEditor from '@/components/profiles/ProfileEditor'
import {
    PERSONAL_PROFILE_SCHEMA,
    ACADEMIC_PROFILE_SCHEMA,
    FINANCIAL_PROFILE_SCHEMA,
    FITNESS_PROFILE_SCHEMA,
} from '@/components/profiles/schemas'

/* ─────────────────────── Types ─────────────────────── */

type SettingsSection = 'general' | 'profiles'
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
    const { config, saveConfig, updateCustomPersona, deleteCustomPersona } = useConfig()
    const { theme, setTheme } = useTheme()
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [activeSection, setActiveSection] = useState<SettingsSection>('general')
    const [activeProfileId, setActiveProfileId] = useState<ProfileId | null>(null)
    const [showMasterPlanGen, setShowMasterPlanGen] = useState(false)

    if (!config) return null

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

    const handlePickDirectory = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Obsidian Vault Directory'
            });
            if (selected) {
                setEditValue(selected as string);
                if (editingKey !== 'obsidianVaultPath') {
                    await saveConfig({ obsidianVaultPath: selected as string });
                }
            }
        } catch (err) {
            console.error('Failed to open directory picker:', err);
        }
    };

    const handleClear = async () => {
        if (confirm('Are you sure? This will reset all API keys and local paths.')) {
            await saveConfig({
                notionApiKey: '',
                geminiApiKey: '',
                obsidianVaultPath: '',
            })
            window.location.reload()
        }
    }

    /* ────── Sidebar ────── */
    const sidebarItems: { section: SettingsSection; label: string; icon: React.ReactNode }[] = [
        { section: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
        { section: 'profiles', label: 'Profiles', icon: <User size={16} /> },
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
                                <span>{config?.notionApiKey ? '••••••••' + config.notionApiKey.slice(-4) : 'Not configured'}</span>
                                <ShieldCheck size={14} className="opacity-50" />
                            </div>
                        )}
                    </SettingsCard>

                    {/* Gemini */}
                    <SettingsCard
                        title="Gemini AI Engine"
                        icon={<Brain size={18} />}
                        value="LLM API key and model selection"
                        isEditing={editingKey === 'geminiApiKey'}
                        onEdit={() => startEditing('geminiApiKey', config?.geminiApiKey || '')}
                        onSave={handleSave}
                        onCancel={() => setEditingKey(null)}
                    >
                        <div className="space-y-4">
                            {editingKey === 'geminiApiKey' ? (
                                <input
                                    type="password"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    autoFocus
                                />
                            ) : (
                                <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm">
                                    <span>{config?.geminiApiKey ? '••••••••' + config.geminiApiKey.slice(-4) : 'Not configured'}</span>
                                    <Key size={14} className="opacity-50" />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Model</label>
                                <select
                                    value={config?.geminiModel || 'gemini-2.5-flash'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        saveConfig({ geminiModel: val });
                                    }}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                </select>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* Obsidian */}
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
                            <div className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono text-muted-foreground flex items-center justify-between shadow-sm overflow-hidden content-center">
                                <span className="truncate pr-2">{editingKey === 'obsidianVaultPath' ? editValue : (config?.obsidianVaultPath || 'Not selected')}</span>
                            </div>
                            {editingKey === 'obsidianVaultPath' && (
                                <button
                                    onClick={async () => {
                                        await handlePickDirectory();
                                        if (editValue) await sidecarApi.okaUpdateSettings({ vault_path: editValue });
                                    }}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground border border-input bg-background shadow-sm px-3 py-2 shrink-0"
                                >
                                    <FolderOpen size={16} />
                                </button>
                            )}
                        </div>
                    </SettingsCard>
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
                            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                                Keys are securely stored via your OS keychain system. Clearing this will remove integrations.
                            </p>
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
                    {cards.map((card) => {
                        const profileValue = (config as any)?.[card.configKey!]?.trim() || '';
                        let completionPct = 0;
                        let status: 'Setup' | 'Partial' | 'Complete' = 'Setup';

                        if (profileValue.length > 0 && card.schema) {
                            const totalFields = card.schema.reduce((acc: number, s: any) => acc + s.fields.length, 0);
                            const filledFieldMatches = profileValue.match(/^[-*]\s+.+?:\s*(.+)$/gm);
                            const filledFieldsCount = filledFieldMatches
                                ? filledFieldMatches.filter((m: string) => {
                                    const val = m.split(/:\s*(.*)/s)[1];
                                    return val && val.trim().length > 0;
                                }).length
                                : 0;

                            completionPct = Math.min(100, Math.round((filledFieldsCount / totalFields) * 100));
                            if (completionPct === 100) status = 'Complete';
                            else if (completionPct > 0) status = 'Partial';
                        } else if (profileValue.length > 0) {
                            status = 'Complete';
                        }

                        return (
                            <button
                                key={card.id}
                                onClick={() => setActiveProfileId(card.id)}
                                className="group flex items-start gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors text-left"
                            >
                                <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors mt-0.5">
                                    {card.icon}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{card.title}</h4>
                                        {status !== 'Setup' && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none",
                                                status === 'Complete' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
                                            )}>
                                                {status === 'Complete' ? 'Done' : `${completionPct}%`}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {card.description}
                                    </p>
                                </div>
                                <ArrowRight size={16} className="opacity-0 group-hover:opacity-50 transition-opacity mt-1 shrink-0" />
                            </button>
                        )
                    })}
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
                <p className="text-muted-foreground">
                    Manage your preferences, profiles, API keys, and system architecture.
                </p>
            </div>

            <div className="shrink-0 bg-border h-[1px] w-full my-6" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-4 lg:pb-0 px-4 pt-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.section}
                                onClick={() => {
                                    setActiveSection(item.section)
                                    if (item.section === 'master_plan') setActiveProfileId('master_plan')
                                    else setActiveProfileId(null)
                                }}
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
                                renderGeneral()
                    )}
                </div>
            </div>
        </div>
    )
}
