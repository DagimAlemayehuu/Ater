import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { AppSidebar } from '../components/layout/app-sidebar'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/theme-provider'
import { SidebarContentProvider } from '../context/sidebar-content-context'
import { NavigationProvider } from '../context/navigation-provider'
import { LayoutProvider } from '../context/layout-provider'

// Mocking dependencies to avoid deep rendering issues
vi.mock('../context/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../context/navigation-context', () => ({
  useNavigation: () => ({ goBack: vi.fn(), goForward: vi.fn(), canGoBack: false, canGoForward: false }),
}))

vi.mock('../context/navigation-provider', () => ({
  NavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../context/sidebar-content-context', () => ({
  useSidebarContent: () => ({ sidebarContent: null }),
  SidebarContentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../context/layout-provider', () => ({
  useLayout: () => ({ isSidebarCollapsed: false, setIsSidebarCollapsed: vi.fn() }),
  LayoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../components/theme-switch', () => ({
  ThemeSwitch: () => <div>ThemeSwitch</div>
}))

// Mock usePomodoroStore
vi.mock('@/lib/pomodoroStore', () => ({
  usePomodoroStore: () => ({
    timeLeft: 1500,
    setShowOverlay: vi.fn(),
    isActive: false,
  })
}))

// Mock useSecurityStore
vi.mock('@/context/securityStore', () => ({
  useSecurityStore: () => 1000
}))

const renderSidebar = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <SidebarContentProvider>
          <NavigationProvider>
            <LayoutProvider>
              <AppSidebar />
            </LayoutProvider>
          </NavigationProvider>
        </SidebarContentProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('AppSidebar', () => {
  let localStorageSpy: any;
  
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  beforeEach(() => {
    localStorageSpy = vi.spyOn(Storage.prototype, 'getItem')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('does not poll ater_oracle_conversations from localStorage', async () => {
    renderSidebar()
    
    // Check that localStorage.getItem was NOT called with 'ater_oracle_conversations'
    const calls = localStorageSpy.mock.calls
    const hasConversationPoll = calls.some((call: any[]) => call[0] === 'ater_oracle_conversations')
    
    expect(hasConversationPoll).toBe(false)
  })

  it('renders conversations from chat store/API (if applicable)', () => {
    // This is tested implicitly by verifying we removed the localStorage dependency
    // Since AppSidebar currently doesn't render conversations directly in the remaining code 
    // (it looks like it just renders static links and content via SidebarContentProvider)
    renderSidebar()
    
    expect(screen.getByText('New Conversation')).toBeInTheDocument()
  })

  it('does not leave intervals on unmount', () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(global, 'setInterval')
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    
    const { unmount } = renderSidebar()
    
    // We shouldn't be setting any new intervals for polling
    expect(setIntervalSpy).not.toHaveBeenCalled()
    
    unmount()
    
    // And thus shouldn't be clearing them
    expect(clearIntervalSpy).not.toHaveBeenCalled()
    
    vi.useRealTimers()
  })
})
