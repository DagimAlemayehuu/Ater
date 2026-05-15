import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { ConfigProvider, useConfig } from '@/lib/ConfigContext'
import { ThemeProvider } from '@/context/theme-provider'
import { NavigationProvider } from '@/context/navigation-provider'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

const ObsidianVault = lazy(() => import('@/routes/obsidian'))
const Settings = lazy(() => import('@/routes/settings'))
const Practice = lazy(() => import('@/routes/practice'))
const AcademicDashboard = lazy(() => import('@/routes/academic'))
const Agents = lazy(() => import('@/routes/agents'))
const Onboarding = lazy(() => import('@/routes/onboarding'))

/**
 * Gate to ensure sidecar is connected before proceeding.
 */
/**
 * Gate to ensure sidecar is connected. Optimistic by default to skip loading screens.
 */
function SidecarGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('connected')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await sidecarApi.health()
        if (res.status === 'ok') {
          setStatus('connected')
        }
      } catch {
        console.warn('[Ater] Sidecar connection failed. Retrying...')
        setStatus('checking') // Only show loading if we confirmed it's not there
        setTimeout(check, 1000)
      }
    }
    check()
  }, [])

  if (status === 'checking') {
    return (
      <div style={gateStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '0' }} />
          <span style={{ fontWeight: 900, letterSpacing: '0.4em', textIndent: '0.4em', fontSize: '9px', color: 'var(--muted-foreground)', opacity: 0.4 }}>INITIALIZING ENGINE</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

import { HeaderProvider } from '@/context/header-context'
import { Toaster } from '@/components/ui/sonner'
import PomodoroController from '@/components/intelligence/PomodoroController'
import { AuthProvider } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AppRoutes />
      </ConfigProvider>
    </ThemeProvider>
  )
}

function AppRoutes() {
  const { isConfigured, isLoading: configLoading } = useConfig();
  
  if (configLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initializing</span>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SidecarGate>
        <BrowserRouter>
          <NavigationProvider>
            <HeaderProvider>
              <AuthGuard>
                <Suspense fallback={
                  <div className="h-screen w-full flex items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-none" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Loading Module</span>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="*" element={
                      !isConfigured ? (
                        <Navigate to="/onboarding" replace />
                      ) : (
                        <AuthenticatedLayout>
                          <Routes>
                            <Route path="/" element={<Navigate to="/obsidian" replace />} />
                            <Route path="/obsidian" element={<ObsidianVault />} />
                            <Route path="/academic" element={<AcademicDashboard />} />
                            <Route path="/agents" element={<Agents />} />
                            <Route path="/practice" element={<Practice />} />
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
        </BrowserRouter>
      </SidecarGate>
    </AuthProvider>
  );
}

const gateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '0.75rem',
}

