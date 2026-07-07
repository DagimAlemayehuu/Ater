const DEFAULT_SIDECAR_TIMEOUT_MS = 8000

type Fetcher = typeof fetch

export async function fetchSidecarJson<T = any>(
  url: string,
  init: RequestInit = {},
  fetcher: Fetcher = fetch,
  timeoutMs = DEFAULT_SIDECAR_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetcher(url, {
      ...init,
      signal: init.signal ?? controller.signal
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Sidecar request failed (${response.status}): ${text || response.statusText}`)
    }

    const data = await response.json()
    return data as T
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message === 'The user aborted a request.') {
      throw new Error('Timed out waiting for the local Ater sidecar. Restart Ater and try again.')
    }
    if (String(error?.message || '').startsWith('Sidecar request failed')) {
      throw error
    }
    throw new Error(`Could not reach the local Ater sidecar: ${error?.message || error}`)
  } finally {
    clearTimeout(timeout)
  }
}
