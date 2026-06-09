import { describe, expect, it, vi } from 'vitest'
import { fetchSidecarJson } from '../lib/sidecarHttp'

describe('fetchSidecarJson', () => {
  it('throws a clear error for non-ok sidecar responses', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('warming up')
    })

    await expect(fetchSidecarJson('http://127.0.0.1:8765/api/test', {}, fetcher as any)).rejects.toThrow(
      /Sidecar request failed \(503\): warming up/
    )
  })

  it('throws a clear error when the sidecar fetch rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    await expect(fetchSidecarJson('http://127.0.0.1:8765/api/test', {}, fetcher as any)).rejects.toThrow(
      /Could not reach the local Ater sidecar/
    )
  })
})
