import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'

import { LearningWorkspace } from '../components/intelligence/LearningWorkspace'
import { sidecarApi } from '../lib/sidecarApi'

vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    readObsidianNote: vi.fn().mockImplementation((path) => {
      if (path.includes('Git_Hub')) {
        return Promise.resolve({
          content: `
# Git Hub
## Curriculum
- [x] [[What_Git_Is]]
- [ ] [[Git_Foundations]]
- [ ] [[Branches]]
`
        })
      }
      if (path.includes('remediation_temp')) {
        return Promise.resolve({
          content: `---
type: Remediation Lesson
---

# Concept Lesson

Nested Remediation Lesson

## Practice Question

\`\`\`interactive-quiz
[
  {
    "id": "rq1",
    "type": "mcq",
    "question": "First temp question?",
    "options": { "A": "Correct", "B": "Wrong" },
    "answer": "A",
    "explanation": "Correct."
  }
]
\`\`\`
`,
        })
      }
      return Promise.resolve({
        content: `---
title: Git Foundations
---

## Mental Model

Git tracks project history as linked snapshots.

## The Proving Grounds

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What does Git track?",
    "options": { "A": "History", "B": "Only names" },
    "answer": "A",
    "explanation": "Git tracks history."
  }
]
\`\`\`
`,
      })
    }),
    srsCards: vi.fn().mockResolvedValue({ cards: [] }),
    explainQuestion: vi.fn().mockResolvedValue({ is_correct: true, explanation: 'Correct.' }),
    recordPerformance: vi.fn().mockResolvedValue({ success: true }),
    logPracticeAttempt: vi.fn().mockResolvedValue({ success: true }),
    logPracticeResult: vi.fn().mockResolvedValue({ success: true }),
    updatePracticeScore: vi.fn().mockResolvedValue({ success: true }),
    submitTutorAnswer: vi.fn().mockResolvedValue({
      score: 5,
      score_change: 5,
      diagnosis: { is_misconception: false, misconception_text: '', hint: '', remediation_question: null },
      session: null,
    }),
    getTutorStatus: vi.fn().mockResolvedValue(null),
    practiceRemediate: vi.fn().mockResolvedValue({
      detailed_lesson: 'Review the correction.',
      remediation_question: {
        id: 'rq1',
        type: 'mcq',
        question: 'Remediation check?',
        options: { A: 'Correct', B: 'Wrong' },
        answer: 'A',
        explanation: 'Correct.',
      },
    }),
    advanceTutorSession: vi.fn().mockResolvedValue({ can_advance: false, message: 'blocked' }),
    srsFeynmanValidate: vi.fn(),
    createObsidianFile: vi.fn().mockResolvedValue({ success: true }),
    deleteObsidianItem: vi.fn().mockResolvedValue({ success: true }),
  },
}))

function StatefulLearningWorkspace({
  initialPreview,
  initialTutorSession,
  onPreviewChange,
  onTutorSessionChange,
}: {
  initialPreview: any
  initialTutorSession: any
  onPreviewChange?: (preview: any) => void
  onTutorSessionChange?: (session: any) => void
}) {
  const [preview, setPreview] = useState(initialPreview)
  const [tutorSession, setTutorSession] = useState(initialTutorSession)

  return (
    <LearningWorkspace
      preview={preview}
      tutorSession={tutorSession}
      onTutorSessionChange={(session) => {
        setTutorSession(session)
        onTutorSessionChange?.(session)
      }}
      onPreviewChange={(nextPreview) => {
        if (nextPreview) setPreview(nextPreview)
        onPreviewChange?.(nextPreview)
      }}
      onClose={() => {}}
    />
  )
}

describe('LearningWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders lesson notes with the same Proving Grounds gate and map status language as Knowledge Base', async () => {
    render(
      <MemoryRouter>
        <LearningWorkspace
          preview={{
            title: 'Git Foundations',
            lessonPath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            notePath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            hubPath: 'database/General/Git/Git_Hub.md',
            previewUrl: '',
          }}
          tutorSession={{
            hub_path: 'database/General/Git/Git_Hub.md',
            current_note_path: 'database/General/Git/01_Foundations/Git_Foundations.md',
            completed_notes: ['database/General/Git/01_Foundations/What_Git_Is.md'],
            active_note_unlocks: [
              'database/General/Git/01_Foundations/What_Git_Is.md',
              'database/General/Git/01_Foundations/Git_Foundations.md',
            ],
            curriculum: [
              'database/General/Git/01_Foundations/What_Git_Is.md',
              'database/General/Git/01_Foundations/Git_Foundations.md',
              'database/General/Git/02_Branching/Branches.md',
            ],
            roadmap: [
              { path: 'database/General/Git/01_Foundations/What_Git_Is.md', status: 'completed' },
              { path: 'database/General/Git/01_Foundations/Git_Foundations.md', status: 'current' },
              { path: 'database/General/Git/02_Branching/Branches.md', status: 'locked' },
            ],
          }}
          onTutorSessionChange={() => {}}
          onPreviewChange={() => {}}
          onClose={() => {}}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Git tracks project history/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Git Foundations', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument()
    expect(screen.queryByText('What does Git track?')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start practice/i }))
    expect(await screen.findByText('What does Git track?')).toBeInTheDocument()
    expect(screen.queryByText(/Git tracks project history/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Git Foundations', level: 1 })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText('Completed lesson: What Git Is')).toBeInTheDocument()
      expect(screen.getByLabelText('Current lesson: Git Foundations')).toBeInTheDocument()
      expect(screen.getByLabelText('Locked lesson: Branches')).toBeInTheDocument()
    })
    expect(screen.queryByText(/🔒/)).not.toBeInTheDocument()
  })

  it('reloads the remediation lesson when a nested follow-up opens the same temp note path', async () => {
    const onPreviewChange = vi.fn()

    render(
      <MemoryRouter>
        <LearningWorkspace
          preview={{
            title: 'Remediation Lesson',
            lessonPath: 'database/learning paths/remediation_temp.md',
            notePath: 'database/learning paths/remediation_temp.md',
            hubPath: 'database/General/Git/Git_Hub.md',
            previewUrl: '',
          }}
          tutorSession={{
            hub_path: 'database/General/Git/Git_Hub.md',
            current_note_path: 'database/learning paths/remediation_temp.md',
            completed_notes: [],
            active_note_unlocks: ['database/learning paths/remediation_temp.md'],
            curriculum: ['database/learning paths/remediation_temp.md'],
            roadmap: [{ path: 'database/learning paths/remediation_temp.md', status: 'current' }],
          }}
          onTutorSessionChange={() => {}}
          onPreviewChange={onPreviewChange}
          onClose={() => {}}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Nested Remediation Lesson/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('First temp question?')).toBeInTheDocument()
    expect(screen.queryByText(/Nested Remediation Lesson/i)).not.toBeInTheDocument()

    fireEvent(
      window,
      new CustomEvent('ater:open-remediation-lesson', {
        detail: { tempPath: 'database/learning paths/remediation_temp.md' },
      }),
    )

    expect(await screen.findByText(/Nested Remediation Lesson/i)).toBeInTheDocument()
    expect(screen.queryByText('First temp question?')).not.toBeInTheDocument()
    expect(onPreviewChange).toHaveBeenCalledWith(expect.objectContaining({
      notePath: 'database/learning paths/remediation_temp.md',
    }))
  })

  it('returns from a correct remediation answer to the next original Proving Grounds question', async () => {
    const readMock = vi.mocked(sidecarApi.readObsidianNote)
    readMock.mockImplementation((path: string) => {
      if (path.includes('Git_Hub')) {
        return Promise.resolve({
          content: `
# Git Hub
## Curriculum
- [ ] [[Git_Foundations]]
`,
        })
      }
      if (path.includes('remediation_temp')) {
        return Promise.resolve({
          content: `---
type: Remediation Lesson
---

# Concept Lesson

Review the correction.

\`\`\`interactive-quiz
[
  {
    "id": "rq1",
    "type": "mcq",
    "question": "Remediation check?",
    "options": { "A": "Correct", "B": "Wrong" },
    "answer": "A",
    "explanation": "Correct."
  }
]
\`\`\`
`,
        })
      }
      return Promise.resolve({
        content: `---
title: Git Foundations
---

## Mental Model

Git tracks project history as linked snapshots.

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "First question?",
    "options": { "A": "Right", "B": "Wrong" },
    "answer": "A",
    "explanation": "First explanation."
  },
  {
    "id": "q2",
    "type": "mcq",
    "question": "Second question?",
    "options": { "A": "Right", "B": "Wrong" },
    "answer": "A",
    "explanation": "Second explanation."
  }
]
\`\`\`
`,
      })
    })

    render(
      <MemoryRouter>
        <StatefulLearningWorkspace
          initialPreview={{
            title: 'Git Foundations',
            lessonPath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            notePath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            hubPath: 'database/General/Git/Git_Hub.md',
            previewUrl: '',
          }}
          initialTutorSession={{
            hub_path: 'database/General/Git/Git_Hub.md',
            current_note_path: 'database/General/Git/01_Foundations/Git_Foundations.md',
            completed_notes: [],
            active_note_unlocks: ['database/General/Git/01_Foundations/Git_Foundations.md'],
            curriculum: ['database/General/Git/01_Foundations/Git_Foundations.md'],
            roadmap: [{ path: 'database/General/Git/01_Foundations/Git_Foundations.md', status: 'current' }],
          }}
        />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /start practice/i }))
    expect(await screen.findByText('First question?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('B'))
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }))
    const detailedExplanation = await screen.findByRole('button', { name: /detailed explanation/i })
    await waitFor(() => expect(detailedExplanation).not.toBeDisabled())
    fireEvent.click(detailedExplanation)

    fireEvent.click(await screen.findByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Remediation check?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('A'))
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }))

    expect(await screen.findByText('Second question?')).toBeInTheDocument()
    expect(screen.queryByText('Remediation check?')).not.toBeInTheDocument()
  })

  it('advances to the next lesson returned by the tutor session after practice completion', async () => {
    vi.mocked(sidecarApi.readObsidianNote).mockImplementation((path: string) => {
      if (path.includes('Git_Hub')) {
        return Promise.resolve({
          content: `
# Git Hub
## Curriculum
- [ ] [[Git_Foundations]]
- [ ] [[Branches]]
`,
        })
      }
      return Promise.resolve({
        content: `---
title: Git Foundations
---

## Mental Model

Git tracks project history as linked snapshots.

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What does Git track?",
    "options": { "A": "History", "B": "Only names" },
    "answer": "A",
    "explanation": "Git tracks history."
  }
]
\`\`\`
`,
      })
    })
    vi.mocked(sidecarApi.advanceTutorSession).mockResolvedValueOnce({
      can_advance: true,
      session: {
        hub_path: 'database/General/Git/Git_Hub.md',
        current_note_path: 'database/General/Git/02_Branching/Branches.md',
        completed_notes: ['database/General/Git/01_Foundations/Git_Foundations.md'],
        active_note_unlocks: [
          'database/General/Git/01_Foundations/Git_Foundations.md',
          'database/General/Git/02_Branching/Branches.md',
        ],
        curriculum: [
          'database/General/Git/01_Foundations/Git_Foundations.md',
          'database/General/Git/02_Branching/Branches.md',
        ],
        roadmap: [
          { path: 'database/General/Git/01_Foundations/Git_Foundations.md', status: 'completed' },
          { path: 'database/General/Git/02_Branching/Branches.md', status: 'current' },
        ],
      },
    })
    const onPreviewChange = vi.fn()
    const onTutorSessionChange = vi.fn()

    render(
      <MemoryRouter>
        <StatefulLearningWorkspace
          initialPreview={{
            title: 'Git Foundations',
            lessonPath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            notePath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            hubPath: 'database/General/Git/Git_Hub.md',
            previewUrl: '',
          }}
          initialTutorSession={{
            session_id: 'session-1',
            hub_path: 'database/General/Git/Git_Hub.md',
            current_note_path: 'database/General/Git/01_Foundations/Git_Foundations.md',
            completed_notes: [],
            active_note_unlocks: ['database/General/Git/01_Foundations/Git_Foundations.md'],
            curriculum: [
              'database/General/Git/01_Foundations/Git_Foundations.md',
              'database/General/Git/02_Branching/Branches.md',
            ],
            roadmap: [{ path: 'database/General/Git/01_Foundations/Git_Foundations.md', status: 'current' }],
          }}
          onTutorSessionChange={onTutorSessionChange}
          onPreviewChange={onPreviewChange}
        />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /start practice/i }))
    fireEvent.click(await screen.findByText('History'))
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }))
    fireEvent.click(await screen.findByRole('button', { name: /finish & view score/i }))
    fireEvent.click(await screen.findByRole('button', { name: /next lesson/i }))

    await waitFor(() => {
      expect(onPreviewChange).toHaveBeenCalledWith(expect.objectContaining({
        notePath: 'database/General/Git/02_Branching/Branches.md',
      }))
    })
    expect(onTutorSessionChange).toHaveBeenCalled()
  })

  it('shows the backend transfer gate instead of claiming no transfer task is required', async () => {
    vi.mocked(sidecarApi.readObsidianNote).mockImplementation((path: string) => {
      if (path.includes('Git_Hub')) {
        return Promise.resolve({
          content: `
# Git Hub
## Curriculum
- [ ] [[Git_Foundations]]
`,
        })
      }
      return Promise.resolve({
        metadata: {},
        content: `---
title: Git Foundations
---

## Mental Model

Git tracks project history as linked snapshots.

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What does Git track?",
    "options": { "A": "History", "B": "Only names" },
    "answer": "A",
    "explanation": "Git tracks history."
  }
]
\`\`\`
`,
      })
    })
    vi.mocked(sidecarApi.getTutorStatus).mockResolvedValue({
      session_id: 'session-transfer',
      current_note_mastery: {
        note_path: 'database/General/Git/01_Foundations/Git_Foundations.md',
        recall_passed: true,
        transfer_passed: false,
        has_transfer: true,
        transfer_task: {
          type: 'scenario',
          prompt: 'Apply Git history tracking to a team rollback scenario.',
          grading_criteria: 'Explains snapshot history and recovery.',
        },
      },
      transfer_gate_outcomes: {},
    })

    render(
      <MemoryRouter>
        <StatefulLearningWorkspace
          initialPreview={{
            title: 'Git Foundations',
            lessonPath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            notePath: 'database/General/Git/01_Foundations/Git_Foundations.md',
            hubPath: 'database/General/Git/Git_Hub.md',
            previewUrl: '',
          }}
          initialTutorSession={{
            session_id: 'session-transfer',
            hub_path: 'database/General/Git/Git_Hub.md',
            current_note_path: 'database/General/Git/01_Foundations/Git_Foundations.md',
            completed_notes: [],
            active_note_unlocks: ['database/General/Git/01_Foundations/Git_Foundations.md'],
            curriculum: ['database/General/Git/01_Foundations/Git_Foundations.md'],
            roadmap: [{ path: 'database/General/Git/01_Foundations/Git_Foundations.md', status: 'current' }],
          }}
        />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /start practice/i }))
    fireEvent.click(await screen.findByText('History'))
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }))
    fireEvent.click(await screen.findByRole('button', { name: /finish & view score/i }))

    expect(await screen.findByText(/Apply Git history tracking/i)).toBeInTheDocument()
    expect(screen.queryByText(/No transfer task required/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next lesson/i })).not.toBeInTheDocument()
  })
})
