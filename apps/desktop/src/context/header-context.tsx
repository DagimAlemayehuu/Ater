import React, { createContext, useContext, useState, ReactNode } from 'react'

type HeaderContextType = {
  centerContent: ReactNode | null
  rightContent: ReactNode | null
  setCenterContent: (content: ReactNode | null) => void
  setRightContent: (content: ReactNode | null) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [centerContent, setCenterContent] = useState<ReactNode | null>(null)
  const [rightContent, setRightContent] = useState<ReactNode | null>(null)

  return (
    <HeaderContext.Provider value={{ centerContent, rightContent, setCenterContent, setRightContent }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}
