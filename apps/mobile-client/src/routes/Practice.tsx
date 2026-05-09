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

  const updateDistribution = (type: keyof AdvancedPracticeConfig['questionDistribution'], val: number) => {
    setAdvancedConfig((prev: AdvancedPracticeConfig) => ({
      ...prev,
      questionDistribution: {
        ...prev.questionDistribution,
        [type]: val
      }
    }))
  }

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
  const loadHubs = async () => { 
    try { 
      const res = await sidecarApi.listHubs(); 
      setHubs(res.hubs || []); 
      if (res.hubs?.length > 0) setSelectedHub(res.hubs[0].id); 
    } catch (err) {
      console.error('Failed to load practice topics:', err);
    } 
  }

  const loadHubNotes = async (hubId: string) => { 
    try { 
        const res = await sidecarApi.listHubNotes(hubId); 
        setAvailableNotes(res.notes || []); 
    } catch (err) {} 
  }

  const handleStartSession = async () => {
    if (!selectedHub) { toast.error('Choose a topic first.'); return; }
    setIsLoading(true); setView('loading');
    try {
      const res = await sidecarApi.generatePractice(selectedHub, { ...advancedConfig, hubId: selectedHub }) as any;
      window.dispatchEvent(new CustomEvent('vault-updated'));
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
    let isCorrect = false;

    if (q.type === 'mcq' || q.type === 'true_false' || q.type === 'writing' || q.type === 'debug' || q.type === 'synthesis' || q.type === 'trace' || q.type === 'short_answer' || q.type === 'scenario') {
        const userVal = String(userAnswers[q.id] || '').trim();
        const correctVal = String(q.answer || '').trim();
        
        if (q.type === 'true_false') {
            const userBool = userVal.toLowerCase() === 'true';
            const correctBool = typeof q.answer === 'boolean' ? q.answer : String(q.answer).toLowerCase() === 'true';
            isCorrect = userBool === correctBool;
        } else if (q.type === 'debug') {
            const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
            isCorrect = norm(userVal) === norm(correctVal);
        } else {
            isCorrect = userVal.toLowerCase() === correctVal.toLowerCase();
        }
        
        if (q.type === 'mcq' && q.options) {
            const correctText = String(q.options[q.answer as keyof typeof q.options] || '').trim().toLowerCase();
            isCorrect = isCorrect || userVal.toLowerCase() === correctText;
        }
    } else if (q.type === 'fill_in') {
        const answers = userAnswers[q.id] || [];
        // Support both array and single string (legacy/edge cases) for correct answers
        const correctAnswers = q.answer;
        if (Array.isArray(correctAnswers)) {
            isCorrect = correctAnswers.every((ans: string, idx: number) => 
                String(answers[idx] || '').trim().toLowerCase() === String(ans || '').trim().toLowerCase()
            );
        } else {
            // If it's a single string, check against the first user answer
            isCorrect = String(answers[0] || '').trim().toLowerCase() === String(correctAnswers || '').trim().toLowerCase();
        }
    } else if (q.type === 'matching') {
        const userPairs = userAnswers[q.id] || {};
        const correctPairs = q.pairs || [];
        isCorrect = Array.isArray(correctPairs) && correctPairs.every((p: any) => 
            String(userPairs[p.left] || '').trim().toLowerCase() === String(p.right || '').trim().toLowerCase()
        );
    } else if (q.type === 'order') {
        const userOrder = userAnswers[q.id] || (q as any).steps || [];
        const correctOrder = (q as any).answer || [];
        isCorrect = Array.isArray(correctOrder) && correctOrder.every((step: string, idx: number) => 
            String(userOrder[idx] || '').trim().toLowerCase() === String(step).trim().toLowerCase()
        );
    }

    const isSelfGraded = ['short_answer', 'scenario', 'writing', 'synthesis', 'debug', 'trace'].includes(q.type);
    if (!isSelfGraded) {
        setGradedAnswers(prev => ({...prev, [q.id]: isCorrect}));
    }
    if (timerRef.current && advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(null);
  }

  const nextQuestion = async () => {
    if (currentQuestionIdx < questions.length - 1) { 
      setCurrentQuestionIdx(prev => prev + 1); 
      setIsRevealed(false); 
      if (advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds);
    }
    else { 
      setView('results'); 
      const { score } = calculateScore(); 
      if (currentPracticePath) await sidecarApi.updatePracticeScore(currentPracticePath, score); 
      loadPastPractices(); 
      window.dispatchEvent(new CustomEvent('vault-updated'));
    }
  }

  const calculateScore = () => {
    let correct = 0; questions.forEach(q => { if (gradedAnswers[q.id]) correct++; });
    return { score: Math.round((correct / (questions.length || 1)) * 100), correct, total: questions.length };
  }

  const handleSelectAnswer = (val: any) => { if (!isRevealed) setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: val })); }

  const toggleAtomicNote = (noteId: string) => {
    setAdvancedConfig(prev => ({
      ...prev,
      selectedAtomicNotes: prev.selectedAtomicNotes.includes(noteId)
        ? prev.selectedAtomicNotes.filter(n => n !== noteId)
        : [...prev.selectedAtomicNotes, noteId]
    }))
  }

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
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary opacity-20">02</span><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Content Scope</h3></div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-16 bg-muted/20 border-border rounded-2xl px-6 text-left justify-between">
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {advancedConfig.selectedAtomicNotes.length === 0 ? "All Notes" : `${advancedConfig.selectedAtomicNotes.length} Selected`}
                                </span>
                                <Layers size={14} className="text-primary" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl border-border bg-popover shadow-2xl overflow-hidden">
                            <Command className="bg-transparent">
                                <CommandInput placeholder="Search notes..." className="font-black text-[10px] uppercase tracking-widest" />
                                <CommandList className="max-h-72">
                                    <CommandEmpty className="py-10 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No matching notes.</CommandEmpty>
                                    <CommandGroup>
                                        {availableNotes.map(note => {
                                            const id = note.id;
                                            const label = note.title;
                                            const isSelected = advancedConfig.selectedAtomicNotes.includes(id);
                                            return (
                                                <CommandItem 
                                                    key={id} 
                                                    onSelect={() => toggleAtomicNote(id)}
                                                    className="flex items-center gap-4 py-4 px-6 cursor-pointer focus:bg-accent"
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 border flex items-center justify-center transition-all rounded-sm",
                                                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary opacity-20">03</span><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Depth Level</h3></div>
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
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black text-primary opacity-20">04</span><h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Cognitive Load</h3></div>
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-[8px] font-black border-primary/20 bg-primary/5 uppercase">{currentQuestion.difficulty}</Badge>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{currentQuestion.type.replace('_', ' ')}</span>
                            </div>
                            {advancedConfig.enableProgressiveHints && currentQuestion.explanation && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase tracking-widest gap-1 text-muted-foreground/50">
                                            <ScanSearch size={10} /> Hint
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="bg-popover border-border p-4 rounded-xl shadow-2xl max-w-[250px]">
                                        <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic">
                                            {currentQuestion.explanation.substring(0, 100)}...
                                        </p>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tight text-primary uppercase">{currentQuestion.question}</h2>
                    </div>

                    {/* Confidence Wager Section */}
                    {advancedConfig.requireConfidenceWager && !isRevealed && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                             <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Confidence Rating</span>
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded",
                                    confidenceWagers[currentQuestion.id] === 3 ? "text-green-500 bg-green-500/10" :
                                    confidenceWagers[currentQuestion.id] === 2 ? "text-amber-500 bg-amber-500/10" :
                                    "text-red-500 bg-red-500/10"
                                )}>
                                    {confidenceWagers[currentQuestion.id] === 3 ? "HIGH" : 
                                     confidenceWagers[currentQuestion.id] === 2 ? "MEDIUM" : "LOW"}
                                </span>
                             </div>
                             <div className="flex gap-2">
                                {[1, 2, 3].map((lvl) => (
                                    <button 
                                        key={lvl}
                                        onClick={() => setConfidenceWagers(p => ({ ...p, [currentQuestion.id]: lvl }))}
                                        className={cn(
                                            "flex-1 h-10 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                                            confidenceWagers[currentQuestion.id] === lvl 
                                                ? "bg-primary border-primary text-primary-foreground" 
                                                : "bg-muted/10 border-border/40 text-muted-foreground"
                                        )}
                                    >
                                        <span className="text-[10px] font-black">{lvl === 1 ? '1' : lvl === 2 ? '2' : '3'}</span>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {currentQuestion.type === 'mcq' && (
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(currentQuestion.options!).map(([key, val]) => {
                                    const isSelected = userAnswers[currentQuestion.id] === key;
                                    const isCorrect = isRevealed && key === currentQuestion.answer;
                                    return (
                                        <button 
                                            key={key} 
                                            disabled={isRevealed || (advancedConfig.requireConfidenceWager && !confidenceWagers[currentQuestion.id])} 
                                            onClick={() => handleSelectAnswer(key)} 
                                            className={cn(
                                                "flex items-center gap-5 p-5 border-2 rounded-2xl text-left transition-all active:scale-[0.98]",
                                                isCorrect ? "border-green-500 bg-green-500/5 shadow-lg shadow-green-500/5" : isSelected && !isRevealed ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/20",
                                                isRevealed && !isCorrect && !isSelected ? "opacity-30 grayscale" : "",
                                                isRevealed && isSelected && !isCorrect ? "border-red-500 bg-red-500/5" : "",
                                                advancedConfig.requireConfidenceWager && !confidenceWagers[currentQuestion.id] && "opacity-50 grayscale cursor-not-allowed"
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
                                        <button 
                                            key={v} 
                                            disabled={isRevealed || (advancedConfig.requireConfidenceWager && !confidenceWagers[currentQuestion.id])} 
                                            onClick={() => handleSelectAnswer(v)} 
                                            className={cn(
                                                "h-32 border-2 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all",
                                                isCorrect ? "bg-green-500 text-white border-green-500" : isSelected && !isRevealed ? "bg-primary text-white border-primary" : "border-border bg-muted/5 text-muted-foreground",
                                                isRevealed && isSelected && !isCorrect ? "bg-red-500 text-white border-red-500" : "",
                                                advancedConfig.requireConfidenceWager && !confidenceWagers[currentQuestion.id] && "opacity-50 grayscale cursor-not-allowed"
                                            )}
                                        >
                                            {v === 'True' ? <Check size={24} /> : <X size={24} />}
                                            <span className="text-xs font-black uppercase tracking-widest">{v}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        
                         {currentQuestion.type === 'order' && (
                         <div className="space-y-3">
                         {(userAnswers[currentQuestion.id] || currentQuestion.steps || []).map((step: string, i: number) => {
                            const list = userAnswers[currentQuestion.id] || currentQuestion.steps || [];
                            const moveUp = () => { if(i>0) { const n = [...list]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleSelectAnswer(n); } };
                            const moveDown = () => { if(i<list.length-1) { const n = [...list]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleSelectAnswer(n); } };
                            const isCorrect = isRevealed && step === (currentQuestion.answer || [])[i];
                            const isWrong = isRevealed && step !== (currentQuestion.answer || [])[i];
                            return (
                                <div key={i} className={`flex items-center gap-3 p-4 border rounded-lg ${isCorrect ? 'border-green-500 bg-green-500/10 shadow-sm' : isWrong ? 'border-red-500 bg-red-500/10' : 'border-border/40 hover:bg-muted/5'}`}>
                                    <div className="flex flex-col gap-1 border-r border-border/50 pr-3">
                                        <button disabled={isRevealed || i===0} onClick={moveUp} className="text-[10px] px-1 opacity-50 hover:opacity-100 hover:text-primary transition-colors">▲</button>
                                        <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-[10px] px-1 opacity-50 hover:opacity-100 hover:text-primary transition-colors">▼</button>
                                    </div>
                                    <div className="text-xs font-medium tracking-tight text-foreground/90 pl-1">{step}</div>
                                </div>
                            )
                         })}
                         </div>
                         )}

                         {currentQuestion.type === 'matching' && currentQuestion.pairs && (
                         <div className="space-y-4">
                         {currentQuestion.pairs.map((pair: any, i: number) => {
                            const rights = currentQuestion.pairs.map((p: any) => p.right).sort();
                            const selected = (userAnswers[currentQuestion.id] || {})[pair.left] || "";
                            const isCorrect = isRevealed && selected === pair.right;
                            const isWrong = isRevealed && selected !== pair.right;
                            return (
                                <div key={i} className={`flex items-center gap-4 p-4 border rounded-lg ${isCorrect ? 'border-green-500 bg-green-500/10 shadow-sm' : isWrong ? 'border-red-500 bg-red-500/10' : 'border-border/40'}`}>
                                    <div className="flex-1 font-medium tracking-tight text-xs text-foreground/90">{pair.left}</div>
                                    <div className="flex-1">
                                        <select disabled={isRevealed} value={selected} onChange={(e) => handleSelectAnswer({...userAnswers[currentQuestion.id], [pair.left]: e.target.value})} className="w-full p-2.5 bg-background border border-border/50 rounded-md outline-none focus:border-foreground/50 text-xs font-medium text-foreground/80 transition-colors">
                                            <option value="">Select match...</option>
                                            {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    {isRevealed && isWrong && <div className="text-[10px] uppercase tracking-widest text-primary font-bold w-1/3 break-words">{pair.right}</div>}
                                </div>
                            )
                         })}
                         </div>
                         )}

                        {currentQuestion.type === 'fill_in' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-muted/10 rounded-3xl border border-border/40 text-sm leading-relaxed font-medium">
                                    {(currentQuestion.text_with_blanks || (currentQuestion as any).textWithBlanks || '').split(/\[\[blank\]\]/g).map((part: string, i: number, arr: any[]) => (
                                        <React.Fragment key={i}>
                                            {part}
                                            {i < arr.length - 1 && (
                                                <input
                                                    type="text"
                                                    value={(userAnswers[currentQuestion.id] || [])[i] || ''}
                                                    disabled={isRevealed}
                                                    onChange={(e) => {
                                                        const newAns = [...(userAnswers[currentQuestion.id] || [])];
                                                        newAns[i] = e.target.value;
                                                        handleSelectAnswer(newAns);
                                                    }}
                                                    className={cn(
                                                        "mx-1 px-3 py-1 bg-background border-b-2 border-primary/30 focus:border-primary outline-none text-center min-w-[80px] transition-all",
                                                        isRevealed && (currentQuestion.answer || [])[i]?.toLowerCase() === (userAnswers[currentQuestion.id] || [])[i]?.toLowerCase() ? "text-green-500 border-green-500" : 
                                                        isRevealed ? "text-red-500 border-red-500" : ""
                                                    )}
                                                    placeholder="..."
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}

                        {['short_answer', 'scenario', 'writing', 'synthesis', 'debug', 'trace'].includes(currentQuestion.type) && (
                            <div className="space-y-8">
                                <textarea 
                                    rows={8} 
                                    disabled={isRevealed || (advancedConfig.requireConfidenceWager && !confidenceWagers[currentQuestion.id])} 
                                    className="w-full bg-muted/5 border-2 border-border rounded-3xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-primary focus:border-primary transition-all leading-relaxed placeholder:text-muted-foreground/10" 
                                    placeholder="SYNTHESIZE ANSWER..." 
                                    value={userAnswers[currentQuestion.id] || ""} 
                                    onChange={(e) => handleSelectAnswer(e.target.value)} 
                                />
                            </div>
                        )}

                        {isRevealed && (
                            <div className="p-6 bg-muted/5 border border-border rounded-3xl space-y-6 animate-in slide-in-from-bottom-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                                        <School size={12}/> Systematic Resolution
                                    </div>
                                    <p className="text-sm font-bold uppercase leading-relaxed tracking-wider text-primary">
                                        {(currentQuestion as any).answer || currentQuestion.explanation}
                                    </p>
                                </div>
                                
                                {currentQuestion.explanation && (
                                    <div className="pt-4 border-t border-border/40 space-y-2">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Analysis Context</div>
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                                            {currentQuestion.explanation}
                                        </p>
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
                             {['short_answer', 'scenario', 'writing', 'synthesis', 'debug', 'trace'].includes(currentQuestion.type) && (
                                 <>
                                    <Button onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: false})); nextQuestion(); }} variant="outline" className="flex-1 py-7 border-red-500/20 text-red-500 font-black text-[9px] uppercase rounded-2xl">FAILED</Button>
                                    <Button onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: true})); nextQuestion(); }} className="flex-1 py-7 bg-green-600 font-black text-[9px] uppercase rounded-2xl">SOLVED</Button>
                                 </>
                             )}
                             {!['short_answer', 'scenario', 'writing', 'synthesis', 'debug', 'trace'].includes(currentQuestion.type) && (
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
        <div className="h-full flex flex-col bg-background animate-in zoom-in-95 duration-700">
            <ScrollArea className="flex-1">
                <div className="p-10 text-center space-y-12">
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

                    <div className="space-y-6 text-left">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Session Review</h3>
                         <div className="space-y-3">
                            {questions.map((q, idx) => {
                                const isCorrect = gradedAnswers[q.id];
                                return (
                                    <div key={idx} className="p-4 border border-border/50 bg-muted/5 rounded-2xl flex items-start gap-4">
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1",
                                            isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                        )}>
                                            {isCorrect ? <Check size={12} /> : <X size={12} />}
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <p className="text-[11px] font-black uppercase truncate text-primary">{q.question}</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Confidence: {confidenceWagers[q.id] || 0}/3</p>
                                        </div>
                                    </div>
                                )
                            })}
                         </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-6 border-t border-border/50 space-y-3">
                <Button onClick={() => setView('configuring')} className="w-full py-8 font-black uppercase tracking-[0.3em] text-xs rounded-2xl">Restart Session</Button>
                <Button variant="outline" onClick={() => setView('dashboard')} className="w-full py-7 font-black uppercase tracking-[0.3em] text-xs rounded-2xl border-2">Return to Dashboard</Button>
            </div>
        </div>
      )
  }

  return null;
}
