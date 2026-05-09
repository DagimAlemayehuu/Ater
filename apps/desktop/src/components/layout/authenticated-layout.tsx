import { Outlet } from 'react-router-dom'
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import React from 'react'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

function AuthenticatedLayoutContent({ children }: AuthenticatedLayoutProps) {
  const { isFullscreen } = useLayout()
  
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {!isFullscreen && <AppSidebar />}
      <main id="content" className="flex-1 flex flex-col overflow-hidden relative">
        <AppHeader />
        <div className="flex-1 overflow-auto relative">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SearchProvider>
      <LayoutProvider>
        <AuthenticatedLayoutContent>
          {children}
        </AuthenticatedLayoutContent>
      </LayoutProvider>
    </SearchProvider>
  )
}
