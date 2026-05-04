/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useState, useEffect, useRef} from 'react'
import {sidecarApi} from '@/lib/sidecarApi'
import {
 BrainCircuit,
 Layers,
 Zap,
 ArrowRight,
 Trash2,
 ChevronRight,
 Clock,
 Check,
 Loader2,
 Info,
 X,
 TrendingUp,
 BarChart3,
 Plus
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
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Label} from '@/components/ui/label'
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import {Slider} from "@/components/ui/slider"
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
import {toast} from 'sonner'
import {cn} from '@/lib/utils'

import {AdvancedPracticeConfig, Question} from '@/types/practice'
import { MarkdownBlock } from '@/components/MiniPracticeUI'

interface Hub {
 id: string
 title: string
 course?: string
 unit?: string
 path: string
}

const cleanTitle = (val: any): string => {
  if (val === undefined || val === null) return ''
  return String(val).replace(/\[\[(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim()
}

const DEFAULT_CONFIG: AdvancedPracticeConfig = {
 hubId: '',
 selectedAtomicNotes: [],
 questionDistribution: {
 mcq: 4,
 true_false: 3,
 writing: 1,
 fill_in: 2,
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

export function PracticeModule({noAnimation = false}: {noAnimation?: boolean}) {
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
 const [genStatus, setGenStatus] = useState<string>('Initializing...')
 const [availableNotes, setAvailableNotes] = useState<any[]>([])
 const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
 const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
 const timerRef = useRef<NodeJS.Timeout | null>(null)

 useEffect(() => {loadHubs(); loadPastPractices();}, [])

 useEffect(() => {
 const searchParams = new URLSearchParams(window.location.search);
 const hubId = searchParams.get('hubId');
 if (hubId && hubs.length > 0) {
 const hub = hubs.find(h => h.id === hubId || h.path.includes(hubId));
 if (hub) setSelectedHub(hub.id);
}
}, [hubs]);

 useEffect(() => {if (selectedHub) loadHubNotes(selectedHub);}, [selectedHub])
 
 const loadHubNotes = async (hubId: string) => {
 if (!hubId) return;
 try {
 const res = await sidecarApi.listHubNotes(hubId); 
 const notes = Array.isArray(res?.notes) ? res.notes : [];
 setAvailableNotes(notes);
 setAdvancedConfig(prev => ({
 ...prev,
 selectedAtomicNotes: notes.map((n: any) => n.id)
}))
} catch (err) {
 console.error("Error loading notes:", err); 
 setAvailableNotes([]);
} 
}

 useEffect(() => {
 let interval: any;
 if (view === 'loading') {
 interval = setInterval(async () => {
 try {
 const res = await sidecarApi.getPracticeStatus();
 // Find the latest status. Since we don't have the session_id yet, we just take the most recent one.
 const statuses = Object.values(res.status);
 if (statuses.length > 0) {
 setGenStatus(statuses[statuses.length - 1]);
}
} catch (e) {
 console.error("Status polling failed", e);
}
}, 2000);
}
 return () => clearInterval(interval);
}, [view]);

 useEffect(() => {
 if (questions.length > 0 && view === 'session') {
 timerRef.current = setInterval(() => {
 // Handle Global Timer
 if (globalTimeLeft !== null) {
 if (globalTimeLeft <= 1) {
 clearInterval(timerRef.current!);
 setGlobalTimeLeft(0);
 toast.error("Total session time expired!");
 setView('results');
 return;
}
 setGlobalTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0));
}

 // Handle Per-Question Timer
 if (questionTimeLeft !== null) {
 if (questionTimeLeft <= 1) {
 setQuestionTimeLeft(0);
 // Automatic "Wrong" mark and next question
 if (!isRevealed) {
 handleSubmitAnswer(); // Reveal the answer first
 toast.warning("Question time expired! Marked as incorrect.");
 setGradedAnswers(prev => ({...prev, [currentQuestion.id]: false}));
 // Add a small delay before moving to next so the user sees it's wrong
 setTimeout(() => {
 nextQuestion();
}, 1500);
}
} else {
 setQuestionTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0));
}
}
}, 1000);
}
 return () => {if (timerRef.current) clearInterval(timerRef.current!)}
}, [questions, view, globalTimeLeft, questionTimeLeft, isRevealed])

 const loadPastPractices = async () => {try {const res = await sidecarApi.listPractices(); setPastPractices(res.practices);} catch {console.error("Error");}}
 const loadHubs = async () => {try {const res = await sidecarApi.listHubs(); setHubs(res.hubs); if (res.hubs.length > 0) setSelectedHub(res.hubs[0].id);} catch {console.error("Error");}}

 const handleStartSession = async () => {
 if (!selectedHub) {toast.error('Choose a topic.'); return;}
 if (advancedConfig.selectedAtomicNotes.length === 0) {toast.error('Select notes.'); return;}
 
 setIsLoading(true);
 setView('loading');
 try {
 const cleanDistribution = Object.fromEntries(
 Object.entries(advancedConfig.questionDistribution).filter(([k]) => 
 ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace'].includes(k)
 )
 );

 const res = await sidecarApi.generatePractice(selectedHub, {
 ...advancedConfig, 
 hubId: selectedHub,
 questionDistribution: cleanDistribution 
});
 
 if (!res.questions || res.questions.length === 0) {
 toast.error('No content found.');
 setView('configuring');
 return;
}
 
 setTimeout(() => {
 setQuestions(res.questions); 
 setCurrentPracticePath(res.quiz_path); 
 setCurrentQuestionIdx(0); 
 setUserAnswers({}); 
 setIsRevealed(false); 
 setGradedAnswers({}); 
 setView('session');
 if (advancedConfig.globalTimeLimitMinutes) setGlobalTimeLeft(advancedConfig.globalTimeLimitMinutes * 60);
 if (advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds);
}, 1000);
} catch (err) {
 toast.error('Error starting.'); 
 setView('configuring');
} finally {setIsLoading(false);}
}

 const handleResumePractice = async (path: string) => {
 setIsLoading(true);
 setView('loading');
 try {
 const res = await sidecarApi.getPractice(path);
 if (!res.questions || res.questions.length === 0) {
 toast.error('No questions.');
 setView('history');
 return;
}
 setTimeout(() => {
 setQuestions(res.questions); 
 setCurrentPracticePath(path); 
 setCurrentQuestionIdx(0); 
 setUserAnswers({}); 
 setIsRevealed(false); 
 setGradedAnswers({}); 
 setView('session');
}, 500);
} catch {
 toast.error('Error loading.'); 
 setView('history');
} finally {setIsLoading(false);}
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
 } else if (q.type === 'mcq') {
  // Match only by key letter to avoid false positives from similar option text
  isCorrect = userVal.trim().toUpperCase() === String(q.answer || '').trim().toUpperCase();
 } else if (q.type === 'debug') {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  isCorrect = norm(userVal) === norm(correctVal);
 } else {
  isCorrect = userVal.toLowerCase() === correctVal.toLowerCase();
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

 const isSelfGraded = ['writing', 'synthesis', 'debug', 'trace'].includes(q.type);
 if (!isSelfGraded) {
  setGradedAnswers(prev => ({...prev, [q.id]: isCorrect}));
 }
}

 const nextQuestion = async () => {
 if (currentQuestionIdx < questions.length - 1) {
 setCurrentQuestionIdx(prev => prev + 1); 
 setIsRevealed(false); 
 setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds || null);
} else {
 setView('results'); 
 const {score} = calculateScore(); 
 if (currentPracticePath) await sidecarApi.updatePracticeScore(currentPracticePath, score); 
 loadPastPractices(); 
}
}

 const calculateScore = () => {
  const selfGradedTypes = ['writing', 'synthesis', 'debug', 'trace'];
  let correct = 0;
  const total = questions.length;
  questions.forEach(q => {
   const isSG = selfGradedTypes.includes(q.type);
   if (isSG) {
    // Self-graded: only counted correct if user explicitly marked it correct
    if (gradedAnswers[q.id] === true) correct++;
   } else {
    // Objective: graded[q.id] is true/false; undefined = unanswered = wrong
    if (gradedAnswers[q.id] === true) correct++;
   }
  });
  return {score: Math.round((correct / (total || 1)) * 100), correct, total};
 }

 const resetSession = () => {setQuestions([]); setView('dashboard');}
 const handleSelectAnswer = (val: any) => {if (!isRevealed) setUserAnswers(prev => ({...prev, [questions[currentQuestionIdx].id]: val}));}
 const handleDeletePractice = async (path: string) => {await sidecarApi.deletePractice(path); loadPastPractices();}

 const toggleAtomicNote = (noteId: string) => {
 setAdvancedConfig(prev => ({
 ...prev,
 selectedAtomicNotes: prev.selectedAtomicNotes.includes(noteId)
 ? prev.selectedAtomicNotes.filter(n => n !== noteId)
 : [...prev.selectedAtomicNotes, noteId]
}))
}

 const updateDistribution = (type: keyof AdvancedPracticeConfig['questionDistribution'], val: number) => {
 setAdvancedConfig(prev => ({...prev, questionDistribution: {...prev.questionDistribution, [type]: val}}))
}

 // ──────────────────────────────────────────────────────────────────────────
 // DASHBOARD RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'dashboard') {
 const safePractices = Array.isArray(pastPractices) ? pastPractices : [];
 const validPractices = safePractices.filter(p => p?.completed && p?.score !== undefined);
 const totalPrecision = validPractices.length ? Math.round(validPractices.reduce((acc, p) => acc + parseInt(p.score || 0), 0) / validPractices.length) : 0;
 const lastScores = validPractices.slice(-5).map(p => parseInt(p.score));
 let stability = "New";
 if (lastScores.length >= 3) {
 const avg = lastScores.reduce((a, b) => a + b, 0) / lastScores.length;
 const variance = lastScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lastScores.length;
 stability = variance < 50 ? "Stable" : "Active";
}

 return (
 <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground overflow-y-auto custom-scrollbar p-10 space-y-8">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex bg-muted/10 p-1 rounded-lg border border-border/10 w-full sm:w-auto">
 <button onClick={() => setView('dashboard')} className={cn("flex-1 sm:flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all", true ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground")}>Dashboard</button>
 <button onClick={() => setView('history')} className={cn("flex-1 sm:flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all", false ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground")}>History</button>
 </div>
 <Button onClick={() => setView('configuring')} className="h-9 w-full sm:w-auto px-6 bg-primary text-primary-foreground rounded-md font-black uppercase tracking-widest text-[9px]">Start</Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="p-6 bg-muted/10 border border-border/10 rounded-lg flex flex-col gap-1">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Average Score</span>
 <span className="text-2xl font-black tracking-tight">{totalPrecision}%</span>
 </div>
 <div className="p-6 bg-muted/10 border border-border/10 rounded-lg flex flex-col gap-1">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Total Practices</span>
 <span className="text-2xl font-black tracking-tight">{pastPractices.length}</span>
 </div>
 <div className="p-6 bg-muted/10 border border-border/10 rounded-lg flex flex-col gap-1">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Stability</span>
 <span className="text-2xl font-black tracking-tight uppercase text-primary">{stability}</span>
 </div>
 </div>

 <div className="flex flex-col gap-8">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="p-8 bg-muted/10 border border-border/10 rounded-2xl space-y-6 shadow-xl shadow-primary/5">
 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Trend</h3>
 <div className="w-full h-64">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={validPractices.slice(-10).map((p, i) => ({name: i + 1, score: parseInt(p.score) || 0}))}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.1)" />
 <XAxis dataKey="name" hide />
 <YAxis domain={[0, 100]} hide />
 <Tooltip contentStyle={{backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '10px'}} />
 <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r: 2, fill: 'hsl(var(--background))'}} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="p-8 bg-muted/10 border border-border/10 rounded-2xl space-y-8 shadow-xl shadow-primary/5">
 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Cognitive Modalities</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
 {[
 {type: 'Choice (MCQ/TF)', p: 88},
 {type: 'Synthesis & Analysis', p: 72},
 {type: 'Logic & State Trace', p: 41},
 {type: 'Sequence & Order', p: 65},
 {type: 'Debug & Extraction', p: 29},
 {type: 'Relational Matching', p: 47},
 {type: 'Technical Fill-in', p: 54},
 {type: 'Edge Case Mastery', p: 19},
 {type: 'Industrial Application', p: 33}
 ].map((stat, i) => (
 <div key={i} className="space-y-3">
 <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em]">
 <span className="text-muted-foreground/40">{stat.type}</span>
 <span className="text-foreground/90">{stat.p}%</span>
 </div>
 <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
 <div className="h-full bg-primary/60" style={{width: `${stat.p}%`}}></div>
 </div>
 </div>
 ))}
 </div>
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
 <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground overflow-y-auto custom-scrollbar p-10 space-y-8">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex bg-muted/10 p-1 rounded-lg border border-border/10 w-full sm:w-auto">
 <button onClick={() => setView('dashboard')} className={cn("flex-1 sm:flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all", false ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground")}>Dashboard</button>
 <button onClick={() => setView('history')} className={cn("flex-1 sm:flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all", true ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground")}>History</button>
 </div>
 <Button onClick={() => setView('configuring')} className="h-9 w-full sm:w-auto px-6 bg-primary text-primary-foreground rounded-md font-black uppercase tracking-widest text-[9px]">Start</Button>
 </div>

 <div className="space-y-4">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/10 pb-2">Past Sessions</h3>
 <div className="grid grid-cols-1 gap-2">
 {(Array.isArray(pastPractices) ? pastPractices : []).slice().reverse().map((p, i) => (
 <div key={i} onClick={() => handleResumePractice(p.path)} className="group p-4 bg-muted/5 border border-border/10 rounded-lg hover:border-foreground/20 cursor-pointer transition-all flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="text-[10px] font-black text-muted-foreground/40">{p.score}%</div>
 <div className="flex flex-col">
 <span className="text-xs font-black uppercase tracking-tight">{cleanTitle(p.hub_title || 'Untitled')}</span>
 <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{new Date(p.date).toLocaleDateString()}</span>
 </div>
 </div>
 <button onClick={(e) => {e.stopPropagation(); handleDeletePractice(p.path);}} className="p-1.5 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

 // ──────────────────────────────────────────────────────────────────────────
 // CONFIGURATION RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'configuring') {
 const totalQuestions = Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0)
 return (
 <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground overflow-y-auto custom-scrollbar p-10 space-y-12">
 <div className="flex items-center justify-between">
 <button onClick={() => setView('dashboard')} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border/10 rounded-md">Cancel</button>
 <div className="text-xl font-black tracking-tight">{totalQuestions} Questions</div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <div className="p-8 bg-muted/10 border border-border/10 rounded-lg space-y-10">
 <div className="space-y-6">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Topic</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Hub</Label>
 <Select value={selectedHub} onValueChange={(val) => {setSelectedHub(val); loadHubNotes(val);}}>
 <SelectTrigger className="w-full h-10 bg-background border-border/10 rounded-md px-4 text-[10px] font-black uppercase tracking-tight"><SelectValue placeholder="Select Topic..." /></SelectTrigger>
 <SelectContent className="border-border/10">{hubs.map(hub => (<SelectItem key={hub.id} value={hub.id} className="text-[10px] font-black uppercase tracking-tight">{cleanTitle(hub.title)}</SelectItem>))}</SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Difficulty</Label>
 <RadioGroup value={advancedConfig.difficulty} onValueChange={(val) => setAdvancedConfig(prev => ({...prev, difficulty: val as any}))} className="grid grid-cols-4 gap-1">
 {[ {val: 'L1', label: '1'}, {val: 'L2', label: '2'}, {val: 'L3', label: '3'}, {val: 'Mixed', label: 'M'} ].map((level) => (
 <div key={level.val}><RadioGroupItem value={level.val} id={level.val} className="peer sr-only" /><Label htmlFor={level.val} className="flex h-10 border border-border/10 rounded-md bg-background peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground items-center justify-center cursor-pointer text-[10px] font-black">{level.label}</Label></div>
 ))}
 </RadioGroup>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Notes</h3>
 <Popover>
 <PopoverTrigger asChild>
 <Button variant="outline" className="w-full h-10 border-border/10 bg-background text-[10px] font-black uppercase px-4 justify-between">
 <span>{advancedConfig.selectedAtomicNotes.length} Selected</span>
 <Layers size={12} className="opacity-40" />
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-[90vw] sm:w-[400px] p-0 rounded-md border border-border bg-popover shadow-xl overflow-hidden" align="start">
 <Command className="bg-transparent">
 <div className="p-3 border-b border-border flex justify-between items-center bg-muted/10">
 <span className="text-[8px] font-black uppercase text-muted-foreground/40">{availableNotes.length} Total</span>
 <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase" onClick={() => {if (advancedConfig.selectedAtomicNotes.length === availableNotes.length) {setAdvancedConfig(prev => ({...prev, selectedAtomicNotes: []}))} else {setAdvancedConfig(prev => ({...prev, selectedAtomicNotes: availableNotes.map(n => n.id)}))}}}>Toggle All</Button>
 </div>
 <CommandInput placeholder="Search..." className="h-10 text-[10px] font-black uppercase border-none" />
 <CommandList className="max-h-60 p-1">
 {availableNotes.map(note => {
 const isSelected = advancedConfig.selectedAtomicNotes.includes(note.id); 
 return (
 <CommandItem key={note.id} onSelect={() => toggleAtomicNote(note.id)} className="flex items-center gap-2 cursor-pointer py-2 px-3 rounded-md text-[9px] font-black uppercase">
 <div className={cn("w-3 h-3 border flex items-center justify-center rounded-sm", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border")}>{isSelected && <Check size={8} />}</div>
 <span className="truncate">{note.title}</span>
 </CommandItem>
 ); 
})}
 </CommandList>
 </Command>
 </PopoverContent>
 </Popover>
 </div>

 <div className="space-y-6">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Time</h3>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total (Min)</Label>
 <Select value={String(advancedConfig.globalTimeLimitMinutes || "null")} onValueChange={(val) => setAdvancedConfig(prev => ({...prev, globalTimeLimitMinutes: val === "null" ? null : parseInt(val)}))}>
 <SelectTrigger className="w-full h-10 bg-background border-border/10 rounded-md px-4 text-[10px] font-black uppercase"><SelectValue placeholder="No Limit" /></SelectTrigger>
 <SelectContent>{[null, 5, 10, 15, 30, 60].map(m => (<SelectItem key={String(m)} value={String(m)} className="text-[10px] font-black uppercase">{m ? `${m}m` : 'None'}</SelectItem>))}</SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Per Question (Sec)</Label>
 <Select value={String(advancedConfig.perQuestionTimeLimitSeconds || "null")} onValueChange={(val) => setAdvancedConfig(prev => ({...prev, perQuestionTimeLimitSeconds: val === "null" ? null : parseInt(val)}))}>
 <SelectTrigger className="w-full h-10 bg-background border-border/10 rounded-md px-4 text-[10px] font-black uppercase"><SelectValue placeholder="No Limit" /></SelectTrigger>
 <SelectContent>{[null, 15, 30, 60, 120].map(s => (<SelectItem key={String(s)} value={String(s)} className="text-[10px] font-black uppercase">{s ? `${s}s` : 'None'}</SelectItem>))}</SelectContent>
 </Select>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-8 bg-muted/10 border border-border/10 rounded-lg space-y-8 flex flex-col">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 border-b border-border/5 pb-4">Types</h3>
 <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
 {[
 {key: 'mcq', label: 'Choice'}, 
 {key: 'true_false', label: 'T/F'}, 
 {key: 'writing', label: 'Write'}, 
 {key: 'fill_in', label: 'Fill'},
 {key: 'debug', label: 'Debug'},
 {key: 'trace', label: 'Trace'},
 {key: 'order', label: 'Order'},
 {key: 'matching', label: 'Match'},
 {key: 'synthesis', label: 'Synth'}
 ].map(type => (
 <div key={type.key} className="space-y-3">
 <div className="flex justify-between items-center">
 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{type.label}</Label>
 <span className="text-[10px] font-black tabular-nums">{advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]}</span>
 </div>
 <Slider value={[advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]]} max={15} step={1} onValueChange={(vals) => updateDistribution(type.key as any, vals[0])} className="py-1" />
 </div>
 ))}
 </div>
 <Button onClick={handleStartSession} disabled={isLoading} className="h-12 w-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md mt-6 shadow-sm">Start Session</Button>
 </div>
 </div>
 </div>
 );
}

 // ──────────────────────────────────────────────────────────────────────────
 // LOADING RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'loading') {
 return (
 <div className="h-full flex-1 flex flex-col items-center justify-center bg-background text-foreground">
 <div className="flex flex-col items-center gap-6 animate-pulse">
 <Loader2 size={32} className="text-primary animate-spin" />
 <div className="flex flex-col items-center gap-2">
 <span className="text-[10px] font-black uppercase tracking-widest text-primary">{genStatus}</span>
 <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Rate-Limit Protection Active</span>
 </div>
 </div>
 </div>
 )
}

 // ──────────────────────────────────────────────────────────────────────────
 // SESSION RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'session' && currentQuestion) {
 const progress = ((currentQuestionIdx + 1) / questions.length) * 100;
 return (
 <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden">
 <div className="px-6 sm:px-10 py-4 sm:py-6 border-b border-border/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 w-full sm:w-auto">
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Practice</span>
 <div className="text-xs font-black uppercase tracking-tight truncate max-w-[200px]">{cleanTitle(hubs.find(h => h.id === selectedHub)?.title || '')}</div>
 </div>
 <div className="flex-1 sm:w-64 h-1 bg-muted/20 rounded-full overflow-hidden">
 <div className="h-full bg-primary transition-all " style={{width: `${progress}%`}} />
 </div>
 </div>
 <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-10 text-[9px] font-black uppercase tracking-widest">
 {globalTimeLeft !== null && (
 <div className="flex flex-col items-end gap-1">
 <span className="text-muted-foreground/20 text-[7px]">Total</span>
 <div className={cn("px-3 py-1 rounded border", globalTimeLeft < 60 ? "border-destructive text-destructive animate-pulse" : "border-border/10 text-muted-foreground/60")}>
 {Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}
 </div>
 </div>
 )}
 {questionTimeLeft !== null && (
 <div className="flex flex-col items-end gap-1">
 <span className="text-muted-foreground/20 text-[7px]">Q-Time</span>
 <div className={cn("px-3 py-1 rounded border", questionTimeLeft < 10 ? "border-destructive text-destructive animate-pulse" : "border-border/10 text-primary")}>
 {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
 </div>
 </div>
 )}
 <div className="flex flex-col items-end gap-1">
 <span className="text-muted-foreground/20 text-[7px]">Progress</span>
 <div className="px-3 py-1 rounded border border-border/10">{currentQuestionIdx + 1} / {questions.length}</div>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-16 px-10">
 <div className="max-w-3xl w-full space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
 <div className="space-y-8">
 <div className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-3">
 <Badge variant="outline" className="text-[8px] border-primary/20 bg-primary/5 text-primary rounded-md px-2 py-0">{currentQuestion.difficulty || '1'}</Badge>
 <div className="w-1 h-1 rounded-full bg-primary/20" />
 <span>{(currentQuestion.type || '').replace('_', ' ')}</span>
 </div>
 <div className="text-3xl font-black tracking-tight leading-tight text-foreground/90"><MarkdownBlock content={currentQuestion.question} /></div>
 </div>

 <div className="space-y-10">
 {currentQuestion.type === 'mcq' && (
 <div className="grid grid-cols-1 gap-2">
 {Object.entries(currentQuestion.options!).map(([key, val]) => {
 const isSelected = userAnswers[currentQuestion.id] === key; 
 const isCorrect = isRevealed && (key === currentQuestion.answer || String(val).toLowerCase() === String(currentQuestion.answer).toLowerCase());
 return (
 <button key={key} disabled={isRevealed} onClick={() => handleSelectAnswer(key)} className={cn("p-5 border rounded-md text-left transition-all text-[13px] font-black uppercase tracking-tight", isCorrect ? "bg-primary/10 border-primary text-primary" : isRevealed ? "border-border/10 opacity-40 grayscale" : isSelected ? "bg-muted/30 border-foreground" : "border-border/10 hover:bg-muted/10")}>
 <span className="text-muted-foreground/20 shrink-0 mt-0.5 mr-4">{key}</span> <div className="flex-1 overflow-x-auto"><MarkdownBlock content={String(val)} /></div>
 </button>
 );
})}
 </div>
 )}

 {(currentQuestion.type === 'writing' || currentQuestion.type === 'synthesis' || currentQuestion.type === 'debug' || currentQuestion.type === 'trace') && (
  <div className="space-y-8">
  {currentQuestion.type === 'debug' && <div className="p-1 border border-border/10 rounded-xl bg-muted/5"><MarkdownBlock content={`\`\`\`${(currentQuestion as any).language || 'text'}\n${currentQuestion.content}\n\`\`\``} /></div>}
  <textarea rows={8} disabled={isRevealed} className="w-full p-8 bg-muted/5 border-2 border-border/10 rounded-2xl text-base font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all placeholder:opacity-20" placeholder="Synthesize your technical analysis here..." value={userAnswers[currentQuestion.id] || ""} onChange={(e) => handleSelectAnswer(e.target.value)} />
  {isRevealed && (
    <div className="p-8 border-2 border-primary/20 bg-primary/5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-primary/5">
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Mastery Solution</div>
      <div className="text-sm font-bold leading-relaxed text-foreground/90 whitespace-pre-wrap"><MarkdownBlock content={String(currentQuestion.answer)} /></div>
    </div>
  )}
  </div>
  )}

 {currentQuestion.type === 'true_false' && (
 <div className="grid grid-cols-2 gap-4">
 {['True', 'False'].map(v => {
 const isSelected = userAnswers[currentQuestion.id] === v; 
 const isCorrect = isRevealed && v.toLowerCase() === String(currentQuestion.answer).toLowerCase(); 
 return (
 <button key={v} disabled={isRevealed} onClick={() => handleSelectAnswer(v)} className={cn("h-32 border rounded-md text-[10px] font-black uppercase tracking-widest transition-all", isCorrect ? "bg-primary/10 border-primary text-primary" : isRevealed ? "border-border/10 opacity-40 grayscale text-muted-foreground/40" : isSelected ? "bg-muted/30 border-foreground" : "border-border/10 hover:bg-muted/10 text-muted-foreground/40")}>{v}</button>
 );
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
         <div key={i} className={cn(
             "flex items-center gap-6 p-5 border rounded-2xl transition-all",
             isCorrect ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : isWrong ? "border-destructive/20 bg-destructive/5" : "border-border/10 bg-muted/5 hover:border-foreground/20"
         )}>
             <div className="flex flex-col gap-2 border-r border-border/10 pr-6">
                 <button disabled={isRevealed || i===0} onClick={moveUp} className="text-xs p-1 opacity-20 hover:opacity-100 hover:text-primary transition-all disabled:opacity-0">▲</button>
                 <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-xs p-1 opacity-20 hover:opacity-100 hover:text-primary transition-all disabled:opacity-0">▼</button>
             </div>
             <div className="text-base font-bold tracking-tight text-foreground/80 pl-2">{step}</div>
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
         <div key={i} className={cn(
             "flex items-center gap-8 p-6 border rounded-2xl transition-all",
             isCorrect ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : isWrong ? "border-destructive/20 bg-destructive/5" : "border-border/10 bg-muted/5 hover:border-foreground/20"
         )}>
             <div className="flex-1 font-black uppercase tracking-[0.2em] text-[11px] text-muted-foreground/60">{pair.left}</div>
             <div className="flex-1">
                 <select disabled={isRevealed} value={selected} onChange={(e) => handleSelectAnswer({...userAnswers[currentQuestion.id], [pair.left]: e.target.value})} className="w-full p-4 bg-background border border-border/10 rounded-xl outline-none focus:border-primary/50 text-[11px] font-black uppercase tracking-widest transition-all appearance-none cursor-pointer hover:border-border/40">
                     <option value="">Select match...</option>
                     {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                 </select>
             </div>
             {isRevealed && isWrong && (
                <div className="flex-1 animate-in slide-in-from-right-4 duration-500">
                    <div className="text-[8px] font-black uppercase text-primary/40 mb-1">Correct Match</div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">{pair.right}</div>
                </div>
             )}
         </div>
     )
  })}
  </div>
  )}

 {currentQuestion.type === 'fill_in' && (
 <div className="p-8 bg-muted/5 border border-border/10 rounded-lg text-lg font-medium leading-relaxed flex flex-wrap items-center gap-y-4">
 {(() => {
 const parts = (currentQuestion.textWithBlanks || '').split(/\[\[.*?\]\]/);
 return parts.map((part: string, i: number) => (
 <React.Fragment key={i}>
 <div className="inline-block align-middle"><MarkdownBlock content={part} /></div>
 {i < parts.length - 1 && (
 <input type="text" disabled={isRevealed} value={(userAnswers[currentQuestion.id] || [])[i] || ''} onChange={(e) => {const newAns = [...(userAnswers[currentQuestion.id] || [])]; newAns[i] = e.target.value; handleSelectAnswer(newAns);}} className={cn("mx-2 border-b-2 bg-transparent outline-none w-32 text-center text-sm font-black uppercase shrink-0 self-center", isRevealed ? (String((userAnswers[currentQuestion.id] || [])[i] || '').toLowerCase() === String((currentQuestion.answer || [])[i] || '').toLowerCase() ? "border-primary text-primary" : "border-destructive text-destructive") : "border-muted/30 focus:border-primary")} />
 )}
 </React.Fragment>
 ));
})()}
 </div>
 )}

  {isRevealed && currentQuestion.explanation && (
    <div className="p-8 border border-border/10 rounded-2xl bg-muted/5 text-sm font-medium text-muted-foreground/80 italic leading-relaxed animate-in fade-in duration-1000">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mb-4 not-italic">Mechanism Insight</div>
        <MarkdownBlock content={currentQuestion.explanation} />
    </div>
  )}
 </div>
 </div>
 </div>

 <div className="p-6 sm:p-10 border-t border-border/10 bg-background/80 backdrop-blur-md">
 <div className="max-w-2xl mx-auto flex items-center justify-between">
 <Button variant="ghost" onClick={resetSession} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Exit</Button>
 <div className="flex items-center gap-4">
 {!isRevealed ? (
 <Button onClick={handleSubmitAnswer} disabled={!userAnswers[currentQuestion.id] && currentQuestion.type !== 'debug'} className="h-10 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md">Check</Button>
 ) : (
 <div className="flex gap-2">
 {gradedAnswers[currentQuestion.id] === undefined && ['writing', 'synthesis', 'debug', 'trace'].includes(currentQuestion.type) && (
 <>
 <Button onClick={() => {setGradedAnswers(p => ({...p, [currentQuestion.id]: false})); nextQuestion();}} variant="outline" className="h-10 px-6 text-[9px] font-black uppercase border-destructive/20 text-destructive/40">Wrong</Button>
 <Button onClick={() => {setGradedAnswers(p => ({...p, [currentQuestion.id]: true})); nextQuestion();}} className="h-10 px-6 bg-primary text-primary-foreground text-[9px] font-black uppercase">Correct</Button>
 </>
 )} 
 {((!['writing', 'synthesis', 'debug', 'trace'].includes(currentQuestion.type)) || gradedAnswers[currentQuestion.id] !== undefined) && (
 <Button onClick={nextQuestion} className="h-10 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md">Next</Button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}

 // ──────────────────────────────────────────────────────────────────────────
 // RESULTS RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'results') {
 const {score, correct, total} = calculateScore();
 return (
 <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground items-center justify-center p-10 space-y-12">
 <div className="text-center space-y-2">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Finished</span>
 <h1 className="text-6xl sm:text-8xl font-black tracking-tighter">{score}%</h1>
 </div>
 <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 text-center border-y border-border/10 py-8 px-6 sm:px-12 w-full sm:w-auto items-center justify-center">
 <div className="space-y-1"><div className="text-2xl font-black tracking-tight">{correct}/{total}</div><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Correct</div></div>
 <div className="space-y-1 hidden sm:block h-8 w-px bg-border/10"></div>
 <div className="space-y-1"><div className="text-2xl font-black tracking-tight">{total}</div><div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total</div></div>
 </div>
 <div className="flex gap-4">
 <Button onClick={() => setView('configuring')} className="h-12 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md">Again</Button>
 <Button variant="outline" onClick={() => setView('dashboard')} className="h-12 px-10 border-border/10 text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest rounded-md">Done</Button>
 </div>
 </div>
 );
}

 return (
 <div className="h-full w-full flex items-center justify-center bg-background text-muted-foreground">
 <Button onClick={() => setView('dashboard')} variant="outline">Reset</Button>
 </div>
 );
}

export default PracticeModule;
