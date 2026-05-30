// Ater - Hybrid Cloud/Local Resilient Supabase Client
// Seamlessly routes requests to your cloud Supabase database when online, falling back to local mock when offline.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

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

export const supabase = {
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
    let query: any = realSupabase ? realSupabase.from(table) : null;

    const builder = {
      _filters: [] as Array<(item: any) => boolean>,
      _orderBy: null as { col: string; ascending: boolean } | null,
      _limit: null as number | null,
      _single: false,

      select: function(columns: string = '*', options?: any) {
        if (query) query = query.select(columns, options);
        return this;
      },
      eq: function(col: string, val: any) {
        if (query) query = query.eq(col, val);
        this._filters.push((item: any) => item[col] === val);
        return this;
      },
      gte: function(col: string, val: any) {
        if (query) query = query.gte(col, val);
        this._filters.push((item: any) => item[col] >= val);
        return this;
      },
      order: function(col: string, opt?: any) {
        if (query) query = query.order(col, opt);
        this._orderBy = { col, ascending: opt?.ascending ?? false };
        return this;
      },
      limit: function(limitNum: number) {
        if (query) query = query.limit(limitNum);
        this._limit = limitNum;
        return this;
      },
      single: function() {
        if (query) query = query.single();
        this._single = true;
        return this;
      },
      maybeSingle: function() {
        if (query) query = query.maybeSingle();
        this._single = true;
        return this;
      },
      update: function(values: any) {
        if (query) query = query.update(values);
        return {
          eq: (col: string, val: any) => {
            if (query) query = query.eq(col, val);
            return {
              then: (cb: any) => {
                if (!realSupabase) return Promise.resolve(cb({ data: null, error: null }));
                return query.then(cb);
              }
            };
          },
          then: (cb: any) => {
            if (!realSupabase) return Promise.resolve(cb({ data: null, error: null }));
            return query.then(cb);
          }
        };
      },
      upsert: function(values: any) {
        if (query) query = query.upsert(values);
        return {
          then: (cb: any) => {
            if (!realSupabase) return Promise.resolve(cb({ data: null, error: null }));
            return query.then(cb);
          }
        };
      },
      insert: function(values: any) {
        if (query) query = query.insert(values);
        return {
          then: (cb: any) => {
            if (!realSupabase) return Promise.resolve(cb({ data: null, error: null }));
            return query.then(cb);
          }
        };
      },
      then: function(cb: any) {
        const executeQuery = async () => {
          if (!realSupabase) {
            // Apply filters
            let filteredData = [fallbackProfile];
            for (const filterFn of this._filters) {
              filteredData = filteredData.filter(filterFn);
            }

            if (this._single) {
              const singleItem = filteredData.length > 0 ? filteredData[0] : null;
              return { data: singleItem, error: singleItem ? null : { code: 'PGRST116' } };
            }

            return { data: filteredData, error: null };
          }

          // Fallback to real Supabase
          return query;
        };
        return executeQuery().then(cb);
      }
    };
    return builder;
  }
} as unknown as SupabaseClient
