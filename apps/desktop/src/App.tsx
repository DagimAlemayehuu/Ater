import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { ConfigProvider } from '@/lib/ConfigContext'
import { ThemeProvider } from '@/context/theme-provider'
import { NavigationProvider } from '@/context/navigation-provider'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import ObsidianVault from '@/routes/obsidian'
import Settings from '@/routes/settings'
import Practice from '@/routes/practice'
import AcademicDashboard from '@/routes/academic'
import Agents from '@/routes/agents'
import Onboarding from '@/routes/onboarding'

/**
 * Gate to ensure sidecar is connected before proceeding.
 */
function SidecarGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await sidecarApi.health()
        if (res.status === 'ok') {
          console.log('[Ater] Sidecar Connected - version:', res.version)
          setStatus('connected')
        }
      } catch {
        console.warn('[Ater] Sidecar connection failed. Retrying in 2s...')
        setTimeout(check, 2000)
      }
    }
    check()
  }, [])

  if (status === 'checking') {
    return (
      <div style={gateStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: 800, letterSpacing: '0.3em', textIndent: '0.3em' }}>CONNECTING TO SIDECAR</span>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  return <>{children}</>
}

import { HeaderProvider } from '@/context/header-context'
import { Toaster } from '@/components/ui/sonner'
import PomodoroController from '@/components/intelligence/PomodoroController'

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <SidecarGate>
          <BrowserRouter>
            <NavigationProvider>
              <HeaderProvider>
                <Routes>
                  <Route path="*" element={
                    <AuthenticatedLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/obsidian" replace />} />
                        <Route path="/obsidian" element={<ObsidianVault />} />
                        <Route path="/academic" element={<AcademicDashboard />} />
                        <Route path="/agents" element={<Agents />} />
                        <Route path="/practice" element={<Practice />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                      </Routes>
                    </AuthenticatedLayout>
                  } />
                </Routes>
                <Toaster />
                <PomodoroController />
              </HeaderProvider>
            </NavigationProvider>
          </BrowserRouter>
        </SidecarGate>
      </ConfigProvider>
    </ThemeProvider>
  )
}

const gateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: '#030303',
  color: 'white',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '0.75rem',
}

