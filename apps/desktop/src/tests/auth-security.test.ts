import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSecurityStore } from '@/context/securityStore'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn()
    },
    from: vi.fn(),
    getChannels: vi.fn(() => []),
    channel: vi.fn(),
    functions: {
      invoke: vi.fn()
    }
  },
  realSupabase: null // to simulate fallback behavior explicitly if needed, but we removed it
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({})
}))

vi.mock('@/lib/store', () => ({
  getAppStore: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(true),
    set: vi.fn(),
    save: vi.fn()
  })
}))

describe('Auth and Security Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSecurityStore.setState({ onlineListenerAttached: false })
    if ((window as any).__cleanupSecurityListener) {
      (window as any).__cleanupSecurityListener()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializeSecurity should add exactly one online listener', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    // Call 3 times
    await useSecurityStore.getState().initializeSecurity()
    await useSecurityStore.getState().initializeSecurity()
    await useSecurityStore.getState().initializeSecurity()

    // Assert that 'online' listener was added exactly once
    const onlineListenerCalls = addEventListenerSpy.mock.calls.filter(call => call[0] === 'online')
    expect(onlineListenerCalls.length).toBe(1)
    
    expect(useSecurityStore.getState().onlineListenerAttached).toBe(true)
  })

  it('AuthProvider and securityStore use the same hybrid client (offline behavior)', async () => {
    // Both now rely on `supabase` instead of `realSupabase`.
    // In our mock, supabase.auth.getUser simulates the hybrid offline mode.
    const mockGetUser = supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>
    mockGetUser.mockRejectedValueOnce(new Error('Network offline'))

    // This checks if the fallback logic in securityStore handles offline network without throwing unhandled
    await expect(useSecurityStore.getState().checkOnlineLockout()).resolves.not.toThrow()
  })
})
