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
  it('renders Step 1 and advances to Step 2 on valid input', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <Onboarding />
        </ConfigProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Define Your Profile/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Enter your name/i);
    const continueBtn = screen.getByRole('button', { name: /Continue/i });

    // Continue is initially disabled since name is empty
    expect(continueBtn).toBeDisabled();

    // Fill in name
    fireEvent.change(nameInput, { target: { value: 'Dagim' } });
    expect(continueBtn).toBeEnabled();

    // Advance to step 2
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Select Your Vault/i)).toBeInTheDocument();
      expect(screen.getByText(/Point Ater to your local Obsidian vault folder/i)).toBeInTheDocument();
    });
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
      expect(sidecarApi.updateVaultPath).not.toHaveBeenCalled();
      expect(sidecarApi.createObsidianFolder).toHaveBeenCalledWith('database');
      expect(sidecarApi.createObsidianFile).toHaveBeenCalledWith(
        'database/.write_test',
        'permission_check',
        true
      );
    });
    expect(sidecarApi.createObsidianFolder).toHaveBeenCalledBefore(
      sidecarApi.createObsidianFile as any
    );
  });
});
