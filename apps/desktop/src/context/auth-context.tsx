import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useConfig } from '@/lib/ConfigContext'

export type WaitlistStatus = 'pending' | 'approved' | 'rejected'

interface AuthContextType {
  isActivated: boolean
  activationData: { email: string; code: string } | null
  status: WaitlistStatus | null
  loading: boolean
  profile: { full_name: string } | null
  activate: (email: string, password: string, code: string) => Promise<void>
  refreshStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { config, saveConfig, isLoading: configLoading } = useConfig()
  const [status, setStatus] = useState<WaitlistStatus | null>(null)
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const checkActivation = async () => {
    if (!config?.isActivated || !config?.activationEmail || !config?.activationCode) {
      setLoading(false)
      return
    }

    // Verify code still valid and get status
    const { data, error } = await supabase
      .from('waiting_list')
      .select('status, full_name')
      .eq('email', config.activationEmail)
      .eq('activation_code', config.activationCode)
      .single()

    if (error) {
      // ── OFFLINE RESILIENCE (v33.1) ──
      // If it's a network error or server error, DO NOT log out.
      // Only log out if it's a definitive "Not Found" error (PGRST116).
      if (error.code === 'PGRST116') {
        console.warn('[Auth] Activation code invalid or revoked. Deactivating...');
        await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
        setStatus(null)
        setProfile(null)
      } else {
        console.warn('[Auth] Network failure during verification. Preserving local session.')
        // Maintain local approval state during outages
        setStatus('approved')
      }
    } else if (!data) {
      await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
      setStatus(null)
      setProfile(null)
    } else {
      setStatus(data.status as WaitlistStatus)
      setProfile({ full_name: data.full_name })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!configLoading) {
      checkActivation()
    }
  }, [configLoading])

  const activate = async (email: string, password: string, code: string) => {
    setLoading(true)

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        throw new Error('Authentication failed. Please check your email and password.')
      }

      // 2. Verify Waitlist Code and Status
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('waiting_list')
        .select('status, full_name')
        .eq('email', email)
        .eq('activation_code', code)
        .single()

      if (waitlistError || !waitlistData) {
        throw new Error('Invalid activation code.')
      }

      if (waitlistData.status !== 'approved') {
        throw new Error('Access for this account is still pending.')
      }

      // 3. Enforce 1 device strictly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('machine_id, id')
        .eq('id', authData.user.id)
        .single()
        
      if (profileError) {
        throw new Error('Profile not found.')
      }

      const currentMachineId = config?.machineId

      if (!currentMachineId) {
         throw new Error('Local engine failure: Missing hardware ID.')
      }

      if (profile.machine_id && profile.machine_id !== currentMachineId) {
        throw new Error('This account is already locked to another device.')
      }

      // 4. Update profile with machine mapping
      await supabase
        .from('profiles')
        .update({ 
          activation_code: code,
          machine_id: currentMachineId,
          waitlist_status: 'approved',
          is_approved: true 
        })
        .eq('id', authData.user.id)

      await saveConfig({ 
        isActivated: true, 
        activationEmail: email, 
        activationCode: code 
      })
      
      setStatus('approved')
      setProfile({ full_name: waitlistData.full_name })
    } catch (error) {
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
