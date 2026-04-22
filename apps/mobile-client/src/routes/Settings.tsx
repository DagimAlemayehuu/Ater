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
                    <div className="space-y-10 animate-in fade-in duration-500">
                        {/* Local API Key Vault */}
                        <section className="space-y-6">
                            <div className="px-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-xl font-bold tracking-tight">Local API Key Vault</h2>
                                    <Shield size={18} className="text-muted-foreground/40" />
                                </div>
                                <p className="text-sm text-muted-foreground">Securely store and name your API keys for easy switching.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {config.savedApiKeys?.map((k) => (
                                    <div key={k.id} className="p-4 bg-card border border-border rounded-xl flex flex-col justify-between h-24 group transition-all hover:border-primary/50 relative">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-foreground">{k.name}</p>
                                            <span className="text-[9px] font-bold uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground tracking-tighter">{k.provider}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm font-mono text-muted-foreground">••••••••{k.key.slice(-4)}</p>
                                            <button onClick={() => deleteApiKey(k.id)} className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {isAddingKey ? (
                                    <div className="p-5 border-2 border-primary/20 bg-primary/5 rounded-2xl space-y-4 animate-in zoom-in-95 duration-300">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold uppercase text-primary/60 tracking-widest ml-1">Label</label>
                                                <input 
                                                    placeholder="KEY NAME"
                                                    value={newKeyName}
                                                    onChange={(e) => setNewKeyName(e.target.value.toUpperCase())}
                                                    className="w-full bg-background border border-border px-3 py-2 rounded-lg text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold uppercase text-primary/60 tracking-widest ml-1">Provider</label>
                                                <select
                                                    value={newKeyProvider}
                                                    onChange={(e) => setNewKeyProvider(e.target.value)}
                                                    className="w-full bg-background border border-border px-2 py-2 rounded-lg text-[10px] font-bold focus:outline-none"
                                                >
                                                    <option value="google">GOOGLE</option>
                                                    <option value="openai">OPENAI</option>
                                                    <option value="anthropic">ANTHROPIC</option>
                                                    <option value="groq">GROQ</option>
                                                    <option value="openrouter">OPENROUTER</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-primary/60 tracking-widest ml-1">API Token</label>
                                            <input 
                                                type="password"
                                                placeholder="PASTE_KEY_HERE"
                                                value={newKeyValue}
                                                onChange={(e) => setNewKeyValue(e.target.value)}
                                                className="w-full bg-background border border-border px-3 py-2 rounded-lg text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddNewKey} size="sm" className="flex-1 font-bold uppercase text-[9px] tracking-widest">Register Key</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddingKey(false)} className="font-bold uppercase text-[9px] tracking-widest">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingKey(true)}
                                        className="h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-all active:scale-[0.98] group"
                                    >
                                        <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">New Key</span>
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* AI Engine Intelligence */}
                        <section className="space-y-6 pt-4">
                            <div className="px-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-xl font-bold tracking-tight">AI Engine</h2>
                                    <Zap size={18} className="text-primary/40" />
                                </div>
                                <p className="text-sm text-muted-foreground">Select Provider and Configure API Keys</p>
                            </div>
                            
                            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                <div className="flex border-b border-border">
                                    {[
                                        { id: 'primary', label: 'L1:\nSYNTHESIS' },
                                        { id: 'planner', label: 'L2:\nPLANNING' },
                                        { id: 'utility', label: 'L3:\nUTILITY' }
                                    ].map((tier) => (
                                        <button
                                            key={tier.id}
                                            onClick={() => setAiTab(tier.id as any)}
                                            className={cn(
                                                "flex-1 px-4 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-pre-line leading-tight border-b-2",
                                                aiTab === tier.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                                            )}
                                        >
                                            {tier.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Quick Load Chips */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                                            <Key size={10} /> Quick Load Saved Key
                                        </div>
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
                                                            "px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all rounded-lg flex items-center gap-2",
                                                            isSelected ? "bg-foreground text-background border-foreground shadow-md" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                                                        )}
                                                    >
                                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                                        {k.name.toLowerCase()}
                                                    </button>
                                                );
                                            })}
                                            {(!config.savedApiKeys || config.savedApiKeys.length === 0) && (
                                                <p className="text-[10px] italic text-muted-foreground/50">No keys saved in vault...</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Provider Select */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">{aiTab.toUpperCase()} Provider</label>
                                        <select
                                            value={aiTab === 'primary' ? config.aiProvider : (aiTab === 'planner' ? config.plannerProvider : config.utilityProvider)}
                                            onChange={(e) => {
                                                const p = e.target.value;
                                                if (aiTab === 'primary') saveConfig({ aiProvider: p });
                                                else if (aiTab === 'planner') saveConfig({ plannerProvider: p });
                                                else saveConfig({ utilityProvider: p });
                                            }}
                                            className="w-full bg-muted/30 border border-border p-3.5 rounded-xl text-[11px] font-bold focus:outline-none appearance-none"
                                        >
                                            <option value="google">Google Gemini (Flash/Pro)</option>
                                            <option value="openai">OpenAI (GPT-4o/o1)</option>
                                            <option value="anthropic">Anthropic (Claude 3.5)</option>
                                            <option value="groq">Groq (Fast/Free)</option>
                                            <option value="openrouter">OpenRouter (Unified)</option>
                                        </select>
                                    </div>

                                    {/* API Key Input */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">{aiTab.toUpperCase()} API KEY</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={aiTab === 'primary' ? config.aiApiKey : (aiTab === 'planner' ? config.plannerApiKey : config.utilityApiKey)}
                                                onChange={(e) => {
                                                    const k = e.target.value;
                                                    if (aiTab === 'primary') saveConfig({ aiApiKey: k });
                                                    else if (aiTab === 'planner') saveConfig({ plannerApiKey: k });
                                                    else saveConfig({ utilityApiKey: k });
                                                }}
                                                className="w-full bg-muted/30 border border-border p-3.5 pr-10 rounded-xl text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                                placeholder="••••••••••••••••"
                                            />
                                            <Key size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                                        </div>
                                    </div>

                                    {/* Model Input */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">{aiTab.toUpperCase()} Model ID</label>
                                        <input
                                            value={aiTab === 'primary' ? config.aiModel : (aiTab === 'planner' ? config.plannerModel : config.utilityModel)}
                                            onChange={(e) => {
                                                const m = e.target.value;
                                                if (aiTab === 'primary') saveConfig({ aiModel: m });
                                                else if (aiTab === 'planner') saveConfig({ plannerModel: m });
                                                else saveConfig({ utilityModel: m });
                                            }}
                                            className="w-full bg-muted/30 border border-border p-3.5 rounded-xl text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="e.g. gemini-2.0-flash"
                                        />
                                    </div>

                                    {/* Test Button */}
                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                const originalText = btn.innerHTML;
                                                btn.disabled = true;
                                                btn.innerHTML = '<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div> Testing...';
                                                
                                                try {
                                                    const res = await (sidecarApi as any).testAiConnection(aiTab);
                                                    if (res.success) {
                                                        btn.innerHTML = '<span class="text-emerald-500 flex items-center gap-2 font-bold"><Check size={16} /> CONNECTION SUCCESSFUL</span>';
                                                        setTimeout(() => {
                                                            btn.innerHTML = originalText;
                                                            btn.disabled = false;
                                                        }, 3000);
                                                    } else {
                                                        btn.innerHTML = '<span class="text-destructive flex items-center gap-2 font-bold"><X size={16} /> CONNECTION FAILED</span>';
                                                        setTimeout(() => {
                                                            btn.innerHTML = originalText;
                                                            btn.disabled = false;
                                                            alert('Error: ' + res.message);
                                                        }, 3000);
                                                    }
                                                } catch (err: any) {
                                                    btn.innerHTML = originalText;
                                                    btn.disabled = false;
                                                    alert('Fatal Error: ' + err.message);
                                                }
                                            }}
                                            className="w-auto px-8 py-5 h-auto font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-primary hover:text-white border-2"
                                        >
                                            Test {aiTab === 'primary' ? 'L1' : aiTab === 'planner' ? 'L2' : 'L3'} Connection
                                        </Button>
                                        <span className="ml-4 text-[10px] text-muted-foreground/40 italic font-medium uppercase tracking-tighter">Verified session required for deployment</span>
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
