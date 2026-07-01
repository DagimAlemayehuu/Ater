import React, { useState, useEffect } from 'react'
import { useConfig, SavedApiKey } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ThemeSwitch } from '@/components/theme-switch'
import { parseFrontmatter, serializeFrontmatter } from '@/lib/markdownHelper'
import { toast } from 'sonner'
import { normalizeVaultPath, vaultChildPath } from '@/lib/vaultPath'

type StepStatus = 'idle' | 'testing' | 'success' | 'error'

const parseOptionalNumber = (value: any) => {
  if (value === undefined || value === null) return undefined
  const str = typeof value === 'string' ? value : String(value)
  const trimmed = str.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const cleanModel = (modelName: string, keyVal: string) => {
  if (!modelName) return ''
  let cleaned = modelName.trim()
  if (keyVal && keyVal.trim()) {
    const trimmedKey = keyVal.trim()
    if (cleaned.endsWith(trimmedKey)) {
      cleaned = cleaned.slice(0, -trimmedKey.length).trim()
    } else if (cleaned.includes(trimmedKey)) {
      cleaned = cleaned.replace(trimmedKey, '').trim()
    }
  }
  return cleaned
}

export default function Onboarding() {
  const { config, saveConfig } = useConfig()
  const navigate = useNavigate()
  const [step, setStep] = useState(() => {
    if (config?.displayName && config?.obsidianVaultPath) {
      return 4
    }
    if (config?.displayName) {
      return 2
    }
    return 1
  })

  // Existing Vault Auto-Detection States
  const [detectedProfile, setDetectedProfile] = useState<any | null>(null)
  const [showDetectedModal, setShowDetectedModal] = useState(false)
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false)


  // Step 1 — Profile
  const [name, setName] = useState(config?.displayName || '')

  // Step 2 — Vault
  const [vaultPath, setVaultPath] = useState(config?.obsidianVaultPath || '')

  // Step 3 — API Keys Vault & Active Configuration
  const [savedKeys, setSavedKeys] = useState<SavedApiKey[]>(config?.savedApiKeys || [])
  const [activeKey, setActiveKey] = useState(config?.aiApiKey || '')
  const [activeProvider, setActiveProvider] = useState(config?.aiProvider || 'google')
  const [activeModel, setActiveModel] = useState(config?.aiModel || 'gemini-2.0-flash')
  const [activeBaseUrl, setActiveBaseUrl] = useState(config?.aiBaseUrl || '')
  const [activeLimits, setActiveLimits] = useState({ maxTpm: '', maxRpm: '', maxTpd: '', maxRpd: '', maxConcurrency: '' })

  const [isAddingKey, setIsAddingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('google')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyModel, setNewKeyModel] = useState('')
  const [newKeyBaseUrl, setNewKeyBaseUrl] = useState('')
  const [newKeyLimits, setNewKeyLimits] = useState({ maxTpm: '', maxRpm: '', maxTpd: '', maxRpd: '', maxConcurrency: '' })

  const [testStatus, setTestStatus] = useState<StepStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAddKeyAdvanced, setShowAddKeyAdvanced] = useState(false)

  // Step 4 — Focus Timer
  const [workDuration, setWorkDuration] = useState(config?.pomodoroWorkDuration || 25)
  const [shortBreak, setShortBreak] = useState(config?.pomodoroShortBreakDuration || 5)
  const [longBreak, setLongBreak] = useState(config?.pomodoroLongBreakDuration || 15)
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(config?.pomodoroSessionsBeforeLongBreak || 4)

  // Step 5 — Academic Program
  const [programPreset, setProgramPreset] = useState('custom')
  const [programName, setProgramName] = useState('')
  const [programLevel, setProgramLevel] = useState('Undergraduate')
  const [programDuration, setProgramDuration] = useState(4)
  const [programCurrentYear, setProgramCurrentYear] = useState(1)

  const handlePresetChange = (preset: string) => {
    setProgramPreset(preset)
    if (preset === 'cs') {
      setProgramName('Computer Science')
      setProgramLevel('Undergraduate')
      setProgramDuration(4)
      setProgramCurrentYear(2)
    } else if (preset === 'ds') {
      setProgramName('Data Science')
      setProgramLevel('Undergraduate')
      setProgramDuration(4)
      setProgramCurrentYear(1)
    } else if (preset === 'business') {
      setProgramName('Business Administration')
      setProgramLevel('Undergraduate')
      setProgramDuration(4)
      setProgramCurrentYear(1)
    } else {
      setProgramName('')
    }
  }

  // Step 6 — Finalize
  const [finalStatus, setFinalStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [finalError, setFinalError] = useState('')
  const [startWithTour, setStartWithTour] = useState(false)

  // Sync config once loaded
  useEffect(() => {
    if (config) {
      if (config.displayName && !name) setName(config.displayName)
      if (config.obsidianVaultPath && !vaultPath) setVaultPath(config.obsidianVaultPath)
      if (config.savedApiKeys && savedKeys.length === 0) setSavedKeys(config.savedApiKeys)
      if (config.aiApiKey && !activeKey) setActiveKey(config.aiApiKey)
      if (config.aiProvider && activeProvider === 'google') setActiveProvider(config.aiProvider)
      if (config.aiModel && activeModel === 'gemini-2.0-flash') setActiveModel(config.aiModel)
      if (config.aiBaseUrl && !activeBaseUrl) setActiveBaseUrl(config.aiBaseUrl)
    }
  }, [config])

  // Load first name from Supabase on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
          if (data && data.full_name) {
            const firstName = data.full_name.split(' ')[0] || '';
            setName(firstName);
          }
        }
      } catch (err) {
        console.warn('[Onboarding] Failed to pre-fetch profile name:', err)
      }
    }
    fetchProfile()
  }, [])

  // Auto-detect existing vault configuration on mount if vaultPath is set in store
  useEffect(() => {
    if (config?.obsidianVaultPath && !hasCheckedOnMount) {
      setHasCheckedOnMount(true)
      checkExistingVaultConfig(config.obsidianVaultPath)
    }
  }, [config?.obsidianVaultPath, hasCheckedOnMount])

  const handleNext = () => {
    if (step === 2 && !config?.isDemoMode) {
      setStep(4)
    } else if (step === 4 && !config?.isDemoMode) {
      setStep(6)
    } else {
      setStep((s) => s + 1)
    }
  }
  const handleBack = () => {
    if (step === 4 && !config?.isDemoMode) {
      setStep(2)
    } else if (step === 6 && !config?.isDemoMode) {
      setStep(4)
    } else {
      setStep((s) => s - 1)
    }
  }

  const checkExistingVaultConfig = async (selectedPath: string) => {
    const normalizedPath = normalizeVaultPath(selectedPath)
    try {
      // Persist obsidianVaultPath so native vault reads resolve against this selection.
      await saveConfig({ obsidianVaultPath: normalizedPath, inboxPath: vaultChildPath(normalizedPath, 'Inbox') })
      
      // Try reading database/user_profile.md
      const note = await sidecarApi.readObsidianNote('database/user_profile.md')
      if (note && note.content) {
        const { metadata } = parseFrontmatter(note.content)
        if (metadata && metadata.displayName && metadata.programName) {
          setVaultPath(normalizedPath) // Crucial for auto-run path tracking
          setDetectedProfile(metadata)
          setShowDetectedModal(true)
          return true
        }
      }
    } catch (err) {
      console.warn('[Onboarding] No existing vault profile found at path:', selectedPath, err)
    }
    return false
  }

  const handleAcceptDetectedConfig = async () => {
    if (!detectedProfile) return
    setFinalStatus('running')
    setFinalError('')
    setShowDetectedModal(false)

    try {
      // Auto-populate states in case they return/modify later
      setName(detectedProfile.displayName || '')
      setProgramName(detectedProfile.programName || '')
      setProgramLevel(detectedProfile.programLevel || 'Undergraduate')
      setProgramDuration(Number(detectedProfile.programDuration) || 4)
      setProgramCurrentYear(Number(detectedProfile.programCurrentYear) || 1)
      setWorkDuration(Number(detectedProfile.pomodoroWorkDuration) || 25)
      setShortBreak(Number(detectedProfile.pomodoroShortBreakDuration) || 5)
      setLongBreak(Number(detectedProfile.pomodoroLongBreakDuration) || 15)
      setSessionsBeforeLong(Number(detectedProfile.pomodoroSessionsBeforeLongBreak) || 4)

      // Save everything directly to Tauri config
      await saveConfig({
        obsidianVaultPath: vaultPath,
        inboxPath: vaultChildPath(vaultPath, 'Inbox'),
        pomodoroWorkDuration: Number(detectedProfile.pomodoroWorkDuration) || 25,
        pomodoroShortBreakDuration: Number(detectedProfile.pomodoroShortBreakDuration) || 5,
        pomodoroLongBreakDuration: Number(detectedProfile.pomodoroLongBreakDuration) || 15,
        pomodoroSessionsBeforeLongBreak: Number(detectedProfile.pomodoroSessionsBeforeLongBreak) || 4,
        displayName: detectedProfile.displayName || '',
        academicFolderPath: 'Notes',
        autoDeploy: true,
        isProgramConfigured: true,
        isDemoMode: false // Existing vault means bypass tour!
      })

      // Synchronize database
      try {
        await sidecarApi.initializeVault()
      } catch (vaultErr: any) {
        console.warn('[Onboarding] initializeVault failed:', vaultErr)
        throw new Error(vaultErr?.message || 'Ater cannot scaffold the selected vault folder.')
      }
      await sidecarApi.academicsSyncProfile()

      // Update Supabase profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ is_configured: true }).eq('id', user.id)
      }

      setFinalStatus('done')
    } catch (err: any) {
      setFinalError(err?.message || 'Failed to fast-track configuration.')
      setFinalStatus('error')
    }
  }

  const handleReviewDetectedConfig = () => {
    if (!detectedProfile) return
    setName(detectedProfile.displayName || '')
    setProgramName(detectedProfile.programName || '')
    setProgramLevel(detectedProfile.programLevel || 'Undergraduate')
    setProgramDuration(Number(detectedProfile.programDuration) || 4)
    setProgramCurrentYear(Number(detectedProfile.programCurrentYear) || 1)
    setWorkDuration(Number(detectedProfile.pomodoroWorkDuration) || 25)
    setShortBreak(Number(detectedProfile.pomodoroShortBreakDuration) || 5)
    setLongBreak(Number(detectedProfile.pomodoroLongBreakDuration) || 15)
    setSessionsBeforeLong(Number(detectedProfile.pomodoroSessionsBeforeLongBreak) || 4)
    
    setShowDetectedModal(false)
    handleNext() // Advance to Step 3 (API Keys)
  }

  const selectVault = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Select your Obsidian vault folder' })
      if (selected) {
        const pathStr = normalizeVaultPath(selected as string)
        
        // Smarter verification: check write permissions on selected vault path first
        try {
          await saveConfig({ obsidianVaultPath: pathStr, inboxPath: vaultChildPath(pathStr, 'Inbox') })
          
          // Ensure the probe parent exists for newly selected empty vaults.
          await sidecarApi.createObsidianFolder('database')
          const testFilePath = 'database/.write_test'
          await sidecarApi.createObsidianFile(testFilePath, 'permission_check', true)
          await sidecarApi.deleteObsidianItem(testFilePath)
          
          setVaultPath(pathStr)
          await checkExistingVaultConfig(pathStr)
          toast.success("Vault selected successfully!")
        } catch (writeErr: any) {
          console.warn('[Onboarding] Path permission check failed:', writeErr)
          setVaultPath('')
          await saveConfig({ obsidianVaultPath: '', inboxPath: '' })
          const message = typeof writeErr === 'string' ? writeErr : writeErr?.message
          toast.error(message || "Ater cannot write to that folder. Choose a user-writable vault location.")
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const testConnection = async () => {
    if (!activeKey) return
    setTestStatus('testing')
    setTestMessage('')

    try {
      const res = await sidecarApi.testAiConnection('primary', {
        aiProvider: activeProvider,
        aiApiKey: activeKey,
        aiModel: activeModel,
        aiBaseUrl: activeBaseUrl || undefined,
        aiMaxTpm: parseOptionalNumber(activeLimits.maxTpm),
        aiMaxRpm: parseOptionalNumber(activeLimits.maxRpm),
        aiMaxTpd: parseOptionalNumber(activeLimits.maxTpd),
        aiMaxRpd: parseOptionalNumber(activeLimits.maxRpd),
        aiMaxConcurrency: parseOptionalNumber(activeLimits.maxConcurrency)
      })
      if (res.success) {
        await saveConfig({
          aiApiKey: activeKey,
          aiProvider: activeProvider,
          aiModel: activeModel,
          aiBaseUrl: activeBaseUrl,
          aiMaxTpm: parseOptionalNumber(activeLimits.maxTpm),
          aiMaxRpm: parseOptionalNumber(activeLimits.maxRpm),
          aiMaxTpd: parseOptionalNumber(activeLimits.maxTpd),
          aiMaxRpd: parseOptionalNumber(activeLimits.maxRpd),
          aiMaxConcurrency: parseOptionalNumber(activeLimits.maxConcurrency),
          savedApiKeys: savedKeys,
        })
        setTestStatus('success')
        setTestMessage('Connected successfully')
      } else {
        setTestStatus('error')
        setTestMessage(res.error || 'Connection failed. Check your key.')
      }
    } catch (err: any) {
      setTestStatus('error')
      setTestMessage(err.message || 'Could not reach the provider.')
    }
  }

  const handleAddNewKey = () => {
    if (!newKeyName || !newKeyValue) return
    let cleanedModel = cleanModel(newKeyModel, newKeyValue)
    if (!cleanedModel) {
      if (newKeyProvider === 'google') cleanedModel = 'gemini-2.0-flash'
      else if (newKeyProvider === 'openai') cleanedModel = 'gpt-4o'
      else if (newKeyProvider === 'anthropic') cleanedModel = 'claude-3-5-sonnet-latest'
      else if (newKeyProvider === 'groq') cleanedModel = 'llama-3.3-70b-versatile'
      else if (newKeyProvider === 'openrouter') cleanedModel = 'google/gemini-2.0-flash-001'
    }

    const newKey: SavedApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      provider: newKeyProvider,
      key: newKeyValue,
      model: cleanedModel || undefined,
      baseUrl: newKeyProvider === 'custom' ? newKeyBaseUrl : undefined,
      maxTpm: parseOptionalNumber(newKeyLimits.maxTpm),
      maxRpm: parseOptionalNumber(newKeyLimits.maxRpm),
      maxTpd: parseOptionalNumber(newKeyLimits.maxTpd),
      maxRpd: parseOptionalNumber(newKeyLimits.maxRpd),
      maxConcurrency: parseOptionalNumber(newKeyLimits.maxConcurrency)
    }
    const updated = [...savedKeys, newKey]
    setSavedKeys(updated)

    // Automatically select the newly added key as the active key
    setActiveKey(newKey.key)
    setActiveProvider(newKey.provider)
    setActiveModel(newKey.model || (newKey.provider === 'google' ? 'gemini-2.0-flash' : ''))
    setActiveBaseUrl(newKey.baseUrl || '')
    setActiveLimits({
      maxTpm: newKeyLimits.maxTpm,
      maxRpm: newKeyLimits.maxRpm,
      maxTpd: newKeyLimits.maxTpd,
      maxRpd: newKeyLimits.maxRpd,
      maxConcurrency: newKeyLimits.maxConcurrency
    })

    // Reset add key inputs
    setNewKeyName('')
    setNewKeyValue('')
    setNewKeyModel('')
    setNewKeyBaseUrl('')
    setNewKeyLimits({ maxTpm: '', maxRpm: '', maxTpd: '', maxRpd: '', maxConcurrency: '' })
    setIsAddingKey(false)
    setTestStatus('idle')
    setTestMessage('')
  }

  const deleteApiKey = (id: string) => {
    const updated = savedKeys.filter(k => k.id !== id)
    setSavedKeys(updated)
    if (activeKey && !updated.some(k => k.key === activeKey)) {
      setActiveKey('')
      setTestStatus('idle')
      setTestMessage('')
    }
  }

  const finalizeSetup = async () => {
    setFinalStatus('running')
    setFinalError('')

    const timeoutId = setTimeout(() => {
      setFinalStatus('error')
      setFinalError('Setup timed out. The AI engine is still unpacking. Please try again in a moment.')
    }, 120_000)

    try {
      // 0. Save config options
      await saveConfig({
        obsidianVaultPath: vaultPath,
        inboxPath: vaultChildPath(vaultPath, 'Inbox'),
        aiApiKey: activeKey,
        aiProvider: activeProvider,
        aiModel: activeModel,
        aiBaseUrl: activeBaseUrl,
        aiMaxTpm: parseOptionalNumber(activeLimits.maxTpm),
        aiMaxRpm: parseOptionalNumber(activeLimits.maxRpm),
        aiMaxTpd: parseOptionalNumber(activeLimits.maxTpd),
        aiMaxRpd: parseOptionalNumber(activeLimits.maxRpd),
        aiMaxConcurrency: parseOptionalNumber(activeLimits.maxConcurrency),
        savedApiKeys: savedKeys,
        pomodoroWorkDuration: workDuration,
        pomodoroShortBreakDuration: shortBreak,
        pomodoroLongBreakDuration: longBreak,
        pomodoroSessionsBeforeLongBreak: sessionsBeforeLong,
        displayName: name,
        academicFolderPath: 'Notes',
        autoDeploy: true,
        isProgramConfigured: true,
        isDemoMode: startWithTour
      })

      // 1. Initialize folders
      try {
        await sidecarApi.initializeVault()
      } catch (vaultErr: any) {
        console.warn('[Onboarding] initializeVault failed:', vaultErr?.message)
        throw new Error(vaultErr?.message || 'Ater cannot scaffold the selected vault folder.')
      }

      // 2. Sync academic profile to prepare databases
      await sidecarApi.academicsSyncProfile()

      // 3. Scaffold Academic Program years into vault
      if (programName) {
        let existingYears: any[] = []
        try {
          const dash = await sidecarApi.academicsDashboard()
          if (dash && dash.years) {
            existingYears = dash.years
          }
        } catch (dashErr) {
          console.warn('[Onboarding] Failed to query existing dashboard data:', dashErr)
        }

        const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
        const cleanName = programName.replace(/_/g, ' ').trim()
        const currentIdx = programCurrentYear - 1
        
        for (let i = 0; i < programDuration; i++) {
          const title = `Year ${romans[i] || (i + 1)}`
          const status = i < currentIdx ? '[[Completed]]' : i === currentIdx ? '[[Active]]' : '[[Planned]]'
          const isCurrent = i === currentIdx
          
          const yearExists = existingYears.some((y: any) => y.id === title || y.title === title)
          if (yearExists) {
            console.info(`[Onboarding] Year ${title} already exists. Updating existing configuration.`)
            try {
              await sidecarApi.updateVaultRow('years', title, {
                Status: status,
                'Academic Level': `[[${programLevel}]]`,
                'Current Year': isCurrent,
                Program: `[[${cleanName}]]`
              })
            } catch (updateErr) {
              console.warn(`[Onboarding] Failed to update existing year ${title}:`, updateErr)
            }
          } else {
            await sidecarApi.createVaultRow('years', title, {
              Status: status,
              'Academic Level': `[[${programLevel}]]`,
              'Current Year': isCurrent,
              Program: `[[${cleanName}]]`
            })
          }
        }

        // Preset Scaffolding of Semesters and Courses
        if (programPreset && programPreset !== 'custom') {
          try {
            if (programPreset === 'cs') {
              await Promise.all([
                // Scaffold semesters
                sidecarApi.createVaultRow('semesters', 'Semester I', { Year: '[[Year I]]', Status: '[[Completed]]', Season: '[[Fall]]' }),
                sidecarApi.createVaultRow('semesters', 'Semester II', { Year: '[[Year I]]', Status: '[[Completed]]', Season: '[[Spring]]' }),
                sidecarApi.createVaultRow('semesters', 'Semester III', { Year: '[[Year II]]', Status: '[[Active]]', Season: '[[Fall]]' }),
                sidecarApi.createVaultRow('semesters', 'Semester IV', { Year: '[[Year II]]', Status: '[[Planned]]', Season: '[[Spring]]' }),
                sidecarApi.createVaultRow('semesters', 'Semester V', { Year: '[[Year III]]', Status: '[[Planned]]', Season: '[[Fall]]' }),

                // Scaffold courses
                sidecarApi.createVaultRow('courses', 'CS 101', { Semester: '[[Semester I]]', Credits: 4, Grade: '[[A]]', Status: '[[Completed]]', Professor: '[[Dr. Turing]]', Difficulty: '[[Introductory]]' }),
                sidecarApi.createVaultRow('courses', 'MATH 151', { Semester: '[[Semester I]]', Credits: 4, Grade: '[[A-]]', Status: '[[Completed]]', Professor: '[[Dr. Euler]]', Difficulty: '[[Medium]]' }),
                sidecarApi.createVaultRow('courses', 'MATH 201', { Semester: '[[Semester II]]', Credits: 4, Grade: '[[B+]]', Status: '[[Completed]]', Professor: '[[Dr. Gauss]]', Difficulty: '[[Hard]]' }),
                sidecarApi.createVaultRow('courses', 'CS 201', { Semester: '[[Semester III]]', Credits: 4, Grade: '[[Active]]', Status: '[[Active]]', Professor: '[[Dr. Knuth]]', Difficulty: '[[Hard]]' }),
                sidecarApi.createVaultRow('courses', 'CS 301', { Semester: '[[Semester V]]', Credits: 4, Grade: '[[Planned]]', Status: '[[Planned]]', Professor: '[[Dr. Ritchie]]', Difficulty: '[[Expert]]' }),
              ]);
            } else if (programPreset === 'ds') {
              await Promise.all([
                sidecarApi.createVaultRow('semesters', 'Semester I', { Year: '[[Year I]]', Status: '[[Completed]]', Season: '[[Fall]]' }),
                sidecarApi.createVaultRow('semesters', 'Semester II', { Year: '[[Year I]]', Status: '[[Active]]', Season: '[[Spring]]' }),

                sidecarApi.createVaultRow('courses', 'DS 101', { Semester: '[[Semester I]]', Credits: 4, Grade: '[[A]]', Status: '[[Completed]]', Professor: '[[Dr. Bayes]]', Difficulty: '[[Introductory]]' }),
                sidecarApi.createVaultRow('courses', 'MATH 201', { Semester: '[[Semester I]]', Credits: 4, Grade: '[[A-]]', Status: '[[Completed]]', Professor: '[[Dr. Gauss]]', Difficulty: '[[Hard]]' }),
                sidecarApi.createVaultRow('courses', 'DS 201', { Semester: '[[Semester II]]', Credits: 4, Grade: '[[Active]]', Status: '[[Active]]', Professor: '[[Dr. Fisher]]', Difficulty: '[[Hard]]' }),
              ]);
            } else if (programPreset === 'business') {
              await Promise.all([
                sidecarApi.createVaultRow('semesters', 'Semester I', { Year: '[[Year I]]', Status: '[[Completed]]', Season: '[[Fall]]' }),
                sidecarApi.createVaultRow('semesters', 'Semester II', { Year: '[[Year I]]', Status: '[[Active]]', Season: '[[Spring]]' }),

                sidecarApi.createVaultRow('courses', 'BUS 101', { Semester: '[[Semester I]]', Credits: 3, Grade: '[[A]]', Status: '[[Completed]]', Professor: '[[Dr. Drucker]]', Difficulty: '[[Introductory]]' }),
                sidecarApi.createVaultRow('courses', 'ECON 201', { Semester: '[[Semester II]]', Credits: 3, Grade: '[[Active]]', Status: '[[Active]]', Professor: '[[Dr. Smith]]', Difficulty: '[[Medium]]' }),
              ]);
            }
          } catch (presetErr) {
            console.warn('[Onboarding] Preset course scaffolding failed:', presetErr);
          }
        }
      }

      // 4. Save profile metadata inside the Obsidian vault
      try {
        const metadata = {
          displayName: name,
          programName,
          programLevel,
          programDuration,
          programCurrentYear,
          pomodoroWorkDuration: workDuration,
          pomodoroShortBreakDuration: shortBreak,
          pomodoroLongBreakDuration: longBreak,
          pomodoroSessionsBeforeLongBreak: sessionsBeforeLong,
          isConfigured: true
        }
        const configContent = serializeFrontmatter(metadata) + "\n# Ater Vault Profile\nThis file persists your academic roadmap and dashboard configuration."
        await sidecarApi.createObsidianFile('database/user_profile.md', configContent, true)
      } catch (profileErr: any) {
        console.warn('[Onboarding] Failed to write database/user_profile.md config:', profileErr?.message)
      }

      // 5. Update Supabase profile to mark as configured
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ is_configured: true }).eq('id', user.id)
      }

      clearTimeout(timeoutId)
      setFinalStatus('done')
    } catch (err: any) {
      clearTimeout(timeoutId)
      const msg = err?.message || 'Setup failed. Check your vault path and try again.'
      setFinalError(msg)
      setFinalStatus('error')
    }
  }

  return (
    <div className="h-screen w-full flex flex-col justify-center bg-background text-foreground selection:bg-foreground selection:text-background px-12 relative overflow-y-auto">
      {/* Existing Vault Detected Modal */}
      {showDetectedModal && detectedProfile && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fade-in pointer-events-auto">
          <div className="w-full max-w-md bg-bento-panel border border-primary/20 rounded-[12px] p-8 shadow-2xl flex flex-col items-start text-left">
            <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">
              Existing Vault Configuration Detected
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">
              Welcome back, {detectedProfile.displayName}
            </h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-6 font-sans">
              We found a complete academic setup in this vault. Launch directly to your dashboard or review the parameters.
            </p>

            <div className="w-full space-y-2.5 mb-8 p-4 bg-bento-item/30 border border-border rounded-[8px]">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground uppercase font-black tracking-widest">Program</span>
                <span className="text-foreground uppercase font-black tracking-widest">{detectedProfile.programName}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground uppercase font-black tracking-widest">Level / Year</span>
                <span className="text-foreground uppercase font-black tracking-widest">Year {detectedProfile.programCurrentYear} ({detectedProfile.programLevel})</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground uppercase font-black tracking-widest">Work Timer</span>
                <span className="text-foreground uppercase font-black tracking-widest">{detectedProfile.pomodoroWorkDuration}m Work / {detectedProfile.pomodoroShortBreakDuration}m Break</span>
              </div>
            </div>

            <div className="flex w-full gap-3">
              <button
                onClick={handleAcceptDetectedConfig}
                className="flex-1 py-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 rounded-[8px] transition-all cursor-pointer"
              >
                Fast-Track Launch
              </button>
              <button
                onClick={handleReviewDetectedConfig}
                className="px-5 py-3 border border-border bg-bento-item/30 text-muted-foreground hover:text-foreground hover:border-foreground/30 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all cursor-pointer"
              >
                Review & Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Entry Modal (Walkthrough Step 1.6) */}
      {!showDetectedModal && step === 1 && !config?.isDemoMode && !config?.walkthroughCompleted && config?.walkthroughMilestone === '1.6' && config?.walkthroughStatus !== 'skipped' && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fade-in pointer-events-auto">
          <div className="w-full max-w-md bg-bento-panel border border-primary/20 rounded-[12px] p-8 shadow-2xl flex flex-col items-start text-left">
            <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">
              Interactive Tour
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">
              Learn the Ropes
            </h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-6 font-sans">
              Would you like to take a guided walkthrough of the workspace using simulation data? You can safely explore the UI without affecting your actual files.
            </p>

            <div className="flex w-full gap-3">
              <button
                data-tour="simulation-entry"
                onClick={async () => {
                  // isDemoMode=true lets the route guard skip to the main workspace.
                  // The InteractiveTour click-capture picks up data-tour="simulation-entry"
                  // and fires the simulation_started trigger automatically.
                  await saveConfig({ isDemoMode: true });
                  navigate('/obsidian');
                }}
                className="flex-1 py-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 rounded-[8px] transition-all cursor-pointer"
              >
                Start Guided Tour
              </button>
              <button
                onClick={async () => {
                  // Save a non-'1.6' milestone so the modal doesn't re-appear.
                  await saveConfig({ walkthroughMilestone: 'skip', walkthroughStatus: 'skipped' } as any);
                }}
                className="px-5 py-3 border border-border bg-bento-item/30 text-muted-foreground hover:text-foreground hover:border-foreground/30 text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all cursor-pointer"
              >
                Configure Manually
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-12 right-12 z-10">
        <ThemeSwitch />
      </div>
      <div className="w-full max-w-lg mx-auto bg-bento-panel border border-border rounded-[12px] p-8 shadow-2xl my-8">

        {/* Step indicator */}
        {finalStatus === 'idle' || finalStatus === 'error' ? (() => {
          const visibleSteps = config?.isDemoMode
            ? [1, 2, 3, 4, 5, 6]
            : (config?.displayName ? [2, 4, 6] : [1, 2, 4, 6]);
          const currentDisplayStep = visibleSteps.indexOf(step) + 1;
          const totalDisplaySteps = visibleSteps.length;
          if (currentDisplayStep === 0) return null;
          return (
            <div className="flex items-center gap-3 mb-10 flex-wrap">
              {visibleSteps.map((s, idx) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      step === s
                        ? "bg-foreground"
                        : step > s
                        ? "bg-muted-foreground/60"
                        : "bg-border"
                    )}
                  />
                  {idx < totalDisplaySteps - 1 && <div className="w-6 h-px bg-border" />}
                </div>
              ))}
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-2">
                Step {currentDisplayStep} of {totalDisplaySteps}
              </span>
            </div>
          );
        })() : null}

        {/* Running state */}
        {finalStatus === 'running' && (
          <div className="w-full">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
              Initializing
            </div>
            <div className="h-1.5 w-full bg-bento-item rounded-[4px] mb-3 overflow-hidden">
              <div className="h-full bg-foreground w-1/2 rounded-[4px] animate-pulse" />
            </div>
            <p className="text-[11px] font-mono text-muted-foreground uppercase">
              Scaffolding academic roadmap...
            </p>
          </div>
        )}

        {/* Done state — Welcome Screen */}
        {finalStatus === 'done' && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">
              Ready to Launch
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-4">
              Welcome, {name.split(' ')[0] || 'User'}
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-10 max-w-md">
              Your intelligence dashboard is now synchronized with your vault, study timer, and academic program. Step into your high-fidelity pedagogical workspace.
            </p>
            <button
              onClick={() => navigate('/obsidian')}
              className="py-3 px-12 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.3em] border border-primary hover:opacity-90 shadow-2xl rounded-[8px] transition-all duration-150"
            >
              Enter Ater
            </button>
          </div>
        )}

        {/* Step 1 — Profile */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 1 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 1
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Define Your Profile
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              What should we call you? Your data remains private and local.
            </p>

            <div className="w-full mb-8">
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Name
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bento-item/30 border border-border focus:border-foreground px-3 py-2.5 text-[12px] font-bold outline-none text-foreground placeholder:text-muted-foreground/30 uppercase tracking-widest rounded-[8px] transition-colors"
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!name}
              className={cn(
                "py-2.5 px-8 text-[10px] font-black uppercase tracking-[0.2em] border rounded-[8px] transition-colors",
                name
                  ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                  : "bg-bento-item text-muted-foreground cursor-not-allowed border-border"
              )}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — Vault */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 2 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 2
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Select Your Vault
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              Point Ater to your local Obsidian vault folder. All notes are read locally — nothing leaves your machine.
            </p>

            <button
              onClick={selectVault}
              data-tour="select-vault-btn"
              className="w-full bg-bento-item/30 border border-border hover:border-foreground py-4 px-4 mb-8 text-left rounded-[8px] transition-colors"
            >
              <span className="text-[11px] font-black uppercase tracking-widest text-foreground block">
                {vaultPath ? 'Vault Selected' : 'Choose Folder'}
              </span>
              {vaultPath ? (
                <span className="text-[10px] font-mono text-muted-foreground truncate block mt-1.5">
                  {vaultPath}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground block mt-1.5">
                  Click to open your file browser
                </span>
              )}
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-bento-item/30"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!vaultPath}
                className={cn(
                  "py-2.5 px-8 text-[10px] font-black uppercase tracking-[0.2em] border rounded-[8px] transition-colors",
                  vaultPath
                    ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                    : "bg-bento-item text-muted-foreground cursor-not-allowed border-border"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — AI Provider & API Keys */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 3 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 3
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Connect AI Provider & Keys
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-6">
              Add API keys to connect Ater to your AI models. They are stored locally on your device.
            </p>

            {/* List of Saved Keys */}
            <div className="w-full mb-6 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                Saved API Keys:
              </label>
              
              {savedKeys.length === 0 && (
                <p className="text-[11px] text-muted-foreground font-sans italic">No API keys added yet. Add one below to get started.</p>
              )}

              <div className="grid grid-cols-1 gap-2.5">
                {savedKeys.map((k) => {
                  const isSelected = activeKey === k.key
                  return (
                    <div 
                      key={k.id} 
                      onClick={() => {
                        setActiveKey(k.key)
                        setActiveProvider(k.provider)
                        setActiveModel(k.model || (k.provider === 'google' ? 'gemini-2.0-flash' : ''))
                        setActiveBaseUrl(k.baseUrl || '')
                        setTestStatus('idle')
                        setTestMessage('')
                      }}
                      className={cn(
                        "flex items-center justify-between p-3.5 border rounded-[8px] cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-muted/55 border-primary" 
                          : "bg-muted/20 border-border hover:bg-muted/30"
                      )}
                    >
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-foreground uppercase">{k.name}</span>
                          <span className="text-[8px] px-1 bg-muted text-muted-foreground border border-border rounded uppercase">{k.provider}</span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">••••••••{k.key.slice(-4)}</div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteApiKey(k.id)
                        }}
                        className="text-[9px] font-black uppercase text-muted-foreground hover:text-foreground hover:underline px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Add New Key Form / Trigger */}
            <div className="w-full mb-8">
              {isAddingKey ? (
                <div className="p-5 border border-border bg-bento-item/30 rounded-[8px] space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Add New API Key</div>
                  
                  <input 
                    placeholder="Name (e.g. My Gemini Key)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] font-bold uppercase focus:outline-none focus:border-primary rounded-[8px]"
                  />

                  <select
                    value={newKeyProvider}
                    onChange={(e) => {
                      const provider = e.target.value
                      setNewKeyProvider(provider)
                      if (provider === 'google') setNewKeyModel('gemini-2.0-flash')
                      else if (provider === 'openai') setNewKeyModel('gpt-4o')
                      else if (provider === 'anthropic') setNewKeyModel('claude-3-5-sonnet-latest')
                      else if (provider === 'groq') setNewKeyModel('llama-3.3-70b-versatile')
                      else if (provider === 'openrouter') setNewKeyModel('google/gemini-2.0-flash-001')
                      else setNewKeyModel('')
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
                    onChange={(e) => setNewKeyModel(e.target.value)}
                    className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                  />

                  {newKeyProvider === 'custom' && (
                    <input
                      placeholder="Base URL (Advanced)"
                      value={newKeyBaseUrl}
                      onChange={(e) => setNewKeyBaseUrl(e.target.value)}
                      className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                    />
                  )}

                  <input type="text" name="username" style={{ display: 'none' }} autoComplete="username" />
                  <input 
                    type="password"
                    autoComplete="new-password"
                    placeholder="API Key"
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
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
                          <input placeholder="TPM limit" value={newKeyLimits.maxTpm} onChange={(e) => setNewKeyLimits({...newKeyLimits, maxTpm: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                          <input placeholder="RPM limit" value={newKeyLimits.maxRpm} onChange={(e) => setNewKeyLimits({...newKeyLimits, maxRpm: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                          <input placeholder="TPD limit" value={newKeyLimits.maxTpd} onChange={(e) => setNewKeyLimits({...newKeyLimits, maxTpd: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                          <input placeholder="RPD limit" value={newKeyLimits.maxRpd} onChange={(e) => setNewKeyLimits({...newKeyLimits, maxRpd: e.target.value})} className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]" />
                        </div>
                        <input
                          placeholder="Max simultaneous requests"
                          value={newKeyLimits.maxConcurrency}
                          onChange={(e) => setNewKeyLimits({...newKeyLimits, maxConcurrency: e.target.value})}
                          className="w-full bg-bento-item/30 border border-border px-3 py-2 text-[11px] focus:outline-none font-mono focus:border-primary rounded-[8px]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button data-tour="save-key-btn" onClick={handleAddNewKey} className="flex-1 h-9 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 rounded-[8px] transition-all">Save Key</button>
                    <button onClick={() => setIsAddingKey(false)} className="h-9 px-4 bg-muted/20 text-muted-foreground border border-border/40 text-[10px] font-black uppercase hover:text-foreground hover:bg-muted/30 rounded-[8px] transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingKey(true)}
                  className="w-full py-4 border border-dashed border-border hover:border-primary hover:bg-bento-item/40 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                >
                  Add API Key
                </button>
              )}
            </div>

            {/* Test Connection for Active Key */}
            {activeKey && (
              <div data-tour="ai-connection-status" className="w-full p-4 border border-border bg-bento-item/10 rounded-[8px] mb-8 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active Key Selected</span>
                    <p className="text-[11px] font-bold text-foreground uppercase">{activeProvider} model: {activeModel || 'Default'}</p>
                  </div>

                  <button
                    onClick={testConnection}
                    disabled={testStatus === 'testing'}
                    className="text-[9px] bg-primary text-primary-foreground font-black uppercase tracking-widest hover:bg-primary/90 px-4 py-2 rounded-[6px] transition-colors disabled:opacity-40"
                  >
                    {testStatus === 'testing' ? 'Testing...' : 'Check if Key Works'}
                  </button>
                </div>

                {testMessage && (
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-2 px-3 py-2 border rounded-[6px] border-primary text-foreground",
                    testStatus === 'success' ? 'border-primary' : 'border-destructive'
                  )}>
                    {testMessage}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-bento-item/30"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className={cn(
                  "py-2.5 px-8 text-[10px] font-black uppercase tracking-[0.2em] border rounded-[8px] transition-colors",
                  activeKey
                    ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                    : "bg-bento-item text-foreground border-border hover:bg-bento-item/80"
                )}
              >
                {activeKey ? 'Continue' : 'Skip'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Academic Program */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 4 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 4
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Your Academic Program
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              Define your course of study to scaffold your local knowledge roadmap.
            </p>

            <div className="w-full space-y-6 mb-8 text-left">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Program Presets
                </div>
                <select 
                  value={programPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-bento-item/30 border border-border focus:border-foreground px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer rounded-[8px] transition-colors mb-4"
                >
                  <option value="custom" className="bg-bento-panel">Custom (Empty Setup)</option>
                  <option value="cs" className="bg-bento-panel">Computer Science B.S. (Standard CS Courses Scaffolding)</option>
                  <option value="ds" className="bg-bento-panel">Data Science B.S. (Standard Statistics & ML Scaffolding)</option>
                  <option value="business" className="bg-bento-panel">Business Administration (Finance & Econ Scaffolding)</option>
                </select>
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Program Name
                </div>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={programName}
                  onChange={(e) => {
                    setProgramName(e.target.value);
                    if (programPreset !== 'custom') setProgramPreset('custom');
                  }}
                  className="w-full bg-bento-item/30 border border-border focus:border-foreground px-3 py-2.5 text-[12px] font-bold outline-none text-foreground uppercase tracking-widest rounded-[8px] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Level
                  </div>
                  <select 
                    value={programLevel}
                    onChange={(e) => setProgramLevel(e.target.value)}
                    className="w-full bg-bento-item/30 border border-border focus:border-foreground px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer rounded-[8px] transition-colors"
                  >
                    {['Undergraduate', 'Graduate', 'Doctorate', 'Professional'].map(lvl => (
                      <option key={lvl} value={lvl} className="bg-bento-panel">{lvl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Duration (Years)
                  </div>
                  <select 
                    value={programDuration}
                    onChange={(e) => setProgramDuration(Number(e.target.value))}
                    className="w-full bg-bento-item/30 border border-border focus:border-foreground px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer rounded-[8px] transition-colors"
                  >
                    {[1,2,3,4,5,6,7,8].map(y => (
                      <option key={y} value={y} className="bg-bento-panel">{y} Year{y > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Current Year
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({length: programDuration}).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setProgramCurrentYear(i + 1)}
                      className={cn(
                        "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-colors rounded-[8px]",
                        programCurrentYear === i + 1
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-bento-item/30 text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                      )}
                    >
                      Year {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-bento-item/30"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!programName}
                className={cn(
                  "py-2.5 px-8 text-[10px] font-black uppercase tracking-[0.2em] border rounded-[8px] transition-colors",
                  programName
                    ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                    : "bg-bento-item text-muted-foreground cursor-not-allowed border-border"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Focus Timer */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 5 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 5
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Configure Focus Timer
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              Set how long you want your work and break sessions to be.
            </p>

            <div className="w-full grid grid-cols-2 gap-6 mb-8 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground block">Work duration (mins)</label>
                <input 
                  type="number" 
                  value={workDuration}
                  onChange={(e) => setWorkDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground block">Short break (mins)</label>
                <input 
                  type="number" 
                  value={shortBreak}
                  onChange={(e) => setShortBreak(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground block">Long break (mins)</label>
                <input 
                  type="number" 
                  value={longBreak}
                  onChange={(e) => setLongBreak(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground block text-xs truncate">Sessions before long break</label>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  value={sessionsBeforeLong}
                  onChange={(e) => setSessionsBeforeLong(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-bento-item/30 border border-border text-[13px] font-mono focus:outline-none focus:border-primary rounded-[8px]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-bento-item/30"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="py-2.5 px-8 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] border border-primary hover:opacity-90 rounded-[8px] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 6 — Confirm Setup */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 6 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 6
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Confirm Setup
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              Review your configuration before generating your vault roadmap.
            </p>

            <div className="w-full space-y-3 mb-8 p-5 bg-bento-item/30 border border-border rounded-[8px]">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vault</span>
                <span className="text-[10px] font-mono text-foreground max-w-[220px] text-right break-all">
                  {vaultPath}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">AI Provider</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  {activeKey ? `${activeProvider} (${savedKeys.length} Saved Keys)` : 'Disabled'}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Study Timer</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  {workDuration}m / {shortBreak}m / {longBreak}m
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Program</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate max-w-[150px]">{programName}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Current Level</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Year {programCurrentYear} / {programDuration}</span>
              </div>
            </div>

            <div data-tour="demo-mode-checkbox" className="flex items-center gap-3 mb-6 select-none cursor-pointer animate-fade-in" onClick={() => setStartWithTour(!startWithTour)}>
              <input
                type="checkbox"
                checked={startWithTour}
                onChange={() => {}}
                className="rounded border-border bg-bento-item/30 text-primary focus:ring-primary size-4"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                Start with Guided Walkthrough Tour (No AI Keys required)
              </span>
            </div>

            {finalError && (
              <div className="w-full px-4 py-3 border border-destructive/30 bg-destructive/10 mb-6 rounded-[8px]">
                <p className="text-[11px] font-bold text-destructive">{finalError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-bento-item/30"
              >
                Back
              </button>
              <button
                onClick={finalizeSetup}
                className="py-2.5 px-8 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] border border-primary hover:opacity-90 rounded-[8px] transition-colors"
              >
                Finalize
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
