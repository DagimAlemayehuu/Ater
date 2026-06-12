import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ArtifactViewer } from '../components/obsidian/ArtifactViewer'
import { useArtifactStore } from '../lib/artifacts/store'

describe('ArtifactViewer', () => {
  beforeEach(() => {
    useArtifactStore.getState().resetArtifacts()
  })

  it('renders text chapters as readable lesson pages instead of empty sandbox placeholders', () => {
    useArtifactStore.getState().registerArtifacts([
      {
        id: 'rubik-lesson',
        title: "Rubik's Cube Beginner Method",
        versions: [
          {
            version: 1,
            raw: '<artifact />',
            chapters: [
              {
                id: 'chapter-1',
                title: 'Step 1: Notation, Pieces, And Orientation',
                content: 'Hold white on bottom and yellow on top. Centers define each face color.',
              },
            ],
          },
        ],
      },
    ])

    render(<ArtifactViewer />)

    expect(screen.getByText('Step 1: Notation, Pieces, And Orientation')).toBeInTheDocument()
    expect(screen.getByText(/Hold white on bottom and yellow on top/)).toBeInTheDocument()
    expect(screen.queryByText(/This chapter has no sandbox/i)).not.toBeInTheDocument()
  })
})
