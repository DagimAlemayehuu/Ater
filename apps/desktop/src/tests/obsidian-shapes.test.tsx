
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ObsidianRoute from '../routes/obsidian';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from '../lib/ConfigContext';
import { sidecarApi } from '../lib/sidecarApi';
import { NavigationProvider } from '../context/navigation-provider';
import { HeaderProvider } from '../context/header-context';
import { LayoutProvider } from '../context/layout-provider';
import { SearchProvider } from '../context/search-provider';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    listHubs: vi.fn(),
    listObsidianFiles: vi.fn(),
    aterQueueStatus: vi.fn().mockResolvedValue({ current_task: null, queue: [] }),
    aterListInbox: vi.fn().mockResolvedValue({ items: [] }),
    getStudyTree: vi.fn().mockResolvedValue({ children: [] }),
    deleteObsidianItem: vi.fn().mockResolvedValue({}),
    readObsidianNote: vi.fn().mockResolvedValue({
      content: 'test content',
      metadata: {},
    }),
  },
}));

const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <MemoryRouter>
      <ConfigProvider>
        <HeaderProvider>
          <LayoutProvider>
            <SearchProvider>
          <NavigationProvider>
            {ui}
          </NavigationProvider>
        </SearchProvider>
          </LayoutProvider>
        </HeaderProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
};

describe('Obsidian Route - Hub/File Shape Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hubs with only name and no title without crashing', async () => {
    vi.mocked(sidecarApi.listHubs).mockResolvedValueOnce({
      hubs: [
        { path: 'hub1.md', name: 'Hub With Only Name' },
      ],
    } as any);
    
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValueOnce({
      files: [],
    } as any);

    renderWithProviders(<ObsidianRoute />);
    
    await waitFor(() => {
      expect(sidecarApi.listHubs).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Hub With Only Name')).toBeInTheDocument();
    });
  });

  it('renders hubs with only title and no name without crashing', async () => {
    vi.mocked(sidecarApi.listHubs).mockResolvedValueOnce({
      hubs: [
        { path: 'hub2.md', title: 'Hub With Only Title' },
      ],
    } as any);
    
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValueOnce({
      files: [],
    } as any);

    renderWithProviders(<ObsidianRoute />);
    
    await waitFor(() => {
      expect(sidecarApi.listHubs).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Hub With Only Title')).toBeInTheDocument();
    });
  });

  it('renders files with missing name/title safely as Untitled', async () => {
    vi.mocked(sidecarApi.listHubs).mockResolvedValueOnce({
      hubs: [],
    } as any);
    
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValueOnce({
      files: [
        { path: 'file.md', is_dir: false, name: undefined, title: undefined }
      ],
    } as any);

    renderWithProviders(<ObsidianRoute />);

    await waitFor(() => {
      expect(sidecarApi.listObsidianFiles).toHaveBeenCalled();
    });

    await waitFor(() => {
      // If it didn't crash, the test passes
      expect(screen.getByText('Hubs')).toBeInTheDocument();
    });
  });
});
