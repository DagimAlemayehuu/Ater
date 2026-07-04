import React from 'react'
import { BookOpen, FlameKindling, Zap, Target, Trophy, Check, FileText } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cleanTitle } from './utils'
import { Hub } from '@/hooks/usePracticeConfig'

interface PracticeVaultProps {
  view: string
  setView: (v: string) => void
  hubs: Hub[]
  selectedHub: string
  setSelectedHub: (id: string) => void
  loadVaultFiles: (hubId: string) => void
  vaultSourceName: string
  setVaultSourceName: (v: string) => void
  vaultSourceText: string
  setVaultSourceText: (v: string) => void
  handleVaultUploadText: () => void
  vaultLoading: boolean
  vaultStatus: string
  vaultFiles: any[]
  vaultSelectedFiles: string[]
  setVaultSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>
  vaultMode: 'vault_only' | 'hard_only' | 'ai_variants' | 'mixed' | 'weak_spots' | 'exam_sim'
  setVaultMode: (m: 'vault_only' | 'hard_only' | 'ai_variants' | 'mixed' | 'weak_spots' | 'exam_sim') => void
  handleVaultPracticeGenerate: () => void
}

export function PracticeVault({
  view,
  setView,
  hubs,
  selectedHub,
  setSelectedHub,
  loadVaultFiles,
  vaultSourceName,
  setVaultSourceName,
  vaultSourceText,
  setVaultSourceText,
  handleVaultUploadText,
  vaultLoading,
  vaultStatus,
  vaultFiles,
  vaultSelectedFiles,
  setVaultSelectedFiles,
  vaultMode,
  setVaultMode,
  handleVaultPracticeGenerate,
}: PracticeVaultProps) {
  const MODES = [
    { id: 'vault_only', label: 'All Questions', icon: <BookOpen size={11} />, desc: 'Every extracted question from selected sources' },
    { id: 'hard_only', label: 'Hard Only', icon: <FlameKindling size={11} />, desc: 'Only L3 & L4 difficulty questions' },
    { id: 'ai_variants', label: 'AI Variants', icon: <Zap size={11} />, desc: 'AI generates harder versions of real questions' },
    { id: 'weak_spots', label: 'Weak Spots', icon: <Target size={11} />, desc: 'Focus on your historically worst question types' },
    { id: 'exam_sim', label: 'Exam Simulation', icon: <Trophy size={11} />, desc: 'Random sample mimicking real exam conditions' },
  ]

  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/45 mb-1.5">Reference Vault</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-foreground font-sans">Question Reference Vault</h1>
              <p className="text-[9px] font-sans font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Extract and practice questions from local text and worksheets</p>
            </div>
            <button
              onClick={() => setView('configuring')}
              className="h-8 px-4 border border-border bg-bento-card hover:bg-bento-item text-foreground hover:border-foreground/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              Start New Session
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <div className="p-5 bg-bento-card border border-border/40 rounded-[12px] space-y-3 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Hub</div>
                <Select
                  value={selectedHub}
                  onValueChange={(val: string) => {
                    setSelectedHub(val)
                    loadVaultFiles(val)
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border/40 hover:border-foreground/20 rounded-[6px] px-3.5 text-[10px] font-black uppercase tracking-tight focus:ring-1 focus:ring-white/10 transition-colors text-foreground">
                    <SelectValue placeholder="Select Hub..." />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-bento-panel">
                    {hubs.map((hub) => (
                      <SelectItem
                        key={hub.id}
                        value={hub.id}
                        className="text-[10px] font-black uppercase tracking-tight hover:bg-bento-item text-foreground"
                      >
                        {cleanTitle(hub.title)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-5 bg-bento-card border border-border/40 rounded-[12px] space-y-4 shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                  Add Source Text
                </div>
                <input
                  value={vaultSourceName}
                  onChange={(e) => setVaultSourceName(e.target.value)}
                  placeholder="Source name (e.g. Midterm 2024)"
                  className="w-full px-3.5 py-2 bg-transparent border border-border/40 focus:border-foreground/30 rounded-[6px] text-[10px] font-sans focus:outline-none text-foreground placeholder:text-muted-foreground/30 transition-colors"
                />
                <textarea
                  value={vaultSourceText}
                  onChange={(e) => setVaultSourceText(e.target.value)}
                  placeholder="Paste exam questions, worksheet text here..."
                  rows={6}
                  className="w-full px-3.5 py-2 bg-transparent border border-border/40 focus:border-foreground/30 rounded-[6px] text-[10px] font-sans focus:outline-none text-foreground placeholder:text-muted-foreground/30 resize-none transition-colors custom-scrollbar"
                />
                <button
                  onClick={handleVaultUploadText}
                  disabled={vaultLoading || !vaultSourceText.trim() || !vaultSourceName.trim()}
                  className="w-full h-9 font-black uppercase tracking-widest text-[9px] bg-foreground text-background hover:bg-foreground/95 rounded-[6px] transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none font-sans"
                >
                  {vaultLoading ? <>{vaultStatus || 'Processing...'}</> : 'Extract & Solve Questions'}
                </button>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 space-y-4">
              <div className="p-5 bg-bento-card border border-border/40 rounded-[12px] space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    Question Banks
                  </div>
                  <span className="text-[8px] font-black text-muted-foreground/45 uppercase tracking-widest font-mono">
                    {vaultSelectedFiles.length} selected
                  </span>
                </div>
                {vaultFiles.length === 0 ? (
                  <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 select-none">
                    {selectedHub ? 'No vaults yet — upload a source above' : 'Select a hub first'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vaultFiles.map((vf: any) => {
                      const isSel = vaultSelectedFiles.includes(vf.path)
                      return (
                        <button
                          key={vf.path}
                          onClick={() =>
                            setVaultSelectedFiles((prev) =>
                              isSel ? prev.filter((p) => p !== vf.path) : [...prev, vf.path]
                            )
                          }
                          className={cn(
                            'w-full text-left p-4 border rounded-[12px] flex items-center justify-between transition-all cursor-pointer shadow-sm',
                            isSel ? 'border-foreground/35 bg-bento-item shadow-sm text-foreground' : 'border-border/40 bg-bento-card hover:bg-bento-item/10'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors',
                                isSel ? 'bg-foreground border-foreground text-background' : 'border-border bg-bento-panel'
                              )}
                            >
                              {isSel && <Check size={10} className="text-background" strokeWidth={4} />}
                            </div>
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-tight text-foreground">
                                {vf.name}
                              </div>
                              <div className="text-[8px] font-mono font-black text-muted-foreground/45 uppercase tracking-widest mt-0.5">
                                {vf.total_questions} questions
                              </div>
                            </div>
                          </div>
                          <FileText size={12} className="text-muted-foreground/30" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {vaultFiles.length > 0 && (
                <div className="p-5 bg-bento-card border border-border/40 rounded-[12px] space-y-4 shadow-sm">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    Practice Mode
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setVaultMode(m.id as any)}
                        className={cn(
                          'p-4 border rounded-[12px] text-left transition-all cursor-pointer shadow-sm',
                          vaultMode === m.id
                            ? 'border-foreground/35 bg-bento-item shadow-sm text-foreground'
                            : 'border-border/40 bg-bento-card hover:bg-bento-item/5 hover:border-foreground/20'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-muted-foreground/60">{m.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tight text-foreground">
                            {m.label}
                          </span>
                          {vaultMode === m.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />}
                        </div>
                        <p className="text-[8px] text-muted-foreground/50 leading-relaxed font-sans">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    data-tour="start-practice-btn"
                    onClick={handleVaultPracticeGenerate}
                    disabled={vaultLoading || vaultSelectedFiles.length === 0}
                    className="w-full h-10 font-black uppercase tracking-widest text-[9px] bg-foreground text-background hover:bg-foreground/90 rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none font-sans"
                  >
                    {vaultLoading ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <span>Practice from Vault</span>
                        <BookOpen size={12} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
