import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { ThemeSwitch } from '@/components/theme-switch'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [localLoading, setLocalLoading] = useState(false)
  const { activate, error, setError } = useAuth()

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalLoading(true)
    setError(null)

    try {
      await activate(email.trim(), password, code.trim().toUpperCase())
    } catch (err: any) {
      // Error is caught and set globally by activate()
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-foreground selection:text-background relative">
      <div className="absolute top-8 right-8">
        <ThemeSwitch />
      </div>
      <div className="w-full max-w-[300px]">
        <div className="mb-10">
          <h1 className="text-lg font-black uppercase tracking-[0.15em] text-foreground">Ater</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Enter your credentials to activate
          </p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-border focus:border-foreground py-2.5 px-3 text-foreground text-[12px] outline-none"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border focus:border-foreground py-2.5 px-3 text-foreground text-[12px] outline-none"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Activation Code
            </label>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              From your waitlist approval email.
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-card border border-border focus:border-foreground py-2.5 px-3 text-foreground text-[13px] font-mono tracking-[0.2em] outline-none uppercase"
              required
              maxLength={8}
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="p-4 border border-destructive bg-destructive/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-1 bg-destructive" />
                <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Verification Failure</span>
              </div>
              <p className="text-[11px] font-bold text-foreground leading-relaxed uppercase">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={localLoading}
            className={cn(
              "w-full mt-6 py-2.5 flex items-center justify-center border",
              localLoading
                ? "bg-muted border-border text-muted-foreground cursor-wait"
                : "bg-primary text-primary-foreground border-primary hover:opacity-90"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {localLoading ? "Verifying..." : "Activate"}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
