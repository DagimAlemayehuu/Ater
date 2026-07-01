import React from 'react'
import { Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cleanTitle } from './utils'

interface PracticeHistoryProps {
  view: string
  setView: (v: string) => void
  pastPractices: any[]
  handleResumePractice: (path: string) => void
  handleDeletePractice: (path: string) => void
}

export function PracticeHistory({
  view,
  setView,
  pastPractices,
  handleResumePractice,
  handleDeletePractice,
}: PracticeHistoryProps) {
  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <h1 className="text-[14px] font-black uppercase tracking-widest text-foreground font-sans">Practice History</h1>
              <p className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Review and manage past study session logs</p>
            </div>
            <button
              onClick={() => setView('configuring')}
              className="h-9 px-4 border border-border/40 bg-bento-card hover:bg-bento-item text-foreground hover:border-foreground/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Start New Session
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border/40 pb-2">
              Past Sessions
            </h3>
            <div className="space-y-2">
              {(Array.isArray(pastPractices) ? pastPractices : [])
                .slice()
                .reverse()
                .map((p, i) => (
                  <div
                    key={i}
                    onClick={() => handleResumePractice(p.path)}
                    className="group p-4 bg-bento-card border border-border/40 rounded-[8px] cursor-pointer hover:border-foreground/20 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-mono font-black text-foreground">{p.score}%</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-foreground">
                          {cleanTitle(p.hub_title || 'Untitled')}
                        </span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          {new Date(p.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePractice(p.path)
                      }}
                      className="p-1.5 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-[4px] transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
