import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageGuard } from '../components/PageGuard';
import { useSecurityStore } from '../context/securityStore';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/securityStore', () => ({
  useSecurityStore: vi.fn(),
}));

// Helper to mock the state
const mockSecurityState = (status: string, lockedFeatures: string[] = [], creditBalance: number = 20) => {
  const state = {
    status,
    lockedFeatures,
    creditBalance,
    isFeatureLocked: (feature: string) => {
        if (status === 'Bricked') return true;
        if (status === 'LeaseExpired' && ['ai-features', 'oracle-chat'].includes(feature)) return true;
        return lockedFeatures.includes(feature);
    },
    checkOnlineLockout: vi.fn(),
  };

  (useSecurityStore as any).getState = vi.fn().mockReturnValue(state);
  (useSecurityStore as any).mockImplementation((selector: any) => selector(state));
};

describe('PageGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when not locked', () => {
    mockSecurityState('Active');
    render(
      <MemoryRouter>
        <PageGuard featureSlug="any">
          <div data-testid="child">Content</div>
        </PageGuard>
      </MemoryRouter>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders LockoutScreen with destructive variant when Bricked', () => {
    mockSecurityState('Bricked');
    render(
      <MemoryRouter>
        <PageGuard featureSlug="ai-features">
          <div>Content</div>
        </PageGuard>
      </MemoryRouter>
    );
    expect(screen.getByText(/AI Features Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/RESTRICTED CLEARANCE/i)).toBeInTheDocument();
  });

  it('renders LockoutScreen with warning variant when LeaseExpired', () => {
    mockSecurityState('LeaseExpired');
    render(
      <MemoryRouter>
        <PageGuard featureSlug="ai-features">
          <div>Content</div>
        </PageGuard>
      </MemoryRouter>
    );
    expect(screen.getByText(/Offline: AI Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM ADVISORY/i)).toBeInTheDocument();
    expect(screen.getByText(/LEASE_EXPIRED/i)).toBeInTheDocument();
  });
});
