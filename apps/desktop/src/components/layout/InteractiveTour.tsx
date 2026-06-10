import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSimulation } from '@/context/SimulationContext'
import { useConfig } from '@/lib/ConfigContext'
import { cn } from '@/lib/utils'
import {
  advanceWalkthrough,
  skipMilestone,
  previousMilestone,
  WalkthroughMilestone,
  WalkthroughState,
  WalkthroughTrigger,
} from '@/lib/walkthroughMachine'

export const WALKTHROUGH_TRIGGER_EVENT = 'ater:walkthrough-trigger'

type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

interface MilestoneDefinition {
  milestone: WalkthroughMilestone
  chapter: string
  stepLabel: string
  targets: string[]
  placement: TourPlacement
  instruction: string
  /** If set, navigate to this path when this milestone is first shown */
  autoNavigate?: string
}

interface WalkthroughContextValue extends WalkthroughState {
  trigger: (trigger: WalkthroughTrigger) => void
  dismiss: () => Promise<void>
  skipStep: () => void
  prevStep: () => void
}

interface TooltipPosition {
  top: number
  left: number
  placement: TourPlacement
}

const WalkthroughContext = createContext<WalkthroughContextValue | undefined>(undefined)

const MILESTONES: Record<WalkthroughMilestone, MilestoneDefinition> = {
  // ── Chapter 2: Command Center (Settings) ──────────────────────────────────
  '2.1': {
    milestone: '2.1',
    chapter: 'Chapter 2 · Command Center',
    stepLabel: 'Step 1 of 6',
    targets: ['[data-tour="settings-obsidian-path"]'],
    placement: 'bottom',
    autoNavigate: '/settings',
    instruction: 'Open Settings. First, point Ater to your local Obsidian vault folder.',
  },
  '2.2': {
    milestone: '2.2',
    chapter: 'Chapter 2 · Command Center',
    stepLabel: 'Step 2 of 6',
    targets: ['[data-tour="settings-obsidian-path"]'],
    placement: 'bottom',
    instruction: 'Point Ater to your local Obsidian vault. All your notes stay on your machine — nothing leaves.',
  },
  '2.3': {
    milestone: '2.3',
    chapter: 'Chapter 2 · Command Center',
    stepLabel: 'Step 3 of 6',
    targets: ['[data-tour="tab-ai-config"]'],
    placement: 'bottom',
    instruction: 'Now connect your AI engine. Open AI Provider & Keys tab.',
  },
  '2.4': {
    milestone: '2.4',
    chapter: 'Chapter 2 · Command Center',
    stepLabel: 'Step 4 of 6',
    targets: ['[data-tour="ai-add-key"]'],
    placement: 'bottom',
    instruction: "Add your API key here. You can skip this step in the tour if you don't have it yet — all features requiring AI will prompt you.",
  },
  '2.5': {
    milestone: '2.5',
    chapter: 'Chapter 2 · Command Center',
    stepLabel: 'Step 5 of 6',
    targets: ['[data-tour="tab-timer"]'],
    placement: 'bottom',
    instruction: 'Open Focus Timer to configure your deep work cycles — Pomodoro technique built in.',
  },
  '2.6': {
    milestone: '2.6',
    chapter: 'Chapter 2 · Command Center',
    stepLabel: 'Step 6 of 6',
    targets: ['[data-tour="timer-work-duration"]'],
    placement: 'bottom',
    instruction: 'Set your focus duration. Default is 25 minutes. The timer lives in every note view.',
  },
  // ── Chapter 3: Academic Dashboard ─────────────────────────────────────────
  '3.1': {
    milestone: '3.1',
    chapter: 'Chapter 3 · Academic Dashboard',
    stepLabel: 'Step 1 of 6',
    targets: ['[data-tour="sidebar-academic"]'],
    placement: 'right',
    instruction: 'Your Academic Dashboard tracks your entire degree program. Click to explore.',
  },
  '3.2': {
    milestone: '3.2',
    chapter: 'Chapter 3 · Academic Dashboard',
    stepLabel: 'Step 2 of 6',
    targets: ['[data-tour="tab-academic-program"]'],
    placement: 'bottom',
    autoNavigate: '/academic?tab=PROGRAM',
    instruction: 'The Program tab maps your full degree — years, semesters, milestones, and progress at a glance.',
  },
  '3.3': {
    milestone: '3.3',
    chapter: 'Chapter 3 · Academic Dashboard',
    stepLabel: 'Step 3 of 6',
    targets: ['[data-tour="tab-academic-courses"]'],
    placement: 'bottom',
    instruction: 'All your courses, grades, and credit hours in one structured view.',
  },
  '3.4': {
    milestone: '3.4',
    chapter: 'Chapter 3 · Academic Dashboard',
    stepLabel: 'Step 4 of 6',
    targets: ['[data-tour="tab-academic-planner"]'],
    placement: 'bottom',
    instruction: 'The Planner generates a weekly study schedule based on your workload and deadlines.',
  },
  '3.5': {
    milestone: '3.5',
    chapter: 'Chapter 3 · Academic Dashboard',
    stepLabel: 'Step 5 of 6',
    targets: ['[data-tour="tab-academic-assignments"]'],
    placement: 'bottom',
    instruction: 'Track all assignments and deadlines. Synced with your vault notes automatically.',
  },
  '3.6': {
    milestone: '3.6',
    chapter: 'Chapter 3 · Academic Dashboard',
    stepLabel: 'Step 6 of 6',
    targets: ['[data-tour="tab-academic-exams"]'],
    placement: 'bottom',
    instruction: 'Exam tracker with dates, coverage areas, and preparation status.',
  },
  // ── Chapter 4: Agents & Pipeline ──────────────────────────────────
  '4.1': {
    milestone: '4.1',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 1 of 7',
    targets: ['[data-tour="sidebar-ater"]'],
    placement: 'right',
    instruction: "Meet Ater — your AI tutor. It knows everything in your vault. Let's explore.",
  },
  '4.2': {
    milestone: '4.2',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 2 of 7',
    targets: ['[data-tour="oracle-input"]'],
    placement: 'top',
    autoNavigate: '/agents?tab=ater',
    instruction: "Ask Ater anything about distributed systems. Try asking: 'Explain Consensus' or 'Tell me about Raft'.",
  },
  '4.3': {
    milestone: '4.3',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 3 of 7',
    targets: ['[data-tour="tab-pipeline"]'],
    placement: 'bottom',
    instruction: 'The Pipeline is where raw documents become structured knowledge. Switch to it now.',
  },
  '4.4': {
    milestone: '4.4',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 4 of 7',
    targets: ['[data-tour="inbox-file-item"]'],
    placement: 'right',
    instruction: 'Select a PDF from your Inbox to start processing. Ater will analyze structure, extract concepts, and build your graph.',
  },
  '4.5': {
    milestone: '4.5',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 5 of 7',
    targets: ['[data-tour="process-file-btn"]'],
    placement: 'bottom',
    instruction: 'Process the file — Ater ingests the document and detects the curriculum path.',
  },
  '4.6': {
    milestone: '4.6',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 6 of 7',
    targets: ['[data-tour="generate-plan-btn"]'],
    placement: 'bottom',
    instruction: 'Generate the knowledge plan: Ater lays out the hubs and atomic notes it plans to create.',
  },
  '4.7': {
    milestone: '4.7',
    chapter: 'Chapter 4 · The Intelligence',
    stepLabel: 'Step 7 of 7',
    targets: ['[data-tour="confirm-deploy-btn"]'],
    placement: 'bottom',
    instruction: 'Confirm and deploy! Watch Ater generate the fake nodes and populate your vault.',
  },
  // ── Chapter 5: Obsidian Vault ──────────────────────────────
  '5.1': {
    milestone: '5.1',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 1 of 8',
    targets: ['[data-tour="sidebar-knowledge"]'],
    placement: 'right',
    instruction: 'Your Knowledge Base — every note Ater has generated, structured as a graph. Click to explore.',
  },
  '5.2': {
    milestone: '5.2',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 2 of 8',
    targets: ['[data-tour="btn-toggle-graph"]'],
    placement: 'bottom',
    autoNavigate: '/obsidian',
    instruction: 'Toggle the force-directed Knowledge Graph to see how your course concepts are causally linked.',
  },
  '5.3': {
    milestone: '5.3',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 3 of 8',
    targets: ['[data-tour="obsidian-file-item"]'],
    placement: 'right',
    instruction: 'Open the Consensus note. All notes are plain Markdown stored locally in your vault.',
  },
  '5.4': {
    milestone: '5.4',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 4 of 8',
    targets: ['[data-tour="obsidian-pomodoro"]'],
    placement: 'bottom',
    instruction: 'A focus Pomodoro timer is embedded inside every note view. Start a focus session here.',
  },
  '5.5': {
    milestone: '5.5',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 5 of 8',
    targets: ['[data-tour="btn-ai-explain"]', '[data-tour="explain-btn"]'],
    placement: 'bottom',
    instruction: 'Need more context? Select any text and click Explain to AI for a deep socratic breakdown.',
  },
  '5.6': {
    milestone: '5.6',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 6 of 8',
    targets: ['[data-tour="btn-jump-pdf"]'],
    placement: 'bottom',
    instruction: "Click 'Jump to PDF' to open the source document at the exact page that generated this note.",
  },
  '5.7': {
    milestone: '5.7',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 7 of 8',
    targets: ['[data-tour="btn-toggle-properties"]'],
    placement: 'bottom',
    instruction: 'Toggle the Properties panel to view and manage metadata, prerequisites, and hub links.',
  },
  '5.8': {
    milestone: '5.8',
    chapter: 'Chapter 5 · The Knowledge Base',
    stepLabel: 'Step 8 of 8',
    targets: ['[data-tour="quiz-section"]'],
    placement: 'top',
    instruction: 'Test your understanding. Finish the interactive quiz embedded at the end of the note.',
  },
  // ── Chapter 6: Practice ───────────────────────────────
  '6.1': {
    milestone: '6.1',
    chapter: 'Chapter 6 · The Learning Loop',
    stepLabel: 'Step 1 of 6',
    targets: ['[data-tour="tab-academic-practice"]'],
    placement: 'bottom',
    instruction: 'Now navigate to the Practice tab on the dashboard to test your memory across topics.',
  },
  '6.2': {
    milestone: '6.2',
    chapter: 'Chapter 6 · The Learning Loop',
    stepLabel: 'Step 2 of 6',
    targets: ['[data-tour="practice-custom-btn"]'],
    placement: 'bottom',
    autoNavigate: '/practice',
    instruction: 'Click the Custom button to construct a mock practice session.',
  },
  '6.3': {
    milestone: '6.3',
    chapter: 'Chapter 6 · The Learning Loop',
    stepLabel: 'Step 3 of 6',
    targets: ['[data-tour="practice-config-panel"]'],
    placement: 'right',
    instruction: 'Adjust settings: choose notes, question modalities, and difficulty levels.',
  },
  '6.4': {
    milestone: '6.4',
    chapter: 'Chapter 6 · The Learning Loop',
    stepLabel: 'Step 4 of 6',
    targets: ['[data-tour="start-practice-btn"]'],
    placement: 'bottom',
    instruction: 'Start the practice session. Questions will be generated dynamically from your vault.',
  },
  '6.5': {
    milestone: '6.5',
    chapter: 'Chapter 6 · The Learning Loop',
    stepLabel: 'Step 5 of 6',
    targets: ['[data-tour="practice-session-card"]'],
    placement: 'top',
    instruction: 'Answer the questions. Multiple-choice, writing challenges, and blanks are supported.',
  },
  '6.6': {
    milestone: '6.6',
    chapter: 'Chapter 6 · The Learning Loop',
    stepLabel: 'Step 6 of 6',
    targets: ['[data-tour="finish-session-btn"]'],
    placement: 'top',
    instruction: 'Finish the session to see your final score, statistics, and spaced repetition updates.',
  },
  // ── Chapter 7: Conversion ─────────────────────────────────────────────────
  '7.1': {
    milestone: '7.1',
    chapter: 'Chapter 7 · Ready',
    stepLabel: 'Final Step',
    targets: ['[data-tour="modal-conversion"]'],
    placement: 'bottom',
    instruction: "You've seen everything Ater can do. Ready to build your real vault?",
  },
}

export function dispatchWalkthroughTrigger(trigger: WalkthroughTrigger) {
  window.dispatchEvent(new CustomEvent(WALKTHROUGH_TRIGGER_EVENT, { detail: { trigger } }))
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const { config, saveConfig } = useConfig()
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState<WalkthroughState>({ status: 'inactive', milestone: '2.1' })
  const lastNavigatedMilestone = useRef<WalkthroughMilestone | null>(null)

  const persist = useCallback(
    async (next: WalkthroughState) => {
      if (!config) return
      await saveConfig({
        walkthroughStatus: next.status,
        walkthroughMilestone: next.milestone,
        walkthroughCompleted: next.status === 'completed',
      } as any)
    },
    [config, saveConfig],
  )

  const applyTrigger = useCallback(
    (trigger: WalkthroughTrigger) => {
      setState((current) => {
        const next = advanceWalkthrough(current, trigger)
        if (next === current) return current
        void persist(next)
        return next
      })
    },
    [persist],
  )

  const skipStep = useCallback(() => {
    setState((current) => {
      const next = skipMilestone(current)
      if (next === current) return current
      void persist(next)
      return next
    })
  }, [persist])

  const prevStep = useCallback(() => {
    setState((current) => {
      const next = previousMilestone(current)
      if (next === current) return current
      void persist(next)
      return next
    })
  }, [persist])

  const dismiss = useCallback(async () => {
    const next: WalkthroughState = { status: 'completed', milestone: state.milestone }
    setState(next)
    await persist(next)
    // Also exit simulation mode
    await saveConfig({ isDemoMode: false, appMode: 'real' } as any)
  }, [persist, state.milestone, saveConfig])

  // Restore state from config on load
  useEffect(() => {
    if (!config) return
    if (config.walkthroughCompleted || config.walkthroughStatus === 'completed') {
      setState({ status: 'completed', milestone: (config.walkthroughMilestone || '7.1') as WalkthroughMilestone })
      return
    }
    if (config.walkthroughStatus === 'active') {
      const milestone = (config.walkthroughMilestone || '2.1') as WalkthroughMilestone
      setState({ status: 'active', milestone })
    }
  }, [config?.walkthroughStatus, config?.walkthroughMilestone, config?.walkthroughCompleted])

  // Auto-navigate when milestone changes and has an autoNavigate target
  useEffect(() => {
    if (state.status !== 'active') return
    const def = MILESTONES[state.milestone]
    if (!def?.autoNavigate) return
    if (lastNavigatedMilestone.current === state.milestone) return
    // Only navigate if we're not already on the right page
    const targetPath = def.autoNavigate.split('?')[0]
    if (!location.pathname.startsWith(targetPath)) {
      lastNavigatedMilestone.current = state.milestone
      navigate(def.autoNavigate)
    }
  }, [state.milestone, state.status, location.pathname, navigate])

  // Route-based auto-triggers (navigating fires next milestone)
  useEffect(() => {
    if (state.status !== 'active') return
    if (location.pathname === '/settings') applyTrigger('nav_settings')
    if (location.pathname.startsWith('/academic')) applyTrigger('nav_academic')
    if (location.pathname.startsWith('/practice')) {
      applyTrigger('nav_practice')
    }
    if (location.pathname === '/obsidian') applyTrigger('nav_obsidian')
    if (location.pathname.startsWith('/agents')) applyTrigger('nav_agents')
  }, [location.pathname, state.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Event + click + input listeners
  useEffect(() => {
    const onTrigger = (event: Event) => {
      const trigger = (event as CustomEvent<{ trigger?: WalkthroughTrigger }>).detail?.trigger
      if (trigger) applyTrigger(trigger)
    }

    const handleClick = (e: MouseEvent) => {
      if (state.status !== 'active') return
      const target = e.target as HTMLElement
      const el = target.closest('[data-tour]')
      if (!el) return
      const tourId = el.getAttribute('data-tour')

      const map: Record<string, WalkthroughTrigger> = {
        // Settings
        'settings-obsidian-path': 'vaultPath_updated',
        'tab-ai-config': 'ai_config_opened',
        'ai-add-key': 'add_key_started',
        'ai-connection-status': 'activeKey_tested',
        'tab-timer': 'timer_config_opened',
        'timer-work-duration': 'work_duration_updated',
        // Academic tabs
        'tab-academic-program': 'nav_academic_program',
        'tab-academic-courses': 'nav_academic_courses',
        'tab-academic-planner': 'nav_academic_planner',
        'tab-academic-assignments': 'nav_academic_assignments',
        'tab-academic-exams': 'nav_academic_exams',
        'tab-academic-practice': 'nav_practice',
        // Practice
        'practice-custom-btn': 'practice_custom_started',
        'practice-config-panel': 'practice_config_seen',
        'start-practice-btn': 'practice_started',
        'practice-session-card': 'practice_session_active',
        'submit-answer-btn': 'practice_session_active',
        'finish-session-btn': 'practice_session_completed',
        // Obsidian
        'btn-toggle-graph': 'graph_toggled',
        'obsidian-file-item': 'note_opened',
        'obsidian-pomodoro': 'pomodoro_started',
        'btn-ai-explain': 'explain_dialog_open',
        'explain-btn': 'explain_dialog_open',
        'btn-jump-pdf': 'pdf_jumped',
        'srs-btn-good': 'quiz_interacted',
        'btn-toggle-properties': 'properties_opened',
        // Agents
        'tab-pipeline': 'pipeline_opened',
        'oracle-input': 'oracle_queried',
        'inbox-file-item': 'inbox_file_selected',
        'process-file-btn': 'file_processing_started',
        'generate-plan-btn': 'plan_generated',
        'confirm-deploy-btn': 'plan_confirmed',
      }

      if (tourId && map[tourId]) {
        applyTrigger(map[tourId])
      }
    }

    const handleChange = (e: Event) => {
      if (state.status !== 'active') return
      const target = e.target as HTMLElement
      const el = target.closest('[data-tour]')
      if (!el) return
      const tourId = el.getAttribute('data-tour')
      if (tourId === 'timer-work-duration') applyTrigger('work_duration_updated')
    }

    window.addEventListener(WALKTHROUGH_TRIGGER_EVENT, onTrigger)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('change', handleChange, true)
    return () => {
      window.removeEventListener(WALKTHROUGH_TRIGGER_EVENT, onTrigger)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('change', handleChange, true)
    }
  }, [applyTrigger, state.status, state.milestone])

  const { exitSimulation } = useSimulation()

  const handleFinishTour = useCallback(async () => {
    await exitSimulation()
    await dismiss()
    navigate('/onboarding')
  }, [exitSimulation, dismiss, navigate])

  const value = useMemo(
    () => ({
      ...state,
      trigger: applyTrigger,
      dismiss,
      skipStep,
      prevStep,
    }),
    [state, applyTrigger, dismiss, skipStep, prevStep],
  )

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
      <TourTooltip
        state={state}
        locationKey={`${location.pathname}${location.search}`}
        onSkip={skipStep}
        onBack={prevStep}
        onDismiss={dismiss}
      />
      {state.status === 'active' && state.milestone === '7.1' && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          data-tour="modal-conversion"
        >
          <div className="w-[420px] rounded-[14px] bg-background border border-border p-8 shadow-2xl space-y-6 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">
              Chapter 7 · Ready
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
              Your Vault Awaits
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              You've seen the full power of Ater. Now it's time to connect your real vault, add your API key, and start building your personal intelligence system.
            </p>
            <button
              onClick={() => {
                dispatchWalkthroughTrigger('conversion_completed')
                handleFinishTour()
              }}
              className="w-full rounded-[10px] bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.25em] h-12 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Exit Tour & Set Up My Vault
            </button>
          </div>
        </div>
      )}
    </WalkthroughContext.Provider>
  )
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext)
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider')
  }
  return context
}

function TourTooltip({
  state,
  locationKey,
  onSkip,
  onBack,
  onDismiss,
}: {
  state: WalkthroughState
  locationKey: string
  onSkip: () => void
  onBack: () => void
  onDismiss: () => Promise<void>
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const definition = state.status === 'active' ? MILESTONES[state.milestone] : null

  useEffect(() => {
    if (!definition) {
      setTarget(null)
      return
    }

    const findTarget = () => {
      const nextTarget = definition.targets
        .map((selector) => document.querySelector(selector))
        .find((element): element is HTMLElement => {
          if (!(element instanceof HTMLElement)) return false
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })

      setTarget(nextTarget || null)
    }

    findTarget()
    const observer = new MutationObserver(findTarget)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true })
    const timer = window.setInterval(findTarget, 500)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [definition, locationKey])

  useEffect(() => {
    if (!target || !definition) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      const rect = target.getBoundingClientRect()
      const gap = 14
      const width = 320
      let top = rect.bottom + gap
      let left = rect.left + rect.width / 2 - width / 2
      let placement = definition.placement

      if (placement === 'top') {
        top = rect.top - 152
      } else if (placement === 'left') {
        top = rect.top + rect.height / 2 - 68
        left = rect.left - width - gap
      } else if (placement === 'right') {
        top = rect.top + rect.height / 2 - 68
        left = rect.right + gap
      }

      left = Math.max(16, Math.min(left, window.innerWidth - width - 16))
      top = Math.max(16, Math.min(top, window.innerHeight - 160))

      if (rect.bottom + gap + 140 > window.innerHeight && definition.placement === 'bottom') {
        placement = 'top'
        top = Math.max(16, rect.top - 152)
      }

      setPosition({ top, left, placement })
    }

    updatePosition()
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [definition, target])

  if (!definition || !target || !position) return null

  const targetRect = target.getBoundingClientRect()
  const topH = Math.max(0, targetRect.top - 6)
  const leftW = Math.max(0, targetRect.left - 6)
  const rightW = Math.max(0, window.innerWidth - targetRect.right - 6)
  const bottomH = Math.max(0, window.innerHeight - targetRect.bottom - 6)
  const targetW = targetRect.width + 12
  const targetH = targetRect.height + 12

  return (
    <>
      {/* Spotlight overlay */}
      <div className="pointer-events-none fixed inset-0 z-[9997] overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 backdrop-blur-md bg-black/50 dark:bg-black/80 transition-all duration-300" style={{ height: topH }} />
        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/50 dark:bg-black/80 transition-all duration-300" style={{ height: bottomH }} />
        <div className="absolute left-0 backdrop-blur-md bg-black/50 dark:bg-black/80 transition-all duration-300" style={{ top: topH, bottom: bottomH, width: leftW }} />
        <div className="absolute right-0 backdrop-blur-md bg-black/50 dark:bg-black/80 transition-all duration-300" style={{ top: topH, bottom: bottomH, width: rightW }} />
      </div>

      {/* Target ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[9998] rounded-[10px] border-2 border-primary bg-transparent animate-tour-pulse shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-300"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetW,
          height: targetH,
        }}
      />

      {/* Tooltip card */}
      <div
        role="status"
        className="pointer-events-auto fixed z-[9999] w-80 rounded-[12px] border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-300"
        style={{ top: position.top, left: position.left }}
      >
        <div className="space-y-3 p-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">
              {definition.chapter}
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">
              {definition.stepLabel}
            </div>
          </div>

          {/* Instruction */}
          <p className="text-[12px] font-semibold leading-relaxed text-foreground">
            {definition.instruction}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onBack}
                disabled={state.milestone === '2.1'}
                className={cn(
                  'rounded-[7px] border border-border bg-muted/20 px-2.5 py-1.5',
                  'text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors',
                  'disabled:opacity-30 disabled:hover:text-muted-foreground'
                )}
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSkip}
                className={cn(
                  'rounded-[7px] border border-border bg-muted/20 px-2.5 py-1.5',
                  'text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors',
                )}
              >
                Forward
              </button>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'rounded-[7px] px-2.5 py-1.5',
                'text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors',
              )}
            >
              Abort Tour
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
