import { Outlet } from 'react-router-dom'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { AppSidebar } from '@/components/layout/app-sidebar'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SearchProvider>
      <LayoutProvider>
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
          <AppSidebar />
          <main id="content" className="flex-1 overflow-hidden">
            {children ?? <Outlet />}
          </main>
        </div>
      </LayoutProvider>
    </SearchProvider>
  )
}
