import { describe, expect, it, vi } from 'vitest'
import { validateActivationMachineBinding } from '../lib/activationMachineBinding'

describe('validateActivationMachineBinding', () => {
  it('rejects activation when the native machine id cannot be resolved', async () => {
    await expect(
      validateActivationMachineBinding({
        profileMachineId: null,
        fetchMachineId: vi.fn().mockRejectedValue(new Error('native unavailable')),
        bindMachineId: vi.fn()
      })
    ).rejects.toThrow(/Unable to verify this device/i)
  })

  it('rejects activation when the profile is bound to a different machine', async () => {
    await expect(
      validateActivationMachineBinding({
        profileMachineId: 'bound-device',
        fetchMachineId: vi.fn().mockResolvedValue('current-device'),
        bindMachineId: vi.fn()
      })
    ).rejects.toThrow(/already linked to another device/i)
  })

  it('binds an unclaimed profile to the resolved machine id', async () => {
    const bindMachineId = vi.fn().mockResolvedValue(undefined)

    await expect(
      validateActivationMachineBinding({
        profileMachineId: '',
        fetchMachineId: vi.fn().mockResolvedValue('current-device'),
        bindMachineId
      })
    ).resolves.toBe('current-device')

    expect(bindMachineId).toHaveBeenCalledWith('current-device')
  })
})
