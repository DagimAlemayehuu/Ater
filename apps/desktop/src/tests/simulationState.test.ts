import { describe, expect, it } from 'vitest'
import {
  createSimulationState,
  getSimulationState,
  patchSimulationNote,
  resetSimulationState,
} from '@/lib/simulation/state'

describe('simulation state', () => {
  it('seeds a distributed systems ghost vault', () => {
    const state = createSimulationState()

    expect(state.profile.name).toBe('Maya Chen')
    expect(state.profile.course).toBe('CS 342: Distributed Systems')
    expect(state.hubs[0].title).toBe('Distributed Systems')
    expect(state.notes).toHaveLength(8)
    expect(state.files.some((file) => file.path === 'Inbox/Distributed_Systems_Primer.pdf')).toBe(true)
  })

  it('keeps note updates in memory and resets to seed content', () => {
    resetSimulationState()
    const original = getSimulationState().notesByPath['Notes/Consensus.md'].content

    patchSimulationNote('Notes/Consensus.md', 'temporary edit')

    expect(getSimulationState().notesByPath['Notes/Consensus.md'].content).toBe('temporary edit')

    resetSimulationState()

    expect(getSimulationState().notesByPath['Notes/Consensus.md'].content).toBe(original)
  })
})
