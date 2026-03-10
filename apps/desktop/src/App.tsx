import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { ConfigProvider, useConfig } from '@/lib/ConfigContext'
import { ThemeProvider } from '@/context/theme-provider'
import Onboarding from '@/routes/onboarding'
import Shell from '@/components/layout/Shell'
import Dashboard from '@/routes/dashboard'
import Strategist from '@/routes/strategist'
import Notion from '@/routes/notion'
import Settings from '@/routes/settings'
import Goals from '@/routes/goals'
import Obsidian from '@/routes/obsidian'
import { OkaProvider } from '@/lib/OkaContext'
import Chat from '@/routes/chat'
import Oka from '@/routes/oka'
import Academics from '@/routes/academics'

// Placeholder components
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '2rem', color: '#71717a' }}>
    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white' }}>{title}</h1>
    <p style={{ opacity: 0.6 }}>This view will be built in the next development cycle.</p>
  </div>
)

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
          console.log('[Life OS] Sidecar Connected - version:', res.version)
          setStatus('connected')
        }
      } catch {
        console.warn('[Life OS] Sidecar connection failed. Retrying in 2s...')
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

/**
 * Gate to force onboarding if configuration is missing.
 */
function ConfigGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isConfigured } = useConfig()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={gateStyle}>
        <span style={{ fontWeight: 800, letterSpacing: '0.3em' }}>INITIALIZING ENGINE</span>
      </div>
    )
  }

  // Mandatory redirect to onboarding if not configured and not already on onboarding page
  if (!isConfigured && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Prevent accessing onboarding if already configured
  if (isConfigured && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <OkaProvider>
        <ConfigProvider>
          <SidecarGate>
            <BrowserRouter>
              <ConfigGate>
                <Routes>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="*" element={
                    <Shell>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/obsidian" element={<Obsidian />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/strategist" element={<Strategist />} />
                        <Route path="/notion" element={<Notion />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/oka" element={<Oka />} />
                        <Route path="/academics" element={<Academics />} />
                        <Route path="/debugger" element={<PlaceholderPage title="The Debugger" />} />
                      </Routes>
                    </Shell>
                  } />
                </Routes>
              </ConfigGate>
            </BrowserRouter>
          </SidecarGate>
        </ConfigProvider>
      </OkaProvider>
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
