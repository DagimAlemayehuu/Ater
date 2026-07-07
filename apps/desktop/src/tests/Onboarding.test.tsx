import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from '../routes/onboarding';
import { ConfigProvider } from '../lib/ConfigContext';
import { MemoryRouter } from 'react-router-dom';
import { open } from '@tauri-apps/plugin-dialog';
import { sidecarApi } from '../lib/sidecarApi';

// Mock Tauri dialog open
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue('/mock/vault/path'),
}));

vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    updateVaultPath: vi.fn().mockResolvedValue(undefined),
    createObsidianFolder: vi.fn().mockResolvedValue(undefined),
    createObsidianFile: vi.fn().mockResolvedValue(undefined),
    deleteObsidianItem: vi.fn().mockResolvedValue(undefined),
    readObsidianNote: vi.fn().mockRejectedValue(new Error('No existing profile')),
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Dagim Alemayehu' }, error: null })
        })
      })
    }),
  },
}));

describe('Onboarding Component', () => {
  it('follows a strict sequential flow (1-6)', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <Onboarding />
        </ConfigProvider>
      </MemoryRouter>
    );

    // Step 1: Profile
    expect(await screen.findByText(/Define Your Profile/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'Dagim' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2: Vault
    expect(await screen.findByText(/Select Your Vault/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Choose Folder/i }));

    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 3: AI Keys
    expect(await screen.findByText(/Connect AI Provider & Keys/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));

    // Step 4: Academic Program
    expect(await screen.findByText(/Your Academic Program/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/e.g. Computer Science/i), { target: { value: 'CS' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 5: Focus Timer
    expect(await screen.findByText(/Configure Focus Timer/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 6: Confirm
    expect(await screen.findByText(/Confirm Setup/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finalize/i })).toBeInTheDocument();
  });

  it('creates the database folder before probing write access for a selected vault', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <Onboarding />
        </ConfigProvider>
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByPlaceholderText(/Enter your name/i), {
      target: { value: 'Dagim' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    fireEvent.click(await screen.findByRole('button', { name: /Choose Folder/i }));

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
        title: 'Select your Obsidian vault folder',
      });
      expect(sidecarApi.createObsidianFolder).toHaveBeenCalledWith('database');
      expect(sidecarApi.createObsidianFile).toHaveBeenCalledWith(
        'database/.write_test',
        'permission_check',
        true
      );
    });
    // RESTORED: check execution order
    expect(vi.mocked(sidecarApi.createObsidianFolder).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(sidecarApi.createObsidianFile).mock.invocationCallOrder[0]);
  });
});
