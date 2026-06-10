import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { setRuntimeAppMode } from '@/lib/appMode'
import { sidecarApi } from '@/lib/sidecarApi'

describe('sidecarApi simulation routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRuntimeAppMode('real')
  })

  it('does not call native IPC for simulated note reads or AI connection tests', async () => {
    setRuntimeAppMode('simulation')

    await expect(sidecarApi.readObsidianNote('Notes/Consensus.md')).resolves.toMatchObject({
      content: expect.stringContaining('Consensus is the problem'),
    })
    await expect(sidecarApi.testAiConnection()).resolves.toMatchObject({ success: true })

    expect(invoke).not.toHaveBeenCalled()
  })

  it('routes simulated ingestion before native IPC', async () => {
    setRuntimeAppMode('simulation')

    const result = await sidecarApi.aterProcess({ file_path: 'Inbox/Distributed_Systems_Primer.pdf' })

    expect(result.curriculum.hub_title).toBe('Distributed Systems')
    expect(invoke).not.toHaveBeenCalled()
  })

  it('keeps real mode native routing intact', async () => {
    setRuntimeAppMode('real')
    vi.mocked(invoke).mockResolvedValueOnce({ success: true, message: 'ok' })

    await sidecarApi.testAiConnection()

    expect(invoke).toHaveBeenCalledWith('test_ai_connection', { target: 'primary', overrideConfig: null })
  })
})
