import { Outlet } from 'react-router-dom'
import { getCookie } from '@/lib/cookies'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { Header } from '@/components/layout/header'
import { ThemeSwitch } from '@/components/theme-switch'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset className='flex flex-col h-full overflow-hidden'>
            <Header fixed>
              <div className='ms-auto flex items-center space-x-4'>
                <ThemeSwitch />
              </div>
            </Header>
            <main id='content' className='flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar'>
              {children ?? <Outlet />}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
