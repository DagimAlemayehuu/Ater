import React, { useState, useMemo, useEffect } from 'react'
import { AterMarkdown } from './MarkdownViewer'
import { cn } from '@/lib/utils'

interface InteractiveLessonRendererProps {
  content: string
  path: string
  onNavigate: (pageName: string) => void
  noteTitle?: string
}

// ─── Theme Hook ──────────────────────────────────────────────────────────────
function useAppTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() =>
      setIsDark(el.classList.contains('dark'))
    )
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

// ─── Shared Styling Helpers ──────────────────────────────────────────────────
const border = (dark: boolean) => (dark ? 'border-[#242426]' : 'border-zinc-200')
const panel  = (dark: boolean) => (dark ? 'bg-[#151517]' : 'bg-zinc-50')
const inner  = (dark: boolean) => (dark ? 'bg-[#111113]' : 'bg-white')
const muted  = (dark: boolean) => (dark ? 'text-[#a1a1aa]' : 'text-zinc-400')
const label  = 'text-[9px] font-black uppercase tracking-[0.2em]'
const sectionHead = 'text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400'

// ─── WIDGET 1: Puzzle Collaboration Simulator (Collaboration_Concept) ─────────
function PuzzleConceptWidget({ dark }: { dark: boolean }) {
  const [assignments, setAssignments] = useState<Record<string, string>>({
    adaptation: '',
    support: '',
    speech: '',
  })

  const roles = [
    { id: 'adaptation', label: 'Curriculum Adaptation', correct: 'teacher', desc: 'Requires professional pedagogical training to modify lesson structures.' },
    { id: 'support', label: 'Daily Student Support', correct: 'assistant', desc: 'Requires constant, direct behavioral reinforcement and physical assistance.' },
    { id: 'speech', label: 'Speech & Language', correct: 'therapist', desc: 'Requires specialized clinical certification in communication disorders.' },
  ]

  const professionals = [
    { id: 'teacher', label: 'Regular Teacher' },
    { id: 'assistant', label: 'Special Ed Assistant' },
    { id: 'therapist', label: 'Speech Therapist' },
  ]

  const assign = (roleId: string, profId: string) => {
    setAssignments(p => ({ ...p, [roleId]: profId }))
  }

  const result = useMemo(() => {
    const totalAssigned = Object.values(assignments).filter(Boolean).length
    if (totalAssigned < 3) {
      return { status: 'incomplete', text: 'Task allocation in progress. Assign all roles based on capacity.' }
    }
    const correctCount = roles.filter(r => assignments[r.id] === r.correct).length
    if (correctCount === 3) {
      return { status: 'success', text: 'Optimal Alignment. Tasks matched to individual capacity, leveraging strengths without discrimination.' }
    }
    return { status: 'mismatch', text: 'Capacity Mismatch. A team member is assigned to a role outside their specialized qualification.' }
  }, [assignments])

  return (
    <div className={cn('rounded-[6px] border p-4 space-y-4', border(dark), panel(dark))}>
      <div>
        <span className={cn(label, muted(dark))}>Interactive Sandbox: Puzzle Collaboration Simulator</span>
        <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">
          Observe how allocating tasks according to individual capacities avoids discrimination and optimizes outcome.
        </p>
      </div>

      <div className="space-y-3">
        {roles.map(role => {
          const currentAssign = assignments[role.id]
          return (
            <div key={role.id} className={cn('p-3 rounded-[4px] border flex flex-col md:flex-row md:items-center justify-between gap-3', inner(dark), border(dark))}>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">{role.label}</span>
                <p className="text-[10px] text-zinc-500">{role.desc}</p>
              </div>
              <div className="flex gap-1.5">
                {professionals.map(p => {
                  const active = currentAssign === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => assign(role.id, p.id)}
                      className={cn(
                        'px-2.5 py-1 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] transition-all',
                        active
                          ? dark
                            ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb]'
                            : 'bg-zinc-900 text-white border-zinc-900'
                          : cn('bg-transparent', border(dark), muted(dark), dark ? 'hover:border-white' : 'hover:border-zinc-900')
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className={cn(
        'p-3 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider transition-all text-center',
        result.status === 'success'
          ? dark ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb]' : 'bg-zinc-900 text-white border-zinc-900'
          : result.status === 'mismatch'
          ? 'border-zinc-400 text-zinc-600 dark:text-zinc-400'
          : cn('bg-transparent', border(dark), muted(dark))
      )}>
        {result.text}
      </div>
    </div>
  )
}

// ─── WIDGET 2: Lego Scaffold Builder (Key_Elements_Of_Collaboration) ──────────
function LegoScaffoldWidget({ dark }: { dark: boolean }) {
  const [workload, setWorkload] = useState(50) // Unilateral (0) -> Shared (100)
  const [authority, setAuthority] = useState(50) // Dominant (0) -> Balanced (100)
  const [sharing, setSharing] = useState(false) // Hoarded (false) -> Shared (true)

  const balanceScore = useMemo(() => {
    let score = 0
    if (workload > 30 && workload < 70) score += 30
    if (authority > 40 && authority < 80) score += 30
    if (sharing) score += 40
    return score
  }, [workload, authority, sharing])

  const status = useMemo(() => {
    if (balanceScore === 100) return { label: 'Scaffold Stable', text: 'All key elements aligned: Mutual Goals, Joint Structure, Mutual Authority, and Shared Resources.' }
    if (balanceScore >= 60) return { label: 'Scaffold Showing Stress', text: 'Structural imbalance detected. Workload or decision authority is unevenly distributed.' }
    return { label: 'Structural Collapse Imminent', text: 'Critical instability. Dominant decision power or lack of resource sharing prevents functional collaboration.' }
  }, [balanceScore])

  return (
    <div className={cn('rounded-[6px] border p-4 space-y-4', border(dark), panel(dark))}>
      <div>
        <span className={cn(label, muted(dark))}>Interactive Sandbox: Lego Scaffold Builder</span>
        <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">
          Adjust the key variables of teamwork to see how structural alignment keeps the collaborative scaffold stable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual representation */}
        <div className={cn('border rounded-[4px] p-4 flex flex-col justify-center items-center min-h-[140px]', inner(dark), border(dark))}>
          <svg width="140" height="100" viewBox="0 0 140 100" className="overflow-visible">
            {/* Base block */}
            <rect x="30" y="80" width="80" height="12" rx="2" fill={dark ? '#242426' : '#e4e4e7'} />
            <text x="70" y="88" fontSize="6" fontWeight="bold" textAnchor="middle" fill={dark ? '#ebebeb' : '#18181b'}>SHARED GOALS</text>

            {/* Structure block (depends on workload) */}
            <rect
              x={35 + (50 - workload) * 0.2}
              y="64"
              width="70"
              height="12"
              rx="2"
              fill={dark ? '#3f3f46' : '#d4d4d8'}
              className="transition-all duration-200"
            />
            <text x="70" y="72" fontSize="6" fontWeight="bold" textAnchor="middle" fill={dark ? '#ebebeb' : '#18181b'}>JOINT STRUCTURE</text>

            {/* Authority block (depends on authority) */}
            <rect
              x={40 + (50 - authority) * 0.2}
              y="48"
              width="60"
              height="12"
              rx="2"
              fill={dark ? '#ebebeb' : '#18181b'}
              className="transition-all duration-200"
            />
            <text x="70" y="56" fontSize="6" fontWeight="bold" textAnchor="middle" fill={dark ? '#111113' : '#ffffff'}>MUTUAL AUTHORITY</text>

            {/* Resources block (depends on sharing) */}
            {sharing && (
              <g className="transition-all duration-300">
                <rect x="45" y="32" width="50" height="12" rx="2" fill={dark ? '#ebebeb' : '#18181b'} />
                <text x="70" y="40" fontSize="6" fontWeight="bold" textAnchor="middle" fill={dark ? '#111113' : '#ffffff'}>RESOURCE SHARING</text>
              </g>
            )}
          </svg>
        </div>

        {/* Sliders and Toggles */}
        <div className="space-y-3 flex flex-col justify-center">
          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Structure (Workload)</span>
              <span className="font-mono">{workload === 50 ? 'Balanced' : workload < 50 ? 'Unilateral' : 'Imbalanced'}</span>
            </div>
            <input
              type="range" min="0" max="100" value={workload}
              onChange={e => setWorkload(+e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Decision Authority</span>
              <span className="font-mono">{authority === 50 ? 'Mutual Consent' : authority < 50 ? 'Dominant Leader' : 'Siloed'}</span>
            </div>
            <input
              type="range" min="0" max="100" value={authority}
              onChange={e => setAuthority(+e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className={cn(label, muted(dark))}>Share Resources & Rewards</span>
            <button
              onClick={() => setSharing(!sharing)}
              className={cn(
                'px-3 py-1 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] transition-all',
                sharing
                  ? dark
                    ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb]'
                    : 'bg-zinc-900 text-white border-zinc-900'
                  : cn('bg-transparent', border(dark), muted(dark))
              )}
            >
              {sharing ? 'Sharing Enabled' : 'Hoarded'}
            </button>
          </div>
        </div>
      </div>

      <div className={cn(
        'p-3 rounded-[4px] border transition-all text-center',
        border(dark),
        balanceScore === 100
          ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
          : 'bg-transparent'
      )}>
        <span className={cn(label, 'block mb-0.5')}>{status.label}</span>
        <p className="text-[10px] opacity-80">{status.text}</p>
      </div>
    </div>
  )
}

// ─── WIDGET 3: Garden Irrigation System (Characteristics_Of_Successful_Partnerships)
function GardenPartnershipWidget({ dark }: { dark: boolean }) {
  const [agreement, setAgreement] = useState(50) // Unclear (0) -> Clear (100)
  const [equity, setEquity] = useState(50) // Unequal (0) -> Balanced (100)
  const [inclusion, setInclusion] = useState(50) // Discriminatory (0) -> Inclusive (100)

  const plants = useMemo(() => {
    // 6 plants represented in the garden. Flow characteristics determine their state.
    return [
      { id: 1, label: 'Parent Rep', minInclusion: 10, minEquity: 30 },
      { id: 2, label: 'Teacher Rep', minInclusion: 20, minEquity: 10 },
      { id: 3, label: 'Student Rep', minInclusion: 60, minEquity: 50 },
      { id: 4, label: 'Community Rep', minInclusion: 40, minEquity: 40 },
      { id: 5, label: 'Admin Rep', minInclusion: 10, minEquity: 10 },
      { id: 6, label: 'Special Needs Rep', minInclusion: 80, minEquity: 60 },
    ]
  }, [])

  const plantStates = useMemo(() => {
    return plants.map(p => {
      const isLeaking = agreement < 30
      const isDry = equity < p.minEquity
      const isExcluded = inclusion < p.minInclusion
      if (isExcluded) return { state: 'excluded', text: 'Excluded' }
      if (isLeaking) return { state: 'dry', text: 'No Water (Leak)' }
      if (isDry) return { state: 'dry', text: 'Dry' }
      return { state: 'blooming', text: 'Blooming' }
    })
  }, [agreement, equity, inclusion, plants])

  const statusText = useMemo(() => {
    const bloomingCount = plantStates.filter(s => s.state === 'blooming').length
    if (bloomingCount === 6) return 'Partnership Flourishing. Equal relationships, clear agreement, and full inclusion achieved.'
    if (bloomingCount >= 3) return 'Suboptimal Partnership. Some stakeholder representatives are dry or excluded due to resource or policy imbalance.'
    return 'Partnership Failing. Lack of clear agreements or systemic discrimination has collapsed stakeholder trust.'
  }, [plantStates])

  return (
    <div className={cn('rounded-[6px] border p-4 space-y-4', border(dark), panel(dark))}>
      <div>
        <span className={cn(label, muted(dark))}>Interactive Sandbox: Garden Irrigation System</span>
        <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">
          Simulate a community partnership garden. Balanced distribution of benefits and inclusive access keeps all plants alive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Garden plants visual representation */}
        <div className={cn('border rounded-[4px] p-3 grid grid-cols-3 gap-2 min-h-[140px]', inner(dark), border(dark))}>
          {plants.map((p, i) => {
            const st = plantStates[i]
            return (
              <div
                key={p.id}
                className={cn(
                  'p-2 rounded-[3px] border text-center flex flex-col justify-center items-center transition-all duration-200',
                  st.state === 'blooming'
                    ? dark ? 'border-white bg-[#1d1d20]' : 'border-zinc-900 bg-zinc-50'
                    : st.state === 'dry'
                    ? 'border-dashed border-zinc-400 text-zinc-400 bg-transparent'
                    : 'border-zinc-300 bg-transparent opacity-10'
                )}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider block">{p.label}</span>
                <span className="text-[7px] uppercase tracking-widest mt-1 block opacity-75">{st.text}</span>
              </div>
            )
          })}
        </div>

        {/* Sliders */}
        <div className="space-y-3 flex flex-col justify-center">
          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Agreement Clarity</span>
              <span className="font-mono">{agreement}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={agreement}
              onChange={e => setAgreement(+e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Equitable Distribution</span>
              <span className="font-mono">{equity}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={equity}
              onChange={e => setEquity(+e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Inclusivity & Access</span>
              <span className="font-mono">{inclusion}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={inclusion}
              onChange={e => setInclusion(+e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className={cn(
        'p-3 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider text-center',
        border(dark),
        plantStates.filter(s => s.state === 'blooming').length === 6
          ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
          : 'bg-transparent'
      )}>
        {statusText}
      </div>
    </div>
  )
}

// ─── WIDGET 4: Pillar Structural Simulator (Collaboration_And_Partnership) ────
function CathedralPillarWidget({ dark }: { dark: boolean }) {
  const [coordination, setCoordination] = useState(80)
  const [pooling, setPooling] = useState(80)
  const [teamwork, setTeamwork] = useState(80)

  const minVal = Math.min(coordination, pooling, teamwork)

  const status = useMemo(() => {
    if (minVal < 30) return { label: 'Cathedral Arch Collapsed', text: 'Critical structural failure. One of the core pillars has crumbled, compromising structural integrity.' }
    if (minVal < 60) return { label: 'Arch Cracking Under Weight', text: 'Structural stress. Uneven distributions of force are causing fissures along the supporting scaffold.' }
    return { label: 'Structure Perfectly Stable', text: 'Equilibrium achieved. Collaboration acts as a sturdy central pillar, distributing resource demands cleanly.' }
  }, [minVal])

  return (
    <div className={cn('rounded-[6px] border p-4 space-y-4', border(dark), panel(dark))}>
      <div>
        <span className={cn(label, muted(dark))}>Interactive Sandbox: Pillar Structural Simulator</span>
        <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">
          Adjust the load-bearing pillars of collaboration. If any pillar drops below threshold, the cathedral arch collapses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dynamic Cathedral SVG */}
        <div className={cn('border rounded-[4px] p-3 flex justify-center items-center min-h-[140px]', inner(dark), border(dark))}>
          <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
            {/* Arch */}
            <path
              d="M 20,80 Q 90,10 160,80"
              fill="none"
              stroke={dark ? '#a1a1aa' : '#71717a'}
              strokeWidth="4"
              opacity={minVal < 30 ? 0.3 : minVal < 60 ? 0.7 : 1}
              className="transition-all duration-200"
            />
            {/* Cracks in arch */}
            {minVal < 60 && (
              <path
                d="M 85,35 L 90,40 L 95,33 L 100,45"
                fill="none"
                stroke={dark ? '#ebebeb' : '#18181b'}
                strokeWidth="2.5"
                strokeDasharray="2,1"
              />
            )}

            {/* Left Pillar: Coordination */}
            <rect x="25" y={80 - coordination * 0.4} width="12" height={coordination * 0.4} fill={dark ? '#242426' : '#e4e4e7'} stroke={dark ? '#ebebeb' : '#18181b'} strokeWidth="1" className="transition-all duration-200" />
            <text x="31" y="92" fontSize="5" fontWeight="bold" textAnchor="middle" fill={dark ? '#ebebeb' : '#18181b'}>COORD</text>

            {/* Center Pillar: Teamwork */}
            <rect x="84" y={80 - teamwork * 0.4} width="12" height={teamwork * 0.4} fill={dark ? '#242426' : '#e4e4e7'} stroke={dark ? '#ebebeb' : '#18181b'} strokeWidth="1" className="transition-all duration-200" />
            <text x="90" y="92" fontSize="5" fontWeight="bold" textAnchor="middle" fill={dark ? '#ebebeb' : '#18181b'}>CULT</text>

            {/* Right Pillar: Resource Pooling */}
            <rect x="143" y={80 - pooling * 0.4} width="12" height={pooling * 0.4} fill={dark ? '#242426' : '#e4e4e7'} stroke={dark ? '#ebebeb' : '#18181b'} strokeWidth="1" className="transition-all duration-200" />
            <text x="149" y="92" fontSize="5" fontWeight="bold" textAnchor="middle" fill={dark ? '#ebebeb' : '#18181b'}>POOL</text>
          </svg>
        </div>

        {/* Sliders */}
        <div className="space-y-3 flex flex-col justify-center">
          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Service Coordination</span>
              <span className="font-mono">{coordination}%</span>
            </div>
            <input
              type="range" min="10" max="100" value={coordination}
              onChange={e => setCoordination(+e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Teamwork Culture</span>
              <span className="font-mono">{teamwork}%</span>
            </div>
            <input
              type="range" min="10" max="100" value={teamwork}
              onChange={e => setTeamwork(+e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <div className={cn('flex justify-between mb-0.5', label, muted(dark))}>
              <span>Resource Pooling</span>
              <span className="font-mono">{pooling}%</span>
            </div>
            <input
              type="range" min="10" max="100" value={pooling}
              onChange={e => setPooling(+e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className={cn(
        'p-3 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider text-center',
        border(dark),
        minVal >= 60
          ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
          : 'bg-transparent'
      )}>
        <span className="block mb-0.5">{status.label}</span>
        <p className="text-[10px] opacity-75 font-normal uppercase tracking-normal">{status.text}</p>
      </div>
    </div>
  )
}

// ─── WIDGET 5: Communication Channel Optimizer (Community_Involvement_Strategies)
function CommunityStrategiesWidget({ dark }: { dark: boolean }) {
  const [networks, setNetworks] = useState(false)
  const [signLang, setSignLang] = useState(false)
  const [translation, setTranslation] = useState(false)
  const [commitment, setCommitment] = useState(false)

  const reach = useMemo(() => {
    let pct = 20 // Baseline
    if (networks) pct += 20
    if (signLang) pct += 20
    if (translation) pct += 20
    if (commitment) pct += 20
    return pct
  }, [networks, signLang, translation, commitment])

  const unreachedGroups = useMemo(() => {
    const groups = []
    if (!commitment) groups.push('Marginalized Diversities')
    if (!translation) groups.push('Minority Language Speakers')
    if (!signLang) groups.push('Hearing Impaired Community')
    if (!networks) groups.push('Siloed Rural Households')
    return groups
  }, [networks, signLang, translation, commitment])

  return (
    <div className={cn('rounded-[6px] border p-4 space-y-4', border(dark), panel(dark))}>
      <div>
        <span className={cn(label, muted(dark))}>Interactive Sandbox: Outreach Channel Optimizer</span>
        <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">
          Activate outreach parameters to maximize community development access. Goal: Reach 100% of community demographics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph simulation panel */}
        <div className={cn('border rounded-[4px] p-3 flex flex-col justify-between min-h-[140px]', inner(dark), border(dark))}>
          <div className="flex justify-between items-center">
            <span className={label}>Reach Metrics</span>
            <span className="font-mono text-xs font-black">{reach}%</span>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">Excluded Stakeholders:</span>
            {unreachedGroups.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {unreachedGroups.map(g => (
                  <span key={g} className="px-1.5 py-0.5 rounded-[2px] border border-dashed border-zinc-400 text-[8px] uppercase tracking-wider text-zinc-500">
                    {g}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[9px] font-bold text-zinc-500 block">None. 100% Total Outreach Attained.</span>
            )}
          </div>
        </div>

        {/* Strategies Toggles */}
        <div className="space-y-2.5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide">Tap Local Networks</span>
            <button
              onClick={() => setNetworks(!networks)}
              className={cn(
                'px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] transition-all',
                networks
                  ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
                  : 'bg-transparent text-zinc-400'
              )}
            >
              {networks ? 'Activated' : 'Inactive'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide">Sign Language Channels</span>
            <button
              onClick={() => setSignLang(!signLang)}
              className={cn(
                'px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] transition-all',
                signLang
                  ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
                  : 'bg-transparent text-zinc-400'
              )}
            >
              {signLang ? 'Activated' : 'Inactive'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide">Non-discriminatory Translation</span>
            <button
              onClick={() => setTranslation(!translation)}
              className={cn(
                'px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] transition-all',
                translation
                  ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
                  : 'bg-transparent text-zinc-400'
              )}
            >
              {translation ? 'Activated' : 'Inactive'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide">Commit to Participation</span>
            <button
              onClick={() => setCommitment(!commitment)}
              className={cn(
                'px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] transition-all',
                commitment
                  ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
                  : 'bg-transparent text-zinc-400'
              )}
            >
              {commitment ? 'Activated' : 'Inactive'}
            </button>
          </div>
        </div>
      </div>

      <div className={cn(
        'p-2.5 rounded-[4px] border text-[9px] font-bold uppercase tracking-widest text-center',
        reach === 100
          ? dark ? 'bg-[#ebebeb] text-zinc-950 border-white' : 'bg-zinc-900 text-white border-zinc-900'
          : cn('bg-transparent', border(dark), muted(dark))
      )}>
        {reach === 100
          ? 'Outreach Optimized. All community groups successfully integrated.'
          : 'Optimization required to capture all demographics.'}
      </div>
    </div>
  )
}

// ─── WIDGET 6: Stakeholder Alignment Matrix (Stakeholder_Partnerships) ────────
function StakeholdersWidget({ dark }: { dark: boolean }) {
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')

  const correctMatch = {
    parent: 'resources',
    teacher: 'expertise',
    student: 'insights',
  }

  const result = useMemo(() => {
    const ready = selectedParent && selectedTeacher && selectedStudent
    if (!ready) return { status: 'incomplete', text: 'Select expectations for all stakeholders to construct partnership matrix.' }
    const matchCount =
      (selectedParent === correctMatch.parent ? 1 : 0) +
      (selectedTeacher === correctMatch.teacher ? 1 : 0) +
      (selectedStudent === correctMatch.student ? 1 : 0)
    if (matchCount === 3) return { status: 'stable', text: 'Optimal Alignment. All stakeholders are actively engaged according to their specific stakes.' }
    return { status: 'mismatch', text: 'Imbalanced Expectations. Stakeholder roles conflict with their vital interests.' }
  }, [selectedParent, selectedTeacher, selectedStudent])

  return (
    <div className={cn('rounded-[6px] border p-4 space-y-4', border(dark), panel(dark))}>
      <div>
        <span className={cn(label, muted(dark))}>Interactive Sandbox: Stakeholder Alignment Matrix</span>
        <p className="text-[11px] leading-relaxed text-zinc-500 mt-1">
          Align stakeholders with their key contributions to establish a mutual support network.
        </p>
      </div>

      <div className="space-y-3">
        {/* Parent Row */}
        <div className={cn('p-3 rounded-[4px] border flex flex-col md:flex-row md:items-center justify-between gap-3', inner(dark), border(dark))}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Parents</span>
            <p className="text-[10px] text-zinc-500">Represent student interests, offering home background information and reinforcement resources.</p>
          </div>
          <select
            value={selectedParent}
            onChange={e => setSelectedParent(e.target.value)}
            className={cn('text-[10px] uppercase font-bold p-1 rounded border focus:outline-none focus:border-zinc-500 bg-transparent', border(dark))}
          >
            <option value="">Select Contribution</option>
            <option value="resources">Offer Support & Resources</option>
            <option value="expertise">Provide Pedagogy & Guidance</option>
            <option value="insights">Provide Needs & Insights</option>
          </select>
        </div>

        {/* Teacher Row */}
        <div className={cn('p-3 rounded-[4px] border flex flex-col md:flex-row md:items-center justify-between gap-3', inner(dark), border(dark))}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Teachers</span>
            <p className="text-[10px] text-zinc-500">Provide direct educational delivery, assessment structure, and instructional design.</p>
          </div>
          <select
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
            className={cn('text-[10px] uppercase font-bold p-1 rounded border focus:outline-none focus:border-zinc-500 bg-transparent', border(dark))}
          >
            <option value="">Select Contribution</option>
            <option value="resources">Offer Support & Resources</option>
            <option value="expertise">Provide Pedagogy & Guidance</option>
            <option value="insights">Provide Needs & Insights</option>
          </select>
        </div>

        {/* Student Row */}
        <div className={cn('p-3 rounded-[4px] border flex flex-col md:flex-row md:items-center justify-between gap-3', inner(dark), border(dark))}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Students</span>
            <p className="text-[10px] text-zinc-500">Vested interest in the directly delivered learning experience and individual outcomes.</p>
          </div>
          <select
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
            className={cn('text-[10px] uppercase font-bold p-1 rounded border focus:outline-none focus:border-zinc-500 bg-transparent', border(dark))}
          >
            <option value="">Select Contribution</option>
            <option value="resources">Offer Support & Resources</option>
            <option value="expertise">Provide Pedagogy & Guidance</option>
            <option value="insights">Provide Needs & Insights</option>
          </select>
        </div>
      </div>

      <div className={cn(
        'p-3 rounded-[4px] border text-[10px] font-bold uppercase tracking-wider text-center',
        result.status === 'stable'
          ? dark ? 'bg-[#ebebeb] text-zinc-950' : 'bg-zinc-900 text-white'
          : 'bg-transparent border-dashed'
      )}>
        {result.text}
      </div>
    </div>
  )
}

// ─── QUIZ NAVIGATOR ──────────────────────────────────────────────────────────
// Global cache for maintaining quiz cursor and answers across unmount/remount
const quizStateCache: Record<string, { cursor: number; answers: Record<number, any> }> = {}

function QuizNavigator({ questions, dark }: { questions: any[], dark: boolean }) {
  const cacheKey = React.useMemo(() => {
    return JSON.stringify(questions[0]?.question || 'default-quiz')
  }, [questions])

  const [cursor, setCursor] = useState(() => {
    return quizStateCache[cacheKey]?.cursor ?? 0
  })
  const [answers, setAnswers] = useState<Record<number, any>>(() => {
    return quizStateCache[cacheKey]?.answers ?? {}
  })

  // Sync back to global cache when cursor or answers changes
  useEffect(() => {
    quizStateCache[cacheKey] = { cursor, answers }
  }, [cursor, answers, cacheKey])

  const initialSlideState = useMemo(() => {
    return answers[cursor] || {}
  }, [answers, cursor])

  const q = questions[cursor]
  const total = questions.length

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [userPairs, setUserPairs] = useState<Record<string, string>>(() => initialSlideState.userPairs || {})
  const [matchVerified, setMatchVerified] = useState(() => initialSlideState.matchVerified || false)
  const [mcqChosen, setMcqChosen] = useState<string | null>(() => initialSlideState.mcqChosen ?? null)
  const [textVal, setTextVal] = useState(() => initialSlideState.textVal || '')
  const [textSubmitted, setTextSubmitted] = useState(() => initialSlideState.textSubmitted || false)

  // Sync inputs on navigation
  const go = (dir: number) => {
    // Save current slide state
    const currentSnapshot = {
      userPairs,
      matchVerified,
      mcqChosen,
      textVal,
      textSubmitted
    }
    setAnswers(p => ({ ...p, [cursor]: currentSnapshot }))

    const next = cursor + dir
    if (next < 0 || next >= total) return

    // Restore next state
    const saved = answers[next]
    if (saved) {
      setUserPairs(saved.userPairs || {})
      setMatchVerified(saved.matchVerified || false)
      setMcqChosen(saved.mcqChosen ?? null)
      setTextVal(saved.textVal || '')
      setTextSubmitted(saved.textSubmitted || false)
    } else {
      // Clear for new question
      setUserPairs({})
      setMatchVerified(false)
      setMcqChosen(null)
      setTextVal('')
      setTextSubmitted(false)
    }
    setSelectedLeft(null)
    setCursor(next)
  }

  // Parse MCQ options from either array or object format
  const parsedOptions = useMemo(() => {
    if (!q || !q.options) return []
    if (Array.isArray(q.options)) {
      return q.options.map((opt: any, i: number) => {
        const key = String.fromCharCode(65 + i)
        return { key, text: opt, value: opt }
      })
    }
    // Object format: { "A": "...", "B": "..." }
    return Object.entries(q.options).map(([key, val]: [string, any]) => ({
      key,
      text: `${key}: ${val}`,
      value: key
    }))
  }, [q])

  // Keywords detector
  const userKeywords = useMemo(() => {
    if (!q || !q.required_keywords) return []
    return q.required_keywords.map((kw: string) => {
      const regex = new RegExp(kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
      return {
        word: kw,
        matched: regex.test(textVal)
      }
    })
  }, [q, textVal])

  const mcqCorrect = useMemo(() => {
    if (mcqChosen === null || !q) return false
    return String(mcqChosen).trim().toLowerCase() === String(q.answer).trim().toLowerCase()
  }, [mcqChosen, q])

  return (
    <div className={cn('rounded-[6px] border overflow-hidden', border(dark))}>
      {/* Navigator Top Bar */}
      <div className={cn('flex items-center justify-between px-4 py-2 border-b', panel(dark), border(dark))}>
        <span className={cn(label, muted(dark))}>
          Question {cursor + 1} of {total} — {(q.difficulty || 'Analysis').toUpperCase()}: {q.type.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(-1)}
            disabled={cursor === 0}
            className={cn(
              'px-3 py-1 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
              cursor === 0
                ? 'opacity-25 cursor-not-allowed'
                : dark
                ? 'border-[#242426] text-[#a1a1aa] hover:border-white hover:text-white'
                : 'border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
            )}
          >
            Back
          </button>
          <button
            onClick={() => go(1)}
            disabled={cursor === total - 1}
            className={cn(
              'px-3 py-1 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
              cursor === total - 1
                ? 'opacity-25 cursor-not-allowed'
                : dark
                ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb] hover:bg-transparent hover:text-white'
                : 'bg-zinc-900 text-white border-zinc-900 hover:bg-white hover:text-zinc-900'
            )}
          >
            Next
          </button>
        </div>
      </div>

      {/* Navigator Main Body */}
      <div className={cn('p-5', inner(dark))}>
        {/* 1. SCENARIO / WRITING */}
        {(q.type === 'scenario' || q.type === 'writing') && (
          <div className="space-y-4">
            <p className="text-[12px] font-bold leading-relaxed">{q.question}</p>
            <textarea
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              rows={4}
              placeholder="Provide a comprehensive academic explanation..."
              className={cn(
                'w-full p-3 border text-[12px] rounded-[4px] focus:outline-none resize-none font-mono',
                dark ? 'bg-[#111113] border-[#242426] focus:border-[#a1a1aa]' : 'bg-white border-zinc-200 focus:border-zinc-500'
              )}
            />
            {userKeywords.length > 0 && (
              <div className="space-y-1.5">
                <span className={cn(label, muted(dark), 'block')}>Required Concept Keywords:</span>
                <div className="flex flex-wrap gap-1.5">
                  {userKeywords.map((kw: any) => (
                    <span
                      key={kw.word}
                      className={cn(
                        'px-2 py-0.5 rounded-[3px] border text-[8px] font-bold uppercase tracking-wider transition-all',
                        kw.matched
                          ? dark
                            ? 'border-white bg-[#ebebeb] text-zinc-950 font-black'
                            : 'border-zinc-900 bg-zinc-900 text-white font-black'
                          : cn('bg-transparent border-dashed text-zinc-400', border(dark))
                      )}
                    >
                      {kw.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setTextSubmitted(true)}
                className={cn(
                  'px-4 py-1.5 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
                  dark
                    ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb] hover:bg-transparent hover:text-white'
                    : 'bg-zinc-900 text-white border-zinc-900 hover:bg-white hover:text-zinc-900'
                )}
              >
                Submit
              </button>
            </div>
            {textSubmitted && q.answer && (
              <div className={cn('p-3 border rounded-[4px] space-y-2', border(dark), panel(dark))}>
                <span className={cn(label, muted(dark), 'block')}>Model Assessment Guidance:</span>
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">{q.answer}</p>
                {q.explanation && (
                  <>
                    <hr className={cn('my-2 border-t', border(dark))} />
                    <span className={cn(label, muted(dark), 'block')}>Explanation:</span>
                    <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{q.explanation}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. TRUE / FALSE */}
        {q.type === 'true_false' && (
          <div className="space-y-4">
            <p className="text-[12px] font-bold leading-relaxed">{q.question}</p>
            <div className="flex gap-2">
              {[true, false].map(val => {
                const active = textVal === String(val)
                const isCorrect = val === q.answer
                const showFeedback = textSubmitted
                return (
                  <button
                    key={String(val)}
                    onClick={() => {
                      setTextVal(String(val))
                      setTextSubmitted(true)
                    }}
                    className={cn(
                      'flex-1 py-3 border text-[11px] font-black uppercase tracking-wider rounded-[4px] transition-all',
                      active
                        ? dark
                          ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb]'
                          : 'bg-zinc-900 text-white border-zinc-900'
                        : cn('bg-transparent', border(dark), muted(dark), dark ? 'hover:border-white' : 'hover:border-zinc-900')
                    )}
                  >
                    {val ? 'True' : 'False'}
                  </button>
                )
              })}
            </div>
            {textSubmitted && (
              <div className={cn('p-3 border rounded-[4px]', border(dark), panel(dark))}>
                <span className={cn(label, 'block mb-1')}>
                  {textVal === String(q.answer) ? 'Response Validated' : 'Response Incorrect'}
                </span>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{q.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* 3. MULTIPLE CHOICE */}
        {q.type === 'mcq' && (
          <div className="space-y-3">
            <p className="text-[12px] font-bold leading-relaxed">{q.question}</p>
            <div className="space-y-1.5">
              {parsedOptions.map((opt: any) => {
                const chosen = mcqChosen === opt.value
                const showResults = mcqChosen !== null
                const isCorrect = String(opt.value).toLowerCase() === String(q.answer).toLowerCase()
                return (
                  <button
                    key={opt.key}
                    disabled={showResults}
                    onClick={() => setMcqChosen(opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 border text-[11px] rounded-[4px] transition-all flex items-start gap-2',
                      showResults && isCorrect
                        ? dark ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb]' : 'bg-zinc-900 text-white border-zinc-900'
                        : showResults && chosen && !isCorrect
                        ? 'border-zinc-400 text-zinc-400 line-through'
                        : dark ? 'border-[#242426] hover:border-white' : 'border-zinc-200 hover:border-zinc-900'
                    )}
                  >
                    <span className={cn(label, muted(dark))}>{opt.key}.</span>
                    <span className="leading-snug">{opt.text}</span>
                  </button>
                )
              })}
            </div>
            {mcqChosen !== null && (
              <div className={cn('p-3 border rounded-[4px]', border(dark), panel(dark))}>
                <span className={cn(label, 'block mb-1')}>
                  {mcqCorrect ? 'Evaluation Correct' : 'Evaluation Incorrect'}
                </span>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{q.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* 4. MATCHING */}
        {q.type === 'matching' && q.pairs && (
          <div className="space-y-4">
            <p className="text-[12px] font-bold leading-relaxed">{q.question}</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Left Column */}
              <div className="space-y-1.5">
                <span className={cn(label, muted(dark), 'block mb-0.5')}>Term</span>
                {q.pairs.map((p: any, i: number) => {
                  const code = `L${i}`
                  const active = selectedLeft === code
                  const assigned = !!userPairs[code]
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedLeft(code); setMatchVerified(false) }}
                      className={cn(
                        'w-full text-left px-2.5 py-2.5 border text-[10px] font-bold uppercase tracking-wide rounded-[4px] transition-all',
                        active
                          ? dark ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb]' : 'bg-zinc-900 text-white border-zinc-900'
                          : assigned
                          ? cn('bg-transparent opacity-50', border(dark))
                          : dark ? 'border-[#242426] hover:border-white' : 'border-zinc-200 hover:border-zinc-900'
                      )}
                    >
                      {p.left}
                    </button>
                  )
                })}
              </div>

              {/* Right Column */}
              <div className="space-y-1.5">
                <span className={cn(label, muted(dark), 'block mb-0.5')}>Definition</span>
                {q.pairs.map((p: any, i: number) => {
                  const code = `R${i}`
                  const matched = Object.values(userPairs).includes(code)
                  return (
                    <button
                      key={i}
                      disabled={!selectedLeft}
                      onClick={() => {
                        if (selectedLeft) {
                          setUserPairs(prev => ({ ...prev, [selectedLeft]: code }))
                          setSelectedLeft(null)
                        }
                      }}
                      className={cn(
                        'w-full text-left px-2.5 py-2.5 border text-[10px] rounded-[4px] transition-all leading-snug',
                        matched
                          ? cn('bg-transparent opacity-50', border(dark))
                          : selectedLeft
                          ? dark ? 'border-[#242426] hover:border-white' : 'border-zinc-200 hover:border-zinc-900'
                          : dark ? 'border-[#242426] text-[#a1a1aa]/30' : 'border-zinc-200 text-zinc-300'
                      )}
                    >
                      {p.right}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setMatchVerified(true)}
                className={cn(
                  'px-4 py-1.5 border text-[9px] font-black uppercase tracking-[0.2em] rounded-[4px] transition-all',
                  dark
                    ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb] hover:bg-transparent hover:text-white'
                    : 'bg-zinc-900 text-white border-zinc-900 hover:bg-white hover:text-zinc-900'
                )}
              >
                Validate Pairs
              </button>
              <button
                onClick={() => { setUserPairs({}); setMatchVerified(false); setSelectedLeft(null) }}
                className={cn('text-[9px] font-black uppercase tracking-widest', muted(dark), 'hover:text-foreground')}
              >
                Reset
              </button>
            </div>

            {matchVerified && (
              <div className={cn('p-3 border rounded-[4px]', border(dark), panel(dark))}>
                <span className={cn(label, 'block mb-1')}>Evaluation Result</span>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {Object.keys(userPairs).length === q.pairs.length
                    ? q.explanation || 'Verification complete.'
                    : 'Complete all pairings before validation.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dots bar */}
      {total > 1 && (
        <div className={cn('flex items-center justify-center gap-1 py-2 border-t', border(dark), panel(dark))}>
          {questions.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => go(i - cursor)}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                i === cursor
                  ? dark ? 'bg-[#ebebeb]' : 'bg-zinc-900'
                  : dark ? 'bg-[#242426]' : 'bg-zinc-200'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NOTE DETECTOR ────────────────────────────────────────────────────────────
type NoteVariant =
  | 'concept'
  | 'elements'
  | 'partnerships'
  | 'collaboration_partnership'
  | 'community_strategies'
  | 'stakeholders'
  | 'generic'

function detectVariant(noteTitle: string): NoteVariant {
  const t = noteTitle.toLowerCase().replace(/_/g, ' ')
  if (t.includes('collaboration concept')) return 'concept'
  if (t.includes('key elements')) return 'elements'
  if (t.includes('characteristics')) return 'partnerships'
  if (t.includes('collaboration and partnership')) return 'collaboration_partnership'
  if (t.includes('community involvement')) return 'community_strategies'
  if (t.includes('stakeholder')) return 'stakeholders'
  return 'generic'
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function InteractiveLessonRenderer({
  content,
  path,
  onNavigate,
  noteTitle = '',
}: InteractiveLessonRendererProps) {
  const dark = useAppTheme()
  const variant = detectVariant(noteTitle)

  const { mentalModelMarkdown, bodyMarkdown, quizQuestions } = useMemo(() => {
    const normalized = content.replace(/\r\n/g, '\n')

    // Find Mental Model
    const mmMatch = normalized.match(/## Mental Model\n\n([\s\S]*?)(?=\n##|\n---|$)/i)
    const mentalModelMarkdown = mmMatch ? mmMatch[1].trim() : ''

    // Find Body
    const parts = normalized.split(/\n## /)
    const bodyParts: string[] = []
    for (let i = 2; i < parts.length; i++) {
      if (parts[i].startsWith('The Proving Grounds')) break
      bodyParts.push('## ' + parts[i])
    }
    const bodyMarkdown = bodyParts.join('\n\n')

    // Find Quiz
    const quizMatch = normalized.match(/```interactive-quiz\n([\s\S]*?)\n```/i)
    let quizQuestions: any[] = []
    if (quizMatch) {
      try {
        quizQuestions = JSON.parse(quizMatch[1].trim())
      } catch (e) {
        console.error('Quiz JSON Parse Error:', e)
      }
    }

    return { mentalModelMarkdown, bodyMarkdown, quizQuestions }
  }, [content])

  return (
    <div className="w-full space-y-10 selection:bg-zinc-200 dark:selection:bg-zinc-800 pb-12">
      {/* 01 / Mental Model & Dynamic Sandbox */}
      {mentalModelMarkdown && (
        <section className="space-y-4">
          <h2 className={sectionHead}>01 / Mental Model</h2>
          <AterMarkdown content={mentalModelMarkdown} path={path} onNavigate={onNavigate} />

          {variant === 'concept' && <PuzzleConceptWidget dark={dark} />}
          {variant === 'elements' && <LegoScaffoldWidget dark={dark} />}
          {variant === 'partnerships' && <GardenPartnershipWidget dark={dark} />}
          {variant === 'collaboration_partnership' && <CathedralPillarWidget dark={dark} />}
          {variant === 'community_strategies' && <CommunityStrategiesWidget dark={dark} />}
          {variant === 'stakeholders' && <StakeholdersWidget dark={dark} />}
        </section>
      )}

      {/* 02 / Analytical Details */}
      {bodyMarkdown && (
        <section className="space-y-4">
          <h2 className={sectionHead}>02 / How It Works</h2>
          <AterMarkdown content={bodyMarkdown} path={path} onNavigate={onNavigate} />
        </section>
      )}

      {/* 03 / Proving Grounds */}
      {quizQuestions.length > 0 && (
        <section className="space-y-4">
          <h2 className={sectionHead}>03 / The Proving Grounds</h2>
          <QuizNavigator questions={quizQuestions} dark={dark} />
        </section>
      )}
    </div>
  )
}
