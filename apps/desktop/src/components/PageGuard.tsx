import React, { useState } from 'react'
import { useSecurityStore } from '@/context/securityStore'
import { LockoutScreen } from './ui/LockoutScreen'

interface PageGuardProps {
  featureSlug: string
  children: React.ReactNode
}

export function PageGuard({ featureSlug, children }: PageGuardProps) {
  const isFeatureLocked = useSecurityStore(state => state.isFeatureLocked)
  const checkOnlineLockout = useSecurityStore(state => state.checkOnlineLockout)
  const [isSyncing, setIsSyncing] = useState(false)

  const isBypass = import.meta.env.DEV &&
    (new URLSearchParams(window.location.search).get('bypass') === 'true' ||
     window.location.hash.includes('bypass=true'))
  if (isBypass) {
    return <>{children}</>
  }

  const isLocked = isFeatureLocked(featureSlug)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await checkOnlineLockout()
    } catch (e) {
      console.error('[PageGuard] Failed to check status:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLocked) {
    const isAiFeature = [
      'ai-ingestion', 
      'oracle-chat', 
      'practice-recall', 
      'ater_generation', 
      'ater_chat', 
      'ater_oracle_chat', 
      'ai-features', 
      'ai_locked', 
      'explain-features',
      'full-system-lockout'
    ].includes(featureSlug) || useSecurityStore.getState().status === 'Bricked';

    if (isAiFeature) {
      let title = "Module Restricted"
      let description = "Access to this interface domain has been restricted by administration."

      if (featureSlug === 'ai-ingestion' || featureSlug === 'oracle-chat' || featureSlug === 'ai-features' || featureSlug === 'ai_locked') {
        title = "AI Features Restricted"
        description = "Your access to artificial intelligence processing models and local sidecar reasoning has been temporarily locked by the controller."
      }

      return (
        <LockoutScreen
          title={title}
          description={description}
          slug={featureSlug}
          onVerify={handleSync}
          isSyncing={isSyncing}
        />
      )
    }

    // Non-AI locked features (Academic, Explorer, etc.) -> Allow Read-Only
    let bannerTitle = "Read-Only Mode"
    let bannerDesc = "This workspace has restricted features. Academic and Explorer components are available in view-only mode."

    if (featureSlug === 'interactive_quiz' || featureSlug === 'academic-dashboard' || featureSlug === 'academic_locked') {
      bannerTitle = "Academic Workspace (Read-Only)"
      bannerDesc = "Access to creating or editing academic tasks, quizzes, and sheets is locked. Existing cards are read-only."
    } else if (featureSlug === 'file_ingestion' || featureSlug === 'explorer-lockout' || featureSlug === 'explorer_locked') {
      bannerTitle = "Obsidian Explorer (Read-Only)"
      bannerDesc = "Obsidian vault write access and file ingestion are locked. Reading existing notes is allowed."
    }

    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Premium Read-Only Banner */}
        <div className="w-full bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between text-amber-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">{bannerTitle}</p>
              <p className="text-[9px] text-amber-200/70 font-semibold mt-0.5">{bannerDesc}</p>
            </div>
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="verify-access-btn text-[9px] font-black uppercase tracking-widest bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 text-amber-200 h-6 px-3 rounded-[4px] border border-amber-500/30 transition-all disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Verify Access"}
          </button>
        </div>
        {/* Wrap in read-only style class / disable pointers for inputs */}
        <div className="flex-1 overflow-auto pointer-events-auto readonly-restriction-container">
          {children}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

