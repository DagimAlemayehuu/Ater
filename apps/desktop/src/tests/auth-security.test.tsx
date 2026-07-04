import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSecurityStore } from '@/context/securityStore'

// Mocking dependencies for tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd: string) => {
    if (cmd === 'load_cached_security_state') return Promise.resolve('ok')
    if (cmd === 'get_security_state') return Promise.resolve({ status: 'Active', locked_features: [] })
    return Promise.resolve()
  })
}))

vi.mock('@/lib/store', () => ({
  getAppStore: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn()
  }))
}))

describe('Security Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSecurityStore.setState({
      status: 'Active',
      lockedFeatures: [],
      isChecking: false,
      lastChecked: null,
      creditBalance: 20,
      isOnlineListenerRegistered: false,
    })
  })

  afterEach(() => {
    useSecurityStore.getState().cleanup()
  })

  it('initializeSecurity does not duplicate the online listener', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    // Call multiple times
    await useSecurityStore.getState().initializeSecurity()
    await useSecurityStore.getState().initializeSecurity()
    await useSecurityStore.getState().initializeSecurity()

    // Ensure it was only registered once
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    
    addEventListenerSpy.mockRestore()
  })

  it('cleans up the listener correctly', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    
    await useSecurityStore.getState().initializeSecurity()
    expect(useSecurityStore.getState().isOnlineListenerRegistered).toBe(true)

    useSecurityStore.getState().cleanup()
    
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(useSecurityStore.getState().isOnlineListenerRegistered).toBe(false)
    
    removeEventListenerSpy.mockRestore()
  })
})

// Now let's test the auth provider to ensure it uses the hybrid client properly,
// and does not throw when supabase is "unreachable" offline.
import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/auth-context'

// Setup ConfigContext mock
vi.mock('@/lib/ConfigContext', () => {
  return {
    useConfig: () => ({
      config: { isActivated: true, activationEmail: 'test@local.ater', activationCode: 'ATER-PRO', displayName: 'Test User' },
      saveConfig: vi.fn(),
      isLoading: false
    })
  }
})

// Setup supabase mock
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user' } }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user' } }, error: null })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            full_name: 'Mock User',
            waitlist_status: 'approved',
            is_approved: true,
            account_status: 'active',
            activation_code: 'ATER-PRO',
            machine_id: 'mock-machine-id'
          },
          error: null
        }),
        update: vi.fn().mockReturnThis()
      })
    }
  }
})

vi.mock('@/lib/activationMachineBinding', () => ({
  validateActivationMachineBinding: vi.fn().mockResolvedValue(true)
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('Auth Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false // offline
    })
  })

  it('uses hybrid supabase client and allows offline activation', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Attempt an offline activation
    await act(async () => {
      await expect(
        result.current.activate('test@local.ater', 'password123', 'ATER-PRO')
      ).resolves.not.toThrow()
    })
    
    // Status should be updated correctly
    expect(result.current.status).toBe('approved')
  })
})
