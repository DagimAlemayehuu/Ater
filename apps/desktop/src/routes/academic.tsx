import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {RefreshCw, BookOpen, ClipboardList, FlaskConical, Layers, Home, FolderOpen, Network} from 'lucide-react'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {sidecarApi} from '@/lib/sidecarApi'
import {useHeader} from '@/context/header-context'
import {useLayout} from '@/context/layout-provider'
import ProgramTab from './academic-tabs/ProgramTab'
import CoursesTab from './academic-tabs/CoursesTab'
import StudyPlannerTab from './academic-tabs/StudyPlannerTab'
import AssignmentsTab from './academic-tabs/AssignmentsTab'
import ExamsTab from './academic-tabs/ExamsTab'
import YearsTab from './academic-tabs/YearsTab'
import SemestersTab from './academic-tabs/SemestersTab'
// import { SIDECAR_BASE_URL } from '@/lib/sidecarApi'
import {cleanTitle, DEFAULT_SCHEMAS, wrapWL, getBoolVal, getVal, stripWL} from './academic-tabs/utils'
import type {AcademicTab, AcademicData, VaultDatabase, TabProps, AcademicItem} from './academic-tabs/types'
import { BlockingLoader } from '@/components/ui/loading-state'
import { useSidebarContent } from '@/context/sidebar-content-context'

export default function AcademicDashboard() {
 const [data, setData] = useState<AcademicData | null>(null)
  const [loading, setLoading] = useState(true)
 const [databases, setDatabases] = useState<VaultDatabase[]>([])
 const [, startDataTransition] = React.useTransition()
 const isMountedRef = useRef(false)
 const dataRequestIdRef = useRef(0)
 const databaseRequestIdRef = useRef(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (String(searchParams.get('tab') || 'PROGRAM').toUpperCase()) as AcademicTab

  const setActiveTab = useCallback((tab: AcademicTab | ((prev: AcademicTab) => AcademicTab)) => {
    if (typeof tab === 'function') {
      const current = (String(searchParams.get('tab') || 'PROGRAM').toUpperCase()) as AcademicTab
      setSearchParams({ tab: tab(current).toUpperCase() })
    } else {
      setSearchParams({ tab: tab.toUpperCase() })
    }
  }, [searchParams, setSearchParams])

  const selectedItemId = searchParams.get('id')

  const setSelectedItemId = useCallback((id: string | null) => setSearchParams(prev => {
    if (id) prev.set('id', id)
    else prev.delete('id')
    prev.set('tab', String(prev.get('tab') || 'PROGRAM').toUpperCase())
    return prev
  }), [setSearchParams])
  const {setCenterContent, setRightContent} = useHeader()
  const {setIsFullscreen} = useLayout()
  const {setSidebarContent} = useSidebarContent()
  const nav = useNavigate()
 // const API_BASE = SIDECAR_BASE_URL

 // ── Data fetching ──────────────────────────────────────────────────────────
 const fetchData = useCallback(async () => {
 const requestId = ++dataRequestIdRef.current
 try {
  const dashRes = await sidecarApi.academicsDashboard()
  if (!isMountedRef.current || requestId !== dataRequestIdRef.current) return
  startDataTransition(() => {
    setData(dashRes as unknown as AcademicData)
    setLoading(false)
  })

  sidecarApi.getStudyHistory()
    .catch(() => {
      console.error('Failed to fetch study history')
    })
 } catch {
  if (!isMountedRef.current || requestId !== dataRequestIdRef.current) return
  toast.error('Could not connect to vault')
  setLoading(false)
 }
}, [])

 const fetchDatabases = useCallback(async () => {
 const requestId = ++databaseRequestIdRef.current
 try {
 const res = await sidecarApi.listVaultDatabases()
 if (isMountedRef.current && requestId === databaseRequestIdRef.current) {
  startDataTransition(() => setDatabases(res.databases || []))
 }
} catch {}
}, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()
    fetchDatabases()

    const handleFocus = () => {
      sidecarApi.clearOptionsCache()
      fetchData()
      fetchDatabases()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      isMountedRef.current = false
      dataRequestIdRef.current += 1
      databaseRequestIdRef.current += 1
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchData, fetchDatabases])

 useEffect(() => {
  setIsFullscreen(false)
 }, [setIsFullscreen])

 // ── Shared handlers ────────────────────────────────────────────────────────
  const onUpdate = useCallback(async (dbId: string, itemId: string, properties: Record<string, unknown>) => {
  console.log(`[Academic] Updating ${dbId}/${itemId}:`, properties)
  // Optimistic update
  setData(prev => {
  if (!prev) return prev
  const next = {...prev}
  let key: keyof AcademicData | undefined;
  const dbIdLow = dbId.toLowerCase();
  if (dbIdLow.includes('year')) key = 'years';
  else if (dbIdLow.includes('semester')) key = 'semesters';
  else if (dbIdLow.includes('course')) key = 'courses';
  else if (dbIdLow.includes('study planner') || dbIdLow.includes('study_sessions')) key = 'study_sessions';
  else if (dbIdLow.includes('exam')) key = 'exams';
  else if (dbIdLow.includes('assignment')) key = 'assignments';
  
  if (key && Array.isArray(next[key])) {
  next[key] = (next[key] as AcademicItem[]).map(item => {
  if (item.id === itemId) {
  const updated = {...item, ...properties} as AcademicItem
  if (properties.title) updated.id = properties.title as string
  return updated
}
  return item
})
}
  return next
})

  try {
  if (properties.title && properties.title !== itemId) {
  await sidecarApi.renameVaultFile(dbId, itemId, properties.title)
} else {
  await sidecarApi.updateVaultRow(dbId, itemId, properties)
}
  fetchData()
} catch {
  toast.error('Update failed')
  fetchData() // Revert to server state
}
}, [fetchData])

  const onCreate = useCallback(async (dbId: string, title: string, props?: Record<string, unknown>): Promise<string | null> => {
  const dbIdLow = dbId.toLowerCase();
  // Optimistic update for creation
  setData(prev => {
  if (!prev) return prev
  const next = {...prev}
  let key: keyof AcademicData | undefined;
  if (dbIdLow.includes('year')) key = 'years';
  else if (dbIdLow.includes('semester')) key = 'semesters';
  else if (dbIdLow.includes('course')) key = 'courses';
  else if (dbIdLow.includes('study planner') || dbIdLow.includes('study_sessions')) key = 'study_sessions';
  else if (dbIdLow.includes('exam')) key = 'exams';
  else if (dbIdLow.includes('assignment')) key = 'assignments';
  
  if (key && Array.isArray(next[key])) {
  const newItem = {id: title, title, ...props} as AcademicItem
  next[key] = [...(next[key] as AcademicItem[]), newItem]
}
  return next
})

  try {
  // Fill missing schema properties with empty strings or default wraps
  const finalProps = { ...props }
  const schema = DEFAULT_SCHEMAS[dbIdLow] || {}
  for (const [k, v] of Object.entries(schema)) {
    if (!(k in finalProps)) {
      finalProps[k] = v.type === 'relation' ? wrapWL('') : ''
    }
  }

  const res = await sidecarApi.createVaultRow(dbId, title, finalProps)
  fetchData()
  return res.id || null
} catch {
  toast.error('Creation failed')
  fetchData()
  return null
}
}, [fetchData])

  const onDelete = useCallback(async (dbId: string, itemId: string) => {
    try {
      await sidecarApi.deleteVaultRow(dbId, itemId)
      fetchData()
    } catch {toast.error('Delete failed')}
  }, [fetchData])

  const onScaffold = useCallback(async (name: string, years: number, level: string, currentYearIdx: number) => {
    try {
      const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
      const cleanName = name.replace(/_/g, ' ').trim()
      
      const createPromises = []
      for (let i = 0; i < years; i++) {
        const title = `Year ${romans[i] || (i + 1)}`
        const status = i < currentYearIdx ? '[[Completed]]' : i === currentYearIdx ? '[[Active]]' : '[[Planned]]'
        const isCurrent = i === currentYearIdx
        
        createPromises.push(sidecarApi.createVaultRow('years', title, {
          Status: status,
          'Academic Level': `[[${level}]]`,
          'Current Year': isCurrent,
          Program: `[[${cleanName}]]`
        }))
      }
      await Promise.all(createPromises)
      toast.success('Program roadmap deployed')
      fetchData()
    } catch (err) {
      console.error('Scaffold failed', err)
      toast.error('Failed to deploy roadmap')
    }
  }, [fetchData])

 const handleSync = useCallback(async () => {
 try {
 await sidecarApi.academicsSyncProfile()
 toast.success('Vault synced')
 fetchData()
 fetchDatabases()
 } catch {toast.error('Sync failed')}
 }, [fetchData, fetchDatabases])

  useEffect(() => {
    const yearsList = data?.years || []
    const semestersList = data?.semesters || []
    const activeYear = yearsList.find(y => getBoolVal(y, 'Current Year', 'current_year') || stripWL(getVal(y, 'Status', 'status')).toLowerCase().includes('active')) || yearsList[0]
    const activeProgram = activeYear ? cleanTitle(stripWL(getVal(activeYear, 'Program', 'program'))) : ''
    const activeYearTitle = activeYear ? cleanTitle(activeYear.title || '') : ''
    const activeSem = semestersList.find(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase().includes('active'))
    const activeSemTitle = activeSem ? cleanTitle(activeSem.title || '') : ''

    setCenterContent(
      activeProgram ? (
        <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 select-none flex items-center gap-1.5 font-sans">
          <span>{activeProgram}</span>
          {activeYearTitle && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-foreground/85">{activeYearTitle}</span>
            </>
          )}
          {activeSemTitle && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-foreground/85">{activeSemTitle}</span>
            </>
          )}
        </div>
      ) : null
    )

    setRightContent(
      <div className="flex items-center gap-2 shrink-0">
        <button 
          aria-label="Sync Vault Databases" 
          onClick={handleSync} 
          data-tour="db-sync"
          className="h-8 px-3 flex items-center justify-center rounded-[8px] bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-bento-item hover:border-foreground/30 transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer" 
          title="Sync Vault Databases"
        >
          <RefreshCw size={12} />
        </button>

        <button 
          onClick={() => nav('/obsidian?graph=1')}
          className="h-8 px-3 flex items-center justify-center rounded-[8px] bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-bento-item hover:border-foreground/30 transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
          title="Graph View"
        >
          <Network size={12} />
          <span>Graph View</span>
        </button>
      </div>
    )
    return () => {
      setCenterContent(null)
      setRightContent(null)
    }
  }, [data, activeTab, handleSync, setCenterContent, setRightContent, nav])

 // ── Tab definitions ────────────────────────────────────────────────────────
 const augmentedDatabases = useMemo(() => {
   return databases.map(db => {
     const schema = DEFAULT_SCHEMAS[db.id.toLowerCase()] || {}
     return { ...db, schema: { ...schema, ...db.schema } }
   })
 }, [databases])

   const tabs = React.useMemo(() => [
    {id: 'PROGRAM' as AcademicTab, label: 'Home', icon: <Home size={11} />, dataTour: 'tab-academic-home'},
    {id: 'SEMESTERS' as AcademicTab, label: 'Semesters', icon: <Layers size={11} />, dataTour: 'tab-academic-semesters'},
    {id: 'COURSES' as AcademicTab, label: 'Courses', icon: <BookOpen size={11} />, dataTour: 'tab-academic-courses'},
    {id: 'HUBS' as AcademicTab, label: 'Hubs', icon: <FolderOpen size={11} />, dataTour: 'tab-academic-hubs'},
    {id: 'PLANNER' as AcademicTab, label: 'Study Planners', icon: <FolderOpen size={11} />, dataTour: 'tab-academic-planner'},
    {id: 'ASSIGNMENTS' as AcademicTab, label: 'Assignments', icon: <ClipboardList size={11} />, dataTour: 'tab-academic-assignments'},
    {id: 'EXAMS' as AcademicTab, label: 'Exams', icon: <FlaskConical size={11} />, dataTour: 'tab-academic-exams'},
   ], [])

  useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col gap-1 w-full font-sans">
        <div className="px-3 mb-2 flex items-center gap-2 select-none">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Academic Navigation</span>
          <div className="h-px flex-1 bg-border/20" />
        </div>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSearchParams({ tab: t.id })}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none outline-none focus-visible:ring-1 focus-visible:ring-primary",
              activeTab === t.id
                ? "bg-bento-item text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
            )}
            data-tour={t.dataTour}
          >
            <span className="shrink-0 text-muted-foreground">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>,
      'academic'
    )
    return () => {
      setSidebarContent(null, 'academic')
    }
  }, [activeTab, tabs, setSidebarContent, setSearchParams])

 // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
  // Don't trigger if user is typing in an input/textarea
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

  // Tabs: Cmd/Ctrl + 1-6
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
   e.preventDefault()
   const index = parseInt(e.key) - 1
   if (tabs[index]) setActiveTab(tabs[index].id)
  }
 }
 window.addEventListener('keydown', handleKeyDown)
 return () => window.removeEventListener('keydown', handleKeyDown)
 }, [tabs, setActiveTab])
 // ── Tab props ──────────────────────────────────────────────────────────────
 const tabProps: TabProps = {
  data: data!,
  databases: augmentedDatabases,
  onUpdate,
  onCreate,
  onDelete,
  onOpenNote: (path) => nav(`/obsidian?path=${encodeURIComponent(path)}`),
  navigateTo: (tab, id) => {
    setSearchParams(prev => {
      prev.set('tab', tab.toUpperCase())
      if (id) prev.set('id', id)
      else prev.delete('id')
      return prev
    })
   },
   onRefresh: fetchData,
   onScaffold,
  }

 // ── Loading ────────────────────────────────────────────────────────────────
 if (loading) {
  return <BlockingLoader label="Opening Academic Dashboard" />
 }

 return (
  <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden gap-3">
     {/* Tab content area */}
     <div className="flex-1 overflow-hidden">
      {data && (
       <>
        {activeTab === 'PROGRAM' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <ProgramTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'YEARS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <YearsTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'SEMESTERS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <SemestersTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'COURSES' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <CoursesTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'HUBS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <StudyPlannerTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'PLANNER' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <StudyPlannerTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'ASSIGNMENTS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <AssignmentsTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'EXAMS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <ExamsTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}
       </>
      )}
     </div>
  </div>
 )
}
