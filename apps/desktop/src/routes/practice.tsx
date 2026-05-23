import React, {useState, useEffect, useRef} from 'react'
import { useSearchParams } from 'react-router-dom'
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
 Info,
 X,
 TrendingUp,
 BarChart2,
 Plus,
 Upload,
 BookOpen,
 FlameKindling,
 Shuffle,
 Target,
 Trophy,
 FileText,
 ChevronDown,
 Bookmark
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
import { BlockingLoader, MiniLoader } from '@/components/ui/loading-state'

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

const ZERO_DISTRIBUTION = { mcq:0, true_false:0, writing:0, fill_in:0, matching:0, order:0, debug:0, synthesis:0, trace:0, calculation:0, data_analysis:0, scenario:0, code:0 }

const PRESETS: Record<string, Partial<typeof ZERO_DISTRIBUTION> & {label:string}> = {
  balanced:   { label:'Balanced',    mcq:2, true_false:2, writing:1, fill_in:2, matching:1, order:1, synthesis:1, calculation:1, data_analysis:1 },
  mcq_blitz:  { label:'MCQ Blitz',  mcq:15, true_false:5 },
  deep_write: { label:'Deep Write', writing:4, synthesis:3, trace:2, debug:2 },
  math_mode:  { label:'Math Mode',  calculation:6, data_analysis:4, trace:3 },
  recall:     { label:'Recall',     mcq:5, true_false:5, fill_in:5 },
  hard_mode:  { label:'Hard Mode',  writing:2, synthesis:3, calculation:3, debug:2, trace:2, data_analysis:2 },
  exam_sim:   { label:'Exam Sim',   mcq:5, true_false:3, writing:2, fill_in:3, calculation:2, matching:2, order:1 },
}

const DEFAULT_CONFIG: AdvancedPracticeConfig = {
  hubId: '',
  selectedAtomicNotes: [],
  questionDistribution: { ...ZERO_DISTRIBUTION },
  difficulty: 'Mixed',
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
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedHub = searchParams.get('hubId') || searchParams.get('id') || ''
  const setSelectedHub = (id: string) => setSearchParams(prev => {
    prev.set('hubId', id)
    return prev
  })
 const [advancedConfig, setAdvancedConfig] = useState<AdvancedPracticeConfig>(DEFAULT_CONFIG)
 const [isLoading, setIsLoading] = useState(false)
 const view = (searchParams.get('view') || 'dashboard') as 'dashboard' | 'history' | 'configuring' | 'loading' | 'session' | 'results'
 const setView = (v: string) => setSearchParams(prev => {
   prev.set('view', v)
   return prev
 })
 
 const [questions, setQuestions] = useState<Question[]>([])
 const currentQuestionIdx = parseInt(searchParams.get('q') || '0')
 const setCurrentQuestionIdx = (idx: number) => setSearchParams(prev => {
   prev.set('q', String(idx))
   return prev
 })
 const currentQuestion = questions[currentQuestionIdx]
 const [userAnswers, setUserAnswers] = useState<Record<number, any>>({})
 const [isRevealed, setIsRevealed] = useState(false)
 const [gradedAnswers, setGradedAnswers] = useState<Record<number, boolean>>({})
 const [keywordChecks, setKeywordChecks] = useState<Record<string, boolean>>({})
 const [pastPractices, setPastPractices] = useState<any[]>([])
 const [currentPracticePath, setCurrentPracticePath] = useState<string | null>(null)
 const [genStatus, setGenStatus] = useState<string>('Initializing...')
  const [availableNotes, setAvailableNotes] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<{ modalities: Record<string, number>; weakest_concepts: any[] }>({
    modalities: {},
    weakest_concepts: []
  })
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Reference Vault state ──────────────────────────────────────────────────
  const [vaultFiles, setVaultFiles] = useState<any[]>([])
  const [vaultLoading, setVaultLoading] = useState(false)
  const [vaultStatus, setVaultStatus] = useState('')
  const [vaultSourceText, setVaultSourceText] = useState('')
  const [vaultSourceName, setVaultSourceName] = useState('')
  const [vaultSelectedFiles, setVaultSelectedFiles] = useState<string[]>([])
  const [vaultMode, setVaultMode] = useState<'vault_only'|'hard_only'|'ai_variants'|'mixed'|'weak_spots'|'exam_sim'>('vault_only')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Session enhancement state ───────────────────────────────────────────────
  const [streak, setStreak] = useState(0)
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [confidenceWager, setConfidenceWager] = useState<Record<number,number>>({})

  // ── Explain More state ─────────────────────────────────────────────
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainLesson, setExplainLesson] = useState('')
  const [explainLoading, setExplainLoading] = useState(false)
  const explainScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (explainOpen && !explainLoading && explainScrollRef.current) {
      explainScrollRef.current.scrollTop = 0
    }
  }, [explainOpen, explainLoading])

  // ── FSRS Spaced Repetition state ───────────────────────────────────────────
  const [srsCardsCache, setSrsCardsCache] = useState<Record<string, any>>({})
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set())
  const [feynmanExplanation, setFeynmanExplanation] = useState<string>('')
  const [feynmanError, setFeynmanError] = useState<string | null>(null)
  const [isFeynmanValidating, setIsFeynmanValidating] = useState<boolean>(false)

  const globalTimeLeftRef = useRef(globalTimeLeft);
  const questionTimeLeftRef = useRef(questionTimeLeft);
  const isRevealedRef = useRef(isRevealed);
  const currentQuestionRef = useRef(currentQuestion);

  useEffect(() => { globalTimeLeftRef.current = globalTimeLeft; }, [globalTimeLeft]);
  useEffect(() => { questionTimeLeftRef.current = questionTimeLeft; }, [questionTimeLeft]);
  useEffect(() => { isRevealedRef.current = isRevealed; }, [isRevealed]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (view === 'results') {
      const val = Math.round((Date.now() - (window as any).__practiceStartTime || 0) / 1000);
      setElapsedSec(val);
    }
  }, [view]);

  const questionStartTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIdx, view]);

  // ── Reference Vault handlers ─────────────────────────────────────────────
  const loadVaultFiles = async (hubId: string) => {
    if (!hubId) return
    try {
      const res = await sidecarApi.vaultList(hubId)
      setVaultFiles(res.vaults || [])
    } catch { setVaultFiles([]) }
  }

  const handleVaultUploadText = async () => {
    if (!vaultSourceText.trim() || !vaultSourceName.trim() || !selectedHub) return
    setVaultLoading(true); setVaultStatus('Extracting questions...')
    try {
      const res = await sidecarApi.vaultUploadText(selectedHub, vaultSourceName, vaultSourceText)
      toast.success(`Vault created — ${res.total || 0} questions read and structured`)
      setVaultSourceText(''); setVaultSourceName('')
      await loadVaultFiles(selectedHub)
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally { setVaultLoading(false); setVaultStatus('') }
  }

  const handleVaultFileUpload = async (file: File) => {
    if (!selectedHub) { toast.error('Select a hub first'); return }
    setVaultLoading(true); setVaultStatus(`Reading ${file.name}...`)
    try {
      await sidecarApi.vaultUploadFile(selectedHub, file)
      toast.success('File processed — vault updated')
      await loadVaultFiles(selectedHub)
    } catch (e: any) {
      toast.error(e.message || 'File upload failed')
    } finally { setVaultLoading(false); setVaultStatus('') }
  }

  const handleVaultPracticeGenerate = async () => {
    if (!vaultSelectedFiles.length) return
    setIsLoading(true)
    try {
      const res = await sidecarApi.vaultGenerate(vaultSelectedFiles, vaultMode, selectedHub)
      setQuestions(res.questions || [])
      setCurrentPracticePath(res.quiz_path || null)
      setCurrentQuestionIdx(0); setUserAnswers({}); setIsRevealed(false)
      setGradedAnswers({}); setStreak(0); setBookmarked(new Set())
      setView('session')
    } catch (e: any) {
      toast.error(e.message || 'Generation failed')
    } finally { setIsLoading(false) }
  }

  useEffect(() => {loadHubs(); loadPastPractices(); loadAnalytics();}, [])


 useEffect(() => {
 const searchParams = new URLSearchParams(window.location.search);
 const hubId = searchParams.get('hubId') || searchParams.get('id');
 if (hubId && hubs.length > 0) {
 const hub = hubs.find(h => h.id === hubId || h.path.includes(hubId));
 if (hub) setSelectedHub(hub.id);
}
}, [hubs]);

 useEffect(() => {if (selectedHub) loadHubNotes(selectedHub);}, [selectedHub])
 
 const loadHubNotes = async (hubId: string) => {
  if (!hubId) return;
  try {
    let notes: any[] = [];
    if (hubId === "all") {
      const allNotesPromises = hubs.map(h => sidecarApi.listHubNotes(h.id));
      const allNotesResults = await Promise.all(allNotesPromises);
      const notePaths = new Set<string>();
      allNotesResults.forEach(res => {
        const hubNotes = Array.isArray(res?.notes) ? res.notes : [];
        hubNotes.forEach((n: any) => {
          if (n && n.path && !notePaths.has(n.path)) {
            notePaths.add(n.path);
            notes.push(n);
          }
        });
      });
    } else {
      const res = await sidecarApi.listHubNotes(hubId); 
      notes = Array.isArray(res?.notes) ? res.notes : [];
    }
    setAvailableNotes(notes);
    setAdvancedConfig(prev => {
     // Omit label property
     const { label: _l, ...cleanedDist } = prev.questionDistribution as any;
     
     return {
       ...prev,
       selectedAtomicNotes: notes.map((n: any) => n.path),
       questionDistribution: cleanedDist
     };
    })
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
  setGenStatus(statuses[statuses.length - 1] as string);
}
} catch (e) {
 console.error("Status polling failed", e);
}
}, 2000);
}
 return () => clearInterval(interval);
}, [view]);

 useEffect(() => {
  if (view === 'session' && questions.length === 0) {
   setView('configuring');
  }
 }, [view, questions]);

  useEffect(() => {
    if (questions.length > 0 && view === 'session') {
      const interval = setInterval(() => {
        // Handle Global Timer
        if (globalTimeLeftRef.current !== null) {
          if (globalTimeLeftRef.current <= 1) {
            clearInterval(interval);
            setGlobalTimeLeft(0);
            toast.error("Total session time expired!");
            setView('results');
            return;
          }
          setGlobalTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0));
        }

        // Handle Per-Question Timer
        if (questionTimeLeftRef.current !== null) {
          if (questionTimeLeftRef.current <= 1) {
            setQuestionTimeLeft(0);
            // Automatic "Wrong" mark and next question
            if (!isRevealedRef.current) {
              handleSubmitAnswer(); // Reveal the answer first
              toast.warning("Question time expired! Marked as incorrect.");
              if (currentQuestionRef.current) {
                setGradedAnswers(prev => ({...prev, [currentQuestionRef.current.id]: false}));
              }
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
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [questions, view])

  const getCleanErrorMessage = (err: any): string => {
    if (!err) return 'Error starting.';
    
    let msg = '';
    if (typeof err === 'string') {
      msg = err;
    } else if (err.message) {
      msg = err.message;
    } else {
      try {
        msg = JSON.stringify(err);
      } catch {
        msg = String(err);
      }
    }

    const sidecarPattern = /Sidecar API returned error status \d+:\s*([\s\S]*)/i;
    const match = msg.match(sidecarPattern);
    if (match && match[1]) {
      const rawDetail = match[1].trim();
      try {
        const parsed = JSON.parse(rawDetail);
        if (parsed && parsed.detail) {
          if (typeof parsed.detail === 'string') {
            return parsed.detail;
          } else if (typeof parsed.detail === 'object') {
            return JSON.stringify(parsed.detail);
          }
        }
      } catch {
        return rawDetail;
      }
    }

    return msg || 'Error starting.';
  };

  const loadAnalytics = async () => {
    try {
      const res = await sidecarApi.getPracticeAnalytics();
      setAnalytics(res);
    } catch {
      console.error("Error loading analytics");
    }
  };

  const loadPastPractices = async () => {try {const res = await sidecarApi.listPractices(); setPastPractices(res.practices);} catch {console.error("Error");}}
  const loadHubs = async () => {
    try {
      const res = await sidecarApi.listHubs();
      setHubs(res.hubs);
      if (res.hubs.length > 0 && !selectedHub) {
        setSelectedHub(res.hubs[0].id);
      }
    } catch {
      console.error("Error loading hubs");
    }
  };

  const handleStartSession = async () => {
    if (!selectedHub) {
      toast.error('Choose a topic.');
      return;
    }
    
    const totalQuestions = Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0);
    if (totalQuestions <= 0) {
      toast.error('Please select at least one question type or apply a preset.');
      return;
    }
    
    setIsLoading(true);
    setView('loading');
    try {
      const cleanDistribution = Object.fromEntries(
        Object.entries(advancedConfig.questionDistribution).filter(([k]) => 
          ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(k)
        )
      );

      // Fetch and cache FSRS cards state
      const cacheRes = await sidecarApi.srsCards();
      const cacheMap: Record<string, any> = {};
      if (cacheRes && Array.isArray(cacheRes.cards)) {
        cacheRes.cards.forEach((c: any) => {
          cacheMap[c.note_path] = c;
        });
      }
      setSrsCardsCache(cacheMap);
      setUnlockedNotes(new Set());
      setFeynmanExplanation('');
      setFeynmanError(null);

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
        setStreak(0); 
        setBookmarked(new Set());
        setView('session');
        (window as any).__practiceStartTime = Date.now();
        if (advancedConfig.globalTimeLimitMinutes) setGlobalTimeLeft(advancedConfig.globalTimeLimitMinutes * 60);
        if (advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds);
      }, 1000);
    } catch (err: any) {
      toast.error(getCleanErrorMessage(err)); 
      setView('configuring');
    } finally {
      setIsLoading(false);
    }
  };

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
  (window as any).__practiceStartTime = Date.now();
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

 const isSelfGraded = ['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(q.type);

 if (!isSelfGraded) {
  if (q.type === 'mcq' || q.type === 'true_false') {
   const userVal = String(userAnswers[q.id] || '').trim();
   const correctVal = String(q.answer || '').trim();
   
   if (q.type === 'true_false') {
   const userBool = userVal.toLowerCase() === 'true';
   const correctBool = typeof q.answer === 'boolean' ? q.answer : String(q.answer).toLowerCase() === 'true';
   isCorrect = userBool === correctBool;
   } else if (q.type === 'mcq') {
    isCorrect = userVal.trim().toUpperCase() === String(q.answer || '').trim().toUpperCase();
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
  setGradedAnswers(prev => ({...prev, [q.id]: isCorrect}));
  setStreak(prev => isCorrect ? prev + 1 : 0);
 }
}

 const toggleBookmark = (idx: number) => {
   setBookmarked(prev => {
     const next = new Set(prev)
     if (next.has(idx)) next.delete(idx)
     else next.add(idx)
     return next
   })
 }

  const nextQuestion = async (latestGrade?: boolean) => {
    const currentQ = questions[currentQuestionIdx];
    if (currentQ) {
      const isCorrect = latestGrade !== undefined ? latestGrade : gradedAnswers[currentQ.id] === true;
      const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
      sidecarApi.logPracticeAttempt(
        currentQ.note_id || selectedHub || 'unknown',
        currentQ.type || 'unknown',
        isCorrect,
        timeTaken
      ).catch(err => {
        console.error("Failed to log practice attempt:", err);
      });
    }

    if (latestGrade !== undefined) setStreak(prev => latestGrade ? prev + 1 : 0);
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1); 
      setIsRevealed(false); 
      setKeywordChecks({});
      setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds || null);
    } else {
      const newGradedAnswers = latestGrade !== undefined ? {...gradedAnswers, [questions[currentQuestionIdx].id]: latestGrade} : gradedAnswers;
      let correct = 0;
      const total = questions.length;
      questions.forEach(q => {
        if (newGradedAnswers[q.id] === true) correct++;
      });
      const score = Math.round((correct / (total || 1)) * 100);
 
      if (currentPracticePath) await sidecarApi.updatePracticeScore(currentPracticePath, score); 
      loadPastPractices(); 
      loadAnalytics();
      setView('results'); 
    }
  }

  const calculateScore = () => {
   let correct = 0;
   const total = questions.length;
   questions.forEach(q => {
    if (gradedAnswers[q.id] === true) correct++;
   });
   return {score: Math.round((correct / (total || 1)) * 100), correct, total};
  }

 const resetSession = () => {setQuestions([]); setView('dashboard');}
 const handleSelectAnswer = (val: any) => {if (!isRevealed) setUserAnswers(prev => ({...prev, [questions[currentQuestionIdx].id]: val}));}
 const handleDeletePractice = async (path: string) => {await sidecarApi.deletePractice(path); loadPastPractices();}

  const handleExplainMore = async () => {
    if (!currentQuestion) return
    setExplainOpen(true)
    setExplainLesson('')
    setExplainLoading(true)
    try {
      let formattedUserAnswer = '';
      const rawAns = userAnswers[currentQuestion.id];
      if (Array.isArray(rawAns)) {
        formattedUserAnswer = rawAns.join(', ');
      } else if (typeof rawAns === 'object' && rawAns !== null) {
        formattedUserAnswer = JSON.stringify(rawAns);
      } else if (rawAns !== undefined && rawAns !== null) {
        formattedUserAnswer = String(rawAns);
      }

      const res = await sidecarApi.explainQuestion({
        question: currentQuestion.question,
        type: currentQuestion.type,
        answer: (currentQuestion as any).answer,
        explanation: currentQuestion.explanation,
        context: (currentQuestion as any).content || (currentQuestion as any).codeSnippet || '',
        userAnswer: formattedUserAnswer
      })
      setExplainLesson(res.lesson)
    } catch (e: any) {
      setExplainLesson(`**Error:** ${e.message || 'Failed to generate lesson. Please check your API key in Settings.'}`)
    } finally {
      setExplainLoading(false)
    }
  }

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

  const applyPreset = (key: string) => {
    const p = PRESETS[key]
    if (!p) return
    const { label: _l, ...dist } = p
    setAdvancedConfig(prev => ({ ...prev, questionDistribution: { ...ZERO_DISTRIBUTION, ...dist } }))
  }

  const randomizeDistribution = () => {
    const types = Object.keys(ZERO_DISTRIBUTION) as (keyof typeof ZERO_DISTRIBUTION)[]
    const count = Math.floor(Math.random() * 4) + 3  // 3-6 active types
    const shuffled = [...types].sort(() => Math.random() - 0.5).slice(0, count)
    const dist = { ...ZERO_DISTRIBUTION }
    let remaining = Math.floor(Math.random() * 10) + 10  // 10-20 total
    shuffled.forEach((t, i) => {
      const share = i === shuffled.length - 1 ? remaining : Math.max(1, Math.floor(Math.random() * (remaining / (shuffled.length - i) * 1.5)))
      dist[t] = Math.min(share, remaining)
      remaining = Math.max(0, remaining - dist[t])
    })
    setAdvancedConfig(prev => ({ ...prev, questionDistribution: dist }))
    toast.success('Randomized!')
  }

  const handleReviewDueCards = async () => {
    if (!selectedHub) { toast.error("Select a topic first."); return; }
    setIsLoading(true);
    setView('loading');
    try {
      // Fetch and cache FSRS cards state
      const cacheRes = await sidecarApi.srsCards();
      const cacheMap: Record<string, any> = {};
      if (cacheRes && Array.isArray(cacheRes.cards)) {
        cacheRes.cards.forEach((c: any) => {
          cacheMap[c.note_path] = c;
        });
      }
      setSrsCardsCache(cacheMap);
      setUnlockedNotes(new Set());
      setFeynmanExplanation('');
      setFeynmanError(null);

      // If selectedHub === "all", srsDue is called without params
      const dueRes = selectedHub === "all" ? await sidecarApi.srsDue() : await sidecarApi.srsDue(selectedHub);
      if (!dueRes.due_cards || dueRes.due_cards.length === 0) {
        toast.info("No cards are due right now!");
        setView('dashboard');
        return;
      }
      
      let duePaths = dueRes.due_cards.map((c: any) => c.note_path);
      // Shuffle the array of returned note paths in JS if hub is "all"
      if (selectedHub === "all") {
        duePaths = [...duePaths].sort(() => Math.random() - 0.5);
      }

      const cleanDistribution = Object.fromEntries(
         Object.entries(advancedConfig.questionDistribution).filter(([k]) => 
         ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(k)
         )
      );

      const res = await sidecarApi.generatePractice(selectedHub, {
         ...advancedConfig,
         selectedAtomicNotes: duePaths,
         hubId: selectedHub,
         questionDistribution: cleanDistribution 
      });

      if (!res.questions || res.questions.length === 0) {
         toast.error('No content generated for due cards.');
         setView('dashboard');
         return;
      }
      
      setTimeout(() => {
         setQuestions(res.questions); 
         setCurrentPracticePath(res.quiz_path); 
         setCurrentQuestionIdx(0); 
         setUserAnswers({}); 
         setIsRevealed(false); 
         setGradedAnswers({}); 
         setStreak(0); setBookmarked(new Set());
         setView('session');
         (window as any).__practiceStartTime = Date.now();
         if (advancedConfig.globalTimeLimitMinutes) setGlobalTimeLeft(advancedConfig.globalTimeLimitMinutes * 60);
         if (advancedConfig.perQuestionTimeLimitSeconds) setQuestionTimeLeft(advancedConfig.perQuestionTimeLimitSeconds);
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Error generating practice from due cards");
      setView('dashboard');
    } finally {
      setIsLoading(false);
    }
  }

 // ──────────────────────────────────────────────────────────────────────────
 // DASHBOARD RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'dashboard') {
 const getModalityScore = (types: string[]) => {
   let sum = 0;
   let count = 0;
   types.forEach(t => {
     if (analytics.modalities[t] !== undefined) {
       sum += analytics.modalities[t];
       count++;
     }
   });
   return count > 0 ? Math.round((sum / count) * 100) : 0;
 };
 const hasLogs = Object.keys(analytics.modalities).length > 0;

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
 <div className="flex flex-row items-center justify-between gap-4">
 <div className="flex bg-muted/5 p-1 rounded-none border border-border w-auto">
 <button onClick={() => setView('dashboard')} className={cn("flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none ", view === 'dashboard' ? "bg-muted/20 text-foreground border border-border" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/5")}>Dashboard</button>
 <button onClick={() => setView('history' as any)} className={cn("flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none ", (view as string) === 'history' ? "bg-muted/20 text-foreground border border-border" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/5")}>History</button>
 <button onClick={() => { setView('vault' as any); if (selectedHub) loadVaultFiles(selectedHub) }} className={cn("flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none flex items-center gap-1", (view as string) === 'vault' ? "bg-muted/20 text-foreground border border-border" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/5")}><BookOpen size={10}/>Reference Vault</button>
 </div>
 <div className="flex gap-2 w-auto">
 <Button onClick={handleReviewDueCards} className="h-9 flex-none px-6 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-none font-black uppercase tracking-widest text-[9px]"><FlameKindling size={10} className="mr-1"/>Review Due</Button>
 <Button onClick={() => setView('configuring')} className="h-9 flex-none px-6 bg-muted/5 border border-border hover:border-foreground/50 text-foreground rounded-none font-black uppercase tracking-widest text-[9px] ">Custom</Button>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div className="p-6 bg-muted/5 border border-border rounded-none flex flex-col gap-1">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Average Score</span>
 <span className="text-2xl font-black tracking-tight">{totalPrecision}%</span>
 </div>
 <div className="p-6 bg-muted/5 border border-border rounded-none flex flex-col gap-1">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Total Practices</span>
 <span className="text-2xl font-black tracking-tight">{pastPractices.length}</span>
 </div>
 <div className="p-6 bg-muted/5 border border-border rounded-none flex flex-col gap-1">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Stability</span>
 <span className="text-2xl font-black tracking-tight uppercase text-foreground">{stability}</span>
 </div>
 </div>

 <div className="flex flex-col gap-8">
 <div className="grid grid-cols-2 gap-8">
 <div className="p-8 bg-muted/5 border border-border rounded-none space-y-6">
 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Trend</h3>
 <div className="w-full h-64">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={validPractices.slice(-10).map((p, i) => ({name: i + 1, score: parseInt(p.score) || 0}))}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.1)" />
 <XAxis dataKey="name" hide />
 <YAxis domain={[0, 100]} hide />
 <Tooltip contentStyle={{backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '10px'}} />
 <Line type="monotone" dataKey="score" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{r: 2, fill: 'hsl(var(--background))'}} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="p-8 bg-muted/5 border border-border rounded-none space-y-8">
 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2">
 <span>Cognitive Modalities</span>
 {!hasLogs && (
 <span className="text-[8px] font-medium tracking-normal text-muted-foreground/30 normal-case">
 (No practice logs yet. Start practicing to generate telemetry)
 </span>
 )}
 </h3>
 <div className="grid grid-cols-3 gap-x-12 gap-y-8">
 {[
 {type: 'Choice (MCQ/TF)', p: getModalityScore(['mcq', 'true_false'])},
 {type: 'Synthesis & Analysis', p: getModalityScore(['synthesis', 'scenario'])},
 {type: 'Logic & State Trace', p: getModalityScore(['trace'])},
 {type: 'Sequence & Order', p: getModalityScore(['order'])},
 {type: 'Debug & Extraction', p: getModalityScore(['debug'])},
 {type: 'Relational Matching', p: getModalityScore(['matching'])},
 {type: 'Technical Fill-in', p: getModalityScore(['fill_in'])},
 {type: 'Edge Case Mastery', p: getModalityScore(['calculation', 'data_analysis'])},
 {type: 'Industrial Application', p: getModalityScore(['code'])}
 ].map((stat, i) => (
 <div key={i} className="space-y-3">
 <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em]">
 <span className="text-muted-foreground/40">{stat.type}</span>
 <span className="text-foreground/90">{stat.p}%</span>
 </div>
 <div className="h-1.5 bg-muted/20 rounded-none overflow-hidden">
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
 <div className="flex flex-row items-center justify-between gap-4">
 <div className="flex bg-muted/10 p-1 rounded-none border border-border/10 w-auto">
 <button onClick={() => setView('dashboard')} className={cn("flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none ", false ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground")}>Dashboard</button>
 <button onClick={() => setView('history')} className={cn("flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none ", true ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground")}>History</button>
 </div>
 <Button onClick={() => setView('configuring')} className="h-9 w-auto px-6 bg-primary text-primary-foreground rounded-none font-black uppercase tracking-widest text-[9px]">Start</Button>
 </div>

 <div className="space-y-4">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/10 pb-2">Past Sessions</h3>
 <div className="grid grid-cols-1 gap-2">
 {(Array.isArray(pastPractices) ? pastPractices : []).slice().reverse().map((p, i) => (
 <div key={i} onClick={() => handleResumePractice(p.path)} className="group p-4 bg-muted/5 border border-border rounded-none cursor-pointer  flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="text-[10px] font-black text-muted-foreground/40">{p.score}%</div>
 <div className="flex flex-col">
 <span className="text-xs font-black uppercase tracking-tight">{cleanTitle(p.hub_title || 'Untitled')}</span>
 <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{new Date(p.date).toLocaleDateString()}</span>
 </div>
 </div>
 <button onClick={(e) => {e.stopPropagation(); handleDeletePractice(p.path);}} className="p-1.5 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 "><Trash2 size={12}/></button>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

 // ──────────────────────────────────────────────────────────────────────────
 // REFERENCE VAULT RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if ((view as string) === 'vault') {
  const MODES = [
   { id: 'vault_only', label: 'All Questions', icon: <BookOpen size={11}/>, desc: 'Every extracted question from selected sources' },
   { id: 'hard_only', label: 'Hard Only', icon: <FlameKindling size={11}/>, desc: 'Only L3 & L4 difficulty questions' },
   { id: 'ai_variants', label: 'AI Variants', icon: <Zap size={11}/>, desc: 'AI generates harder versions of real questions' },
   { id: 'weak_spots', label: 'Weak Spots', icon: <Target size={11}/>, desc: 'Focus on your historically worst question types' },
   { id: 'exam_sim', label: 'Exam Simulation', icon: <Trophy size={11}/>, desc: 'Random sample mimicking real exam conditions' },
  ]
  return (
   <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground overflow-y-auto custom-scrollbar p-10 space-y-8">
 <div className="flex flex-row items-center justify-between gap-4">
 <div className="flex bg-muted/5 p-1 rounded-none border border-border w-auto">
 <button onClick={() => setView('dashboard')} className="flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none text-muted-foreground/40 hover:text-foreground hover:bg-muted/5">Dashboard</button>
 <button onClick={() => setView('history' as any)} className="flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none text-muted-foreground/40 hover:text-foreground hover:bg-muted/5">History</button>
 <button className="flex-none px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-none bg-muted/20 text-foreground border border-border flex items-center gap-1"><BookOpen size={10}/>Reference Vault</button>
 </div>
 <Button onClick={() => setView('configuring')} className="h-9 w-auto px-6 bg-muted/5 border border-border hover:border-foreground/50 text-foreground rounded-none font-black uppercase tracking-widest text-[9px]">New Session</Button>
 </div>
    <div className="grid grid-cols-3 gap-6">
     <div className="col-span-1 space-y-4">
      <div className="p-4 bg-muted/5 border border-border rounded-none space-y-3">
       <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Hub</div>
       <Select value={selectedHub} onValueChange={(val: string) => { setSelectedHub(val); loadVaultFiles(val) }}>
        <SelectTrigger className="w-full h-9 bg-muted/5 border-border rounded-none px-3 text-[10px] font-black uppercase tracking-tight"><SelectValue placeholder="Select Hub..." /></SelectTrigger>
        <SelectContent className="border-border bg-popover">{hubs.map(hub => <SelectItem key={hub.id} value={hub.id} className="text-[10px] font-black uppercase tracking-tight">{cleanTitle(hub.title)}</SelectItem>)}</SelectContent>
       </Select>
      </div>
      <div className="p-4 bg-muted/5 border border-border rounded-none space-y-3">
       <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Add Source Text</div>
       <input value={vaultSourceName} onChange={e => setVaultSourceName(e.target.value)} placeholder="Source name (e.g. Midterm 2024)"
        className="w-full px-3 py-2 bg-background border border-border/40 rounded-none text-[10px] font-medium focus:outline-none focus:border-foreground/30"/>
       <textarea value={vaultSourceText} onChange={e => setVaultSourceText(e.target.value)}
        placeholder="Paste exam questions, worksheet text here..." rows={5}
        className="w-full px-3 py-2 bg-background border border-border/40 rounded-none text-[10px] font-medium focus:outline-none focus:border-foreground/30 resize-y"/>
       <Button onClick={handleVaultUploadText} disabled={vaultLoading || !vaultSourceText.trim() || !vaultSourceName.trim()} className="w-full h-9 font-black uppercase tracking-widest text-[9px]">
        {vaultLoading ? <>{vaultStatus || 'Processing...'}</> : 'Extract & Solve Questions'}
       </Button>
      </div>
     </div>
     <div className="col-span-2 space-y-4">
      <div className="p-4 bg-muted/5 border border-border rounded-none space-y-3">
       <div className="flex items-center justify-between">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Question Banks</div>
        <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">{vaultSelectedFiles.length} selected</span>
       </div>
       {vaultFiles.length === 0 ? (
        <div className="py-8 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">{selectedHub ? 'No vaults yet — upload a source above' : 'Select a hub first'}</div>
       ) : (
        <div className="space-y-2">
         {vaultFiles.map((vf: any) => {
          const isSel = vaultSelectedFiles.includes(vf.path)
          return (
           <button key={vf.path} onClick={() => setVaultSelectedFiles(prev => isSel ? prev.filter(p => p !== vf.path) : [...prev, vf.path])}
            className={cn("w-full text-left p-3 border rounded-none flex items-center justify-between transition-none", isSel ? "border-foreground/40 bg-foreground/5" : "border-border/40 bg-muted/5 hover:border-foreground/20")}>
            <div className="flex items-center gap-3">
             <div className={cn("w-4 h-4 rounded-none border flex items-center justify-center", isSel ? "bg-foreground border-foreground" : "border-border/40")}>{isSel && <Check size={10} className="text-background"/>}</div>
             <div><div className="text-[10px] font-black uppercase tracking-tight">{vf.name}</div><div className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">{vf.total_questions} questions</div></div>
            </div>
            <FileText size={12} className="text-muted-foreground/20"/>
           </button>
          )
         })}
        </div>
       )}
      </div>
      {vaultFiles.length > 0 && (
       <div className="p-4 bg-muted/5 border border-border rounded-none space-y-4">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Practice Mode</div>
        <div className="grid grid-cols-2 gap-2">
         {MODES.map(m => (
          <button key={m.id} onClick={() => setVaultMode(m.id as any)}
           className={cn("p-3 border rounded-none text-left transition-none", vaultMode === m.id ? "border-foreground/40 bg-foreground/5" : "border-border/40 hover:border-foreground/20 hover:bg-muted/5")}>
           <div className="flex items-center gap-2 mb-1">
            <span className="text-muted-foreground/60">{m.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-tight">{m.label}</span>
            {vaultMode === m.id && <div className="ml-auto w-1.5 h-1.5 rounded-none bg-foreground"/>}
           </div>
           <p className="text-[8px] text-muted-foreground/40 leading-relaxed">{m.desc}</p>
          </button>
         ))}
        </div>
        <Button onClick={handleVaultPracticeGenerate} disabled={vaultLoading || vaultSelectedFiles.length === 0} className="w-full h-10 font-black uppercase tracking-widest text-[9px]">
         {vaultLoading ? <>Generating...</> : <>Practice from Vault <ArrowRight size={13} className="ml-2"/></>}
        </Button>
       </div>
      )}
     </div>
    </div>
   </div>
  )
 }

 // ──────────────────────────────────────────────────────────────────────────
 // CONFIGURATION RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'configuring') {
 const totalQuestions = Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0)
  return (
  <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground overflow-hidden p-6">
 <div className="flex items-center justify-between mb-8">
 <button onClick={() => setView('dashboard')} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded-none bg-muted/5 ">Cancel</button>
 <div className="text-xl font-black tracking-tight">{totalQuestions} Questions</div>
 </div>

 <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
   <div className="col-span-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
    <div className="p-4 bg-muted/5 border border-border rounded-none space-y-5">
     
     <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Hub</Label>
      <Select value={selectedHub} onValueChange={(val: string) => {setSelectedHub(val); loadHubNotes(val);}}>
       <SelectTrigger className="w-full h-10 bg-muted/5 border-border rounded-none px-4 text-[10px] font-black uppercase tracking-tight hover:border-foreground/20 "><SelectValue placeholder="Select Topic..." /></SelectTrigger>
       <SelectContent className="border-border bg-popover">
          <SelectItem value="all" className="text-[10px] font-black uppercase tracking-tight text-primary">Global Interleaved (All Topics)</SelectItem>
          {hubs.map(hub => (<SelectItem key={hub.id} value={hub.id} className="text-[10px] font-black uppercase tracking-tight">{cleanTitle(hub.title)}</SelectItem>))}
       </SelectContent>
      </Select>
     </div>

     <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Difficulty</Label>
      <RadioGroup value={advancedConfig.difficulty} onValueChange={(val: string) => setAdvancedConfig(prev => ({...prev, difficulty: val as any}))} className="grid grid-cols-4 gap-1">
       {[ {val: 'L1', label: '1'}, {val: 'L2', label: '2'}, {val: 'L3', label: '3'}, {val: 'Mixed', label: 'M'} ].map((level) => (
        <div key={level.val}><RadioGroupItem value={level.val} id={level.val} className="peer sr-only" /><Label htmlFor={level.val} className="flex h-10 border border-border rounded-none bg-muted/5 peer-data-[state=checked]:bg-foreground/10 peer-data-[state=checked]:border-foreground peer-data-[state=checked]:text-foreground items-center justify-center cursor-pointer text-[10px] font-black hover:bg-muted/10">{level.label}</Label></div>
       ))}
      </RadioGroup>
     </div>

     <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Notes</Label>
      <Popover>
       <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-10 border-border bg-muted/5 text-[10px] font-black uppercase px-4 justify-between hover:bg-muted/10 ">
         <span>{advancedConfig.selectedAtomicNotes.length} Selected</span>
         <Layers size={12} className="opacity-40" />
        </Button>
       </PopoverTrigger>
       <PopoverContent className="w-[300px] p-0 rounded-none border border-border bg-popover overflow-hidden" align="start">
        <Command className="bg-transparent">
         <div className="p-3 border-b border-border flex justify-between items-center bg-muted/10">
          <span className="text-[8px] font-black uppercase text-muted-foreground/40">{availableNotes.length} Total</span>
          <Button variant="ghost" size="default" className="h-7 text-[8px] font-black uppercase" onClick={() => {if (advancedConfig.selectedAtomicNotes.length === availableNotes.length) {setAdvancedConfig(prev => ({...prev, selectedAtomicNotes: []}))} else {setAdvancedConfig(prev => ({...prev, selectedAtomicNotes: availableNotes.map(n => n.path)}))}}}>Toggle All</Button>
         </div>
         <CommandInput placeholder="Search..." className="h-10 text-[10px] font-black uppercase border-none" />
         <CommandList className="max-h-60 p-1">
          {availableNotes.map(note => {
           const isSelected = advancedConfig.selectedAtomicNotes.includes(note.path); 
           return (
            <CommandItem key={note.path} onSelect={() => toggleAtomicNote(note.path)} className="flex items-center gap-2 cursor-pointer py-2 px-3 rounded-none text-[9px] font-black uppercase">
             <div className={cn("w-3 h-3 border flex items-center justify-center rounded-none ", isSelected ? "bg-foreground border-foreground text-background" : "border-border")}>{isSelected && <Check size={8} />}</div>
             <span className="truncate">{note.title}</span>
            </CommandItem>
           ); 
          })}
         </CommandList>
        </Command>
       </PopoverContent>
      </Popover>
     </div>

     <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total (Min)</Label>
      <Select value={String(advancedConfig.globalTimeLimitMinutes || "null")} onValueChange={(val: string) => setAdvancedConfig(prev => ({...prev, globalTimeLimitMinutes: val === "null" ? null : parseInt(val)}))}>
       <SelectTrigger className="w-full h-10 bg-muted/5 border-border rounded-none px-4 text-[10px] font-black uppercase hover:border-foreground/20 "><SelectValue placeholder="No Limit" /></SelectTrigger>
       <SelectContent className="border-border bg-popover">{[null, 5, 10, 15, 30, 60].map(m => (<SelectItem key={String(m)} value={String(m)} className="text-[10px] font-black uppercase">{m ? `${m}m` : 'None'}</SelectItem>))}</SelectContent>
      </Select>
     </div>

     <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Per Q (Sec)</Label>
      <Select value={String(advancedConfig.perQuestionTimeLimitSeconds || "null")} onValueChange={(val: string) => setAdvancedConfig(prev => ({...prev, perQuestionTimeLimitSeconds: val === "null" ? null : parseInt(val)}))}>
       <SelectTrigger className="w-full h-10 bg-muted/5 border-border rounded-none px-4 text-[10px] font-black uppercase hover:border-foreground/20 "><SelectValue placeholder="No Limit" /></SelectTrigger>
       <SelectContent className="border-border bg-popover">{[null, 15, 30, 60, 120].map(s => (<SelectItem key={String(s)} value={String(s)} className="text-[10px] font-black uppercase">{s ? `${s}s` : 'None'}</SelectItem>))}</SelectContent>
      </Select>
     </div>

    </div>
   </div>

   <div className="col-span-3 p-6 bg-muted/5 border border-border rounded-none flex flex-col min-h-0">
    <div className="flex items-center justify-between border-b border-border pb-4 mb-4 gap-4">
     <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Question Types Distribution</h3>
     <div className="flex items-center gap-4">
      <div className="flex flex-wrap gap-1.5 justify-end">
       {Object.entries(PRESETS).map(([k, p]) => (
        <button key={k} onClick={() => applyPreset(k)} className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-muted/10 hover:bg-muted/20 border border-border text-muted-foreground hover:text-foreground transition-none" title={p.label}>
         {p.label}
        </button>
       ))}
      </div>
      <Button variant="outline" size="default" onClick={randomizeDistribution} className="h-7 px-2.5 text-[8px] font-black uppercase border-border/40 hover:bg-foreground/5"><Zap size={10} className="mr-1"/>Random</Button>
     </div>
    </div>
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 gap-x-6 gap-y-4 content-start">
     {[
     {key: 'mcq', label: 'Multiple Choice'}, 
     {key: 'true_false', label: 'True or False'}, 
     {key: 'writing', label: 'Writing / Essay'}, 
     {key: 'fill_in', label: 'Fill in the Blank'},
     {key: 'debug', label: 'Debugging / Error Finding'},
     {key: 'trace', label: 'Logic / Calculation Trace'},
     {key: 'order', label: 'Ordering / Steps'},
     {key: 'matching', label: 'Matching Pairs'},
     {key: 'synthesis', label: 'Synthesis / Scenario'},
     {key: 'calculation', label: 'Math / Calculation'},
     {key: 'data_analysis', label: 'Data Analysis'},
     {key: 'scenario', label: 'Scenario Analysis'},
     {key: 'code', label: 'Code / Implementation'}
     ].map(type => (
      <div key={type.key} className="space-y-2 p-2.5 bg-muted/5 border border-border/30 hover:border-border/60 transition-colors">
       <div className="flex justify-between items-center">
        <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{type.label}</Label>
        <span className="text-[9px] font-black tabular-nums">{advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]}</span>
       </div>
       <Slider value={[advancedConfig.questionDistribution[type.key as keyof AdvancedPracticeConfig['questionDistribution']]]} max={15} step={1} onValueChange={(vals: number[]) => updateDistribution(type.key as any, vals[0])} className="py-1" />
      </div>
     ))}
    </div>
    <Button onClick={handleStartSession} disabled={isLoading} className="h-10 w-full bg-foreground/5 border border-foreground/20 hover:border-foreground/50 hover:bg-muted/10 text-foreground text-[10px] font-black uppercase tracking-widest rounded-none mt-6 ">Start Session</Button>
   </div>
  </div>
 </div>
 );
}
 // LOADING RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'loading') {
 return <BlockingLoader label={genStatus} />
}

 // ──────────────────────────────────────────────────────────────────────────
 // SESSION RENDERER
 // ──────────────────────────────────────────────────────────────────────────
 if (view === 'session' && currentQuestion) {
  const progress = ((currentQuestionIdx + 1) / questions.length) * 100;

  // Calculate Feynman Lock properties
  const currentCardPath = currentQuestion ? currentQuestion.note_id : null;
  const currentCard = currentCardPath ? srsCardsCache[currentCardPath] : null;
  
  // R = (1 + t / (9 * s))^-1
  const getRetrievability = (card: any): number => {
    if (!card) return 1.0;
    const stability = Math.max(0.01, card.stability || 0);
    if (!card.last_review) return 1.0;
    
    const lastReviewTime = new Date(card.last_review).getTime();
    const now = Date.now();
    const elapsedMs = Math.max(0, now - lastReviewTime);
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    
    return Math.pow(1 + elapsedDays / (9 * stability), -1);
  };
  
  const retrievability = currentCard ? getRetrievability(currentCard) : 1.0;
  const lapses = currentCard ? (currentCard.lapses || 0) : 0;
  
  const isFeynmanLocked = currentCardPath && 
    (lapses >= 3 || retrievability < 0.70) && 
    !unlockedNotes.has(currentCardPath);

 return (
 <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden relative">
    {/* ── Feynman Gate Locked Overlay ── */}
    {isFeynmanLocked && (
      <div className="absolute inset-0 z-40 bg-background/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="max-w-xl w-full border border-border bg-background p-8 rounded-none space-y-6 shadow-2xl relative">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <BrainCircuit className="text-primary shrink-0" size={24} />
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Cognitive Lock Engaged</h3>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">FSRS Telemetry: Memory Decay Detected</p>
            </div>
            <div className="ml-auto bg-destructive/10 border border-destructive/20 text-destructive text-[8px] font-black uppercase tracking-widest px-2.5 py-1">
              Locked
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-muted/5 border border-border/40 rounded-none flex flex-col gap-0.5">
              <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Retrievability</span>
              <span className={cn("text-xs font-black tracking-tight", retrievability < 0.70 ? "text-destructive" : "text-foreground")}>
                {(retrievability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 bg-muted/5 border border-border/40 rounded-none flex flex-col gap-0.5">
              <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Stability</span>
              <span className="text-xs font-black tracking-tight text-foreground">
                {currentCard?.stability ? `${currentCard.stability.toFixed(2)}d` : '0d'}
              </span>
            </div>
            <div className="p-3 bg-muted/5 border border-border/40 rounded-none flex flex-col gap-0.5">
              <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Lapses</span>
              <span className={cn("text-xs font-black tracking-tight", lapses >= 3 ? "text-destructive" : "text-foreground")}>
                {lapses}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">The Feynman Challenge</h4>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Your memory weights for <strong className="text-foreground">{cleanTitle(currentQuestion.note_title || currentCardPath)}</strong> indicate high fading. Write a clear, comprehensive explanation of this topic in your own words to unlock.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              value={feynmanExplanation}
              onChange={(e) => setFeynmanExplanation(e.target.value)}
              disabled={isFeynmanValidating}
              rows={5}
              placeholder="Explain the core concepts, mechanisms, and rules of this topic..."
              className="w-full p-4 bg-muted/5 border border-border rounded-none text-xs font-medium focus:ring-1 focus:ring-primary/20 focus:border-primary/40 outline-none placeholder:opacity-20 resize-none"
            />

            {feynmanError && (
              <div className="p-4 bg-destructive/5 border border-destructive/20 text-destructive text-[10px] font-bold rounded-none space-y-2">
                <span className="uppercase tracking-widest text-[8px] font-black text-destructive/40 block">Unlocking Failed</span>
                <p>{feynmanError}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={resetSession}
              disabled={isFeynmanValidating}
              className="h-10 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded-none"
            >
              Exit Session
            </Button>
            <Button
              onClick={async () => {
                if (!feynmanExplanation.trim()) {
                  toast.error("Please write an explanation first.");
                  return;
                }
                setIsFeynmanValidating(true);
                setFeynmanError(null);
                try {
                  const res = await sidecarApi.srsFeynmanValidate(currentCardPath, feynmanExplanation);
                  if (res.success) {
                    toast.success("Cognitive Lock Unlocked! Memory weights successfully sync'd.");
                    setUnlockedNotes(prev => {
                      const next = new Set(prev);
                      next.add(currentCardPath);
                      return next;
                    });
                    setFeynmanExplanation('');
                    // Update card in local FSRS cache with rating 3 (Good)
                    setSrsCardsCache(prev => ({
                      ...prev,
                      [currentCardPath]: {
                        ...prev[currentCardPath],
                        lapses: 0,
                        stability: prev[currentCardPath] ? prev[currentCardPath].stability * 1.5 : 1.5,
                        last_review: new Date().toISOString()
                      }
                    }));
                  } else {
                    if (res.missing_keywords && res.missing_keywords.length > 0) {
                      setFeynmanError(`Missing mandatory concepts: ${res.missing_keywords.join(', ')}`);
                    } else if (res.error) {
                      setFeynmanError(res.error);
                    } else {
                      setFeynmanError("Validation failed. Please verify your explanation covers all key concepts.");
                    }
                  }
                } catch (e: any) {
                  setFeynmanError(e.message || "Failed to validate explanation.");
                } finally {
                  setIsFeynmanValidating(false);
                }
              }}
              disabled={isFeynmanValidating || !feynmanExplanation.trim()}
              className="h-10 flex-1 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest rounded-none"
            >
              {isFeynmanValidating ? "Analyzing Telemetry..." : "Validate & Unlock"}
            </Button>
          </div>
        </div>
      </div>
    )}
 {/* ── Explain More Modal ── */}
 {explainOpen && (
   <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)'}}>
     <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col bg-background border border-border/40 rounded-none shadow-2xl overflow-hidden">
       <div className="flex items-start justify-between px-6 py-5 border-b border-border/20 gap-4">
         <div className="min-w-0">
           <div className="text-[8px] font-black uppercase tracking-[0.35em] text-primary/50 mb-1">Deep Lesson</div>
           <div className="text-sm font-black tracking-tight text-foreground/85 leading-snug line-clamp-2">{currentQuestion.question}</div>
         </div>
         <button onClick={() => setExplainOpen(false)} className="shrink-0 p-1.5 rounded-none hover:bg-muted/20 text-muted-foreground/30 hover:text-foreground transition-none mt-0.5"><X size={15}/></button>
       </div>
       <div ref={explainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
         {explainLoading ? (
           <div className="flex flex-col items-center justify-center py-20 gap-4">
             <MiniLoader label="Generating Lesson" />
           </div>
         ) : (
           <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
             <MarkdownBlock content={explainLesson} />
           </div>
         )}
       </div>
       <div className="px-6 py-4 border-t border-border/10">
         <button onClick={() => setExplainOpen(false)} className="w-full h-10 bg-muted/5 border border-border/20 hover:border-foreground/20 text-foreground/50 hover:text-foreground text-[9px] font-black uppercase tracking-widest rounded-none transition-none">Close Lesson</button>
       </div>
     </div>
   </div>
 )}
 <div className="px-8 py-3 border-b border-border flex flex-row items-center justify-between gap-3">
 <div className="flex flex-row items-center gap-8 w-auto">
 <div className="flex flex-col gap-0.5">
 <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Practice</span>
 <div className="text-xs font-black uppercase tracking-tight truncate max-w-[200px]">{cleanTitle(hubs.find(h => h.id === selectedHub)?.title || '')}</div>
 </div>
 <div className="flex-1 w-64 h-1 bg-muted/20 rounded-none overflow-hidden">
 <div className="h-full bg-primary" style={{width: `${progress}%`}} />
 </div>
 </div>
 <div className="flex items-center justify-end w-auto gap-6 text-[9px] font-black uppercase tracking-widest">
 {globalTimeLeft !== null && (
 <div className="flex flex-col items-end gap-0.5">
 <span className="text-muted-foreground/20 text-[7px]">Total</span>
  <div className={cn("px-2 py-0.5 rounded-none border", globalTimeLeft < 60 ? "border-destructive text-destructive" : "border-border text-muted-foreground/60")}>
 {Math.floor(globalTimeLeft / 60)}:{String(globalTimeLeft % 60).padStart(2, '0')}
 </div>
 </div>
 )}
 {questionTimeLeft !== null && (
 <div className="flex flex-col items-end gap-0.5">
 <span className="text-muted-foreground/20 text-[7px]">Q-Time</span>
  <div className={cn("px-2 py-0.5 rounded-none border", questionTimeLeft < 10 ? "border-destructive text-destructive" : "border-border text-primary")}>
 {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
 </div>
 </div>
 )}
 <div className="flex flex-col items-end gap-0.5">
 <span className="text-muted-foreground/20 text-[7px]">Progress</span>
  <div className="px-2 py-0.5 rounded-none border border-border">{currentQuestionIdx + 1} / {questions.length}</div>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-8 px-10">
 <div className="max-w-3xl w-full space-y-8">
 <div className="space-y-4">
 <div className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-2">
 <Badge variant="outline" className="text-[8px] border-primary/20 bg-primary/5 text-primary rounded-none px-1.5 py-0">{currentQuestion.difficulty || '1'}</Badge>
 <div className="w-1 h-1 rounded-none bg-primary/20" />
 <span>{(
      {
          'mcq': 'Multiple Choice',
          'true_false': 'True or False',
          'writing': 'Writing / Essay',
          'fill_in': 'Fill in the Blank',
          'debug': 'Debugging / Error Finding',
          'trace': 'Logic / Calculation Trace',
          'order': 'Ordering / Steps',
          'matching': 'Matching Pairs',
          'synthesis': 'Synthesis / Scenario',
          'calculation': 'Math / Calculation',
          'data_analysis': 'Data Analysis',
          'scenario': 'Scenario Analysis',
          'code': 'Code / Implementation'
      } as any)[currentQuestion.type as string] || (currentQuestion.type || '').replace('_', ' ')
  } MODE</span>
  <button onClick={() => toggleBookmark(currentQuestionIdx)} className={cn("ml-auto transition-none", bookmarked.has(currentQuestionIdx) ? "text-primary" : "text-muted-foreground/20 hover:text-foreground")} title="Bookmark Question">
    <Bookmark size={14} className={bookmarked.has(currentQuestionIdx) ? "fill-primary" : ""} />
  </button>
 </div>
 <div className="text-2xl font-black tracking-tight leading-snug text-foreground/90"><MarkdownBlock content={currentQuestion.question} /></div>
 </div>

 <div className="space-y-6">
 {currentQuestion.type === 'mcq' && (
  <div className="grid grid-cols-1 gap-2">
  {Object.entries(currentQuestion.options || {}).map(([key, val]) => {
  const isSelected = userAnswers[currentQuestion.id] === key; 
  const isCorrect = isRevealed && (key === currentQuestion.answer || String(val).toLowerCase() === String(currentQuestion.answer).toLowerCase());
  const isWrongSelected = isRevealed && isSelected && !isCorrect;
  return (
  <button 
    key={key} 
    disabled={isRevealed} 
    onClick={() => handleSelectAnswer(key)} 
    className={cn(
      "p-4 border rounded-none text-left text-sm font-bold flex items-start w-full transition-all duration-150",
      isCorrect 
        ? "bg-primary/10 border-primary text-primary" 
        : isWrongSelected 
          ? "bg-destructive/10 border-destructive text-destructive" 
          : isRevealed 
            ? "border-border opacity-30 grayscale" 
            : isSelected 
              ? "bg-muted/30 border-foreground text-foreground" 
              : "border-border hover:bg-muted/10 text-foreground"
    )}
  >
  <span className={cn("shrink-0 mt-0.5 mr-3 px-2 py-0.5 border text-xs font-bold", isSelected ? "border-foreground bg-foreground/10 text-foreground" : "border-border text-muted-foreground/50")}>{key}</span>
  <div className="flex-1 overflow-x-auto"><MarkdownBlock content={String(val)} /></div>
  </button>
  );
})}
  </div>
 )}

 {(!currentQuestion.type || ['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(currentQuestion.type)) && (
  <div className="space-y-6">
  {['debug', 'code'].includes(currentQuestion.type) && (currentQuestion.content || currentQuestion.codeSnippet) && <div className="p-1 border border-border rounded-none bg-muted/5"><MarkdownBlock content={`\`\`\`${currentQuestion.language || 'text'}\n${currentQuestion.content || currentQuestion.codeSnippet}\n\`\`\``} /></div>}
  {['trace', 'calculation', 'data_analysis', 'scenario', 'synthesis', 'writing'].includes(currentQuestion.type) && (currentQuestion.content) && <div className="p-4 border border-border/10 rounded-none bg-muted/5 text-sm text-foreground/80"><MarkdownBlock content={currentQuestion.content} /></div>}
  <textarea rows={6} disabled={isRevealed} className="w-full p-4 bg-muted/5 border-2 border-border rounded-none text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none placeholder:opacity-20" placeholder="Synthesize your technical analysis here..." value={userAnswers[currentQuestion.id] || ""} onChange={(e) => handleSelectAnswer(e.target.value)} />
  {isRevealed && (
    <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-none space-y-2">
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">Correct Answer</div>
      <div className="text-xs font-bold leading-relaxed text-foreground/90 whitespace-pre-wrap"><MarkdownBlock content={String(currentQuestion.answer || '')} /></div>
    </div>
  )}
  </div>
  )}

  {currentQuestion.type === 'true_false' && (
  <div className="grid grid-cols-2 gap-4">
  {['True', 'False'].map(v => {
  const isSelected = userAnswers[currentQuestion.id] === v; 
  const isCorrect = isRevealed && v.toLowerCase() === String(currentQuestion.answer).toLowerCase(); 
  const isWrongSelected = isRevealed && isSelected && !isCorrect;
  return (
  <button 
    key={v} 
    disabled={isRevealed} 
    onClick={() => handleSelectAnswer(v)} 
    className={cn(
      "h-24 border rounded-none text-xs font-bold uppercase tracking-widest transition-all duration-150", 
      isCorrect 
        ? "bg-primary/10 border-primary text-primary font-extrabold ring-1 ring-inset ring-primary" 
        : isWrongSelected 
          ? "bg-destructive/10 border-destructive text-destructive ring-1 ring-inset ring-destructive" 
          : isRevealed 
            ? "border-border opacity-30 grayscale text-muted-foreground/40" 
            : isSelected 
              ? "bg-muted/30 border-foreground text-foreground ring-1 ring-inset ring-foreground" 
              : "border-border hover:bg-muted/10 text-foreground/80"
    )}
  >
    {v}
  </button>
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
             "flex items-center gap-4 p-3 border rounded-none ",
             isCorrect ? "border-primary bg-primary/5" : isWrong ? "border-destructive/20 bg-destructive/5" : "border-border bg-muted/5 hover:border-foreground/20"
         )}>
             <div className="flex flex-col gap-1.5 border-r border-border/10 pr-4">
                 <button disabled={isRevealed || i===0} onClick={moveUp} className="text-xs p-1 opacity-20 hover:opacity-100 hover:text-primary  disabled:opacity-0">▲</button>
                 <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-xs p-1 opacity-20 hover:opacity-100 hover:text-primary  disabled:opacity-0">▼</button>
             </div>
             <div className="text-sm font-bold tracking-tight text-foreground/80 pl-1">{step}</div>
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
             "flex items-center gap-4 p-3 border rounded-none ",
             isCorrect ? "border-primary bg-primary/5" : isWrong ? "border-destructive/20 bg-destructive/5" : "border-border bg-muted/5 hover:border-foreground/20"
         )}>
             <div className="flex-1 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground/60">{pair.left}</div>
             <div className="flex-1">
                 <select disabled={isRevealed} value={selected} onChange={(e) => handleSelectAnswer({...userAnswers[currentQuestion.id], [pair.left]: e.target.value})} className="w-full p-3 bg-muted/5 hover:bg-muted/10 border-2 border-foreground/30 focus:border-primary rounded-none outline-none text-xs font-bold text-foreground cursor-pointer transition-colors">
                     <option value="">Select match...</option>
                     {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                 </select>
             </div>
             {isRevealed && isWrong && (
                <div className="flex-1">
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
  <div className="p-5 bg-muted/5 border border-border/10 rounded-none text-base font-medium leading-relaxed flex flex-wrap items-center gap-y-3">
 {(() => {
 const parts = (currentQuestion.textWithBlanks || '').split(/\[\[.*?\]\]/);
 return parts.map((part: string, i: number) => (
 <React.Fragment key={i}>
 <div className="inline-block align-middle"><MarkdownBlock content={part} variant="inline" /></div>
 {i < parts.length - 1 && (
 <div className="inline-flex flex-col items-center">
   <input 
      type="text" 
      disabled={isRevealed} 
      value={(userAnswers[currentQuestion.id] || [])[i] || ''} 
      onChange={(e) => {
        const newAns = [...(userAnswers[currentQuestion.id] || [])]; 
        newAns[i] = e.target.value; 
        handleSelectAnswer(newAns);
      }} 
      className={cn(
        "mx-2 border-b-2 bg-foreground/5 hover:bg-foreground/10 outline-none w-36 focus:w-40 text-center text-sm font-bold uppercase shrink-0 px-2 py-0.5 transition-all duration-150", 
        isRevealed 
          ? (String((userAnswers[currentQuestion.id] || [])[i] || '').trim().toLowerCase() === String((currentQuestion.answer || [])[i] || '').trim().toLowerCase() 
            ? "border-primary bg-primary/10 text-primary" 
            : "border-destructive bg-destructive/10 text-destructive") 
          : "border-foreground/50 focus:border-primary text-foreground"
      )} 
    />
   {isRevealed && String((userAnswers[currentQuestion.id] || [])[i] || '').trim().toLowerCase() !== String((currentQuestion.answer || [])[i] || '').trim().toLowerCase() && (
     <div className="text-[10px] text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 font-black uppercase mt-1 tracking-wider whitespace-nowrap">Correct: {String((currentQuestion.answer || [])[i] || '')}</div>
   )}
 </div>
 )}
 </React.Fragment>
 ));
})()}
 </div>
 )}

   {isRevealed && currentQuestion.explanation && (
     <div className="p-5 border border-border/10 rounded-none bg-muted/5 text-[13px] font-medium text-muted-foreground/80 italic leading-relaxed   ">
         <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mb-2 not-italic">Explanation</div>
         <MarkdownBlock content={currentQuestion.explanation} />
     </div>
   )}

  {isRevealed && ['writing', 'scenario', 'code', 'debug', 'synthesis', 'trace'].includes(currentQuestion.type) && Array.isArray(currentQuestion.required_keywords) && currentQuestion.required_keywords.length > 0 && (
    <div className="p-8 border border-border/10 rounded-none bg-muted/5 space-y-4   ">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Mandatory Concepts Checklist</div>
        <div className="text-[10px] font-black tabular-nums text-muted-foreground/50">
          {currentQuestion.required_keywords.filter((kw: string) => String(userAnswers[currentQuestion.id] || '').toLowerCase().includes(kw.toLowerCase())).length} / {currentQuestion.required_keywords.length} Found
        </div>
      </div>
      
      {currentQuestion.required_keywords.filter((kw: string) => !String(userAnswers[currentQuestion.id] || '').toLowerCase().includes(kw.toLowerCase())).length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-none text-sm font-bold text-destructive/90 mb-4">
          Warning: Your answer is missing core concepts. Are you sure you mastered this?
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.required_keywords.map((kw: string, i: number) => {
          const isFound = String(userAnswers[currentQuestion.id] || '').toLowerCase().includes(kw.toLowerCase());
          return (
            <label key={i} className={cn("flex items-center gap-4 p-4 border rounded-none cursor-pointer ", isFound ? "border-primary/50 bg-primary/5" : "border-border/40 hover:bg-muted/10")}>
              <input type="checkbox" checked={keywordChecks[kw] || false} onChange={(e) => setKeywordChecks({...keywordChecks, [kw]: e.target.checked})} className="w-5 h-5 rounded-none border-border text-primary focus:ring-primary" />
              <span className={cn("text-sm font-bold", isFound ? "text-foreground" : "text-muted-foreground")}>{kw} {isFound && <span className="text-[10px] uppercase tracking-widest text-primary ml-3">(Found in your answer)</span>}</span>
            </label>
          );
        })}
      </div>
    </div>
  )}
 </div>
 </div>
 </div>

  <div className="p-6 border-t border-border/10 bg-background">
 <div className="max-w-2xl mx-auto flex items-center justify-between">
 <Button variant="ghost" onClick={resetSession} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Exit</Button>
 <div className="flex items-center gap-2">
  <Button
    variant="ghost"
    onClick={handleExplainMore}
    className="h-10 px-4 text-[10px] font-black uppercase tracking-widest border border-foreground/30 hover:border-foreground/60 text-foreground/70 hover:text-foreground rounded-none flex items-center gap-2 transition-colors duration-150"
    title="Get a detailed lesson on this question's concept"
  >
    <BookOpen size={12} />
    Explain More
  </Button>
  <div className="flex items-center gap-2">
 {!isRevealed ? (
 <Button onClick={handleSubmitAnswer} disabled={!userAnswers[currentQuestion.id] && !['writing','synthesis','debug','trace','calculation','data_analysis','scenario','code'].includes(currentQuestion.type)} className="h-10 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-none">Check</Button>
 ) : (
 <div className="flex gap-2">
 {gradedAnswers[currentQuestion.id] === undefined && ['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(currentQuestion.type) && (
 <>
 <Button onClick={() => {setGradedAnswers(p => ({...p, [currentQuestion.id]: false})); nextQuestion(false);}} variant="outline" className="h-10 px-6 text-[9px] font-black uppercase border-destructive/20 text-destructive/40">Wrong</Button>
 <Button 
    onClick={() => {setGradedAnswers(p => ({...p, [currentQuestion.id]: true})); nextQuestion(true);}} 
    disabled={Array.isArray(currentQuestion.required_keywords) && currentQuestion.required_keywords.length > 0 && currentQuestion.required_keywords.some((kw: string) => !keywordChecks[kw])}
    className="h-10 px-6 bg-primary text-primary-foreground text-[9px] font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
    title={Array.isArray(currentQuestion.required_keywords) && currentQuestion.required_keywords.some((kw: string) => !keywordChecks[kw]) ? "Check all mandatory concepts to mark as correct" : ""}
 >Correct</Button>
 </>
 )} 
 {((!['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(currentQuestion.type)) || gradedAnswers[currentQuestion.id] !== undefined) && (
 <Button onClick={() => nextQuestion()} className="h-10 px-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-none">Next</Button>
 )}
 </div>
 )}
  </div>
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
  const avgTime = total > 0 ? Math.round(elapsedSec / total) : 0;

  // Per-type breakdown
  const typeMap: Record<string,{correct:number,total:number}> = {};
  questions.forEach(q => {
    const t = q.type || 'other';
    if (!typeMap[t]) typeMap[t] = {correct:0, total:0};
    typeMap[t].total++;
    if (gradedAnswers[q.id] === true) typeMap[t].correct++;
  });

  const TYPE_LABELS: Record<string,string> = {
    mcq:'MCQ', true_false:'True/False', writing:'Writing', fill_in:'Fill Blank',
    debug:'Debug', trace:'Trace', order:'Order', matching:'Matching',
    synthesis:'Synthesis', calculation:'Calculation', data_analysis:'Data Analysis',
    scenario:'Scenario', code:'Code'
  };

  const bookmarkedQuestions = questions.filter((_,i) => bookmarked.has(i));

  return (
   <div className="h-full flex-1 flex flex-col w-full bg-background text-foreground overflow-y-auto custom-scrollbar">
    <div className="max-w-3xl mx-auto w-full p-10 space-y-8">
     {/* Score hero */}
     <div className="flex items-end justify-between border-b border-border/10 pb-6">
      <div>
       <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">Session Complete</div>
       <h1 className="text-9xl font-black tracking-tighter leading-none">{score}<span className="text-3xl text-muted-foreground/30">%</span></h1>
      </div>
      <div className="flex flex-col items-end gap-2 pb-2">
       <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{correct} / {total} correct</div>
       {avgTime > 0 && <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">{avgTime}s avg per question</div>}
       {bookmarkedQuestions.length > 0 && <div className="text-[9px] font-black uppercase tracking-widest text-primary/60">{bookmarkedQuestions.length} bookmarked</div>}
      </div>
     </div>

     {/* Progress bar */}
     <div className="h-1.5 w-full bg-muted/20 rounded-none overflow-hidden">
      <div className="h-full bg-foreground/80 rounded-none transition-none duration-700" style={{width:`${score}%`}}/>
     </div>

     {/* Type breakdown */}
     {Object.entries(typeMap).length > 0 && (
      <div className="space-y-3">
       <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Breakdown by Type</div>
       <div className="grid grid-cols-2 gap-2">
        {Object.entries(typeMap).map(([t, s]) => {
          const pct = Math.round((s.correct/s.total)*100);
          return (
           <div key={t} className="p-3 bg-muted/5 border border-border/40 rounded-none space-y-2">
            <div className="flex items-center justify-between">
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{TYPE_LABELS[t]||t}</span>
             <span className="text-[10px] font-black tabular-nums">{pct}%</span>
            </div>
            <div className="h-0.5 w-full bg-muted/20 rounded-none overflow-hidden">
             <div className="h-full rounded-none" style={{width:`${pct}%`, background: pct >= 80 ? 'hsl(var(--foreground)/0.8)' : pct >= 50 ? 'hsl(var(--foreground)/0.4)' : 'hsl(var(--destructive)/0.6)'}}/>
            </div>
            <div className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">{s.correct}/{s.total} correct</div>
           </div>
          )
        })}
       </div>
      </div>
     )}

     {/* Bookmarked questions review */}
     {bookmarkedQuestions.length > 0 && (
      <div className="space-y-3">
       <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Bookmarked for Review</div>
       <div className="space-y-2">
        {bookmarkedQuestions.map((q,i) => (
         <div key={i} className="p-4 bg-muted/5 border border-border/40 rounded-none space-y-2">
          <div className="flex items-center gap-2">
           <Badge variant="outline" className="text-[8px] border-border/40 rounded-none px-1.5">{q.difficulty||'?'}</Badge>
           <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">{TYPE_LABELS[q.type]||q.type}</span>
           {gradedAnswers[q.id] === true && <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-foreground/40">Correct</span>}
           {gradedAnswers[q.id] === false && <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-destructive/60">Wrong</span>}
          </div>
          <div className="text-[11px] font-bold text-foreground/80 leading-relaxed">{q.question}</div>
           {(q as any).answer && <div className="text-[9px] font-black text-muted-foreground/40 border-t border-border/20 pt-2 mt-1">Answer: <span className="text-foreground/60">{String((q as any).answer)}</span></div>}
         </div>
        ))}
       </div>
      </div>
     )}

     {/* Actions */}
     <div className="flex flex-row gap-3 pt-2 border-t border-border/10">
      <Button onClick={() => { setStreak(0); setBookmarked(new Set()); setView('configuring'); }} className="h-11 flex-1 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-none">Practice Again</Button>
      <Button variant="outline" onClick={() => { setStreak(0); setBookmarked(new Set()); setAdvancedConfig({...DEFAULT_CONFIG, questionDistribution: Object.fromEntries(Object.entries(typeMap).map(([t,s]) => [t, Math.max(0, s.total - s.correct)])) as any }); setView('configuring'); }} className="h-11 flex-1 border-border/40 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest rounded-none">Retry Wrong Only</Button>
      <Button variant="outline" onClick={() => { setStreak(0); setBookmarked(new Set()); setView('dashboard'); }} className="h-11 px-6 border-border/20 text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest rounded-none">Done</Button>
     </div>
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
