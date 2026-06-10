import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Settings from '../routes/settings';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { MemoryRouter } from 'react-router-dom';
import { sidecarApi } from '../lib/sidecarApi';

const relaunch = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
const toastInfo = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    testAiConnection: vi.fn().mockResolvedValue({ success: true }),
    exportLogs: vi.fn(),
    clearStudyHistory: vi.fn(),
    factoryReset: vi.fn(),
    aterWatcherToggle: vi.fn(),
    getMachineId: vi.fn().mockResolvedValue('test-machine'),
    siloTest: vi.fn().mockResolvedValue('Silo Test OK'),
    logFromJs: vi.fn(),
  }
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch,
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    info: toastInfo,
    success: toastSuccess,
  },
}));

describe('Settings Panel', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  function renderSettings() {
    return render(
      <MemoryRouter>
        <ConfigProvider>
          <HeaderProvider>
            <Settings />
          </HeaderProvider>
        </ConfigProvider>
      </MemoryRouter>
    );
  }

  it('renders system settings components', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText(/App Settings/i)).toBeInTheDocument();
    });
  });

  it('does not relaunch when factory reset verification fails', async () => {
    vi.mocked(sidecarApi.factoryReset).mockResolvedValueOnce({
      success: false,
      restartRequired: false,
      error: 'Purge verification failed',
    });

    renderSettings();

    await screen.findByText(/App Settings/i);
    fireEvent.click(screen.getByText(/Delete Everything & Reset App/i));
    fireEvent.click(screen.getByText(/Confirm Delete/i));

    await waitFor(() => expect(sidecarApi.factoryReset).toHaveBeenCalled());

    expect(relaunch).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('Factory reset failed: Purge verification failed');
  });

  it('relaunches only after structured factory reset success', async () => {
    vi.mocked(sidecarApi.factoryReset).mockResolvedValueOnce({
      success: true,
      terminatedSidecar: true,
      purged: ['ater_config.json'],
      verified: ['ater_config.json'],
      restartRequired: true,
    });

    renderSettings();

    await screen.findByText(/App Settings/i);
    fireEvent.click(screen.getByText(/Delete Everything & Reset App/i));
    fireEvent.click(screen.getByText(/Confirm Delete/i));

    await waitFor(() => expect(sidecarApi.factoryReset).toHaveBeenCalled());
    await waitFor(() => expect(relaunch).toHaveBeenCalled(), { timeout: 2500 });
  }, 4000);
});
