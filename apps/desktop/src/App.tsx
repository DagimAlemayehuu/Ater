import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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
const Oracle = lazy(() => import('@/routes/oracle'))

import { HeaderProvider } from '@/context/header-context'
import { Toaster } from '@/components/ui/sonner'
import PomodoroController from '@/components/intelligence/PomodoroController'
import { AuthProvider } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { UpdateChecker } from '@/components/updater/UpdateChecker'
import { BlockingLoader } from '@/components/ui/loading-state'

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <UpdateChecker />
        <AppRoutes />
      </ConfigProvider>
    </ThemeProvider>
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
                    !isConfigured ? (
                      <Navigate to="/onboarding" replace />
                    ) : (
                      <AuthenticatedLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/oracle" replace />} />
                          <Route path="/oracle" element={<Oracle />} />
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
      </HashRouter>
    </AuthProvider>
  );
}

