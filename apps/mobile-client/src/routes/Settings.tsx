import { useState, useEffect } from 'react'
import {
    Key, Trash2, Zap, Plus, X, User, ChevronRight, Check, Database, Settings as SettingsIcon, Shield, RefreshCw, FolderOpen, Info
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { useConfig, SavedApiKey } from '@/lib/ConfigContext'
import { cn } from '@/lib/utils'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'

export default function Settings() {
    const { config, saveConfig, isLoading, addApiKey, deleteApiKey } = useConfig()
    const [activeSection, setActiveSection] = useState<'general' | 'ai'>('ai')
    
    const [isAddingKey, setIsAddingKey] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [newKeyProvider, setNewKeyProvider] = useState('google');
    const [aiTab, setAiTab] = useState<'primary' | 'planner' | 'utility'>('primary')

    if (isLoading || !config) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    const handleAddNewKey = () => {
        if (!newKeyName || !newKeyValue) return;
        addApiKey({
            id: Math.random().toString(36).substring(7),
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
        <div className="flex flex-col h-full bg-background overflow-y-auto pb-32">
            <div className="px-6 pt-12 pb-8">
                <nav className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">SYSTEM</span>
                    <ChevronRight size={10} className="text-border" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">NEURAL_CONFIG</span>
                </nav>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-10">Settings</h1>

                <div className="flex bg-muted p-1 mb-10 rounded-2xl">
                    <button
                        onClick={() => setActiveSection('ai')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                            activeSection === 'ai' ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                        )}
                    >
                        AI_STACK
                    </button>
                    <button
                        onClick={() => setActiveSection('general')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                            activeSection === 'general' ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                        )}
                    >
                        INFRASTRUCTURE
                    </button>
                </div>

                {activeSection === 'ai' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* API Key Vault */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Credential_Vault</h2>
                                <Shield size={14} className="text-muted-foreground/30" />
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {config.savedApiKeys?.map((k) => (
                                    <div key={k.id} className="p-5 bg-muted/10 border border-border rounded-2xl flex justify-between items-center group transition-all active:scale-[0.98]">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-tight">{k.name}</p>
                                            <p className="text-[12px] font-mono text-muted-foreground opacity-50">••••{k.key.slice(-4)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[8px] font-black uppercase border border-primary/20 px-2 py-0.5 rounded-sm text-primary/60">{k.provider}</span>
                                            <button onClick={() => deleteApiKey(k.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {isAddingKey ? (
                                    <div className="p-6 border-2 border-primary/20 bg-primary/5 rounded-[2rem] space-y-6 animate-in zoom-in-95 duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase text-primary/40 tracking-widest ml-1">Key Label</label>
                                                <input 
                                                    placeholder="E.G. PRO_KEY"
                                                    value={newKeyName}
                                                    onChange={(e) => setNewKeyName(e.target.value.toUpperCase())}
                                                    className="w-full bg-background border border-border p-4 rounded-xl text-xs font-black focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase text-primary/40 tracking-widest ml-1">Provider Engine</label>
                                                <select
                                                    value={newKeyProvider}
                                                    onChange={(e) => setNewKeyProvider(e.target.value)}
                                                    className="w-full bg-background border border-border p-4 rounded-xl text-xs font-black focus:outline-none"
                                                >
                                                    <option value="google">GOOGLE_GEMINI</option>
                                                    <option value="openai">OPENAI</option>
                                                    <option value="anthropic">ANTHROPIC</option>
                                                    <option value="groq">GROQ_CLOUD</option>
                                                    <option value="openrouter">OPENROUTER</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase text-primary/40 tracking-widest ml-1">Secure Token</label>
                                                <input 
                                                    type="password"
                                                    placeholder="PASTE_API_KEY"
                                                    value={newKeyValue}
                                                    onChange={(e) => setNewKeyValue(e.target.value)}
                                                    className="w-full bg-background border border-border p-4 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <Button onClick={handleAddNewKey} className="flex-1 py-6 font-black uppercase text-[10px] tracking-widest shadow-xl">Commit_Key</Button>
                                            <Button variant="outline" onClick={() => setIsAddingKey(false)} className="py-6 border-2 font-black uppercase text-[10px] tracking-widest">Abort</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingKey(true)}
                                        className="p-10 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary transition-all active:scale-[0.98]"
                                    >
                                        <Plus size={24} strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Register_Credential</span>
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Intelligence Tiers */}
                        <section className="space-y-8 pt-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Reasoning_Tiers</h2>
                                <Zap size={14} className="text-muted-foreground/30" />
                            </div>
                            
                            <div className="flex border-b border-border/50 gap-8 overflow-x-auto scrollbar-hide pb-px">
                                {['primary', 'planner', 'utility'].map((tier) => (
                                    <button
                                        key={tier}
                                        onClick={() => setAiTab(tier as any)}
                                        className={cn(
                                            "pb-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-4 relative",
                                            aiTab === tier ? "border-primary text-primary" : "border-transparent text-muted-foreground/40"
                                        )}
                                    >
                                        {tier}
                                        {aiTab === tier && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-8 pt-4">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Provider_Protocol</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['google', 'openai', 'anthropic', 'groq', 'openrouter'].map(p => {
                                            const current = aiTab === 'primary' ? config.aiProvider : (aiTab === 'planner' ? config.plannerProvider : config.utilityProvider);
                                            const isSelected = current === p;
                                            return (
                                                <button 
                                                    key={p}
                                                    onClick={() => {
                                                        if (aiTab === 'primary') saveConfig({ aiProvider: p });
                                                        else if (aiTab === 'planner') saveConfig({ plannerProvider: p });
                                                        else saveConfig({ utilityProvider: p });
                                                    }}
                                                    className={cn(
                                                        "p-4 border rounded-xl text-left flex items-center justify-between transition-all active:scale-[0.99]",
                                                        isSelected ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-muted/5 text-primary/60 hover:bg-muted/10"
                                                    )}
                                                >
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.replace('_', ' ')}</span>
                                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Model_Identifier</label>
                                    <input
                                        value={aiTab === 'primary' ? config.aiModel : (aiTab === 'planner' ? config.plannerModel : config.utilityModel)}
                                        onChange={(e) => {
                                            const m = e.target.value;
                                            if (aiTab === 'primary') saveConfig({ aiModel: m });
                                            else if (aiTab === 'planner') saveConfig({ plannerModel: m });
                                            else saveConfig({ utilityModel: m });
                                        }}
                                        className="w-full bg-muted/10 border border-border p-5 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="E.G. GPT-4O"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Authenticated_Session</label>
                                    <div className="flex flex-wrap gap-2">
                                        {config.savedApiKeys?.map(k => {
                                            const isSelected = (aiTab === 'primary' && config.aiApiKey === k.key) ||
                                                               (aiTab === 'planner' && config.plannerApiKey === k.key) ||
                                                               (aiTab === 'utility' && config.utilityApiKey === k.key);
                                            return (
                                                <button
                                                    key={k.id}
                                                    onClick={() => selectSavedKey(aiTab, k)}
                                                    className={cn(
                                                        "px-5 py-3 text-[10px] font-black uppercase tracking-widest border-2 transition-all rounded-xl",
                                                        isSelected ? "bg-primary text-white border-primary shadow-lg" : "bg-background border-border text-muted-foreground hover:border-primary/20"
                                                    )}
                                                >
                                                    {k.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeSection === 'general' && (
                    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
                        <section className="space-y-8">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Appearance_Protocol</h2>
                                <Zap size={14} className="text-muted-foreground/30" />
                            </div>
                            <div className="p-8 border-2 border-border/50 bg-muted/5 rounded-[2.5rem] flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Interface_Mode</p>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Toggle light/dark architecture</p>
                                </div>
                                <ThemeSwitch />
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Vault_Orchestration</h2>
                                <Database size={14} className="text-muted-foreground/30" />
                            </div>
                            <div className="space-y-8 p-8 border-2 border-border/50 bg-muted/5 rounded-[2.5rem]">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Vault_Status</p>
                                            <p className={cn(
                                                "text-[11px] font-bold uppercase",
                                                config.obsidianVaultPath ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {config.obsidianVaultPath ? "Connected_Ready" : "Disconnected_Pending"}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                            config.obsidianVaultPath ? "bg-emerald-500" : "bg-amber-500"
                                        )} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Current_Path</label>
                                        <div className="w-full bg-background border border-border p-5 rounded-2xl text-[10px] font-mono font-bold text-muted-foreground break-all opacity-60">
                                            {config.obsidianVaultPath || "NO_PATH_SPECIFIED"}
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={async () => {
                                            try {
                                                const res = await (sidecarApi as any).pickVaultFolder();
                                                if (res.success) {
                                                    saveConfig({ obsidianVaultPath: res.path });
                                                }
                                            } catch (err) {
                                                console.error("Picker failed", err);
                                            }
                                        }}
                                        className="w-full py-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"
                                    >
                                        <FolderOpen size={18} />
                                        {config.obsidianVaultPath ? "Switch_Vault_Root" : "Connect_Obsidian_Vault"}
                                    </Button>
                                </div>

                                <div className="p-5 bg-primary/5 border-l-4 border-primary rounded-r-2xl space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <Info size={12} /> Optimization_Note
                                    </p>
                                    <p className="text-[11px] font-medium text-primary/70 leading-relaxed italic">
                                        LifeOS utilizes a direct bridge to your local Obsidian container. Ensure Scriptable has 'Always' access to your File Provider for real-time synchronization.
                                    </p>
                                </div>
                            </div>
                        </section>
                        
                        <div className="py-10 flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                            <SettingsIcon size={40} strokeWidth={1} className="animate-spin duration-[10s]" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">KNOWLEDGE_PIPELINE_STABLE</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
