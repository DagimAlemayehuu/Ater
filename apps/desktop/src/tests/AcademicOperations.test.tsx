import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AcademicDashboard from '../routes/academic'
import { sidecarApi } from '@/lib/sidecarApi'
import { MemoryRouter } from 'react-router-dom'
import { HeaderProvider } from '@/context/header-context'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarContentProvider } from '@/context/sidebar-content-context'

// Mock sidecarApi
vi.mock('@/lib/sidecarApi', () => ({
  sidecarApi: {
    academicsDashboard: vi.fn(),
    getStudyHistory: vi.fn(),
    listVaultDatabases: vi.fn(),
    updateVaultRow: vi.fn(),
    createVaultRow: vi.fn(),
    deleteVaultRow: vi.fn(),
    renameVaultFile: vi.fn(),
    academicsSyncProfile: vi.fn(),
    clearOptionsCache: vi.fn(),
    aterListInbox: vi.fn(),
    listObsidianFiles: vi.fn(),
    getVaultOptions: vi.fn()
  }
}))

const mockDashboardData = {
  years: [
    { id: 'Year I', title: 'Year I', Status: '[[Active]]', Program: '[[Computer Science]]', 'Current Year': true }
  ],
  semesters: [
    { id: 'Fall 2025', title: 'Fall 2025', Status: '[[Active]]', Year: '[[Year I]]' }
  ],
  courses: [],
  assignments: [],
  exams: [],
  study_sessions: []
}

describe('AcademicDashboard Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sidecarApi.academicsDashboard).mockResolvedValue(mockDashboardData as any)
    vi.mocked(sidecarApi.getStudyHistory).mockResolvedValue({ sessions: [], telemetry: [], practice: [] })
    vi.mocked(sidecarApi.listVaultDatabases).mockResolvedValue({ databases: [] })
    vi.mocked(sidecarApi.aterListInbox).mockResolvedValue({ files: [] })
    vi.mocked(sidecarApi.listObsidianFiles).mockResolvedValue({ files: [] })
    vi.mocked(sidecarApi.getVaultOptions).mockResolvedValue({ options: [] })
  })

  const renderDashboard = () => {
    return render(
      <MemoryRouter initialEntries={['/academic?tab=PROGRAM']}>
        <LayoutProvider>
          <HeaderProvider>
            <SidebarContentProvider>
              <AcademicDashboard />
            </SidebarContentProvider>
          </HeaderProvider>
        </LayoutProvider>
      </MemoryRouter>
    )
  }

  it('should load dashboard data successfully', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/Planner/i)).toBeInTheDocument()
    })
    expect(sidecarApi.academicsDashboard).toHaveBeenCalled()
  })

  it('should handle optimistic updates and revert on failure', async () => {
    vi.mocked(sidecarApi.updateVaultRow).mockRejectedValueOnce(new Error('Update failed'))

    // Navigate to YEARS tab
    render(
      <MemoryRouter initialEntries={['/academic?tab=YEARS']}>
        <LayoutProvider>
          <HeaderProvider>
            <SidebarContentProvider>
              <AcademicDashboard />
            </SidebarContentProvider>
          </HeaderProvider>
        </LayoutProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Year I/i)).toBeInTheDocument()
    })

    // Click on Year I to open detail view
    const yearItem = screen.getByText(/Year I/i)
    fireEvent.click(yearItem)

    await waitFor(() => {
      expect(screen.getAllByText(/Status/i).length).toBeGreaterThan(0)
    }, { timeout: 2000 })

    // Find the status card and try to change it
    const statusCard = screen.getAllByText(/Active/i)[0]
    fireEvent.click(statusCard)

    // Wait for the select editor
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search.../i)).toBeInTheDocument()
    })

    // Mock options for the select editor
    vi.mocked(sidecarApi.getVaultOptions).mockResolvedValue({ options: ['Active', 'Completed'] })

    // We need to re-trigger or wait for options to load.
    // In the test, we can just click a text that we know will be there if we mock it right or if it's default.
    // The SelectPropertyEditor has some defaults.

    await waitFor(() => {
      expect(screen.getByText(/Completed/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Completed/i))

    // Should call updateVaultRow
    await waitFor(() => {
      expect(sidecarApi.updateVaultRow).toHaveBeenCalled()
    })

    // Wait for failure and re-fetch. Use a longer timeout and check call count.
    await waitFor(() => {
      // In Promise.allSettled version, fetchData is called once more after update failure
      expect(sidecarApi.academicsDashboard).toHaveBeenCalledTimes(2)
    }, { timeout: 3000 })
  })

  it('should prevent concurrent CRUD operations using pendingOpsRef', async () => {
    vi.mocked(sidecarApi.updateVaultRow).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <MemoryRouter initialEntries={['/academic?tab=YEARS']}>
        <LayoutProvider>
          <HeaderProvider>
            <SidebarContentProvider>
              <AcademicDashboard />
            </SidebarContentProvider>
          </HeaderProvider>
        </LayoutProvider>
      </MemoryRouter>
    )

    await waitFor(() => screen.getByText(/Year I/i))
    fireEvent.click(screen.getByText(/Year I/i))

    await waitFor(() => screen.getAllByText(/Active/i)[0])

    // Trigger two updates rapidly
    fireEvent.click(screen.getAllByText(/Active/i)[0])
    await waitFor(() => screen.getByText(/Completed/i))

    fireEvent.click(screen.getByText(/Completed/i))
    fireEvent.click(screen.getByText(/Completed/i)) // Rapid second click

    expect(sidecarApi.updateVaultRow).toHaveBeenCalledTimes(1)
  })
})
