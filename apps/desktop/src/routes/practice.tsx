import { useState, useEffect, useRef, useMemo } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { 
  GraduationCap, 
  Settings2, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  BrainCircuit,
  Target,
  Layers,
  Zap,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Clock,
  HelpCircle,
  AlertTriangle,
  Flame,
  Lightbulb,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar
} from 'recharts'
import { ActivityCalendar } from 'react-activity-calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Editor from "@monaco-editor/react"
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { AdvancedPracticeConfig, Question } from '@/types/practice'
import { AdvancedPanel } from '@/components/practice/AdvancedPanel'

interface Hub {
  id: string
  title: string
  course?: string
  unit?: string
  semester?: string
  path: string
}

const DEFAULT_CONFIG: AdvancedPracticeConfig = {
  hubId: '',
  selectedAtomicNotes: [],
  exclusionKeywords: [],
  questionDistribution: {
    multipleChoice: 5,
    trueFalse: 0,
    shortAnswer: 0,
    scenario: 0,
    codeImplementation: 0,
    clozeDeletion: 0,
    findTheError: 0,
    matchingMatrix: 0
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
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({})
  const [isRevealed, setIsRevealed] = useState(false)
  const [gradedAnswers, setGradedAnswers] = useState<Record<number, boolean>>({})
  const [confidenceWagers, setConfidenceWagers] = useState<Record<number, number>>({})
  const [wagerRevealed, setWagerRevealed] = useState(false)
  const [hintLevel, setHintLevel] = useState<Record<number, number>>({})

  const [showResults, setShowResults] = useState(false)
  const [pastPractices, setPastPractices] = useState<any[]>([])
  const [currentPracticePath, setCurrentPracticePath] = useState<string | null>(null)
  const [availableNotes, setAvailableNotes] = useState<any[]>([])
  const logsRef = useRef<HTMLDivElement>(null)

  // Timers
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const calendarData = useMemo(() => {
    const data = Object.entries(
      pastPractices.reduce((acc, p) => {
        if (!p.date) return acc
        try {
          const d = new Date(p.date).toISOString().split('T')[0]
          acc[d] = (acc[d] || 0) + 1
        } catch (e) {
          // Ignore invalid dates
        }
        return acc
      }, {} as Record<string, number>)
    ).map(([date, countObj]) => {
      const count = Number(countObj)
      return {
        date,
        count,
        level: Math.min(count, 4) as 0 | 1 | 2 | 3 | 4
      }
    })

    if (data.length === 0) {
      return [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 as 0 }]
    }
    return data
  }, [pastPractices])

  useEffect(() => {
    loadHubs()
    loadPastPractices()
  }, [])

  useEffect(() => {
    if (selectedHub) {
      setAdvancedConfig(prev => ({ ...prev, hubId: selectedHub, selectedAtomicNotes: [] }))
      loadHubNotes(selectedHub)
    }
  }, [selectedHub])

  const loadHubNotes = async (hubId: string) => {
    try {
      const res = await sidecarApi.listHubNotes(hubId)
      setAvailableNotes(res.notes)
    } catch (err) {
      console.error('Failed to load hub notes:', err)
    }
  }

  // Timer logic
  useEffect(() => {
    if (questions.length > 0 && !showResults) {
      timerRef.current = setInterval(() => {
        if (globalTimeLeft !== null) {
          setGlobalTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
        }
        if (questionTimeLeft !== null) {
          setQuestionTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0))
        }
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current!)
    }
  }, [questions, showResults, globalTimeLeft, questionTimeLeft])

  // Auto-reveal on question timer end
  useEffect(() => {
    if (questionTimeLeft === 0 && !isRevealed && !showResults) {
      handleSubmitAnswer()
    }
  }, [questionTimeLeft])

  // Session completion on global timer end
  useEffect(() => {
    if (globalTimeLeft === 0 && !showResults) {
      toast.error("Global time limit reached. Finishing session.")
      setShowResults(true)
    }
  }, [globalTimeLeft])

  const loadPastPractices = async () => {
    try {
      const res = await sidecarApi.listPractices()
      setPastPractices(res.practices)
    } catch (err) {
      console.error('Failed to load past practices:', err)
    }
  }

  const loadHubs = async () => {
    try {
      const res = await sidecarApi.listHubs()
      setHubs(res.hubs)
      if (res.hubs.length > 0) {
        setSelectedHub(res.hubs[0].id)
      }
    } catch (err) {
      console.error('Failed to load hubs:', err)
      toast.error('Failed to load available units.')
    }
  }

  const handleStartSession = async () => {
    if (!selectedHub) {
      toast.error('Please select a unit to practice.')
      return
    }

    setIsLoading(true)
    try {
      const res = await sidecarApi.generatePractice(selectedHub, advancedConfig)
      setQuestions(res.questions)
      setCurrentPracticePath(res.quiz_path)
      setCurrentQuestionIdx(0)
      setUserAnswers({})
      setIsRevealed(false)
      setGradedAnswers({})
      setConfidenceWagers({})
      setWagerRevealed(false)
      setHintLevel({})
      setIsConfiguring(false)
      setShowDashboard(false)

      // Initialize Timers
      if (advancedConfig.globalTimeLimitMinutes) {
        setGlobalTimeLeft(advancedConfig.globalTimeLimitMinutes * 60)
      } else {
        setGlobalTimeLeft(null)
      }

      if (advancedConfig.perQuestionTimeLimitSeconds) {
        setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds)
      } else {
        setQuestionTimeLeft(null)
      }

    } catch (err) {
      console.error('Failed to generate practice:', err)
      toast.error('Failed to generate practice session.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumePractice = async (path: string) => {
    setIsLoading(true)
    try {
      const res = await sidecarApi.getPractice(path)
      setQuestions(res.questions)
      setCurrentPracticePath(path)
      setCurrentQuestionIdx(0)
      setUserAnswers({})
      setIsRevealed(false)
      setGradedAnswers({})
      setConfidenceWagers({})
      setShowDashboard(false)
      setShowResults(false)
    } catch (err) {
      console.error('Failed to resume practice:', err)
      toast.error('Failed to resume practice session.')
    } finally {
        setIsLoading(false)
    }
  }

  const handleDeletePractice = async (path: string) => {
    if (!confirm("Are you sure you want to purge this assessment log? This action is irreversible.")) return
    
    try {
      await sidecarApi.deletePractice(path)
      toast.success("Assessment log purged successfully.")
      loadPastPractices()
    } catch (err) {
      console.error('Failed to delete practice:', err)
      toast.error('Failed to purge log.')
    }
  }

  const nextQuestion = async () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
      setIsRevealed(false)
      setWagerRevealed(false)
      if (advancedConfig.perQuestionTimeLimitSeconds) {
        setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds)
      }
    } else {
      setShowResults(true)
      const { score } = calculateScore()
      if (currentPracticePath) {
          await sidecarApi.updatePracticeScore(currentPracticePath, score)
          loadPastPractices()
      }
    }
  }

  const handleSelectAnswer = (val: any) => {
    setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: val }))
  }

  const handleSubmitAnswer = () => {
    const q = questions[currentQuestionIdx]
    const uAnswer = userAnswers[q.id]
    
    // Confidence wager gating
    if (advancedConfig.requireConfidenceWager && !confidenceWagers[q.id] && !isRevealed) {
        setWagerRevealed(true)
        return
    }

    setIsRevealed(true)
    
    // Auto-grade Objective questions
    if (q.type === 'mcq' || q.type === 'true_false') {
      const isCorrect = String(uAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase()
      setGradedAnswers(prev => ({ ...prev, [q.id]: isCorrect }))
    } else if (q.type === 'cloze') {
        const isCorrect = JSON.stringify(uAnswer) === JSON.stringify((q as any).blanks)
        setGradedAnswers(prev => ({ ...prev, [q.id]: isCorrect }))
    } else if (q.type === 'matching') {
        const isCorrect = JSON.stringify(uAnswer) === JSON.stringify((q as any).answer || (q as any).pairs)
        setGradedAnswers(prev => ({ ...prev, [q.id]: isCorrect }))
    }
  }

  const handleSelfGrade = (isCorrect: boolean) => {
    const q = questions[currentQuestionIdx]
    setGradedAnswers(prev => ({ ...prev, [q.id]: isCorrect }))
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach(q => {
      if (gradedAnswers[q.id]) {
        correct++
      }
    })
    return {
      score: Math.round((correct / questions.length) * 100) || 0,
      correct,
      total: questions.length
    }
  }

  const resetSession = () => {
      setQuestions([])
      setCurrentQuestionIdx(0)
      setUserAnswers({})
      setIsRevealed(false)
      setGradedAnswers({})
      setConfidenceWagers({})
      setShowResults(false)
      setGlobalTimeLeft(null)
      setQuestionTimeLeft(null)
  }

  const currentAvailableNotes = useMemo(() => {
    return availableNotes.map(n => ({ id: n.id, title: n.title }))
  }, [availableNotes])

  if (showDashboard && !questions.length && !isLoading) {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-white font-sans text-slate-950">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-16 py-12">
            <div className="flex justify-between items-end mb-16">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-4">
                  <span>System</span>
                  <ChevronRight size={10}/>
                  <span className="text-slate-600">Practice</span>
                </div>
                <h1 className="text-6xl font-black text-slate-950 tracking-tighter mb-4 leading-none">Practice Dashboard</h1>
                <p className="text-lg font-medium text-slate-500 max-w-xl leading-relaxed">Master your subjects with smart practice sessions. Challenge yourself and track your progress.</p>
              </div>
              <div className="flex gap-4">
                <Button 
                    variant="outline"
                    className="h-14 px-8 border-slate-200 text-slate-600 hover:text-black hover:border-black transition-all font-bold"
                    onClick={() => logsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                    View History
                </Button>
                <Button 
                    onClick={() => { setShowDashboard(false); setIsConfiguring(true); }}
                    className="bg-black text-white px-10 h-14 rounded-xl font-black transition-all hover:scale-105 shadow-2xl shadow-black/20"
                >
                    Start Session
                </Button>
              </div>
            </div>

            {pastPractices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
                {[
                  { 
                    label: 'Average Score', 
                    value: `${Math.round(pastPractices.filter(p => p.completed && p.score).reduce((acc, p) => acc + parseInt(p.score), 0) / (pastPractices.filter(p => p.completed && p.score).length || 1))}%`,
                    desc: 'Your overall performance'
                  },
                  { 
                    label: 'Sessions Finished', 
                    value: pastPractices.filter(p => p.completed).length,
                    desc: 'Completed practice runs'
                  },
                  { 
                    label: 'Success Rate', 
                    value: `${Math.round((pastPractices.filter(p => p.completed && parseInt(p.score) >= 80).length / (pastPractices.filter(p => p.completed).length || 1)) * 100)}%`,
                    desc: 'Sessions over 80%'
                  },
                  { 
                    label: 'Practice Time', 
                    value: '14.2h',
                    desc: 'Total time spent'
                  }
                ].map((stat, i) => (
                  <Card key={i} className="bg-slate-50/50 border-slate-100 shadow-none border-dashed">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tighter text-slate-950">
                            {stat.value}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{stat.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 p-8 bg-slate-50/30 rounded-3xl border border-slate-100">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                    Performance Trend
                  </h3>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Your scores over time</p>
                </div>
                <div className="h-[300px] w-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pastPractices.filter(p => p.completed).slice(-10).map((p, i) => ({ name: i + 1, score: parseInt(p.score) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} hide />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: '900', color: '#000' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#000" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-400" />
                    Heatmap
                  </h3>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Daily practice activity</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-center min-h-[300px]">
                  <ActivityCalendar 
                    data={calendarData}
                    theme={{
                      light: ['#f8fafc', '#e2e8f0', '#94a3b8', '#475569', '#0f172a'],
                    }}
                    fontSize={12}
                    blockSize={14}
                    blockMargin={4}
                  />
                </div>
              </div>
            </div>

            <div ref={logsRef} className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">Practice History</h2>
                <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-1 text-xs font-bold">{pastPractices.length}</Badge>
              </div>
            </div>

            {pastPractices.length > 0 ? (
              <div className="flex flex-col border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <div className="col-span-5">Subject</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Setup</div>
                  <div className="col-span-2 text-right">Score</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="flex flex-col divide-y divide-slate-50">
                  {pastPractices.map((practice, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => handleResumePractice(practice.path)}>
                      <div className="col-span-5 flex flex-col">
                        <span className="text-base font-bold text-slate-900 group-hover:text-black transition-colors">{practice.hub_title || 'Unknown Hub'}</span>
                        {practice.course && <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">{practice.course}</span>}
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm font-semibold text-slate-500">{practice.date || 'Unknown'}</span>
                      </div>
                      <div className="col-span-2 flex flex-col items-start gap-1.5">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white border-slate-200 text-slate-500 py-0.5 px-2">
                          {Array.isArray(practice.question_types) ? practice.question_types[0] : (practice.question_types || 'Mixed')}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{practice.difficulty} Focus</span>
                      </div>
                      <div className="col-span-2 text-right">
                        {practice.completed ? (
                          <div className={cn(
                            "text-xl font-black tracking-tighter inline-block px-3 py-1 rounded-lg",
                            parseInt(practice.score) >= 80 ? "text-slate-950" :
                            parseInt(practice.score) >= 50 ? "text-slate-600" :
                            "text-slate-400"
                          )}>{practice.score}</div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-300 italic">Incomplete</span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button 
                          title="Purge Log"
                          onClick={(e) => { e.stopPropagation(); handleDeletePractice(practice.path); }}
                          className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/20">
                <Target className="w-16 h-16 text-slate-100 mb-6" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No Practice History</h3>
                <p className="text-slate-300 font-medium">Start a session to begin tracking your progress.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isConfiguring) {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-white font-sans text-slate-950">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-16 py-12">
            <div className="flex flex-col mb-16">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">
                    <button onClick={() => { setIsConfiguring(false); setShowDashboard(true); }} className="hover:text-black transition-colors">Dashboard</button>
                    <ChevronRight size={10}/>
                    <span className="text-slate-600">Setup Session</span>
                </div>
                <h1 className="text-6xl font-black text-slate-950 tracking-tighter mb-4 leading-none text-center">Setup Session</h1>
                <p className="text-lg font-medium text-slate-500 max-w-2xl mx-auto text-center leading-relaxed">Configure your practice parameters for this topic.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-7 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Target Hub</Label>
                  </div>
                  <Select value={selectedHub} onValueChange={setSelectedHub}>
                    <SelectTrigger className="w-full h-20 bg-slate-50 border-none focus:ring-black rounded-2xl px-6 transition-all hover:bg-slate-100">
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                            {hubs.find(h => h.id === selectedHub)?.course || "TOPIC CONTEXT"}
                        </span>
                        <div className="text-lg font-bold text-slate-900 truncate">
                            <SelectValue placeholder="Select course material..." />
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      {hubs.map(hub => (
                        <SelectItem key={hub.id} value={hub.id} className="cursor-pointer py-4 rounded-xl">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-base font-bold text-slate-900">{hub.title}</span>
                            {hub.course && (
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-200">
                                {hub.course}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Difficulty Level</Label>
                  </div>
                  <RadioGroup value={advancedConfig.difficulty} onValueChange={(val) => setAdvancedConfig(prev => ({ ...prev, difficulty: val as any }))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'L1', title: 'L1: Recall', desc: 'Focuses on definitions and low-level component identification.' },
                      { id: 'L2', title: 'L2: Application', desc: 'Apply rules to solve standard problems or construct artifacts.' },
                      { id: 'L3', title: 'L3: Analysis', desc: 'Find errors, optimize systems, or predict complex failures.' },
                      { id: 'Mixed', title: 'Adaptive Mix', desc: 'Generated weighting across all difficulty tiers.' }
                    ].map((level) => (
                      <div key={level.id} className="relative">
                        <RadioGroupItem
                          value={level.id}
                          id={level.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={level.id}
                          className="flex flex-col gap-2 p-6 border border-slate-100 rounded-2xl bg-white peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-slate-50/50 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-black cursor-pointer transition-all hover:bg-slate-50 h-full border-dashed"
                        >
                          <span className="text-base font-black text-slate-900">{level.title}</span>
                          <span className="text-xs text-slate-500 font-medium leading-relaxed">{level.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="space-y-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 border-dashed">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Session Summary</h3>
                    <AdvancedPanel config={advancedConfig} setConfig={setAdvancedConfig} availableNotes={currentAvailableNotes} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Question Distribution</span>
                      <span>{Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0)} Total</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(advancedConfig.questionDistribution).filter(([_, v]) => v > 0).map(([k, v]) => (
                            <Badge key={k} variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold py-1 px-3">
                                {v} × {k.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extra Features</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Trick Answers', active: advancedConfig.injectTrickAnswers },
                            { label: 'Confidence Wager', active: advancedConfig.requireConfidenceWager },
                            { label: 'Gatekeeper', active: advancedConfig.progressionGatekeeper },
                            { label: 'Progressive Hints', active: advancedConfig.enableProgressiveHints },
                        ].map(d => (
                            <div key={d.label} className={cn(
                                "flex items-center gap-2 text-xs font-bold",
                                d.active ? "text-slate-900" : "text-slate-300 line-through decoration-slate-200"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full", d.active ? "bg-black" : "bg-slate-200")} />
                                {d.label}
                            </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                   <Button 
                    onClick={handleStartSession}
                    disabled={isLoading}
                    className="w-full h-20 bg-black text-white text-xl font-black rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                        <div className="flex items-center gap-3">
                            Initialize Practice Session
                            <ArrowRight className="w-6 h-6" />
                        </div>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIdx]
  if (!currentQuestion) return null

  const isObjective = ['mcq', 'true_false'].includes(currentQuestion.type)

  return (
    <div className="h-full flex-1 flex flex-col w-full bg-white text-slate-950 font-sans relative">
      <div className="flex items-center justify-between px-10 py-6 border-b border-slate-50 shrink-0 bg-white/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
            {hubs.find(h => h.id === selectedHub)?.title || 'Target Hub'}
          </Badge>
          <div className="flex gap-2 items-center">
            {questions.map((q, idx) => {
              let stateClass = 'bg-slate-100'
              if (idx === currentQuestionIdx) stateClass = 'bg-black w-3 scale-110 shadow-lg shadow-black/20'
              else if (idx < currentQuestionIdx) stateClass = gradedAnswers[q.id] ? 'bg-black' : 'bg-slate-300'
              
              return (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-500 ${stateClass} ${idx === currentQuestionIdx ? 'flex-[2]' : 'flex-1'}`}
                />
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-8">
            {globalTimeLeft !== null && (
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-black tracking-widest uppercase">
                        {Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}
                    </span>
                </div>
            )}
            <div className="text-[10px] font-black text-slate-400 px-4 py-1.5 bg-slate-50 rounded-full tracking-widest uppercase">
                Step <span className="text-slate-900">{currentQuestionIdx + 1}</span> of {questions.length}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-24 relative">
        {questionTimeLeft !== null && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-50/50">
                <div 
                    className="h-full bg-slate-900 transition-all duration-1000" 
                    style={{ width: `${(questionTimeLeft / (advancedConfig.perQuestionTimeLimitSeconds || 1)) * 100}%` }}
                />
            </div>
        )}

        <div className="max-w-4xl mx-auto flex flex-col gap-12 pb-64">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-950 text-white border-none font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1">
                Tier {currentQuestion.difficulty}
              </Badge>
              <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] px-3 py-1">
                {currentQuestion.type.replace('_', ' ')}
              </Badge>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-950 leading-[1.1]">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-6">
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = userAnswers[currentQuestion.id] === key;
                  let btnClass = "border-slate-100 bg-white hover:border-slate-300 text-slate-600";
                  let keyClass = "border-slate-100 text-slate-400";
                  
                  if (isSelected && !isRevealed) {
                    btnClass = "border-slate-950 bg-slate-50 ring-1 ring-slate-950 text-slate-950";
                    keyClass = "bg-slate-950 border-slate-950 text-white";
                  }

                  if (isRevealed) {
                    const isCorrectOption = key === currentQuestion.answer;
                    if (isCorrectOption) {
                        btnClass = "border-slate-950 bg-slate-50 text-slate-950 ring-1 ring-slate-950";
                        keyClass = "bg-slate-950 border-slate-950 text-white";
                    } else if (isSelected) {
                        btnClass = "border-slate-200 bg-white text-slate-300";
                        keyClass = "bg-slate-200 border-slate-200 text-white";
                    } else {
                        btnClass = "border-slate-50 bg-white text-slate-300 opacity-40";
                        keyClass = "bg-slate-50 border-slate-50 text-slate-200";
                    }
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectAnswer(key)}
                      disabled={isRevealed}
                      className={cn(
                        "flex items-center gap-6 p-6 border-2 rounded-2xl text-left transition-all duration-300",
                        btnClass
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black border transition-all shrink-0",
                        keyClass
                      )}>
                        {key}
                      </div>
                      <span className="text-base font-bold flex-1">{value}</span>
                      {isRevealed && key === currentQuestion.answer && (
                        <CheckCircle2 className="w-5 h-5 text-slate-950" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'code' && (
                <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-2xl">
                        <Editor
                            height="300px"
                            defaultLanguage="javascript"
                            theme="vs-light"
                            value={userAnswers[currentQuestion.id] || currentQuestion.codeSnippet || ""}
                            onChange={(val) => handleSelectAnswer(val)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontWeight: "700",
                                padding: { top: 20, bottom: 20 },
                                readOnly: isRevealed,
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                </div>
            )}

            {currentQuestion.type === 'cloze' && (
                <div className="space-y-6">
                    <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 leading-loose text-xl font-medium text-slate-600">
                      {currentQuestion.textWithBlanks?.split('[[blank]]').map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <input 
                              type="text"
                              className={cn(
                                "mx-2 px-3 py-1 border-b-2 border-slate-200 bg-transparent focus:outline-none focus:border-black text-slate-950 font-black transition-all text-center",
                                isRevealed && (userAnswers[currentQuestion.id]?.[i] === (currentQuestion as any).blanks?.[i] ? "border-slate-950" : "border-slate-200 text-slate-300")
                              )}
                              style={{ width: `${Math.max((currentQuestion as any).blanks?.[i]?.length || 5, 8)}ch` }}
                              value={userAnswers[currentQuestion.id]?.[i] || ""}
                              onChange={(e) => {
                                const newAnswers = [...(userAnswers[currentQuestion.id] || (currentQuestion as any).blanks?.map(() => ""))];
                                newAnswers[i] = e.target.value;
                                handleSelectAnswer(newAnswers);
                              }}
                              disabled={isRevealed}
                              placeholder="?"
                            />
                          )}
                        </span>
                      ))}
                    </div>
                </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {['True', 'False'].map(val => {
                  const isSelected = userAnswers[currentQuestion.id] === val;
                  let active = isSelected && !isRevealed;
                  let correct = isRevealed && val.toLowerCase() === (currentQuestion.answer as string)?.toLowerCase();
                  let wrong = isRevealed && isSelected && val.toLowerCase() !== (currentQuestion.answer as string)?.toLowerCase();

                  return (
                    <button
                      key={val}
                      onClick={() => handleSelectAnswer(val)}
                      disabled={isRevealed}
                      className={cn(
                          "h-24 border-2 rounded-2xl text-center transition-all text-lg font-black",
                          active ? "border-black bg-slate-50" : "border-slate-100 text-slate-400 hover:border-slate-200",
                          correct && "border-black bg-slate-50 text-slate-950",
                          wrong && "border-slate-200 text-slate-200",
                          isRevealed && !correct && !wrong && "opacity-40"
                      )}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            )}

            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'scenario' || currentQuestion.type === 'find_error') && (
              <div className="space-y-6">
                {currentQuestion.type === 'find_error' && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 p-6 font-mono text-sm font-bold text-slate-700 whitespace-pre shadow-inner">
                        {currentQuestion.buggyCode}
                    </div>
                )}
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                  <textarea
                    rows={6}
                    disabled={isRevealed}
                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                    placeholder="Identify the error and propose a remediation..."
                    value={userAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleSelectAnswer(e.target.value)}
                  />
                </div>
                {isRevealed && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-black text-white p-8 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white/50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Benchmark Answer</span>
                      </div>
                      <p className="text-lg font-bold leading-relaxed">{currentQuestion.answer}</p>
                    </div>
                    
                    {!gradedAnswers[currentQuestion.id] && (
                        <div className="flex flex-col items-center gap-6 p-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <div className="flex flex-col items-center gap-2">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Self-Grading Protocol</h4>
                                <p className="text-xs font-medium text-slate-400">Compare your response against the benchmark above.</p>
                            </div>
                            <div className="flex gap-4">
                                <Button 
                                    onClick={() => handleSelfGrade(false)}
                                    variant="outline"
                                    className="h-12 px-8 border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 font-bold transition-all"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Sub-optimal
                                </Button>
                                <Button 
                                    onClick={() => handleSelfGrade(true)}
                                    className="h-12 px-8 bg-black text-white font-bold hover:scale-105 transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Proficient
                                </Button>
                            </div>
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === 'matching' && (
                <MatchingRenderer 
                    question={currentQuestion} 
                    userAnswer={userAnswers[currentQuestion.id] || []}
                    onAnswerChange={handleSelectAnswer}
                    isRevealed={isRevealed}
                />
            )}
          </div>

          {advancedConfig.enableProgressiveHints && currentQuestion.hints && currentQuestion.hints.length > 0 && !isRevealed && (
            <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-full border-slate-100 text-slate-400 font-bold h-10 px-6 gap-2 hover:bg-slate-50"
                        onClick={() => setHintLevel(prev => ({ ...prev, [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1 }))}
                        disabled={(hintLevel[currentQuestion.id] || 0) >= currentQuestion.hints.length}
                    >
                        <Lightbulb className="w-3 h-3" />
                        Obtain Hint {((hintLevel[currentQuestion.id] || 0) + 1)}
                    </Button>
                </div>
                {Array.from({ length: hintLevel[currentQuestion.id] || 0 }).map((_, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-600 animate-in slide-in-from-top-2">
                        <span className="text-slate-400 mr-2">HINT {i+1}:</span> {currentQuestion.hints![i]}
                    </div>
                ))}
            </div>
          )}

          {wagerRevealed && !isRevealed && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
                <Card className="max-w-md w-full border-slate-100 shadow-2xl rounded-[3rem] p-12 space-y-8">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-950 rounded-2xl mx-auto flex items-center justify-center -rotate-2">
                            <BrainCircuit className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">Confidence Wager</h3>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">Rate your perceived accuracy before verification.</p>
                    </div>
                    <RadioGroup 
                        value={String(confidenceWagers[currentQuestion.id] || "")} 
                        onValueChange={(val) => setConfidenceWagers(prev => ({ ...prev, [currentQuestion.id]: parseInt(val) }))}
                        className="grid grid-cols-1 gap-3"
                    >
                        {[
                            { val: 1, label: 'Low (Educated Guess)', icon: HelpCircle },
                            { val: 2, label: 'Moderate (High Probability)', icon: Target },
                            { val: 3, label: 'Absolute (Definitive)', icon: Flame },
                        ].map(w => (
                            <Label key={w.val} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all">
                                <div className="flex items-center gap-4">
                                    <w.icon className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-900">{w.label}</span>
                                </div>
                                <RadioGroupItem value={String(w.val)} className="border-slate-200" />
                            </Label>
                        ))}
                    </RadioGroup>
                    <Button 
                        className="w-full h-16 bg-black text-white font-black rounded-2xl"
                        disabled={!confidenceWagers[currentQuestion.id]}
                        onClick={handleSubmitAnswer}
                    >
                        Commit to Model
                    </Button>
                </Card>
            </div>
          )}

          {isRevealed && (
            <div className={cn(
                "p-10 rounded-[2.5rem] space-y-8 border-2 border-dashed animate-in slide-in-from-bottom-8 fade-in duration-500",
                gradedAnswers[currentQuestion.id] === undefined ? "bg-slate-50 border-slate-100" 
                : gradedAnswers[currentQuestion.id] ? "bg-slate-50 border-slate-950" 
                : "bg-slate-50 border-slate-100"
            )}>
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        gradedAnswers[currentQuestion.id] ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"
                    )}>
                       {gradedAnswers[currentQuestion.id] ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                            {isObjective 
                                ? (gradedAnswers[currentQuestion.id] ? "Model Validated" : "Deviation Detected") 
                                : "Synthesis Benchmark"}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified by Pedagogical Engine</p>
                    </div>
                </div>
                {confidenceWagers[currentQuestion.id] && (
                    <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold px-4 py-1 gap-2">
                        Wager: {confidenceWagers[currentQuestion.id] === 3 ? 'Absolute' : confidenceWagers[currentQuestion.id] === 2 ? 'Moderate' : 'Low'}
                    </Badge>
                )}
              </div>

              <div className="space-y-6">
                  <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 block relative">The Sovereign Answer</span>
                    <p className="text-xl font-black text-slate-950 leading-relaxed relative whitespace-pre-wrap">{(currentQuestion as any).answer}</p>
                  </div>
                  
                  <div className="bg-slate-100/50 p-8 rounded-3xl border border-slate-100/50">
                    <div className="flex items-center gap-2 mb-3">
                        <BrainCircuit className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reasoning & Context</span>
                    </div>
                    <div className="text-sm font-bold text-slate-600 leading-[1.8] italic">
                        {currentQuestion.explanation}
                    </div>
                  </div>
              </div>

              {!isObjective && gradedAnswers[currentQuestion.id] === undefined && (
                  <div className="pt-8 border-t border-slate-100 flex flex-col gap-6">
                      <div className="text-center space-y-1">
                        <p className="text-base font-black text-slate-900">Self-Assessment Required</p>
                        <p className="text-xs font-medium text-slate-400">Did your synthesis align with the benchmark?</p>
                      </div>
                      <div className="flex gap-4">
                          <Button 
                            onClick={() => handleSelfGrade(true)}
                            className="flex-1 h-16 bg-black text-white text-base font-black rounded-2xl shadow-xl shadow-black/10 hover:scale-[1.02] transition-all"
                          >
                            Correct Recall
                          </Button>
                          <Button 
                            onClick={() => handleSelfGrade(false)}
                            variant="outline"
                            className="flex-1 h-16 border-slate-200 text-slate-400 text-base font-bold rounded-2xl hover:bg-slate-50 transition-all hover:text-slate-900"
                          >
                            Failed Retrieval
                          </Button>
                      </div>
                  </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-50 p-10 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
                variant="outline" 
                className="h-14 border-slate-100 text-slate-400 hover:text-black hover:border-black transition-all font-bold px-8 rounded-xl"
                onClick={() => {
                  if (confirm("Exit session? Current progress will be lost.")) {
                    resetSession()
                    setShowDashboard(true)
                  }
                }}
            >
              Exit Simulation
            </Button>
            {advancedConfig.enableProgressiveHints && (currentQuestion.hints?.length || 0) > 0 && (
                <Button 
                    variant="ghost"
                    className="h-14 text-slate-400 hover:text-black font-black uppercase tracking-widest text-[10px]"
                    onClick={() => {
                        const currentHint = hintLevel[currentQuestion.id] || 0;
                        if (currentHint < (currentQuestion.hints?.length || 0)) {
                            setHintLevel(prev => ({ ...prev, [currentQuestion.id]: currentHint + 1 }));
                        }
                    }}
                    disabled={isRevealed || (hintLevel[currentQuestion.id] || 0) >= (currentQuestion.hints?.length || 0)}
                >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Hint ({(hintLevel[currentQuestion.id] || 0)}/{currentQuestion.hints?.length})
                </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
              {isRevealed ? (
                <Button 
                    onClick={nextQuestion}
                    disabled={gradedAnswers[currentQuestion.id] === undefined}
                    className="h-16 px-12 bg-black text-white text-lg font-black rounded-2xl shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {currentQuestionIdx === questions.length - 1 ? "Complete Simulation" : "Next Protocol"}
                  <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              ) : (
                <Button 
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswers[currentQuestion.id] && currentQuestion.type !== 'true_false' && currentQuestion.type !== 'code' && currentQuestion.type !== 'matching'}
                    className="h-16 px-12 bg-black text-white text-lg font-black rounded-2xl shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Verify Submission
                  <Zap className="ml-3 w-5 h-5" />
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Confidence Wager Overlay */}
      {wagerRevealed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-white/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="w-full max-w-lg bg-white border border-slate-100 shadow-2xl rounded-[32px] p-12 space-y-10 text-center">
                  <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                          <BrainCircuit className="w-8 h-8" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-slate-950 tracking-tighter">Metacognitive Anchor</h3>
                      <p className="text-slate-500 font-medium">How confident are you in this retrieval? Wager your proficiency before we reveal the ground truth.</p>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            onClick={() => {
                                setConfidenceWagers(prev => ({ ...prev, [currentQuestion.id]: val }));
                                setWagerRevealed(false);
                                setIsRevealed(true);
                            }}
                            className="h-20 border-2 border-slate-100 rounded-2xl flex flex-col items-center justify-center hover:border-black group transition-all"
                          >
                              <span className="text-2xl font-black text-slate-950">{val * 20}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">%</span>
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={() => { setWagerRevealed(false); setIsRevealed(true); }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-900 transition-colors"
                  >
                      Skip Metacognition
                  </button>
              </div>
          </div>
      )}

      {/* Results View */}
      {showResults && (
           <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
               <div className="max-w-4xl mx-auto py-32 px-12">
                   <div className="text-center space-y-6 mb-24">
                        <div className="flex justify-center gap-4 mb-10">
                            <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                                {hubs.find(h => h.id === selectedHub)?.title}
                            </Badge>
                            <Badge className="bg-black text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                                {advancedConfig.difficulty}
                            </Badge>
                        </div>
                        <h1 className="text-8xl font-black tracking-tighter text-slate-950 leading-none">
                            {calculateScore().score}%
                        </h1>
                        <p className="text-xl font-bold text-slate-400 tracking-tight">PROFICIENCY ATTAINED</p>
                        <div className="flex justify-center gap-12 pt-8">
                             <div className="text-center">
                                 <div className="text-3xl font-black text-slate-900">{calculateScore().correct}/{calculateScore().total}</div>
                                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Raw Precision</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-3xl font-black text-slate-900">
                                     {Object.values(confidenceWagers).length > 0 ? `${Math.round(Object.values(confidenceWagers).reduce((a, b) => a + b, 0) / Object.values(confidenceWagers).length * 20)}%` : 'N/A'}
                                 </div>
                                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Calibration</div>
                             </div>
                        </div>
                   </div>

                   <div className="space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8">Session Transcript</h3>
                       <div className="flex flex-col gap-4">
                           {questions.map((q, i) => (
                               <div key={q.id} className="p-8 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-slate-200 transition-all">
                                   <div className="flex-1 space-y-2">
                                       <div className="flex items-center gap-3">
                                           <span className="text-[10px] font-black text-slate-300">STEP {i + 1}</span>
                                           <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest p-0 border-none text-slate-400">
                                               {q.type.replace('_', ' ')}
                                           </Badge>
                                       </div>
                                       <div className="text-lg font-bold text-slate-950 line-clamp-1">{q.question}</div>
                                   </div>
                                   <div className="flex items-center gap-6">
                                       {gradedAnswers[q.id] ? (
                                           <div className="flex items-center gap-2 text-slate-950 font-black text-sm">
                                               <CheckCircle2 className="w-5 h-5" />
                                               <span>CORRECT</span>
                                           </div>
                                       ) : (
                                            <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                               <XCircle className="w-5 h-5" />
                                               <span>INCORRECT</span>
                                           </div>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div className="flex gap-4">
                        <Button 
                            onClick={resetSession}
                            className="flex-1 h-20 bg-black text-white text-xl font-black rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] transition-all"
                        >
                            Retake Simulation
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => { resetSession(); setShowDashboard(true); loadPastPractices(); }}
                            className="flex-1 h-20 border-slate-100 text-slate-600 text-xl font-black rounded-2xl hover:bg-slate-50 transition-all border-dashed"
                        >
                            Return to Command
                        </Button>
                   </div>
               </div>
           </div>
      )}
    </div>
  )
}

function MatchingRenderer({ question, userAnswer, onAnswerChange, isRevealed }: {
    question: any
    userAnswer: string[]
    onAnswerChange: (val: string[]) => void
    isRevealed: boolean
}) {
    const leftItems = useMemo(() => question.pairs.map((p: any) => p.left), [question.pairs])
    const [rightItems, setRightItems] = useState<string[]>([])

    useEffect(() => {
        if (userAnswer && userAnswer.length > 0) {
            setRightItems(userAnswer)
        } else {
            const shuffled = [...question.pairs.map((p: any) => p.right)].sort(() => Math.random() - 0.5)
            setRightItems(shuffled)
            onAnswerChange(shuffled)
        }
    }, [question.pairs, userAnswer])

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = rightItems.indexOf(active.id)
            const newIndex = rightItems.indexOf(over.id)
            const newOrder = arrayMove(rightItems, oldIndex, newIndex)
            setRightItems(newOrder)
            onAnswerChange(newOrder)
        }
    }

    return (
        <div className="grid grid-cols-2 gap-12 items-start animate-in fade-in duration-700">
            <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Anchor Protocol</div>
                {leftItems.map((item: string, i: number) => (
                    <div key={i} className="h-20 flex items-center p-6 border border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-slate-600">
                        {item}
                    </div>
                ))}
            </div>
            
            <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Target Mapping</div>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={rightItems} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {rightItems.map((item: string, i: number) => (
                                <SortableItem 
                                    key={item} 
                                    id={item} 
                                    value={item} 
                                    disabled={isRevealed}
                                    isCorrect={isRevealed && item === question.pairs[i].right}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    )
}

function SortableItem({ id, value, disabled, isCorrect }: { id: string, value: string, disabled: boolean, isCorrect: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0 }
    
    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            className={cn(
                "h-20 flex items-center p-6 border-2 rounded-2xl font-black transition-all",
                isDragging ? "opacity-50 scale-105 z-50 ring-2 ring-black border-black cursor-grabbing" : "cursor-grab",
                disabled ? (isCorrect ? "border-slate-950 bg-slate-50 text-slate-950" : "border-slate-100 text-slate-300 opacity-40") : "border-slate-100 bg-white hover:border-slate-300 text-slate-600 shadow-sm active:cursor-grabbing"
            )}
        >
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-slate-200 transition-all">
                <Layers className="w-4 h-4 text-slate-300 group-hover:text-slate-900" />
            </div>
            <span className="flex-1">{value}</span>
            {disabled && isCorrect && <CheckCircle2 className="w-5 h-5 text-slate-950" />}
            {disabled && !isCorrect && <XCircle className="w-5 h-5 text-slate-200" />}
        </div>
    )
}
