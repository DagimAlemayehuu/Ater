import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const { config, saveConfig, addApiKey } = useConfig()
  const navigate = useNavigate()

  // Step 1: Vault State
  const [vaultPath, setVaultPath] = useState(config?.obsidianVaultPath || '')
  
  // Step 2: Intelligence State
  const [selectedKeyId, setSelectedKeyId] = useState<string | 'new'>(
    config?.savedApiKeys?.[0]?.id || 'new'
  )
  const [newKeyName, setNewKeyName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('google')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success?: boolean; message?: string} | null>(null)

  // Step 3: Activation State
  const [isInitializing, setIsInitializing] = useState(false)

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
    
    let testKey = apiKey
    let testProvider = provider

    if (selectedKeyId !== 'new') {
      const saved = config?.savedApiKeys?.find(k => k.id === selectedKeyId)
      if (saved) {
        testKey = saved.key
        testProvider = saved.provider
      }
    }

    if (!testKey) {
      setIsTesting(false)
      setTestResult({ success: false, message: 'NO KEY' })
      return
    }
    
    // Temporarily save to test
    await saveConfig({ aiApiKey: testKey, aiProvider: testProvider })
    
    try {
      const res = await sidecarApi.testAiConnection('primary')
      if (res.success) {
        setTestResult({ success: true, message: 'CONNECTED' })
      } else {
        setTestResult({ success: false, message: 'FAILED' })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'ERROR' })
    } finally {
      setIsTesting(false)
    }
  }

  const finalizeSetup = async () => {
    setIsInitializing(true)
    try {
      let finalKey = apiKey
      let finalProvider = provider

      if (selectedKeyId !== 'new') {
        const saved = config?.savedApiKeys?.find(k => k.id === selectedKeyId)
        if (saved) {
          finalKey = saved.key
          finalProvider = saved.provider
        }
      } else if (apiKey) {
        // Add new key if provided
        addApiKey({
          id: crypto.randomUUID(),
          name: newKeyName || `${finalProvider.toUpperCase()} Carrier`,
          key: apiKey,
          provider: finalProvider as any
        })
      }

      await saveConfig({
        obsidianVaultPath: vaultPath,
        aiApiKey: finalKey,
        aiProvider: finalProvider,
        inboxPath: `${vaultPath}/Inbox`,
        academicFolderPath: 'Notes',
        autoDeploy: true
      })

      await sidecarApi.academicsSyncProfile()
      navigate('/obsidian')
    } catch (err) {
      console.error(err)
    } finally {
      setIsInitializing(false)
    }
  }

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center max-w-[280px] w-full"
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-12">Foundation</h2>
      
      <div className="w-full space-y-4 mb-12 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
          Select your local vault folder.
        </p>

        <button 
          onClick={selectVault}
          className="w-full p-4 rounded bg-muted/5 border border-border hover:bg-muted/10 transition-all flex flex-col items-center gap-1"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-foreground">
            {vaultPath ? vaultPath.split('/').pop() : 'Select Folder'}
          </span>
          {vaultPath && <span className="text-[7px] font-mono text-muted-foreground truncate max-w-full opacity-40">{vaultPath}</span>}
        </button>
      </div>

      <button 
        onClick={handleNext}
        disabled={!vaultPath}
        className={cn(
          "w-full py-3 rounded border text-[9px] font-black uppercase tracking-[0.3em] transition-all",
          vaultPath 
            ? "bg-muted/5 border-border text-foreground hover:bg-muted/10" 
            : "bg-muted/5 border-transparent text-muted-foreground/20 cursor-not-allowed"
        )}
      >
        Next
      </button>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center max-w-[280px] w-full"
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-12">Intelligence</h2>

      <div className="w-full space-y-6 mb-12">
        <div className="flex flex-wrap gap-1 justify-center">
          {['google', 'openai', 'anthropic', 'groq', 'openrouter'].map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest border transition-all",
                provider === p 
                  ? "bg-muted/20 text-foreground border-border" 
                  : "bg-transparent text-muted-foreground/40 border-transparent hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <input 
            type="password"
            placeholder="PASTE API KEY"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-muted/5 border border-border rounded px-4 py-3 text-[10px] font-mono focus:outline-none text-center placeholder:text-muted-foreground/20"
          />
          
          <button 
            onClick={testConnection}
            disabled={isTesting}
            className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-all block mx-auto"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <p className={cn(
              "text-[8px] font-black uppercase tracking-widest text-center",
              testResult.success ? "text-foreground/40" : "text-destructive/40"
            )}>
              {testResult.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full gap-2">
        <button onClick={handleBack} className="flex-1 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-all">
          Back
        </button>
        <button 
          onClick={handleNext}
          disabled={!apiKey}
          className={cn(
            "flex-1 py-3 rounded border text-[9px] font-black uppercase tracking-[0.3em] transition-all",
            apiKey 
              ? "bg-muted/5 border-border text-foreground hover:bg-muted/10" 
              : "bg-muted/5 border-transparent text-muted-foreground/20 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </motion.div>
  )

  const [walkthroughStep, setWalkthroughStep] = useState(-1)

  const walkthroughPages = [
    {
      title: "Inbox",
      description: "This is your entry point. Capture raw thoughts, clips, and data here. Our agents automatically process and link them to your vault."
    },
    {
      title: "Obsidian",
      description: "The core architecture. All your notes are stored as atomic markdown files, following a strict relational schema for total data sovereignty."
    },
    {
      title: "Academic",
      description: "A specialized engine for students. Manage programs, courses, assignments, and exams with automated pedagogical synchronization."
    },
    {
      title: "Practice",
      description: "Active recall at its peak. Our system generates intelligent quizzes from your notes to ensure long-term retention of complex concepts."
    },
    {
      title: "Agents",
      description: "Your cognitive workforce. Deploy specialized assistants to analyze your vault, plan your schedule, and generate insights."
    }
  ]

  const renderWalkthrough = () => {
    const page = walkthroughPages[walkthroughStep]
    return (
      <motion.div 
        key={walkthroughStep}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="flex flex-col items-center max-w-[320px] w-full"
      >
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-12">Walkthrough {walkthroughStep + 1}/{walkthroughPages.length}</h2>
        
        <div className="w-full space-y-6 mb-16 text-center px-4">
          <p className="text-[14px] font-black uppercase tracking-widest text-foreground">{page.title}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-relaxed">
            {page.description}
          </p>
        </div>

        <button 
          onClick={() => {
            if (walkthroughStep < walkthroughPages.length - 1) {
              setWalkthroughStep(walkthroughStep + 1)
            } else {
              finalizeSetup()
            }
          }}
          className="w-full py-4 rounded border border-border bg-muted/5 text-[9px] font-black uppercase tracking-[0.3em] text-foreground hover:bg-muted/10 transition-all"
        >
          {walkthroughStep < walkthroughPages.length - 1 ? 'Next' : 'Enter Application'}
        </button>
      </motion.div>
    )
  }

  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center max-w-[280px] w-full"
    >
      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-12">Success</h2>

      <div className="w-full space-y-6 mb-16 text-center">
        <div className="space-y-2">
          <p className="text-[12px] font-black uppercase tracking-widest text-foreground">Setup Complete</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Your vault is configured and ready.
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full gap-3">
        <button 
          onClick={() => setWalkthroughStep(0)}
          className="w-full py-4 rounded border border-border bg-muted/5 text-[9px] font-black uppercase tracking-[0.3em] text-foreground hover:bg-muted/10 transition-all"
        >
          Walkthrough
        </button>
        <button 
          onClick={finalizeSetup}
          disabled={isInitializing}
          className="w-full py-4 rounded border border-border bg-muted/5 text-[9px] font-black uppercase tracking-[0.3em] text-foreground hover:bg-muted/10 transition-all"
        >
          {isInitializing ? 'Activating...' : 'Start Application'}
        </button>
      </div>
    </motion.div>
  )

  return (
    <div className="h-full flex items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Progress */}
      {walkthroughStep === 0 && step < 3 && (
        <div className="absolute top-16 flex gap-4">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-0.5 transition-all duration-500",
                i === step ? "w-6 bg-foreground" : "w-1 bg-muted/20"
              )} 
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && walkthroughStep === -1 && renderStep3()}
        {walkthroughStep >= 0 && renderWalkthrough()}
      </AnimatePresence>
    </div>
  )
}
