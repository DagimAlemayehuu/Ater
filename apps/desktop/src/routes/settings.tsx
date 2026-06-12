/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState, useEffect} from 'react'
import {cn} from '@/lib/utils'
import {useConfig, SavedApiKey, AppConfig} from '@/lib/ConfigContext'
import {sidecarApi} from '@/lib/sidecarApi'
import {open} from '@tauri-apps/plugin-dialog'
import {usePomodoroStore} from '@/lib/pomodoroStore'
import {TokenTracker} from '@/components/intelligence/TokenTracker'
import * as Tabs from '@radix-ui/react-tabs'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchSidecarJson } from '@/lib/sidecarHttp'
import { invoke } from '@tauri-apps/api/core'
import { open as openUrl } from '@tauri-apps/plugin-shell'

// Local UI Components to avoid dependency issues
const Card = ({children, className}: any) => (
  <div className={cn("border border-border bg-bento-panel rounded-[12px] transition-colors", className)}>
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
  <Card className="bg-bento-panel rounded-[12px] border border-border">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">{title}</h3>
          <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">{value}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={onSave} className="h-8 px-4 bg-foreground text-background text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 rounded-[8px] transition-all">Save</button>
              <button onClick={onCancel} className="h-8 px-4 bg-muted/20 text-muted-foreground border border-border/40 text-[9px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/30 rounded-[8px] transition-all">Abort</button>
            </>
          ) : (
            <button onClick={onEdit} className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-foreground/30 rounded-[8px] transition-all">Edit</button>
          )}
        </div>
      </div>
      {children}
    </div>
  </Card>
)

const parseOptionalNumber = (value: any) => {
  if (value === undefined || value === null) return undefined
  const str = typeof value === 'string' ? value : String(value)
  const trimmed = str.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export default function Settings() {
  const {config, saveConfig} = useConfig()
  const {clearHistory: clearLocalHistory} = usePomodoroStore()
  
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [selectedVaultKeyId, setSelectedVaultKeyId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'none' | 'clear_config' | 'clear_history' | 'factory_reset'>('none')
  
  // Local state for edits
  const [aiEdit, setAiEdit] = useState({provider: '', key: '', model: '', baseUrl: '', maxTpm: '', maxRpm: '', maxTpd: '', maxRpd: '', maxConcurrency: ''})
  const [pomodoroEdit, setPomodoroEdit] = useState({work: 25, short: 5, long: 15, sessions: 4})
  const [vaultEdit, setVaultEdit] = useState({vaultPath: '', inboxPath: '', academicPath: '', autoDeploy: false})
  const [profileEdit, setProfileEdit] = useState({name: ''})
  
  const [isAddingKey, setIsAddingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('google')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyModel, setNewKeyModel] = useState('')
  const [newKeyBaseUrl, setNewKeyBaseUrl] = useState('')
  const [newKeyLimits, setNewKeyLimits] = useState({maxTpm: '', maxRpm: '', maxTpd: '', maxRpd: '', maxConcurrency: ''})
  
  const [testStatus, setTestStatus] = useState<{loading: boolean, success: boolean | null, message: string}>({
    loading: false, success: null, message: ''
  })

  // Dynamic Updater States
  const [currentVersion, setCurrentVersion] = useState('0.8.0')
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'up-to-date' | 'available'>('idle')

  // Advanced toggles for simplifying UX
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAddKeyAdvanced, setShowAddKeyAdvanced] = useState(false)

  // NotebookLM States
  const [notebooklmStatus, setNotebooklmStatus] = useState<{ auth_status: string, email: string | null } | null>(null)
  const [notebooklmAuthenticating, setNotebooklmAuthenticating] = useState(false)

  const fetchNotebookLMStatus = async (force = false) => {
    try {
      const activePort = await invoke<number>('get_sidecar_port').catch(() => 8765);
      const sidecarToken = await invoke<string>('get_sidecar_token').catch(() => '');
      const url = `http://127.0.0.1:${activePort}/api/notebooklm/auth/status${force ? '?force=true' : ''}`;
      const res = await fetchSidecarJson(url, {
        headers: {
          'X-Ater-Token': sidecarToken
        }
      }, fetch, 30000);
      setNotebooklmStatus(res);
    } catch (err) {
      console.error('[Settings] Failed to fetch NotebookLM status:', err);
    }
  };

  useEffect(() => {
    fetchNotebookLMStatus();
    const interval = setInterval(fetchNotebookLMStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNotebookLMLogin = async (clear = false) => {
    setNotebooklmAuthenticating(true);
    try {
      const activePort = await invoke<number>('get_sidecar_port').catch(() => 8765);
      const sidecarToken = await invoke<string>('get_sidecar_token').catch(() => '');
      const url = `http://127.0.0.1:${activePort}/api/notebooklm/auth/login?force=true${clear ? '&clear=true' : ''}`;
      
      const res = await fetchSidecarJson(url, {
        method: 'POST',
        headers: {
          'X-Ater-Token': sidecarToken
        }
      }, fetch, 30000);
      if (res.success) {
        toast.success(clear ? 'NotebookLM account switch started.' : 'NotebookLM login started.');
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          await fetchNotebookLMStatus(true);
          if (attempts > 30) clearInterval(poll);
        }, 3000);
      } else {
        toast.error('Failed to trigger login: ' + res.message);
      }
    } catch (err: any) {
      toast.error('Could not initiate login: ' + err.message);
    } finally {
      setNotebooklmAuthenticating(false);
    }
  };

  const handleOpenNotebookLMWeb = async () => {
    try {
      await openUrl('https://notebooklm.google.com/');
    } catch (err: any) {
      toast.error('Could not open NotebookLM: ' + err.message);
    }
  };

  useEffect(() => {
    import('@tauri-apps/api/app').then(({ getVersion }) => {
      getVersion().then(setCurrentVersion).catch(err => console.error('[Settings] Failed to fetch app version:', err))
    })
  }, [])

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true)
    setUpdateStatus('idle')
    toast.dismiss()
    
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      
      const checkPromise = check()
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Update check timed out')), 5000)
      )
      
      const update = await Promise.race([checkPromise, timeoutPromise])
      
      if (update?.available) {
        setUpdateStatus('available')
        window.dispatchEvent(new CustomEvent('show-update-dialog', { detail: update }))
      } else {
        setUpdateStatus('up-to-date')
        toast.success('Ater is up to date!')
      }
    } catch (error: any) {
      console.error('[Settings Updater] Check failed:', error)
      const errMsg = error.message || String(error)
      
      // Perform a direct network query via the Tauri Rust backend to bypass browser CSP blocks
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const remoteVersion = await invoke<string>('check_remote_version')
        if (remoteVersion === currentVersion) {
          setUpdateStatus('up-to-date')
          toast.success('Ater is up to date!')
          return
        }
      } catch (fetchErr) {
        console.error('[Settings Updater] Failed to check version manifest directly:', fetchErr)
      }
      
      toast.error('Failed to check for updates: ' + errMsg)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

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
    const matchingKey = config?.savedApiKeys?.find(k => k.key === config?.aiApiKey)
    setSelectedVaultKeyId(matchingKey ? matchingKey.id : null)
    setAiEdit({
      provider: config?.aiProvider || 'google',
      key: config?.aiApiKey || '',
      model: config?.aiModel || 'gemini-2.0-flash',
      baseUrl: config?.aiBaseUrl || '',
      maxTpm: config?.aiMaxTpm?.toString() || '',
      maxRpm: config?.aiMaxRpm?.toString() || '',
      maxTpd: config?.aiMaxTpd?.toString() || '',
      maxRpd: config?.aiMaxRpd?.toString() || '',
      maxConcurrency: config?.aiMaxConcurrency?.toString() || ''
    })
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

  // Auto-enable edit modes during tour/simulation
  useEffect(() => {
    if (config?.isDemoMode && config?.walkthroughStatus === 'active') {
      const ms = config.walkthroughMilestone
      if (ms === '2.1' || ms === '2.2') {
        if (editingKey !== 'folder_settings') {
          startVaultEdit()
        }
      } else if (ms === '2.3' || ms === '2.4') {
        if (editingKey !== 'primary_engine') {
          startAiEdit()
        }
      } else if (ms === '2.5' || ms === '2.6') {
        if (editingKey !== 'timer_settings') {
          startPomodoroEdit()
        }
      }
    }
  }, [config?.isDemoMode, config?.walkthroughStatus, config?.walkthroughMilestone])

  const handleSave = async () => {
    try {
      if (editingKey === 'primary_engine') {
        const updatedConfig: any = {
          aiProvider: aiEdit.provider,
          aiApiKey: aiEdit.key,
          aiModel: aiEdit.model,
          aiBaseUrl: aiEdit.baseUrl,
          aiMaxTpm: parseOptionalNumber(aiEdit.maxTpm),
          aiMaxRpm: parseOptionalNumber(aiEdit.maxRpm),
          aiMaxTpd: parseOptionalNumber(aiEdit.maxTpd),
          aiMaxRpd: parseOptionalNumber(aiEdit.maxRpd),
          aiMaxConcurrency: parseOptionalNumber(aiEdit.maxConcurrency)
        }

        // Sync active modifications back to Key Vault if a key was selected
        if (selectedVaultKeyId) {
          const currentKeys = config?.savedApiKeys || []
          const updatedKeys = currentKeys.map(k => {
            if (k.id === selectedVaultKeyId) {
              return {
                ...k,
                provider: aiEdit.provider,
                key: aiEdit.key,
                model: aiEdit.model || undefined,
                baseUrl: aiEdit.provider === 'custom' ? aiEdit.baseUrl : undefined,
                maxTpm: parseOptionalNumber(aiEdit.maxTpm),
                maxRpm: parseOptionalNumber(aiEdit.maxRpm),
                maxTpd: parseOptionalNumber(aiEdit.maxTpd),
                maxRpd: parseOptionalNumber(aiEdit.maxRpd),
                maxConcurrency: parseOptionalNumber(aiEdit.maxConcurrency)
              }
            }
            return k
          })
          updatedConfig.savedApiKeys = updatedKeys
        }

        await saveConfig(updatedConfig)
        try {
          await sidecarApi.aterWatcherToggle();
        } catch (e) {
          console.error('[Tauri Native RAG] Failed to sync watcher after saving API keys:', e);
        }
      } else if (editingKey === 'timer_settings') {
        await saveConfig({
          pomodoroWorkDuration: pomodoroEdit.work,
          pomodoroShortBreakDuration: pomodoroEdit.short,
          pomodoroLongBreakDuration: pomodoroEdit.long,
          pomodoroSessionsBeforeLongBreak: pomodoroEdit.sessions
        })
      } else if (editingKey === 'folder_settings') {
        const pathChanged = vaultEdit.vaultPath !== (config?.obsidianVaultPath || '');
        if (pathChanged) {
          toast.info('Updating vault location and restarting backend services...');
          await sidecarApi.updateVaultPath(vaultEdit.vaultPath);
        }
        await saveConfig({
          obsidianVaultPath: vaultEdit.vaultPath,
          inboxPath: vaultEdit.inboxPath,
          academicFolderPath: vaultEdit.academicPath,
          autoDeploy: vaultEdit.autoDeploy
        })
        // Always sync watcher state when folder settings are saved
        try {
          await sidecarApi.aterWatcherToggle();
        } catch (e) {
          console.error('[Tauri Native RAG] Failed to sync watcher after saving folders:', e);
        }
      }
      setEditingKey(null)
      setSelectedVaultKeyId(null)
      toast.success('Configuration saved successfully.')
    } catch (err: any) {
      console.error('[Settings] Save failed:', err)
      toast.error('Failed to save settings: ' + err.message)
    }
  }

  const handleSaveProfile = async () => {
    if (config) {
      await saveConfig({
        displayName: profileEdit.name
      })
    }
    setEditingKey(null)
  }

  const handleClearConfig = async (bypassConfirm = false) => {
    if (bypassConfirm !== true) {
      setConfirmAction('clear_config')
      return
    }
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

  const handleResetTrackedData = async (bypassConfirm = false) => {
    if (bypassConfirm !== true) {
      setConfirmAction('clear_history')
      return
    }
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

  const handleFactoryReset = async (bypassConfirm = false) => {
    if (bypassConfirm !== true) {
      setConfirmAction('factory_reset')
      return
    }
    try {
      toast.info('Factory reset in progress...');
      const res = await sidecarApi.factoryReset();
      if (!res?.success) {
        throw new Error(res?.error || 'Factory reset did not complete. No relaunch was attempted.');
      }
      if (res.restartRequired !== true) {
        throw new Error('Factory reset completed without a restart instruction.');
      }
      // Clear local config completely after the native purge has verified success.
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
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      toast.error('Factory reset failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  const handleTestConnection = async () => {
    setTestStatus({loading: true, success: null, message: ''})
    try {
      let overrideConfig = undefined
      if (editingKey === 'primary_engine') {
        overrideConfig = {
          aiProvider: aiEdit.provider,
          aiApiKey: aiEdit.key,
          aiModel: aiEdit.model,
          aiBaseUrl: aiEdit.baseUrl || undefined,
          aiMaxTpm: parseOptionalNumber(aiEdit.maxTpm),
          aiMaxRpm: parseOptionalNumber(aiEdit.maxRpm),
          aiMaxTpd: parseOptionalNumber(aiEdit.maxTpd),
          aiMaxRpd: parseOptionalNumber(aiEdit.maxRpd),
          aiMaxConcurrency: parseOptionalNumber(aiEdit.maxConcurrency),
        }
      }
      const res = await sidecarApi.testAiConnection('primary', overrideConfig)
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
      try {
        await navigator.clipboard.writeText(logPath);
        toast.success(`System logs exported successfully & path copied to clipboard:\n${logPath}`);
      } catch {
        toast.success(`System logs exported and saved to:\n${logPath}`);
      }
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
      key: newKeyValue,
      model: newKeyModel || undefined,
      baseUrl: newKeyProvider === 'custom' ? newKeyBaseUrl : undefined,
      maxTpm: parseOptionalNumber(newKeyLimits.maxTpm),
      maxRpm: parseOptionalNumber(newKeyLimits.maxRpm),
      maxTpd: parseOptionalNumber(newKeyLimits.maxTpd),
      maxRpd: parseOptionalNumber(newKeyLimits.maxRpd),
      maxConcurrency: parseOptionalNumber(newKeyLimits.maxConcurrency)
    }
    const currentKeys = config?.savedApiKeys || []
    await saveConfig({
      savedApiKeys: [...currentKeys, newKey],
      aiProvider: newKey.provider,
      aiApiKey: newKey.key,
      aiModel: newKey.model || (newKey.provider === 'google' ? 'gemini-2.0-flash' : ''),
      aiBaseUrl: newKey.baseUrl || '',
      aiMaxTpm: newKey.maxTpm,
      aiMaxRpm: newKey.maxRpm,
      aiMaxTpd: newKey.maxTpd,
      aiMaxRpd: newKey.maxRpd,
      aiMaxConcurrency: newKey.maxConcurrency
    })
    setNewKeyName('')
    setNewKeyValue('')
    setNewKeyModel('')
    setNewKeyBaseUrl('')
    setNewKeyLimits({maxTpm: '', maxRpm: '', maxTpd: '', maxRpd: '', maxConcurrency: ''})
    setIsAddingKey(false)
    toast.success(`Key "${newKeyName}" added and activated.`);
  }

  const deleteApiKey = async (id: string) => {
    const currentKeys = config?.savedApiKeys || []
    const deletedKey = currentKeys.find(k => k.id === id)
    const remainingKeys = currentKeys.filter(k => k.id !== id)
    
    const updates: Partial<AppConfig> = { savedApiKeys: remainingKeys }
    
    if (deletedKey && config?.aiApiKey === deletedKey.key) {
      if (remainingKeys.length > 0) {
        const fallback = remainingKeys[0]
        updates.aiProvider = fallback.provider
        updates.aiApiKey = fallback.key
        updates.aiModel = fallback.model || (fallback.provider === 'google' ? 'gemini-2.0-flash' : '')
        updates.aiBaseUrl = fallback.baseUrl || ''
        updates.aiMaxTpm = fallback.maxTpm
        updates.aiMaxRpm = fallback.maxRpm
        updates.aiMaxTpd = fallback.maxTpd
        updates.aiMaxRpd = fallback.maxRpd
        updates.aiMaxConcurrency = fallback.maxConcurrency
        toast.info(`Active key deleted. Fallback to: ${fallback.name}`)
      } else {
        updates.aiApiKey = ''
        updates.aiBaseUrl = ''
        updates.aiMaxTpm = undefined
        updates.aiMaxRpm = undefined
        updates.aiMaxTpd = undefined
        updates.aiMaxRpd = undefined
        updates.aiMaxConcurrency = undefined
        toast.info('Active key deleted. No saved keys left.')
      }
    }
    
    await saveConfig(updates)
  }

  const renderGeneral = () => {
    return (
      <div className="w-full space-y-8 pb-20">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">App Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vault Configuration */}
          <div className="col-span-1 md:col-span-2">
            <SettingsCard
              title="Storage Folders"
              value="Manage where your notes and files are stored."
              isEditing={editingKey === 'folder_settings'}
              onEdit={startVaultEdit}
              onSave={handleSave}
              onCancel={() => setEditingKey(null)}
            >
              <div className="space-y-6">
                {/* Obsidian Path */}
                <div className="space-y-2" data-tour="settings-obsidian-path">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">Obsidian Folder</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-bento-item/20 text-[13px] font-mono text-muted-foreground border border-border rounded-[8px] overflow-hidden text-left">
                      <span className="truncate">{editingKey === 'folder_settings' ? vaultEdit.vaultPath : config?.obsidianVaultPath || 'Not selected'}</span>
                    </div>
                    <button
                      disabled={editingKey !== 'folder_settings'}
                      onClick={async () => {
                        try {
                          const selected = await open({directory: true, multiple: false, title: 'Select Obsidian Folder'});
                          if (selected) setVaultEdit({...vaultEdit, vaultPath: selected as string});
                        } catch (err) {console.error(err);}
                      }}
                      className="px-6 py-3 bg-bento-item/50 text-[10px] font-black uppercase tracking-widest border border-border hover:bg-bento-item rounded-[8px] transition-colors disabled:opacity-50"
                    >
                      Select
                    </button>
                  </div>
                </div>

                {/* Inbox Path */}
                <div className="space-y-2" data-tour="settings-inbox-path">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">Inbox Folder (For scanning PDFs)</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-bento-item/20 text-[13px] font-mono text-muted-foreground border border-border rounded-[8px] overflow-hidden text-left">
                      <span className="truncate">{editingKey === 'folder_settings' ? vaultEdit.inboxPath : config?.inboxPath || 'Default (Inbox/)'}</span>
                    </div>
                    <button
                      disabled={editingKey !== 'folder_settings'}
                      onClick={async () => {
                        try {
                          const selected = await open({directory: true, multiple: false, title: 'Select Inbox Folder'});
                          if (selected) setVaultEdit({...vaultEdit, inboxPath: selected as string});
                        } catch (err) {console.error(err);}
                      }}
                      className="px-6 py-3 bg-bento-item/50 text-[10px] font-black uppercase tracking-widest border border-border hover:bg-bento-item rounded-[8px] transition-colors disabled:opacity-50"
                    >
                      Select
                    </button>
                  </div>
                </div>

                {/* Academic Path */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">Notes Folder Name</label>
                  <input 
                    type="text"
                    disabled={editingKey !== 'folder_settings'}
                    value={editingKey === 'folder_settings' ? vaultEdit.academicPath : config?.academicFolderPath || 'Notes'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVaultEdit({...vaultEdit, academicPath: e.target.value})}
                    className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50 rounded-[8px]"
                    placeholder="e.g. Notes"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-border bg-bento-item/30 rounded-[8px]" data-tour="settings-auto-scan">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Auto-Scan Folder</label>
                    <p className="text-[11px] text-muted-foreground font-bold font-sans">Check folders and import files automatically.</p>
                  </div>
                  <button
                    disabled={editingKey !== 'folder_settings'}
                    onClick={() => setVaultEdit({...vaultEdit, autoDeploy: !vaultEdit.autoDeploy})}
                    className={cn(
                      "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-colors disabled:opacity-50 rounded-[8px]",
                      (editingKey === 'folder_settings' ? vaultEdit.autoDeploy : config?.autoDeploy) 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-bento-item text-muted-foreground border-border hover:bg-bento-item/80"
                    )}
                  >
                    {(editingKey === 'folder_settings' ? vaultEdit.autoDeploy : config?.autoDeploy) ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* Version & Updates Card */}
          <Card className="col-span-1" data-tour="settings-update-check">
            <CardHeader 
              title="Updates" 
              description="Check if a newer version of the app is available." 
            />
            <CardContent className="flex items-center justify-between h-[100px] text-left">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Current Version</p>
                <p className="text-[14px] text-foreground font-mono font-black uppercase tracking-widest">v{currentVersion}</p>
              </div>
              <button
                disabled={isCheckingUpdate}
                onClick={handleCheckForUpdates}
                className={cn(
                  "h-10 px-6 text-[10px] font-black uppercase tracking-widest transition-all rounded-[8px] flex items-center gap-2",
                  updateStatus === 'up-to-date' 
                    ? "bg-bento-item text-muted-foreground border border-border" 
                    : "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                )}
              >
                {isCheckingUpdate ? (
                  <span className="animate-pulse">Checking...</span>
                ) : updateStatus === 'up-to-date' ? (
                  'You are up to date'
                ) : (
                  'Check for Updates'
                )}
              </button>
            </CardContent>
          </Card>

          {/* User Profile Card */}
          <div className="col-span-1" data-tour="settings-profile-edit">
            <SettingsCard
              title="Your Name"
              value="The name you want the app to call you."
              isEditing={editingKey === 'profile'}
              onEdit={() => { setEditingKey('profile'); setProfileEdit({name: config?.displayName || ''}); }}
              onSave={handleSaveProfile}
              onCancel={() => setEditingKey(null)}
            >
              <div className="space-y-4 h-[100px] flex flex-col justify-center text-left">
                {editingKey === 'profile' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground block ml-1">Name</label>
                    <input 
                      type="text"
                      value={profileEdit.name}
                      onChange={(e) => setProfileEdit({...profileEdit, name: e.target.value})}
                      className="w-full bg-bento-item/30 border border-border px-4 py-2.5 text-[12px] font-black uppercase tracking-widest focus:outline-none focus:border-primary rounded-[8px]"
                      placeholder="Your Name"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Name</span>
                    <span className="text-[13px] font-black uppercase tracking-widest text-foreground">{config?.displayName || 'Not Set'}</span>
                  </div>
                )}
              </div>
            </SettingsCard>
          </div>

          {/* Diagnostics Card */}
          <Card className="col-span-1" data-tour="settings-export-logs">
            <CardHeader 
              title="Troubleshooting Logs" 
              description="Save a text file with recent system errors to help fix problems." 
            />
            <CardContent className="flex items-center justify-between h-[100px] text-left">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Save Logs File</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium">Saves recent background activity logs to a text file.</p>
              </div>
              <button
                onClick={handleExportLogs}
                className="h-10 px-6 text-[10px] font-black uppercase tracking-widest border border-border/40 text-muted-foreground bg-muted/20 hover:text-foreground hover:bg-muted/30 hover:border-foreground/30 transition-all rounded-[8px]"
              >
                Save Logs
              </button>
            </CardContent>
          </Card>

          {/* About & License Details */}
          <Card className="col-span-1">
            <CardHeader 
              title="Account Info" 
              description="Details about your email and device ID." 
            />
            <CardContent className="space-y-2 text-left h-[100px] flex flex-col justify-center">
              <div className="flex justify-between items-center text-[10px] font-mono border-b border-border/50 pb-1">
                <span className="text-muted-foreground uppercase tracking-widest font-sans font-bold">Email</span>
                <span className="text-foreground truncate max-w-[150px]">{config?.activationEmail || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-muted-foreground uppercase tracking-widest font-sans font-bold">Device ID</span>
                <span className="text-foreground truncate max-w-[150px]">{config?.machineId || 'N/A'}</span>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' });
                      window.location.reload();
                    } catch (e) { console.error(e); }
                  }}
                  className="text-[8px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Log Out
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Simulation Mode Toggle Card */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader 
              title="Interactive Tour / Simulation Mode" 
              description="Explore the interface using offline demo data, or switch back to your real files and vault." 
            />
            <CardContent className="flex items-center justify-between h-[100px] text-left">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Current Mode</p>
                <p className="text-[14px] text-foreground font-mono font-black uppercase tracking-widest">
                  {config?.isDemoMode ? 'SIMULATION / DEMO MODE' : 'REAL WORKSPACE'}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (config?.isDemoMode) {
                    await saveConfig({ appMode: 'real', isDemoMode: false });
                    toast.success('Switched to real workspace. Reloading...');
                  } else {
                    await saveConfig({ appMode: 'simulation', isDemoMode: true });
                    toast.success('Switched to simulation mode. Reloading...');
                  }
                  setTimeout(() => window.location.reload(), 1000);
                }}
                className={cn(
                  "h-10 px-6 text-[10px] font-black uppercase tracking-widest transition-all rounded-[8px]",
                  config?.isDemoMode
                    ? "bg-primary text-primary-foreground border border-primary hover:opacity-90"
                    : "bg-bento-item text-muted-foreground border border-border hover:text-foreground hover:bg-bento-item/80"
                )}
              >
                {config?.isDemoMode ? 'Switch to Real Workspace' : 'Switch to Demo/Simulation Mode'}
              </button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <div className="col-span-1 md:col-span-2 mt-4 text-left">
            <Card>
              <CardHeader title="Danger Zone" description="Warning: These actions cannot be undone." />
              <CardContent className="flex gap-4">
                <button
                  data-tour="settings-danger-reset"
                  onClick={() => handleClearConfig()}
                  className="h-11 px-6 text-[10px] font-black uppercase tracking-widest border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-foreground/30 rounded-[8px] transition-all"
                >
                  Reset All Settings
                </button>
                <button
                  data-tour="settings-danger-clear-history"
                  onClick={() => handleResetTrackedData()}
                  className="h-11 px-6 text-[10px] font-black uppercase tracking-widest border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-foreground/30 rounded-[8px] transition-all"
                >
                  Clear Study History
                </button>
                <button
                  data-tour="settings-danger-factory"
                  onClick={() => handleFactoryReset()}
                  className="h-11 px-6 text-[10px] font-black uppercase tracking-widest bg-foreground text-background border border-foreground hover:bg-foreground/90 rounded-[8px] transition-all"
                >
                  Delete Everything & Reset App
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const renderAI = () => {
    return (
      <div className="w-full space-y-8 pb-20">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">AI Provider & Keys</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Intelligence (AI Engines) */}
          <div className="col-span-1">
            <SettingsCard
              title="AI Provider & API Key"
              value="Choose which AI provider and model you want to use."
              isEditing={editingKey === 'primary_engine'}
              onEdit={() => startAiEdit()}
              onSave={handleSave}
              onCancel={() => setEditingKey(null)}
            >
              <div className="space-y-6 text-foreground text-left">
                {/* Saved Key Selection */}
                <div className="space-y-4 pb-6 border-b border-border">
                  <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">
                    Choose active key:
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
                          onClick={async () => {
                            if (editingKey === 'primary_engine') {
                              setSelectedVaultKeyId(k.id);
                              setAiEdit({
                                provider: k.provider,
                                key: k.key,
                                model: k.model || (k.provider === 'google' ? 'gemini-2.0-flash' : aiEdit.model),
                                baseUrl: k.baseUrl || '',
                                maxTpm: k.maxTpm?.toString() || '',
                                maxRpm: k.maxRpm?.toString() || '',
                                maxTpd: k.maxTpd?.toString() || '',
                                maxRpd: k.maxRpd?.toString() || '',
                                maxConcurrency: k.maxConcurrency?.toString() || ''
                              });
                            } else {
                              await saveConfig({
                                aiProvider: k.provider,
                                aiApiKey: k.key,
                                aiModel: k.model || (k.provider === 'google' ? 'gemini-2.0-flash' : (config.aiModel || '')),
                                aiBaseUrl: k.baseUrl || '',
                                aiMaxTpm: k.maxTpm,
                                aiMaxRpm: k.maxRpm,
                                aiMaxTpd: k.maxTpd,
                                aiMaxRpd: k.maxRpd,
                                aiMaxConcurrency: k.maxConcurrency
                              });
                              try {
                                await sidecarApi.aterWatcherToggle();
                              } catch (e) {
                                console.error('[Tauri Native RAG] Failed to sync watcher after selecting API key:', e);
                              }
                              toast.success(`Activated key: ${k.name}`);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-colors rounded-[8px]",
                            (isSelected && editingKey !== 'primary_engine') || (aiEdit.key === k.key && editingKey === 'primary_engine')
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-bento-item/50 text-muted-foreground border-border hover:bg-bento-item"
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
                    <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">AI Provider (e.g. Google)</label>
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
                        if (provider === 'custom') defaultModel = aiEdit.model || 'openai-compatible-model';
                        setAiEdit({...aiEdit, provider, model: defaultModel});
                      }}
                      className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[11px] font-bold uppercase focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                    >
                      <option value="google" className="bg-bento-panel">Google Gemini</option>
                      <option value="openai" className="bg-bento-panel">OpenAI</option>
                      <option value="anthropic" className="bg-bento-panel">Anthropic</option>
                      <option value="groq" className="bg-bento-panel">Groq (Fast)</option>
                      <option value="openrouter" className="bg-bento-panel">OpenRouter</option>
                      <option value="custom" className="bg-bento-panel">Custom Provider</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">API Key</label>
                    {editingKey === 'primary_engine' ? (
                      <input
                        type="password"
                        value={aiEdit.key}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, key: e.target.value})}
                        className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] focus:outline-none focus:border-primary font-mono rounded-[8px]"
                        autoFocus
                        placeholder={`Enter ${aiEdit.provider.toUpperCase()} Key`}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-bento-item/20 text-[13px] font-mono text-muted-foreground border border-border rounded-[8px]">
                        <span>
                          {config?.aiApiKey ? '••••••••' + config?.aiApiKey.slice(-4) : 'Not configured'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">AI Model</label>
                    <input
                      type="text"
                      disabled={editingKey !== 'primary_engine'}
                      value={editingKey === 'primary_engine' ? aiEdit.model : config?.aiModel || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, model: e.target.value})}
                      className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                    />
                  </div>

                  {(editingKey === 'primary_engine' ? aiEdit.provider : config?.aiProvider) === 'custom' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">Base URL (Advanced)</label>
                      <input
                        type="text"
                        disabled={editingKey !== 'primary_engine'}
                        value={editingKey === 'primary_engine' ? aiEdit.baseUrl : config?.aiBaseUrl || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, baseUrl: e.target.value})}
                        placeholder="https://provider.example.com/v1"
                        className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                      />
                    </div>
                  )}

                  {/* Advanced settings toggle for custom speed limits */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors outline-none"
                    >
                      {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                    </button>
                    {showAdvanced && (
                      <div className="space-y-4 pt-4 border-t border-border/60">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-foreground uppercase tracking-widest block text-left">Speed Limits</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="1"
                              disabled={editingKey !== 'primary_engine'}
                              value={editingKey === 'primary_engine' ? aiEdit.maxTpm : config?.aiMaxTpm || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, maxTpm: e.target.value})}
                              placeholder="Max tokens per minute"
                              className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                            />
                            <input
                              type="number"
                              min="1"
                              disabled={editingKey !== 'primary_engine'}
                              value={editingKey === 'primary_engine' ? aiEdit.maxRpm : config?.aiMaxRpm || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, maxRpm: e.target.value})}
                              placeholder="Max requests per minute"
                              className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                            />
                            <input
                              type="number"
                              min="1"
                              disabled={editingKey !== 'primary_engine'}
                              value={editingKey === 'primary_engine' ? aiEdit.maxTpd : config?.aiMaxTpd || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, maxTpd: e.target.value})}
                              placeholder="Max tokens per day"
                              className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                            />
                            <input
                              type="number"
                              min="1"
                              disabled={editingKey !== 'primary_engine'}
                              value={editingKey === 'primary_engine' ? aiEdit.maxRpd : config?.aiMaxRpd || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, maxRpd: e.target.value})}
                              placeholder="Max requests per day"
                              className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50"
                            />
                          </div>
                          <input
                            type="number"
                            min="1"
                            disabled={editingKey !== 'primary_engine'}
                            value={editingKey === 'primary_engine' ? aiEdit.maxConcurrency : config?.aiMaxConcurrency || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiEdit({...aiEdit, maxConcurrency: e.target.value})}
                            placeholder="Max simultaneous requests"
                            className="w-full bg-bento-item/30 border border-border px-4 py-3 text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px] disabled:opacity-50 mt-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      data-tour="ai-connection-status"
                      onClick={() => handleTestConnection()}
                      disabled={testStatus.loading || (editingKey === 'primary_engine' ? !aiEdit.key : !config?.aiApiKey)}
                      className={cn(
                        "w-full h-11 text-[10px] font-black uppercase tracking-widest border transition-all rounded-[8px]",
                        testStatus.loading ? "opacity-50 cursor-not-allowed bg-muted/20 text-muted-foreground border-border/40" :
                        testStatus.success === true ? "bg-foreground text-background border-foreground" :
                        testStatus.success === false ? "bg-background text-foreground border-foreground/50" :
                        "bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground border-border/40 hover:border-foreground/30"
                      )}
                    >
                      {testStatus.loading ? 'Testing...' : 'Check if Key Works'}
                    </button>
                  </div>
                </div>

                {testStatus.message && (
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-4 px-4 py-3 border rounded-[8px] border-primary text-foreground"
                  )}>
                    {testStatus.message}
                  </p>
                )}
              </div>
            </SettingsCard>
          </div>

          {/* Key Vault */}
          <div className="col-span-1">
            <Card className="h-full">
              <CardHeader 
                title="Your Saved Keys" 
                description="Here you can store and manage multiple API keys." 
              />
              <CardContent className="text-left">
                <div className="grid grid-cols-1 gap-3">
                  {config?.savedApiKeys?.map((k) => (
                    <div key={k.id} className="group relative flex flex-col p-4 border border-border bg-bento-item/30 hover:bg-bento-item transition-colors rounded-[8px]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground truncate max-w-[150px]">{k.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 border border-border bg-bento-panel rounded-[4px] font-bold uppercase text-muted-foreground">{k.provider}</span>
                      </div>
                      <div className="text-[12px] font-mono text-muted-foreground truncate">••••••••{k.key.slice(-4)}</div>
                      {(k.model || k.maxTpm || k.maxRpm) && (
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                          {k.model || 'model unset'}{k.maxTpm ? ` · ${k.maxTpm} TPM` : ''}{k.maxRpm ? ` · ${k.maxRpm} RPM` : ''}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => {deleteApiKey(k.id)}}
                        className="absolute top-4 right-4 text-[9px] font-black uppercase text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  ))}

                  {isAddingKey ? (
                    <div className="flex flex-col p-4 border border-primary bg-bento-item/20 rounded-[8px] space-y-4">
                      <input 
                        placeholder="Name (e.g. My Gemini Key)"
                        value={newKeyName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
                        className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] font-bold uppercase focus:outline-none focus:border-primary rounded-[8px]"
                        autoFocus
                      />
                      <select
                        value={newKeyProvider}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const provider = e.target.value
                          setNewKeyProvider(provider)
                          if (!newKeyModel) {
                            if (provider === 'google') setNewKeyModel('gemini-2.0-flash')
                            if (provider === 'openai') setNewKeyModel('gpt-4o')
                            if (provider === 'anthropic') setNewKeyModel('claude-3-5-sonnet-latest')
                            if (provider === 'groq') setNewKeyModel('llama-3.3-70b-versatile')
                            if (provider === 'openrouter') setNewKeyModel('google/gemini-2.0-flash-001')
                          }
                        }}
                        className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] font-bold uppercase focus:outline-none focus:border-primary rounded-[8px]"
                      >
                        <option value="google" className="bg-bento-panel">Google</option>
                        <option value="openai" className="bg-bento-panel">OpenAI</option>
                        <option value="anthropic" className="bg-bento-panel">Anthropic</option>
                        <option value="groq" className="bg-bento-panel">Groq</option>
                        <option value="openrouter" className="bg-bento-panel">OpenRouter</option>
                        <option value="custom" className="bg-bento-panel">Custom Provider</option>
                      </select>
                      <input
                        placeholder="Model Name"
                        value={newKeyModel}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyModel(e.target.value)}
                        className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                      />
                      {newKeyProvider === 'custom' && (
                        <input
                          placeholder="Base URL (Advanced)"
                          value={newKeyBaseUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyBaseUrl(e.target.value)}
                          className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                        />
                      )}
                      <input 
                        type="password"
                        placeholder="API Key"
                        value={newKeyValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyValue(e.target.value)}
                        className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                      />
                      
                      <div className="space-y-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddKeyAdvanced(!showAddKeyAdvanced)}
                          className="text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors outline-none"
                        >
                          {showAddKeyAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                        </button>
                        {showAddKeyAdvanced && (
                          <div className="space-y-3 pt-3 border-t border-border/60">
                            <div className="grid grid-cols-2 gap-2">
                              <input placeholder="TPM limit" value={newKeyLimits.maxTpm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyLimits({...newKeyLimits, maxTpm: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                              <input placeholder="RPM limit" value={newKeyLimits.maxRpm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyLimits({...newKeyLimits, maxRpm: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                              <input placeholder="TPD limit" value={newKeyLimits.maxTpd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyLimits({...newKeyLimits, maxTpd: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                              <input placeholder="RPD limit" value={newKeyLimits.maxRpd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyLimits({...newKeyLimits, maxRpd: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                            </div>
                            <input
                              placeholder="Max simultaneous requests"
                              value={newKeyLimits.maxConcurrency}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyLimits({...newKeyLimits, maxConcurrency: e.target.value})}
                              className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button data-tour="save-key-btn" onClick={handleAddNewKey} className="flex-1 h-9 bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:bg-foreground/90 rounded-[8px] transition-all">Save</button>
                        <button onClick={() => setIsAddingKey(false)} className="h-9 px-4 bg-muted/20 text-muted-foreground border border-border/40 text-[10px] font-black uppercase hover:text-foreground hover:bg-muted/30 rounded-[8px] transition-all">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      data-tour="ai-add-key"
                      onClick={() => setIsAddingKey(true)}
                      className="flex flex-col items-center justify-center p-8 border border-dashed border-border hover:border-primary hover:bg-bento-item/40 rounded-[8px] gap-2 transition-colors min-h-[140px]"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Add New Key</span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const renderFocus = () => {
    return (
      <div className="w-full space-y-8 pb-20">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Focus Timer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timer Settings */}
          <div className="col-span-1 md:col-span-2">
            <SettingsCard
              title="Timer Durations"
              value="Set how long your work and break sessions should be."
              isEditing={editingKey === 'timer_settings'}
              onEdit={startPomodoroEdit}
              onSave={handleSave}
              onCancel={() => setEditingKey(null)}
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block text-left">Work duration (minutes)</label>
                  <input 
                    data-tour="timer-work-duration"
                    type="number" 
                    disabled={editingKey !== 'timer_settings'}
                    value={editingKey === 'timer_settings' ? pomodoroEdit.work : config?.pomodoroWorkDuration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, work: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50 rounded-[8px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block text-left">Short break duration (minutes)</label>
                  <input 
                    type="number" 
                    disabled={editingKey !== 'timer_settings'}
                    value={editingKey === 'timer_settings' ? pomodoroEdit.short : config?.pomodoroShortBreakDuration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, short: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50 rounded-[8px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block text-left">Long break duration (minutes)</label>
                  <input 
                    type="number" 
                    disabled={editingKey !== 'timer_settings'}
                    value={editingKey === 'timer_settings' ? pomodoroEdit.long : config?.pomodoroLongBreakDuration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPomodoroEdit({...pomodoroEdit, long: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50 rounded-[8px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block text-left">Work sessions before a long break</label>
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
                    className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary disabled:opacity-50 rounded-[8px]"
                  />
                </div>
              </div>
            </SettingsCard>
          </div>
        </div>
      </div>
    )
  }

  const renderIntegrations = () => {
    const isConfigured = notebooklmStatus?.auth_status === 'configured';
    const isStale = notebooklmStatus?.auth_status === 'stale';
    const email = notebooklmStatus?.email;

    return (
      <div className="w-full space-y-8 pb-20">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Connected Services</h2>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Configure external integrations and account connections.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-bento-panel rounded-[12px] border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-left">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Google NotebookLM</h3>
                  <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                    Link your Google account to access your notebooks, sources, and study studio.
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    disabled={notebooklmAuthenticating}
                    onClick={handleOpenNotebookLMWeb}
                    className="h-8 px-4 border border-border/60 text-[9px] font-black uppercase tracking-widest hover:bg-muted/20 rounded-[8px] transition-all disabled:opacity-50"
                  >
                    Open NotebookLM
                  </button>
                  <button
                    disabled={notebooklmAuthenticating}
                    onClick={() => handleNotebookLMLogin(false)}
                    className="h-8 px-4 bg-foreground text-background text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 rounded-[8px] transition-all disabled:opacity-50"
                  >
                    {notebooklmAuthenticating ? 'Connecting...' : (isConfigured ? 'Reconnect Account' : 'Connect Account')}
                  </button>
                  {isConfigured && (
                    <button
                      disabled={notebooklmAuthenticating}
                      onClick={() => handleNotebookLMLogin(true)}
                      className="h-8 px-4 border border-border/60 text-[9px] font-black uppercase tracking-widest hover:bg-muted/20 rounded-[8px] transition-all disabled:opacity-50"
                    >
                      Switch Account
                    </button>
                  )}
                </div>
              </div>

              <div className="border border-border/40 bg-bento-item/10 rounded-[8px] p-4 flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "size-1.5 rounded-full animate-pulse",
                      isConfigured ? "bg-emerald-500" : isStale ? "bg-amber-500" : "bg-muted-foreground/40"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                      {isConfigured ? 'Connected' : isStale ? 'Session Stale' : 'Not Connected'}
                    </span>
                  </div>
                </div>

                {(isConfigured || isStale) && email && (
                  <div className="flex items-center justify-between border-t border-border/20 pt-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Linked Account</span>
                    <span className="text-[11px] font-mono font-bold text-foreground">{email}</span>
                  </div>
                )}
                
                <div className="border-t border-border/20 pt-3 text-[10px] font-sans font-bold text-muted-foreground leading-normal">
                  <p>
                    NotebookLM CLI authentication uses a supported Chrome-family browser profile so Ater can read session credentials. Open NotebookLM launches the web app in your device default browser.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col font-sans bg-transparent text-foreground overflow-hidden gap-3">
      <Tabs.Root defaultValue="general" className="flex-1 flex flex-col overflow-hidden gap-3">
        {/* Navigation Bento Box */}
        <div className="shrink-0 px-6 bg-bento-panel border border-border/40 rounded-[12px] h-12 flex items-center shadow-sm z-30">
          <Tabs.List className="flex items-center gap-1 h-full">
            <Tabs.Trigger 
              value="general"
              className="relative h-full px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-muted/10 group"
            >
              General
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground hidden group-data-[state=active]:block" />
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="ai"
              data-tour="tab-ai-config"
              className="relative h-full px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-muted/10 group"
            >
              AI & Keys
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground hidden group-data-[state=active]:block" />
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="integrations"
              className="relative h-full px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-muted/10 group"
            >
              Integrations
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground hidden group-data-[state=active]:block" />
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="focus"
              data-tour="tab-timer"
              className="relative h-full px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-muted/10 group"
            >
              Focus Timer
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground hidden group-data-[state=active]:block" />
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="intelligence"
              data-tour="tab-token-tracker"
              className="relative h-full px-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-muted/10 group"
            >
              Usage Tracker
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground hidden group-data-[state=active]:block" />
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        {/* Content Bento Box */}
        <div className="flex-1 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar p-10 pb-24">
            <div className="max-w-4xl mx-auto">
              <Tabs.Content value="general" className="outline-none">
                {renderGeneral()}
              </Tabs.Content>
              
              <Tabs.Content value="ai" className="outline-none">
                {renderAI()}
              </Tabs.Content>
              
              <Tabs.Content value="integrations" className="outline-none">
                {renderIntegrations()}
              </Tabs.Content>
              
              <Tabs.Content value="focus" className="outline-none">
                {renderFocus()}
              </Tabs.Content>
              
              <Tabs.Content value="intelligence" className="outline-none">
                <TokenTracker />
              </Tabs.Content>
            </div>
          </div>
        </div>
      </Tabs.Root>

      {/* Danger Zone Action Confirmation Modal */}
      {confirmAction !== 'none' && (
        <div className="fixed inset-0 z-[9999] bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in pointer-events-auto select-none">
          <div className="w-full max-w-md bg-bento-panel border border-destructive/30 rounded-[12px] p-8 shadow-2xl flex flex-col items-start text-left">
            <div className="text-[9px] font-black uppercase tracking-widest text-destructive mb-3">
              Confirm Destructive Action
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">
              {confirmAction === 'clear_config' && 'Reset All Settings'}
              {confirmAction === 'clear_history' && 'Clear Study History'}
              {confirmAction === 'factory_reset' && 'Full Factory Reset'}
            </h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-6 font-sans">
              {confirmAction === 'clear_config' &&
                'This will wipe all active configurations from the local application database. Your selected Obsidian vault folder path, saved API Keys, custom Pomodoro focus timers, academic program preferences, and display name will be permanently cleared. Note: The raw markdown files inside your vault folder will remain untouched.'}
              {confirmAction === 'clear_history' &&
                'This will permanently delete all logged study metrics from your local analytics engine. Your completed Pomodoro focus duration minutes, FSRS spaced-repetition card review history logs, and exam confidence levels will be wiped. This action cannot be reversed.'}
              {confirmAction === 'factory_reset' &&
                'This is a complete nuclear option. It will wipe all local study logs, clear your active system configurations, purge generated academic roadmap rows inside the vault, deactivate your Waitlist clearance code, and relaunch Ater from scratch. Proceed with extreme caution.'}
            </p>

            <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-[8px] mb-8 text-[11px] font-bold text-destructive flex items-center gap-2">
              <span className="shrink-0 uppercase bg-destructive text-background text-[9px] px-1 py-0.5 rounded font-black tracking-widest">Warning</span>
              <span>This action is destructive and cannot be undone.</span>
            </div>

            <div className="flex w-full gap-3">
              <button
                onClick={async () => {
                  const act = confirmAction;
                  setConfirmAction('none');
                  if (act === 'clear_config') await handleClearConfig(true);
                  if (act === 'clear_history') await handleResetTrackedData(true);
                  if (act === 'factory_reset') await handleFactoryReset(true);
                }}
                className="flex-1 py-3 bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 rounded-[8px] transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmAction('none')}
                className="px-5 py-3 border border-border bg-bento-item/30 text-muted-foreground hover:text-foreground hover:border-foreground/30 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
