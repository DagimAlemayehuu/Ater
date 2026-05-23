import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useConfig } from '@/lib/ConfigContext'
import { sidecarApi } from '@/lib/sidecarApi'

export type WaitlistStatus = 'pending' | 'approved' | 'rejected'

interface AuthContextType {
  isActivated: boolean
  activationData: { email: string; code: string } | null
  status: WaitlistStatus | null
  loading: boolean
  profile: { full_name: string } | null
  error: string | null
  setError: (error: string | null) => void
  activate: (email: string, password: string, code: string) => Promise<void>
  refreshStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { config, saveConfig, isLoading: configLoading } = useConfig()
  const [status, setStatus] = useState<WaitlistStatus | null>(null)
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkActivation = async () => {
    if (!config?.isActivated || !config?.activationEmail || !config?.activationCode) {
      setLoading(false)
      return
    }

    setLoading(false)
    setStatus('approved')
    setProfile({ full_name: config.displayName || config.activationEmail.split('@')[0] })
  }

  useEffect(() => {
    if (!configLoading) {
      checkActivation()
    }
  }, [configLoading])

  const activate = async (email: string, password: string, code: string) => {
    setLoading(true)
    setError(null)
    console.log('[DRM] Starting offline-first activation...')

    try {
      // Offline Validation: Simple check to ensure credentials feel real and robust
      if (!email.includes('@') || email.length < 5) {
        throw new Error('Please enter a valid email address.')
      }
      if (password.length < 4) {
        throw new Error('Password must be at least 4 characters long.')
      }
      if (code.trim().length < 6) {
        throw new Error('Invalid activation code. Code must be at least 6 characters.')
      }

      // Simulate a small, elegant processing delay to feel high-fidelity
      await new Promise(resolve => setTimeout(resolve, 800));

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim().toUpperCase();
      const derivedName = cleanEmail.split('@')[0].replace(/[\._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      await saveConfig({ 
        isActivated: true, 
        activationEmail: cleanEmail, 
        activationCode: cleanCode,
        isProgramConfigured: false, // forces onboarding on first run
        displayName: derivedName
      })
      
      setStatus('approved')
      setProfile({ full_name: derivedName })
      console.log('[DRM] Activation sequence complete. Access granted locally.');
    } catch (error: any) {
      console.error('[DRM] Activation error:', error.message);
      setError(error.message)
      setLoading(false)
      throw error
    }
    
    setLoading(false)
  }

  const refreshStatus = async () => {
    await checkActivation()
  }

  return (
    <AuthContext.Provider value={{ 
      isActivated: config?.isActivated || false, 
      activationData: config ? { email: config.activationEmail, code: config.activationCode } : null,
      status, 
      profile,
      error,
      setError,
      loading: loading || configLoading, 
      activate, 
      refreshStatus 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
