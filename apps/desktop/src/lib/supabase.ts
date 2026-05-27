// Ater - Hybrid Cloud/Local Resilient Supabase Client
// Seamlessly routes requests to your cloud Supabase database when online, falling back to local mock when offline.

import { createClient } from '@supabase/supabase-js'
import { load } from '@tauri-apps/plugin-store'

const STORE_FILENAME = 'ater_config.json'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const realSupabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

console.info(`[Supabase] Hybrid client initialized. Real client connected: ${!!realSupabase}`);

// Cache the real user ID in memory after fetching profile to allow the Realtime engine to filter by real cloud UUID
let cachedUserId = 'local-session-user-id'

async function getActivationEmail(): Promise<string | null> {
  try {
    const store = await load(STORE_FILENAME, { autoSave: true, defaults: {} })
    const email = await store.get<string>('activationEmail')
    return email ?? null
  } catch {
    return null
  }
}

// Fallback mock profile payload
const fallbackProfile = {
  id: 'local-session-user-id',
  full_name: 'Local User',
  activation_code: 'ATER-PRO',
  waitlist_status: 'approved',
  is_approved: true,
  is_configured: true,
  machine_id: '',
  credit_balance: 100,
  locked_features: []
}

export const supabase: any = {
  auth: {
    getUser: async () => ({
      data: {
        user: {
          id: cachedUserId,
          email: 'user@local.ater',
        } as any
      },
      error: null
    }),
    signInWithPassword: async ({ email }: { email: string }) => ({
      data: {
        user: {
          id: cachedUserId,
          email: email,
        }
      },
      error: null
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  },
  // Expose original channels functions for realtime subscription
  getChannels: () => {
    return realSupabase ? realSupabase.getChannels() : []
  },
  channel: (name: string) => {
    return realSupabase ? realSupabase.channel(name) : {
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    }
  },
  removeChannel: (channel: any) => {
    if (realSupabase) realSupabase.removeChannel(channel)
  },
  // Expose Edge functions invocation support
  functions: {
    invoke: async (name: string, options?: any) => {
      if (realSupabase) {
        try {
          return await realSupabase.functions.invoke(name, options)
        } catch (e) {
          console.warn('[Supabase Hybrid] Edge Function invoke failed:', e)
        }
      }
      return { data: null, error: new Error('Offline mock active') }
    }
  },
  from: (table: string) => {
    return {
      select: (columns: string = '*') => {
        return {
          eq: (field: string, value: any) => {
            return {
              single: async () => {
                if (realSupabase && table === 'profiles') {
                  const email = await getActivationEmail()
                  if (email) {
                    const { data, error } = await realSupabase
                      .from('profiles')
                      .select(columns)
                      .eq('email', email)
                      .maybeSingle()
                    if (!error && data) {
                      if ((data as any).id) cachedUserId = (data as any).id
                      return { data, error: null }
                    }
                  }
                  // When online with real client, return null if no profile exists
                  return { data: null, error: null }
                }
                return { data: fallbackProfile, error: null }
              },
              maybeSingle: async () => {
                if (realSupabase && table === 'profiles') {
                  const email = await getActivationEmail()
                  if (email) {
                    const { data, error } = await realSupabase
                      .from('profiles')
                      .select(columns)
                      .eq('email', email)
                      .maybeSingle()
                    if (!error && data) {
                      if ((data as any).id) cachedUserId = (data as any).id
                      return { data, error: null }
                    }
                  }
                  // When online with real client, return null if no profile exists
                  return { data: null, error: null }
                }
                return { data: fallbackProfile, error: null }
              }
            }
          }
        }
      },
      update: (values: any) => {
        return {
          eq: (field: string, value: any) => {
            return {
              single: async () => {
                if (realSupabase && table === 'profiles') {
                  const email = await getActivationEmail()
                  if (email) {
                    const { data, error } = await realSupabase
                      .from('profiles')
                      .update(values)
                      .eq('email', email)
                      .select()
                      .maybeSingle()
                    return { data, error }
                  }
                }
                return { data: null, error: null }
              },
              maybeSingle: async () => {
                if (realSupabase && table === 'profiles') {
                  const email = await getActivationEmail()
                  if (email) {
                    const { data, error } = await realSupabase
                      .from('profiles')
                      .update(values)
                      .eq('email', email)
                      .select()
                      .maybeSingle()
                    return { data, error }
                  }
                }
                return { data: null, error: null }
              }
            }
          }
        }
      }
    }
  }
}
