import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useConfig } from '@/lib/ConfigContext'

export type WaitlistStatus = 'pending' | 'approved' | 'rejected'

interface AuthContextType {
  isActivated: boolean
  activationData: { email: string; code: string } | null
  status: WaitlistStatus | null
  loading: boolean
  activate: (email: string, code: string) => Promise<void>
  refreshStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { config, saveConfig, isLoading: configLoading } = useConfig()
  const [status, setStatus] = useState<WaitlistStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkActivation = async () => {
    if (!config?.isActivated || !config?.activationEmail || !config?.activationCode) {
      setLoading(false)
      return
    }

    // Verify code still valid and get status
    const { data, error } = await supabase
      .from('waiting_list')
      .select('status')
      .eq('email', config.activationEmail)
      .eq('activation_code', config.activationCode)
      .single()

    if (error || !data) {
      // If code is no longer valid, deactivate
      await saveConfig({ isActivated: false, activationEmail: '', activationCode: '' })
      setStatus(null)
    } else {
      setStatus(data.status as WaitlistStatus)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!configLoading) {
      checkActivation()
    }
  }, [configLoading])

  const activate = async (email: string, code: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('waiting_list')
      .select('status')
      .eq('email', email)
      .eq('activation_code', code)
      .single()

    if (error || !data) {
      setLoading(false)
      throw new Error('Invalid activation code or email.')
    }

    if (data.status !== 'approved') {
      setLoading(false)
      throw new Error('Access for this account is still pending.')
    }

    // Map machine (generate if needed)
    const machineId = Math.random().toString(36).substring(7).toUpperCase()

    // Update profile with machine mapping (upsert based on email)
    await supabase
      .from('profiles')
      .upsert({ 
        email, 
        activation_code: code,
        machine_id: machineId,
        waitlist_status: 'approved',
        is_approved: true 
      }, { onConflict: 'email' })

    await saveConfig({ 
      isActivated: true, 
      activationEmail: email, 
      activationCode: code 
    })
    
    setStatus('approved')
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
