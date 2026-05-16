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
        .select('is_approved, waitlist_status, full_name, machine_id, is_configured')
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
        const isHardwareMismatch = profile.machine_id && profile.machine_id !== localMachineId;
        if (profile.is_approved === false || profile.waitlist_status === 'revoked' || isHardwareMismatch) {
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
          
          // ── SYNC ONBOARDING STATUS (v33.3) ──
          // Ensure local config matches database. If DB says not configured, force onboarding.
          if (profile.is_configured === false && config?.isProgramConfigured === true) {
            console.warn('[Auth] Database says not configured. Forcing onboarding reset.')
            await saveConfig({ isProgramConfigured: false })
          } else if (profile.is_configured === true && config?.isProgramConfigured === false) {
            console.log('[Auth] Database says configured. Updating local flag.')
            await saveConfig({ isProgramConfigured: true })
          }
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
    setError(null)
    console.log('[DRM] Starting activation...')

    try {
      // 1. Authenticate with Supabase Auth
      console.log('[DRM] Authenticating with Supabase...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        console.error('[DRM] Supabase Auth Failed:', authError?.message);
        throw new Error(`Authentication failed: ${authError?.message || 'Check your credentials.'}`)
      }
      console.log('[DRM] Authentication successful.');

      // 2. Fetch User Profile
      console.log('[DRM] Fetching user profile from database...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
        
      if (profileError || !profile) {
        console.error('[DRM] Profile fetch failed:', profileError?.message);
        throw new Error(`Profile not found: ${profileError?.message}`)
      }
      console.log('[DRM] Profile received:', profile);

      // Check 1: Key Match (Case-Insensitive)
      console.log('[DRM] Verifying Activation Key...');
      if (code.toUpperCase() !== profile.activation_code?.toUpperCase()) {
        console.error('[DRM] Activation Key mismatch.');
        throw new Error('Invalid activation code for this account.')
      }
      console.log('[DRM] Activation Key is valid.');

      // Check 2: Hardware Lock
      console.log('[DRM] Fetching machine_id from Rust core...');
      const localMachineId = await sidecarApi.getMachineId()
      console.log('[DRM] Machine ID received:', localMachineId);

      if (!profile.machine_id) {
        // First login - Burn the key
        console.log('[DRM] First-time activation. Attempting to burn machine_id to database...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            machine_id: localMachineId,
            waitlist_status: 'approved',
            is_approved: true 
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('[DRM] Failed to burn machine_id:', updateError.message);
          throw new Error(`Failed to activate device: ${updateError.message}`)
        }
        console.log('[DRM] Machine ID successfully burned.');
      } else {
        // Subsequent login - Check hardware
        console.log('[DRM] Verifying Hardware Lock...');
        if (profile.machine_id !== localMachineId) {
          console.error('[DRM] Hardware mismatch detected!');
          throw new Error('Unauthorized Device. This activation key is already bound to another computer.')
        }
        console.log('[DRM] Hardware lock passed.');
      }

      // Check 3: Final Status Check
      if (profile.is_approved === false || profile.waitlist_status === 'revoked') {
        throw new Error('Access for this account has been revoked.')
      }

      await saveConfig({ 
        isActivated: true, 
        activationEmail: email, 
        activationCode: code,
        isProgramConfigured: false,
        displayName: profile.full_name || ''
      })
      
      setStatus('approved')
      setProfile({ full_name: profile.full_name })
      console.log('[DRM] Activation sequence complete. Access granted.');
    } catch (error: any) {
      console.error('[DRM] FATAL ERROR:', error.message);
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
