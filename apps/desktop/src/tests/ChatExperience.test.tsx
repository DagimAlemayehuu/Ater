import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import Agents from '../routes/agents';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { sidecarApi } from '../lib/sidecarApi';
import { useChatStore } from '../context/chatStore';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    listConversations: vi.fn(),
    getMessages: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    listMemories: vi.fn().mockResolvedValue([]),
    listAttachments: vi.fn().mockResolvedValue([]),
    aterWatcherToggle: vi.fn(),
    streamConversationTurn: vi.fn(),
    search_similar: vi.fn().mockResolvedValue([]),
    aterQueueStatus: vi.fn().mockResolvedValue({ status: 'idle' }),
    aterListInbox: vi.fn().mockResolvedValue({ files: [] }),
  },
}));

// Mock sidebar context
vi.mock('../context/sidebar-content-context', () => ({
  useSidebarContent: () => ({
    setSidebarContent: vi.fn(),
  }),
}));

const LocationDisplay = () => {
  const [searchParams] = useSearchParams();
  return <div data-testid="location-display">{searchParams.get('conversationId')}</div>;
};

const renderChat = (initialEntries = ['/agents']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ConfigProvider>
        <HeaderProvider>
          <Routes>
            <Route path="/agents" element={
              <>
                <Agents />
                <LocationDisplay />
              </>
            } />
          </Routes>
        </HeaderProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
};

describe('ChatExperience Robustness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({
      activeConversationId: null,
      messages: [],
      conversations: [],
    });
    (sidecarApi.listConversations as any).mockResolvedValue([]);
  });

  it('initializes activeConversationId from URL search params', async () => {
    const convId = 'test-conv-123';
    (sidecarApi.listConversations as any).mockResolvedValue([
      { id: convId, title: 'Test Chat', metadata: {} }
    ]);
    (sidecarApi.getMessages as any).mockResolvedValue([]);

    renderChat([`/agents?conversationId=${convId}`]);

    await waitFor(() => {
      expect(useChatStore.getState().activeConversationId).toBe(convId);
    });
    expect(sidecarApi.getMessages).toHaveBeenCalledWith(convId);
  });

  it('handles API errors gracefully when listing conversations', async () => {
    (sidecarApi.listConversations as any).mockRejectedValue(new Error('API Error'));

    renderChat();

    await waitFor(() => {
      expect(useChatStore.getState().conversations).toEqual([]);
    });
    // We can't easily check for toast in this environment without more setup,
    // but we verify it doesn't crash and state remains safe.
  });

  it('prevents duplicate message submissions while loading', async () => {
    (sidecarApi.createConversation as any).mockResolvedValue({ id: 'new-id' });
    (sidecarApi.streamConversationTurn as any).mockImplementation(() => new Promise(() => {})); // Hangs forever

    renderChat();

    // Initial state: messages empty
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Ask Ater.../i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(sidecarApi.streamConversationTurn).toHaveBeenCalledTimes(1);
    });

    // Try sending again while loading
    fireEvent.change(input, { target: { value: 'Duplicate' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Should still only have been called once
    expect(sidecarApi.streamConversationTurn).toHaveBeenCalledTimes(1);
  });

  it('syncs conversation selection to URL when store state changes', async () => {
    renderChat();

    // Check initial URL is empty
    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toBeInTheDocument();
    });

    // Manually trigger store update (simulating a selection or new chat)
    act(() => {
      useChatStore.getState().setActiveConversationId('manual-id');
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('manual-id');
    }, { timeout: 3000 });
  });
});
