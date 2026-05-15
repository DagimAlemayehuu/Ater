import React from 'react'
import { useAuth } from '@/context/auth-context'
import Login from '@/routes/login'
import { useConfig } from '@/lib/ConfigContext'
import { cn } from '@/lib/utils'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isActivated, status, loading } = useAuth()
  const { saveConfig } = useConfig()

  const resetActivation = async () => {
    await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Verifying</span>
      </div>
    )
  }

  if (!isActivated) {
    return <Login />
  }

  if (status === 'pending') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background px-8">
        <div className="w-full max-w-[400px] border border-border p-12 text-center bg-card">
          <h2 className="text-[18px] font-black uppercase tracking-[0.3em] text-foreground mb-4">Clearance Pending</h2>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-relaxed mb-10">
            Your activation is valid, but clearance is still being analyzed. We will actuate your local engine once final approval is granted.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="h-[2px] w-full bg-muted overflow-hidden">
              <div className="h-full w-1/2 bg-primary" />
            </div>
            <button 
              onClick={resetActivation}
              className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors mt-6"
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
        <div className="w-full max-w-[400px] border border-border p-12 text-center bg-card">
          <h2 className="text-[18px] font-black uppercase tracking-[0.3em] text-foreground mb-4">Access Restricted</h2>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-relaxed mb-10">
            Your clearance level for this machine is insufficient. Access to local cognitive services is currently locked.
          </p>
          
          <button 
            onClick={resetActivation}
            className="w-full py-5 bg-primary text-primary-foreground border border-border text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90"
          >
            Clear Activation
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
