import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnifiedSandboxViewer } from '../components/obsidian/UnifiedSandboxViewer'
import { BrowserRouter } from 'react-router-dom'

// Mock dependencies
vi.mock('@/lib/sidecarApi', () => ({
  sidecarApi: {
    health: vi.fn().mockResolvedValue({ status: 'ok' }),
    readObsidianNote: vi.fn().mockResolvedValue({ content: '' }),
    updateObsidianNote: vi.fn().mockResolvedValue({}),
    repairArtifactCode: vi.fn().mockResolvedValue({ code: 'repaired' }),
    generateArtifactCode: vi.fn().mockResolvedValue({ code: 'generated' })
  }
}))

vi.mock('@/context/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' })
}))

vi.mock('@/lib/artifacts/store', () => ({
  useArtifactStore: () => ({
    artifacts: [],
    activeArtifactId: null,
    activeVersionByArtifact: {},
    activeChapterByArtifact: {},
    iframeErrorsByArtifact: {},
    isRepairingByArtifact: {},
    compileErrorsByArtifact: {},
    setActiveArtifact: vi.fn(),
    setActiveVersion: vi.fn(),
    setActiveChapter: vi.fn(),
    setPanelOpen: vi.fn(),
    recordIframeError: vi.fn(),
    incrementRepairAttempts: vi.fn(),
    setRepairing: vi.fn(),
    addVersion: vi.fn(),
    recordCompileError: vi.fn()
  })
}))

const customArtifacts = [
  {
    id: 'test-art',
    title: 'Test Artifact',
    versions: [
      {
        version: 1,
        chapters: [
          {
            id: 'chap-1',
            title: 'Chap 1',
            sandbox: '<h1>Sandbox</h1>'
          }
        ]
      }
    ]
  }
]

describe('UnifiedSandboxViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores messages from incorrect source', async () => {
    const { container } = render(
      <BrowserRouter>
        <UnifiedSandboxViewer customArtifacts={customArtifacts} />
      </BrowserRouter>
    )

    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()

    // Dispatch message from window itself (incorrect source)
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          data: {
            type: 'ater:sandbox-error',
            artifactId: 'test-art',
            version: 1,
            message: 'Malicious error'
          }
        })
      )
    })

    // Check that we didn't show the error UI
    expect(screen.queryByText(/Runtime error: Malicious error/)).toBeNull()
  })

  it('processes messages from correct source', async () => {
    const { container } = render(
      <BrowserRouter>
        <UnifiedSandboxViewer customArtifacts={customArtifacts} />
      </BrowserRouter>
    )

    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()

    // Mock contentWindow
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: vi.fn() },
      writable: true
    })

    // Dispatch message from correct source
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe?.contentWindow,
          data: {
            type: 'ater:sandbox-error',
            artifactId: 'test-art',
            version: 1,
            message: 'Valid error'
          }
        })
      )
    })

    // Check that error UI appears
    expect(screen.getByText(/Runtime error: Valid error/)).not.toBeNull()
  })
})
