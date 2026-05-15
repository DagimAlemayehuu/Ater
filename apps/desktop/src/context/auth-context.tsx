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

    // ── OPTIMISTIC AUTH (v33.2) ──
    // If we have local activation, assume success immediately to skip "Verifying" screen.
    // We check in the background and only kick them out if definitively revoked.
    setLoading(false)
    setStatus('approved')

    try {
      // Use getUser to ensure the session is still valid
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('[Auth] No active session. Deactivating...')
        await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
        setStatus(null)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_approved, waitlist_status, full_name, machine_id')
        .eq('id', user.id)
        .single()

      const localMachineId = await sidecarApi.getMachineId()

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('[Auth] Profile not found. Deactivating...');
          await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
          setStatus(null)
        } else {
          console.warn('[Auth] Network failure during verification. Maintaining session.')
        }
      } else if (!profile) {
        await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
        setStatus(null)
      } else {
        // Heartbeat Kill Switch
        if (profile.is_approved === false || profile.waitlist_status === 'revoked' || profile.machine_id !== localMachineId) {
          console.error('[Auth] Access revoked or hardware mismatch detected!')
          
          // Wipe everything
          await supabase.auth.signOut()
          await saveConfig({ 
            isActivated: false, 
            activationEmail: '', 
            activationCode: '',
            isProgramConfigured: false,
            displayName: '',
            geminiApiKey: '',
            aiApiKey: '',
            savedApiKeys: []
          })
          
          // NOTE: Stronghold deletion would ideally happen here too if we have a direct helper
          // For now, clearing the config flags is the primary way to trigger re-onboarding/lockout
          
          setStatus('rejected') // This triggers the Access Restricted screen in AuthGuard
          setProfile(null)
        } else {
          setStatus('approved')
          setProfile({ full_name: profile.full_name })
        }
      }
    } catch (err) {
      console.error('[Auth] Verification failed:', err)
    }
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

      // 2. Fetch User Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
        
      if (profileError || !profile) {
        throw new Error('Profile not found.')
      }

      // Check 1: Key Match
      if (code !== profile.activation_code) {
        throw new Error('Invalid activation code for this account.')
      }

      // Check 2: Hardware Lock
      const localMachineId = await sidecarApi.getMachineId()

      if (!profile.machine_id) {
        // First login - Burn the key
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            machine_id: localMachineId,
            waitlist_status: 'approved',
            is_approved: true 
          })
          .eq('id', authData.user.id)

        if (updateError) throw new Error('Failed to bind device. Please try again.')
      } else {
        // Subsequent login - Check hardware
        if (profile.machine_id !== localMachineId) {
          throw new Error('Unauthorized Device. This activation key is already bound to another computer.')
        }
      }

      // Check 3: Final Status Check
      if (profile.is_approved === false || profile.waitlist_status === 'revoked') {
        throw new Error('Access for this account has been revoked.')
      }

      await saveConfig({ 
        isActivated: true, 
        activationEmail: email, 
        activationCode: code 
      })
      
      setStatus('approved')
      setProfile({ full_name: profile.full_name })
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
