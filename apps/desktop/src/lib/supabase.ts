// Ater - Hybrid Cloud/Local Resilient Supabase Client
// Seamlessly routes requests to your cloud Supabase database when online, falling back to local mock when offline.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const realSupabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

import { getAppStore } from '@/lib/store'

console.info(`[Supabase] Hybrid client initialized. Real client connected: ${!!realSupabase}`);

// Cache the real user ID in memory after fetching profile to allow the Realtime engine to filter by real cloud UUID
let cachedUserId = 'local-session-user-id'

async function getActivationEmail(): Promise<string | null> {
  try {
    const store = await getAppStore()
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
    getUser: async () => {
      if (realSupabase) {
        try {
          return await realSupabase.auth.getUser()
        } catch {}
      }
      return {
        data: {
          user: {
            id: cachedUserId,
            email: 'user@local.ater',
          } as any
        },
        error: null
      }
    },
    signInWithPassword: async (credentials: { email: string; password: any }) => {
      if (realSupabase) {
        return await realSupabase.auth.signInWithPassword(credentials)
      }
      return {
        data: {
          user: {
            id: cachedUserId,
            email: credentials.email,
          }
        },
        error: null
      }
    },
    signOut: async () => {
      if (realSupabase) return await realSupabase.auth.signOut()
      return { error: null }
    },
    onAuthStateChange: (callback: any) => {
      if (realSupabase) return realSupabase.auth.onAuthStateChange(callback)
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
    if (realSupabase) return realSupabase.channel(name)
    const mockChannel: any = {
      on: () => mockChannel,
      subscribe: () => {}
    }
    return mockChannel
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
    if (realSupabase) {
      return realSupabase.from(table)
    }
    return {
      select: (columns: string = '*') => {
        return {
          eq: (field: string, value: any) => {
            return {
              single: async () => {
                return { data: fallbackProfile, error: null }
              },
              maybeSingle: async () => {
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
                return { data: null, error: null }
              },
              maybeSingle: async () => {
                return { data: null, error: null }
              }
            }
          }
        }
      }
    }
  }
}
