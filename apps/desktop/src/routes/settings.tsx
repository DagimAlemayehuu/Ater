/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState, useEffect} from 'react'
import {
  Save,
  X,
  ChevronRight
} from 'lucide-react'
import {cn} from '@/lib/utils'
import {useConfig, SavedApiKey} from '@/lib/ConfigContext'
import {sidecarApi} from '@/lib/sidecarApi'
import {open} from '@tauri-apps/plugin-dialog'
import {usePomodoroStore} from '@/lib/pomodoroStore'
import {RateLimitMonitor} from '@/components/intelligence/RateLimitMonitor'

type AiTier = 'primary' | 'planner' | 'utility'

// Local UI Components to avoid dependency issues
const Card = ({children, className}: any) => (
  <div className={cn("border border-border bg-card", className)}>
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
              <button onClick={onSave} className="p-2 bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-none"><Save size={14} /></button>
              <button onClick={onCancel} className="p-2 bg-background text-foreground border border-border hover:bg-accent transition-none"><X size={14} /></button>
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
  const {clearHistory} = usePomodoroStore()
  
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [aiTab, setAiTab] = useState<AiTier>('primary')
  
  // Local state for edits
  const [aiEdit, setAiEdit] = useState({provider: '', key: '', model: ''})
  const [pomodoroEdit, setPomodoroEdit] = useState({work: 25, short: 5, long: 15, sessions: 4})
  const [isAddingKey, setIsAddingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('google')
  const [newKeyValue, setNewKeyValue] = useState('')
  
  const [testStatus, setTestStatus] = useState<{loading: boolean, success: boolean | null, message: string}>({
    loading: false, success: null, message: ''
  })

  useEffect(() => {
    if (config) {
      setPomodoroEdit({
        work: config.pomodoroWorkDuration,
        short: config.pomodoroShortBreakDuration,
        long: config.pomodoroLongBreakDuration,
        sessions: config.pomodoroSessionsBeforeLongBreak
      })
    }
  }, [config])

  const startAiEdit = (tier: AiTier) => {
    setEditingKey(`${tier}_engine`)
    if (tier === 'primary') {
      setAiEdit({provider: config?.aiProvider || 'google', key: config?.aiApiKey || '', model: config?.aiModel || 'gemini-2.0-flash'})
    } else if (tier === 'planner') {
      setAiEdit({provider: config?.plannerProvider || 'google', key: config?.plannerApiKey || '', model: config?.plannerModel || 'gemini-2.0-flash'})
    } else {
      setAiEdit({provider: config?.utilityProvider || 'google', key: config?.utilityApiKey || '', model: config?.utilityModel || 'gemini-2.0-flash'})
    }
  }

  const startPomodoroEdit = () => {
    setEditingKey('pomodoro_engine')
    setPomodoroEdit({
      work: config?.pomodoroWorkDuration || 25,
      short: config?.pomodoroShortBreakDuration || 5,
      long: config?.pomodoroLongBreakDuration || 15,
      sessions: config?.pomodoroSessionsBeforeLongBreak || 4
    })
  }

  const handleSave = async () => {
    if (editingKey?.includes('_engine')) {
      const tier = editingKey.replace('_engine', '') as AiTier
      if (tier === 'primary') {
        await saveConfig({aiProvider: aiEdit.provider, aiApiKey: aiEdit.key, aiModel: aiEdit.model})
      } else if (tier === 'planner') {
        await saveConfig({plannerProvider: aiEdit.provider, plannerApiKey: aiEdit.key, plannerModel: aiEdit.model})
      } else if (tier === 'utility') {
        await saveConfig({utilityProvider: aiEdit.provider, utilityApiKey: aiEdit.key, utilityModel: aiEdit.model})
      }
    } else if (editingKey === 'pomodoro_engine') {
      await saveConfig({
        pomodoroWorkDuration: pomodoroEdit.work,
        pomodoroShortBreakDuration: pomodoroEdit.short,
        pomodoroLongBreakDuration: pomodoroEdit.long,
        pomodoroSessionsBeforeLongBreak: pomodoroEdit.sessions
      })
    }
    setEditingKey(null)
  }

  const handleClear = async () => {
    if (window.confirm('WARNING: This will wipe all local configuration. Registry activation will persist. Continue?')) {
      await saveConfig({
        obsidianVaultPath: '',
        aiProvider: 'google',
        aiApiKey: '',
        aiModel: 'gemini-2.0-flash',
        autoDeploy: false
      })
      window.location.reload()
    }
  }

  const handleTestConnection = async (tier: AiTier) => {
    setTestStatus({loading: true, success: null, message: ''})
    try {
      const res = await sidecarApi.testAiConnection(tier)
      if (res.success) {
        setTestStatus({loading: false, success: true, message: res.message || 'Connected successfully.'})
      } else {
        setTestStatus({loading: false, success: false, message: res.error || 'Connection failed.'})
      }
    } catch (err: any) {
      setTestStatus({loading: false, success: false, message: err.message || 'Network error.'})
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
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">General Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Info */}
          <Card className="md:col-span-2">
            <CardHeader 
              title="Account Information" 
              description="Manage your local activation and digital sovereignty." 
            />
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registry Email</span>
                <span className="text-[13px] font-mono text-foreground">{config?.activationEmail || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hardware Lock (Machine ID)</span>
                <span className="text-[13px] font-mono text-foreground">{config?.machineId || 'Unknown'}</span>
              </div>
              <div className="pt-4">
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to deactivate this device? You will need to log in again.')) {
                      await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' });
                      window.location.reload();
                    }
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary hover:opacity-90"
                >
                  Deactivate Device & Logout
                </button>
              </div>
            </CardContent>
          </Card>

          {/* API Key Manager */}
          <Card className="md:col-span-2">
            <CardHeader 
              title="Key Vault" 
              description="Securely store and name your API keys." 
            />
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {config?.savedApiKeys?.map((k) => (
                  <div key={k.id} className="group relative flex flex-col p-4 border border-border bg-background hover:bg-accent">
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
                      placeholder="Key Name (e.g. My Gemini Pro)"
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
                      placeholder="Paste API Key"
                      value={newKeyValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyValue(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary"
                    />
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddNewKey} className="flex-1 bg-primary text-primary-foreground py-2 text-[10px] font-black uppercase tracking-widest hover:opacity-90">Add</button>
                      <button onClick={() => setIsAddingKey(false)} className="px-4 bg-background text-foreground border border-border py-2 text-[10px] font-black uppercase hover:bg-accent">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingKey(true)}
                    className="flex flex-col items-center justify-center p-4 border border-dashed border-border hover:border-primary hover:bg-accent gap-2"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">New Key</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Intelligence (AI Engines) */}
          <SettingsCard
            title="Intelligence Engine"
            value={`Configure ${aiTab.charAt(0).toUpperCase() + aiTab.slice(1)} Intelligence`}
            isEditing={editingKey === `${aiTab}_engine`}
            onEdit={() => startAiEdit(aiTab)}
            onSave={handleSave}
            onCancel={() => setEditingKey(null)}
          >
            <div className="space-y-6 text-foreground">
              {/* Tier Switcher */}
              <div className="flex border border-border">
                {(['primary', 'planner', 'utility'] as AiTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setAiTab(tier)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-none",
                      aiTab === tier 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {/* Saved Key Selection */}
              <div className="space-y-4 pb-6 border-b border-border">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">
                  Saved Keys
                </label>
                <div className="flex flex-wrap gap-2">
                  {config?.savedApiKeys?.length === 0 && (
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">No keys saved in vault yet.</p>
                  )}
                  {config?.savedApiKeys?.map(k => {
                    const currentKey = aiTab === 'primary' ? config.aiApiKey : aiTab === 'planner' ? config.plannerApiKey : config.utilityApiKey;
                    const isSelected = currentKey === k.key;
                    return (
                      <button
                        key={k.id}
                        onClick={() => {
                          if (aiTab === 'primary') saveConfig({aiProvider: k.provider, aiApiKey: k.key});
                          else if (aiTab === 'planner') saveConfig({plannerProvider: k.provider, plannerApiKey: k.key});
                          else saveConfig({utilityProvider: k.provider, utilityApiKey: k.key});
                        }}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-none",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        {isSelected ? `[ ${k.name} ]` : k.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Provider</label>
                  <select
                    value={editingKey === `${aiTab}_engine` ? aiEdit.provider : (aiTab === 'primary' ? config?.aiProvider : aiTab === 'planner' ? config?.plannerProvider : config?.utilityProvider) || 'google'}
                    disabled={editingKey !== `${aiTab}_engine`}
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
                    <option value="groq">Groq (Fast/Free)</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest">API Key</label>
                  {editingKey === `${aiTab}_engine` ? (
                    <input
                      type="password"
                      value={aiEdit.key}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, key: e.target.value})}
                      className="w-full bg-background border border-border px-4 py-3 text-[13px] focus:outline-none focus:border-primary font-mono"
                      autoFocus
                      placeholder={`Enter ${aiEdit.provider.toUpperCase()} Key`}
                    />
                  ) : (
                    <div className="px-4 py-3 bg-muted text-[13px] font-mono text-muted-foreground border border-border">
                      <span>
                        {aiTab === 'primary' && config?.aiApiKey ? '••••••••' + config?.aiApiKey.slice(-4) : 
                         aiTab === 'planner' && config?.plannerApiKey ? '••••••••' + config?.plannerApiKey.slice(-4) :
                         aiTab === 'utility' && config?.utilityApiKey ? '••••••••' + config?.utilityApiKey.slice(-4) :
                         'Not configured'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Model ID</label>
                  <input
                    type="text"
                    disabled={editingKey !== `${aiTab}_engine`}
                    value={editingKey === `${aiTab}_engine` ? aiEdit.model : (aiTab === 'primary' ? config?.aiModel : aiTab === 'planner' ? config?.plannerModel : config?.utilityModel) || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, model: e.target.value})}
                    className="w-full bg-background border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleTestConnection(aiTab)}
                    disabled={testStatus.loading || (aiTab === 'primary' ? !config?.aiApiKey : aiTab === 'planner' ? !config?.plannerApiKey : !config?.utilityApiKey)}
                    className={cn(
                      "w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-none",
                      testStatus.loading ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                      testStatus.success === true ? "bg-primary text-primary-foreground border-primary" :
                      testStatus.success === false ? "bg-background text-foreground border-primary" :
                      "bg-background hover:bg-accent text-foreground border-border"
                    )}
                  >
                    {testStatus.loading ? 'Testing...' : 'Test Connection'}
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

              {/* Real-time Rate Limit Tracker */}
              <div className="pt-8 border-t border-border mt-8">
                <RateLimitMonitor config={config || undefined} activeTier={aiTab} />
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* Vault Configuration */}
        <div className="flex flex-col gap-6">
          <SettingsCard
            title="Vault Configuration"
            value="Configure storage paths and automation"
            isEditing={editingKey === 'vault_config'}
            onEdit={() => setEditingKey('vault_config')}
            onSave={handleSave}
            onCancel={() => setEditingKey(null)}
          >
            <div className="space-y-6">
              {/* Obsidian Path */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Obsidian Vault Root</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted text-[13px] font-mono text-muted-foreground border border-border overflow-hidden">
                    <span className="truncate">{config?.obsidianVaultPath || 'Not selected'}</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const selected = await open({directory: true, multiple: false, title: 'Select Vault Folder'});
                        if (selected) await saveConfig({obsidianVaultPath: selected as string});
                      } catch (err) {console.error(err);}
                    }}
                    className="px-6 py-3 bg-background text-[10px] font-black uppercase tracking-widest border border-border hover:bg-accent transition-none"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Inbox Path */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Inbox Folder (PDF Ingestion)</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted text-[13px] font-mono text-muted-foreground border border-border overflow-hidden">
                    <span className="truncate">{config?.inboxPath || 'Default (Inbox/)'}</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const selected = await open({directory: true, multiple: false, title: 'Select Inbox Folder'});
                        if (selected) await saveConfig({inboxPath: selected as string});
                      } catch (err) {console.error(err);}
                    }}
                    className="px-6 py-3 bg-background text-[10px] font-black uppercase tracking-widest border border-border hover:bg-accent transition-none"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Academic Path */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Academic Folder Name</label>
                <input 
                  type="text"
                  value={config?.academicFolderPath || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => saveConfig({academicFolderPath: e.target.value})}
                  className="w-full bg-background border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border bg-card">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Auto-Deploy</label>
                  <p className="text-[11px] text-muted-foreground font-bold">Process Inbox automatically</p>
                </div>
                <button
                  onClick={async () => {
                    const newVal = !config?.autoDeploy;
                    await saveConfig({autoDeploy: newVal});
                    try {await sidecarApi.aterWatcherToggle();} catch(e) {console.error(e);}
                  }}
                  className={cn(
                    "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-none",
                    config?.autoDeploy ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent"
                  )}
                >
                  {config?.autoDeploy ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </SettingsCard>
        </div>

        <SettingsCard
          title="Pomodoro Engine"
          value="Custom focus & break intervals"
          isEditing={editingKey === 'pomodoro_engine'}
          onEdit={startPomodoroEdit}
          onSave={handleSave}
          onCancel={() => setEditingKey(null)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Focus (min)</label>
              <input 
                type="number" 
                disabled={editingKey !== 'pomodoro_engine'}
                value={editingKey === 'pomodoro_engine' ? pomodoroEdit.work : config?.pomodoroWorkDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, work: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Short Break (min)</label>
              <input 
                type="number" 
                disabled={editingKey !== 'pomodoro_engine'}
                value={editingKey === 'pomodoro_engine' ? pomodoroEdit.short : config?.pomodoroShortBreakDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, short: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Long Break (min)</label>
              <input 
                type="number" 
                disabled={editingKey !== 'pomodoro_engine'}
                value={editingKey === 'pomodoro_engine' ? pomodoroEdit.long : config?.pomodoroLongBreakDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, long: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Sessions before Long</label>
              <input 
                type="number" 
                min="1"
                max="10"
                disabled={editingKey !== 'pomodoro_engine'}
                value={editingKey === 'pomodoro_engine' ? pomodoroEdit.sessions : config?.pomodoroSessionsBeforeLongBreak}
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
            <CardHeader title="Danger Zone" description="Permanent data deletion" />
            <CardContent className="flex gap-4">
              <button
                onClick={handleClear}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary hover:opacity-90 transition-none"
              >
                Reset Config
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all tracked study history? This cannot be undone.')) {
                    clearHistory()
                  }
                }}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary hover:opacity-90 transition-none"
              >
                Reset Tracked Data
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
