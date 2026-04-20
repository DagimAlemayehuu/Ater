import { useState, useEffect, useRef, useMemo } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  BrainCircuit,
  Target,
  Layers,
  Zap,
  ArrowRight,
  Trash2,
  Clock,
  Award,
  ChevronDown,
  ChevronRight,
  Activity,
  History,
  LayoutGrid,
  BarChart3,
  Calendar as CalendarIcon,
  Filter,
  TrendingUp,
  AlertTriangle,
  ScanSearch,
  Dna,
  Binary,
  X,
  ListFilter,
  Check,
  Loader2
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
} from 'recharts'
import { ActivityCalendar } from 'react-activity-calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [keywordInput, setKeywordInput] = useState("")

  const calendarData = useMemo(() => {
    const data = Object.entries(pastPractices.reduce((acc, p) => {
      if (!p.date) return acc;
      try { const d = new Date(p.date).toISOString().split('T')[0]; acc[d] = (acc[d] || 0) + 1; } catch (e) {}
      return acc;
    }, {} as Record<string, number>)).map(([date, count]) => ({ date, count: Number(count), level: Math.min(Number(count), 4) as 0 | 1 | 2 | 3 | 4 }));
    return data.length ? data : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 as 0 }];
  }, [pastPractices])

  useEffect(() => { loadHubs(); loadPastPractices(); }, [])
  useEffect(() => { if (selectedHub) loadHubNotes(selectedHub); }, [selectedHub])
  const loadHubNotes = async (hubId: string) => { try { const res = await sidecarApi.listHubNotes(hubId); setAvailableNotes(res.notes); } catch (err) {} }

  useEffect(() => {
    if (questions.length > 0 && view === 'session') {
      timerRef.current = setInterval(() => {
        if (globalTimeLeft !== null) setGlobalTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
        if (questionTimeLeft !== null) setQuestionTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current!) }
  }, [questions, view, globalTimeLeft, questionTimeLeft])

  const loadPastPractices = async () => { try { const res = await sidecarApi.listPractices(); setPastPractices(res.practices); } catch (err) {} }
  const loadHubs = async () => { try { const res = await sidecarApi.listHubs(); setHubs(res.hubs); if (res.hubs.length > 0) setSelectedHub(res.hubs[0].id); } catch (err) {} }

  const handleStartSession = async () => {
    if (!selectedHub) {
      toast.error('Choose a topic first.');
      return;
    }
    setIsLoading(true);
    setView('loading');
    try {
      // CRITICAL FIX: hubId must be explicitly injected — advancedConfig.hubId defaults to '' and is never synced
      const res = await sidecarApi.generatePractice(selectedHub, { ...advancedConfig, hubId: selectedHub });
      if (!res.questions || res.questions.length === 0) {
        toast.error('Could not find enough content to make questions.');
        setView('configuring');
        return;
      }
      setTimeout(() => {
        setQuestions(res.questions); setCurrentPracticePath(res.quiz_path); setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false); setGradedAnswers({}); setConfidenceWagers({}); setView('session');
        if (advancedConfig.globalTimeLimitMinutes) setGlobalTimeLeft(advancedConfig.globalTimeLimitMinutes * 60);
        if (advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds);
      }, 1500);
    } catch (err) { 
        const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
        toast.error(msg); 
        setView('configuring');
    } finally { setIsLoading(false); }
  }

  const handleResumePractice = async (path: string) => {
    setIsLoading(true);
    setView('loading');
    try {
      const res = await sidecarApi.getPractice(path);
      if (!res.questions || res.questions.length === 0) {
        toast.error('No questions in this session.');
        setView('history');
        return;
      }
      setTimeout(() => {
        setQuestions(res.questions); setCurrentPracticePath(path); setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false); setGradedAnswers({}); setConfidenceWagers({}); setView('session');
      }, 1000);
    } catch (err) { 
        toast.error('Could not load session.'); 
        setView('history');
    } finally { setIsLoading(false); }
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

  const resetSession = () => { setQuestions([]); setView('dashboard'); }
  const handleSelectAnswer = (val: any) => { if (!isRevealed) setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: val })); }
  const handleDeletePractice = async (path: string) => { if (confirm("Delete this history?")) { await sidecarApi.deletePractice(path); loadPastPractices(); } }

  const toggleAtomicNote = (noteId: string) => {
    setAdvancedConfig(prev => ({
      ...prev,
      selectedAtomicNotes: prev.selectedAtomicNotes.includes(noteId)
        ? prev.selectedAtomicNotes.filter(n => n !== noteId)
        : [...prev.selectedAtomicNotes, noteId]
    }))
  }

  const addKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault()
      if (!advancedConfig.exclusionKeywords.includes(keywordInput.trim())) {
        setAdvancedConfig(prev => ({
          ...prev,
          exclusionKeywords: [...prev.exclusionKeywords, keywordInput.trim()]
        }))
      }
      setKeywordInput("")
    }
  }

  const removeKeyword = (kw: string) => {
    setAdvancedConfig(prev => ({
      ...prev,
      exclusionKeywords: prev.exclusionKeywords.filter(k => k !== kw)
    }))
  }

  const updateDistribution = (type: keyof AdvancedPracticeConfig['questionDistribution'], val: number) => {
    setAdvancedConfig(prev => ({
      ...prev,
      questionDistribution: {
        ...prev.questionDistribution,
        [type]: val
      }
    }))
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DASHBOARD RENDERER
  // ──────────────────────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    const validPractices = pastPractices.filter(p => p.completed && p.score);
    const totalPrecision = validPractices.length ? Math.round(validPractices.reduce((acc, p) => acc + parseInt(p.score), 0) / validPractices.length) : 0;
    const lastScores = validPractices.slice(-5).map(p => parseInt(p.score));
    let stability = "New";
    if (lastScores.length >= 3) {
      const avg = lastScores.reduce((a, b) => a + b, 0) / lastScores.length;
      const variance = lastScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lastScores.length;
      stability = variance < 50 ? "Stable" : variance < 200 ? "Changing" : "Unstable";
    }
    const hubStats = hubs.map(hub => {
      const hubPractices = validPractices.filter(p => p.hub_id === hub.id);
      const lastDate = hubPractices.length ? new Date(hubPractices[hubPractices.length - 1].date).getTime() : 0;
      const avgScore = hubPractices.length ? hubPractices.reduce((a, b) => a + parseInt(b.score), 0) / hubPractices.length : 0;
      return { hub, lastDate, avgScore, count: hubPractices.length };
    });
    const suggested = hubStats.sort((a, b) => {
      if (a.count === 0) return -1; if (b.count === 0) return 1;
      return a.lastDate - b.lastDate || a.avgScore - b.avgScore;
    })[0]?.hub.title || "None";
    const gapSeverity = totalPrecision > 90 ? "Good" : totalPrecision > 70 ? "Okay" : totalPrecision > 0 ? "Needs Work" : "New";

    return (
      <div className="h-full flex-1 flex flex-row w-full bg-background text-foreground animate-in fade-in duration-500 font-sans overflow-hidden">
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col shrink-0">
          <div className="p-6 space-y-8">
            <div className="flex items-center gap-2 mb-10"><div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center"><BrainCircuit size={14} className="text-primary-foreground" /></div><span className="text-[10px] font-black uppercase tracking-widest">Practice</span></div>
            <div className="space-y-1">
              <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-4 py-2 bg-background border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-foreground transition-all"><LayoutGrid size={12}/> Overview</button>
              <button onClick={() => setView('history')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-md text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"><History size={12}/> History</button>
            </div>
          </div>
          <div className="flex-1" />
          <div className="p-4 border-t border-border">
            <Button onClick={() => setView('configuring')} className="w-full h-11 bg-primary text-primary-foreground rounded-md font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-[0.98] transition-all">New Session</Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-16">
          <div className="flex items-end justify-between border-b border-border pb-10">
            <div className="space-y-2"><span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Analytics</span><h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-foreground">Practice<br/><span className="text-muted-foreground/30">Overview</span></h1></div>
            <div className="flex gap-10"><div className="text-right space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Average</div><div className="text-3xl font-black tracking-tighter text-foreground tabular-nums">{totalPrecision}%</div></div><div className="text-right space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Sessions</div><div className="text-3xl font-black tracking-tighter text-foreground tabular-nums">{pastPractices.length}</div></div></div>
          </div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 space-y-8">
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-muted/10 border border-border rounded-md space-y-4 hover:border-primary transition-all group"><TrendingUp size={12} className="text-muted-foreground group-hover:text-primary"/><div className="space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Stability</div><div className="text-xl font-black tracking-tighter text-foreground tabular-nums">{stability}</div></div></div>
                  <div className="p-6 bg-muted/10 border border-border rounded-md space-y-4 hover:border-primary transition-all group"><ScanSearch size={12} className="text-muted-foreground group-hover:text-primary"/><div className="space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Next Topic</div><div className="text-[10px] font-black tracking-tight text-foreground truncate uppercase">{suggested}</div></div></div>
                  <div className="p-6 bg-muted/10 border border-border rounded-md space-y-4 hover:border-primary transition-all group"><Dna size={12} className="text-muted-foreground group-hover:text-primary"/><div className="space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Status</div><div className="text-xl font-black tracking-tighter text-foreground tabular-nums">{gapSeverity}</div></div></div>
               </div>
               <div className="p-8 bg-background border border-border rounded-md space-y-8">
                  <div className="flex justify-between items-center"><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Recent Progress</h3><span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">Last 15 Sessions</span></div>
                  <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={pastPractices.filter(p => p.completed).slice(-15).map((p, i) => ({ name: i + 1, score: parseInt(p.score) }))}><Line type="stepAfter" dataKey="score" stroke="currentColor" strokeWidth={3} dot={false} className="text-primary" /></LineChart></ResponsiveContainer></div>
               </div>
            </div>
            <div className="col-span-12 lg:col-span-4 p-8 bg-muted/5 border border-border rounded-md flex flex-col items-center justify-center space-y-10">
               <div className="text-center space-y-1"><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Activity</h3><p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">Days Practiced</p></div>
               <ActivityCalendar data={calendarData} theme={{ light: ['#f5f5f5', '#e5e5e5', '#a3a3a3', '#404040', '#0a0a0a'], dark: ['#171717', '#262626', '#404040', '#737373', '#ffffff'] }} fontSize={8} blockSize={8} blockMargin={2} />
               <Button onClick={() => setView('history')} variant="ghost" className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Full History <ChevronRight size={10} className="ml-2"/></Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HISTORY RENDERER
  // ──────────────────────────────────────────────────────────────────────────
  if (view === 'history') {
    return (
      <div className="h-full flex-1 flex flex-row w-full bg-background text-foreground animate-in fade-in duration-500 font-sans overflow-hidden">
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col shrink-0">
          <div className="p-6 space-y-8">
            <div className="flex items-center gap-2 mb-10"><div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center"><BrainCircuit size={14} className="text-primary-foreground" /></div><span className="text-[10px] font-black uppercase tracking-widest">Practice</span></div>
            <div className="space-y-1">
              <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-md text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"><LayoutGrid size={12}/> Dashboard</button>
              <button onClick={() => setView('history')} className="w-full flex items-center gap-3 px-4 py-2 bg-background border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-foreground transition-all"><History size={12}/> History</button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          <div className="flex items-end justify-between border-b border-border pb-10">
            <div className="space-y-2"><span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">History</span><h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-foreground">Past<br/><span className="text-muted-foreground/30">Sessions</span></h1></div>
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{pastPractices.length} Sessions</span>
          </div>
          <div className="grid grid-cols-1 border border-border rounded-md overflow-hidden divide-y divide-border/50 shadow-sm">
            {pastPractices.slice().reverse().map((p, i) => (
              <div key={i} onClick={() => handleResumePractice(p.path)} className="bg-background hover:bg-muted/30 p-5 flex items-center justify-between group transition-colors cursor-pointer">
                <div className="flex flex-col gap-1 min-w-0"><span className="text-[11px] font-black uppercase tracking-widest truncate text-foreground group-hover:text-primary transition-colors">{p.hub_title || 'Unknown Topic'}</span><span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">{p.course || 'Global'} // {new Date(p.date).toLocaleDateString()}</span></div>
                <div className="flex items-center gap-10"><div className={cn("text-lg font-black tracking-tighter tabular-nums", parseInt(p.score) >= 80 ? "text-foreground" : "text-muted-foreground/30")}>{p.score}%</div><button onClick={(e) => { e.stopPropagation(); handleDeletePractice(p.path); }} className="p-2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"><Trash2 size={12}/></button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CONFIGURATION RENDERER (INLINED SETTINGS)
  // ──────────────────────────────────────────────────────────────────────────
  if (view === 'configuring') {
    const totalQuestions = Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0)
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-8 py-20 w-full space-y-16">
          <div className="flex items-end justify-between border-b border-border pb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest"><button onClick={() => setView('dashboard')} className="hover:text-foreground">Cancel</button><ChevronRight size={10} className="opacity-20"/><span className="text-foreground">Setup</span></div>
              <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">New<br/><span className="text-muted-foreground/30">Session</span></h1>
            </div>
            <div className="flex flex-col items-end gap-2"><span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Questions</span><div className="text-2xl font-black text-primary tracking-tighter">{totalQuestions}</div></div>
          </div>
          <div className="flex flex-col gap-16">
            <div className="space-y-12">
               <div className="space-y-6">
                 <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">01</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Basics</h3></div>
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground/50">Topic</Label>
                    <Select value={selectedHub} onValueChange={setSelectedHub}>
                        <SelectTrigger className="w-full h-14 bg-muted/10 border-border rounded-md px-6 text-left uppercase focus:ring-primary"><div className="flex flex-col gap-0.5"><span className="text-[8px] text-muted-foreground/40">{hubs.find(h => h.id === selectedHub)?.course || "SELECT"}</span><div className="text-[11px] font-black text-foreground"><SelectValue placeholder="Select topic..." /></div></div></SelectTrigger>
                        <SelectContent className="rounded-md border-border bg-popover shadow-xl">{hubs.map(hub => (<SelectItem key={hub.id} value={hub.id} className="py-3 px-4 focus:bg-accent uppercase"><div className="flex flex-col gap-0.5"><span className="text-[10px] font-black tracking-widest">{hub.title}</span><span className="text-[8px] font-black text-muted-foreground/50">{hub.course}</span></div></SelectItem>))}</SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground/50">Difficulty</Label>
                    <RadioGroup value={advancedConfig.difficulty} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, difficulty: val as any }))} className="grid grid-cols-2 gap-3">
                        {['L1', 'L2', 'L3', 'Mixed'].map((level) => (
                        <div key={level}><RadioGroupItem value={level} id={level} className="peer sr-only" /><Label htmlFor={level} className="flex flex-col items-center justify-center gap-1 h-16 border border-border rounded-md bg-background peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-muted/30 cursor-pointer hover:bg-muted/10 transition-all text-center"><span className="text-[11px] font-black uppercase tracking-widest">{level}</span></Label></div>
                        ))}
                    </RadioGroup>
                 </div>
               </div>
               <div className="space-y-6">
                 <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">02</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Timer</h3></div>
                 <div className="grid grid-cols-2 gap-px bg-border border border-border overflow-hidden rounded-md">
                    <div className="bg-background p-5 space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground/50">Session Time</Label><Select value={String(advancedConfig.globalTimeLimitMinutes || "null")} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, globalTimeLimitMinutes: val === "null" ? null : parseInt(val) }))}><SelectTrigger className="bg-muted/5 border-none h-10 font-black text-[10px] uppercase tracking-widest focus:ring-0 px-0 shadow-none"><SelectValue placeholder="No Limit" /></SelectTrigger><SelectContent className="rounded-md border border-border bg-popover font-black"><SelectItem value="null" className="text-[10px] uppercase">No Limit</SelectItem><SelectItem value="5" className="text-[10px] uppercase">5 Mins</SelectItem><SelectItem value="10" className="text-[10px] uppercase">10 Mins</SelectItem></SelectContent></Select></div>
                    <div className="bg-background p-5 space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground/50">Per Question</Label><Select value={String(advancedConfig.perQuestionTimeLimitSeconds || "null")} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, perQuestionTimeLimitSeconds: val === "null" ? null : parseInt(val) }))}><SelectTrigger className="bg-muted/5 border-none h-10 font-black text-[10px] uppercase tracking-widest focus:ring-0 px-0 shadow-none"><SelectValue placeholder="No Limit" /></SelectTrigger><SelectContent className="rounded-md border border-border bg-popover font-black"><SelectItem value="null" className="text-[10px] uppercase">No Limit</SelectItem><SelectItem value="30" className="text-[10px] uppercase">30 Secs</SelectItem><SelectItem value="60" className="text-[10px] uppercase">60 Secs</SelectItem></SelectContent></Select></div>
                 </div>
               </div>
            </div>
            <div className="space-y-12">
               <div className="space-y-6">
                  <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">03</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Content</h3></div>
                  <div className="space-y-4"><Label className="text-[10px] font-black uppercase text-muted-foreground/50">Source Notes</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-14 border-border bg-muted/10 hover:bg-muted/20 rounded-md px-6 text-left group"><span className="font-black text-[10px] uppercase tracking-widest text-foreground truncate">{advancedConfig.selectedAtomicNotes.length === 0 ? "All Notes" : `${advancedConfig.selectedAtomicNotes.length} Selected`}</span><Layers size={12} className="text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="w-[400px] p-0 rounded-md border border-border bg-popover shadow-2xl" align="start"><Command className="bg-transparent"><CommandInput placeholder="Search notes..." className="font-black border-none h-12 text-[10px] uppercase tracking-widest" /><CommandList className="custom-scrollbar max-h-72"><CommandEmpty className="py-12 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No matching notes.</CommandEmpty><CommandGroup>{availableNotes.map(note => { const id = note.id; const label = note.title; const isSelected = advancedConfig.selectedAtomicNotes.includes(id); return (<CommandItem key={id} onSelect={() => toggleAtomicNote(id)} className="flex items-center gap-4 cursor-pointer py-3 px-4 focus:bg-accent"><div className={cn("w-4 h-4 border flex items-center justify-center transition-all rounded-sm", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background")}>{isSelected && <Check className="w-3 h-3" />}</div><span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span></CommandItem>); })}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>
                  <div className="space-y-4"><Label className="text-[10px] font-black uppercase text-muted-foreground/50">Exclusions</Label><Input placeholder="Exclude keywords..." className="bg-muted/10 border-border focus-visible:ring-primary h-14 rounded-md font-black text-[10px] uppercase tracking-widest px-6 placeholder:text-muted-foreground/10" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={addKeyword} /><div className="flex flex-wrap gap-1 pt-2">{advancedConfig.exclusionKeywords.map(kw => (<Badge key={kw} variant="secondary" className="bg-muted text-foreground/80 gap-2 border border-transparent py-1 px-3 rounded-sm font-black text-[8px] uppercase tracking-widest">{kw}<X className="w-3 h-3 cursor-pointer opacity-40" onClick={() => removeKeyword(kw)} /></Badge>))}</div></div>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">04</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Question Types</h3></div>
                  <div className="grid grid-cols-1 gap-10">{[{ key: 'multipleChoice', label: 'MCQ' }, { key: 'trueFalse', label: 'Binary' }, { key: 'shortAnswer', label: 'Open' }, { key: 'clozeDeletion', label: 'Cloze' }].map(type => (<div key={type.key} className="space-y-3"><div className="flex justify-between items-center"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{type.label}</Label><span className="text-[10px] font-black text-foreground tabular-nums tracking-widest bg-muted/20 px-2 py-0.5 border border-border/50">{advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]}</span></div><Slider defaultValue={[advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]]} max={15} step={1} onValueChange={(vals) => updateDistribution(type.key as any, vals[0])} className="py-1" /></div>))}</div>
               </div>
            </div>
          </div>
          <div className="pt-10 border-t border-border flex flex-col gap-10">
             <div className="space-y-px bg-border border border-border overflow-hidden rounded-md w-full">
                {[{ key: 'prioritizeWeaknesses', label: 'Focus on weaknesses' }, { key: 'injectTrickAnswers', label: 'Include trick answers' }, { key: 'progressionGatekeeper', label: 'Lock progression' }, { key: 'enableProgressiveHints', label: 'Enable hints' }, { key: 'requireConfidenceWager', label: 'Confidence wagers' }].map(item => (<div key={item.key} className="flex items-center justify-between p-4 bg-background hover:bg-muted/10 transition-all"><Label className="text-[10px] font-black text-foreground uppercase tracking-widest">{item.label}</Label><Switch checked={advancedConfig[item.key as keyof AdvancedPracticeConfig] as boolean} onCheckedChange={(checked) => setAdvancedConfig(prev => ({ ...prev, [item.key]: checked }))} className="data-[state=checked]:bg-primary" /></div>))}
             </div>
             <Button onClick={handleStartSession} disabled={isLoading} className="h-20 w-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.4em] rounded-md shadow-xl shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">
                {isLoading ? "LOADING..." : "START SESSION"}
             </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'loading') {
    return (
        <div className="h-full flex-1 flex flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-10">
                <div className="relative flex items-center justify-center">
                    <Loader2 size={64} className="text-primary animate-spin" />
                </div>
                <div className="text-center space-y-2">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] animate-pulse">Interface Init</div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Generating Session...</h2>
                </div>
                <div className="w-64 h-1 bg-muted rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary transition-all duration-[3000ms] ease-out w-0 animate-[loading-bar_3s_infinite]" />
                </div>
            </div>
            <style>{`@keyframes loading-bar { 0% { width: 0%; left: 0; } 50% { width: 100%; left: 0; } 100% { width: 0%; left: 100%; } }`}</style>
        </div>
    )
  }

  if (view === 'session' && currentQuestion) {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground font-sans overflow-hidden animate-in fade-in duration-700">
        <div className="px-10 py-5 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-3xl z-20 shrink-0">
          <div className="flex items-center gap-10">
            <div className="space-y-1"><span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Active Session</span><div className="text-[11px] font-black uppercase tracking-widest text-foreground">{hubs.find(h => h.id === selectedHub)?.title || 'Topic'}</div></div>
            <div className="w-80 h-1 bg-muted rounded-full overflow-hidden flex gap-1 p-px">{questions.map((_, idx) => (<div key={idx} className={cn("flex-1 h-full rounded-full transition-all duration-700", idx === currentQuestionIdx ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : idx < currentQuestionIdx ? (gradedAnswers[questions[idx].id] ? "bg-foreground" : "bg-muted-foreground/30") : "bg-muted-foreground/10")} />))}</div>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">{globalTimeLeft !== null && <span className="tabular-nums px-3 py-1.5 border border-border rounded-md bg-muted/20 text-foreground">{Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}</span>}<span className="text-muted-foreground/50">Q <span className="text-foreground">{currentQuestionIdx + 1}</span> / {questions.length}</span></div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-20 relative">
          <div className="max-w-2xl mx-auto space-y-16 pb-64">
             <div className="space-y-5 animate-in slide-in-from-top-2 fade-in duration-500">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"><Badge variant="outline" className="text-[8px] px-2 py-0.5 border-border rounded-sm">{currentQuestion.difficulty}</Badge><div className="w-1 h-1 rounded-full bg-border"/><span>{currentQuestion.type.replace('_', ' ')}</span></div>
                <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-[1.1] text-foreground">{currentQuestion.question}</h2>
             </div>
             <div className="space-y-4">
                {currentQuestion.type === 'mcq' && (<div className="grid grid-cols-1 gap-2">{Object.entries(currentQuestion.options!).map(([key, val]) => { const isSelected = userAnswers[currentQuestion.id] === key; const isCorrect = isRevealed && key === currentQuestion.answer; return (<button key={key} disabled={isRevealed} onClick={() => handleSelectAnswer(key)} className={cn("flex items-center gap-5 p-5 border-2 rounded-md text-left transition-all uppercase", isCorrect ? "border-primary bg-muted/20" : isSelected && !isRevealed ? "border-foreground bg-muted/10 shadow-sm" : "border-border hover:bg-muted/5", isRevealed && !isCorrect ? "opacity-10 grayscale" : "")}><div className={cn("w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-black border", isCorrect || (isSelected && !isRevealed) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 border-border text-muted-foreground/40")}>{key}</div><span className="text-[12px] font-black tracking-widest flex-1 text-foreground">{String(val)}</span></button>) })}</div>)}
                {currentQuestion.type === 'true_false' && (<div className="grid grid-cols-2 gap-4">{['True', 'False'].map(v => { const isSelected = userAnswers[currentQuestion.id] === v; const isCorrect = isRevealed && v.toLowerCase() === String(currentQuestion.answer).toLowerCase(); return (<button key={v} disabled={isRevealed} onClick={() => handleSelectAnswer(v)} className={cn("h-20 border-2 rounded-md font-black uppercase tracking-widest text-xs transition-all", isCorrect ? "bg-primary text-primary-foreground border-primary" : isSelected && !isRevealed ? "border-foreground bg-muted/20" : "border-border text-muted-foreground/30", isRevealed && !isCorrect ? "opacity-10" : "")}>{v}</button>) })}</div>)}
                {['short_answer', 'scenario', 'code'].includes(currentQuestion.type) && (<div className="space-y-10"><div className="p-8 bg-muted/5 border border-border rounded-md focus-within:border-primary transition-all"><textarea rows={6} disabled={isRevealed} className="w-full bg-transparent border-none focus:ring-0 text-[13px] font-black uppercase tracking-widest placeholder:text-muted-foreground/10 resize-none leading-relaxed text-foreground/90 uppercase" placeholder="Enter answer..." value={userAnswers[currentQuestion.id] || ""} onChange={(e) => handleSelectAnswer(e.target.value)} /></div>{isRevealed && (<div className="p-8 border-l-4 border-primary bg-muted/10 space-y-4 animate-in slide-in-from-left-2 rounded-r-md"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary"><Filter size={10}/> Solution</div><p className="text-[13px] font-black uppercase leading-relaxed tracking-widest text-foreground">{(currentQuestion as any).answer}</p></div>)}</div>)}
             </div>
          </div>
        </div>
        <div className="bg-background/80 backdrop-blur-3xl border-t border-border p-8 shrink-0 z-30"><div className="max-w-2xl mx-auto flex items-center justify-between"><Button variant="ghost" onClick={() => { if (confirm("End early?")) resetSession(); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground">Exit</Button><div className="flex items-center gap-4">{!isRevealed ? (<Button onClick={handleSubmitAnswer} disabled={!userAnswers[currentQuestion.id] && currentQuestion.type !== 'code'} className="h-12 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">Check <Zap size={14}/></Button>) : (<div className="flex items-center gap-4">{!gradedAnswers[currentQuestion.id] && ['short_answer', 'scenario'].includes(currentQuestion.type) && (<div className="flex gap-2"><Button onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: false})); nextQuestion(); }} variant="outline" className="h-12 border-border text-muted-foreground/50 hover:text-destructive text-[9px] font-black uppercase rounded-md tracking-widest">Incorrect</Button><Button onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: true})); nextQuestion(); }} className="h-12 bg-foreground text-background text-[9px] font-black uppercase rounded-md tracking-widest">Correct</Button></div>)} {(gradedAnswers[currentQuestion.id] !== undefined || !['short_answer', 'scenario'].includes(currentQuestion.type)) && (<Button onClick={nextQuestion} className="h-12 px-12 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md hover:brightness-110 transition-all">Next <ArrowRight size={14}/></Button>)}</div>)}</div></div></div>
      </div>
    );
  }

  if (view === 'results') {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground font-sans overflow-hidden animate-in fade-in duration-700 flex flex-col items-center justify-center p-20">
         <div className="max-w-2xl mx-auto w-full text-center space-y-12">
            <div className="space-y-2"><h1 className="text-8xl font-black tracking-tighter leading-none text-foreground">{calculateScore().score}<span className="text-2xl text-muted-foreground/30 tracking-normal">%</span></h1><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Score</p></div>
            <div className="grid grid-cols-2 divide-x divide-border border-y border-border py-10"><div className="space-y-1"><div className="text-2xl font-black tracking-tighter text-foreground">{calculateScore().correct}/{calculateScore().total}</div><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Correct</div></div><div className="space-y-1"><div className="text-2xl font-black tracking-tighter text-foreground">{calculateScore().score}%</div><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total</div></div></div>
            <div className="flex gap-4"><Button onClick={() => setView('configuring')} className="flex-1 h-14 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md">Restart</Button><Button variant="outline" onClick={() => setView('dashboard')} className="flex-1 h-14 border-border text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest rounded-md border-dashed hover:text-foreground">Done</Button></div>
         </div>
      </div>
    );
  }

  return null;
}
