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
})
