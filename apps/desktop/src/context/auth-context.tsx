import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, realSupabase } from '@/lib/supabase'
import { useConfig } from '@/lib/ConfigContext'
import { sidecarApi } from '@/lib/sidecarApi'
import { validateActivationMachineBinding } from '@/lib/activationMachineBinding'

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

    // Set optimistic state first
    setStatus('approved')
    setProfile({ full_name: config.displayName || config.activationEmail.split('@')[0] })
    setLoading(false)

    // Dynamic Zero-Trust check: verify cloud status silently on startup if online
    if (navigator.onLine && realSupabase) {
      try {
        const { data: authData } = await realSupabase.auth.getUser()
        if (authData?.user) {
          const { data: profileData } = await realSupabase
            .from('profiles')
            .select('full_name, waitlist_status, is_approved, account_status')
            .eq('id', authData.user.id)
            .single()

          if (profileData) {
            const isBricked = profileData.account_status === 'suspended' || 
                              profileData.account_status === 'banned' || 
                              profileData.is_approved === false || 
                              profileData.waitlist_status === 'revoked';
            
            if (isBricked) {
              console.warn('[DRM] Zero-Trust background check failed. Clearance revoked.');
              await saveConfig({
                isActivated: false,
                activationEmail: '',
                activationCode: '',
                isProgramConfigured: false,
                displayName: ''
              })
              setStatus(null)
              setProfile(null)
              window.location.hash = '#/onboarding'
              window.location.reload()
            }
          }
        }
      } catch (err) {
        console.warn('[DRM] Failed to run startup background clearance check:', err)
      }
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
    console.log('[DRM] Starting activation sequence...')

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim().toUpperCase();

      // Basic format validations
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail) || cleanEmail.length < 5) {
        throw new Error('Please enter a valid email address.')
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.')
      }
      if (cleanCode.length < 6) {
        throw new Error('Invalid activation code. Code must be at least 6 characters.')
      }

      // Simulate a processing delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      let derivedName = cleanEmail.split('@')[0].replace(/[\._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      // Live verification if real backend configuration exists
      if (realSupabase) {
        const liveSupabase = realSupabase
        console.log('[DRM] Live backend active. Checking waitlist credentials...');
        
        // 1. Sign in to check email & password
        const { data: authData, error: authError } = await liveSupabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authError) {
          throw new Error(authError.message || 'Incorrect password or account does not exist.');
        }

        if (!authData?.user) {
          throw new Error('Failed to retrieve user session.');
        }

        // 2. Fetch the user profile
        const { data: profileData, error: profileError } = await liveSupabase
          .from('profiles')
          .select('full_name, waitlist_status, is_approved, activation_code, account_status, machine_id')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error('Waitlist activation profile not found. Please sign up for the waitlist.');
        }

        // 3. Check status validation
        if (profileData.account_status && profileData.account_status !== 'active') {
          throw new Error(`Your account status is currently ${profileData.account_status}. Please contact support.`);
        }

        if (profileData.waitlist_status !== 'approved' || profileData.is_approved !== true) {
          throw new Error('Your waitlist status is not approved yet.');
        }

        const dbCode = (profileData.activation_code || '').trim().toUpperCase();
        if (dbCode !== cleanCode) {
          throw new Error('Invalid activation code. Please check your waitlist approval email.');
        }

        if (profileData.full_name) {
          derivedName = profileData.full_name;
        }

        // 4. Validate and Bind Machine ID Hash
        await validateActivationMachineBinding({
          profileMachineId: profileData.machine_id,
          fetchMachineId: async () => {
            const { invoke } = await import('@tauri-apps/api/core')
            return invoke<string>('get_machine_id')
          },
          bindMachineId: async (machineId) => {
            console.log('[DRM] Binding activation key to this device...')
            const { error: updateError } = await liveSupabase
              .from('profiles')
              .update({ machine_id: machineId })
              .eq('id', authData.user.id)
            
            if (updateError) {
              console.error('[DRM] Failed to bind machine ID:', updateError)
              throw new Error('Failed to bind activation key to this device. Please try again.')
            }
          }
        })
      }

      // Reset any leftover simulation/tour state so the welcome screen
      // always shows correctly on fresh login.
      await saveConfig({
        isActivated: true,
        activationEmail: cleanEmail,
        activationCode: cleanCode,
        isProgramConfigured: false,
        displayName: derivedName,
        isDemoMode: false,
        appMode: 'real',
        walkthroughCompleted: false,
        walkthroughMilestone: '1.6',
        walkthroughStatus: 'inactive',
      } as any)
      
      setStatus('approved')
      setProfile({ full_name: derivedName })
      console.log('[DRM] Activation sequence complete. Access granted.');
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
