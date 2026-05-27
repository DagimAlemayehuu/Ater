import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Settings from '../routes/settings';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { MemoryRouter } from 'react-router-dom';
import { sidecarApi } from '../lib/sidecarApi';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    testAiConnection: vi.fn(),
    exportLogs: vi.fn(),
    clearStudyHistory: vi.fn(),
    factoryReset: vi.fn(),
    aterWatcherToggle: vi.fn(),
    getMachineId: vi.fn().mockResolvedValue('test-machine'),
  }
}));

describe('Settings Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders system settings components', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <HeaderProvider>
            <Settings />
          </HeaderProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/System Parameters/i)).toBeInTheDocument();
    });
  });
});
