import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Teacher from '../routes/teacher'
import { ConfigProvider } from '../lib/ConfigContext'
import { HeaderProvider } from '../context/header-context'
import { sidecarApi } from '../lib/sidecarApi'

vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    teacherChatStream: vi.fn(),
    getMachineId: vi.fn().mockResolvedValue('test-machine'),
    siloTest: vi.fn().mockResolvedValue('Silo Test OK'),
    testAiConnection: vi.fn().mockResolvedValue({ success: true }),
    logFromJs: vi.fn(),
  },
}))

type StreamEvent = {
  type: string
  message?: string
  content?: string
  title?: string
  preview_url?: string
  lesson_path?: string
}

function streamFromEvents(events: StreamEvent[]) {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      controller.close()
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function renderTeacher() {
  return render(
    <MemoryRouter>
      <ConfigProvider>
        <HeaderProvider>
          <Teacher />
        </HeaderProvider>
      </ConfigProvider>
    </MemoryRouter>,
  )
}

describe('Teacher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('streams chat and opens a lesson preview when a lesson is created', async () => {
    vi.mocked(sidecarApi.teacherChatStream).mockResolvedValue(streamFromEvents([
      { type: 'status', message: 'Preparing lesson workspace...' },
      { type: 'chunk', content: 'I created your first lesson.' },
      {
        type: 'lesson_created',
        title: 'Binary Search For Coding Interviews',
        preview_url: 'http://127.0.0.1:8765/api/teacher/lessons/binary/0001.html',
        lesson_path: 'Lessons/binary/lessons/0001.html',
      },
    ]))

    renderTeacher()

    fireEvent.change(screen.getByPlaceholderText(/Ask Teacher/i), {
      target: { value: 'Teach me binary search' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/I created your first lesson/i)).toBeInTheDocument()
      expect(screen.getByTitle('Binary Search For Coding Interviews')).toHaveAttribute(
        'src',
        'http://127.0.0.1:8765/api/teacher/lessons/binary/0001.html',
      )
    })
  })
})
