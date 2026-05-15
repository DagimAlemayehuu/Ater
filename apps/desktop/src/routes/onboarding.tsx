import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig } from '@/lib/ConfigContext'
import { open } from '@tauri-apps/plugin-dialog'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  FolderOpen, 
  Key,
  Layers,
  Search,
  BookOpen,
  Zap
} from 'lucide-react'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const { config, saveConfig, addApiKey } = useConfig()
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
      setTestResult({ success: false, message: 'NO KEY' })
      return
    }
    
    await saveConfig({ aiApiKey: apiKey, aiProvider: provider })
    
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
    
    // Simulate neural scan indexing progress
    const interval = setInterval(() => {
      setInitProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 2
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
      }, 3000)
    } catch (err) {
      console.error(err)
      setIsInitializing(false)
    }
  }

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center max-w-[400px] w-full text-center"
    >
      <div className="size-12 bg-white/5 flex items-center justify-center rounded-2xl mb-8">
        <Database className="size-6 text-white/40" />
      </div>
      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Phase 01</h2>
      <h1 className="text-[24px] font-black uppercase tracking-tight text-white mb-4">Vault Actuation</h1>
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/30 leading-relaxed mb-12">
        Ater illuminates your existing knowledge. <br/>Select your local Obsidian vault to begin.
      </p>
      
      <button 
        onClick={selectVault}
        className="w-full group bg-white/5 border border-white/10 hover:border-white/20 rounded-[2rem] p-8 transition-all active:scale-[0.98] mb-12"
      >
        <div className="flex flex-col items-center gap-4">
          <FolderOpen className="size-8 text-white/20 group-hover:text-white/40 transition-colors" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white">
            {vaultPath ? vaultPath.split('/').pop() : 'Open Directory'}
          </span>
          {vaultPath && (
            <span className="text-[9px] font-mono text-white/20 truncate max-w-full">{vaultPath}</span>
          )}
        </div>
      </button>

      <button 
        onClick={handleNext}
        disabled={!vaultPath}
        className={cn(
          "w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3",
          vaultPath 
            ? "bg-white text-black hover:bg-white/90" 
            : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
        )}
      >
        Continue <ArrowRight className="size-3" />
      </button>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center max-w-[400px] w-full text-center"
    >
      <div className="size-12 bg-white/5 flex items-center justify-center rounded-2xl mb-8">
        <Cpu className="size-6 text-white/40" />
      </div>
      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Phase 02</h2>
      <h1 className="text-[24px] font-black uppercase tracking-tight text-white mb-4">Intelligence Link</h1>
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/30 leading-relaxed mb-12">
        Enter your primary cognitive driver. <br/>Your keys are stored only on this machine.
      </p>

      <div className="w-full space-y-8 mb-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {['google', 'openai', 'anthropic', 'groq'].map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                provider === p 
                  ? "bg-white text-black border-white" 
                  : "bg-transparent text-white/20 border-white/5 hover:text-white/40 hover:bg-white/5"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Key className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-white/10" />
            <input 
              type="password"
              placeholder="PASTE SECRET KEY"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-[12px] font-mono focus:outline-none focus:border-white/20 text-white placeholder:text-white/10"
            />
          </div>
          
          <button 
            onClick={testConnection}
            disabled={isTesting || !apiKey}
            className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all"
          >
            {isTesting ? 'Analyzing...' : 'Test Connection'}
          </button>

          {testResult && (
            <p className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              testResult.success ? "text-white/60" : "text-red-500/60"
            )}>
              {testResult.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full gap-4">
        <button 
          onClick={handleBack} 
          className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all"
        >
          Back
        </button>
        <button 
          onClick={handleNext}
          disabled={!apiKey}
          className={cn(
            "flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3",
            apiKey 
              ? "bg-white text-black hover:bg-white/90" 
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
          )}
        >
          Finalize <ArrowRight className="size-3" />
        </button>
      </div>
    </motion.div>
  )

  const [walkthroughStep, setWalkthroughStep] = useState(-1)

  const walkthroughPages = [
    {
      title: "The Inbox",
      icon: Zap,
      description: "Drop any PDF or text snippet. Our agents decompose data into atomic notes instantly."
    },
    {
      title: "Cognitive Vault",
      icon: Layers,
      description: "Your knowledge is stored in your local folder as clean, relational Markdown."
    },
    {
      title: "Academic Hub",
      icon: BookOpen,
      description: "Automated structure for semesters and courses. Your education, unified."
    },
    {
      title: "Neural Search",
      icon: Search,
      description: "Cmd+K to access anything. Ater finds links between concepts you didn't know existed."
    }
  ]

  const renderWalkthrough = () => {
    const page = walkthroughPages[walkthroughStep]
    return (
      <motion.div 
        key={walkthroughStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col items-center max-w-[400px] w-full text-center"
      >
        <div className="size-16 bg-white/5 flex items-center justify-center rounded-[2rem] mb-10">
          <page.icon className="size-8 text-white/40" />
        </div>
        
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">
          Guide {walkthroughStep + 1}/{walkthroughPages.length}
        </h2>
        
        <div className="w-full space-y-6 mb-16 px-4">
          <h1 className="text-[24px] font-black uppercase tracking-tight text-white">{page.title}</h1>
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/30 leading-relaxed">
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
          className="w-full py-6 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/90 transition-all shadow-xl active:scale-[0.98]"
        >
          {walkthroughStep < walkthroughPages.length - 1 ? 'Continue Descent' : 'Actuate Oracle'}
        </button>
      </motion.div>
    )
  }

  const renderActivation = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center max-w-[400px] w-full text-center"
    >
      <div className="size-20 bg-white/5 flex items-center justify-center rounded-[2.5rem] mb-12 relative overflow-hidden">
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="size-10 text-white/20" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
      </div>

      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Actuation</h2>
      <h1 className="text-[24px] font-black uppercase tracking-tight text-white mb-8">Indexing Local Neurons</h1>
      
      <div className="w-full space-y-4 mb-16">
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${initProgress}%` }}
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          />
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Analyzing Vault Structure</span>
          <span className="text-[10px] font-black text-white/40">{Math.round(initProgress)}%</span>
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 animate-pulse">
        Initializing Cognitive Layer...
      </p>
    </motion.div>
  )

  const renderSuccess = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center max-w-[400px] w-full text-center"
    >
      <div className="size-20 bg-white flex items-center justify-center rounded-[2.5rem] mb-12 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
        <CheckCircle2 className="size-10 text-black" />
      </div>

      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Clearance Complete</h2>
      <h1 className="text-[24px] font-black uppercase tracking-tight text-white mb-4">Welcome, {profile?.full_name?.split(' ')[0] || 'Scholar'}</h1>
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/30 leading-relaxed mb-16">
        The Ater Oracle is now active for your machine. <br/>Your cognitive journey begins here.
      </p>

      <button 
        onClick={() => setWalkthroughStep(0)}
        className="w-full py-6 rounded-3xl bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/90 transition-all shadow-xl active:scale-[0.98]"
      >
        Enter The Oracle
      </button>
    </motion.div>
  )

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#030303] text-white selection:bg-white selection:text-black">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent)]" />
      </div>

      <AnimatePresence mode="wait">
        {isInitializing ? (
          <React.Fragment key="init">{renderActivation()}</React.Fragment>
        ) : step === 1 ? (
          <React.Fragment key="s1">{renderStep1()}</React.Fragment>
        ) : step === 2 ? (
          <React.Fragment key="s2">{renderStep2()}</React.Fragment>
        ) : step === 3 && walkthroughStep === -1 ? (
          <React.Fragment key="s3">{renderSuccess()}</React.Fragment>
        ) : walkthroughStep >= 0 ? (
          <React.Fragment key={`walk-${walkthroughStep}`}>{renderWalkthrough()}</React.Fragment>
        ) : null}
      </AnimatePresence>

      {/* Progress Indicator */}
      {!isInitializing && walkthroughStep === -1 && (
        <div className="absolute bottom-16 flex gap-4">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-0.5 transition-all duration-700",
                i === step ? "w-12 bg-white" : "w-2 bg-white/5"
              )} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
