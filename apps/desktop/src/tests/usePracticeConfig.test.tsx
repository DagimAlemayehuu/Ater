import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { usePracticeConfig } from '../hooks/usePracticeConfig'
import { sidecarApi } from '../lib/sidecarApi'

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    listHubs: vi.fn().mockResolvedValue({ hubs: [{ id: 'hub-1', title: 'Hub One', path: 'path-1' }] }),
    listPractices: vi.fn().mockResolvedValue({ practices: [] }),
    getPracticeAnalytics: vi.fn().mockResolvedValue({ modalities: {}, weakest_concepts: [] }),
    listHubNotes: vi.fn().mockResolvedValue({ notes: [] }),
    vaultList: vi.fn().mockResolvedValue({ vaults: [] }),
  },
}))

// Mock usePracticeSession
vi.mock('../hooks/usePracticeSession', () => ({
  usePracticeSession: () => ({
    questions: [],
    currentQuestionIdx: 0,
    currentQuestion: null,
    startSession: vi.fn(),
    reset: vi.fn(),
  }),
}))

describe('usePracticeConfig custom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes dashboard view correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/practice?view=dashboard']}>
        {children}
      </MemoryRouter>
    )

    const { result } = renderHook(() => usePracticeConfig(), { wrapper })

    expect(result.current.view).toBe('dashboard')
  })

  it('initializes configuration states correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/practice?hubId=hub-1&view=configuring']}>
        {children}
      </MemoryRouter>
    )

    const { result } = renderHook(() => usePracticeConfig(), { wrapper })

    expect(result.current.selectedHub).toBe('hub-1')
    expect(result.current.view).toBe('configuring')
    expect(result.current.advancedConfig.difficulty).toBe('Mixed')
  })

  it('initializes vault view correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/practice?hubId=hub-1&view=vault']}>
        {children}
      </MemoryRouter>
    )

    const { result } = renderHook(() => usePracticeConfig(), { wrapper })

    expect(result.current.view).toBe('vault')
    expect(result.current.selectedHub).toBe('hub-1')
  })
})
