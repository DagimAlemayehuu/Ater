import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { NoteCanvas } from '../components/intelligence/NoteCanvas'
import { sidecarApi } from '../lib/sidecarApi'
import { toast } from 'sonner'

vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    findVaultPage: vi.fn(),
    readObsidianNote: vi.fn(),
    listObsidianFiles: vi.fn(),
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }
}))

describe('NoteCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders No Note Active when notePath is null', () => {
    render(<NoteCanvas notePath={null} />)
    expect(screen.getByText('No Note Active')).toBeInTheDocument()
  })

  it('renders markdown note content when loading is complete and no HTML companion exists', async () => {
    const mockNote = {
      content: '---\ntype: Atomic Note\n---\n# Sample Note Body',
      metadata: { type: 'Atomic Note' }
    }
    vi.mocked(sidecarApi.findVaultPage).mockResolvedValue({ found: true, path: 'Notes/Sample.md' })
    vi.mocked(sidecarApi.readObsidianNote).mockResolvedValue(mockNote)

    render(<NoteCanvas notePath="Sample" />)
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValue({ files: [] });

    await waitFor(() => {
      expect(screen.getByText('Sample Note Body')).toBeInTheDocument()
    })
    expect(screen.queryByText('Interactive Lesson')).not.toBeInTheDocument()
  })

  it('loads curriculum sequence and handles Back and Next navigation', async () => {
    const mockNote = {
      content: '---\nhub: "[[Git_Hub]]"\n---\n# Note 1',
      metadata: { hub: '[[Git_Hub]]' }
    }
    const onNavigate = vi.fn()

    vi.mocked(sidecarApi.findVaultPage).mockImplementation(async (name) => {
      if (name === 'Git_Hub') return { found: true, path: 'learning paths/Git_Hub.md' }
      return { found: true, path: 'Notes/What_Is_Git.md' }
    })

    vi.mocked(sidecarApi.readObsidianNote).mockImplementation(async (path) => {
      if (path.includes('Git_Hub')) {
        return {
          content: '## Curriculum Map\n- [[Chapter_01_Introduction_To_Git]]\n  - [[What_Is_Git]]\n  - [[Second_Note]]',
          metadata: {}
        }
      }
      return mockNote
    })

    render(<NoteCanvas notePath="What_Is_Git" onNavigate={onNavigate} />)

    await waitFor(() => {
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValue({ files: [] });
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    })

    const nextBtn = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(nextBtn)

    expect(onNavigate).toHaveBeenCalledWith('Second_Note')
  })

  it('renders Complete button on final step and calls onClose/toast on click', async () => {
    const mockNote = {
      content: '---\nhub: "[[Git_Hub]]"\n---\n# Note 2',
      metadata: { hub: '[[Git_Hub]]' }
    }
    const onClose = vi.fn()

    vi.mocked(sidecarApi.findVaultPage).mockImplementation(async (name) => {
      if (name === 'Git_Hub') return { found: true, path: 'learning paths/Git_Hub.md' }
      return { found: true, path: 'Notes/Second_Note.md' }
    })

    vi.mocked(sidecarApi.readObsidianNote).mockImplementation(async (path) => {
      if (path.includes('Git_Hub')) {
        return {
          content: '## Curriculum Map\n- [[Chapter_01_Introduction_To_Git]]\n  - [[What_Is_Git]]\n  - [[Second_Note]]',
          metadata: {}
        }
      }
      return mockNote
    })
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValue({ files: [] });

    render(<NoteCanvas notePath="Second_Note" onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    })

    const completeBtn = screen.getByRole('button', { name: 'Complete' })
    expect(completeBtn).toBeInTheDocument()

    fireEvent.click(completeBtn)

    expect(toast.success).toHaveBeenCalledWith('Curriculum completed successfully!')
    expect(onClose).toHaveBeenCalled()
  })


})
