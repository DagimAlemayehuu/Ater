import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { HtmlLessonViewer } from '../components/obsidian/HtmlLessonViewer'

describe('HtmlLessonViewer', () => {
  it('renders HTML as a sandboxed lesson iframe instead of source text', () => {
    render(
      <HtmlLessonViewer
        title="Binary Search"
        content={'<!doctype html><html><head><style>body{color:white}</style></head><body><h1>Binary Search</h1></body></html>'}
      />,
    )

    const frame = screen.getByTitle('Binary Search')
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms')
    expect(frame).toHaveAttribute('srcDoc', expect.stringContaining('<style>'))
    expect(screen.queryByText(/body\{color:white\}/)).not.toBeInTheDocument()
  })

  it('advances to the next exact sibling lesson on NEXT_NOTE', () => {
    const onNavigate = vi.fn()
    render(
      <HtmlLessonViewer
        title="What Is Git"
        content={'<!doctype html><html><body>Lesson</body></html>'}
        activePath="Lessons/git/lessons/0001-what-is-git.html"
        files={[
          { name: '0001-git.html', path: 'Lessons/git/lessons/0001-git.html' },
          { name: '0001-what-is-git.html', path: 'Lessons/git/lessons/0001-what-is-git.html' },
          { name: '0002-installing-and-configuring-git.html', path: 'Lessons/git/lessons/0002-installing-and-configuring-git.html' },
        ]}
        onNavigate={onNavigate}
      />,
    )

    window.dispatchEvent(new MessageEvent('message', { data: { type: 'NEXT_NOTE' } }))

    expect(onNavigate).toHaveBeenCalledWith('Lessons/git/lessons/0002-installing-and-configuring-git.html')
  })
})
