import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Practice from '../routes/practice';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { NavigationProvider } from '../context/navigation-provider';
import { LayoutProvider } from '../context/layout-provider';
import { MemoryRouter } from 'react-router-dom';
import { sidecarApi } from '../lib/sidecarApi';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    getPracticeStatus: vi.fn(),
    getPracticeAnalytics: vi.fn(),
    listPractices: vi.fn(),
    listHubs: vi.fn(),
    srsCards: vi.fn(),
    srsDue: vi.fn(),
    listHubNotes: vi.fn(),
    getMachineId: vi.fn().mockResolvedValue('test-machine'),
    siloTest: vi.fn().mockResolvedValue('Silo Test OK'),
    testAiConnection: vi.fn().mockResolvedValue({ success: true }),
    logFromJs: vi.fn(),
  }
}));

describe('Practice Session Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sidecarApi.getPracticeStatus as any).mockResolvedValue({ status: 'ready' });
    (sidecarApi.getPracticeAnalytics as any).mockResolvedValue({
      total_sessions: 10,
      average_score: 85,
      completion_rate: 1.0,
      streak: 5,
      streak_history: [],
      daily_attempts: {},
      modalities: {},
    });
    (sidecarApi.listPractices as any).mockResolvedValue({ practices: [] });
    (sidecarApi.listHubs as any).mockResolvedValue({ hubs: [] });
    (sidecarApi.srsCards as any).mockResolvedValue({ total: 0, active: 0, items: [] });
    (sidecarApi.srsDue as any).mockResolvedValue({ due: [] });
    (sidecarApi.listHubNotes as any).mockResolvedValue({ notes: [] });
  });

  it('renders practice main panel correctly', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <Practice />
              </HeaderProvider>
            </LayoutProvider>
          </NavigationProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Practice Dashboard/i)).toBeInTheDocument();
    });
  });
});
