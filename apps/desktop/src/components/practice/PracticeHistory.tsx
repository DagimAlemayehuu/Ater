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
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex bg-bento-card p-1 rounded-[8px] border border-border w-auto">
              <button
                onClick={() => setView('dashboard')}
                className={cn(
                  'flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] ',
                  view === 'dashboard'
                    ? 'bg-bento-item text-foreground border border-border'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-bento-item/50'
                )}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('history')}
                className={cn(
                  'flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] ',
                  view === 'history'
                    ? 'bg-bento-item text-foreground border border-border'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-bento-item/50'
                )}
              >
                History
              </button>
              <button
                onClick={() => setView('vault')}
                className={cn(
                  'flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] flex items-center gap-1',
                  view === 'vault'
                    ? 'bg-bento-item text-foreground border border-border'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-bento-item/50'
                )}
              >
                <BookOpen size={10} />
                Reference Vault
              </button>
            </div>
            <Button
              onClick={() => setView('configuring')}
              className="h-9 w-auto px-6 bg-bento-card border border-border rounded-[8px] font-black uppercase tracking-widest text-[9px] hover:border-foreground/50 transition-none"
            >
              Start
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border pb-2">
              Past Sessions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(Array.isArray(pastPractices) ? pastPractices : [])
                .slice()
                .reverse()
                .map((p, i) => (
                  <div
                    key={i}
                    onClick={() => handleResumePractice(p.path)}
                    className="group p-4 bg-bento-card border border-border rounded-[8px] cursor-pointer hover:border-foreground/30 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-black text-muted-foreground/40">{p.score}%</div>
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
                      className="p-1.5 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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
