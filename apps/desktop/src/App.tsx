import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { ConfigProvider, useConfig } from '@/lib/ConfigContext'
import { ThemeProvider } from '@/context/theme-provider'
import { NavigationProvider } from '@/context/navigation-provider'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

import ObsidianVault from '@/routes/obsidian'
import Settings from '@/routes/settings'
import Practice from '@/routes/practice'
import AcademicDashboard from '@/routes/academic'
import Agents from '@/routes/agents'
import Onboarding from '@/routes/onboarding'

import { HeaderProvider } from '@/context/header-context'
import { Toaster } from '@/components/ui/sonner'
import PomodoroController from '@/components/intelligence/PomodoroController'
import { AuthProvider } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { UpdateChecker } from '@/components/updater/UpdateChecker'
import { BlockingLoader } from '@/components/ui/loading-state'

import { useSecurityStore } from '@/context/securityStore'
import { PageGuard } from '@/components/PageGuard'
import { LockoutScreen } from '@/components/ui/LockoutScreen'

export default function App() {
  const initializeSecurity = useSecurityStore(state => state.initializeSecurity)

  useEffect(() => {
    initializeSecurity()
  }, [initializeSecurity])

  return (
    <ThemeProvider>
      <ConfigProvider>
        <UpdateChecker />
        <SecurityBlocker />
        <AppRoutes />
      </ConfigProvider>
    </ThemeProvider>
  )
}

function SecurityBlocker() {
  const { config } = useConfig()
  const status = useSecurityStore(state => state.status)
  const checkSecurity = useSecurityStore(state => state.checkOnlineLockout)
  const [isRetrying, setIsRetrying] = useState(false)
  const [machineId, setMachineId] = useState('Resolving footprint...')

  const isBypass = import.meta.env.DEV &&
    (new URLSearchParams(window.location.search).get('bypass') === 'true' ||
     window.location.hash.includes('bypass=true'))

  useEffect(() => {
    if (isBypass) return
    if (!config?.isActivated) return
    if (status === 'Active' || status === 'FeatureLocked') return

    import('@tauri-apps/api/core').then(core => {
      core.invoke<string>('get_machine_id')
        .then(setMachineId)
        .catch(() => setMachineId('Unknown Device Signature'))
    })

    if (status === 'Bricked') {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation()
        e.preventDefault()
      }
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [status, isBypass, config?.isActivated])

  const handleRetry = async () => {
    setIsRetrying(true)
    await checkSecurity()
    setIsRetrying(false)
  }

  if (isBypass) return null;
  if (!config?.isActivated) return null;
  if (status === 'Active' || status === 'FeatureLocked') return null

  // 1. Expired lease offline: subtle, top-anchored layout bar, leaving workspace active.
  if (status === 'LeaseExpired') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[99999] h-9 bg-destructive/10 border-b border-destructive/30 text-destructive text-[9px] tracking-widest uppercase font-mono flex items-center justify-between px-6 select-none backdrop-blur-sm">
        <span>[DRM Warning: Offline lease expired. Server-side AI features restricted]</span>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="border border-destructive/40 px-3 py-1 bg-destructive/20 hover:bg-destructive hover:text-white transition-none uppercase text-[8px] font-bold"
        >
          {isRetrying ? 'Syncing...' : 'Re-Authenticate Lease'}
        </button>
      </div>
    )
  }

  // 2. Absolute lockout exception (Bricked / Suspended / Banned)
  return (
    <LockoutScreen
      title="System Locked"
      description="Clearance revoked. This device footprint has been blacklisted or your security clearance has been invalidated by the controller. All local workspaces and AI systems are locked."
      slug={machineId}
      onVerify={handleRetry}
      isSyncing={isRetrying}
      fullScreen={true}
    />
  )
}

function AppRoutes() {
  const { isConfigured, isLoading: configLoading } = useConfig();
  
  if (configLoading) {
    return <BlockingLoader label="Initializing" />
  }

  return (
    <AuthProvider>
      <HashRouter>
        <NavigationProvider>
          <HeaderProvider>
            <AuthGuard>
              <Suspense fallback={
                <BlockingLoader label="Loading Module" />
              }>
                <Routes>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="*" element={
                    (!isConfigured && 
                      !(import.meta.env.DEV && (
                        new URLSearchParams(window.location.search).get('bypass') === 'true' ||
                        window.location.hash.includes('bypass=true')
                      ))
                    ) ? (
                      <Navigate to="/onboarding" replace />
                    ) : (
                      <AuthenticatedLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/agents?tab=oracle" replace />} />
                          <Route path="/obsidian" element={<PageGuard featureSlug="file_ingestion"><ObsidianVault /></PageGuard>} />
                          <Route path="/academic" element={<PageGuard featureSlug="interactive_quiz"><AcademicDashboard /></PageGuard>} />
                          <Route path="/agents" element={<PageGuard featureSlug="ai-features"><Agents /></PageGuard>} />
                          <Route path="/practice" element={<PageGuard featureSlug="practice-recall"><Practice /></PageGuard>} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </AuthenticatedLayout>
                    )
                  } />
                </Routes>
              </Suspense>
            </AuthGuard>
            <Toaster />
            <PomodoroController />
          </HeaderProvider>
        </NavigationProvider>
      </HashRouter>
    </AuthProvider>
  );
}

