import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Initialize the real supabase client as base fallback
const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if we should activate the mock bypass layer for design captures
const checkBypass = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('bypass') === 'true' || 
         window.location.hash.includes('bypass=true');
};

// Check which status we want to simulate
const getSimulatedStatus = () => {
  if (typeof window === 'undefined') return 'pending';
  const params = new URLSearchParams(window.location.search);
  return params.get('status') === 'approved' ? 'approved' : 'pending';
};

// Custom Hybrid Supabase Client Proxy
const hybridSupabase = new Proxy(realSupabase, {
  get(target, prop, receiver) {
    if (prop === 'auth') {
      const realAuth = target.auth;
      return new Proxy(realAuth, {
        get(authTarget, authProp, authReceiver) {
          if (checkBypass()) {
            if (authProp === 'getSession') {
              return async () => {
                const mockUser = {
                  id: 'usr_mock_1',
                  email: 'alice.vance@mit.edu',
                  user_metadata: { full_name: 'Alice Vance' }
                };
                return { data: { session: { user: mockUser } }, error: null };
              };
            }
            if (authProp === 'onAuthStateChange') {
              return (cb: any) => {
                const mockUser = {
                  id: 'usr_mock_1',
                  email: 'alice.vance@mit.edu',
                  user_metadata: { full_name: 'Alice Vance' }
                };
                setTimeout(() => {
                  cb('SIGNED_IN', { user: mockUser });
                }, 10);
                return { data: { subscription: { unsubscribe: () => {} } } };
              };
            }
            if (authProp === 'signOut') {
              return async () => {
                return { error: null };
              };
            }
          }
          // Default: forward to real auth
          const val = Reflect.get(authTarget, authProp, authReceiver);
          return typeof val === 'function' ? val.bind(authTarget) : val;
        }
      });
    }

    if (prop === 'from') {
      return (table: string) => {
        if (checkBypass() && table === 'waiting_list') {
          return {
            select: (cols: string = '*') => ({
              eq: (col: string, val: any) => ({
                maybeSingle: async () => {
                  const status = getSimulatedStatus();
                  return {
                    data: {
                      id: 'wl_mock_1',
                      email: val,
                      full_name: 'Alice Vance',
                      status: status,
                      created_at: new Date().toISOString(),
                      activation_code: status === 'approved' ? 'ATER-XJ9K4P2L' : null
                    },
                    error: null
                  };
                }
              })
            })
          };
        }
        return target.from(table);
      };
    }

    // Default: forward to real client
    const val = Reflect.get(target, prop, receiver);
    return typeof val === 'function' ? val.bind(target) : val;
  }
});

export const supabase = hybridSupabase;
