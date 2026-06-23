import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InteractiveLessonPlayer from '../components/obsidian/InteractiveLessonPlayer';
import { AterMarkdown, MarkdownViewer } from '../components/obsidian/MarkdownViewer';

describe('InteractiveLessonPlayer Component', () => {
  const mockPayload = {
    title: 'Test Rubik\'s Cube Lesson',
    chapters: [
      {
        title: 'Chapter 1: Notation',
        content: 'Content for notation chapter.',
        widgetType: 'none'
      },
      {
        title: 'Chapter 2: Scramble',
        content: 'Content for scramble chapter.',
        widgetType: 'rubiks-cube',
        widgetPayload: {
          title: 'Rubik\'s Sandbox',
          description: 'Try R U R\' U\'',
          scramble: 'R U',
          solution: 'U\' R\''
        }
      }
    ]
  };

  it('renders the first chapter details', () => {
    render(<InteractiveLessonPlayer payload={mockPayload} />);
    
    expect(screen.getByText('Test Rubik\'s Cube Lesson')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1: Notation')).toBeInTheDocument();
    expect(screen.getByText('Content for notation chapter.')).toBeInTheDocument();
    
    // Checks that the Prev button is disabled on first chapter
    const prevButton = screen.getByRole('button', { name: /^prev$/i });
    expect(prevButton).toBeDisabled();
  });

  it('navigates next and previous chapters', () => {
    render(<InteractiveLessonPlayer payload={mockPayload} />);
    
    const nextButton = screen.getByRole('button', { name: /^next$/i });
    fireEvent.click(nextButton);

    expect(screen.getByText('Chapter 2: Scramble')).toBeInTheDocument();
    expect(screen.getByText('Content for scramble chapter.')).toBeInTheDocument();

    // Verify embedded rubiks cube widget title is rendered
    expect(screen.getByText('Rubik\'s Sandbox')).toBeInTheDocument();

    // Verify Completed status on the last page
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Click Prev
    const prevButton = screen.getByRole('button', { name: /^prev$/i });
    fireEvent.click(prevButton);

    expect(screen.getByText('Chapter 1: Notation')).toBeInTheDocument();
  });
});

describe('MarkdownViewer code block registration', () => {
  it('renders InteractiveLessonPlayer from a markdown interactive-lesson block', () => {
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

    expect(screen.getByText('Markdown Solving Lesson')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Perform the first step.')).toBeInTheDocument();
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
        <MarkdownViewer content={atomicNote} path="Lessons/git/lessons/0001-what-is-git.md" />
      </MemoryRouter>
    );

    expect(screen.getByText('Mental Model')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Formal Model')).toBeInTheDocument();
    expect(screen.getByText('Git is a durable project history model.')).toBeInTheDocument();
    expect(screen.queryByText(/Start Final Practice/i)).not.toBeInTheDocument();
  });
});
