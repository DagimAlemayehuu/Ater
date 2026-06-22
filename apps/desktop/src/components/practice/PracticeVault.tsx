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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex bg-bento-card p-1 rounded-[8px] border border-border w-auto">
              <button
                onClick={() => setView('dashboard')}
                className="flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] text-muted-foreground/40 hover:text-foreground hover:bg-bento-item/50 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('history')}
                className="flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] text-muted-foreground/40 hover:text-foreground hover:bg-bento-item/50 transition-colors"
              >
                History
              </button>
              <button className="flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[6px] bg-bento-item text-foreground border border-border flex items-center gap-1 transition-colors">
                <BookOpen size={10} />
                Reference Vault
              </button>
            </div>
            <Button
              onClick={() => setView('configuring')}
              className="h-9 w-auto px-6 bg-bento-card border border-border hover:border-foreground/50 text-foreground rounded-[8px] font-black uppercase tracking-widest text-[9px] transition-none"
            >
              New Session
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <div className="p-4 bg-bento-card border border-border rounded-[8px] space-y-3">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Hub</div>
                <Select
                  value={selectedHub}
                  onValueChange={(val: string) => {
                    setSelectedHub(val)
                    loadVaultFiles(val)
                  }}
                >
                  <SelectTrigger className="w-full h-9 bg-bento-item border-border rounded-[6px] px-3 text-[10px] font-black uppercase tracking-tight focus:ring-1 focus:ring-white/10 transition-colors">
                    <SelectValue placeholder="Select Hub..." />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-bento-card">
                    {hubs.map((hub) => (
                      <SelectItem
                        key={hub.id}
                        value={hub.id}
                        className="text-[10px] font-black uppercase tracking-tight hover:bg-bento-item"
                      >
                        {cleanTitle(hub.title)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-bento-card border border-border rounded-[8px] space-y-3">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  Add Source Text
                </div>
                <input
                  value={vaultSourceName}
                  onChange={(e) => setVaultSourceName(e.target.value)}
                  placeholder="Source name (e.g. Midterm 2024)"
                  className="w-full px-3 py-2 bg-bento-item border border-border rounded-[6px] text-[10px] font-medium focus:outline-none focus:border-foreground/20 text-foreground placeholder:text-muted-foreground/30 transition-colors"
                />
                <textarea
                  value={vaultSourceText}
                  onChange={(e) => setVaultSourceText(e.target.value)}
                  placeholder="Paste exam questions, worksheet text here..."
                  rows={5}
                  className="w-full px-3 py-2 bg-bento-item border border-border rounded-[6px] text-[10px] font-medium focus:outline-none focus:border-foreground/20 text-foreground placeholder:text-muted-foreground/30 resize-y transition-colors"
                />
                <Button
                  onClick={handleVaultUploadText}
                  disabled={vaultLoading || !vaultSourceText.trim() || !vaultSourceName.trim()}
                  className="w-full h-9 font-black uppercase tracking-widest text-[9px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-[6px] transition-colors"
                >
                  {vaultLoading ? <>{vaultStatus || 'Processing...'}</> : 'Extract & Solve Questions'}
                </Button>
              </div>
            </div>
            <div className="col-span-2 space-y-4">
              <div className="p-4 bg-bento-card border border-border rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    Question Banks
                  </div>
                  <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">
                    {vaultSelectedFiles.length} selected
                  </span>
                </div>
                {vaultFiles.length === 0 ? (
                  <div className="py-8 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">
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
                            'w-full text-left p-3 border rounded-[8px] flex items-center justify-between transition-colors',
                            isSel ? 'border-foreground/40 bg-[#e4e4e7]/5' : 'border-border bg-bento-item hover:border-foreground/20'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors',
                                isSel ? 'bg-[#e4e4e7] border-foreground' : 'border-border'
                              )}
                            >
                              {isSel && <Check size={10} className="text-background" />}
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-tight text-foreground">
                                {vf.name}
                              </div>
                              <div className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                {vf.total_questions} questions
                              </div>
                            </div>
                          </div>
                          <FileText size={12} className="text-muted-foreground/20" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {vaultFiles.length > 0 && (
                <div className="p-4 bg-bento-card border border-border rounded-[8px] space-y-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    Practice Mode
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setVaultMode(m.id as any)}
                        className={cn(
                          'p-3 border rounded-[8px] text-left transition-colors',
                          vaultMode === m.id
                            ? 'border-foreground/40 bg-[#e4e4e7]/5'
                            : 'border-border bg-bento-item hover:border-foreground/20'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-muted-foreground/60">{m.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tight text-foreground">
                            {m.label}
                          </span>
                          {vaultMode === m.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e4e4e7]" />}
                        </div>
                        <p className="text-[8px] text-muted-foreground/40 leading-relaxed">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                  <Button
                    data-tour="start-practice-btn"
                    onClick={handleVaultPracticeGenerate}
                    disabled={vaultLoading || vaultSelectedFiles.length === 0}
                    className="w-full h-10 font-black uppercase tracking-widest text-[9px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-[6px] transition-colors"
                  >
                    {vaultLoading ? (
                      <>Generating...</>
                    ) : (
                      <>
                        Practice from Vault <BookOpen size={13} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
