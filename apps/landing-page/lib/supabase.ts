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

const mockSupabase: any = {
  auth: {
    getSession: async () => {
      if (checkBypass()) {
        const mockUser = {
          id: 'usr_mock_1',
          email: 'alice.vance@mit.edu',
          user_metadata: { full_name: 'Alice Vance' }
        };
        return { data: { session: { user: mockUser } }, error: null };
      }
      return realSupabase.auth.getSession();
    },
    onAuthStateChange: (cb: any) => {
      if (checkBypass()) {
        const mockUser = {
          id: 'usr_mock_1',
          email: 'alice.vance@mit.edu',
          user_metadata: { full_name: 'Alice Vance' }
        };
        // Trigger callback with mock session immediately
        setTimeout(() => {
          cb('SIGNED_IN', { user: mockUser });
        }, 10);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      return realSupabase.auth.onAuthStateChange(cb);
    },
    signOut: async () => {
      return { error: null };
    }
  },
  
  from: (table: string) => {
    if (checkBypass() && table === 'waiting_list') {
      return {
        select: (cols: string) => ({
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
    return realSupabase.from(table);
  }
};

export const supabase = typeof window !== 'undefined' ? mockSupabase : realSupabase;
