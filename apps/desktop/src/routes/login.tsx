import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { activate } = useAuth()

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await activate(email, password, code.toUpperCase())
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-background text-foreground flex items-center justify-center p-6 selection:bg-foreground selection:text-background">
      <div className="w-full max-w-[320px]">
        <div className="mb-10 text-center">
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground mb-1">Ater</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actuate Engine</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Registry Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-border focus:border-primary rounded-none py-2 px-3 text-foreground text-[12px] focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border focus:border-primary rounded-none py-2 px-3 text-foreground text-[12px] focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Activation Code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-card border border-border focus:border-primary rounded-none py-2 px-3 text-foreground text-[12px] font-mono tracking-wider focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-[10px] font-bold text-destructive bg-destructive/10 p-2 uppercase tracking-widest text-center border border-destructive/20">
              {error}
            </p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={cn(
              "w-full mt-8 py-2.5 flex items-center justify-center border transition-none",
              loading 
                ? "bg-muted border-border text-muted-foreground cursor-wait" 
                : "bg-primary text-primary-foreground border-primary hover:opacity-90"
            )}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">
              {loading ? "Verifying..." : "Verify"}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
