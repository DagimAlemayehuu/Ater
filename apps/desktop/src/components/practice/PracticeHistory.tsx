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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/45 mb-1.5">Practice History</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-foreground font-sans">Practice Session Log</h1>
              <p className="text-[9px] font-sans font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Review and manage past study session logs</p>
            </div>
            <button
              onClick={() => setView('configuring')}
              className="h-8 px-4 border border-foreground bg-foreground text-background hover:bg-foreground/85 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              Start New Session
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40 pb-2">
              Past Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Array.isArray(pastPractices) ? pastPractices : [])
                .slice()
                .reverse()
                .map((p, i) => {
                  const scoreVal = parseInt(p.score || 0)
                  const scoreColorClass = scoreVal >= 80 
                    ? 'border-[#aaccff]/35 bg-[#aaccff]/5 text-[#66aaff]' 
                    : scoreVal >= 50 
                      ? 'border-border/60 text-foreground bg-bento-item/50' 
                      : 'border-destructive/25 bg-destructive/5 text-destructive/80'

                  return (
                    <div
                      key={i}
                      onClick={() => handleResumePractice(p.path)}
                      className="group p-5 bg-bento-card border border-border/40 rounded-[12px] cursor-pointer hover:border-foreground/25 hover:bg-bento-item/10 flex items-center justify-between transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn("px-2.5 py-1 text-[11px] font-black rounded-[4px] border font-mono select-none shrink-0", scoreColorClass)}>
                          {p.score}%
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-black uppercase tracking-tight text-foreground truncate">
                            {cleanTitle(p.hub_title || 'Untitled')}
                          </span>
                          <span className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-widest mt-0.5">
                            {new Date(p.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePractice(p.path)
                        }}
                        className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-[4px] transition-all shrink-0 ml-2"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
            </div>
            {(Array.isArray(pastPractices) ? pastPractices : []).length === 0 && (
              <div className="p-8 border border-dashed border-border/50 bg-bento-card/30 rounded-[12px] text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">No past practice logs found</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
