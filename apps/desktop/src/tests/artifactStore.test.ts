import { beforeEach, describe, expect, it } from 'vitest'
import { useArtifactStore } from '../lib/artifacts/store'

describe('useArtifactStore', () => {
  beforeEach(() => {
    useArtifactStore.getState().resetArtifacts()
  })

  it('registers artifacts and opens the panel automatically', () => {
    useArtifactStore.getState().registerArtifacts([
      {
        id: 'artifact-1',
        title: 'Motion',
        versions: [{ version: 1, raw: '<artifact />', chapters: [{ id: 'c1', title: 'Intro', content: 'Text' }] }],
      },
    ])

    const state = useArtifactStore.getState()
    expect(state.isPanelOpen).toBe(true)
    expect(state.activeArtifactId).toBe('artifact-1')
    expect(state.artifacts).toHaveLength(1)
  })

  it('adds edits as new versions and caps repair attempts at three', () => {
    const store = useArtifactStore.getState()
    store.registerArtifacts([
      {
        id: 'artifact-1',
        title: 'Motion',
        versions: [{ version: 1, raw: 'v1', chapters: [{ id: 'c1', title: 'Intro', content: 'Text' }] }],
      },
    ])
    store.addVersion('artifact-1', [{ id: 'c2', title: 'Fixed', content: 'Better' }], 'v2')

    expect(useArtifactStore.getState().artifacts[0].versions).toHaveLength(2)
    expect(useArtifactStore.getState().activeVersionByArtifact['artifact-1']).toBe(2)

    expect(store.incrementRepairAttempts('artifact-1')).toBe(1)
    expect(store.incrementRepairAttempts('artifact-1')).toBe(2)
    expect(store.incrementRepairAttempts('artifact-1')).toBe(3)
    expect(store.incrementRepairAttempts('artifact-1')).toBe(3)
  })

  it('updates the version in-place if messageIndex matches', () => {
    const store = useArtifactStore.getState()
    store.registerArtifacts([
      {
        id: 'artifact-1',
        title: 'Motion',
        versions: [{ version: 1, messageIndex: 5, raw: 'v1', chapters: [{ id: 'c1', title: 'Intro', content: 'Text' }] }],
      },
    ])
    // Calling addVersion with messageIndex 5 should update version 1 in-place instead of appending version 2
    store.addVersion('artifact-1', [{ id: 'c1', title: 'Intro', content: 'Updated Text', sandbox: 'console.log("hello")' }], 'v1-updated', 5)

    expect(useArtifactStore.getState().artifacts[0].versions).toHaveLength(1)
    expect(useArtifactStore.getState().artifacts[0].versions[0].chapters[0].sandbox).toBe('console.log("hello")')
    expect(useArtifactStore.getState().artifacts[0].versions[0].raw).toBe('v1-updated')
    expect(useArtifactStore.getState().activeVersionByArtifact['artifact-1']).toBe(1)
  })

  it('preserves existing sandbox code in chapters when re-registering an existing version', () => {
    const store = useArtifactStore.getState()
    
    // 1. Initial register
    store.registerArtifacts([
      {
        id: 'artifact-1',
        title: 'Motion',
        versions: [{ version: 1, messageIndex: 5, raw: 'v1', chapters: [{ id: 'c1', title: 'Intro', content: 'Text' }] }],
      },
    ])
    
    // 2. Add sandbox code via addVersion
    store.addVersion('artifact-1', [{ id: 'c1', title: 'Intro', content: 'Text', sandbox: 'console.log("hello")' }], 'v1', 5)
    expect(useArtifactStore.getState().artifacts[0].versions[0].chapters[0].sandbox).toBe('console.log("hello")')

    // 3. Re-register (like on new messages loop)
    store.registerArtifacts([
      {
        id: 'artifact-1',
        title: 'Motion',
        versions: [{ version: 1, messageIndex: 5, raw: 'v1', chapters: [{ id: 'c1', title: 'Intro', content: 'Text' }] }],
      },
    ])

    // Should preserve the sandbox code
    expect(useArtifactStore.getState().artifacts[0].versions[0].chapters[0].sandbox).toBe('console.log("hello")')
  })
})
