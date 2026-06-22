import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
