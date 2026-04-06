import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { ConfigProvider, useConfig } from '@/lib/ConfigContext'
import { ThemeProvider } from '@/context/theme-provider'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import Onboarding from '@/routes/onboarding'
import ObsidianKnowledgeArchitect from '@/routes/obsidian'
import VaultSync from '@/routes/vault-sync'
import Agents from '@/routes/agents'
import Settings from '@/routes/settings'
import Strategist from '@/routes/strategist'
import Profiles from '@/routes/profiles'
import Goals from '@/routes/goals'
import ChatPage from '@/routes/chat'

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
  const { isLoading, isConfigured, config } = useConfig()
  const location = useLocation()

  // Sync OKA Watcher status on load
  useEffect(() => {
    if (isConfigured && config?.autoDeploy) {
      console.log('[Life OS] Auto-deploy enabled. Syncing watcher state...')
      sidecarApi.okaWatcherToggle().catch(err => {
        console.error('[Life OS] Failed to auto-start OKA watcher:', err)
      })
    }
  }, [isConfigured, config?.autoDeploy])

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
    return <Navigate to="/obsidian" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <SidecarGate>
          <BrowserRouter>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="*" element={
                <AuthenticatedLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/obsidian" replace />} />
                    <Route path="/obsidian" element={<ObsidianKnowledgeArchitect />} />
                    <Route path="/vault-sync" element={<VaultSync />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/strategist" element={<Strategist />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/profiles" element={<Profiles />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/debugger" element={<PlaceholderPage title="The Debugger" />} />
                  </Routes>
                </AuthenticatedLayout>
              } />
            </Routes>
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
