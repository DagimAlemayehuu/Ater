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
    let title = "Module Restricted"
    let description = "Access to this interface domain has been restricted by administration."

    if (featureSlug === 'ai-ingestion' || featureSlug === 'oracle-chat' || featureSlug === 'ai-features' || featureSlug === 'ai_locked') {
      title = "AI Features Restricted"
      description = "Your access to artificial intelligence processing models and local sidecar reasoning has been temporarily locked by the controller."
    } else if (featureSlug === 'interactive_quiz' || featureSlug === 'academic-dashboard' || featureSlug === 'academic_locked') {
      title = "Academic Portal Restricted"
      description = "The Academic Dashboard and all integrated milestones, schedule sheets, and study cards are locked by the controller."
    } else if (featureSlug === 'file_ingestion' || featureSlug === 'explorer-lockout' || featureSlug === 'explorer_locked') {
      title = "Explorer Access Restricted"
      description = "Obsidian vault explorer directories and vector index stores are currently locked by the controller."
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

  return <>{children}</>
}

