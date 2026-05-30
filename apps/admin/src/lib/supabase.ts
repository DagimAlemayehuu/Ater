import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';

// Initialize the real supabase client as base fallback
const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if we should activate the mock bypass layer
const checkBypass = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('bypass') === 'true' || 
         window.location.hash.includes('bypass=true');
};

// Rich Mock Telemetry Data
const MOCK_PROFILES = [
  { id: 'usr_1', email: 'alice.vance@mit.edu', full_name: 'Alice Vance', role: 'admin', is_approved: true, waitlist_status: 'approved', created_at: '2026-05-15T12:00:00Z' },
  { id: 'usr_2', email: 'bob.chen@stanford.edu', full_name: 'Bob Chen', role: 'User', is_approved: true, waitlist_status: 'approved', created_at: '2026-05-18T14:30:00Z' },
  { id: 'usr_3', email: 'charlie.smith@berkeley.edu', full_name: 'Charlie Smith', role: 'User', is_approved: false, waitlist_status: 'revoked', created_at: '2026-05-20T09:15:00Z' },
  { id: 'usr_4', email: 'dana.white@harvard.edu', full_name: 'Dana White', role: 'User', is_approved: true, waitlist_status: 'approved', created_at: '2026-05-22T17:45:00Z' },
  { id: 'usr_5', email: 'elisa.graham@oxford.ac.uk', full_name: 'Elisa Graham', role: 'User', is_approved: true, waitlist_status: 'approved', created_at: '2026-05-24T11:10:00Z' },
  { id: 'usr_6', email: 'feynman.richard@caltech.edu', full_name: 'Richard Feynman', role: 'User', is_approved: true, waitlist_status: 'approved', created_at: '2026-05-25T16:20:00Z' }
];

const MOCK_WAITLIST = [
  { id: 'wl_1', email: 'elena.rostova@oxford.ac.uk', full_name: 'Elena Rostova', status: 'pending', created_at: '2026-05-28T08:00:00Z', activation_code: null },
  { id: 'wl_2', email: 'frank.miller@caltech.edu', full_name: 'Frank Miller', status: 'approved', created_at: '2026-05-25T11:20:00Z', activation_code: 'XJ9K4P2L' },
  { id: 'wl_3', email: 'grace.hopper@yale.edu', full_name: 'Grace Hopper', status: 'rejected', created_at: '2026-05-24T16:40:00Z', activation_code: null },
  { id: 'wl_4', email: 'henry.cavil@cam.ac.uk', full_name: 'Henry Cavil', status: 'pending', created_at: '2026-05-29T10:05:00Z', activation_code: null },
  { id: 'wl_5', email: 'ida.lovelace@london.ac.uk', full_name: 'Ada Lovelace', status: 'pending', created_at: '2026-05-29T14:40:00Z', activation_code: null }
];

const MOCK_SETTINGS = [
  {
    id: 'global_config',
    config: {
      token_price_per_1k: 0.002,
      registration_open: true,
      engine_version: "1.2.5",
      github_pat: "ghp_mockPersonalAccessTokenForAterDeploymentFlow"
    },
    updated_at: '2026-05-28T18:00:00Z'
  }
];

const MOCK_USAGE_LOGS = Array.from({ length: 42 }).map((_, idx) => {
  const d = new Date();
  d.setDate(d.getDate() - (idx % 7));
  d.setMinutes(d.getMinutes() - idx * 25);
  const models = ['gemini-2.0-flash', 'gpt-4o', 'claude-3-5-sonnet-latest', 'llama-3.3-70b-versatile'];
  const features = ['oracle-chat', 'file-ingestion', 'spaced-recall', 'curriculum-compile'];
  const domains = ['Computer Science', 'Mathematics', 'Physics', 'Biology'];
  return {
    id: `log_${idx}`,
    model_name: models[idx % models.length],
    academic_domain: domains[idx % domains.length],
    feature_type: features[idx % features.length],
    token_count: 1200 + (idx * 243) % 2500,
    created_at: d.toISOString()
  };
});

// Intercept window.fetch for GitHub APIs in mock bypass mode
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input as Request).url || '';
    
    if (checkBypass()) {
      // 1. GitHub Action Runs mock
      if (url.includes('actions/runs')) {
        return new Response(JSON.stringify({
          workflow_runs: [
            {
              id: 9982401,
              status: 'completed',
              conclusion: 'success',
              html_url: 'https://github.com/DagimAlemayehuu/Ater/actions/runs/9982401',
              head_branch: 'main',
              head_sha: 'a1b2c3d4e5f6g7h8i9j0',
              created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
              event: 'push',
              display_title: 'Deploy Production OTA build v1.2.5'
            },
            {
              id: 9982402,
              status: 'completed',
              conclusion: 'success',
              html_url: 'https://github.com/DagimAlemayehuu/Ater/actions/runs/9982402',
              head_branch: 'release-candidate',
              head_sha: 'f6g7h8i9j0a1b2c3d4e5',
              created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
              event: 'pull_request',
              display_title: 'Compile macOS universal native bundle'
            },
            {
              id: 9982403,
              status: 'in_progress',
              conclusion: null,
              html_url: 'https://github.com/DagimAlemayehuu/Ater/actions/runs/9982403',
              head_branch: 'feature/socratic-chat',
              head_sha: 'c3d4e5f6g7h8i9j0a1b2',
              created_at: new Date(Date.now() - 600000).toISOString(),
              event: 'workflow_dispatch',
              display_title: 'Actuate vector ingestion pipeline tests'
            },
            {
              id: 9982404,
              status: 'completed',
              conclusion: 'failure',
              head_branch: 'patch-fsrs',
              head_sha: 'e5f6g7h8i9j0a1b2c3d4',
              created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
              event: 'push',
              display_title: 'Tauri platform diagnostic compiler tests'
            }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 2. GitHub Releases Mock
      if (url.includes('releases')) {
        return new Response(JSON.stringify([
          {
            id: 887201,
            name: 'Ater Sovereign Node Release v1.2.5',
            tag_name: 'v1.2.5',
            draft: false,
            published_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
            body: `### What's New\n- **Unified Calendar Grid**: Integrated all exam schedules and course tasks.\n- **Socratic reasoning model**: Enabled local Gemini-2.5-pro vector context.\n- **FSRS scheduler**: Calibrated memory recall decay stability.\n- **Universal installer bundles**: Released compiled binaries for macOS and Windows.`,
            html_url: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/tag/v1.2.5',
            assets: [
              {
                id: 77201,
                name: 'Ater_1.2.5_x64.dmg',
                browser_download_url: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/download/v1.2.5/Ater_1.2.5_x64.dmg',
                download_count: 3410,
                size: 68157440
              },
              {
                id: 77202,
                name: 'Ater_1.2.5_x64.msi',
                browser_download_url: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/download/v1.2.5/Ater_1.2.5_x64.msi',
                download_count: 1405,
                size: 75497472
              }
            ]
          },
          {
            id: 887202,
            name: 'Ater Compiler Draft v1.3.0-rc1',
            tag_name: 'v1.3.0-rc1',
            draft: true,
            published_at: null,
            created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
            body: `Draft release for Tauri actions testing. Unstable build. Includes debug profiles.`,
            html_url: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/tag/v1.3.0-rc1',
            assets: []
          }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    return originalFetch(input, init);
  };
}

// Custom Mock Supabase Client Proxy
const mockSupabase: any = {
  channel: () => ({
    on: function() { return this; },
    subscribe: () => ({})
  }),
  removeChannel: () => {},
  
  from: (table: string) => {
    return {
      select: (columns: string, options?: any) => {
        const execute = async () => {
          if (checkBypass()) {
            if (table === 'profiles') {
              if (options?.count) {
                return { data: null, count: MOCK_PROFILES.length, error: null };
              }
              return { data: MOCK_PROFILES, error: null };
            }
            if (table === 'waiting_list') {
              if (options?.count) {
                return { data: null, count: MOCK_WAITLIST.filter(w => w.status === 'pending').length, error: null };
              }
              return { data: MOCK_WAITLIST, error: null };
            }
            if (table === 'app_settings') {
              return { data: MOCK_SETTINGS, error: null };
            }
            if (table === 'usage_logs') {
              return { data: MOCK_USAGE_LOGS, error: null };
            }
            if (table === 'credit_ledger') {
              const mockLedger = [
                { amount: -240, created_at: new Date().toISOString(), feature_slug: 'oracle-chat' },
                { amount: -580, created_at: new Date().toISOString(), feature_slug: 'file-ingestion' },
                { amount: -600, created_at: new Date().toISOString(), feature_slug: 'spaced-recall' }
              ];
              return { data: mockLedger, error: null };
            }
          }
          
          // Fallback to real supabase calls if not bypassed
          return realSupabase.from(table).select(columns, options);
        };
        
        return {
          order: (col: string, opt?: any) => {
            const executeOrder = async () => {
              if (checkBypass()) {
                const res = await execute();
                if (res.data) {
                  return {
                    data: [...res.data].sort((a: any, b: any) => {
                      const valA = a[col];
                      const valB = b[col];
                      if (opt?.ascending) return valA > valB ? 1 : -1;
                      return valA < valB ? 1 : -1;
                    }),
                    error: null
                  };
                }
                return res;
              }
              return realSupabase.from(table).select(columns, options).order(col, opt);
            };
            
            return {
              limit: (limitNum: number) => {
                return {
                  then: (cb: any) => executeOrder().then(res => {
                    if (res.data) res.data = res.data.slice(0, limitNum);
                    return cb(res);
                  })
                };
              },
              then: (cb: any) => executeOrder().then(cb)
            };
          },
          eq: (col: string, val: any) => {
            const executeEq = async () => {
              if (checkBypass()) {
                const res = await execute();
                if (res.data) {
                  return { data: res.data.filter((item: any) => item[col] === val), error: null };
                }
                return res;
              }
              return realSupabase.from(table).select(columns, options).eq(col, val);
            };
            
            return {
              single: () => {
                return {
                  then: (cb: any) => executeEq().then(res => {
                    const singleData = res.data && res.data.length > 0 ? res.data[0] : null;
                    return cb({ data: singleData, error: singleData ? null : { code: 'PGRST116' } });
                  })
                };
              },
              then: (cb: any) => executeEq().then(cb)
            };
          },
          gte: (col: string, val: any) => {
            return {
              order: (c: string, o?: any) => {
                return {
                  then: (cb: any) => execute().then(cb)
                };
              },
              then: (cb: any) => execute().then(cb)
            };
          },
          then: (cb: any) => execute().then(cb)
        };
      },
      update: (values: any) => ({
        eq: (col: string, val: any) => ({
          then: (cb: any) => cb({ error: null })
        })
      }),
      upsert: (values: any) => ({
        then: (cb: any) => cb({ error: null })
      }),
      insert: (values: any) => ({
        then: (cb: any) => cb({ error: null })
      })
    };
  }
};

export const supabase = typeof window !== 'undefined' ? mockSupabase : realSupabase;
