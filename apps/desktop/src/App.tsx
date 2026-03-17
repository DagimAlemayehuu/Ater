import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
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
import Debugger from '@/routes/debugger'
import Automations from '@/routes/automations'
import AutomationDetail from '@/routes/automation-detail'
import Agents from '@/routes/agents'
import AgentDetail from '@/routes/agent-detail'
import Coach from '@/routes/coach'
import { Loader2 } from 'lucide-react'

export default function App() {
  return (
    <ThemeProvider>
      <OkaProvider>
        <ConfigProvider>
          <AppContent />
        </ConfigProvider>
      </OkaProvider>
    </ThemeProvider>
  )
}

function AppContent() {
  const { isConfigured, isLoading } = useConfig()

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold uppercase tracking-widest opacity-50 text-center px-4">Initializing Life OS...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/onboarding" 
          element={isConfigured ? <Navigate to="/dashboard" replace /> : <Onboarding />} 
        />
        
        {/* Protected Layout */}
        <Route element={!isConfigured ? <Navigate to="/onboarding" replace /> : <ShellLayout />}>
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
          <Route path="/automations" element={<Automations />} />
          <Route path="/automations/:id" element={<AutomationDetail />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/debugger" element={<Debugger />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function ShellLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
