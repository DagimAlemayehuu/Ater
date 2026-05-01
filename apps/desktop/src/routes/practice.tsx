/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { 
  BrainCircuit,
  Layers,
  Zap,
  ArrowRight,
  Trash2,
  ChevronRight,
  History,
  LayoutGrid,
  Filter,
  TrendingUp,
  ScanSearch,
  Dna,
  Check,
  Loader2,
  Info,
  Target,
  X
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
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
  questionDistribution: { 
    mcq: 0, 
    true_false: 0, 
    writing: 0, 
    fill_in: 0, 
    matching: 0, 
    order: 0, 
    debug: 0, 
    synthesis: 0 
  },
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
  const [pastPractices, setPastPractices] = useState<any[]>([])
  const [currentPracticePath, setCurrentPracticePath] = useState<string | null>(null)
  const [availableNotes, setAvailableNotes] = useState<any[]>([])
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)


  const calendarData = useMemo(() => {
    const data = Object.entries(pastPractices.reduce((acc, p) => {
      if (!p.date) return acc;
      try { const d = new Date(p.date).toISOString().split('T')[0]; acc[d] = (acc[d] || 0) + 1; } catch { /* ignore parse error */ }
      return acc;
    }, {} as Record<string, number>)).map(([date, count]) => ({ date, count: Number(count), level: Math.min(Number(count), 4) as 0 | 1 | 2 | 3 | 4 }));
    return data.length ? data : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 as const }];
  }, [pastPractices])

  useEffect(() => { loadHubs(); loadPastPractices(); }, [])

  // Handle hubId from query param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hubId = searchParams.get('hubId');
    if (hubId && hubs.length > 0) {
      // Find by ID or by path-like slug
      const hub = hubs.find(h => h.id === hubId || h.path.includes(hubId));
      if (hub) setSelectedHub(hub.id);
    }
  }, [hubs]);

  useEffect(() => { if (selectedHub) loadHubNotes(selectedHub); }, [selectedHub])
  const loadHubNotes = async (hubId: string) => { 
    try { 
      const res = await sidecarApi.listHubNotes(hubId); 
      setAvailableNotes(res.notes);
      // Default: Select all notes
      setAdvancedConfig(prev => ({
        ...prev,
        selectedAtomicNotes: res.notes.map((n: any) => n.id)
      }))
    } catch { 
      console.error("Error occurred"); 
    } 
  }

  useEffect(() => {
    if (questions.length > 0 && view === 'session') {
      timerRef.current = setInterval(() => {
        if (globalTimeLeft !== null) setGlobalTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
        if (questionTimeLeft !== null) setQuestionTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current!) }
  }, [questions, view, globalTimeLeft, questionTimeLeft])

  const loadPastPractices = async () => { try { const res = await sidecarApi.listPractices(); setPastPractices(res.practices); } catch { console.error("Error occurred"); } }
  const loadHubs = async () => { try { const res = await sidecarApi.listHubs(); setHubs(res.hubs); if (res.hubs.length > 0) setSelectedHub(res.hubs[0].id); } catch { console.error("Error occurred"); } }

  const handleStartSession = async () => {
    if (!selectedHub) {
      toast.error('Choose a topic first.');
      return;
    }
    if (advancedConfig.selectedAtomicNotes.length === 0) {
      toast.error('Select at least one note to continue.');
      return;
    }
    setIsLoading(true);
    setView('loading');
    try {
      // Cleanup distribution to only include valid unified keys
      const cleanDistribution = Object.fromEntries(
        Object.entries(advancedConfig.questionDistribution).filter(([k]) => 
          ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis'].includes(k)
        )
      );

      const res = await sidecarApi.generatePractice(selectedHub, { 
        ...advancedConfig, 
        hubId: selectedHub,
        questionDistribution: cleanDistribution 
      });
      if (!res.questions || res.questions.length === 0) {
        toast.error('Could not find enough content to make questions.');
        setView('configuring');
        return;
      }
      setTimeout(() => {
        setQuestions(res.questions); setCurrentPracticePath(res.quiz_path); setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false); setGradedAnswers({}); setView('session');
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
        setQuestions(res.questions); setCurrentPracticePath(path); setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false); setGradedAnswers({}); setView('session');
      }, 1000);
    } catch { 
        toast.error('Could not load session.'); 
        setView('history');
    } finally { setIsLoading(false); }
  }

  const handleSubmitAnswer = () => {
    setIsRevealed(true);
    const q = questions[currentQuestionIdx];
    let isCorrect = false;

    if (q.type === 'mcq' || q.type === 'true_false' || q.type === 'writing' || q.type === 'debug' || q.type === 'synthesis') {
      const userVal = String(userAnswers[q.id] || '').trim();
      const correctVal = String(q.answer || '').trim();
      
      if (q.type === 'true_false') {
        const userBool = userVal.toLowerCase() === 'true';
        const correctBool = typeof q.answer === 'boolean' ? q.answer : String(q.answer).toLowerCase() === 'true';
        isCorrect = userBool === correctBool;
      } else if (q.type === 'debug') {
        // More flexible grading for code: normalize whitespace
        const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
        isCorrect = norm(userVal) === norm(correctVal);
      } else {
        isCorrect = userVal.toLowerCase() === correctVal.toLowerCase();
      }
      
      if (q.type === 'mcq' && q.options) {
        const correctText = String(q.options[q.answer] || '').trim().toLowerCase();
        isCorrect = isCorrect || userVal.toLowerCase() === correctText;
      }
    } else if (q.type === 'fill_in') {
      const answers = userAnswers[q.id] || [];
      const correctAnswers = q.answer || [];
      isCorrect = Array.isArray(correctAnswers) && correctAnswers.every((ans: string, idx: number) => 
        String(answers[idx] || '').trim().toLowerCase() === String(ans || '').trim().toLowerCase()
      );
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

    setGradedAnswers(prev => ({ ...prev, [q.id]: isCorrect }));
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
              <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-4 py-2 bg-background border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-foreground transition-all"><LayoutGrid size={12}/> Main</button>
              <button onClick={() => setView('history')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-md text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"><History size={12}/> History</button>
            </div>
          </div>
          <div className="flex-1" />
          <div className="p-4 border-t border-border">
            <Button onClick={() => setView('configuring')} className="w-full h-11 bg-primary text-primary-foreground rounded-md font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-[0.98] transition-all">Start</Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-16">
          <div className="flex items-end justify-between border-b border-border pb-6">
            <div className="space-y-1"><span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Stats</span><h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-foreground">My <span className="text-muted-foreground/30">Progress</span></h1></div>
            <div className="flex gap-8"><div className="text-right space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Average</div><div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">{totalPrecision}%</div></div><div className="text-right space-y-1"><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Done</div><div className="text-2xl font-black tracking-tighter text-foreground tabular-nums">{pastPractices.length}</div></div></div>
          </div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 space-y-12">
               {/* High-Level Stats */}
               <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Flow', value: stability, icon: <TrendingUp size={12}/>, color: 'text-primary' },
                    { label: 'Streak', value: '4 Days', icon: <ScanSearch size={12}/>, color: 'text-foreground' },
                    { label: 'Best Mode', value: 'Writing', icon: <Dna size={12}/>, color: 'text-primary' },
                    { label: 'Target', value: '95%', icon: <Target size={12}/>, color: 'text-muted-foreground' }
                  ].map((stat, i) => (
                    <div key={i} className="p-5 border border-border bg-background rounded-lg space-y-2 hover:border-primary/50 transition-all group">
                      <div className="flex items-center gap-2 text-muted-foreground/30">
                        {stat.icon}
                        <span className="text-[8px] font-black uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <div className={cn("text-lg font-black uppercase tracking-tighter", stat.color)}>{stat.value}</div>
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-3 gap-10">
                  {/* Score History (Curvy Spline) */}
                  <div className="col-span-2 p-10 border border-border bg-background rounded-lg space-y-10 flex flex-col">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-primary"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Proficiency Trend</h3>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Last 15 Sessions</span>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pastPractices.filter(p => p.completed).slice(-15).map((p, i) => ({ name: i + 1, score: parseInt(p.score) }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                            itemStyle={{ color: 'white', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="currentColor" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: 'white', strokeWidth: 2 }} 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            className="text-primary"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Modality Breakdown */}
                  <div className="p-10 border border-border bg-background rounded-lg space-y-8 flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-primary"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Modality Proficiency</h3>
                    </div>
                    <div className="flex-1 space-y-6">
                      {[
                        { type: 'MCQ', p: 88 },
                        { type: 'TRUE/FALSE', p: 94 },
                        { type: 'WRITING', p: 32 },
                        { type: 'MATCHING', p: 76 },
                        { type: 'ORDER', p: 54 },
                        { type: 'DEBUG', p: 41 },
                      ].map((stat, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground/40">{stat.type}</span>
                            <span className="text-foreground">{stat.p}%</span>
                          </div>
                          <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${stat.p}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subject mastery grid */}
                  <div className="col-span-3 p-10 border border-border bg-background rounded-lg space-y-10">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-primary"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Subject Domain Mastery</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-8">
                      {hubs.slice(0, 4).map((hub, i) => {
                        const mastery = Math.floor(Math.random() * 60) + 40;
                        return (
                          <div key={i} className="p-6 border border-border bg-muted/5 rounded-md space-y-6 hover:border-primary/30 transition-all">
                            <div className="text-[10px] font-black uppercase tracking-tight text-foreground h-10 line-clamp-2 leading-tight">{hub.title}</div>
                            <div className="flex items-end gap-2">
                              <div className="text-3xl font-black tracking-tighter text-primary leading-none">{mastery}%</div>
                              <div className="text-[8px] font-black uppercase text-muted-foreground/30 mb-1 tracking-widest">Mastered</div>
                            </div>
                            <div className="h-0.5 w-full bg-muted/10 rounded-full overflow-hidden">
                              <div className="h-full bg-foreground/20" style={{ width: `${mastery}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
               </div>
               
               <Button onClick={() => setView('history')} variant="ghost" className="w-full h-16 border border-dashed border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                 View Comprehensive History Log <ChevronRight size={10} className="ml-2"/>
               </Button>
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
              <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted rounded-md text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"><LayoutGrid size={12}/> Main</button>
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
              <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest"><button onClick={() => setView('dashboard')} className="hover:text-foreground">Cancel</button><ChevronRight size={10} className="opacity-20"/><span className="text-foreground">Start</span></div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">New <span className="text-muted-foreground/30">Session</span></h1>
            </div>
            <div className="flex flex-col items-end gap-2"><span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Questions</span><div className="text-2xl font-black text-primary tracking-tighter">{totalQuestions}</div></div>
          </div>
          <div className="flex flex-col gap-16">
            <div className="space-y-12">
               <div className="space-y-6">
                 <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">01</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Topic</h3></div>
                 <div className="space-y-4">
                    <Select value={selectedHub} onValueChange={setSelectedHub}>
                        <SelectTrigger className="w-full h-14 bg-muted/10 border-border rounded-md px-6 text-left uppercase focus:ring-primary"><div className="flex flex-col gap-0.5"><span className="text-[8px] text-muted-foreground/40">{hubs.find(h => h.id === selectedHub)?.course || "SELECT"}</span><div className="text-[11px] font-black text-foreground"><SelectValue placeholder="Select topic..." /></div></div></SelectTrigger>
                        <SelectContent className="rounded-md border-border bg-popover shadow-xl">{hubs.map(hub => (<SelectItem key={hub.id} value={hub.id} className="py-3 px-4 focus:bg-accent uppercase"><div className="flex flex-col gap-0.5"><span className="text-[10px] font-black tracking-widest">{hub.title}</span><span className="text-[8px] font-black text-muted-foreground/50">{hub.course}</span></div></SelectItem>))}</SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground/50">Level</Label>
                    <RadioGroup value={advancedConfig.difficulty} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, difficulty: val as any }))} className="grid grid-cols-2 gap-3">
                        {[
                          { val: 'L1', label: 'Level 1' },
                          { val: 'L2', label: 'Level 2' },
                          { val: 'L3', label: 'Level 3' },
                          { val: 'Mixed', label: 'Mixed' }
                        ].map((level) => (
                        <div key={level.val}><RadioGroupItem value={level.val} id={level.val} className="peer sr-only" /><Label htmlFor={level.val} className="flex flex-col items-center justify-center gap-1 h-16 border border-border rounded-md bg-background peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-muted/30 cursor-pointer hover:bg-muted/10 transition-all text-center"><span className="text-[11px] font-black uppercase tracking-widest">{level.label}</span></Label></div>
                        ))}
                    </RadioGroup>
                  </div>
               </div>
               <div className="space-y-6">
                 <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">02</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Time</h3></div>
                 <div className="grid grid-cols-2 gap-px bg-border border border-border overflow-hidden rounded-md">
                    <div className="bg-background p-5 space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground/50">Total Time</Label>
                      <Select value={String(advancedConfig.globalTimeLimitMinutes || "null")} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, globalTimeLimitMinutes: val === "null" ? null : parseInt(val) }))}>
                        <SelectTrigger className="bg-muted/5 border-none h-10 font-black text-[10px] uppercase tracking-widest focus:ring-0 px-0 shadow-none">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border border-border bg-popover font-black">
                          <SelectItem value="null" className="text-[10px] uppercase">None</SelectItem>
                          {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(m => (
                            <SelectItem key={m} value={String(m)} className="text-[10px] uppercase">{m} Mins</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-background p-5 space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground/50">Per Question</Label>
                      <Select value={String(advancedConfig.perQuestionTimeLimitSeconds || "null")} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, perQuestionTimeLimitSeconds: val === "null" ? null : parseInt(val) }))}>
                        <SelectTrigger className="bg-muted/5 border-none h-10 font-black text-[10px] uppercase tracking-widest focus:ring-0 px-0 shadow-none">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border border-border bg-popover font-black">
                          <SelectItem value="null" className="text-[10px] uppercase">None</SelectItem>
                          {[15, 30, 45, 60, 90, 120, 180, 240, 300].map(s => (
                            <SelectItem key={s} value={String(s)} className="text-[10px] uppercase">{s} Secs</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">03</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Sources</h3></div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground/50">Notes</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-14 border-border bg-muted/10 hover:bg-muted/20 rounded-md px-6 text-left group">
                          <span className="font-black text-[10px] uppercase tracking-widest text-foreground truncate">
                            {advancedConfig.selectedAtomicNotes.length === availableNotes.length ? "All Notes" : 
                             advancedConfig.selectedAtomicNotes.length === 0 ? "No Notes Selected" :
                             `${advancedConfig.selectedAtomicNotes.length} Selected`}
                          </span>
                          <Layers size={12} className="text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 rounded-md border border-border bg-popover shadow-2xl" align="start">
                        <Command className="bg-transparent">
                          <div className="p-2 border-b border-border flex justify-between items-center bg-muted/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-2">{availableNotes.length} Found</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-3 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground"
                              onClick={() => {
                                if (advancedConfig.selectedAtomicNotes.length === availableNotes.length) {
                                  setAdvancedConfig(prev => ({ ...prev, selectedAtomicNotes: [] }))
                                } else {
                                  setAdvancedConfig(prev => ({ ...prev, selectedAtomicNotes: availableNotes.map(n => n.id) }))
                                }
                              }}
                            >
                              {advancedConfig.selectedAtomicNotes.length === availableNotes.length ? "Unselect All" : "Select All"}
                            </Button>
                          </div>
                          <CommandInput placeholder="Search notes..." className="font-black border-none h-12 text-[10px] uppercase tracking-widest" />
                          <CommandList className="custom-scrollbar max-h-72">
                            <CommandEmpty className="py-12 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No matching notes.</CommandEmpty>
                            <CommandGroup>
                              {availableNotes.map(note => { 
                                const id = note.id; 
                                const label = note.title; 
                                const isSelected = advancedConfig.selectedAtomicNotes.includes(id); 
                                return (
                                  <CommandItem key={id} onSelect={() => toggleAtomicNote(id)} className="flex items-center gap-4 cursor-pointer py-3 px-4 focus:bg-accent">
                                    <div className={cn("w-4 h-4 border flex items-center justify-center transition-all rounded-sm", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background")}>
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
               </div>
               <div className="space-y-6">
                  <div className="flex items-center gap-3"><span className="text-[10px] font-black text-muted-foreground/30">04</span><h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Questions</h3></div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                    {[
                      { key: 'mcq', label: 'Choices', desc: 'Standard multiple choice questions.' }, 
                      { key: 'true_false', label: 'True/False', desc: 'Binary truth verification.' }, 
                      { key: 'writing', label: 'Writing', desc: 'Open-ended active recall.' }, 
                      { key: 'fill_in', label: 'Fill-in', desc: 'Recall specific terms in context.' },
                      { key: 'matching', label: 'Matching', desc: 'Relate terms to their definitions.' },
                      { key: 'order', label: 'Order', desc: 'Sequence steps or processes correctly.' },
                      { key: 'debug', label: 'Debug', desc: 'Identify and fix logical or syntax errors.' },
                      { key: 'synthesis', label: 'Synthesis', desc: 'Connect concepts across different notes.' }
                    ].map(type => (
                      <div key={type.key} className="space-y-3">
                        <div className="flex justify-between items-center group/item">
                          <div className="flex items-center gap-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{type.label}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-muted-foreground/20 hover:text-primary transition-colors focus:outline-none"><Info size={10}/></button>
                              </PopoverTrigger>
                              <PopoverContent side="top" align="start" className="p-3 w-48 bg-popover border border-border rounded shadow-xl animate-in fade-in zoom-in duration-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-tight">{type.desc}</p>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <span className="text-[10px] font-black text-foreground tabular-nums tracking-widest bg-muted/20 px-2 py-0.5 border border-border/50">
                            {advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]}
                          </span>
                        </div>
                        <Slider 
                          defaultValue={[advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]]} 
                          max={15} 
                          step={1} 
                          onValueChange={(vals) => updateDistribution(type.key as any, vals[0])} 
                          className="py-1" 
                        />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
          <div className="pt-10 border-t border-border flex flex-col gap-10">
             <Button onClick={handleStartSession} disabled={isLoading} className="h-20 w-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.4em] rounded-md shadow-xl shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">
                {isLoading ? "LOADING..." : "START"}
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
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] animate-pulse">Wait</div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Thinking...</h2>
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
      <div className="h-full w-full flex flex-col bg-background text-foreground font-sans overflow-hidden animate-in fade-in duration-700">
        <div className="px-10 py-6 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-12">
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Current Session</span>
              <div className="text-[11px] font-black uppercase tracking-widest text-foreground/80">
                {hubs.find(h => h.id === selectedHub)?.title || 'Topic Exploration'}
              </div>
            </div>
            <div className="w-80 h-1.5 bg-muted/30 rounded-full overflow-hidden flex gap-1 p-0.5">
              {questions.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex-1 h-full rounded-full transition-all duration-1000", 
                    idx === currentQuestionIdx 
                      ? "bg-primary shadow-[0_0_12px_hsl(var(--primary))]" 
                      : idx < currentQuestionIdx 
                        ? (gradedAnswers[questions[idx].id] ? "bg-foreground" : "bg-muted-foreground/20") 
                        : "bg-muted-foreground/5"
                  )} 
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
            {globalTimeLeft !== null && (
              <span className="tabular-nums px-4 py-2 border border-border/50 rounded-md bg-muted/10 text-foreground/60 shadow-inner">
                {Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}
              </span>
            )}
            <span className="text-muted-foreground/30">Progress <span className="text-foreground/70 ml-2">{currentQuestionIdx + 1} / {questions.length}</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
          <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 flex flex-col justify-center">
             <div className="space-y-10">
               <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-700">
                  <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    <Badge variant="outline" className="text-[7px] px-1.5 py-0 border-border/50 rounded-sm uppercase bg-muted/5">
                      {currentQuestion.difficulty}
                    </Badge>
                    <div className="w-1 h-1 rounded-full bg-border/50"/>
                    <span>{(currentQuestion.type || 'Inquiry').replace('_', ' ')}</span>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black tracking-tight leading-snug text-foreground">
                    {currentQuestion.question}
                  </h2>
               </div>

               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
                  {currentQuestion.type === 'mcq' && (
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(currentQuestion.options!).map(([key, val]) => { 
                        const isSelected = userAnswers[currentQuestion.id] === key; 
                        const isCorrectAnswer = key === currentQuestion.answer || String(val).toLowerCase() === String(currentQuestion.answer).toLowerCase();
                        const isCorrectHighlight = isRevealed && isCorrectAnswer;
                        return (
                          <button 
                            key={key} 
                            disabled={isRevealed} 
                            onClick={() => handleSelectAnswer(key)} 
                            className={cn(
                              "group flex items-center gap-6 p-6 border-2 rounded-xl text-left transition-all duration-300", 
                              isCorrectHighlight 
                                ? "border-primary bg-primary/5 shadow-[0_0_20px_-10px_hsl(var(--primary))]" 
                                : isSelected && !isRevealed 
                                  ? "border-foreground bg-foreground/5 shadow-xl scale-[1.01]" 
                                  : "border-border/40 hover:border-foreground/20 hover:bg-muted/5", 
                              isRevealed && !isCorrectHighlight ? "opacity-20 grayscale scale-[0.98]" : ""
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black border transition-all", 
                              isCorrectHighlight || (isSelected && !isRevealed) 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "bg-muted/10 border-border/50 text-muted-foreground/30 group-hover:border-foreground/30 group-hover:text-foreground/50"
                            )}>
                              {key}
                            </div>
                            <span className="text-[13px] font-bold tracking-tight text-foreground/80 group-hover:text-foreground">
                              {String(val)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'fill_in' && (
                    <div className="p-12 bg-muted/5 border border-border/50 rounded-2xl leading-[2] text-[15px] font-medium tracking-tight text-foreground/70 shadow-inner">
                      {(() => {
                        const text = currentQuestion.textWithBlanks || '';
                        const parts = text.split(/\[\[.*?\]\]/);
                        return parts.map((part: string, i: number) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < parts.length - 1 && (
                              <input
                                type="text"
                                disabled={isRevealed}
                                value={(userAnswers[currentQuestion.id] || [])[i] || ''}
                                onChange={(e) => {
                                  const newAns = [...(userAnswers[currentQuestion.id] || [])];
                                  newAns[i] = e.target.value;
                                  handleSelectAnswer(newAns);
                                }}
                                placeholder="..."
                                className={cn(
                                  "mx-2 px-4 py-1.5 border-b-2 bg-transparent focus:outline-none transition-all w-36 text-center placeholder:opacity-20 font-black tracking-widest",
                                  isRevealed 
                                    ? (String((userAnswers[currentQuestion.id] || [])[i] || '').toLowerCase() === String((currentQuestion.answer || [])[i] || '').toLowerCase() ? "border-primary text-primary" : "border-destructive text-destructive")
                                    : "border-muted-foreground/20 focus:border-foreground text-foreground"
                                )}
                              />
                            )}
                          </React.Fragment>
                        ));
                      })()}
                    </div>
                  )}

                  {currentQuestion.type === 'matching' && (
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <div className="text-[9px] font-black text-muted-foreground/30 mb-6 tracking-[0.3em] uppercase">Structural Slots</div>
                        {(currentQuestion.pairs || []).map((pair: any, i: number) => {
                          const matchedDef = (userAnswers[currentQuestion.id] || {})[pair.left];
                          const isCorrect = isRevealed && matchedDef === pair.right;
                          return (
                            <div 
                              key={i} 
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                const def = e.dataTransfer.getData("text");
                                const currentAssignments = { ...(userAnswers[currentQuestion.id] || {}) };
                                Object.keys(currentAssignments).forEach(k => { if (currentAssignments[k] === def) delete currentAssignments[k]; });
                                currentAssignments[pair.left] = def;
                                handleSelectAnswer(currentAssignments);
                              }}
                              className={cn(
                                "p-6 border-2 rounded-xl transition-all duration-500 space-y-4",
                                isRevealed 
                                  ? (isCorrect ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5")
                                  : (matchedDef ? "border-foreground/40 bg-foreground/5 shadow-inner" : "border-border/30 bg-background hover:border-primary/20")
                              )}
                            >
                              <div className="text-[14px] font-bold tracking-tight text-foreground/90">{pair.left}</div>
                              <div className={cn(
                                "min-h-[60px] p-4 rounded-lg border-2 border-dashed flex items-center justify-center text-center transition-all",
                                matchedDef 
                                  ? "border-solid border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80"
                                  : "border-muted-foreground/10 text-[9px] font-black uppercase text-muted-foreground/20"
                              )}>
                                {matchedDef || "Drop Target"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-4 border-l border-border/50 pl-12">
                        <div className="text-[9px] font-black text-muted-foreground/30 mb-6 tracking-[0.3em] uppercase">Definition Bank</div>
                        {currentQuestion.pairs.map((p: any) => p.right).sort().map((def: string, i: number) => {
                          const isMatched = Object.values(userAnswers[currentQuestion.id] || {}).includes(def);
                          return (
                            <div
                              key={i}
                              draggable={!isRevealed && !isMatched}
                              onDragStart={(e) => e.dataTransfer.setData("text", def)}
                              className={cn(
                                "w-full p-6 border-2 rounded-xl text-left transition-all cursor-grab active:cursor-grabbing shadow-sm",
                                isMatched 
                                  ? "border-primary/5 bg-primary/5 opacity-10 grayscale scale-[0.98]" 
                                  : "border-border/40 bg-background hover:border-foreground/30 hover:bg-muted/5"
                              )}
                            >
                              <div className="text-[11px] font-bold tracking-tight text-foreground/60 leading-relaxed">
                                {def}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'order' && (
                    <div className="space-y-4">
                      <div className="text-[9px] font-black text-muted-foreground/30 mb-6 tracking-[0.3em] uppercase">Sequential Logic</div>
                      <div className="space-y-3">
                        {((userAnswers[currentQuestion.id] && Array.isArray(userAnswers[currentQuestion.id])) ? userAnswers[currentQuestion.id] : (currentQuestion.steps || [])).map((step: string, i: number) => (
                          <div 
                            key={i}
                            draggable={!isRevealed}
                            onDragStart={(e) => e.dataTransfer.setData("index", String(i))}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const fromIdx = parseInt(e.dataTransfer.getData("index"));
                              const list = [...((userAnswers[currentQuestion.id] && Array.isArray(userAnswers[currentQuestion.id])) ? userAnswers[currentQuestion.id] : (currentQuestion.steps || []))];
                              const [reorderedItem] = list.splice(fromIdx, 1);
                              list.splice(i, 0, reorderedItem);
                              handleSelectAnswer(list);
                            }}
                            className={cn(
                              "p-5 border-2 rounded-xl flex items-center gap-6 transition-all duration-300",
                              isRevealed 
                                ? (String(userAnswers[currentQuestion.id]?.[i]) === String(currentQuestion.answer?.[i]) ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5")
                                : "border-border/40 bg-background hover:border-foreground/20 cursor-grab active:cursor-grabbing"
                            )}
                          >
                            <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center text-[11px] font-black text-foreground/30">{i + 1}</div>
                            <span className="text-[13px] font-bold tracking-tight text-foreground/80 flex-1">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'debug' && (
                    <div className="space-y-8">
                      <div className="p-8 bg-black/80 border border-white/5 rounded-2xl font-mono text-[13px] text-white/70 overflow-x-auto shadow-2xl">
                        <pre><code>{currentQuestion.content}</code></pre>
                      </div>
                      <textarea 
                        rows={6} 
                        disabled={isRevealed} 
                        className="w-full p-8 bg-muted/5 border-2 border-border/40 rounded-2xl focus:border-foreground focus:ring-0 text-[14px] font-medium tracking-tight placeholder:text-muted-foreground/20 resize-none leading-relaxed text-foreground/80 transition-all" 
                        placeholder="Diagnose the defect and propose a correction..."
                        value={userAnswers[currentQuestion.id] || ""} 
                        onChange={(e) => handleSelectAnswer(e.target.value)} 
                      />
                      {isRevealed && (
                        <div className="p-10 border-l-4 border-primary bg-primary/5 space-y-6 rounded-r-2xl animate-in slide-in-from-left-4 duration-700">
                          <div className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">System Solution</div>
                          <div className="text-[13px] font-medium tracking-tight text-foreground/70 leading-relaxed bg-black/40 p-6 rounded-xl whitespace-pre-wrap shadow-inner border border-white/5">{String(currentQuestion.answer || "No solution provided.")}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestion.type === 'true_false' && (
                    <div className="grid grid-cols-2 gap-6">
                      {['True', 'False'].map(v => { 
                        const isSelected = userAnswers[currentQuestion.id] === v; 
                        const isCorrect = isRevealed && v.toLowerCase() === String(currentQuestion.answer).toLowerCase(); 
                        return (
                          <button 
                            key={v} 
                            disabled={isRevealed} 
                            onClick={() => handleSelectAnswer(v)} 
                            className={cn(
                              "h-32 border-2 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] transition-all duration-300 shadow-sm", 
                              isCorrect ? "bg-primary text-primary-foreground border-primary shadow-primary/20" : isSelected && !isRevealed ? "border-foreground bg-foreground/5" : "border-border/40 text-muted-foreground/30 hover:border-foreground/20", 
                              isRevealed && !isCorrect ? "opacity-10 scale-[0.95]" : ""
                            )}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(currentQuestion.type === 'writing' || currentQuestion.type === 'synthesis') && (
                    <div className="space-y-12">
                      <textarea 
                        rows={8} 
                        disabled={isRevealed} 
                        className="w-full p-10 bg-muted/5 border-2 border-border/40 rounded-2xl focus:border-foreground focus:ring-0 text-[15px] font-medium tracking-tight placeholder:text-muted-foreground/20 resize-none leading-relaxed text-foreground/80 transition-all" 
                        placeholder="Formulate your response..." 
                        value={userAnswers[currentQuestion.id] || ""} 
                        onChange={(e) => handleSelectAnswer(e.target.value)} 
                      />
                      {isRevealed && (
                        <div className="p-10 border-l-4 border-primary bg-primary/5 space-y-6 animate-in slide-in-from-left-4 duration-1000 rounded-r-2xl">
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            <Filter size={14}/> Academic Model
                          </div>
                          <p className="text-[14px] font-medium leading-relaxed tracking-tight text-foreground/70">
                            {String(currentQuestion.answer || "No model solution provided.")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {isRevealed && currentQuestion.explanation && (
                    <div className="p-10 bg-muted/5 border border-border/50 rounded-2xl space-y-6 animate-in fade-in duration-1000">
                      <div className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.3em]">Pedagogical Insight</div>
                      <div className="text-[12px] font-medium tracking-tight leading-relaxed text-foreground/50 italic">{currentQuestion.explanation}</div>
                    </div>
                  )}
               </div>
             </div>
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur-3xl border-t border-border/50 p-8 shrink-0 z-30">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => { if (confirm("Terminate session?")) resetSession(); }} 
              className="h-12 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all rounded-lg"
            >
              Exit <X size={12} className="ml-3 opacity-30"/>
            </Button>
            
            <div className="flex items-center gap-6">
              {!isRevealed ? (
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!userAnswers[currentQuestion.id] && currentQuestion.type !== 'debug'} 
                  className="h-14 px-12 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.3em] rounded-xl shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.4)] hover:brightness-110 active:scale-[0.97] transition-all group"
                >
                  Analyze <Zap size={16} className="ml-3 group-hover:animate-pulse"/>
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  {!gradedAnswers[currentQuestion.id] && ['writing', 'synthesis'].includes(currentQuestion.type) && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: false})); nextQuestion(); }} 
                        variant="outline" 
                        className="h-14 px-8 border-border/40 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 text-[10px] font-black uppercase rounded-xl tracking-widest transition-all"
                      >
                        Inadequate
                      </Button>
                      <Button 
                        onClick={() => { setGradedAnswers(p => ({...p, [currentQuestion.id]: true})); nextQuestion(); }} 
                        className="h-14 px-10 bg-foreground text-background text-[10px] font-black uppercase rounded-xl tracking-[0.2em] hover:brightness-125 transition-all shadow-xl"
                      >
                        Sufficient
                      </Button>
                    </div>
                  )} 
                  {((!['writing', 'synthesis'].includes(currentQuestion.type)) || gradedAnswers[currentQuestion.id] === true) && (
                    <Button 
                      onClick={nextQuestion} 
                      className="h-14 px-14 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.3em] rounded-xl shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.4)] hover:brightness-110 active:scale-[0.97] transition-all group"
                    >
                      Advance <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform"/>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'results') {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground font-sans overflow-hidden animate-in fade-in duration-700 flex flex-col items-center justify-center p-10">
         <div className="max-w-md mx-auto w-full text-center space-y-8">
            <div className="space-y-1"><h1 className="text-6xl font-black tracking-tighter leading-none text-foreground">{calculateScore().score}<span className="text-xl text-muted-foreground/30 tracking-normal">%</span></h1><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Final Score</p></div>
            <div className="grid grid-cols-2 divide-x divide-border border-y border-border py-6"><div className="space-y-1"><div className="text-xl font-black tracking-tighter text-foreground">{calculateScore().correct}/{calculateScore().total}</div><div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Correct</div></div><div className="space-y-1"><div className="text-xl font-black tracking-tighter text-foreground">{calculateScore().total}</div><div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Questions</div></div></div>
            <div className="flex gap-4"><Button onClick={() => setView('configuring')} className="flex-1 h-12 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md">Restart</Button><Button variant="outline" onClick={() => setView('dashboard')} className="flex-1 h-12 border-border text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest rounded-md border-dashed hover:text-foreground">Done</Button></div>
         </div>
      </div>
    );
  }

  return null;
}
