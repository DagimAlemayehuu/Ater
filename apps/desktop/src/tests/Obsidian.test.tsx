import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Obsidian from '../routes/obsidian';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { MemoryRouter } from 'react-router-dom';
import { sidecarApi } from '../lib/sidecarApi';

import { NavigationProvider } from '../context/navigation-provider';
import { LayoutProvider } from '../context/layout-provider';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    listObsidianFiles: vi.fn(),
    aterQueueStatus: vi.fn(),
    aterListInbox: vi.fn(),
    listHubs: vi.fn(),
    readObsidianNote: vi.fn(),
    aterWatcherToggle: vi.fn(),
    findVaultPage: vi.fn(),
    getMachineId: vi.fn().mockResolvedValue('test-machine-id'),
    siloTest: vi.fn().mockResolvedValue('Silo Test OK'),
    testAiConnection: vi.fn().mockResolvedValue({ success: true }),
    logFromJs: vi.fn(),
  }
}));

describe('Obsidian Notes Explorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sidecarApi.listObsidianFiles as any).mockResolvedValue({
      files: [
        {
          name: 'Computer_Science',
          path: 'Computer_Science',
          is_dir: true,
          children: [
            {
              name: 'Data_Structures.md',
              path: 'Computer_Science/Data_Structures.md',
              is_dir: false,
            }
          ]
        }
      ]
    });
    (sidecarApi.aterQueueStatus as any).mockResolvedValue({
      status: 'idle',
      queue_size: 0,
      pending_files: [],
    });
    (sidecarApi.aterListInbox as any).mockResolvedValue({ files: [] });
    (sidecarApi.listHubs as any).mockResolvedValue([]);
  });

  it('renders explorer panel and directory listing', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <Obsidian />
              </HeaderProvider>
            </LayoutProvider>
          </NavigationProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Computer_Science/i)).toBeInTheDocument();
    });
  });
});
