// Ater - Resilient Local/Offline Supabase Mock
// Completely removes remote database dependency, preventing startup freezes and key requirements.

console.info('[Supabase] Offline/Local mock auth client loaded successfully.');

export const supabase: any = {
  auth: {
    getUser: async () => ({
      data: {
        user: {
          id: 'local-session-user-id',
          email: 'user@local.ater',
        } as any
      },
      error: null
    }),
    signInWithPassword: async ({ email }: { email: string }) => ({
      data: {
        user: {
          id: 'local-session-user-id',
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
  from: (..._args: any[]) => {
    return {
      select: (..._args2: any[]) => {
        return {
          eq: (..._args3: any[]) => {
            return {
              single: async () => {
                return {
                  data: {
                    id: 'local-session-user-id',
                    full_name: 'Local User',
                    activation_code: 'ATER-PRO',
                    waitlist_status: 'approved',
                    is_approved: true,
                    is_configured: true,
                    machine_id: ''
                  },
                  error: null
                }
              },
              maybeSingle: async () => {
                return {
                  data: {
                    activation_code: 'ATER-PRO'
                  },
                  error: null
                }
              }
            }
          }
        }
      },
      update: (..._args4: any[]) => {
        return {
          eq: (..._args5: any[]) => {
            return {
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null })
            }
          }
        }
      }
    }
  }
}
