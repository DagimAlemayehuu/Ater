import React, {useState, useEffect} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Database, Key, HardDrive, Trash2, Edit2, FolderOpen, ShieldCheck, Zap, Plus, X,
  User, BookOpen, DollarSign, Activity, ChevronLeft, ChevronRight, ArrowRight, Settings as SettingsIcon, Target, Check, Timer
} from 'lucide-react'
import * as Icons from 'lucide-react'
import {useConfig, SavedApiKey} from '@/lib/ConfigContext'
import {open} from '@tauri-apps/plugin-dialog'
import {cn} from '@/lib/utils'
import {sidecarApi} from '@/lib/sidecarApi'
import RateLimitMonitor from '@/components/intelligence/RateLimitMonitor'

import { usePomodoroStore } from '@/lib/pomodoroStore'

/* ─────────────────────── Types ─────────────────────── */

type SettingsSection = 'general' | 'intelligence' | 'vault' | 'pomodoro'
type AiTier = 'primary' | 'planner' | 'utility'

/* ─────────────────── Components ─────────────────── */

function Card({className, children}: {className?: string, children: React.ReactNode}) {
 return <div className={cn("rounded-lg border border-border bg-background shadow-sm overflow-hidden", className)}>{children}</div>
}

function CardHeader({title, description, icon}: {title: string, description?: React.ReactNode, icon?: React.ReactNode}) {
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

function CardContent({className, children}: {className?: string, children: React.ReactNode}) {
 return <div className={cn("p-6", className)}>{children}</div>
}

const SettingsCard = ({title, icon, value, children, onEdit, isEditing, onSave, onCancel}: any) => (
 <Card className="flex flex-col justify-between h-full">
 <CardHeader title={title} description={value} icon={<div className="text-muted-foreground">{icon}</div>} />
 <CardContent className="flex-1 flex flex-col justify-between">
 <div className="w-full pb-4">{children}</div>

 <div className="flex justify-end pt-4 border-t border-border/10 mt-auto">
 {!isEditing ? (
 <button onClick={onEdit} className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground bg-background border border-border hover:border-foreground/30 ">
 <Edit2 size={11} className="mr-2" /> Edit
 </button>
 ) : (
 <div className="flex gap-2">
 <button onClick={onCancel} className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10 border border-transparent hover:text-foreground ">
 Cancel
 </button>
 <button onClick={onSave} className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground bg-background border border-border hover:border-foreground/50 ">
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
 const {config, saveConfig, isLoading, addApiKey, deleteApiKey} = useConfig()
 const { clearHistory } = usePomodoroStore()
 const [editingKey, setEditingKey] = useState<string | null>(null)
 const [editValue, setEditValue] = useState('')

 const [isAddingKey, setIsAddingKey] = useState(false);
 const [newKeyName, setNewKeyName] = useState('');
 const [newKeyValue, setNewKeyValue] = useState('');
 const [newKeyProvider, setNewKeyProvider] = useState('google');

 const [testStatus, setTestStatus] = useState<{loading: boolean; success?: boolean; message?: string}>({loading: false})
 const [searchParams, setSearchParams] = useSearchParams()
 const aiTab = (searchParams.get('tab') || 'primary') as 'primary' | 'planner' | 'utility'
 const setAiTab = (tab: string) => setSearchParams(prev => {
    prev.set('tab', tab)
    return prev
  })
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

  const [aiEdit, setAiEdit] = useState({
    provider: 'google',
    key: '',
    model: ''
  })

  const [pomodoroEdit, setPomodoroEdit] = useState({
    work: 25,
    short: 5,
    long: 15,
    sessions: 4
  })

  const startAiEdit = (tier: AiTier) => {
    setEditingKey(`${tier}_engine`)
    if (tier === 'primary') {
      setAiEdit({
        provider: config?.aiProvider || 'google',
        key: config?.aiApiKey || '',
        model: config?.aiModel || ''
      })
    } else if (tier === 'planner') {
      setAiEdit({
        provider: config?.plannerProvider || 'google',
        key: config?.plannerApiKey || '',
        model: config?.plannerModel || ''
      })
    } else {
      setAiEdit({
        provider: config?.utilityProvider || 'google',
        key: config?.utilityApiKey || '',
        model: config?.utilityModel || ''
      })
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
    if (!editingKey) return
    try {
      if (editingKey === 'pomodoro_engine') {
        await saveConfig({
          pomodoroWorkDuration: pomodoroEdit.work,
          pomodoroShortBreakDuration: pomodoroEdit.short,
          pomodoroLongBreakDuration: pomodoroEdit.long,
          pomodoroSessionsBeforeLongBreak: pomodoroEdit.sessions
        })
      } else if (editingKey.endsWith('_engine')) {
        const tier = editingKey.replace('_engine', '')
        if (tier === 'primary') {
          await saveConfig({ aiProvider: aiEdit.provider, aiApiKey: aiEdit.key, aiModel: aiEdit.model })
        } else if (tier === 'planner') {
          await saveConfig({ plannerProvider: aiEdit.provider, plannerApiKey: aiEdit.key, plannerModel: aiEdit.model })
        } else {
          await saveConfig({ utilityProvider: aiEdit.provider, utilityApiKey: aiEdit.key, utilityModel: aiEdit.model })
        }
      } else {
        await saveConfig({[editingKey]: editValue})
      }
      setEditingKey(null)
    } catch (err) {
      console.error(err);
      alert('Failed to save setting')
    }
  }

 const handleTestConnection = async (target: 'primary' | 'planner' | 'utility' = 'primary') => {
 setTestTarget(target)
 setTestStatus({loading: true})
 try {
 const res = await sidecarApi.testAiConnection(target)
 if (res.success) {
 setTestStatus({loading: false, success: true, message: res.message || 'Connected successfully!'})
} else {
 setTestStatus({loading: false, success: false, message: res.error || 'Connection failed.'})
}
} catch (err: any) {
 setTestStatus({loading: false, success: false, message: err.message || 'System error'})
}
 // Reset status after 5s
 setTimeout(() => setTestStatus({loading: false}), 5000)
}

 const handleClear = async () => {
 await saveConfig({
 notionApiKey: '',
 aiApiKey: '',
 plannerApiKey: '',
 utilityApiKey: '',
 obsidianVaultPath: '',
 academicFolderPath: '',
 inboxPath: '',
 autoDeploy: false
})
 window.location.reload()
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
 saveConfig({aiProvider: keyObj.provider, aiApiKey: keyObj.key});
} else if (level === 'planner') {
 saveConfig({plannerProvider: keyObj.provider, plannerApiKey: keyObj.key});
} else {
 saveConfig({utilityProvider: keyObj.provider, utilityApiKey: keyObj.key});
}
};

 return (
 <div className="w-full space-y-8 ">
 <div>
 <h2 className="text-xl font-black tracking-tight text-foreground mb-2">General</h2>
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
 <div key={k.id} className="group relative flex flex-col p-3 rounded border border-border bg-muted/20 hover:border-primary/30 ">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground truncate max-w-[120px]">{k.name}</span>
 <span className="text-[9px] px-1.5 py-0.5 rounded bg-background border border-border font-bold uppercase text-muted-foreground">{k.provider}</span>
 </div>
 <div className="text-[12px] font-mono text-muted-foreground truncate opacity-60">••••••••{k.key.slice(-4)}</div>
 
 <button 
 onClick={() => {deleteApiKey(k.id)}}
 className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 "
 >
 <Trash2 size={12} />
 </button>
 </div>
 ))}

 {isAddingKey ? (
 <div className="flex flex-col p-3 rounded border border-primary/50 bg-primary/5 space-y-2 -95 ">
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
 className="flex flex-col items-center justify-center p-3 rounded border border-dashed border-border hover:border-primary/30 hover:bg-muted/10  text-muted-foreground gap-1"
 >
 <Plus size={16} />
 <span className="text-[10px] font-bold uppercase tracking-wider">New Key</span>
 </button>
 )}
 </div>
 </CardContent>
 </Card>

  {/* Intelligence (AI Engines) */}
  <SettingsCard
    title="Intelligence Engine"
    icon={<Activity size={18} />}
    value={`Configure ${aiTab.charAt(0).toUpperCase() + aiTab.slice(1)} Intelligence`}
    isEditing={editingKey === `${aiTab}_engine`}
    onEdit={() => startAiEdit(aiTab)}
    onSave={handleSave}
    onCancel={() => setEditingKey(null)}
  >
    <div className="space-y-6 text-foreground">
      {/* Tier Switcher */}
      <div className="flex p-1 bg-muted/30 rounded-lg border border-border/50">
        {(['primary', 'planner', 'utility'] as AiTier[]).map((tier) => (
          <button
            key={tier}
            onClick={() => setAiTab(tier)}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
              aiTab === tier 
                ? "bg-background text-foreground shadow-sm border border-border/50" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tier}
          </button>
        ))}
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
                  "px-2 py-1 rounded text-[10px] font-bold border  flex items-center gap-1.5",
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

      <div className="space-y-4 ">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Provider</label>
          <select
            value={editingKey === `${aiTab}_engine` ? aiEdit.provider : (aiTab === 'primary' ? config?.aiProvider : aiTab === 'planner' ? config?.plannerProvider : config?.utilityProvider) || 'google'}
            disabled={editingKey !== `${aiTab}_engine`}
            onChange={(e) => {
              const provider = e.target.value;
              let defaultModel = 'gemini-2.0-flash';
              if (provider === 'openai') defaultModel = 'gpt-4o';
              if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-latest';
              if (provider === 'groq') defaultModel = 'llama-3.3-70b-versatile';
              if (provider === 'openrouter') defaultModel = 'google/gemini-2.0-flash-001';
              setAiEdit({...aiEdit, provider, model: defaultModel});
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
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">API Key</label>
          {editingKey === `${aiTab}_engine` ? (
            <input
              type="password"
              value={aiEdit.key}
              onChange={(e) => setAiEdit({...aiEdit, key: e.target.value})}
              className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              autoFocus
              placeholder={`Enter ${aiEdit.provider.toUpperCase()} Key`}
            />
          ) : (
            <div className="px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent">
              <span>
                {aiTab === 'primary' && config?.aiApiKey ? '••••••••' + config?.aiApiKey.slice(-4) : 
                 aiTab === 'planner' && config?.plannerApiKey ? '••••••••' + config?.plannerApiKey.slice(-4) :
                 aiTab === 'utility' && config?.utilityApiKey ? '••••••••' + config?.utilityApiKey.slice(-4) :
                 'Not configured'}
              </span>
              <Key size={14} className="text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Model ID</label>
          <input
            type="text"
            disabled={editingKey !== `${aiTab}_engine`}
            value={editingKey === `${aiTab}_engine` ? aiEdit.model : (aiTab === 'primary' ? config?.aiModel : aiTab === 'planner' ? config?.plannerModel : config?.utilityModel) || ''}
            onChange={(e) => setAiEdit({...aiEdit, model: e.target.value})}
            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={() => handleTestConnection(aiTab)}
            disabled={testStatus.loading || (aiTab === 'primary' ? !config?.aiApiKey : aiTab === 'planner' ? !config?.plannerApiKey : !config?.utilityApiKey)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[12px] font-medium  border",
              testStatus.loading ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
              testStatus.success === true ? "bg-green-500/10 border-green-500/20 text-green-500" :
              testStatus.success === false ? "bg-destructive/10 border-destructive/20 text-destructive" :
              "bg-background hover:bg-muted text-muted-foreground border-border"
            )}
          >
            {testStatus.loading ? (
              <><Icons.Loader2 size={14} className="animate-spin" /> Testing...</>
            ) : (
              <><Zap size={14} className={cn(testStatus.success ? "fill-current" : "")} /> Test Connection</>
            )}
          </button>
        </div>
      </div>

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

  {/* Vault Configuration */}
  <div className="flex flex-col gap-6">
    <SettingsCard
      title="Vault Configuration"
      icon={<HardDrive size={18} />}
      value="Configure storage paths and automation"
      isEditing={editingKey === 'vault_config'}
      onEdit={() => setEditingKey('vault_config')}
      onSave={handleSave}
      onCancel={() => setEditingKey(null)}
    >
      <div className="space-y-6">
        {/* Obsidian Path */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Obsidian Vault Root</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent overflow-hidden">
              <span className="truncate pr-2">{config?.obsidianVaultPath || 'Not selected'}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const selected = await open({directory: true, multiple: false, title: 'Select Vault Folder'});
                  if (selected) await saveConfig({obsidianVaultPath: selected as string});
                } catch (err) {console.error(err);}
              }}
              className="inline-flex items-center justify-center rounded bg-background text-muted-foreground  hover:bg-muted border border-border px-3 py-2 shrink-0"
            >
              <FolderOpen size={16} />
            </button>
          </div>
        </div>

        {/* Inbox Path */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inbox Folder (PDF Ingestion)</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded bg-muted text-[13px] font-mono text-muted-foreground flex items-center justify-between border border-transparent overflow-hidden">
              <span className="truncate pr-2">{config?.inboxPath || 'Default (Inbox/)'}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const selected = await open({directory: true, multiple: false, title: 'Select Inbox Folder'});
                  if (selected) await saveConfig({inboxPath: selected as string});
                } catch (err) {console.error(err);}
              }}
              className="inline-flex items-center justify-center rounded bg-background text-muted-foreground  hover:bg-muted border border-border px-3 py-2 shrink-0"
            >
              <FolderOpen size={16} />
            </button>
          </div>
        </div>

        {/* Academic Path */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Academic Folder Name</label>
          <input 
            type="text"
            value={config?.academicFolderPath || ''}
            onChange={(e) => saveConfig({academicFolderPath: e.target.value})}
            className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded border border-border bg-muted/30">
          <div className="space-y-0.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Auto-Deploy</label>
            <p className="text-[11px] text-muted-foreground/60 text-[9px] uppercase tracking-widest opacity-40">Process Inbox automatically</p>
          </div>
          <button
            onClick={async () => {
              const newVal = !config?.autoDeploy;
              await saveConfig({autoDeploy: newVal});
              try {await sidecarApi.aterWatcherToggle();} catch(e) {console.error(e);}
            }}
            className={cn(
              "relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full ",
              config?.autoDeploy ? "bg-primary" : "bg-muted-foreground/20"
            )}
          >
            <span className={cn(
              "pointer-events-none block h-3 w-3 rounded-full bg-background shadow-sm ring-0 transition-transform",
              config?.autoDeploy ? "translate-x-4" : "translate-x-1"
            )} />
          </button>
        </div>
      </div>
    </SettingsCard>
  </div>

 <SettingsCard
 title="Pomodoro Engine"
 icon={<Timer size={18} />}
 value="Custom focus & break intervals"
 isEditing={editingKey === 'pomodoro_engine'}
 onEdit={startPomodoroEdit}
 onSave={handleSave}
 onCancel={() => setEditingKey(null)}
 >
 <div className="grid grid-cols-2 gap-4">
 <datalist id="focus-durations">
 <option value="15" />
 <option value="25" />
 <option value="45" />
 <option value="50" />
 <option value="60" />
 <option value="90" />
 </datalist>
 <datalist id="short-durations">
 <option value="3" />
 <option value="5" />
 <option value="10" />
 <option value="15" />
 </datalist>
 <datalist id="long-durations">
 <option value="15" />
 <option value="20" />
 <option value="30" />
 <option value="45" />
 </datalist>
 <datalist id="session-counts">
 <option value="2" />
 <option value="3" />
 <option value="4" />
 <option value="5" />
 <option value="6" />
 </datalist>

 <div className="space-y-1.5">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Focus (min)</label>
 <input 
 type="number" 
 list="focus-durations"
 disabled={editingKey !== 'pomodoro_engine'}
 value={editingKey === 'pomodoro_engine' ? pomodoroEdit.work : config?.pomodoroWorkDuration}
 onChange={(e) => setPomodoroEdit({...pomodoroEdit, work: parseInt(e.target.value) || 0})}
 className="w-full px-3 py-2 rounded bg-muted/50 border border-border/50 text-[13px] font-mono focus:outline-none focus:border-primary/30"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Short Break (min)</label>
 <input 
 type="number" 
 list="short-durations"
 disabled={editingKey !== 'pomodoro_engine'}
 value={editingKey === 'pomodoro_engine' ? pomodoroEdit.short : config?.pomodoroShortBreakDuration}
 onChange={(e) => setPomodoroEdit({...pomodoroEdit, short: parseInt(e.target.value) || 0})}
 className="w-full px-3 py-2 rounded bg-muted/50 border border-border/50 text-[13px] font-mono focus:outline-none focus:border-primary/30"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Long Break (min)</label>
 <input 
 type="number" 
 list="long-durations"
 disabled={editingKey !== 'pomodoro_engine'}
 value={editingKey === 'pomodoro_engine' ? pomodoroEdit.long : config?.pomodoroLongBreakDuration}
 onChange={(e) => setPomodoroEdit({...pomodoroEdit, long: parseInt(e.target.value) || 0})}
 className="w-full px-3 py-2 rounded bg-muted/50 border border-border/50 text-[13px] font-mono focus:outline-none focus:border-primary/30"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Sessions before Long</label>
 <input 
 type="number" 
 min="1"
 max="10"
 disabled={editingKey !== 'pomodoro_engine'}
 value={editingKey === 'pomodoro_engine' ? pomodoroEdit.sessions : config?.pomodoroSessionsBeforeLongBreak}
 onChange={(e) => {
   const val = parseInt(e.target.value);
   if (!isNaN(val)) {
     setPomodoroEdit({...pomodoroEdit, sessions: Math.max(1, Math.min(10, val))});
   } else {
     setPomodoroEdit({...pomodoroEdit, sessions: 1});
   }
 }}
 className="w-full px-3 py-2 rounded bg-muted/50 border border-border/50 text-[13px] font-mono focus:outline-none focus:border-primary/30"
 />
 </div>
 </div>
 </SettingsCard>
 </div>

 <div className="mt-12">
 <Card className="border-destructive/20 bg-destructive/5">
 <CardHeader title="Danger Zone" description="Permanent data deletion" />
 <CardContent className="flex gap-4">
 <button
 onClick={handleClear}
 className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-[9px] font-black uppercase tracking-widest  text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 h-9"
 >
 <Trash2 size={12} className="mr-2" />
 Reset Config
 </button>
 <button
 onClick={() => {
   if (window.confirm('Are you sure you want to clear all tracked study history? This cannot be undone.')) {
     clearHistory()
   }
 }}
 className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-[9px] font-black uppercase tracking-widest  text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 h-9"
 >
 <Activity size={12} className="mr-2" />
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
