import { useState } from 'react';
import { useConfig } from '@/lib/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, BrainCircuit, Loader2, ShieldCheck, Zap } from 'lucide-react';

export default function Onboarding() {
    const { config, saveConfig } = useConfig();
    const [formData, setFormData] = useState({
        notionApiKey: config?.notionApiKey || '',
        geminiApiKey: config?.geminiApiKey || '',
        obsidianVaultPath: config?.obsidianVaultPath || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const handlePickDirectory = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Obsidian Vault Directory'
            });
            if (selected) {
                setFormData(prev => ({ ...prev, obsidianVaultPath: selected as string }));
            }
        } catch (err) {
            console.error('Failed to open directory picker:', err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await saveConfig(formData);
            navigate('/dashboard');
        } catch (err) {
            alert('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-lg space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

                {/* Minimal Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 mb-2">
                        <BrainCircuit className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight">Setup Life OS</h1>
                        <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                            Configure your environment variables to enable strategic synchronization.
                        </p>
                    </div>
                </div>

                {/* Form Container */}
                <form onSubmit={handleSave} className="space-y-8 bg-card border border-border p-10 rounded-[2.5rem] shadow-sm">

                    <div className="grid grid-cols-1 gap-8">
                        {/* Notion */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                    Notion API Integration
                                </label>
                                <span className="text-[10px] text-muted-foreground/50 font-medium">Required</span>
                            </div>
                            <input
                                type="password"
                                placeholder="secret_..."
                                value={formData.notionApiKey}
                                onChange={e => setFormData(prev => ({ ...prev, notionApiKey: e.target.value }))}
                                required
                                className="w-full bg-muted/30 border border-border rounded-xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-background transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>

                        {/* Gemini */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                    Google Gemini Key
                                </label>
                                <span className="text-[10px] text-muted-foreground/50 font-medium">Core LLM</span>
                            </div>
                            <input
                                type="password"
                                placeholder="AIza..."
                                value={formData.geminiApiKey}
                                onChange={e => setFormData(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                                required
                                className="w-full bg-muted/30 border border-border rounded-xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-background transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>

                        {/* Obsidian */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary" />
                                Obsidian Local Vault
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="/Users/name/Vault"
                                    value={formData.obsidianVaultPath}
                                    onChange={e => setFormData(prev => ({ ...prev, obsidianVaultPath: e.target.value }))}
                                    required
                                    className="flex-1 bg-muted/30 border border-border rounded-xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-background transition-all placeholder:text-muted-foreground/30"
                                />
                                <button
                                    type="button"
                                    onClick={handlePickDirectory}
                                    className="px-5 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-muted transition-all active:scale-95"
                                >
                                    <FolderOpen size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-4 bg-foreground text-background rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    Initialize Workspace
                                    <Zap size={14} className="text-primary fill-current" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Policy */}
                <div className="flex flex-col items-center gap-6 opacity-60">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Local Privacy
                        </div>
                        <div className="w-px h-3 bg-border" />
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <Zap size={12} className="text-primary" />
                            Direct Sync
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.3em]">
                        Life OS &bull; Deployment Alpha
                    </p>
                </div>
            </div>
        </div>
    );
}
