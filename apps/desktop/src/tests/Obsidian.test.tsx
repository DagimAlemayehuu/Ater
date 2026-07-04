import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    deleteObsidianItem: vi.fn().mockResolvedValue({ success: true }),
  }
}));

vi.mock('../components/obsidian/PdfViewer', () => ({
  PdfViewer: ({ path, title }: { path: string; title: string }) => (
    <div data-testid="pdf-viewer" data-path={path}>{title}</div>
  ),
}));

import { SidebarContentProvider, useSidebarContent } from '../context/sidebar-content-context';

const SidebarTestHelper = () => {
  const { sidebarContent } = useSidebarContent();
  return (
    <div>
      <Obsidian />
      <div data-testid="projected-sidebar">{sidebarContent}</div>
    </div>
  );
};

describe('Obsidian Notes Explorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (sidecarApi.listObsidianFiles as any).mockResolvedValue({
      files: [
        {
          name: 'Computer_Science',
          path: 'Computer_Science',
          is_dir: true,
        },
        {
          name: 'Data_Structures.md',
          path: 'Computer_Science/Data_Structures.md',
          is_dir: false,
        },
        {
          name: 'Data_Structures.html',
          path: 'Computer_Science/Data_Structures.html',
          is_dir: false,
        },
        {
          name: 'Algorithms_Syllabus.pdf',
          path: 'Inbox/Algorithms_Syllabus.pdf',
          is_dir: false,
        },
      ]
    });
    (sidecarApi.readObsidianNote as any).mockResolvedValue({
      content: '# Data Structures\n\nLinked-list notes.',
      metadata: { title: 'Data Structures', simple: 'Data_Structures.html', type: 'lesson' },
    });
    (sidecarApi.aterQueueStatus as any).mockResolvedValue({
      status: 'idle',
      queue_size: 0,
      pending_files: [],
    });
    (sidecarApi.aterListInbox as any).mockResolvedValue({ files: [] });
    (sidecarApi.listHubs as any).mockResolvedValue([]);
    (sidecarApi.findVaultPage as any).mockResolvedValue({ found: false });
  });

  it('renders explorer panel and directory listing', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <SidebarContentProvider>
                  <SidebarTestHelper />
                </SidebarContentProvider>
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

  it('opens markdown files from the projected sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/obsidian']}>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <SidebarContentProvider>
                  <SidebarTestHelper />
                </SidebarContentProvider>
              </HeaderProvider>
            </LayoutProvider>
          </NavigationProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText('Computer_Science'));
    fireEvent.click(await screen.findByText('Data_Structures'));

    await waitFor(() => {
      expect(sidecarApi.readObsidianNote).toHaveBeenCalledWith('Computer_Science/Data_Structures.md');
    });
    expect(await screen.findByText('Linked-list notes.')).toBeInTheDocument();
  });

  it('renders markdown only when an HTML lesson companion exists', async () => {
    render(
      <MemoryRouter initialEntries={['/obsidian']}>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <SidebarContentProvider>
                  <SidebarTestHelper />
                </SidebarContentProvider>
              </HeaderProvider>
            </LayoutProvider>
          </NavigationProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText('Computer_Science'));
    fireEvent.click(await screen.findByText('Data_Structures'));

    expect(await screen.findByText('Linked-list notes.')).toBeInTheDocument();
    expect(screen.queryByText('Interactive Lesson')).not.toBeInTheDocument();
    expect(sidecarApi.readObsidianNote).toHaveBeenCalledWith('Computer_Science/Data_Structures.md');
    expect(sidecarApi.readObsidianNote).not.toHaveBeenCalledWith('Computer_Science/Data_Structures.html');
  });

  it('opens PDFs from the projected sidebar', async () => {
    (sidecarApi.aterListInbox as any).mockResolvedValue({
      files: [
        {
          name: 'Algorithms_Syllabus.pdf',
          path: 'Inbox/Algorithms_Syllabus.pdf',
          is_dir: false,
        }
      ]
    });
    render(
      <MemoryRouter initialEntries={['/obsidian']}>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <SidebarContentProvider>
                  <SidebarTestHelper />
                </SidebarContentProvider>
              </HeaderProvider>
            </LayoutProvider>
          </NavigationProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    const inboxDir = await screen.findByText('Inbox');
    fireEvent.click(inboxDir);
    
    // We need to await the file appearing
    const file = await screen.findByText('Algorithms_Syllabus');
    fireEvent.click(file);

    const viewer = await screen.findByTestId('pdf-viewer');
    expect(viewer).toHaveAttribute('data-path', 'Inbox/Algorithms_Syllabus.pdf');
  });

  it('opens a Knowledge Base atomic note in the shared lesson runtime', async () => {
    (sidecarApi.readObsidianNote as any).mockResolvedValue({
      content: '# Data Structures\n\n```interactive-quiz\n{\"id\":\"q1\",\"type\":\"writing\",\"question\":\"Explain it\",\"answer\":\"A\",\"explanation\":\"Because.\"}\n```',
      metadata: { title: 'Data Structures', type: 'lesson', hub: '[[Computer_Science_Hub]]' },
    });
    (sidecarApi.findVaultPage as any).mockImplementation((name: string) => {
      if (name.includes('Computer_Science_Hub')) {
        return Promise.resolve({
          found: true,
          path: 'database/learning paths/Computer_Science_Hub.md',
        });
      }
      return Promise.resolve({ found: false });
    });

    render(
      <MemoryRouter initialEntries={['/obsidian']}>
        <ConfigProvider>
          <NavigationProvider>
            <LayoutProvider>
              <HeaderProvider>
                <SidebarContentProvider>
                  <SidebarTestHelper />
                </SidebarContentProvider>
              </HeaderProvider>
            </LayoutProvider>
          </NavigationProvider>
        </ConfigProvider>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText('Computer_Science'));
    fireEvent.click(await screen.findByText('Data_Structures'));
    fireEvent.click(await screen.findByRole('button', { name: /continue lesson/i }));

    await waitFor(() => {
      expect(localStorage.getItem('ater_study_active_note_path')).toBe('Computer_Science/Data_Structures.md');
    });
    expect(localStorage.getItem('ater_canonical_lesson_path')).toBe('Computer_Science/Data_Structures.md');
    expect(JSON.parse(localStorage.getItem('ater_lesson_preview') || '{}')).toMatchObject({
      title: 'Data Structures',
      notePath: 'Computer_Science/Data_Structures.md',
      hubPath: 'database/learning paths/Computer_Science_Hub.md',
    });
  });
});
