import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { UnifiedSandboxViewer } from '../components/obsidian/UnifiedSandboxViewer'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/theme-provider'

// Mock useArtifactStore
vi.mock('@/lib/artifacts/store', () => {
  return {
    useArtifactStore: () => ({
      artifacts: [
        {
          id: 'test-artifact-1',
          title: 'Test Artifact',
          versions: [
            {
              version: 1,
              chapters: [
                {
                  id: 'chapter-1',
                  title: 'Chapter 1',
                  sandbox: 'console.log("hello");',
                  sandboxSpec: 'console.log("hello");'
                }
              ],
              raw: 'console.log("hello");'
            }
          ]
        }
      ],
      activeArtifactId: 'test-artifact-1',
      activeVersionByArtifact: { 'test-artifact-1': 1 },
      activeChapterByArtifact: { 'test-artifact-1': 0 },
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
      recordCompileError: vi.fn(),
    })
  }
})

vi.mock('@/lib/sidecarApi', () => ({
  sidecarApi: {
    health: vi.fn().mockResolvedValue({ status: 'ok' }),
    readObsidianNote: vi.fn().mockResolvedValue({ content: '', metadata: {} }),
    updateObsidianNote: vi.fn().mockResolvedValue(true),
    repairArtifactCode: vi.fn().mockResolvedValue({ code: 'repaired' }),
    generateArtifactCode: vi.fn().mockResolvedValue({ code: 'generated' })
  }
}))

describe('UnifiedSandboxViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <UnifiedSandboxViewer />
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  it('ignores messages from incorrect source', async () => {
    const updateObsidianNoteSpy = vi.spyOn(
      (await import('@/lib/sidecarApi')).sidecarApi,
      'updateObsidianNote'
    )
    
    // We need to set the location to an obsidian route for the state change to call updateObsidianNote
    window.history.pushState({}, 'Test', '/obsidian?path=test.md')

    const { container } = renderComponent()
    
    // Get iframe reference indirectly by simulating message source
    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()

    act(() => {
      // Send a message from a different window/source
      const event = new MessageEvent('message', {
        data: {
          type: 'ater:sandbox-state-change',
          state: { foo: 'bar' }
        },
        source: window, // Incorrect source (should be iframe.contentWindow)
        origin: window.origin
      })
      window.dispatchEvent(event)
    })

    // Assert that the message was ignored
    expect(updateObsidianNoteSpy).not.toHaveBeenCalled()
  })

  it('processes messages from correct source', async () => {
    const updateObsidianNoteSpy = vi.spyOn(
      (await import('@/lib/sidecarApi')).sidecarApi,
      'updateObsidianNote'
    )
    
    // We need to set the location to an obsidian route for the state change to call updateObsidianNote
    window.history.pushState({}, 'Test', '/obsidian?path=test.md')

    const { container } = renderComponent()
    
    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()
    
    // Wait for async sidecar API call from mount to resolve
    
    act(() => {
      // Send a message from the correct source
      const event = new MessageEvent('message', {
        data: {
          type: 'ater:sandbox-state-change',
          state: { foo: 'bar' }
        },
        source: iframe!.contentWindow,
        origin: 'null' // iframe sandbox without allow-same-origin will have origin 'null'
      })
      window.dispatchEvent(event)
    })

    // Wait for the async state update sequence
    await vi.waitFor(() => {
      expect(updateObsidianNoteSpy).toHaveBeenCalled()
    })
  })
})
