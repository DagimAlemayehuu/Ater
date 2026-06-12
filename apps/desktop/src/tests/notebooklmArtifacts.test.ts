import { describe, expect, it } from 'vitest'

import {
  getNotebookLMArtifactId,
  getNotebookLMArtifactLabel,
  getNotebookLMArtifactType,
  getNotebookLMDownloadFormat,
} from '@/lib/notebooklmArtifacts'

describe('NotebookLM artifact helpers', () => {
  it('falls back when the CLI returns a studio artifact without artifact_type', () => {
    const artifact = {
      id: 'artifact-1',
      status: 'completed',
      title: 'Generated podcast',
    }

    expect(getNotebookLMArtifactType(artifact)).toBe('unknown')
    expect(getNotebookLMArtifactLabel(artifact)).toBe('Generated podcast')
    expect(getNotebookLMDownloadFormat(artifact, {})).toBe('')
  })

  it('normalizes known alternate artifact type fields', () => {
    const artifact = {
      artifactId: 'artifact-2',
      type: 'slide_deck',
      status: 'completed',
    }

    expect(getNotebookLMArtifactId(artifact)).toBe('artifact-2')
    expect(getNotebookLMArtifactType(artifact)).toBe('slide_deck')
    expect(getNotebookLMArtifactLabel(artifact)).toBe('Slide Deck')
    expect(getNotebookLMDownloadFormat(artifact, {})).toBe('pdf')
  })
})
