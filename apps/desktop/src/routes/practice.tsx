import { useState, useEffect } from 'react'
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
  Trash2
} from 'lucide-react'
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

interface Hub {
  id: string
  title: string
  course?: string
  unit?: string
  semester?: string
}

interface Question {
  id: number
  type: string
  difficulty: string
  question: string
  options?: Record<string, string>
  answer: string
  explanation: string
}

export default function Practice() {
  const [hubs, setHubs] = useState<Hub[]>([])
  const [selectedHub, setSelectedHub] = useState<string>('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState('Mixed')
  const [questionType, setQuestionType] = useState<string>('Multiple Choice')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  
  // Track the raw text/selection the user answered
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  // Track if the answer was revealed
  const [isRevealed, setIsRevealed] = useState(false)
  // Track if the user's answer was graded as correct (boolean)
  const [gradedAnswers, setGradedAnswers] = useState<Record<number, boolean>>({})

  const [showResults, setShowResults] = useState(false)
  
  const resetSession = () => {
    setQuestions([])
    setCurrentQuestionIdx(0)
    setUserAnswers({})
    setIsRevealed(false)
    setGradedAnswers({})
    setShowResults(false)
    setIsConfiguring(false)
  }
  
  const [pastPractices, setPastPractices] = useState<any[]>([])
  const [currentPracticePath, setCurrentPracticePath] = useState<string | null>(null)

  useEffect(() => {
    loadHubs()
    loadPastPractices()
  }, [])

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
      const res = await sidecarApi.generatePractice(selectedHub, {
        question_count: questionCount,
        difficulty,
        question_type: questionType
      })
      setQuestions(res.questions)
      setCurrentPracticePath(res.quiz_path)
      setCurrentQuestionIdx(0)
      setUserAnswers({})
      setIsRevealed(false)
      setGradedAnswers({})
      setIsConfiguring(false)
      setShowDashboard(false)
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
    } finally {
        setIsLoading(false)
    }
  }

  const handleDeletePractice = async (path: string) => {
    if (!window.confirm("Are you sure you want to delete this practice session?")) return;
    try {
      await sidecarApi.deletePractice(path)
      toast.success('Practice session deleted.')
      loadPastPractices()
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete practice session.')
    }
  }

  const nextQuestion = async () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
      setIsRevealed(false)
    } else {
      setShowResults(true)
      const { score } = calculateScore()
      if (currentPracticePath) {
          await sidecarApi.updatePracticeScore(currentPracticePath, score)
          loadPastPractices()
      }
    }
  }

  const handleSelectAnswer = (answer: string) => {
    if (isRevealed) return; // Disallow changing answer after revealed
    setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: answer }))
  }

  const handleSubmitAnswer = () => {
    const q = questions[currentQuestionIdx]
    const uAnswer = userAnswers[q.id]
    if (!uAnswer) return
    
    setIsRevealed(true)
    
    // Auto-grade Objective questions
    if (q.type === 'Multiple Choice' || q.type === 'True/False') {
      const isCorrect = uAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()
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

  if (showDashboard && !questions.length && !isLoading) {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-white font-sans text-[#111827]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-16 py-12">
            <div className="flex justify-between items-end mb-12">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                  <span>System</span>
                  <span className="material-symbols-outlined text-[12px]"><ChevronRight size={12}/></span>
                  <span className="text-gray-600">Practice Dashboard</span>
                </div>
                <h1 className="text-5xl font-extrabold text-[#111827] tracking-tight mb-4 leading-tight">Practice Dashboard</h1>
                <p className="text-[16px] leading-relaxed text-gray-600">Review your performance and start new pedagogical simulations.</p>
              </div>
              <Button 
                onClick={() => { setShowDashboard(false); setIsConfiguring(true); }}
                className="bg-[#111827] text-white px-8 h-14 rounded font-bold transition-all hover:scale-105 shadow-xl shadow-black/10"
              >
                <Zap className="w-5 h-5 mr-2" />
                New Practice
              </Button>
            </div>

            {/* Performance Analytics Summary */}
            {pastPractices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <Card className="bg-white border-gray-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Average Score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {Math.round(pastPractices.filter(p => p.completed && p.score).reduce((acc, p) => acc + parseInt(p.score), 0) / (pastPractices.filter(p => p.completed && p.score).length || 1))}%
                      </span>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <Progress value={Math.round(pastPractices.filter(p => p.completed && p.score).reduce((acc, p) => acc + parseInt(p.score), 0) / (pastPractices.filter(p => p.completed && p.score).length || 1))} className="h-1 mt-4 bg-gray-100" />
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sessions Completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {pastPractices.filter(p => p.completed).length}
                      </span>
                      <span className="text-[12px] text-gray-400 font-medium">/{pastPractices.length} total</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111827] border-gray-100 shadow-sm text-white">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-400 opacity-60">Success Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {Math.round((pastPractices.filter(p => p.completed && parseInt(p.score) >= 80).length / (pastPractices.filter(p => p.completed).length || 1)) * 100)}%
                      </span>
                      <span className="text-[12px] opacity-60 font-medium">Over 80%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-[#111827]">Past Sessions</h2>
                <Badge variant="outline" className="bg-gray-50">{pastPractices.length}</Badge>
              </div>
            </div>

            {pastPractices.length > 0 ? (
              <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <div className="col-span-5">Unit & Course</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Score</div>
                  <div className="col-span-1 border-gray-100"></div>
                </div>
                
                <div className="flex flex-col divide-y divide-gray-100">
                  {pastPractices.map((practice, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50 transition-colors group">
                      <div className="col-span-5 flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{practice.hub_title || 'Unknown Hub'}</span>
                        {practice.course && <span className="text-[12px] text-gray-500 line-clamp-1">{practice.course}</span>}
                      </div>
                      <div className="col-span-2">
                        <span className="text-[13px] text-gray-600">{practice.date || 'Unknown'}</span>
                      </div>
                      <div className="col-span-2 flex flex-col items-start gap-1">
                        <Badge variant="outline" className="text-[10px] bg-white text-gray-500 font-medium">
                          {Array.isArray(practice.question_types) ? practice.question_types[0] : (practice.question_types || 'Mixed')}
                        </Badge>
                        <span className="text-[11px] text-gray-400 font-medium uppercase">{practice.difficulty}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        {practice.completed ? (
                          <span className={cn(
                            "text-[14px] font-bold rounded px-2 py-1",
                            parseInt(practice.score) >= 80 ? "bg-green-100 text-green-800" :
                            parseInt(practice.score) >= 50 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>{practice.score}</span>
                        ) : (
                          <span className="text-[12px] text-gray-400 italic">Incomplete</span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end gap-2">
                        <button 
                          title="Redo Practice"
                          onClick={() => handleResumePractice(practice.path)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          title="Delete Practice"
                          onClick={() => handleDeletePractice(practice.path)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                <Target className="w-10 h-10 text-gray-200 mb-4" />
                <p className="text-[14px] font-medium text-gray-400">No past sessions found. Start your first practice!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isConfiguring) {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-white font-sans text-[#111827]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-16 py-12">
            <div className="flex flex-col mb-12">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                    <button onClick={() => { setIsConfiguring(false); setShowDashboard(true); }} className="hover:text-black transition-colors">Dashboard</button>
                    <span className="material-symbols-outlined text-[12px]"><ChevronRight size={12}/></span>
                    <span className="text-gray-600">New Session</span>
                </div>
                <h1 className="text-5xl font-extrabold text-[#111827] tracking-tight mb-4 leading-tight">Practice Configuration</h1>
                <p className="text-[16px] leading-relaxed text-gray-600">Select your focus areas and challenge parameters.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-10">
                {/* Unit Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Pick a Topic</Label>
                  </div>
                  <Select value={selectedHub} onValueChange={setSelectedHub}>
                    <SelectTrigger className="w-full h-12 bg-gray-50 border border-gray-200 focus:ring-black text-[14px]">
                      <SelectValue placeholder="Select a unit to practice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs.map(hub => (
                        <SelectItem key={hub.id} value={hub.id} className="cursor-pointer py-2">
                          <div className="flex flex-col items-start">
                            <span className="text-[13px] font-medium">{hub.title}</span>
                            {hub.course && (
                              <span className="text-[10px] uppercase text-gray-400">{hub.course}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty Levels */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">How Hard Should This Be?</Label>
                  </div>
                  <RadioGroup value={difficulty} onValueChange={setDifficulty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'L1', title: 'Easy (Facts)', desc: 'Basic terms and definitions.' },
                      { id: 'L2', title: 'Medium (Application)', desc: 'Use concepts to solve problems.' },
                      { id: 'L3', title: 'Hard (Analysis)', desc: 'Find errors or connect complex ideas.' },
                      { id: 'Mixed', title: 'Mixed', desc: 'A bit of everything.' }
                    ].map((level) => (
                      <div key={level.id} className="relative">
                        <RadioGroupItem
                          value={level.id}
                          id={level.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={level.id}
                          className="flex flex-col gap-2 p-5 border border-gray-200 rounded-lg bg-white peer-data-[state=checked]:border-black peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-black cursor-pointer transition-all hover:bg-gray-50 h-full"
                        >
                          <span className="text-[14px] font-bold text-gray-900">{level.title}</span>
                          <span className="text-[12px] text-gray-500 leading-relaxed">{level.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-10">
                {/* Question Types */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">What Kind of Questions?</Label>
                  </div>
                  <RadioGroup value={questionType} onValueChange={setQuestionType} className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'Multiple Choice', label: 'Multiple Choice', desc: 'Pick the right answer.' },
                      { id: 'True/False', label: 'True / False', desc: 'Decide if a statement is correct.' },
                      { id: 'Short Answer', label: 'Short Answer', desc: 'Type your own answer.' },
                      { id: 'Scenario-Based', label: 'Scenario Based', desc: 'Read a story and respond.' }
                    ].map(type => (
                      <div key={type.id} className="relative">
                        <RadioGroupItem
                          value={type.id}
                          id={`type-${type.id}`}
                          className="peer sr-only"
                        />
                        <Label 
                          htmlFor={`type-${type.id}`}
                          className="flex items-center p-4 border border-gray-200 rounded-lg bg-white peer-data-[state=checked]:border-black peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-black cursor-pointer transition-all hover:bg-gray-50"
                        >
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-gray-900 mb-1">{type.label}</span>
                            <span className="text-[12px] text-gray-500">{type.desc}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Count */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4 text-gray-400" />
                      <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">How Many Questions?</Label>
                    </div>
                    <Badge variant="outline" className="text-[12px] font-medium border-gray-200 bg-gray-50 text-gray-900">{questionCount} Questions</Badge>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    step="1"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Just 1</span>
                    <span>30 max</span>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                <button 
                  onClick={handleStartSession}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[#111827] text-white text-[13px] font-medium rounded hover:bg-black transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Start Practice'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-white items-center justify-center text-[#111827] font-sans">
        <div className="max-w-md w-full space-y-8 text-center px-6">
          <div className="relative mx-auto w-16 h-16 opacity-50">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-black rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-black" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Creating your quiz...</h2>
            <p className="text-[14px] text-gray-500">Reading your notes and writing questions.</p>
          </div>
        </div>
      </div>
    )
  }

  if (showResults) {
    const { score, correct, total } = calculateScore()
    return (
      <div className="h-full flex-1 flex flex-col w-full bg-white text-[#111827] font-sans overflow-auto">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-3xl w-full flex flex-col gap-8 bg-white border border-gray-200 rounded-xl p-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight">Practice Complete</h2>
              <p className="text-[14px] text-gray-500">Here is how you did.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 border-y border-gray-100">
              <span className="text-6xl font-extrabold tracking-tighter mb-2">{score}%</span>
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded">Score</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-6 bg-green-50 rounded-lg">
                <p className="text-[13px] font-bold text-green-800 mb-1">Correct</p>
                <p className="text-2xl font-black text-green-900">{correct}</p>
              </div>
              <div className="p-6 bg-red-50 rounded-lg">
                <p className="text-[13px] font-bold text-red-800 mb-1">Incorrect</p>
                <p className="text-2xl font-black text-red-900">{total - correct}</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <button 
                    onClick={() => { setIsConfiguring(true); setShowResults(false); setQuestions([]); }}
                    className="w-full px-6 py-4 bg-[#111827] text-white text-[13px] font-bold rounded hover:bg-black transition-all"
                >
                    Practice Again
                </button>
                <button 
                    onClick={() => { setShowDashboard(true); setShowResults(false); setQuestions([]); }}
                    className="w-full px-6 py-4 bg-white border border-gray-200 text-gray-600 text-[13px] font-medium rounded hover:bg-gray-50 transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIdx]
  const qType = currentQuestion?.type || 'Unknown'
  const isObjective = qType.includes('Choice') || qType.includes('True/False')

  return (
    <div className="h-full flex-1 flex flex-col w-full bg-white text-[#111827] font-sans relative">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[11px] px-3 py-1">
            {hubs.find(h => h.id === selectedHub)?.title || 'Practice'}
          </Badge>
          <div className="hidden sm:flex gap-1.5 items-center">
            {questions.map((q, idx) => {
              let bg = 'bg-gray-200'
              if (idx === currentQuestionIdx) bg = 'bg-blue-500'
              else if (idx < currentQuestionIdx) bg = gradedAnswers[q.id] ? 'bg-green-500' : 'bg-red-500'
              
              return (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full ${bg}`}
                />
              )
            })}
          </div>
        </div>
        <div className="text-[12px] font-medium text-gray-500">
          Question {currentQuestionIdx + 1} of {questions.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-12">
        <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-32">
          
          {/* Question Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{currentQuestion.difficulty}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{currentQuestion.type}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Input Area */}
          <div className="space-y-4">
            {currentQuestion.type === 'Multiple Choice' && currentQuestion.options && (
              <div className="flex flex-col gap-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = userAnswers[currentQuestion.id] === key;
                  let btnStateClass = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700";
                  let circleClass = "border-gray-300 text-gray-500";
                  
                  if (isSelected && !isRevealed) {
                    btnStateClass = "border-black bg-gray-50 ring-1 ring-black";
                    circleClass = "bg-black border-black text-white";
                  }

                  if (isRevealed) {
                    const isCorrectOption = key === currentQuestion.answer;
                    if (isCorrectOption) {
                        btnStateClass = "border-green-500 bg-green-50 text-green-900 ring-1 ring-green-500";
                        circleClass = "bg-green-600 border-green-600 text-white";
                    } else if (isSelected) {
                        btnStateClass = "border-red-300 bg-red-50 text-red-900";
                        circleClass = "bg-red-500 border-red-500 text-white";
                    }
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectAnswer(key)}
                      disabled={isRevealed}
                      className={cn(
                        "flex items-center gap-4 p-4 border rounded-lg text-left transition-all",
                        btnStateClass,
                        isRevealed && !isSelected && key !== currentQuestion.answer && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-7 h-7 rounded text-[12px] font-bold border transition-colors shrink-0",
                        circleClass
                      )}>
                        {key}
                      </div>
                      <span className="text-[14px] flex-1 font-medium">{value}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'True/False' && (
              <div className="flex gap-4">
                {['True', 'False'].map(val => {
                  const isSelected = userAnswers[currentQuestion.id] === val;
                  let btnStateClass = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700";
                  
                  if (isSelected && !isRevealed) {
                    btnStateClass = "border-black bg-gray-50 ring-1 ring-black font-bold";
                  }

                  if (isRevealed) {
                    const isCorrectOption = val.toLowerCase() === currentQuestion.answer.toLowerCase();
                    if (isCorrectOption) {
                        btnStateClass = "border-green-500 bg-green-50 text-green-900 ring-1 ring-green-500 font-bold";
                    } else if (isSelected) {
                        btnStateClass = "border-red-300 bg-red-50 text-red-900 font-bold";
                    }
                  }

                  return (
                    <button
                      key={val}
                      onClick={() => handleSelectAnswer(val)}
                      disabled={isRevealed}
                      className={cn(
                          "flex-1 h-16 border rounded-lg text-center transition-all text-[14px]",
                          btnStateClass,
                          isRevealed && !isSelected && val.toLowerCase() !== currentQuestion.answer.toLowerCase() && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            )}

            {!isObjective && (
              <div className="flex flex-col gap-2">
                <textarea 
                  className={cn(
                      "w-full h-40 p-4 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[14px] bg-white resize-none transition-opacity",
                      isRevealed && "opacity-75 bg-gray-50"
                  )}
                  placeholder="Type your answer here..."
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  disabled={isRevealed}
                />
              </div>
            )}
          </div>

          {/* Reveal Area */}
          {isRevealed && (
            <div className={cn(
                "p-6 rounded-xl space-y-4 border animate-in slide-in-from-bottom-2 fade-in duration-300",
                gradedAnswers[currentQuestion.id] === undefined ? "bg-blue-50 border-blue-100" 
                : gradedAnswers[currentQuestion.id] ? "bg-green-50 border-green-100" 
                : "bg-red-50 border-red-100"
            )}>
              <div className="flex gap-2 items-center">
                  {gradedAnswers[currentQuestion.id] === true && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {gradedAnswers[currentQuestion.id] === false && <XCircle className="w-5 h-5 text-red-600" />}
                  <h3 className="font-bold text-[14px] text-gray-900">
                      {isObjective 
                          ? (gradedAnswers[currentQuestion.id] ? "Correct!" : "Incorrect") 
                          : "Review your answer"}
                  </h3>
              </div>

              <div className="space-y-3">
                  <div className="p-4 bg-white rounded border border-gray-100 opacity-90">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">The Answer</span>
                      <p className="text-[14px] font-bold text-gray-900">{currentQuestion.answer}</p>
                  </div>
                  
                  <div className="text-[13px] text-gray-700 leading-relaxed">
                      <span className="font-bold mr-1">Explanation:</span>
                      {currentQuestion.explanation}
                  </div>
              </div>

              {/* Self-grading controls for subjective questions */}
              {!isObjective && gradedAnswers[currentQuestion.id] === undefined && (
                  <div className="pt-4 mt-2 border-t border-blue-100/50 flex flex-col gap-3">
                      <p className="text-[12px] font-medium text-blue-900">Did you get it right?</p>
                      <div className="flex gap-3">
                          <button 
                            onClick={() => handleSelfGrade(true)}
                            className="flex-1 py-2 bg-green-600 text-white text-[13px] font-bold rounded shadow-sm hover:bg-green-700 transition"
                          >
                            Yes, I was right
                          </button>
                          <button 
                            onClick={() => handleSelfGrade(false)}
                            className="flex-1 py-2 bg-red-600 text-white text-[13px] font-bold rounded shadow-sm hover:bg-red-700 transition"
                          >
                            No, I missed it
                          </button>
                      </div>
                  </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-white/95 backdrop-blur shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-10 flex justify-between items-center">
        <button 
            onClick={() => { resetSession(); setShowDashboard(true); }}
            className="text-[12px] font-medium text-gray-500 hover:text-black transition"
        >
            Quit Practice
        </button>

        <div className="flex gap-3">
            {!isRevealed ? (
                <button 
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswers[currentQuestion.id]}
                    className="px-6 py-2.5 bg-[#111827] text-white text-[13px] font-medium rounded hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Check Answer
                </button>
            ) : (
                <button 
                    onClick={nextQuestion}
                    disabled={!isObjective && gradedAnswers[currentQuestion.id] === undefined}
                    className="px-6 py-2.5 bg-[#111827] text-white text-[13px] font-medium rounded hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {currentQuestionIdx === questions.length - 1 ? 'See Results' : 'Next Question'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>
    </div>
  )
}
