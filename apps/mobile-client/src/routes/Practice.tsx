import { useState, useEffect, useRef, useMemo } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { 
  CheckCircle2, XCircle, RefreshCw, BrainCircuit, Target,
  Layers, Zap, ArrowRight, Trash2, Clock, Award, ChevronDown,
  ChevronRight, Activity, History, LayoutGrid, BarChart3,
  Calendar as CalendarIcon, Filter, TrendingUp, AlertTriangle,
  ScanSearch, Dna, Binary, X, ListFilter, Check, Loader2, PlayCircle, School, PlusCircle
} from 'lucide-react'
import { ActivityCalendar } from 'react-activity-calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList 
} from "@/components/ui/command"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

import { AdvancedPracticeConfig, Question } from '@/types/practice'

interface Hub {
  id: string
  title: string
  course?: string
  unit?: string
  path: string
}

const DEFAULT_CONFIG: AdvancedPracticeConfig = {
  hubId: '',
  selectedAtomicNotes: [],
  exclusionKeywords: [],
  questionDistribution: { multipleChoice: 5, trueFalse: 0, shortAnswer: 0, scenario: 0, codeImplementation: 0, clozeDeletion: 0, findTheError: 0, matchingMatrix: 0 },
  difficulty: 'L1',
  gradingStrictness: 'Lenient',
  distractorPlausibility: 'High',
  injectTrickAnswers: false,
  prioritizeWeaknesses: false,
  progressionGatekeeper: false,
  enableProgressiveHints: false,
  requireConfidenceWager: false,
  globalTimeLimitMinutes: null,
  perQuestionTimeLimitSeconds: null,
  timeBoundDays: null
}

export default function Practice() {
  const [hubs, setHubs] = useState<Hub[]>([])
  const [selectedHub, setSelectedHub] = useState<string>('')
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedPracticeConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'dashboard' | 'history' | 'configuring' | 'loading' | 'session' | 'results'>('dashboard')
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const currentQuestion = questions[currentQuestionIdx]
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({})
  const [isRevealed, setIsRevealed] = useState(false)
  const [gradedAnswers, setGradedAnswers] = useState<Record<number, boolean>>({})
  const [confidenceWagers, setConfidenceWagers] = useState<Record<number, number>>({})
  const [pastPractices, setPastPractices] = useState<any[]>([])
  const [currentPracticePath, setCurrentPracticePath] = useState<string | null>(null)
  const [availableNotes, setAvailableNotes] = useState<any[]>([])
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<any>(null)

  const [keywordInput, setKeywordInput] = useState("")

  const calendarData = useMemo(() => {
    if (!Array.isArray(pastPractices)) return [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 as 0 }];
    const data = Object.entries(pastPractices.reduce((acc, p) => {
      if (!p || !p.date) return acc;
      try { const d = new Date(p.date).toISOString().split('T')[0]; acc[d] = (acc[d] || 0) + 1; } catch (e) {}
      return acc;
    }, {} as Record<string, number>)).map(([date, count]) => ({ date, count: Number(count), level: Math.min(Number(count), 4) as 0 | 1 | 2 | 3 | 4 }));
    return data.length ? data : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 as 0 }];
  }, [pastPractices])

  useEffect(() => { loadHubs(); loadPastPractices(); }, [])
  useEffect(() => { if (selectedHub) loadHubNotes(selectedHub); }, [selectedHub])
  const loadHubNotes = async (hubId: string) => { try { const res = await sidecarApi.listHubNotes(hubId); setAvailableNotes(res?.notes || []); } catch (err) {} }

  useEffect(() => {
    if (questions.length > 0 && view === 'session') {
      timerRef.current = setInterval(() => {
        if (globalTimeLeft !== null) setGlobalTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
        if (questionTimeLeft !== null) setQuestionTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current!) }
  }, [questions, view, globalTimeLeft, questionTimeLeft])

  const loadPastPractices = async () => { try { const res = await sidecarApi.listPractices(); setPastPractices(res?.practices || []); } catch (err) {} }
  const loadHubs = async () => { try { const res = await sidecarApi.listHubs(); setHubs(res?.hubs || []); if (res?.hubs?.length > 0) setSelectedHub(res.hubs[0].id); } catch (err) {} }

  const handleStartSession = async () => {
    if (!selectedHub) { toast.error('Choose a topic first.'); return; }
    setIsLoading(true); setView('loading');
    try {
      const res = await sidecarApi.generatePractice(selectedHub, { ...advancedConfig, hubId: selectedHub }) as any;
      if (!res.questions || res.questions.length === 0) { toast.error('Insufficient content.'); setView('configuring'); return; }
      setTimeout(() => {
        setQuestions(res.questions); setCurrentPracticePath(res.quiz_path); setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false); setGradedAnswers({}); setConfidenceWagers({}); setView('session');
        if (advancedConfig.globalTimeLimitMinutes) setGlobalTimeLeft(advancedConfig.globalTimeLimitMinutes * 60);
        if (advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds);
      }, 1500);
    } catch (err) { toast.error('Error generating session.'); setView('configuring'); } finally { setIsLoading(false); }
  }

  const handleResumePractice = async (path: string) => {
    setIsLoading(true); setView('loading');
    try {
      const res = await sidecarApi.getPractice(path) as any;
      if (!res.questions || res.questions.length === 0) { toast.error('Empty session.'); setView('history'); return; }
      setTimeout(() => {
        setQuestions(res.questions); setCurrentPracticePath(path); setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false); setGradedAnswers({}); setConfidenceWagers({}); setView('session');
      }, 1000);
    } catch (err) { toast.error('Load failed.'); setView('history'); } finally { setIsLoading(false); }
  }

  const handleSubmitAnswer = () => {
    setIsRevealed(true);
    const q = questions[currentQuestionIdx];
    if (q.type === 'mcq' || q.type === 'true_false') setGradedAnswers(prev => ({ ...prev, [q.id]: String(userAnswers[q.id]).toLowerCase() === String(q.answer).toLowerCase() }));
  }

  const nextQuestion = async () => {
    if (currentQuestionIdx < questions.length - 1) { setCurrentQuestionIdx(prev => prev + 1); setIsRevealed(false); }
    else { setView('results'); const { score } = calculateScore(); if (currentPracticePath) await sidecarApi.updatePracticeScore(currentPracticePath, score); loadPastPractices(); }
  }

  const calculateScore = () => {
    let correct = 0; questions.forEach(q => { if (gradedAnswers[q.id]) correct++; });
    return { score: Math.round((correct / (questions.length || 1)) * 100), correct, total: questions.length };
  }

  const handleSelectAnswer = (val: any) => { if (!isRevealed) setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: val })); }

  // --- DASHBOARD ---
  if (view === 'dashboard') {
    const validPractices = Array.isArray(pastPractices) ? pastPractices.filter(p => p && p.completed && p.score) : [];
    const totalPrecision = validPractices.length ? Math.round(validPractices.reduce((acc, p) => acc + parseInt(p.score), 0) / validPractices.length) : 0;
    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-y-auto pb-40">
            <div className="px-6 pt-12 pb-8 border-b border-border/50">
                <nav className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">PEDAGOGY</span>
                    <ChevronRight size={10} className="text-border" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">SOCRATIC_LAB</span>
                </nav>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-10">Practice<br/><span className="text-muted-foreground/30">Intelligence</span></h1>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/10 p-6 border border-border rounded-2xl space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Average Precision</span>
                        <p className="text-3xl font-black text-primary">{totalPrecision}%</p>
                    </div>
                    <div className="bg-muted/10 p-6 border border-border rounded-2xl space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Global Sessions</span>
                        <p className="text-3xl font-black text-primary">{pastPractices.length}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-10">
                <div className="flex bg-muted p-1 rounded-xl">
                    <button onClick={() => setView('dashboard')} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-background text-primary shadow-sm rounded-lg transition-all">Overview</button>
                    <button onClick={() => setView('history')} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all">History</button>
                </div>

                <section className="space-y-6">
                    <div className="p-8 bg-muted/5 border border-border rounded-3xl flex flex-col items-center justify-center space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Activity_Metrics</h3>
                        <ActivityCalendar 
                            data={calendarData} 
                            theme={{ light: ['#f5f5f5', '#e5e5e5', '#a3a3a3', '#404040', '#0a0a0a'], dark: ['#171717', '#262626', '#404040', '#737373', '#ffffff'] }} 
                            fontSize={10} blockSize={12} blockMargin={3} 
                        />
                    </div>

                    <div className="p-8 border border-border bg-muted/10 rounded-3xl space-y-8">
                        <div className="flex justify-between items-center px-2">
                             <h3 className="text-[10px] font-black uppercase tracking-widest">Performance_Trend</h3>
                             <Badge variant="outline" className="text-[8px] font-black border-primary/20">L15_WINDOWS</Badge>
                        </div>
                        <div className="h-40 w-full flex items-center justify-center border border-dashed border-border/50 rounded-xl">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trend Visualization Standby</span>
                        </div>
                    </div>
                </section>
            </div>

            <div className="fixed bottom-24 left-0 w-full px-6 z-40">
                <Button onClick={() => setView('configuring')} className="w-full py-8 font-black uppercase tracking-[0.4em] text-xs shadow-2xl rounded-2xl">
                    <PlusCircle size={16} /> New Retrieval Session
                </Button>
            </div>
        </div>
    );
  }

  // --- HISTORY ---
  if (view === 'history') {
      return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-y-auto pb-40">
             <div className="px-6 pt-12 pb-6 border-b border-border/50">
                <nav className="flex items-center gap-2 mb-4">
                    <button onClick={() => setView('dashboard')} className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] hover:text-primary">PEDAGOGY</button>
                    <ChevronRight size={10} className="text-border" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">HISTORY</span>
                </nav>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Session Log</h1>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 gap-3">
                    {pastPractices.slice().reverse().map((p, i) => (
                        <button key={i} onClick={() => handleResumePractice(p.path)} className="bg-muted/10 p-5 border border-border rounded-2xl flex items-center justify-between group transition-all active:scale-[0.98]">
                            <div className="flex flex-col text-left gap-1 min-w-0">
                                <span className="text-[11px] font-black uppercase tracking-tight truncate text-primary">{p.hub_title || 'Core Synthesis'}</span>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{new Date(p.date).toLocaleDateString()} // {p.course || 'GLOBAL'}</span>
                            </div>
                            <div className="text-xl font-black tracking-tighter text-primary">{p.score}%</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )
  }

  // --- CONFIGURING ---
  if (view === 'configuring') {
      return (
        <div className="flex flex-col h-full bg-background animate-in slide-in-from-bottom duration-500 overflow-y-auto pb-40">
             <div className="px-6 pt-12 pb-8 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-muted-foreground"><X size={20} /></button>
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">INIT_RETRIEVAL</div>
                    <div className="w-8" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Setup<br/><span className="text-muted-foreground/30">Parameters</span></h1>
            </div>

            <div className="p-6 space-y-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary opacity-20">01</span><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Knowledge Target</h3></div>
                    <Select value={selectedHub} onValueChange={setSelectedHub}>
                        <SelectTrigger className="w-full h-16 bg-muted/20 border-border rounded-2xl px-6 text-left focus:ring-primary">
                            <SelectValue placeholder="Select topic..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border bg-popover shadow-2xl">
                            {hubs.map(hub => (
                                <SelectItem key={hub.id} value={hub.id} className="py-4 px-6 focus:bg-accent border-b border-border/5 last:border-0">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-black tracking-widest uppercase">{hub.title}</span>
                                        <span className="text-[8px] font-black text-muted-foreground uppercase opacity-60">{hub.course}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary opacity-20">02</span><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Depth Level</h3></div>
                    <RadioGroup value={advancedConfig.difficulty} onValueChange={(val) => setAdvancedConfig((prev: AdvancedPracticeConfig) => ({ ...prev, difficulty: val as any }))} className="grid grid-cols-2 gap-3">
                        {['L1', 'L2', 'L3', 'Mixed'].map((level) => (
                            <div key={level}>
                                <RadioGroupItem value={level} id={level} className="peer sr-only" />
                                <Label htmlFor={level} className="flex flex-col items-center justify-center h-16 border-2 border-border rounded-2xl bg-muted/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer hover:bg-muted/20 transition-all font-black uppercase tracking-widest text-[11px]">{level}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary opacity-20">03</span><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Cognitive Load</h3></div>
                    <div className="grid grid-cols-1 gap-10">
                        {[{ key: 'multipleChoice', label: 'MCQ' }, { key: 'trueFalse', label: 'Binary' }, { key: 'shortAnswer', label: 'Open Response' }].map(type => (
                            <div key={type.key} className="space-y-4 px-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">{type.label}</Label>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 border border-primary/20 rounded tabular-nums">{advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]}</span>
                                </div>
                                <Slider 
                                    defaultValue={[advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]]} 
                                    max={15} step={1} 
                                    onValueChange={(vals) => updateDistribution(type.key as any, vals[0])} 
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-10 border-t border-border flex flex-col gap-8">
                    <div className="space-y-2 bg-muted/10 border border-border rounded-2xl overflow-hidden divide-y divide-border/40">
                        {[
                            { key: 'prioritizeWeaknesses', label: 'Prioritize Weaknesses' }, 
                            { key: 'injectTrickAnswers', label: 'Complex Distractors' }, 
                            { key: 'requireConfidenceWager', label: 'Confidence Wagers' }
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-5 bg-background">
                                <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{item.label}</Label>
                                <Switch 
                                    checked={advancedConfig[item.key as keyof AdvancedPracticeConfig] as boolean} 
                                    onCheckedChange={(checked) => setAdvancedConfig((prev: AdvancedPracticeConfig) => ({ ...prev, [item.key]: checked }))} 
                                />
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleStartSession} disabled={isLoading} className="h-24 w-full font-black uppercase tracking-[0.4em] text-xs shadow-2xl rounded-2xl">
                        {isLoading ? "INITIATING..." : "START RETRIEVAL"}
                    </Button>
                </div>
            </div>
        </div>
      )
  }

  // --- LOADING ---
  if (view === 'loading') {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-500 p-10 text-center">
            <div className="relative mb-12">
                <RefreshCw size={80} className="text-primary/10 animate-spin" strokeWidth={1} />
                <BrainCircuit size={40} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-2">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] animate-pulse">Architecting_Retrieval</div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Initializing Session</h2>
                <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">Synthesis of knowledge clusters and distractor calibration in progress...</p>
            </div>
        </div>
    )
  }

  // --- SESSION ---
  if (view === 'session' && currentQuestion) {
    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 overflow-hidden">
             {/* Sticky Header */}
             <div className="px-6 py-6 border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Active Session</span>
                        <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{hubs.find(h => h.id === selectedHub)?.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {globalTimeLeft !== null && <Badge variant="outline" className="font-mono text-primary font-black tabular-nums">{Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}</Badge>}
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Q {currentQuestionIdx + 1}/{questions.length}</span>
                    </div>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden flex gap-1 p-0.5">
                    {questions.map((_, idx) => (
                        <div key={idx} className={cn(
                            "flex-1 h-full rounded-full transition-all duration-700",
                            idx === currentQuestionIdx ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : idx < currentQuestionIdx ? "bg-primary/40" : "bg-muted-foreground/10"
                        )} />
                    ))}
                </div>
             </div>

             <ScrollArea className="flex-1">
                 <div className="p-8 space-y-10 pb-40">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[8px] font-black border-primary/20 bg-primary/5 uppercase">{currentQuestion.difficulty}</Badge>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{currentQuestion.type.replace('_', ' ')}</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tight text-primary uppercase">{currentQuestion.question}</h2>
                    </div>

                    <div className="space-y-3">
                        {currentQuestion.type === 'mcq' && (
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(currentQuestion.options!).map(([key, val]) => {
                                    const isSelected = userAnswers[currentQuestion.id] === key;
                                    const isCorrect = isRevealed && key === currentQuestion.answer;
                                    return (
                                        <button 
                                            key={key} 
                                            disabled={isRevealed} 
                                            onClick={() => handleSelectAnswer(key)} 
                                            className={cn(
                                                "flex items-center gap-5 p-5 border-2 rounded-2xl text-left transition-all active:scale-[0.98]",
                                                isCorrect ? "border-green-500 bg-green-500/5 shadow-lg shadow-green-500/5" : isSelected && !isRevealed ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/20",
                                                isRevealed && !isCorrect && !isSelected ? "opacity-30 grayscale" : "",
                                                isRevealed && isSelected && !isCorrect ? "border-red-500 bg-red-500/5" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 shrink-0",
                                                isCorrect ? "bg-green-500 text-white border-green-500" : isSelected ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"
                                            )}>{key}</div>
                                            <span className="text-sm font-bold tracking-tight leading-tight">{String(val)}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {currentQuestion.type === 'true_false' && (
                            <div className="grid grid-cols-2 gap-4">
                                {['True', 'False'].map(v => {
                                    const isSelected = userAnswers[currentQuestion.id] === v;
                                    const isCorrect = isRevealed && v.toLowerCase() === String(currentQuestion.answer).toLowerCase();
                                    return (
                                        <button key={v} disabled={isRevealed} onClick={() => handleSelectAnswer(v)} className={cn(
                                            "h-32 border-2 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all",
                                            isCorrect ? "bg-green-500 text-white border-green-500" : isSelected && !isRevealed ? "bg-primary text-white border-primary" : "border-border bg-muted/5 text-muted-foreground",
                                            isRevealed && isSelected && !isCorrect ? "bg-red-500 text-white border-red-500" : ""
                                        )}>
                                            {v === 'True' ? <Check size={24} /> : <X size={24} />}
                                            <span className="text-xs font-black uppercase tracking-widest">{v}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {['short_answer', 'scenario'].includes(currentQuestion.type) && (
                            <div className="space-y-8">
                                <textarea 
                                    rows={8} 
                                    disabled={isRevealed} 
                                    className="w-full bg-muted/5 border-2 border-border rounded-3xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-primary focus:border-primary transition-all leading-relaxed placeholder:text-muted-foreground/10" 
                                    placeholder="SYNTHESIZE ANSWER..." 
                                    value={userAnswers[currentQuestion.id] || ""} 
                                    onChange={(e) => handleSelectAnswer(e.target.value)} 
                                />
                                {isRevealed && (
                                    <div className="p-6 bg-primary/5 border-l-4 border-primary rounded-r-3xl space-y-3 animate-in slide-in-from-left-4">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary"><Filter size={12}/> Verified Output</div>
                                        <p className="text-sm font-bold uppercase leading-relaxed tracking-wider text-primary">{(currentQuestion as any).answer}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
             </ScrollArea>

             {/* Action Bar */}
             <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-xl shrink-0 fixed bottom-0 left-0 w-full z-50">
                 <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" onClick={() => { if (confirm("End?")) setView('dashboard'); }} className="px-6 py-7 font-black uppercase tracking-widest text-[9px] rounded-2xl border-2">EXIT</Button>
                    {!isRevealed ? (
                        <Button onClick={handleSubmitAnswer} disabled={!userAnswers[currentQuestion.id]} className="flex-1 py-7 font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-xl">CHECK_LOGIC <Zap size={14} className="ml-2" /></Button>
                    ) : (
                        <div className="flex-1 flex gap-2">
                             {['short_answer', 'scenario'].includes(currentQuestion.type) && (
                                 <>
                                    <Button onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: false})); nextQuestion(); }} variant="outline" className="flex-1 py-7 border-red-500/20 text-red-500 font-black text-[9px] uppercase rounded-2xl">FAILED</Button>
                                    <Button onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: true})); nextQuestion(); }} className="flex-1 py-7 bg-green-600 font-black text-[9px] uppercase rounded-2xl">SOLVED</Button>
                                 </>
                             )}
                             {!['short_answer', 'scenario'].includes(currentQuestion.type) && (
                                 <Button onClick={nextQuestion} className="w-full py-7 font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-xl">CONTINUE_SCAN <ArrowRight size={14} className="ml-2" /></Button>
                             )}
                        </div>
                    )}
                 </div>
             </div>
        </div>
    )
  }

  // --- RESULTS ---
  if (view === 'results') {
      const { score, correct, total } = calculateScore();
      return (
        <div className="h-full flex flex-col items-center justify-center bg-background p-10 text-center space-y-12 animate-in zoom-in-95 duration-700">
            <div className="space-y-4">
                <div className="w-24 h-24 bg-primary text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 mb-8">
                    <Award size={48} />
                </div>
                <h1 className="text-6xl font-black tracking-tighter leading-none">{score}%</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-50">Precision Rating</p>
            </div>
            
            <div className="w-full grid grid-cols-2 divide-x divide-border py-8 border-y border-border/50">
                <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tighter">{correct}/{total}</p>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Successful Probes</p>
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tighter">SOTA</p>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Alignment Tier</p>
                </div>
            </div>

            <div className="w-full space-y-3">
                <Button onClick={() => setView('configuring')} className="w-full py-8 font-black uppercase tracking-[0.3em] text-xs rounded-2xl">Restart Session</Button>
                <Button variant="outline" onClick={() => setView('dashboard')} className="w-full py-7 font-black uppercase tracking-[0.3em] text-xs rounded-2xl border-2">Return to Dashboard</Button>
            </div>
        </div>
      )
  }

  const updateDistribution = (type: keyof AdvancedPracticeConfig['questionDistribution'], val: number) => {
    setAdvancedConfig((prev: AdvancedPracticeConfig) => ({
      ...prev,
      questionDistribution: {
        ...prev.questionDistribution,
        [type]: val
      }
    }))
  }

  return null;
}
