import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, Shield, ArrowRight, Loader2, Mail } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { activate } = useAuth()

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await activate(email, code.toUpperCase())
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-[#030303] flex items-center justify-center p-6 overflow-hidden selection:bg-white selection:text-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="text-center mb-12">
          <div className="size-16 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <Shield className="size-8 text-white/40" />
          </div>
          <h1 className="text-[28px] font-black uppercase tracking-[0.4em] text-white mb-3">Actuate Ater</h1>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Enter your sovereign credentials to begin</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleActivate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Registry Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="oracle@ater.ai"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-white/20 focus:bg-white/[0.05] rounded-2xl py-4 pl-14 pr-6 text-white text-[13px] font-medium focus:outline-none transition-all placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Activation Code</label>
              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ATER-XXXX-XXXX"
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-white/20 focus:bg-white/[0.05] rounded-2xl py-4 pl-14 pr-6 text-white text-[13px] font-mono tracking-widest focus:outline-none transition-all placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest text-center py-2"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={cn(
                "w-full mt-6 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group",
                loading 
                  ? "bg-white/10 text-white/40 cursor-wait" 
                  : "bg-white text-black hover:bg-white/90 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Verify Node</span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
            Digital Sovereignty Guaranteed
          </p>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 left-12 opacity-5">
        <span className="text-[8px] font-black uppercase tracking-[1em] text-white vertical-text">Oracle Network</span>
      </div>
    </div>
  )
}
