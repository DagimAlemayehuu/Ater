import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AterMarkdown, MarkdownViewer } from '../components/obsidian/MarkdownViewer';

vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    srsCards: vi.fn().mockResolvedValue({ cards: [] }),
    explainQuestion: vi.fn().mockResolvedValue({
      is_correct: false,
      explanation: 'Git stores durable commit snapshots and links them through history.',
    }),
    readObsidianNote: vi.fn().mockResolvedValue({ content: '' }),
    recordPerformance: vi.fn().mockResolvedValue({ success: true }),
    submitTutorAnswer: vi.fn().mockResolvedValue({
      score: 5,
      score_change: 5,
      diagnosis: { is_misconception: false, misconception_text: '', hint: '', remediation_question: null },
      session: null,
    }),
    logPracticeAttempt: vi.fn().mockResolvedValue({ success: true }),
    updatePracticeScore: vi.fn().mockResolvedValue({ success: true }),
    srsFeynmanValidate: vi.fn(),
  },
}));

describe('MarkdownViewer code block registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders interactive-lesson blocks as plain markdown code', () => {
    const rawMarkdown = `
# Markdown Header

\`\`\`interactive-lesson
{
  "title": "Markdown Solving Lesson",
  "chapters": [
    {
      "title": "Step 1",
      "content": "Perform the first step."
    }
  ]
}
\`\`\`
`;
    render(
      <MemoryRouter>
        <AterMarkdown content={rawMarkdown} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Markdown Solving Lesson/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^prev$/i })).not.toBeInTheDocument();
  });

  it('renders atomic notes as normal markdown instead of the special lesson renderer', () => {
    const atomicNote = `---
title: What Is Git?
type: Atomic Note
---

## Mental Model

Git is a durable project history model.

## How It Works

Git stores commits and links them through parents.

## Formal Model

The repository is a directed acyclic graph.

## The Proving Grounds

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What does Git store?",
    "options": ["Commits", "Only folders"],
    "answer": "Commits",
    "explanation": "Git stores commit objects."
  }
]
\`\`\`
`;

    render(
      <MemoryRouter>
        <MarkdownViewer content={atomicNote} path="Lessons/git/lessons/0001-what-is-git.md" onNavigate={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Mental Model')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Formal Model')).toBeInTheDocument();
    expect(screen.getByText('Git is a durable project history model.')).toBeInTheDocument();
    expect(screen.queryByText(/Start Final Practice/i)).not.toBeInTheDocument();
  });

  it('opens Proving Grounds inline before showing one question at a time', async () => {
    const atomicNote = `---
title: What Is Git?
type: Atomic Note
---

## Mental Model

Git is a durable project history model.

## The Proving Grounds

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What does Git store?",
    "options": { "A": "Only folders", "B": "Commits" },
    "answer": "B",
    "explanation": "Git stores commit objects."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Git history is made from linked commits.",
    "answer": "True",
    "explanation": "Commits link to parent commits."
  }
]
\`\`\`
`;

    render(
      <MemoryRouter>
        <MarkdownViewer content={atomicNote} path="Lessons/git/lessons/0001-what-is-git.md" onNavigate={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
    expect(screen.queryByText('What does Git store?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));

    expect(await screen.findByRole('region', { name: /proving grounds practice/i })).toBeInTheDocument();
    expect(await screen.findByText('What does Git store?')).toBeInTheDocument();
    expect(screen.queryByText('Mental Model')).not.toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^check$/i })).toHaveLength(1);
    expect(screen.queryByText(/confidence wager/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Commits'));
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Git stores commit objects/i)).toBeInTheDocument();
    });
  });
});
