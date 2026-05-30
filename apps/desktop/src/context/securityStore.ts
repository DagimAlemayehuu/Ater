import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { supabase } from '@/lib/supabase'
import { getAppStore } from '@/lib/store'


export type LockStatus = 'Active' | 'FeatureLocked' | 'Bricked' | 'LeaseExpired'

interface SecurityState {
  status: LockStatus
  lockedFeatures: string[]
  isChecking: boolean
  lastChecked: Date | null
  creditBalance: number
  initializeSecurity: () => Promise<void>
  checkOnlineLockout: () => Promise<void>
  isFeatureLocked: (feature: string) => boolean
  setSecurityState: (state: Partial<SecurityState>) => void
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  status: 'Active',
  lockedFeatures: [],
  isChecking: false,
  lastChecked: null,
  creditBalance: 0,
  setSecurityState: (state) => set(state),

  initializeSecurity: async () => {
    set({ isChecking: true })
    try {
      // 1. Hydrate security state from local cache in Tauri Rust layer with timeout safeguards
      await Promise.race([
        invoke<string>('load_cached_security_state'),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('load_cached_security_state timeout')), 1500))
      ])
      const securityState = await Promise.race([
        invoke<{ status: LockStatus; locked_features: string[] }>('get_security_state'),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('get_security_state timeout')), 1500))
      ])
      
      set({
        status: securityState.status,
        lockedFeatures: securityState.locked_features,
        lastChecked: new Date(),
      })

      // 2. Fetch remote status and credits if online
      if (navigator.onLine) {
        get().checkOnlineLockout().catch(() => {})
      }

      // Sync remote status immediately upon internet connection restoration
      window.addEventListener('online', () => {
        get().checkOnlineLockout().catch(() => {})
      })
    } catch (err) {
      console.error('[Security System] Failed to load security footprint:', err)
      set({ status: 'LeaseExpired' })
    } finally {
      set({ isChecking: false })
    }
  },

  checkOnlineLockout: async () => {
    try {
      // If not activated, do not perform remote license checks or trigger reload loops
      const store = await getAppStore()
      const isActivated = (await store.get<boolean>('isActivated')) ?? false
      if (!isActivated) return

      // 1. Retrieve session user from Supabase client
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      // 1. Fetch profile from cloud db (optimistic poll-on-action gate)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, account_status, locked_features, credit_balance, is_approved, waitlist_status')
        .eq('id', user.id)
        .maybeSingle()

      // Handle RLS rejection (status code 403 or permission drops)
      if (error) {
        console.warn('[Security System] Remote configuration check failed (RLS blocking or network):', error)
        if ((error as any).status === 403 || error.code === '42501') {
          // Permanently lock interface if banned
          set({ status: 'Bricked', lockedFeatures: [] })
        }
        return
      }

      if (!profile) {
        if (navigator.onLine) {
          console.warn('[Security System] Cloud profile not found while online. Wiping local configurations...')
          try {
            const store = await getAppStore()
            await store.set('isActivated', false)
            await store.set('activationEmail', '')
            await store.set('activationCode', '')
            await store.set('displayName', '')
            await store.set('isProgramConfigured', false)
            await store.save()
          } catch (e) {
            console.error('[Security System] Failed to wipe local store:', e)
          }
          set({ status: 'LeaseExpired', creditBalance: 0, lockedFeatures: [] })
          window.location.hash = '#/onboarding'
          window.location.reload()
        }
        return
      }

      // Establish realtime listener using the resolved real database UUID
      if (profile && profile.id) {
        const existingChannel = supabase.getChannels().find((c: any) => c.name === 'instant-feature-governance')
        if (!existingChannel) {
          supabase
            .channel('instant-feature-governance')
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
              (payload: any) => {
                const { locked_features, account_status, credit_balance, is_approved, waitlist_status } = payload.new;
                const isFullSystemLocked = (locked_features || []).includes('full_system_locked');
                
                if (account_status === 'suspended' || account_status === 'banned' || is_approved === false || waitlist_status === 'revoked' || isFullSystemLocked) {
                  set({ status: 'Bricked', lockedFeatures: locked_features || [] })
                } else {
                  useSecurityStore.getState().setSecurityState({ 
                    status: 'Active',
                    lockedFeatures: locked_features || [],
                    creditBalance: credit_balance ?? 0
                  });
                }
              }
            )
            .on(
              'postgres_changes',
              { event: 'DELETE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
              async () => {
                console.warn('[Security System] Realtime profile deletion detected! Wiping local configuration...');
                try {
                  const store = await getAppStore()
                  await store.set('isActivated', false)
                  await store.set('activationEmail', '')
                  await store.set('activationCode', '')
                  await store.set('displayName', '')
                  await store.set('isProgramConfigured', false)
                  await store.save()
                } catch (e) {
                  console.error('[Security System] Failed to wipe local store on realtime delete:', e)
                }
                set({ status: 'LeaseExpired', creditBalance: 0, lockedFeatures: [] })
                window.location.hash = '#/onboarding'
                window.location.reload()
              }
            )
            .subscribe();
        }
      }

      // Set credit balance from profile
      set({ creditBalance: profile.credit_balance ?? 0 })

      const isFullSystemLocked = (profile.locked_features || []).includes('full_system_locked');

      // If banned, suspended or full-system locked, lock immediately without signature verification
      if (profile.account_status === 'suspended' || profile.account_status === 'banned' || profile.is_approved === false || profile.waitlist_status === 'revoked' || isFullSystemLocked) {
        set({ status: 'Bricked', lockedFeatures: profile.locked_features || [] })
        let machineId = 'unknown-device'
        try {
          machineId = await Promise.race([
            invoke<string>('get_machine_id'),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
          ])
        } catch (err) {
          console.warn('[Security System] Failed to resolve device footprint during lockout, using fallback:', err)
        }

        // Securely request a signed brick lease from the Edge Function so Rust can verify it in Release builds
        let signatureObtained = false
        if (supabase.functions && typeof supabase.functions.invoke === 'function') {
          try {
            const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('generate-security-lease', {
              body: {
                userId: user.id,
                machineIdHash: machineId,
                accountStatus: profile.account_status,
                lockedFeatures: profile.locked_features || []
              }
            })

            if (!edgeErr && edgeData) {
              const { lease_json, signature_hex } = edgeData
              await invoke('process_security_heartbeat', {
                leaseJson: lease_json,
                signatureHex: signature_hex
              })
              signatureObtained = true
            }
          } catch (e) {
            console.warn('[Security System] Failed to get signed brick lease from Edge Function:', e)
          }
        }

        // Only fallback to dummy signature if edge function is unreachable (works in debug, fails in release but UI is already bricked)
        if (!signatureObtained) {
          await invoke('process_security_heartbeat', {
            leaseJson: JSON.stringify({
              user_id: user.id,
              machine_id_hash: machineId,
              expiration: new Date(Date.now() + 86400 * 1000).toISOString(),
              locked_features: profile.locked_features || [],
              account_status: profile.account_status
            }),
            signatureHex: "00".repeat(64) // dummy signature - will force brick state locally in debug mode
          }).catch(() => {})
        }
        return
      }

      // 3. Request signed Ed25519 lease from the Edge Function
      let machineId = 'unknown-device'
      try {
        machineId = await Promise.race([
          invoke<string>('get_machine_id'),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ])
      } catch (err) {
        console.warn('[Security System] Failed to resolve device footprint, falling back to random UUID:', err)
        machineId = crypto.randomUUID()
      }
      let leaseApplied = false

      // Call Supabase Edge function (checking support on mock client too)
      if (supabase.functions && typeof supabase.functions.invoke === 'function') {
        try {
          const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('generate-security-lease', {
            body: {
              userId: user.id,
              machineIdHash: machineId,
              accountStatus: profile.account_status,
              lockedFeatures: profile.locked_features || []
            }
          })

          if (!edgeErr && edgeData) {
            const { lease_json, signature_hex } = edgeData
            // Pass cryptographic token to native Rust layer
            await invoke('process_security_heartbeat', {
              leaseJson: lease_json,
              signatureHex: signature_hex
            })
            leaseApplied = true
          }
        } catch (e) {
          console.warn('[Security System] Edge function invoke errored:', e)
        }
      }

      // Fallback: Local mock signed lease for development / offline testing runs
      if (!leaseApplied) {
        console.info('[Security System] Generating local mock signed lease footprint...')
        const mockLease = {
          user_id: user.id,
          machine_id_hash: machineId,
          expiration: new Date(Date.now() + 86400 * 1000 * 365).toISOString(), // 1 year mock lease duration
          locked_features: profile.locked_features || [],
          account_status: profile.account_status || 'active'
        }
        await invoke('process_security_heartbeat', {
          leaseJson: JSON.stringify(mockLease),
          signatureHex: "00".repeat(64) // accepted under debug_assertions in Rust core
        })
      }

      // Update Zustand in-memory state directly from hydrated Rust state
      const newState = await invoke<{ status: LockStatus; locked_features: string[] }>('get_security_state')
      if (newState) {
        set({
          status: newState.status,
          lockedFeatures: newState.locked_features,
          lastChecked: new Date()
        })
      }
    } catch (err) {
      console.error('[Security System] Background lease sync failed:', err)
    }
  },

  isFeatureLocked: (feature: string) => {
    const { status, lockedFeatures, creditBalance } = get()
    if (status === 'Bricked' || (status === 'LeaseExpired' && feature === 'full-system-lockout')) return true
    
    // Master Mapping logic for robust hackproof lockout checks
    const isAiLocked = lockedFeatures.some(f => ['ai_locked', 'ai-features', 'ai-ingestion'].includes(f)) || creditBalance <= 0
    const isAcademicLocked = lockedFeatures.some(f => ['academic_locked', 'academic-dashboard', 'interactive_quiz'].includes(f))
    const isExplorerLocked = lockedFeatures.some(f => ['explorer_locked', 'explorer-lockout', 'file_ingestion', 'vector_search'].includes(f))

    if (status === 'LeaseExpired') {
      const serverDependentFeatures = [
        'ai-ingestion', 
        'oracle-chat', 
        'practice-recall', 
        'file_ingestion', 
        'vector_search', 
        'ater_generation', 
        'ater_chat', 
        'ater_oracle_chat', 
        'interactive_quiz',
        'explain-features'
      ]
      if (serverDependentFeatures.includes(feature)) return true
    }

    // AI lockout group checks
    const aiGroup = ['ai-ingestion', 'oracle-chat', 'practice-recall', 'ater_generation', 'ater_chat', 'ater_oracle_chat', 'ai-features', 'ai_locked', 'explain-features']
    if (isAiLocked && aiGroup.includes(feature)) return true

    // Academic lockout group checks
    const academicGroup = ['interactive_quiz', 'academic-dashboard', 'academic_locked']
    if (isAcademicLocked && academicGroup.includes(feature)) return true

    // Explorer lockout group checks
    const explorerGroup = ['file_ingestion', 'explorer-lockout', 'explorer_locked', 'vector_search']
    if (isExplorerLocked && explorerGroup.includes(feature)) return true

    return lockedFeatures.includes(feature)
  }
}))

