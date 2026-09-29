import '@testing-library/jest-dom/vitest';
import * as dotenv from 'dotenv';
import path from 'path';
import { vi } from 'vitest';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Provide safe test fallback environment variables if not present (e.g. in CI)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-test.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-test-isolation';
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'mock-gemini-key-for-test-isolation';
}

// Isolated Supabase Client Mock to prevent network calls and FK timeouts in tests
export const createMockQueryBuilder = () => {
  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
    upsert: vi.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
    update: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    neq: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    limit: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
    then: (resolve: any, reject?: any) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  };
  return builder;
};

export const mockSupabaseClient = {
  from: vi.fn().mockImplementation(() => createMockQueryBuilder()),
  auth: {
    getSession: vi.fn().mockImplementation(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: vi.fn().mockImplementation(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn().mockImplementation(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signUp: vi.fn().mockImplementation(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signOut: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn().mockImplementation(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  channel: vi.fn().mockImplementation(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => mockSupabaseClient),
}));

if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.clear !== 'function')) {
  let store: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

if (typeof window !== 'undefined' && typeof window.SVGElement !== 'undefined') {
  if (!(window.SVGElement.prototype as any).getBBox) {
    (window.SVGElement.prototype as any).getBBox = function () {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => {},
      };
    };
  }
}

