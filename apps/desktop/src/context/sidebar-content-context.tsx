import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react'

type SidebarContentContextType = {
  sidebarContent: ReactNode | null
  setSidebarContent: (content: ReactNode | null, ownerKey?: string) => void
}

const SidebarContentContext = createContext<SidebarContentContextType | undefined>(undefined)

export function SidebarContentProvider({ children }: { children: ReactNode }) {
  const [sidebarContent, setSidebarContentState] = useState<ReactNode | null>(null)
  const currentOwnerRef = useRef<string | null>(null)

  const setSidebarContent = useCallback((content: ReactNode | null, ownerKey?: string) => {
    if (content === null) {
      if (!ownerKey || currentOwnerRef.current === ownerKey) {
        setSidebarContentState(null)
        currentOwnerRef.current = null
      }
    } else {
      setSidebarContentState(content)
      if (ownerKey) {
        currentOwnerRef.current = ownerKey
      }
    }
  }, [])

  return (
    <SidebarContentContext.Provider value={{ sidebarContent, setSidebarContent }}>
      {children}
    </SidebarContentContext.Provider>
  )
}

export function useSidebarContent() {
  const context = useContext(SidebarContentContext)
  if (context === undefined) {
    // Return safe fallback for unit tests running outside AuthenticatedLayout
    return {
      sidebarContent: null,
      setSidebarContent: () => {}
    }
  }
  return context
}
