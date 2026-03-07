import { useState } from 'react'
import { Database, Key, HardDrive, Trash2, Edit2, Check, X, FolderOpen } from 'lucide-react'
import { useConfig } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'

/**
 * Settings Card
 */
const SettingsCard = ({ title, icon, value, children, onEdit, isEditing, onSave, onCancel }: any) => (
    <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card shadow-sm group">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold tracking-tight">{title}</h3>
                    <p className="text-xs text-muted-foreground/60">{value}</p>
                </div>
            </div>
            {!isEditing ? (
                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={onSave}
                        className="p-2 rounded-lg bg-primary text-primary-foreground hover:scale-105 transition-all"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg border hover:bg-muted transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
        <div className="w-full">
            {children}
        </div>
    </div>
)

export default function Settings() {
    const { config, saveConfig } = useConfig()
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

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
                    // If not already in edit mode for this, save it immediately
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

    return (
        <div className="flex flex-col gap-8 max-w-4xl transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your secure credentials and local paths.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notion */}
                <SettingsCard
                    title="Notion API"
                    icon={<Database className="w-5 h-5" />}
                    value="Secure Private Integration"
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
                            className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                    ) : (
                        <div className="px-3 py-2 rounded-lg bg-muted text-xs font-mono truncate">
                            {config?.notionApiKey ? '••••••••' + config.notionApiKey.slice(-4) : 'NOT CONFIGURED'}
                        </div>
                    )}
                </SettingsCard>

                {/* Gemini */}
                <SettingsCard
                    title="Google Gemini"
                    icon={<Key className="w-5 h-5" />}
                    value="Enterprise Reasoning Engine"
                    isEditing={editingKey === 'geminiApiKey' || editingKey === 'geminiModel'}
                    onEdit={() => startEditing('geminiApiKey', config?.geminiApiKey || '')}
                    onSave={handleSave}
                    onCancel={() => setEditingKey(null)}
                >
                    <div className="flex flex-col gap-2">
                        {editingKey === 'geminiApiKey' ? (
                            <input
                                type="password"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        ) : (
                            <div
                                className="px-3 py-2 rounded-lg bg-muted text-xs font-mono truncate cursor-pointer hover:bg-muted/80 flex items-center justify-between"
                                onClick={() => startEditing('geminiApiKey', config?.geminiApiKey || '')}
                            >
                                <span>{config?.geminiApiKey ? '••••••••' + config.geminiApiKey.slice(-4) : 'NOT CONFIGURED'}</span>
                                <Edit2 className="w-3 h-3 opacity-30" />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground/50 shrink-0">Model:</label>
                            <select
                                value={config?.geminiModel || 'gemini-2.5-flash'}
                                onChange={(e) => saveConfig({ geminiModel: e.target.value })}
                                className="flex-1 bg-muted border-none rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                <option value="gemini-3.0-flash">Gemini 3.0 Flash</option>
                                <option value="gemini-3.0-pro">Gemini 3.0 Pro</option>
                                <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                            </select>
                        </div>
                    </div>
                </SettingsCard>

                {/* Obsidian */}
                <SettingsCard
                    title="Obsidian Vault"
                    icon={<HardDrive className="w-5 h-5" />}
                    value="Local Source of Truth"
                    isEditing={editingKey === 'obsidianVaultPath'}
                    onEdit={() => startEditing('obsidianVaultPath', config?.obsidianVaultPath || '')}
                    onSave={handleSave}
                    onCancel={() => setEditingKey(null)}
                >
                    {editingKey === 'obsidianVaultPath' ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 bg-muted border-none rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                            <button
                                onClick={handlePickDirectory}
                                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all"
                            >
                                <FolderOpen className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted text-xs font-mono">
                            <span className="truncate flex-1 mr-2">{config?.obsidianVaultPath || 'NOT CONFIGURED'}</span>
                            <button
                                onClick={handlePickDirectory}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Open Finder"
                            >
                                <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </SettingsCard>

                {/* Danger Zone */}
                <SettingsCard
                    title="Danger Zone"
                    icon={<Trash2 className="w-5 h-5 text-destructive" />}
                    value="System Reset & Privacy"
                >
                    <button
                        onClick={handleClear}
                        className="w-full py-2.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive font-bold text-sm tracking-tight hover:bg-destructive hover:text-destructive-foreground transition-all"
                    >
                        RESET LOCAL STORAGE
                    </button>
                </SettingsCard>
            </div>

            <div className="mt-8 p-6 rounded-3xl border border-dashed text-center">
                <p className="text-sm text-muted-foreground">
                    All credentials are stored locally on your machine via <strong>Tauri Secure Store</strong>.<br />
                    Life OS NEVER uploads your keys to any external servers.
                </p>
            </div>
        </div>
    )
}
