import React from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"
import { 
  Settings2, 
  Check, 
  X, 
  Clock, 
  BrainCircuit, 
  Trash2,
  ListFilter
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdvancedPracticeConfig } from "@/types/practice"

interface NoteOption {
  id: string;
  title: string;
}

interface AdvancedPanelProps {
  config: AdvancedPracticeConfig
  setConfig: React.Dispatch<React.SetStateAction<AdvancedPracticeConfig>>
  availableNotes: (NoteOption | string)[]
}

export function AdvancedPanel({ config, setConfig, availableNotes }: AdvancedPanelProps) {
  const [keywordInput, setKeywordInput] = React.useState("")

  const toggleAtomicNote = (noteId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedAtomicNotes: prev.selectedAtomicNotes.includes(noteId)
        ? prev.selectedAtomicNotes.filter(n => n !== noteId)
        : [...prev.selectedAtomicNotes, noteId]
    }))
  }

  const addKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault()
      if (!config.exclusionKeywords.includes(keywordInput.trim())) {
        setConfig(prev => ({
          ...prev,
          exclusionKeywords: [...prev.exclusionKeywords, keywordInput.trim()]
        }))
      }
      setKeywordInput("")
    }
  }

  const removeKeyword = (kw: string) => {
    setConfig(prev => ({
      ...prev,
      exclusionKeywords: prev.exclusionKeywords.filter(k => k !== kw)
    }))
  }

  const updateDistribution = (type: keyof AdvancedPracticeConfig['questionDistribution'], val: number) => {
    setConfig(prev => ({
      ...prev,
      questionDistribution: {
        ...prev.questionDistribution,
        [type]: val
      }
    }))
  }

  const totalQuestions = Object.values(config.questionDistribution).reduce((a, b) => a + b, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-12 border-slate-200 text-slate-600 hover:text-black hover:border-black transition-all gap-2">
          <Settings2 className="w-4 h-4" />
          Advanced Customization
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 bg-white border-l border-slate-100 shadow-2xl">
        <SheetHeader className="px-10 py-8 border-b border-slate-50 shrink-0">
          <SheetTitle className="text-3xl font-black tracking-tighter text-slate-950 uppercase">Configure</SheetTitle>
          <SheetDescription className="text-slate-500 font-medium">Fine-tune your practice parameters.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-10 space-y-12">
          {/* Context Mapping */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-300" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Focus</h3>
            </div>
            
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-900">Atomic Note Selection</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-11 border-slate-100 bg-slate-50/50 hover:bg-slate-50">
                    <span className="truncate">
                      {config.selectedAtomicNotes.length === 0 
                        ? "All nodes in context" 
                        : `${config.selectedAtomicNotes.length} nodes selected`}
                    </span>
                    <Badge variant="secondary" className="ml-2 bg-white border-slate-200">
                      {availableNotes.length} available
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search atomic nodes..." className="font-bold" />
                    <CommandList className="custom-scrollbar">
                      <CommandEmpty className="py-6 text-center text-xs font-bold text-slate-300">No nodes found in context.</CommandEmpty>
                      <CommandGroup>
                        {availableNotes.map(note => {
                          const id = typeof note === 'string' ? note : note.id;
                          const label = typeof note === 'string' ? note : note.title;
                          return (
                            <CommandItem
                              key={id}
                              onSelect={() => toggleAtomicNote(id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div className={cn(
                                "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                                config.selectedAtomicNotes.includes(id) 
                                  ? "bg-black border-black text-white" 
                                  : "border-slate-300 bg-white"
                              )}>
                                {config.selectedAtomicNotes.includes(id) && <Check className="w-3 h-3" />}
                              </div>
                              <span className="text-sm">{label}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-900">Exclude Keywords</Label>
              <Input 
                placeholder="Type and press Enter to exclude topics..." 
                className="bg-slate-50/50 border-slate-100 focus-visible:ring-black h-11"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={addKeyword}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {config.exclusionKeywords.map(kw => (
                  <Badge key={kw} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors gap-1 border border-transparent">
                    {kw}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeKeyword(kw)} />
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* Modalities */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-slate-300" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Types</h3>
              </div>
              <Badge variant="outline" className="bg-black text-white border-black px-3 py-1">
                {totalQuestions} Qs Total
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { key: 'multipleChoice', label: 'Multiple Choice' },
                { key: 'trueFalse', label: 'True / False' },
                { key: 'shortAnswer', label: 'Short Answer' },
                { key: 'scenario', label: 'Scenario Based' },
                { key: 'codeImplementation', label: 'Code Implementation' },
                { key: 'clozeDeletion', label: 'Cloze Deletion' },
                { key: 'findTheError', label: 'Find the Error' },
                { key: 'matchingMatrix', label: 'Matching Matrix' },
              ].map(type => (
                <div key={type.key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{type.label}</Label>
                    <Badge variant="outline" className="text-xs font-black bg-slate-50 border-slate-200">
                      {config.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]}
                    </Badge>
                  </div>
                  <Slider
                    defaultValue={[config.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]]}
                    max={15}
                    step={1}
                    onValueChange={(vals) => updateDistribution(type.key as any, vals[0])}
                    className="py-2"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Behavioral Toggles */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Behaviors</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'prioritizeWeaknesses', label: 'Prioritize Weaknesses', desc: 'Focus on topics from past low-score sessions.' },
                { key: 'injectTrickAnswers', label: 'Point-of-Failure Injection', desc: "Inject 'None of the above' and trick options." },
                { key: 'progressionGatekeeper', label: 'Sequential Mastery', desc: 'Must answer correctly to unlock the next question.' },
                { key: 'enableProgressiveHints', label: 'Progressive Hints', desc: 'Enable multi-stage hints per question.' },
                { key: 'requireConfidenceWager', label: 'Confidence Wager', desc: 'Metacognition rating required before reveal.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">{item.label}</Label>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={config[item.key as keyof AdvancedPracticeConfig] as boolean}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, [item.key]: checked }))}
                    className="data-[state=checked]:bg-black"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Temporal Dynamics */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Temporal Dynamics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Global Session Timer</Label>
                <Select 
                  value={String(config.globalTimeLimitMinutes || "null")} 
                  onValueChange={(val) => setConfig(prev => ({ ...prev, globalTimeLimitMinutes: val === "null" ? null : parseInt(val) }))}
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-100 h-11">
                    <SelectValue placeholder="No Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">No Limit</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Per-Question Limit</Label>
                <Select 
                  value={String(config.perQuestionTimeLimitSeconds || "null")} 
                  onValueChange={(val) => setConfig(prev => ({ ...prev, perQuestionTimeLimitSeconds: val === "null" ? null : parseInt(val) }))}
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-100 h-11">
                    <SelectValue placeholder="No Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">No Limit</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <div className="px-10 py-8 border-t border-slate-50 bg-white/80 backdrop-blur-xl shrink-0">
          <Button 
            onClick={() => {}} // Internal lock logic maybe? But usually Sheet closing is enough or parent Start button.
            className="w-full h-14 bg-black text-white font-black rounded-xl shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
          >
            Apply Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
