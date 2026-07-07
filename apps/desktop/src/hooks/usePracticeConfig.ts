import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { sidecarApi } from '@/lib/sidecarApi'
import { toast } from 'sonner'
import { AdvancedPracticeConfig, Question } from '@/types/practice'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { useArtifactStore } from '@/lib/artifacts/store'
import { extractArtifacts } from '@/lib/artifacts/parser'

export interface Hub {
  id: string
  title: string
  course?: string
  unit?: string
  path: string
}

export const ZERO_DISTRIBUTION = {
  mcq: 0,
  true_false: 0,
  writing: 0,
  fill_in: 0,
  matching: 0,
  order: 0,
  debug: 0,
  synthesis: 0,
  trace: 0,
  calculation: 0,
  data_analysis: 0,
  scenario: 0,
  code: 0,
}

export const PRESETS: Record<string, Partial<typeof ZERO_DISTRIBUTION> & { label: string }> = {
  smart_mix: {
    label: 'Smart Mix',
    mcq: 2,
    true_false: 1,
    writing: 1,
    fill_in: 1,
    matching: 1,
    order: 1,
    synthesis: 1,
    calculation: 1,
    data_analysis: 1,
    scenario: 1,
  },
  foundations: {
    label: 'Foundations',
    mcq: 3,
    true_false: 2,
    fill_in: 3,
    matching: 2,
    writing: 1,
  },
  apply_transfer: {
    label: 'Apply & Transfer',
    scenario: 4,
    writing: 2,
    synthesis: 3,
    data_analysis: 2,
  },
  code_lab: {
    label: 'Code Lab',
    code: 4,
    debug: 2,
    trace: 3,
    writing: 1,
  },
  math_derivation: {
    label: 'Math / Derivation',
    calculation: 5,
    trace: 3,
    data_analysis: 2,
    writing: 1,
  },
  diagnosis_debug: {
    label: 'Diagnosis',
    debug: 3,
    data_analysis: 3,
    scenario: 2,
    trace: 2,
  },
  weakness_repair: {
    label: 'Weakness Repair',
    writing: 3,
    scenario: 3,
    synthesis: 2,
    fill_in: 2,
    trace: 1,
  },
  exam_sim: {
    label: 'Exam Sim',
    mcq: 5,
    true_false: 3,
    writing: 2,
    fill_in: 3,
    calculation: 2,
    matching: 2,
    order: 1,
  },
}

export const DEFAULT_CONFIG: AdvancedPracticeConfig = {
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
  smartMixPreset: 'smart_mix',
  practicePolicy: { mode: 'smart_mix' },
  familyDistribution: {},
  formatDistribution: {},
  globalTimeLimitMinutes: null,
  perQuestionTimeLimitSeconds: null,
  timeBoundDays: null,
}

export function usePracticeConfig() {
  const [hubs, setHubs] = useState<Hub[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedHub = searchParams.get('hubId') || searchParams.get('id') || ''
  
  const setSelectedHub = useCallback((id: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('hubId', id)
      return next
    })
  }, [setSearchParams])

  const [advancedConfig, setAdvancedConfig] = useState<AdvancedPracticeConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const view = (searchParams.get('view') || 'dashboard') as 'dashboard' | 'history' | 'configuring' | 'loading' | 'session' | 'results' | 'vault'
  
  const setView = useCallback((v: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('view', v)
      return next
    })
  }, [setSearchParams])

  const session = usePracticeSession()
  const {
    artifacts,
    isPanelOpen,
    panelWidth,
    setPanelOpen,
    resetArtifacts,
  } = useArtifactStore()
  
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)

  // Dragging split logic for resizing
  useEffect(() => {
    if (!isDraggingSplit) return

    const onMove = (event: MouseEvent) => {
      const viewportWidth = window.innerWidth || 1
      const rightWidth = viewportWidth - event.clientX
      useArtifactStore.getState().setPanelWidth((rightWidth / viewportWidth) * 100)
    }
    const onUp = () => setIsDraggingSplit(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingSplit])

  // Parse and register practice question artifacts
  useEffect(() => {
    if (view === 'session' && session.currentQuestion) {
      const qText = `${session.currentQuestion.question || ''}\n${session.currentQuestion.explanation || ''}\n${session.currentQuestion.content || ''}`
      const extractedDirect = extractArtifacts(qText)
      if (extractedDirect.artifacts.length > 0) {
        useArtifactStore.getState().registerArtifacts(extractedDirect.artifacts)
        useArtifactStore.getState().setPanelOpen(true)
      } else if (session.currentQuestion.note_id) {
        sidecarApi.readObsidianNote(session.currentQuestion.note_id).then((res) => {
          const extracted = extractArtifacts(res.content || '')
          if (extracted.artifacts.length > 0) {
            useArtifactStore.getState().registerArtifacts(extracted.artifacts)
            useArtifactStore.getState().setPanelOpen(true)
          } else {
            useArtifactStore.getState().resetArtifacts()
          }
        }).catch(() => {
          useArtifactStore.getState().resetArtifacts()
        })
      } else {
        useArtifactStore.getState().resetArtifacts()
      }
    } else {
      useArtifactStore.getState().resetArtifacts()
    }
  }, [session.currentQuestion, view])

  // Reset store on unmount
  useEffect(() => {
    return () => {
      useArtifactStore.getState().resetArtifacts()
    }
  }, [])

  // Route-bound UI and past session telemetry state
  const [pastPractices, setPastPractices] = useState<any[]>([])
  const [genStatus, setGenStatus] = useState<string>('Initializing...')
  const [availableNotes, setAvailableNotes] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<{ modalities: Record<string, number>; weakest_concepts: any[] }>({
    modalities: {},
    weakest_concepts: [],
  })

  // Reference Vault states
  const [vaultFiles, setVaultFiles] = useState<any[]>([])
  const [vaultLoading, setVaultLoading] = useState(false)
  const [vaultStatus, setVaultStatus] = useState('')
  const [vaultSourceText, setVaultSourceText] = useState('')
  const [vaultSourceName, setVaultSourceName] = useState('')
  const [vaultSelectedFiles, setVaultSelectedFiles] = useState<string[]>([])
  const [vaultMode, setVaultMode] = useState<'vault_only' | 'hard_only' | 'ai_variants' | 'mixed' | 'weak_spots' | 'exam_sim'>('vault_only')

  // Explain dialog state
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainQuestion, setExplainQuestion] = useState<Question | null>(null)

  const [elapsedSec, setElapsedSec] = useState(0)
  useEffect(() => {
    if (view === 'results') {
      const val = Math.round((Date.now() - ((window as any).__practiceStartTime || 0)) / 1000)
      setElapsedSec(val)
    }
  }, [view])

  // Reference Vault handlers
  const loadVaultFiles = useCallback(async (hubId: string) => {
    if (!hubId) return
    try {
      const res = await sidecarApi.vaultList(hubId)
      setVaultFiles(res.vaults || [])
    } catch {
      setVaultFiles([])
    }
  }, [])

  const handleVaultUploadText = useCallback(async () => {
    if (!vaultSourceText.trim() || !vaultSourceName.trim() || !selectedHub) return
    setVaultLoading(true)
    setVaultStatus('Extracting questions...')
    try {
      const res = await sidecarApi.vaultUploadText(selectedHub, vaultSourceName, vaultSourceText)
      toast.success(`Vault created — ${res.total || 0} questions read and structured`)
      setVaultSourceText('')
      setVaultSourceName('')
      await loadVaultFiles(selectedHub)
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setVaultLoading(false)
      setVaultStatus('')
    }
  }, [vaultSourceText, vaultSourceName, selectedHub, loadVaultFiles])

  const handleVaultFileUpload = useCallback(async (file: File) => {
    if (!selectedHub) {
      toast.error('Select a hub first')
      return
    }
    setVaultLoading(true)
    setVaultStatus(`Reading ${file.name}...`)
    try {
      await sidecarApi.vaultUploadFile(selectedHub, file)
      toast.success('File processed — vault updated')
      await loadVaultFiles(selectedHub)
    } catch (e: any) {
      toast.error(e.message || 'File upload failed')
    } finally {
      setVaultLoading(false)
      setVaultStatus('')
    }
  }, [selectedHub, loadVaultFiles])

  const handleVaultPracticeGenerate = useCallback(async () => {
    if (!vaultSelectedFiles.length) return
    setIsLoading(true)
    setView('loading')
    setGenStatus('Initializing vault generation...')
    try {
      const res = await sidecarApi.vaultGenerate(vaultSelectedFiles, vaultMode, selectedHub)
      if (!res.questions || res.questions.length === 0) {
        toast.error('No questions were generated from the selected vault files.')
        setView('vault')
        return
      }
      setView('session');
      (window as any).__practiceStartTime = Date.now()
      await session.startSession(res.questions || [], {}, undefined, res.quiz_path || null)
    } catch (e: any) {
      toast.error(e.message || 'Generation failed')
      setView('vault')
    } finally {
      setIsLoading(false)
    }
  }, [vaultSelectedFiles, vaultMode, selectedHub, setView, session])

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await sidecarApi.getPracticeAnalytics()
      setAnalytics(res)
    } catch {
      console.error('Error loading analytics')
    }
  }, [])

  const loadPastPractices = useCallback(async () => {
    try {
      const res = await sidecarApi.listPractices()
      setPastPractices(res.practices)
    } catch {
      console.error('Error')
    }
  }, [])

  const loadHubs = useCallback(async () => {
    try {
      const res = await sidecarApi.listHubs()
      setHubs(res.hubs)
      if (res.hubs.length > 0 && !selectedHub) {
        setSelectedHub(res.hubs[0].id)
      }
    } catch {
      console.error('Error loading hubs')
    }
  }, [selectedHub, setSelectedHub])

  useEffect(() => {
    loadHubs()
    loadPastPractices()
    loadAnalytics()
  }, [loadHubs, loadPastPractices, loadAnalytics])

  const loadHubNotes = useCallback(async (hubId: string) => {
    if (!hubId) return
    try {
      let notes: any[] = []
      if (hubId === 'all') {
        const allNotesPromises = hubs.map(h => sidecarApi.listHubNotes(h.id))
        const allNotesResults = await Promise.all(allNotesPromises)
        const notePaths = new Set<string>()
        allNotesResults.forEach(res => {
          const hubNotes = Array.isArray(res?.notes) ? res.notes : []
          hubNotes.forEach((n: any) => {
            if (n && n.path && !notePaths.has(n.path)) {
              notePaths.add(n.path)
              notes.push(n)
            }
          })
        })
      } else {
        const res = await sidecarApi.listHubNotes(hubId)
        notes = Array.isArray(res?.notes) ? res.notes : []
      }
      setAvailableNotes(notes)
      setAdvancedConfig(prev => {
        const { label: _l, ...cleanedDist } = prev.questionDistribution as any
        return {
          ...prev,
          selectedAtomicNotes: notes.map((n: any) => n.path),
          questionDistribution: cleanedDist,
        }
      })
    } catch (err) {
      console.error('Error loading notes:', err)
      setAvailableNotes([])
    }
  }, [hubs])

  useEffect(() => {
    if (selectedHub) loadHubNotes(selectedHub)
  }, [selectedHub, loadHubNotes])

  // Poll practice generation status
  useEffect(() => {
    let interval: any
    if (view === 'loading') {
      interval = setInterval(async () => {
        try {
          const res = await sidecarApi.getPracticeStatus()
          const statuses = Object.values(res.status)
          if (statuses.length > 0) {
            setGenStatus(statuses[statuses.length - 1] as string)
          }
        } catch (e) {
          console.error('Status polling failed', e)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [view])

  useEffect(() => {
    if (view === 'session' && session.questions.length === 0 && session.isInitialized) {
      setView('dashboard')
    }
  }, [view, session.questions, session.isInitialized, setView])

  const getCleanErrorMessage = useCallback((err: any): string => {
    if (!err) return 'Error starting.'
    let msg = ''
    if (typeof err === 'string') {
      msg = err
    } else if (err.message) {
      msg = err.message
    } else {
      try {
        msg = JSON.stringify(err)
      } catch {
        msg = String(err)
      }
    }
    const sidecarPattern = /Sidecar API returned error status \d+:\s*([\s\S]*)/i
    const match = msg.match(sidecarPattern)
    if (match && match[1]) {
      const rawDetail = match[1].trim()
      try {
        const parsed = JSON.parse(rawDetail)
        if (parsed && parsed.detail) {
          if (typeof parsed.detail === 'string') {
            return parsed.detail
          } else if (typeof parsed.detail === 'object') {
            return JSON.stringify(parsed.detail)
          }
        }
      } catch {
        return rawDetail
      }
    }
    return msg || 'Error starting.'
  }, [])

  // Handle start practice session
  const handleStartSession = useCallback(async () => {
    if (!selectedHub) {
      toast.error('Choose a topic.')
      return
    }

    const totalQuestions = Object.values(advancedConfig.questionDistribution).reduce((a, b) => a + b, 0)
    if (totalQuestions <= 0) {
      toast.error('Please select at least one question type or apply a preset.')
      return
    }

    setIsLoading(true)
    setView('loading')
    try {
      const cleanDistribution = Object.fromEntries(
        Object.entries(advancedConfig.questionDistribution).filter(([k]) =>
          ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(k)
        )
      )

      const res = await sidecarApi.generatePractice(selectedHub, {
        ...advancedConfig,
        hubId: selectedHub,
        questionDistribution: cleanDistribution,
      })

      if (!res.questions || res.questions.length === 0) {
        toast.error('No content found.')
        setView('configuring')
        return
      }

      setView('session');
      (window as any).__practiceStartTime = Date.now()
      await session.startSession(res.questions, advancedConfig, undefined, res.quiz_path)
    } catch (err: any) {
      toast.error(getCleanErrorMessage(err))
      setView('configuring')
    } finally {
      setIsLoading(false)
    }
  }, [selectedHub, advancedConfig, getCleanErrorMessage, setView, session])

  // Pending practice trigger from URL params
  useEffect(() => {
    const startPending = searchParams.get('startPending')
    const hubId = searchParams.get('hubId')
    if (startPending === 'true' && hubId) {
      const pendingStr = localStorage.getItem('ater-pending-practice-config')
      if (pendingStr) {
        try {
          const config = JSON.parse(pendingStr)
          setSearchParams(prev => {
            prev.delete('startPending')
            return prev
          })
          localStorage.removeItem('ater-pending-practice-config')

          setIsLoading(true)
          setView('loading')

          ;(async () => {
            try {
              setAdvancedConfig(config)
              setSelectedHub(hubId)

              const cleanDistribution = Object.fromEntries(
                Object.entries(config.questionDistribution).filter(([k]) =>
                  ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(k)
                )
              )

              const res = await sidecarApi.generatePractice(hubId, {
                ...config,
                hubId: hubId,
                questionDistribution: cleanDistribution,
              })

              if (!res.questions || res.questions.length === 0) {
                toast.error('No content found.')
                setView('configuring')
                return
              }

              setView('session');
              (window as any).__practiceStartTime = Date.now()
              await session.startSession(res.questions, config, undefined, res.quiz_path)
            } catch (err: any) {
              toast.error(getCleanErrorMessage(err))
              setView('configuring')
            } finally {
              setIsLoading(false)
            }
          })()
        } catch (e) {
          console.error('Failed to parse pending practice config', e)
        }
      }
    }
  }, [searchParams, setSearchParams, session.startSession, getCleanErrorMessage, setSelectedHub, setView])

  // Sync selectedHub from URL params on load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hubId = searchParams.get('hubId') || searchParams.get('id')
    if (hubId && hubs.length > 0) {
      const hub = hubs.find(h => h.id === hubId || h.path.includes(hubId))
      if (hub) setSelectedHub(hub.id)
    }
  }, [hubs, setSelectedHub])

  const handleResumePractice = useCallback(async (path: string) => {
    setIsLoading(true)
    setView('loading')
    try {
      const res = await sidecarApi.getPractice(path)
      if (!res.questions || res.questions.length === 0) {
        toast.error('No questions.')
        setView('history')
        return
      }
      setView('session');
      (window as any).__practiceStartTime = Date.now()
      await session.startSession(res.questions, {}, undefined, path)
    } catch {
      toast.error('Error loading.')
      setView('history')
    } finally {
      setIsLoading(false)
    }
  }, [setView, session])

  // Resume session from URL parameters
  useEffect(() => {
    const resumeId = searchParams.get('resume_session_id')
    if (resumeId) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('resume_session_id')
        return next
      })
      handleResumePractice(resumeId)
    }
  }, [searchParams, setSearchParams, handleResumePractice])


  const handleDeletePractice = useCallback(async (path: string) => {
    await sidecarApi.deletePractice(path)
    loadPastPractices()
  }, [loadPastPractices])

  const handleReviewDueCards = useCallback(async () => {
    if (!selectedHub) {
      toast.error('Select a topic first.')
      return
    }
    setIsLoading(true)
    setView('loading')
    try {
      const dueRes = selectedHub === 'all' ? await sidecarApi.srsDue() : await sidecarApi.srsDue(selectedHub)
      if (!dueRes.due_cards || dueRes.due_cards.length === 0) {
        toast.info('No cards are due right now!')
        setView('dashboard')
        return
      }

      let duePaths = dueRes.due_cards.map((c: any) => c.note_path)
      if (selectedHub === 'all') {
        duePaths = [...duePaths].sort(() => Math.random() - 0.5)
      }

      const cleanDistribution = Object.fromEntries(
        Object.entries(advancedConfig.questionDistribution).filter(([k]) =>
          ['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace', 'calculation', 'data_analysis', 'scenario', 'code'].includes(k)
        )
      )

      const res = await sidecarApi.generatePractice(selectedHub, {
        ...advancedConfig,
        selectedAtomicNotes: duePaths,
        hubId: selectedHub,
        questionDistribution: cleanDistribution,
      })

      if (!res.questions || res.questions.length === 0) {
        toast.error('No content generated for due cards.')
        setView('dashboard')
        return
      }

      setView('session');
      (window as any).__practiceStartTime = Date.now()
      await session.startSession(res.questions, advancedConfig, undefined, res.quiz_path)
    } catch (err) {
      console.error(err)
      toast.error('Error generating practice from due cards')
      setView('dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [selectedHub, advancedConfig, setView, session])

  return {
    hubs,
    searchParams,
    setSearchParams,
    selectedHub,
    setSelectedHub,
    advancedConfig,
    setAdvancedConfig,
    isLoading,
    view,
    setView,
    session,
    pastPractices,
    genStatus,
    availableNotes,
    analytics,
    vaultFiles,
    vaultLoading,
    vaultStatus,
    vaultSourceText,
    setVaultSourceText,
    vaultSourceName,
    setVaultSourceName,
    vaultSelectedFiles,
    setVaultSelectedFiles,
    vaultMode,
    setVaultMode,
    explainOpen,
    setExplainOpen,
    explainQuestion,
    setExplainQuestion,
    elapsedSec,
    isDraggingSplit,
    setIsDraggingSplit,
    artifacts,
    isPanelOpen,
    panelWidth,
    setPanelOpen,
    resetArtifacts,
    loadVaultFiles,
    handleVaultUploadText,
    handleVaultFileUpload,
    handleVaultPracticeGenerate,
    loadHubNotes,
    loadAnalytics,
    loadPastPractices,
    handleStartSession,
    handleResumePractice,
    handleDeletePractice,
    handleReviewDueCards,
  }
}
