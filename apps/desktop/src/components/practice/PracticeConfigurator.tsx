import React from 'react'
import { Check, Layers, Zap } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AdvancedPracticeConfig } from '@/types/practice'
import { Hub, PRESETS, ZERO_DISTRIBUTION } from '@/hooks/usePracticeConfig'
import { cleanTitle } from './utils'

interface PracticeConfiguratorProps {
  setView: (v: string) => void
  advancedConfig: AdvancedPracticeConfig
  setAdvancedConfig: React.Dispatch<React.SetStateAction<AdvancedPracticeConfig>>
  hubs: Hub[]
  selectedHub: string
  setSelectedHub: (id: string) => void
  availableNotes: any[]
  isLoading: boolean
  handleStartSession: () => void
  loadHubNotes: (hubId: string) => void
}

export function PracticeConfigurator({
  setView,
  advancedConfig,
  setAdvancedConfig,
  hubs,
  selectedHub,
  setSelectedHub,
  availableNotes,
  isLoading,
  handleStartSession,
  loadHubNotes,
}: PracticeConfiguratorProps) {
  const totalQuestions = Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0)

  const toggleAtomicNote = (noteId: string) => {
    setAdvancedConfig((prev) => ({
      ...prev,
      selectedAtomicNotes: prev.selectedAtomicNotes.includes(noteId)
        ? prev.selectedAtomicNotes.filter((n) => n !== noteId)
        : [...prev.selectedAtomicNotes, noteId],
    }))
  }

  const updateDistribution = (type: keyof AdvancedPracticeConfig['questionDistribution'], val: number) => {
    setAdvancedConfig((prev) => ({
      ...prev,
      questionDistribution: { ...prev.questionDistribution, [type]: val },
    }))
  }

  const applyPreset = (key: string) => {
    const p = PRESETS[key]
    if (!p) return
    const { label: _l, ...dist } = p
    setAdvancedConfig((prev) => ({
      ...prev,
      questionDistribution: { ...ZERO_DISTRIBUTION, ...dist },
    }))
  }

  const randomizeDistribution = () => {
    const types = Object.keys(ZERO_DISTRIBUTION) as (keyof typeof ZERO_DISTRIBUTION)[]
    const count = Math.floor(Math.random() * 4) + 3 // 3-6 active types
    const shuffled = [...types].sort(() => Math.random() - 0.5).slice(0, count)
    const dist = { ...ZERO_DISTRIBUTION }
    let remaining = Math.floor(Math.random() * 10) + 10 // 10-20 total
    shuffled.forEach((t, i) => {
      const share =
        i === shuffled.length - 1
          ? remaining
          : Math.max(1, Math.floor(Math.random() * ((remaining / (shuffled.length - i)) * 1.5)))
      dist[t] = Math.min(share, remaining)
      remaining = Math.max(0, remaining - dist[t])
    })
    setAdvancedConfig((prev) => ({ ...prev, questionDistribution: dist }))
    toast.success('Randomized!')
  }

  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col p-10">
        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-5">
          <button
            onClick={() => setView('dashboard')}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border/40 rounded-[6px] bg-bento-card hover:bg-bento-item transition-all cursor-pointer"
          >
            Cancel
          </button>
          <div className="text-xl font-sans font-black tracking-tight text-foreground">{totalQuestions} Questions</div>
        </div>

        <div data-tour="practice-config-panel" className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          <div className="col-span-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 bg-bento-card border border-border/40 rounded-[8px] space-y-5">
              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Hub</Label>
                <Select
                  value={selectedHub}
                  onValueChange={(val: string) => {
                    setSelectedHub(val)
                    loadHubNotes(val)
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border/40 rounded-[6px] px-4 text-[10px] font-black uppercase tracking-tight hover:border-foreground/20 transition-colors text-foreground">
                    <SelectValue placeholder="Select Topic..." />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-bento-panel">
                    <SelectItem value="all" className="text-[10px] font-black uppercase tracking-tight text-primary">
                      Global Interleaved (All Topics)
                    </SelectItem>
                    {hubs.map((hub) => (
                      <SelectItem key={hub.id} value={hub.id} className="text-[10px] font-black uppercase tracking-tight text-foreground">
                        {cleanTitle(hub.title)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                  Difficulty
                </Label>
                <RadioGroup
                  value={advancedConfig.difficulty}
                  onValueChange={(val: string) =>
                    setAdvancedConfig((prev) => ({ ...prev, difficulty: val as any }))
                  }
                  className="grid grid-cols-4 gap-1"
                >
                  {[{ val: 'L1', label: '1' }, { val: 'L2', label: '2' }, { val: 'L3', label: '3' }, { val: 'Mixed', label: 'M' }].map(
                    (level) => (
                      <div key={level.val}>
                        <RadioGroupItem value={level.val} id={level.val} className="peer sr-only" />
                        <Label
                          htmlFor={level.val}
                          className="flex h-10 border border-border/40 rounded-[8px] bg-transparent peer-data-[state=checked]:bg-bento-item peer-data-[state=checked]:border-foreground/50 peer-data-[state=checked]:text-foreground items-center justify-center cursor-pointer text-[10px] font-black hover:bg-foreground/5 transition-all"
                        >
                          {level.label}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Notes</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full h-10 border border-border/40 bg-transparent text-[10px] font-black uppercase px-4 justify-between hover:bg-foreground/5 rounded-[6px] transition-colors flex items-center cursor-pointer"
                    >
                      <span>{advancedConfig.selectedAtomicNotes.length} Selected</span>
                      <Layers size={12} className="opacity-40" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[300px] p-0 rounded-[8px] border border-border/40 bg-bento-panel overflow-hidden"
                    align="start"
                  >
                    <Command className="bg-transparent">
                      <div className="p-3 border-b border-border/40 flex justify-between items-center bg-bento-item/50">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/60">
                          {availableNotes.length} Total
                        </span>
                        <Button
                          variant="ghost"
                          size="default"
                          className="h-7 text-[8px] font-black uppercase hover:bg-foreground/5"
                          onClick={() => {
                            if (advancedConfig.selectedAtomicNotes.length === availableNotes.length) {
                              setAdvancedConfig((prev) => ({ ...prev, selectedAtomicNotes: [] }))
                            } else {
                              setAdvancedConfig((prev) => ({
                                ...prev,
                                selectedAtomicNotes: availableNotes.map((n) => n.path),
                              }))
                            }
                          }}
                        >
                          Toggle All
                        </Button>
                      </div>
                      <CommandInput placeholder="Search..." className="h-10 text-[10px] font-black uppercase border-none focus:ring-0" />
                      <CommandList className="max-h-60 p-1">
                        {availableNotes.map((note) => {
                          const isSelected = advancedConfig.selectedAtomicNotes.includes(note.path)
                          return (
                            <CommandItem
                              key={note.path}
                              onSelect={() => toggleAtomicNote(note.path)}
                              className="flex items-center gap-2 cursor-pointer py-2 px-3 rounded-[6px] text-[9px] font-black uppercase hover:bg-foreground/5"
                            >
                              <div
                                className={cn(
                                  'w-3 h-3 border flex items-center justify-center rounded-[3px] transition-colors',
                                  isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border/40'
                                )}
                              >
                                {isSelected && <Check size={8} />}
                              </div>
                              <span className="truncate text-foreground/80">{note.title}</span>
                            </CommandItem>
                          )
                        })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                  Total (Min)
                </Label>
                <Select
                  value={String(advancedConfig.globalTimeLimitMinutes || 'null')}
                  onValueChange={(val: string) =>
                    setAdvancedConfig((prev) => ({
                      ...prev,
                      globalTimeLimitMinutes: val === 'null' ? null : parseInt(val),
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border/40 rounded-[6px] px-4 text-[10px] font-black uppercase hover:border-foreground/20 transition-colors text-foreground">
                    <SelectValue placeholder="No Limit" />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-bento-panel">
                    {[null, 5, 10, 15, 30, 60].map((m) => (
                      <SelectItem key={String(m)} value={String(m)} className="text-[10px] font-black uppercase text-foreground">
                        {m ? `${m}m` : 'None'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                  Per Q (Sec)
                </Label>
                <Select
                  value={String(advancedConfig.perQuestionTimeLimitSeconds || 'null')}
                  onValueChange={(val: string) =>
                    setAdvancedConfig((prev) => ({
                      ...prev,
                      perQuestionTimeLimitSeconds: val === 'null' ? null : parseInt(val),
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border/40 rounded-[6px] px-4 text-[10px] font-black uppercase hover:border-foreground/20 transition-colors text-foreground">
                    <SelectValue placeholder="No Limit" />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-bento-panel">
                    {[null, 15, 30, 60, 120].map((s) => (
                      <SelectItem key={String(s)} value={String(s)} className="text-[10px] font-black uppercase text-foreground">
                        {s ? `${s}s` : 'None'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 p-8 bg-bento-card border border-border/40 rounded-[8px] flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-4 mb-6 gap-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Question Types Distribution
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {Object.entries(PRESETS).map(([k, p]) => (
                    <button
                      key={k}
                      onClick={() => applyPreset(k)}
                      className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-transparent hover:bg-bento-item border border-border/40 text-muted-foreground hover:text-foreground transition-all rounded-[4px] cursor-pointer"
                      title={p.label}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={randomizeDistribution}
                  className="h-7 px-2.5 text-[8px] font-black uppercase border border-border/40 bg-transparent hover:bg-bento-item rounded-[4px] flex items-center justify-center cursor-pointer gap-1 text-foreground"
                >
                  <Zap size={10} />
                  Random
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 content-start">
              {[
                { key: 'mcq', label: 'Multiple Choice' },
                { key: 'true_false', label: 'True or False' },
                { key: 'writing', label: 'Writing / Essay' },
                { key: 'fill_in', label: 'Fill in the Blank' },
                { key: 'debug', label: 'Debugging / Error Finding' },
                { key: 'trace', label: 'Logic / Calculation Trace' },
                { key: 'order', label: 'Ordering / Steps' },
                { key: 'matching', label: 'Matching Pairs' },
                { key: 'synthesis', label: 'Synthesis / Scenario' },
                { key: 'calculation', label: 'Math / Calculation' },
                { key: 'data_analysis', label: 'Data Analysis' },
                { key: 'scenario', label: 'Scenario Analysis' },
                { key: 'code', label: 'Code / Implementation' },
              ].map((type) => (
                <div
                  key={type.key}
                  className="space-y-2 p-3 bg-transparent border border-border/40 hover:border-foreground/20 transition-colors rounded-[8px]"
                >
                  <div className="flex justify-between items-center">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {type.label}
                    </Label>
                    <span className="text-[9px] font-black font-mono text-foreground/80">
                      {
                        advancedConfig.questionDistribution[
                          type.key as keyof AdvancedPracticeConfig['questionDistribution']
                        ]
                      }
                    </span>
                  </div>
                  <Slider
                    value={[
                      advancedConfig.questionDistribution[
                        type.key as keyof AdvancedPracticeConfig['questionDistribution']
                      ],
                    ]}
                    max={15}
                    step={1}
                    onValueChange={(vals: number[]) => updateDistribution(type.key as any, vals[0])}
                    className="py-1"
                  />
                </div>
              ))}
            </div>
            <button
              data-tour="start-practice-btn"
              onClick={handleStartSession}
              disabled={isLoading}
              className="h-11 w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-[6px] mt-6 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
