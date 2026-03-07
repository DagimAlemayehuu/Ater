import { useState } from 'react';
import { useConfig } from '@/lib/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, BrainCircuit, RefreshCw } from 'lucide-react';

/**
 * Onboarding View
 * Mandatory full-screen gate for first-run configuration.
 */
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
        <div className="min-h-screen w-full bg-[#030303] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px]" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center gap-2 mb-12 text-center">
                    <div className="p-4 rounded-[2rem] bg-white/5 border border-white/10 mb-4 backdrop-blur-xl shadow-2xl">
                        <BrainCircuit className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                        Initialize Life OS
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-[280px]">
                        Sync your digital intelligence securely in a few steps.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Notion */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-500 group-focus-within:bg-white transition-colors" />
                            Notion API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="secret_..."
                                value={formData.notionApiKey}
                                onChange={e => setFormData(prev => ({ ...prev, notionApiKey: e.target.value }))}
                                required
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-zinc-500"
                            />
                        </div>
                    </div>

                    {/* Gemini */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-500 group-focus-within:bg-white transition-colors" />
                            Google Gemini Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="AIza..."
                                value={formData.geminiApiKey}
                                onChange={e => setFormData(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                                required
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    {/* Obsidian */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-500 group-focus-within:bg-white transition-colors" />
                            Obsidian Vault Path
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="/Users/name/Documents/Vault"
                                value={formData.obsidianVaultPath}
                                onChange={e => setFormData(prev => ({ ...prev, obsidianVaultPath: e.target.value }))}
                                required
                                className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-zinc-500"
                            />
                            <button
                                type="button"
                                onClick={handlePickDirectory}
                                className="px-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 text-zinc-400 hover:text-white"
                                title="Open Finder"
                            >
                                <FolderOpen className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm tracking-tight transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                INITIALIZING SYSTEMS...
                            </>
                        ) : (
                            'BOOT SYSTEM'
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
                        All data stays local &bull; Life OS v0.1.0 Alpha
                    </p>
                </div>
            </div>
        </div>
    );
}

