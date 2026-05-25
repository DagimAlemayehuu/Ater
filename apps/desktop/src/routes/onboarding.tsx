import React, { useState } from 'react'
import { useConfig } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { ThemeSwitch } from '@/components/theme-switch'

type StepStatus = 'idle' | 'testing' | 'success' | 'error'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const { config, saveConfig } = useConfig()
  const navigate = useNavigate()

  // Step 1 — Profile
  const [name, setName] = useState(config?.displayName || '')

  // Step 2 — Vault
  const [vaultPath, setVaultPath] = useState(config?.obsidianVaultPath || '')

  // Step 3 — API Key
  const [apiKey, setApiKey] = useState(config?.aiApiKey || '')
  const [provider, setProvider] = useState<'google' | 'openai' | 'anthropic' | 'groq'>(config?.aiProvider as any || 'google')
  const [testStatus, setTestStatus] = useState<StepStatus>('idle')
  const [testMessage, setTestMessage] = useState('')

  // Step 4 — Academic Program
  const [programName, setProgramName] = useState('')
  const [programLevel, setProgramLevel] = useState('Undergraduate')
  const [programDuration, setProgramDuration] = useState(4)
  const [programCurrentYear, setProgramCurrentYear] = useState(1)

  // Step 5 — Finalize
  const [finalStatus, setFinalStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [finalError, setFinalError] = useState('')

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const selectVault = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Select your Obsidian vault folder' })
      if (selected) setVaultPath(selected as string)
    } catch (err) {
      console.error(err)
    }
  }

  const testConnection = async () => {
    if (!apiKey) return
    setTestStatus('testing')
    setTestMessage('')

    await saveConfig({ aiApiKey: apiKey, aiProvider: provider })

    try {
      const res = await sidecarApi.testAiConnection('primary')
      if (res.success) {
        setTestStatus('success')
        setTestMessage('Connected successfully')
      } else {
        setTestStatus('error')
        setTestMessage('Connection failed. Check your key.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Could not reach the provider.')
    }
  }

  const finalizeSetup = async () => {
    setFinalStatus('running')
    setFinalError('')

    // Guard against a hung sidecar — show a timeout error after 120 seconds
    const timeoutId = setTimeout(() => {
      setFinalStatus('error')
      setFinalError('Setup timed out. The AI engine is still unpacking. Please try again in a moment.')
    }, 120_000)

    try {
      // 0. Save the vault path first so all subsequent sidecar calls can find it
      await saveConfig({
        obsidianVaultPath: vaultPath,
        inboxPath: `${vaultPath}/Inbox`
      })

      // 1. Initialize folder structure (non-fatal if sidecar not ready — folders are local)
      try {
        await sidecarApi.initializeVault()
      } catch (vaultErr: any) {
        console.warn('[Onboarding] initializeVault failed (non-fatal):', vaultErr?.message)
      }

      // 2. Sync academic profile to prepare databases
      await sidecarApi.academicsSyncProfile()

      // 3. Scaffold Academic Program years into vault
      if (programName) {
        const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
        const cleanName = programName.replace(/_/g, ' ').trim()
        const currentIdx = programCurrentYear - 1
        
        for (let i = 0; i < programDuration; i++) {
          const title = `Year ${romans[i] || (i + 1)}`
          const status = i < currentIdx ? '[[Completed]]' : i === currentIdx ? '[[Active]]' : '[[Planned]]'
          const isCurrent = i === currentIdx
          
          await sidecarApi.createVaultRow('years', title, {
            Status: status,
            'Academic Level': `[[${programLevel}]]`,
            'Current Year': isCurrent,
            Program: `[[${cleanName}]]`
          })
        }
      }

      // 4. Update Supabase profile to mark as configured
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ is_configured: true }).eq('id', user.id)
      }

      // 5. Finalize all configuration in ONE atomic call (prevents race conditions)
      await saveConfig({
        obsidianVaultPath: vaultPath,
        aiApiKey: apiKey,
        aiProvider: provider,
        displayName: name,
        inboxPath: `${vaultPath}/Inbox`,
        academicFolderPath: 'Notes',
        autoDeploy: true,
        isProgramConfigured: true
      })

      clearTimeout(timeoutId)
      setFinalStatus('done')
    } catch (err: any) {
      clearTimeout(timeoutId)
      const msg = err?.message || 'Setup failed. Check your vault path and try again.'
      setFinalError(msg)
      setFinalStatus('error')
    }
  }

  const PROVIDERS = [
    { id: 'google', label: 'Google', hint: 'aistudio.google.com' },
    { id: 'openai', label: 'OpenAI', hint: 'platform.openai.com' },
    { id: 'anthropic', label: 'Anthropic', hint: 'console.anthropic.com' },
    { id: 'groq', label: 'Groq', hint: 'console.groq.com' },
  ] as const

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!

  return (
    <div className="h-screen w-full flex flex-col justify-center bg-[#0e0e0f] text-foreground selection:bg-foreground selection:text-background px-12 relative">
      <div className="absolute top-12 right-12 z-10">
        <ThemeSwitch />
      </div>
      <div className="w-full max-w-md mx-auto bg-[#151517] border border-[#242426] rounded-[12px] p-8 shadow-2xl">

        {/* Step indicator */}
        {finalStatus === 'idle' || finalStatus === 'error' ? (
          <div className="flex items-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-1.5 rounded-full",
                    step === s
                      ? "bg-foreground"
                      : step > s
                      ? "bg-muted-foreground/60"
                      : "bg-[#242426]"
                  )}
                />
                {s < 5 && <div className="w-8 h-px bg-[#242426]" />}
              </div>
            ))}
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-2">
              Step {step} of 5
            </span>
          </div>
        ) : null}

        {/* Running state */}
        {finalStatus === 'running' && (
          <div className="w-full">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
              Initializing
            </div>
            <div className="h-1.5 w-full bg-[#232326] rounded-[4px] mb-3 overflow-hidden">
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
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-10 max-w-[320px]">
              Your intelligence dashboard is now synchronized with your vault and academic program. Step into your high-fidelity pedagogical workspace.
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
                Display Name
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#232326]/30 border border-[#242426] focus:border-foreground px-3 py-2.5 text-[12px] font-bold outline-none text-foreground placeholder:text-muted-foreground/30 uppercase tracking-widest rounded-[8px] transition-colors"
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!name}
              className={cn(
                "py-2.5 px-8 text-[10px] font-black uppercase tracking-[0.2em] border rounded-[8px] transition-colors",
                name
                  ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                  : "bg-[#232326] text-muted-foreground cursor-not-allowed border-[#242426]"
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
              className="w-full bg-[#232326]/30 border border-[#242426] hover:border-foreground py-4 px-4 mb-8 text-left rounded-[8px] transition-colors"
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
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-[#242426] hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-[#232326]/30"
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
                    : "bg-[#232326] text-muted-foreground cursor-not-allowed border-[#242426]"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — API Key */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 3 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 3
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Connect AI
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              Ater uses your own API key — stored locally, never shared.
            </p>

            <div className="w-full space-y-5 mb-8">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Provider
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setProvider(p.id); setTestStatus('idle'); setTestMessage(''); }}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-[8px] transition-colors",
                        provider === p.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-[#232326]/30 text-muted-foreground border-[#242426] hover:border-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-medium text-muted-foreground mt-2">
                  Get your key at{' '}
                  <a
                    href={`https://${selectedProvider.hint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-2"
                  >
                    {selectedProvider.hint}
                  </a>
                </p>
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  API Key
                </div>
                <input
                  type="password"
                  placeholder="Paste your secret key"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); setTestMessage(''); }}
                  className="w-full bg-[#232326]/30 border border-[#242426] focus:border-foreground px-3 py-2.5 text-[12px] font-mono outline-none text-foreground placeholder:text-muted-foreground/30 rounded-[8px] transition-colors"
                />

                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={testConnection}
                    disabled={testStatus === 'testing' || !apiKey}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-transparent hover:border-[#242426] px-2.5 py-1 rounded-[6px] transition-colors disabled:opacity-40"
                  >
                    {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                  </button>

                  {testMessage && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      testStatus === 'success' ? "text-foreground" : "text-destructive"
                    )}>
                      {testMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-[#242426] hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-[#232326]/30"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className={cn(
                  "py-2.5 px-8 text-[10px] font-black uppercase tracking-[0.2em] border rounded-[8px] transition-colors",
                  apiKey
                    ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                    : "bg-[#232326] text-foreground border-[#242426] hover:bg-[#232326]/80"
                )}
              >
                {apiKey ? 'Continue' : 'Skip'}
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

            <div className="w-full space-y-6 mb-8">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Program Name
                </div>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full bg-[#232326]/30 border border-[#242426] focus:border-foreground px-3 py-2.5 text-[12px] font-bold outline-none text-foreground uppercase tracking-widest rounded-[8px] transition-colors"
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
                    className="w-full bg-[#232326]/30 border border-[#242426] focus:border-foreground px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer rounded-[8px] transition-colors"
                  >
                    {['Undergraduate', 'Graduate', 'Doctorate', 'Professional'].map(lvl => (
                      <option key={lvl} value={lvl} className="bg-[#151517]">{lvl}</option>
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
                    className="w-full bg-[#232326]/30 border border-[#242426] focus:border-foreground px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer rounded-[8px] transition-colors"
                  >
                    {[1,2,3,4,5,6,7,8].map(y => (
                      <option key={y} value={y} className="bg-[#151517]">{y} Year{y > 1 ? 's' : ''}</option>
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
                          ? "bg-foreground text-background border-foreground"
                          : "bg-[#232326]/30 text-muted-foreground border-[#242426] hover:border-foreground hover:text-foreground"
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
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-[#242426] hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-[#232326]/30"
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
                    : "bg-[#232326] text-muted-foreground cursor-not-allowed border-[#242426]"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Confirm */}
        {(finalStatus === 'idle' || finalStatus === 'error') && step === 5 && (
          <div className="flex flex-col items-start w-full">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Step 5
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
              Confirm Setup
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed mb-8">
              Review your configuration before generating your vault roadmap.
            </p>

            <div className="w-full space-y-3 mb-8 p-5 bg-[#232326]/30 border border-[#242426] rounded-[8px]">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vault</span>
                <span className="text-[10px] font-mono text-foreground max-w-[220px] text-right break-all">
                  {vaultPath}
                </span>
              </div>
              <div className="h-px bg-[#242426]" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">AI Intelligence</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{apiKey ? `${provider} (Active)` : 'Disabled'}</span>
              </div>
              <div className="h-px bg-[#242426]" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Program</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate max-w-[150px]">{programName}</span>
              </div>
              <div className="h-px bg-[#242426]" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Current Level</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Year {programCurrentYear} / {programDuration}</span>
              </div>
            </div>

            {finalError && (
              <div className="w-full px-4 py-3 border border-destructive/30 bg-destructive/10 mb-6 rounded-[8px]">
                <p className="text-[11px] font-bold text-destructive">{finalError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-[#242426] hover:border-foreground hover:text-foreground rounded-[8px] transition-colors bg-[#232326]/30"
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
