import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderOpen, Key, Zap, Check, ChevronRight, 
  ArrowRight, Shield, Database, Globe, Brain 
} from 'lucide-react'
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
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('google')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success?: boolean; message?: string} | null>(null)

  // Step 3: Logistics State
  const [inboxName, setInboxName] = useState('Inbox')
  const [notesName, setNotesName] = useState('Notes')
  const [isInitializing, setIsInitializing] = useState(false)

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

  const selectVault = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select or Create your LifeOS Vault'
      })
      if (selected) setVaultPath(selected as string)
    } catch (err) {
      console.error(err)
    }
  }

  const testConnection = async () => {
    if (!apiKey) return
    setIsTesting(true)
    setTestResult(null)
    
    // Temporarily save to test
    await saveConfig({ aiApiKey: apiKey, aiProvider: provider })
    
    try {
      const res = await sidecarApi.testAiConnection('primary')
      if (res.success) {
        setTestResult({ success: true, message: 'Neural connection established.' })
      } else {
        setTestResult({ success: false, message: res.error || 'Connection failed.' })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'System error' })
    } finally {
      setIsTesting(false)
    }
  }

  const finalizeSetup = async () => {
    setIsInitializing(true)
    try {
      // 1. Save all config
      await saveConfig({
        obsidianVaultPath: vaultPath,
        aiApiKey: apiKey,
        aiProvider: provider,
        inboxPath: `${vaultPath}/${inboxName}`,
        academicFolderPath: notesName,
        autoDeploy: true
      })

      // 2. Add to key vault
      addApiKey({
        id: crypto.randomUUID(),
        name: `Primary ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        key: apiKey,
        provider: provider as any
      })

      // 3. Initialize vault folders
      await sidecarApi.academicsSyncProfile()
      
      // 4. Success!
      navigate('/obsidian')
    } catch (err) {
      console.error(err)
    } finally {
      setIsInitializing(false)
    }
  }

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center text-center max-w-sm w-full"
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/5 border border-border flex items-center justify-center mb-8">
        <Database size={24} className="text-foreground/60" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Foundation</h2>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-12">
        Where should your digital life reside?
      </p>

      <button 
        onClick={selectVault}
        className="w-full p-4 rounded-xl border border-border bg-muted/5 hover:border-foreground/30 transition-all group flex items-center justify-between mb-12"
      >
        <div className="flex items-center gap-4 text-left overflow-hidden">
          <FolderOpen size={18} className="text-muted-foreground shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest truncate">
            {vaultPath ? vaultPath : 'Select Vault Folder'}
          </span>
        </div>
        <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-foreground transition-all" />
      </button>

      <button 
        disabled={!vaultPath}
        onClick={handleNext}
        className="group flex items-center gap-3 px-8 py-3 rounded-full bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all disabled:opacity-20 disabled:scale-100"
      >
        Continue <ArrowRight size={14} />
      </button>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center text-center max-w-sm w-full"
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/5 border border-border flex items-center justify-center mb-8">
        <Brain size={24} className="text-foreground/60" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Intelligence</h2>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-12">
        Activate your neural carriers.
      </p>

      <div className="w-full space-y-4 mb-12">
        <div className="flex gap-2">
          {['google', 'openai', 'anthropic'].map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                provider === p 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-muted/5 text-muted-foreground/40 border-border hover:border-foreground/20"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative w-full">
          <input 
            type="password"
            placeholder="Paste API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-foreground/30 text-center"
          />
          {apiKey && (
            <button 
              onClick={testConnection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-all"
            >
              {isTesting ? <Zap size={14} className="animate-pulse" /> : <Zap size={14} />}
            </button>
          )}
        </div>

        {testResult && (
          <p className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            testResult.success ? "text-green-500/60" : "text-destructive/60"
          )}>
            {testResult.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={handleBack} className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-all">
          Back
        </button>
        <button 
          disabled={!apiKey || testResult?.success !== true}
          onClick={handleNext}
          className="group flex items-center gap-3 px-8 py-3 rounded-full bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all disabled:opacity-20 disabled:scale-100"
        >
          Activate <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center text-center max-w-sm w-full"
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/5 border border-border flex items-center justify-center mb-8">
        <Zap size={24} className="text-foreground/60" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Logistics</h2>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-12">
        Define your input and output.
      </p>

      <div className="w-full space-y-6 mb-12">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Inbox Folder</label>
          <input 
            value={inboxName}
            onChange={(e) => setInboxName(e.target.value)}
            className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-center focus:outline-none focus:border-foreground/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Notes Folder</label>
          <input 
            value={notesName}
            onChange={(e) => setNotesName(e.target.value)}
            className="w-full bg-muted/5 border border-border rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-center focus:outline-none focus:border-foreground/30"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleBack} className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-all">
          Back
        </button>
        <button 
          onClick={finalizeSetup}
          disabled={isInitializing}
          className="group flex items-center gap-3 px-12 py-4 rounded-full bg-foreground text-background text-[11px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-foreground/10"
        >
          {isInitializing ? 'Deploying...' : 'Initialize OS'} <Check size={16} />
        </button>
      </div>
    </motion.div>
  )

  return (
    <div className="h-full flex items-center justify-center bg-background text-foreground selection:bg-foreground selection:text-background overflow-hidden">
      {/* Progress Indicator */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-3">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={cn(
              "h-0.5 transition-all duration-500",
              i === step ? "w-8 bg-foreground" : "w-2 bg-muted-foreground/20"
            )} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </AnimatePresence>
    </div>
  )
}
