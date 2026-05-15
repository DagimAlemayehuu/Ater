import React from 'react'
import { useAuth } from '@/context/auth-context'
import Login from '@/routes/login'
import { motion } from 'framer-motion'
import { Loader2, ShieldAlert, Clock } from 'lucide-react'
import { useConfig } from '@/lib/ConfigContext'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isActivated, status, loading } = useAuth()
  const { saveConfig } = useConfig()

  const resetActivation = async () => {
    await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#030303]">
        <Loader2 className="size-8 text-white/20 animate-spin mb-6" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Verifying Activation</span>
      </div>
    )
  }

  if (!isActivated) {
    return <Login />
  }

  if (status === 'pending') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#030303] px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[400px] bg-white/5 border border-white/10 p-12 rounded-[3rem] backdrop-blur-xl text-center"
        >
          <div className="size-16 bg-white/10 flex items-center justify-center rounded-[2rem] mx-auto mb-8">
            <Clock className="size-8 text-white/40" />
          </div>
          <h2 className="text-[18px] font-black uppercase tracking-[0.3em] text-white mb-4">Clearance Pending</h2>
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] leading-relaxed mb-10">
            Your activation is valid, but clearance is still being analyzed. We will actuate your local engine once final approval is granted.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/2 bg-white/20 rounded-full"
              />
            </div>
            <button 
              onClick={resetActivation}
              className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all mt-6"
            >
              Reset Activation
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#030303] px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[400px] bg-white/5 border border-white/10 p-12 rounded-[3rem] backdrop-blur-xl text-center"
        >
          <div className="size-16 bg-red-500/10 flex items-center justify-center rounded-[2rem] mx-auto mb-8">
            <ShieldAlert className="size-8 text-red-500/40" />
          </div>
          <h2 className="text-[18px] font-black uppercase tracking-[0.3em] text-white mb-4">Access Restricted</h2>
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] leading-relaxed mb-10">
            Your clearance level for this machine is insufficient. Access to local cognitive services is currently locked.
          </p>
          
          <button 
            onClick={resetActivation}
            className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all active:scale-[0.98]"
          >
            Clear Activation
          </button>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
