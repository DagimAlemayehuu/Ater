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

import { HeaderProvider } from '@/context/header-context'
import { Toaster } from '@/components/ui/sonner'
import PomodoroController from '@/components/intelligence/PomodoroController'
import { AuthProvider } from '@/context/auth-context'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { UpdateChecker } from '@/components/updater/UpdateChecker'

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
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initializing</span>
      </div>
    );
  }

  return (
    <AuthProvider>
      <HashRouter>
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
      </HashRouter>
    </AuthProvider>
  );
}


