import { describe, expect, it } from 'vitest'
import { simulationSidecarApi } from '@/lib/simulation/adapter'
import { resetSimulationState } from '@/lib/simulation/state'

describe('simulation sidecar adapter', () => {
  it('returns deterministic vault files and notes', async () => {
    resetSimulationState()

    const files = await simulationSidecarApi.listObsidianFiles()
    const note = await simulationSidecarApi.readObsidianNote('Notes/Consensus.md')

    expect(files.files.some((file) => file.path === 'Notes/Consensus.md')).toBe(true)
    expect(note.content).toContain('Consensus is the problem')
  })

  it('provides zero-key AI and ingestion responses', async () => {
    await expect(simulationSidecarApi.testAiConnection()).resolves.toMatchObject({ success: true })
    await expect(simulationSidecarApi.aterProcess({ file_path: 'Inbox/Distributed_Systems_Primer.pdf' })).resolves.toMatchObject({
      curriculum: expect.objectContaining({ hub_title: 'Distributed Systems' }),
    })
    await expect(simulationSidecarApi.generatePracticeQuestions()).resolves.toMatchObject({
      questions: expect.arrayContaining([expect.objectContaining({ type: 'mcq' })]),
    })
  })

  it('records simulated practice only in memory', async () => {
    resetSimulationState()

    await simulationSidecarApi.logPracticeResult({ score: 1, total: 1, hubId: 'distributed_systems_hub' })
    const history = await simulationSidecarApi.getStudyHistory()

    expect(history.practice).toHaveLength(1)

    resetSimulationState()
    await expect(simulationSidecarApi.getStudyHistory()).resolves.toMatchObject({ practice: [] })
  })
})
