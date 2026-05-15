import React, { useState } from 'react'
import { useConfig } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const { config, saveConfig } = useConfig()
  const { profile } = useAuth()
  const navigate = useNavigate()

  // Step 1: Vault State
  const [vaultPath, setVaultPath] = useState(config?.obsidianVaultPath || '')
  
  // Step 2: Intelligence State
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('google')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success?: boolean; message?: string} | null>(null)

  // Step 3: Activation State
  const [isInitializing, setIsInitializing] = useState(false)
  const [initProgress, setInitProgress] = useState(0)

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

  const selectVault = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Vault'
      })
      if (selected) setVaultPath(selected as string)
    } catch (err) {
      console.error(err)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    if (!apiKey) {
      setIsTesting(false)
      setTestResult({ success: false, message: 'No Key' })
      return
    }
    
    await saveConfig({ aiApiKey: apiKey, aiProvider: provider })
    
    try {
      const res = await sidecarApi.testAiConnection('primary')
      if (res.success) {
        setTestResult({ success: true, message: 'Connected' })
      } else {
        setTestResult({ success: false, message: 'Failed' })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Error' })
    } finally {
      setIsTesting(false)
    }
  }

  const finalizeSetup = async () => {
    setIsInitializing(true)
    
    const interval = setInterval(() => {
      setInitProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 5
      })
    }, 50)

    try {
      await saveConfig({
        obsidianVaultPath: vaultPath,
        aiApiKey: apiKey,
        aiProvider: provider,
        inboxPath: `${vaultPath}/Inbox`,
        academicFolderPath: 'Notes',
        autoDeploy: true
      })

      await sidecarApi.academicsSyncProfile()
      
      setTimeout(() => {
        navigate('/obsidian')
      }, 1000)
    } catch (err) {
      console.error(err)
      setIsInitializing(false)
    }
  }

  const renderStep1 = () => (
    <div className="flex flex-col items-start w-full">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Phase 01</h2>
      <h1 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">Vault Path</h1>
      <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-8 max-w-sm">
        Select your local Obsidian vault to begin.
      </p>
      
      <button 
        onClick={selectVault}
        className="w-full bg-card border border-border hover:border-primary py-4 px-4 mb-8 text-left"
      >
        <span className="text-[11px] font-black uppercase tracking-widest text-foreground block">
          {vaultPath ? 'Selected Directory' : 'Open Directory'}
        </span>
        {vaultPath && (
          <span className="text-[10px] font-mono text-muted-foreground truncate block mt-1">{vaultPath}</span>
        )}
      </button>

      <button 
        onClick={handleNext}
        disabled={!vaultPath}
        className={cn(
          "py-3 px-6 text-[10px] font-black uppercase tracking-widest border",
          vaultPath 
            ? "bg-primary text-primary-foreground border-primary hover:opacity-90" 
            : "bg-muted text-muted-foreground cursor-not-allowed border-border"
        )}
      >
        Continue
      </button>
    </div>
  )

  const renderStep2 = () => (
    <div className="flex flex-col items-start w-full">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Phase 02</h2>
      <h1 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">Provider Config</h1>
      <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-8 max-w-sm">
        Enter your API key. Stored locally.
      </p>

      <div className="w-full space-y-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {['google', 'openai', 'anthropic', 'groq'].map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border",
                provider === p 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <input 
            type="password"
            placeholder="Secret Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-card border border-border focus:border-primary rounded-none px-3 py-2 text-[12px] font-mono focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          
          <div className="flex items-center gap-4">
            <button 
              onClick={testConnection}
              disabled={isTesting || !apiKey}
              className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-transparent hover:border-border px-2 py-1"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                testResult.success ? "text-foreground" : "text-muted-foreground"
              )}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handleBack} 
          className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border hover:border-primary hover:text-foreground"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          disabled={!apiKey}
          className={cn(
            "py-3 px-6 text-[10px] font-black uppercase tracking-widest border",
            apiKey 
              ? "bg-primary text-primary-foreground border-primary hover:opacity-90" 
              : "bg-muted text-muted-foreground cursor-not-allowed border-border"
          )}
        >
          Finalize
        </button>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="flex flex-col items-start w-full">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Initialization</h2>
      <h1 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">Ready</h1>
      <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-8 max-w-sm">
        Welcome, {profile?.full_name?.split(' ')[0] || 'User'}. Application is ready.
      </p>

      <button 
        onClick={finalizeSetup}
        className="py-3 px-6 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest border border-primary hover:opacity-90"
      >
        Complete Setup
      </button>
    </div>
  )

  return (
    <div className="h-screen w-full flex flex-col justify-center bg-background text-foreground selection:bg-foreground selection:text-background p-12">
      <div className="w-full max-w-md mx-auto">
        {isInitializing ? (
          <div className="w-full">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Actuating</h2>
            <div className="h-px w-full bg-border mt-4 mb-2">
              <div 
                className="h-full bg-primary"
                style={{ width: `${initProgress}%` }}
              />
            </div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase">{Math.round(initProgress)}%</p>
          </div>
        ) : step === 1 ? (
          renderStep1()
        ) : step === 2 ? (
          renderStep2()
        ) : (
          renderSuccess()
        )}
      </div>
    </div>
  )
}
