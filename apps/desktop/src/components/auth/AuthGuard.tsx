import React from 'react'
import { useAuth } from '@/context/auth-context'
import Login from '@/routes/login'
import { useConfig } from '@/lib/ConfigContext'
import { BlockingLoader } from '@/components/ui/loading-state'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isActivated, status, loading } = useAuth()
  const { saveConfig } = useConfig()

  const resetActivation = async () => {
    await saveConfig({ 
      isActivated: false, 
      activationEmail: '', 
      activationCode: '',
      displayName: '',
      isProgramConfigured: false
    })
  }

  if (loading) {
    return <BlockingLoader label="Verifying" />
  }

  // Bypass auth check during development/design capture
  const isBypass = new URLSearchParams(window.location.search).get('bypass') === 'true' || window.location.hash.includes('bypass=true')
  if (isBypass) {
    return <>{children}</>
  }

  if (!isActivated) {
    return <Login />
  }

  if (status === 'pending') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background px-8">
        <div className="w-full max-w-[400px] border border-border p-12 text-center bg-card space-y-8">
          <div className="space-y-2">
            <h2 className="text-[18px] font-black uppercase tracking-[0.3em] text-foreground">Clearance Pending</h2>
            <div className="h-px w-12 bg-primary mx-auto" />
          </div>
          
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-relaxed">
            Your activation is valid, but clearance is still being analyzed. We will actuate your local engine once final approval is granted.
          </p>
          
          <div className="space-y-6 pt-4">
            <div className="h-[2px] w-full bg-muted overflow-hidden">
              <div className="h-full w-1/3 bg-primary animate-none" />
            </div>
            <button 
              onClick={resetActivation}
              className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-none border-b border-transparent hover:border-muted-foreground pb-0.5"
            >
              Reset Activation
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background px-8">
        <div className="w-full max-w-[400px] border border-destructive/50 p-12 text-center bg-card space-y-8">
          <div className="space-y-2">
            <h2 className="text-[18px] font-black uppercase tracking-[0.3em] text-destructive">Access Restricted</h2>
            <div className="h-px w-12 bg-destructive mx-auto" />
          </div>

          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-relaxed">
            Your clearance level for this machine is insufficient. Access to local cognitive services is currently locked.
          </p>
          
          <button 
            onClick={resetActivation}
            className="w-full py-5 bg-destructive text-foreground border border-destructive text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-none"
          >
            Clear Activation
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
