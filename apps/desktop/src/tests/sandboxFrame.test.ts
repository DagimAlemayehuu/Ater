import { describe, expect, it } from 'vitest'
import { buildSandboxSrcDoc } from '../lib/artifacts/sandbox'

describe('buildSandboxSrcDoc', () => {
  it('injects Tailwind, Outfit, theme variables, and user code', () => {
    const srcDoc = buildSandboxSrcDoc('<main>Hello</main>')

    expect(srcDoc).toContain('https://cdn.tailwindcss.com')
    expect(srcDoc).toContain('fonts.googleapis.com/css2?family=Outfit')
    expect(srcDoc).toContain('--background')
    expect(srcDoc).toContain('<main>Hello</main>')
  })

  it('forwards runtime errors to the host frame', () => {
    const srcDoc = buildSandboxSrcDoc('<script>throw new Error("bad")</script>', {
      artifactId: 'artifact-1',
      version: 2,
    })

    expect(srcDoc).toContain('window.onerror')
    expect(srcDoc).toContain('window.parent.postMessage')
    expect(srcDoc).toContain('"ater:sandbox-error"')
    expect(srcDoc).toContain('"artifact-1"')
    expect(srcDoc).toContain('"version":2')
  })
})
