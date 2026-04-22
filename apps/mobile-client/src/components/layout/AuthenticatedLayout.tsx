import React from 'react'
import { Outlet } from 'react-router-dom'
import { MobileHeader } from './MobileHeader'
import { MobileNavbar } from './MobileNavbar'

export function AuthenticatedLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden">
      {/* Fixed Mobile Header */}
      <MobileHeader />

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pt-16 pt-safe mb-20 custom-scrollbar relative">
        <Outlet />
      </main>

      {/* Fixed Bottom Navigation (Reflection of Desktop Sidebar) */}
      <MobileNavbar />
    </div>
  )
}
