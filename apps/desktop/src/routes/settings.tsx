/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState, useEffect} from 'react'
import {cn} from '@/lib/utils'
import {useConfig, SavedApiKey} from '@/lib/ConfigContext'
import {sidecarApi} from '@/lib/sidecarApi'
import {open} from '@tauri-apps/plugin-dialog'
import {usePomodoroStore} from '@/lib/pomodoroStore'
import {TokenTracker} from '@/components/intelligence/TokenTracker'
import * as Tabs from '@radix-ui/react-tabs'
import { toast } from 'sonner'

// Local UI Components to avoid dependency issues
const Card = ({children, className}: any) => (
  <div className={cn("border border-border bg-card transition-none", className)}>
    {children}
  </div>
)

const CardHeader = ({title, description}: any) => (
  <div className="p-6 border-b border-border">
    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">{title}</h3>
    {description && <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">{description}</p>}
  </div>
)

const CardContent = ({children, className}: any) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
)

const SettingsCard = ({title, value, children, onEdit, isEditing, onSave, onCancel}: any) => (
  <Card className="bg-card">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">{title}</h3>
          <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">{value}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={onSave} className="px-4 py-1.5 bg-primary text-primary-foreground border border-primary text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-none">Save</button>
              <button onClick={onCancel} className="px-4 py-1.5 bg-background text-foreground border border-border text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-none">Abort</button>
            </>
          ) : (
            <button onClick={onEdit} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-none">Edit</button>
          )}
        </div>
      </div>
      {children}
    </div>
  </Card>
)

export default function Settings() {
  const {config, saveConfig} = useConfig()
  const {clearHistory: clearLocalHistory} = usePomodoroStore()
  
  const [editingKey, setEditingKey] = useState<string | null>(null)
  
  // Local state for edits
  const [aiEdit, setAiEdit] = useState({provider: '', key: '', model: ''})
  const [pomodoroEdit, setPomodoroEdit] = useState({work: 25, short: 5, long: 15, sessions: 4})
  const [vaultEdit, setVaultEdit] = useState({vaultPath: '', inboxPath: '', academicPath: '', autoDeploy: false})
  const [profileEdit, setProfileEdit] = useState({name: ''})
  
  const [isAddingKey, setIsAddingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('google')
  const [newKeyValue, setNewKeyValue] = useState('')
  
  const [testStatus, setTestStatus] = useState<{loading: boolean, success: boolean | null, message: string}>({
    loading: false, success: null, message: ''
  })

  // Sync config to local edits on change
  useEffect(() => {
    if (config) {
      setPomodoroEdit({
        work: config.pomodoroWorkDuration,
        short: config.pomodoroShortBreakDuration,
        long: config.pomodoroLongBreakDuration,
        sessions: config.pomodoroSessionsBeforeLongBreak
      });
      setVaultEdit({
        vaultPath: config.obsidianVaultPath || '',
        inboxPath: config.inboxPath || '',
        academicPath: config.academicFolderPath || 'Notes',
        autoDeploy: config.autoDeploy || false
      });
      setProfileEdit({
        name: config.displayName || ''
      });
    }
  }, [config]);

  const startAiEdit = () => {
    setEditingKey('primary_engine')
    setAiEdit({provider: config?.aiProvider || 'google', key: config?.aiApiKey || '', model: config?.aiModel || 'gemini-2.0-flash'})
  }

  const startPomodoroEdit = () => {
    setEditingKey('timer_settings')
    setPomodoroEdit({
      work: config?.pomodoroWorkDuration || 25,
      short: config?.pomodoroShortBreakDuration || 5,
      long: config?.pomodoroLongBreakDuration || 15,
      sessions: config?.pomodoroSessionsBeforeLongBreak || 4
    })
  }

  const startVaultEdit = () => {
    setEditingKey('folder_settings')
    setVaultEdit({
      vaultPath: config?.obsidianVaultPath || '',
      inboxPath: config?.inboxPath || '',
      academicPath: config?.academicFolderPath || 'Notes',
      autoDeploy: config?.autoDeploy || false
    })
  }

  const handleSave = async () => {
    if (editingKey === 'primary_engine') {
      await saveConfig({aiProvider: aiEdit.provider, aiApiKey: aiEdit.key, aiModel: aiEdit.model})
    } else if (editingKey === 'timer_settings') {
      await saveConfig({
        pomodoroWorkDuration: pomodoroEdit.work,
        pomodoroShortBreakDuration: pomodoroEdit.short,
        pomodoroLongBreakDuration: pomodoroEdit.long,
        pomodoroSessionsBeforeLongBreak: pomodoroEdit.sessions
      })
    } else if (editingKey === 'folder_settings') {
      await saveConfig({
        obsidianVaultPath: vaultEdit.vaultPath,
        inboxPath: vaultEdit.inboxPath,
        academicFolderPath: vaultEdit.academicPath,
        autoDeploy: vaultEdit.autoDeploy
      })
      // Sync watcher state if auto-deploy changed
      if (vaultEdit.autoDeploy !== config?.autoDeploy) {
        try { await sidecarApi.aterWatcherToggle(); } catch(e) { console.error(e); }
      }
    }
    setEditingKey(null)
  }

  const handleSaveProfile = async () => {
    if (config) {
      await saveConfig({
        displayName: profileEdit.name
      })
    }
    setEditingKey(null)
  }

  const handleClearConfig = async () => {
    await saveConfig({
      obsidianVaultPath: '',
      aiProvider: 'google',
      aiApiKey: '',
      aiModel: 'gemini-2.0-flash',
      autoDeploy: false,
      savedApiKeys: [],
      displayName: '',
      isProgramConfigured: false
    })
    window.location.reload()
  }

  const handleResetTrackedData = async () => {
    try {
      const res = await sidecarApi.clearStudyHistory();
      if (res.success) {
        clearLocalHistory();
        toast.success('All study history has been cleared.');
      }
    } catch (err: any) {
      toast.error('Failed to clear data: ' + err.message);
    }
  }

  const handleFactoryReset = async () => {
    if (!confirm('CRITICAL ACTION: This will wipe your academic dashboard, ALL API keys, and study history. Atomic notes will be preserved. Proceed?')) return;
    
    try {
      const res = await sidecarApi.factoryReset();
      if (res.success) {
        // Clear local config completely
        await saveConfig({
          aiApiKey: '',
          aiProvider: 'google',
          aiModel: 'gemini-2.0-flash',
          savedApiKeys: [],
          obsidianVaultPath: '',
          inboxPath: '',
          isActivated: false,
          activationEmail: '',
          activationCode: '',
          displayName: '',
          isProgramConfigured: false
        });
        
        clearLocalHistory();
        toast.success('System has been factory reset.');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      toast.error('Factory reset failed: ' + err.message);
    }
  }

  const handleTestConnection = async () => {
    setTestStatus({loading: true, success: null, message: ''})
    try {
      const res = await sidecarApi.testAiConnection('primary')
      if (res.success) {
        setTestStatus({loading: false, success: true, message: res.message || 'Authenticated successfully. System online.'})
      } else {
        setTestStatus({loading: false, success: false, message: res.error || 'Authentication failed. Check your API key.'})
      }
    } catch (err: any) {
      setTestStatus({loading: false, success: false, message: err.message || 'Sidecar network error.'})
    }
  }

  const handleExportLogs = async () => {
    try {
      toast.info('Packaging system logs...');
      const logPath = await sidecarApi.exportLogs();
      toast.success('Logs exported successfully');
      // In a real app we might open the folder, but for now just show the path
      alert(`System logs packaged and saved to:\n${logPath}\n\nPlease attach this file to your support request.`);
    } catch (err: any) {
      toast.error('Log export failed: ' + err.message);
    }
  }

  const handleAddNewKey = async () => {
    if (!newKeyName || !newKeyValue) return
    const newKey: SavedApiKey = {
      id: Math.random().toString(36).substring(2),
      name: newKeyName,
      provider: newKeyProvider,
      key: newKeyValue
    }
    const currentKeys = config?.savedApiKeys || []
    await saveConfig({savedApiKeys: [...currentKeys, newKey]})
    setNewKeyName('')
    setNewKeyValue('')
    setIsAddingKey(false)
  }

  const deleteApiKey = async (id: string) => {
    const currentKeys = config?.savedApiKeys || []
    await saveConfig({savedApiKeys: currentKeys.filter(k => k.id !== id)})
  }

  const renderGeneral = () => {
    return (
      <div className="w-full space-y-8 pb-20">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">System Parameters</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Diagnostics Card */}
          <Card className="col-span-2">
            <CardHeader 
              title="System Diagnostics" 
              description="Export a 'Black Box' diagnostic package for troubleshooting and support." 
            />
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Log Package Exporter</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium">Includes sidecar trails, process logs, and system state.</p>
              </div>
              <button
                onClick={handleExportLogs}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-border text-foreground hover:bg-accent hover:border-foreground/30 transition-none"
              >
                Export Black Box
              </button>
            </CardContent>
          </Card>
          {/* Account Info */}
          <Card className="col-span-2">
            <CardHeader 
              title="Identity & Activation" 
              description="Manage your local machine authorization and digital license." 
            />
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registry Identity</span>
                <span className="text-[13px] font-mono text-foreground">{config?.activationEmail || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hardware Fingerprint</span>
                <span className="text-[13px] font-mono text-foreground">{config?.machineId || 'N/A'}</span>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' });
                      window.location.reload();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary border border-primary hover:bg-primary hover:text-primary-foreground transition-none"
                >
                  Revoke Authorization
                </button>
              </div>
            </CardContent>
          </Card>

          {/* API Key Manager */}
          <Card className="col-span-2">
            <CardHeader 
              title="Key Vault" 
              description="Encrypted local storage for your LLM authentication tokens." 
            />
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {config?.savedApiKeys?.map((k) => (
                  <div key={k.id} className="group relative flex flex-col p-4 border border-border bg-background hover:bg-accent transition-none">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground truncate max-w-[120px]">{k.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-border font-bold uppercase text-muted-foreground">{k.provider}</span>
                    </div>
                    <div className="text-[12px] font-mono text-muted-foreground truncate">••••••••{k.key.slice(-4)}</div>
                    
                    <button 
                      onClick={() => {deleteApiKey(k.id)}}
                      className="absolute top-4 right-4 text-[9px] font-black uppercase text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {isAddingKey ? (
                  <div className="flex flex-col p-4 border border-primary bg-background space-y-4">
                    <input 
                      placeholder="Identifier (e.g. Oracle Gemini)"
                      value={newKeyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-[11px] font-bold uppercase focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <select
                      value={newKeyProvider}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewKeyProvider(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-[11px] font-bold uppercase focus:outline-none focus:border-primary"
                    >
                      <option value="google">Google</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="groq">Groq</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                    <input 
                      type="password"
                      placeholder="Secret API Key"
                      value={newKeyValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyValue(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary"
                    />
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddNewKey} className="flex-1 bg-primary text-primary-foreground py-2 text-[10px] font-black uppercase tracking-widest hover:opacity-90">Store</button>
                      <button onClick={() => setIsAddingKey(false)} className="px-4 bg-background text-foreground border border-border py-2 text-[10px] font-black uppercase hover:bg-accent">Abort</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingKey(true)}
                    className="flex flex-col items-center justify-center p-4 border border-dashed border-border hover:border-primary hover:bg-accent gap-2 transition-none"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Add API Key</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Intelligence (AI Engines) */}
          <SettingsCard
            title="AI Settings"
            value="API Engine Configuration"
            isEditing={editingKey === 'primary_engine'}
            onEdit={() => startAiEdit()}
            onSave={handleSave}
            onCancel={() => setEditingKey(null)}
          >
            <div className="space-y-6 text-foreground">
              {/* Saved Key Selection */}
              <div className="space-y-4 pb-6 border-b border-border">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">
                  Key Selector
                </label>
                <div className="flex flex-wrap gap-2">
                  {config?.savedApiKeys?.length === 0 && (
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">No keys saved.</p>
                  )}
                  {config?.savedApiKeys?.map(k => {
                    const isSelected = config.aiApiKey === k.key;
                    return (
                      <button
                        key={k.id}
                        disabled={editingKey !== 'primary_engine'}
                        onClick={() => {
                          setAiEdit({
                            provider: k.provider,
                            key: k.key,
                            model: k.provider === 'google' ? 'gemini-2.0-flash' : aiEdit.model
                          });
                        }}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-none disabled:opacity-50",
                          (isSelected && editingKey !== 'primary_engine') || (aiEdit.key === k.key && editingKey === 'primary_engine')
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        {k.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Logic Provider</label>
                  <select
                    value={editingKey === 'primary_engine' ? aiEdit.provider : config?.aiProvider || 'google'}
                    disabled={editingKey !== 'primary_engine'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const provider = e.target.value;
                      let defaultModel = 'gemini-2.0-flash';
                      if (provider === 'openai') defaultModel = 'gpt-4o';
                      if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-latest';
                      if (provider === 'groq') defaultModel = 'llama-3.3-70b-versatile';
                      if (provider === 'openrouter') defaultModel = 'google/gemini-2.0-flash-001';
                      setAiEdit({...aiEdit, provider, model: defaultModel});
                    }}
                    className="w-full bg-background border border-border px-4 py-3 text-[11px] font-bold uppercase focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="google">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="groq">Groq (Inference-Fast)</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Secret Key</label>
                  {editingKey === 'primary_engine' ? (
                    <input
                      type="password"
                      value={aiEdit.key}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, key: e.target.value})}
                      className="w-full bg-background border border-border px-4 py-3 text-[13px] focus:outline-none focus:border-primary font-mono"
                      autoFocus
                      placeholder={`Enter ${aiEdit.provider.toUpperCase()} Secret`}
                    />
                  ) : (
                    <div className="px-4 py-3 bg-muted text-[13px] font-mono text-muted-foreground border border-border">
                      <span>
                        {config?.aiApiKey ? '••••••••' + config?.aiApiKey.slice(-4) : 'Not configured'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Target Model ID</label>
                  <input
                    type="text"
                    disabled={editingKey !== 'primary_engine'}
                    value={editingKey === 'primary_engine' ? aiEdit.model : config?.aiModel || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, model: e.target.value})}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleTestConnection()}
                    disabled={testStatus.loading || !config?.aiApiKey}
                    className={cn(
                      "w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-none",
                      testStatus.loading ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                      testStatus.success === true ? "bg-primary text-primary-foreground border-primary" :
                      testStatus.success === false ? "bg-background text-foreground border-primary" :
                      "bg-background hover:bg-accent text-foreground border-border"
                    )}
                  >
                    {testStatus.loading ? 'Synchronizing...' : 'Validate Connection'}
                  </button>
                </div>
              </div>

              {testStatus.message && (
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest mt-4 px-4 py-3 border",
                  "border-primary text-foreground"
                )}>
                  {testStatus.message}
                </p>
              )}

            </div>
          </SettingsCard>

          {/* Vault Configuration */}
          <SettingsCard
            title="Folder Settings"
            value="Vault & Content Paths"
            isEditing={editingKey === 'folder_settings'}
            onEdit={startVaultEdit}
            onSave={handleSave}
            onCancel={() => setEditingKey(null)}
          >
            <div className="space-y-6">
              {/* Obsidian Path */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Obsidian Vault Path</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted text-[13px] font-mono text-muted-foreground border border-border overflow-hidden">
                    <span className="truncate">{editingKey === 'folder_settings' ? vaultEdit.vaultPath : config?.obsidianVaultPath || 'Unset'}</span>
                  </div>
                  <button
                    disabled={editingKey !== 'folder_settings'}
                    onClick={async () => {
                      try {
                        const selected = await open({directory: true, multiple: false, title: 'Locate Obsidian Vault'});
                        if (selected) setVaultEdit({...vaultEdit, vaultPath: selected as string});
                      } catch (err) {console.error(err);}
                    }}
                    className="px-6 py-3 bg-background text-[10px] font-black uppercase tracking-widest border border-border hover:bg-accent transition-none disabled:opacity-50"
                  >
                    Locate
                  </button>
                </div>
              </div>

              {/* Inbox Path */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Inbox Directory (PDF Watcher)</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted text-[13px] font-mono text-muted-foreground border border-border overflow-hidden">
                    <span className="truncate">{editingKey === 'folder_settings' ? vaultEdit.inboxPath : config?.inboxPath || 'Default (Inbox/)'}</span>
                  </div>
                  <button
                    disabled={editingKey !== 'folder_settings'}
                    onClick={async () => {
                      try {
                        const selected = await open({directory: true, multiple: false, title: 'Select Inbox Directory'});
                        if (selected) setVaultEdit({...vaultEdit, inboxPath: selected as string});
                      } catch (err) {console.error(err);}
                    }}
                    className="px-6 py-3 bg-background text-[10px] font-black uppercase tracking-widest border border-border hover:bg-accent transition-none disabled:opacity-50"
                  >
                    Select
                  </button>
                </div>
              </div>

              {/* Academic Path */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Academic Root Identifier</label>
                <input 
                  type="text"
                  disabled={editingKey !== 'folder_settings'}
                  value={editingKey === 'folder_settings' ? vaultEdit.academicPath : config?.academicFolderPath || 'Notes'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVaultEdit({...vaultEdit, academicPath: e.target.value})}
                  className="w-full bg-background border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
                  placeholder="e.g. Notes"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border bg-card">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Background Watcher</label>
                  <p className="text-[11px] text-muted-foreground font-bold">Process incoming files automatically</p>
                </div>
                <button
                  disabled={editingKey !== 'folder_settings'}
                  onClick={() => setVaultEdit({...vaultEdit, autoDeploy: !vaultEdit.autoDeploy})}
                  className={cn(
                    "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-none disabled:opacity-50",
                    (editingKey === 'folder_settings' ? vaultEdit.autoDeploy : config?.autoDeploy) 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  )}
                >
                  {(editingKey === 'folder_settings' ? vaultEdit.autoDeploy : config?.autoDeploy) ? 'Active' : 'Standby'}
                </button>
              </div>
            </div>
          </SettingsCard>
        </div>

        <SettingsCard
          title="User Profile"
          value="Identity & Personalization"
          isEditing={editingKey === 'profile'}
          onEdit={() => { setEditingKey('profile'); setProfileEdit({name: config?.displayName || ''}); }}
          onSave={handleSaveProfile}
          onCancel={() => setEditingKey(null)}
        >
          <div className="space-y-4">
            {editingKey === 'profile' ? (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground block ml-1">Display Name</label>
                <input 
                  type="text"
                  value={profileEdit.name}
                  onChange={(e) => setProfileEdit({...profileEdit, name: e.target.value})}
                  className="w-full bg-background border border-border px-4 py-3 text-[13px] font-black uppercase tracking-widest focus:outline-none focus:border-primary"
                  placeholder="Your Name"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Display Name</span>
                  <span className="text-[13px] font-black uppercase tracking-widest text-foreground">{config?.displayName || 'Not Set'}</span>
                </div>
              </div>
            )}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Timer Settings"
          value="Focus & Break Durations"
          isEditing={editingKey === 'timer_settings'}
          onEdit={startPomodoroEdit}
          onSave={handleSave}
          onCancel={() => setEditingKey(null)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Deep Work (min)</label>
              <input 
                type="number" 
                disabled={editingKey !== 'timer_settings'}
                value={editingKey === 'timer_settings' ? pomodoroEdit.work : config?.pomodoroWorkDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, work: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Short Break (min)</label>
              <input 
                type="number" 
                disabled={editingKey !== 'timer_settings'}
                value={editingKey === 'timer_settings' ? pomodoroEdit.short : config?.pomodoroShortBreakDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, short: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Long Break (min)</label>
              <input 
                type="number" 
                disabled={editingKey !== 'timer_settings'}
                value={editingKey === 'timer_settings' ? pomodoroEdit.long : config?.pomodoroLongBreakDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, long: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Session Threshold</label>
              <input 
                type="number" 
                min="1"
                max="10"
                disabled={editingKey !== 'timer_settings'}
                value={editingKey === 'timer_settings' ? pomodoroEdit.sessions : config?.pomodoroSessionsBeforeLongBreak}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setPomodoroEdit({...pomodoroEdit, sessions: Math.max(1, Math.min(10, val))});
                  } else {
                    setPomodoroEdit({...pomodoroEdit, sessions: 1});
                  }
                }}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
          </div>
        </SettingsCard>

        <div className="mt-12">
          <Card>
            <CardHeader title="Danger Zone" description="Be careful. These actions cannot be undone." />
            <CardContent className="flex gap-4">
              <button
                onClick={handleClearConfig}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-none"
              >
                Reset All Settings
              </button>
              <button
                onClick={handleResetTrackedData}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-none"
              >
                Delete All Study History
              </button>
              <button
                onClick={handleFactoryReset}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-none"
              >
                Factory Reset System
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden">
      <Tabs.Root defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-Header / Navigation */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-10 flex items-center justify-between">
            <Tabs.List className="flex gap-8">
              <Tabs.Trigger 
                value="general"
                className="py-6 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-none outline-none"
              >
                General Settings
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="intelligence"
                className="py-6 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-none outline-none"
              >
                Usage Tracker
              </Tabs.Trigger>
            </Tabs.List>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-10 py-12">
            <Tabs.Content value="general" className="outline-none">
              {renderGeneral()}
            </Tabs.Content>
            
            <Tabs.Content value="intelligence" className="outline-none">
              <TokenTracker />
            </Tabs.Content>
          </div>
        </div>
      </Tabs.Root>
    </div>
  )
}
