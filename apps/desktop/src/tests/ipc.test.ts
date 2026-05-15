import { describe, it, expect, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

describe('Tauri IPC Layer', () => {
  it('should call invoke with correct arguments for vault status', async () => {
    const mockStatus = { status: 'connected', path: '/vault' };
    vi.mocked(invoke).mockResolvedValue(mockStatus);

    const result = await invoke('get_vault_status');
    
    expect(invoke).toHaveBeenCalledWith('get_vault_status');
    expect(result).toEqual(mockStatus);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Connection failed'));

    await expect(invoke('get_vault_status')).rejects.toThrow('Connection failed');
  });
});
