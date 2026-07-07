import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSecurityStore } from '../context/securityStore';
import { isBetaMode, setRuntimeAppMode } from '../lib/appMode';
import { supabase } from '../lib/supabase';
import { getAppStore } from '../lib/store';

// Mock the tauri API core and plugins
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock the store to return custom values
vi.mock('../lib/store', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn(),
  };
  return {
    getAppStore: vi.fn().mockResolvedValue(mockStore),
  };
});

// Mock Supabase to track calls
vi.spyOn(supabase.auth, 'getUser');

describe('Security Store - checkOnlineLockout', () => {
  const originalLocation = window.location;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock window.location.reload and window.location.hash
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      reload: vi.fn(),
      hash: '',
    } as any;
  });

  afterEach(() => {
    window.location = originalLocation as any;
  });

  it('aborts immediately and does not reload if isActivated is false', async () => {
    const storeInstance = await getAppStore();
    // Simulate unactivated/logged-out state
    vi.mocked(storeInstance.get).mockImplementation(async (key: string) => {
      if (key === 'isActivated') return false;
      return null;
    });

    const checkOnlineLockout = useSecurityStore.getState().checkOnlineLockout;
    await checkOnlineLockout();

    // Verify it did not fetch user or profile
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
    // Verify it did not trigger a page reload loop
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('runs verification if isActivated is true', async () => {
    const storeInstance = await getAppStore();
    // Simulate activated state
    vi.mocked(storeInstance.get).mockImplementation(async (key: string) => {
      if (key === 'isActivated') return true;
      return null;
    });

    const checkOnlineLockout = useSecurityStore.getState().checkOnlineLockout;
    await checkOnlineLockout();

    // Verify it did proceed to fetch auth user
    expect(supabase.auth.getUser).toHaveBeenCalled();
  });

  it('preserves local state when Supabase auth check is too slow', async () => {
    vi.useFakeTimers();
    const storeInstance = await getAppStore();
    vi.mocked(storeInstance.get).mockImplementation(async (key: string) => {
      if (key === 'isActivated') return true;
      return null;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(new Promise(() => {}) as any);
    useSecurityStore.setState({ status: 'Active', lockedFeatures: [], isChecking: false });

    const sync = useSecurityStore.getState().checkOnlineLockout().then(() => 'resolved');
    await vi.advanceTimersByTimeAsync(1600);

    const result = await Promise.race([sync, Promise.resolve('pending')]);
    expect(result).toBe('resolved');
    expect(useSecurityStore.getState().status).toBe('Active');
    expect(window.location.reload).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('recognizes beta mode', () => {
    setRuntimeAppMode('beta');
    expect(isBetaMode()).toBe(true);
  });
});
