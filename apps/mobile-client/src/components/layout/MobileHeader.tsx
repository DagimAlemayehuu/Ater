import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function MobileHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full pt-safe bg-background/60 backdrop-blur-xl z-[100]">
      <div className="flex items-center justify-between px-6 h-12">
        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-primary active:scale-90 transition-all"
            aria-label="Go Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => navigate(1)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-primary active:scale-90 transition-all"
            aria-label="Go Forward"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  )
}
