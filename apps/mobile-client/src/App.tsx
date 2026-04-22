import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/theme-provider'
import { ConfigProvider } from '@/lib/ConfigContext'
import { SearchProvider } from '@/context/search-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

// Pages
import Obsidian from '@/routes/Obsidian'
import Settings from '@/routes/Settings'
import Practice from '@/routes/Practice'
import VaultSync from '@/routes/VaultSync'
import MobileDatabaseView from '@/routes/MobileDatabaseView'

import { Toaster } from 'sonner'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-10 text-center bg-background">
      <h2 className="text-2xl font-black uppercase text-destructive mb-4 tracking-tighter">System Malfunction</h2>
      <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed px-4">{error.message}</p>
      <button onClick={() => window.location.reload()} className="px-10 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl">Re-Initialize</button>
    </div>
  )
}

export default function App() {
  const BoundariedApp = ErrorBoundary as any;
  return (
    <BoundariedApp FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <ConfigProvider>
          <LayoutProvider>
            <SearchProvider>
              <HashRouter>
                <Routes>
                  <Route element={<AuthenticatedLayout />}>
                    <Route path="/" element={<Navigate to="/obsidian" replace />} />
                    <Route path="/obsidian" element={<Obsidian />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/registry" element={<VaultSync />} />
                    <Route path="/databases/:id" element={<MobileDatabaseView />} />
                    <Route path="/note/*" element={<Obsidian />} />
                  </Route>
                </Routes>
              </HashRouter>
              <Toaster position="top-center" />
            </SearchProvider>
          </LayoutProvider>
        </ConfigProvider>
      </ThemeProvider>
    </BoundariedApp>
  )
}
