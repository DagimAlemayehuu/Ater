import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/theme-provider'
import { ConfigProvider } from '@/lib/ConfigContext'
import { SearchProvider } from '@/context/search-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

// Pages (Ported/Stubbed for parity)
import Obsidian from '@/routes/Obsidian'
import VaultSync from '@/routes/VaultSync'
import Agents from '@/routes/Agents'
import Practice from '@/routes/Practice'
import Settings from '@/routes/Settings'
import { NoteReader } from '@/routes/NoteReader'

import { Toaster } from 'sonner'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-10 text-center bg-background">
      <h2 className="display-md text-destructive mb-4">CRITICAL_FAILURE</h2>
      <p className="body-md text-secondary mb-8">{error.message}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-foreground text-background font-black uppercase">Initialize Retry</button>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <ConfigProvider>
          <LayoutProvider>
            <SearchProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AuthenticatedLayout />}>
                    <Route path="/" element={<Navigate to="/obsidian" replace />} />
                    <Route path="/obsidian" element={<Obsidian />} />
                    <Route path="/vault-sync" element={<VaultSync />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/note/:path" element={<NoteReader />} />
                  </Route>
                </Routes>
              </BrowserRouter>
              <Toaster />
            </SearchProvider>
          </LayoutProvider>
        </ConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
