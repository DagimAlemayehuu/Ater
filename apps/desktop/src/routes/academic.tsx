import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ChevronRight,
    LayoutGrid,
    ArrowLeft,
    Layers,
    ChevronLeft,
    RefreshCw,
    Database,
    Eye,
    EyeOff,
    BrainCircuit,
    Search,
    Edit3,
    Hash,
    Plus,
    X,
    Check,
    Trash2
} from 'lucide-react'
import { 
    format, 
    subMonths, 
    addMonths,
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addDays, 
    isToday,
    parseISO
} from 'date-fns'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ObsidianDatabaseView from './obsidian-database-view'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'
import { PracticeModule } from './practice'

interface AcademicData {
    semesters: any[]
    courses: any[]
    units: any[]
    exams: any[]
    assignments: any[]
    study_sessions: any[]
    years: any[]
}

interface VaultDatabase {
    id: string
    name: string
    schema: Record<string, any>
    type: string
    area?: string
    views?: any[]
}

type AcademicTab = 'years' | 'semesters' | 'courses' | 'planner' | 'assignments' | 'exams' | 'practice' | 'sync'

/* ─── Master Calendar Component ─── */
function MasterCalendar({ data, selectedCourseId, onSelectEvent }: { data: AcademicData | null, selectedCourseId: string | null, onSelectEvent: (path: string) => void }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const events = useMemo(() => {
        if (!data) return []
        const all = [
            ...(data.assignments || []).map(a => ({ ...a, type: 'Assignment', date: a.due_date })),
            ...(data.exams || []).map(e => ({ ...e, type: 'Exam', date: e.date }))
        ]
        if (selectedCourseId) {
            const courseName = data.courses.find(c => c.id === selectedCourseId)?.title || ''
            return all.filter(e => String(e.course || e.Course || '').includes(courseName))
        }
        return all
    }, [data, selectedCourseId])

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/70">Timeline</span>
                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-md transition-colors border border-border/40 text-muted-foreground/60 hover:text-foreground">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-border/40 hover:bg-muted transition-all">Today</button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-md transition-colors border border-border/40 text-muted-foreground/60 hover:text-foreground">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map(day => (
                    <div key={day} className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 py-2">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const rows = []
        let days = []
        let day = startDate
        let formattedDate = ''

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd')
                const cloneDay = day
                const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), cloneDay))
                
                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            "min-h-[100px] p-2 border-[0.5px] border-border/10 flex flex-col gap-1.5 transition-all group/cell",
                            !isSameMonth(day, monthStart) ? "bg-muted/5 opacity-20" : "bg-background",
                            isToday(day) && "ring-1 ring-inset ring-foreground/5 bg-foreground/[0.01]"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className={cn(
                                "text-[10px] font-black tracking-widest uppercase",
                                isToday(cloneDay) ? "text-foreground" : "text-muted-foreground/80"
                            )}>
                                {formattedDate}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {dayEvents.map((event, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelectEvent(event.type === 'Assignment' ? `3-Database/03 - Assignments/${event.id}.md` : `3-Database/04 - Exams/${event.id}.md`)}
                                    className={cn(
                                        "text-[8px] font-black uppercase tracking-widest p-1.5 rounded-sm text-left truncate transition-all border",
                                        event.type === 'Exam' 
                                            ? "bg-foreground text-background border-foreground hover:opacity-80" 
                                            : "bg-muted/10 text-foreground/60 border-border/40 hover:bg-muted/20",
                                        event.done && "opacity-30 line-through grayscale"
                                    )}
                                >
                                    {event.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )
                day = addDays(day, 1)
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            )
            days = []
        }
        return <div className="border border-border/10 rounded-xl overflow-hidden">{rows}</div>
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {renderHeader()}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                {renderDays()}
                {renderCells()}
            </div>
        </div>
    )
}

export default function AcademicDashboard() {
    const [data, setData] = useState<AcademicData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<AcademicTab>('courses')
    const [showCalendar, setShowCalendar] = useState(true)
    
    const [databases, setDatabases] = useState<VaultDatabase[]>([])
    const [selectedDb, setSelectedDb] = useState<VaultDatabase | null>(null)
    const [dbLoading, setDbLoading] = useState(false)
    const [dbSearch, setDbSearch] = useState('')
    const [globalNotePath, setGlobalNotePath] = useState<string | null>(null)
    
    // Custom Creation UI State
    const [createContext, setCreateContext] = useState<{ dbId: string, isCourse: boolean } | null>(null)
    const [createName, setCreateName] = useState('')

    const navigate = useNavigate()

    const fetchData = useCallback(async () => {
        try {
            const res = await sidecarApi.academicsDashboard()
            setData(res as any)
        } catch (err) {
            console.error("Failed to fetch academic data", err)
            toast.error("Offline")
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchDatabases = useCallback(async () => {
        setDbLoading(true)
        try {
            const res = await sidecarApi.listVaultDatabases()
            setDatabases(res.databases || [])
        } catch (err) {
            console.error(err)
        } finally {
            setDbLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
        fetchDatabases()
    }, [fetchData, fetchDatabases])

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div>
        )
    }

    const activeCourses = data?.courses || []
    const upcomingAssignments = data?.assignments?.filter(a => !a.done).sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime()) || []
    const allHubs = data?.study_sessions || []

    const selectedCourse = activeCourses.find(c => c.id === selectedCourseId)
    const courseHubs = allHubs.filter(h => {
        const courseProp = h.course || h.Course || ''
        const courseName = selectedCourse?.title || ''
        return String(courseProp).includes(courseName) || String(h.id).includes(courseName)
    })

    const courseDb = databases.find(db => db.id === "07 - Courses")
    const courseSchema = courseDb?.schema || {}

    const handleSync = async () => {
        try {
            await sidecarApi.academicsSyncProfile()
            toast.success("Sync Complete.")
            fetchData()
            fetchDatabases()
        } catch (err) {
            toast.error("Sync Error.")
        }
    }

    const handleUpdateCourseProperty = async (key: string, value: any) => {
        if (!selectedCourseId) return
        try {
            await sidecarApi.updateVaultRow("07 - Courses", selectedCourseId, { [key]: value })
            toast.success(`Updated ${key}`)
            fetchData()
        } catch (err) {
            toast.error("Update failed")
        }
    }

    const handleCreateCourse = () => {
        setCreateName('')
        setCreateContext({ dbId: "07 - Courses", isCourse: true })
    }

    const handleCreateRow = (dbId: string) => {
        setCreateName('')
        setCreateContext({ dbId, isCourse: false })
    }

    const confirmCreate = async () => {
        if (!createContext || !createName.trim()) return
        
        try {
            const res = await sidecarApi.createVaultRow(createContext.dbId, createName.trim(), createContext.isCourse ? { 
                type: 'Course',
                status: 'Active',
                code: 'NEW'
            } : {})
            
            toast.success("Created")
            await fetchData()
            if (res.id) setSelectedCourseId(res.id)
        } catch (err) {
            toast.error("Creation failed")
        } finally {
            setCreateContext(null)
            setCreateName('')
        }
    }

    const handleUpdateRow = async (dbId: string, key: string, value: any) => {
        if (!selectedCourseId) return
        try {
            await sidecarApi.updateVaultRow(dbId, selectedCourseId, { [key]: value })
            toast.success(`Updated ${key}`)
            fetchData()
        } catch (err) {
            toast.error("Update failed")
        }
    }

    const handleDeleteRow = async (dbId: string, id: string) => {
        try {
            await sidecarApi.deleteVaultRow(dbId, id)
            toast.success("Deleted")
            setSelectedCourseId(null)
            fetchData()
        } catch (err) {
            toast.error("Deletion failed")
        }
    }

    const handleDeleteCourse = async () => {
        if (!selectedCourseId) return
        try {
            await sidecarApi.deleteVaultRow("07 - Courses", selectedCourseId)
            toast.success("Course deleted")
            setSelectedCourseId(null)
            fetchData()
        } catch (err) {
            toast.error("Deletion failed")
        }
    }

    const handleNavigate = async (pageName: string) => {
        try {
            const res = await sidecarApi.findVaultPage(pageName)
            if (res.found) {
                if (res.type === 'database' && res.db_id) {
                    const targetDb = databases.find(db => db.id === res.db_id)
                    if (targetDb) {
                        setSelectedDb(targetDb)
                        setGlobalNotePath(null)
                    }
                } else if (res.type === 'note' && res.path) {
                    setGlobalNotePath(res.path)
                }
            } else {
                toast.error(`"${pageName}" not found.`)
            }
        } catch (err) {
            console.error("Nav error", err)
        }
    }

    const filteredDbs = databases.filter(db => db.name.toLowerCase().includes(dbSearch.toLowerCase()))
    const categorizedDbs: Record<string, VaultDatabase[]> = {}
    filteredDbs.forEach(db => {
        const area = db.area || 'Other'
        if (!categorizedDbs[area]) categorizedDbs[area] = []
        categorizedDbs[area].push(db)
    })

    return (
        <div className="h-full flex-1 flex flex-col bg-background font-sans overflow-hidden">
            {globalNotePath && (
                <ObsidianPagePanel
                    isOpen={!!globalNotePath}
                    onClose={() => setGlobalNotePath(null)}
                    fullPath={globalNotePath}
                    onNavigate={handleNavigate}
                />
            )}

            <div className="flex flex-1 overflow-hidden h-full">
                {showCalendar && (
                    <aside className="w-[60%] border-r border-border/10 p-12 flex flex-col overflow-hidden">
                        <MasterCalendar 
                            data={data} 
                            selectedCourseId={selectedCourseId}
                            onSelectEvent={(path) => navigate(`/obsidian?path=${path}`)}
                        />
                    </aside>
                )}

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-10 pt-12 shrink-0">
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {(selectedCourseId) && (
                                        <button 
                                            onClick={() => {
                                                setSelectedCourseId(null)
                                            }}
                                            className="p-2 hover:bg-muted rounded-md transition-colors border border-border/40 text-muted-foreground/60 hover:text-foreground"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                    )}
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                            {selectedCourseId ? "Subject" : activeTab.toUpperCase()}
                                        </span>
                                        <h1 className="text-xl font-black tracking-tight uppercase text-foreground truncate max-w-[240px]">
                                            {selectedCourseId ? (
                                                activeTab === 'courses' ? selectedCourse?.title : 
                                                activeTab === 'assignments' ? data?.assignments?.find(a => a.id === selectedCourseId)?.title :
                                                activeTab === 'exams' ? data?.exams?.find(e => e.id === selectedCourseId)?.title :
                                                activeTab === 'planner' ? data?.study_sessions?.find(s => s.id === selectedCourseId)?.title :
                                                activeTab === 'semesters' ? data?.semesters?.find(s => s.id === selectedCourseId)?.title :
                                                data?.courses?.find(c => c.id === selectedCourseId)?.title // Fallback
                                            ) : "Academic Hub"}
                                        </h1>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                                            showCalendar 
                                                ? "bg-muted border-border/40 text-muted-foreground/60 hover:text-foreground" 
                                                : "border-foreground text-foreground hover:bg-foreground hover:text-background"
                                        )}
                                    >
                                        {showCalendar ? <EyeOff size={14} /> : <Eye size={14} />}
                                        <span className="hidden sm:inline">{showCalendar ? "Hide Calendar" : "Show Calendar"}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-muted/10 p-1 rounded-xl border border-border/10 overflow-x-auto custom-scrollbar">
                                <TabButton active={activeTab === 'years'} onClick={() => {setActiveTab('years'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Layers size={14} />} label="Years" />
                                <TabButton active={activeTab === 'semesters'} onClick={() => {setActiveTab('semesters'); setSelectedCourseId(null); setCreateContext(null)}} icon={<LayoutGrid size={14} />} label="Semesters" />
                                <TabButton active={activeTab === 'courses'} onClick={() => {setActiveTab('courses'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Database size={14} />} label="Courses" />
                                <TabButton active={activeTab === 'planner'} onClick={() => {setActiveTab('planner'); setSelectedCourseId(null); setCreateContext(null)}} icon={<RefreshCw size={14} />} label="Study Planner" />
                                <TabButton active={activeTab === 'assignments'} onClick={() => {setActiveTab('assignments'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Edit3 size={14} />} label="Assignments" />
                                <TabButton active={activeTab === 'exams'} onClick={() => {setActiveTab('exams'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Hash size={14} />} label="Exams" />
                                <TabButton active={activeTab === 'practice'} onClick={() => {setActiveTab('practice'); setSelectedCourseId(null); setCreateContext(null)}} icon={<BrainCircuit size={14} />} label="Practice" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'practice' ? (
                            <div className="h-full w-full bg-background overflow-hidden">
                                <PracticeModule noAnimation={true} />
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-12 pb-32">
                                <div className="max-w-4xl mx-auto h-full">
                                    {createContext && (
                                        <div className="p-4 bg-muted/10 border border-primary/20 rounded-xl mb-8 flex gap-3 shadow-lg shadow-primary/5 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Plus size={14} />
                                            </div>
                                            <input 
                                                autoFocus
                                                value={createName}
                                                onChange={e => setCreateName(e.target.value)}
                                                placeholder={`Name for new ${createContext.dbId.split(' - ')[1].slice(0, -1)}...`}
                                                className="flex-1 bg-transparent border-b border-primary/40 focus:border-primary text-sm font-bold text-foreground focus:outline-none transition-colors"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') confirmCreate()
                                                    if (e.key === 'Escape') setCreateContext(null)
                                                }}
                                            />
                                            <button onClick={confirmCreate} className="px-4 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-black rounded hover:opacity-90 transition-opacity">Deploy</button>
                                            <button onClick={() => setCreateContext(null)} className="px-4 bg-muted border border-border/40 text-muted-foreground text-[10px] uppercase tracking-widest font-black rounded hover:bg-muted/80 transition-colors">Abort</button>
                                        </div>
                                    )}
                                    {activeTab === 'years' && (
                                        <UniversalDatabaseTab 
                                            dbId="09 - Years"
                                            data={data?.years || []}
                                            databases={databases}
                                            selectedId={selectedCourseId}
                                            onSelect={setSelectedCourseId}
                                            onUpdate={(key, val) => handleUpdateRow("09 - Years", key, val)}
                                            onCreate={() => handleCreateRow("09 - Years")}
                                            onDelete={(id) => handleDeleteRow("09 - Years", id)}
                                        />
                                    )}

                                    {activeTab === 'semesters' && (
                                        <UniversalDatabaseTab 
                                            dbId="08 - Semesters"
                                            data={data?.semesters || []}
                                            databases={databases}
                                            selectedId={selectedCourseId}
                                            onSelect={setSelectedCourseId}
                                            onUpdate={(key, val) => handleUpdateRow("08 - Semesters", key, val)}
                                            onCreate={() => handleCreateRow("08 - Semesters")}
                                            onDelete={(id) => handleDeleteRow("08 - Semesters", id)}
                                        />
                                    )}

                                    {activeTab === 'courses' && (
                                        <div className="space-y-12">
                                        {!selectedCourseId ? (
                                            <>
                                                <section className="space-y-6">
                                                    <SectionHeader title="Active Courses" onAction={handleCreateCourse} />
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {(data?.courses || []).filter(c => c.Status !== 'Completed').map((course, idx) => (
                                                            <CourseCard key={idx} course={course} onClick={() => setSelectedCourseId(course.id)} />
                                                        ))}
                                                        {(data?.courses || []).filter(c => c.Status !== 'Completed').length === 0 && <EmptyState message="No active courses." />}
                                                    </div>
                                                </section>
                                                <section className="space-y-6">
                                                    <SectionHeader title="History" />
                                                    <div className="grid grid-cols-1 gap-2 opacity-60">
                                                        {(data?.courses || []).filter(c => c.Status === 'Completed').map((course, idx) => (
                                                            <CourseCard key={idx} course={course} onClick={() => setSelectedCourseId(course.id)} />
                                                        ))}
                                                    </div>
                                                </section>
                                            </>
                                        ) : (
                                            <div className="space-y-12">
                                                <section className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <SectionHeader title="Course Configuration" />
                                                        <button 
                                                            onClick={() => handleDeleteCourse(selectedCourseId)}
                                                            className="p-1.5 hover:bg-destructive/10 text-muted-foreground/20 hover:text-destructive transition-all rounded-md"
                                                            title="Delete Course"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <CoursePropertyGrid 
                                                        course={selectedCourse} 
                                                        schema={courseSchema}
                                                        onUpdate={handleUpdateCourseProperty} 
                                                    />
                                                </section>

                                                <section className="space-y-6">
                                                    <SectionHeader title="Study Planner Modules" />
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {courseHubs.map((hub, idx) => (
                                                            <HubCard key={idx} hub={hub} onClick={() => navigate(`/obsidian?path=3-Database/06 - Study Planner/${hub.id}.md&fullscreen=true`)} />
                                                        ))}
                                                        {courseHubs.length === 0 && <EmptyState message="No study modules found." />}
                                                    </div>
                                                </section>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'planner' && (
                                    <UniversalDatabaseTab 
                                        dbId="06 - Study Planner"
                                        data={data?.study_sessions || []}
                                        databases={databases}
                                        selectedId={selectedCourseId}
                                        onSelect={setSelectedCourseId}
                                        onUpdate={(key, val) => handleUpdateRow("06 - Study Planner", key, val)}
                                        onCreate={() => handleCreateRow("06 - Study Planner")}
                                        onDelete={(id) => handleDeleteRow("06 - Study Planner", id)}
                                    />
                                )}

                                {activeTab === 'assignments' && (
                                    <UniversalDatabaseTab 
                                        dbId="03 - Assignments"
                                        data={data?.assignments || []}
                                        databases={databases}
                                        selectedId={selectedCourseId}
                                        onSelect={setSelectedCourseId}
                                        onUpdate={(key, val) => handleUpdateRow("03 - Assignments", key, val)}
                                        onCreate={() => handleCreateRow("03 - Assignments")}
                                        onDelete={(id) => handleDeleteRow("03 - Assignments", id)}
                                    />
                                )}

                                {activeTab === 'exams' && (
                                    <UniversalDatabaseTab 
                                        dbId="04 - Exams"
                                        data={data?.exams || []}
                                        databases={databases}
                                        selectedId={selectedCourseId}
                                        onSelect={setSelectedCourseId}
                                        onUpdate={(key, val) => handleUpdateRow("04 - Exams", key, val)}
                                        onCreate={() => handleCreateRow("04 - Exams")}
                                        onDelete={(id) => handleDeleteRow("04 - Exams", id)}
                                    />
                                )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                active 
                    ? "bg-background text-foreground shadow-sm border border-border/40" 
                    : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
        >
            {icon}
            <span className="hidden lg:inline">{label}</span>
        </button>
    )
}

function UniversalDatabaseTab({ 
    dbId, 
    data, 
    databases, 
    onSelect, 
    selectedId,
    onUpdate,
    onCreate,
    onDelete,
    customDataFetcher
}: { 
    dbId: string, 
    data: any[], 
    databases: VaultDatabase[], 
    onSelect: (id: string | null) => void,
    selectedId: string | null,
    onUpdate: (key: string, value: any) => void,
    onCreate: () => void,
    onDelete: (id: string) => void,
    customDataFetcher?: () => Promise<any[]>
}) {
    const [localData, setLocalData] = useState<any[]>(data)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (customDataFetcher) {
            setLoading(true)
            customDataFetcher().then(res => {
                setLocalData(res)
                setLoading(false)
            }).catch(() => setLoading(false))
        } else {
            setLocalData(data)
        }
    }, [data, customDataFetcher])

    const db = databases.find(d => d.id === dbId)
    const schema = db?.schema || {}
    const selectedItem = localData.find(i => i.id === selectedId)

    if (selectedId && selectedItem) {
        return (
            <div className="space-y-12">
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Properties" />
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onDelete(selectedId)}
                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground/20 hover:text-destructive transition-all rounded-md"
                                title="Delete Item"
                            >
                                <Trash2 size={12} />
                            </button>
                            <button 
                                onClick={() => navigate(`/obsidian?path=3-Database/${dbId}/${selectedId}.md`)}
                                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-all flex items-center gap-2"
                            >
                                Open Note <ChevronRight size={10} />
                            </button>
                        </div>
                    </div>
                    <CoursePropertyGrid 
                        course={selectedItem} 
                        schema={schema}
                        onUpdate={onUpdate} 
                    />
                </section>
                <section className="space-y-6">
                    <SectionHeader title="Note Content" />
                    <div className="p-8 border border-border/10 rounded-2xl bg-muted/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 text-center py-12">
                            Select 'Open Note' for full editor
                        </p>
                    </div>
                </section>
            </div>
        )
    }

    if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>

    return (
        <section className="space-y-6">
            <SectionHeader title={db?.name || 'Items'} onAction={onCreate} />
            <div className="grid grid-cols-1 gap-2">
                {localData.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => onSelect(item.id)} 
                        className="p-5 border border-border/40 rounded-xl hover:border-foreground/20 cursor-pointer transition-all flex items-center justify-between"
                    >
                        <div className="flex flex-col">
                            <span className="text-[12px] font-black uppercase tracking-tight text-foreground">{item.title || item.id}</span>
                            <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                {item.code || item.date || item.status || (item.due_date ? `Due ${format(parseISO(item.due_date), 'MMM dd')}` : 'Active')}
                            </span>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/20" />
                    </div>
                ))}
                {localData.length === 0 && <EmptyState message="Nothing found." />}
            </div>
        </section>
    )
}

function SectionHeader({ title, onAction }: { title: string, onAction?: () => void }) {
    return (
        <div className="flex items-center gap-4">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">{title}</h2>
            <div className="h-px flex-1 bg-border/10" />
            {onAction && (
                <button onClick={onAction} className="p-1 hover:bg-muted rounded-md text-muted-foreground/40 hover:text-foreground transition-all">
                    <Plus size={10} />
                </button>
            )}
        </div>
    )
}

function CourseCard({ course, onClick }: { course: any, onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-5 border border-border/40 rounded-xl hover:border-foreground/20 cursor-pointer transition-all flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-tight text-foreground">{course.title}</span>
                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">{course.Professor || 'General'}</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20" />
        </div>
    )
}

function HubCard({ hub, onClick }: { hub: any, onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-5 border border-border/40 rounded-xl hover:border-foreground/20 cursor-pointer transition-all flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-tight text-foreground">{hub.title}</span>
                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Unit {hub.unit || '--'}</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20" />
        </div>
    )
}

function TimelineItem({ title, date, type, onClick }: { title: string, date: string, type: string, onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-4 border-b border-border/10 flex items-center justify-between hover:bg-muted/5 cursor-pointer transition-all">
            <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">{title}</span>
            <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">{date ? format(parseISO(date), 'MMM dd') : '--'}</span>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 text-center border border-dashed border-border/20 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">{message}</p>
        </div>
    )
}

function SelectPropertyEditor({ value, source, onSave, onCancel }: { value: string, source?: string, onSave: (val: string) => void, onCancel: () => void }) {
    const [options, setOptions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingOption, setEditingOption] = useState<string | null>(null)
    const [newOptionValue, setNewOptionValue] = useState('')

    const refreshOptions = useCallback(() => {
        if (source) {
            setLoading(true)
            sidecarApi.getVaultOptions(source).then(res => {
                setOptions(res.options)
            }).catch(console.error).finally(() => setLoading(false))
        }
    }, [source])

    useEffect(() => {
        refreshOptions()
    }, [refreshOptions])

    const handleCreateOption = async () => {
        if (!source || !searchTerm) return
        try {
            await sidecarApi.createVaultOption(source, searchTerm)
            onSave(`[[${searchTerm}]]`)
        } catch (err) {
            toast.error("Failed to create option")
        }
    }

    const handleDeleteOption = async (e: React.MouseEvent, opt: string) => {
        e.stopPropagation()
        if (!source) return
        if (confirm(`Delete "${opt}"?`)) {
            try {
                await sidecarApi.deleteVaultOption(source, opt)
                refreshOptions()
            } catch (err) {
                toast.error("Failed to delete option")
            }
        }
    }

    const handleRenameOption = async (opt: string) => {
        if (!source || !newOptionValue) return
        try {
            await sidecarApi.updateVaultOption(source, opt, newOptionValue)
            setEditingOption(null)
            refreshOptions()
        } catch (err) {
            toast.error("Failed to rename option")
        }
    }

    const filteredOptions = options.filter(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Convert wiki link [[Option]] to raw option name for matching
    const rawValue = typeof value === 'string' && value.startsWith('[[') ? value.replace(/\[\[(.*?)\]\]/, '$1') : value

    return (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[240px] bg-background border border-border/10 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2">
                <input 
                    autoFocus
                    placeholder="Search or add..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Escape') onCancel()
                        if (e.key === 'Enter') {
                            if (filteredOptions.length > 0) {
                                onSave(`[[${filteredOptions[0]}]]`)
                            } else if (searchTerm) {
                                handleCreateOption()
                            }
                        }
                    }}
                    className="flex-1 bg-muted/5 border-none text-[10px] uppercase font-black px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary/20"
                />
                {searchTerm && !options.some(o => o.toLowerCase() === searchTerm.toLowerCase()) && (
                    <button 
                        onClick={handleCreateOption}
                        className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
            
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {loading && <span className="text-[9px] text-muted-foreground/40 px-3 py-1">Loading...</span>}
                {!loading && filteredOptions.length === 0 && !searchTerm && <span className="text-[9px] text-muted-foreground/40 px-3 py-1">No options</span>}
                
                {filteredOptions.map(opt => (
                    <div 
                        key={opt}
                        className={cn(
                            "group flex items-center justify-between px-3 py-1.5 rounded-md transition-all",
                            rawValue === opt ? "bg-primary/10 text-primary" : "hover:bg-muted/10 text-foreground/70"
                        )}
                    >
                        {editingOption === opt ? (
                            <input 
                                autoFocus
                                value={newOptionValue}
                                onChange={e => setNewOptionValue(e.target.value)}
                                onBlur={() => handleRenameOption(opt)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleRenameOption(opt)
                                    if (e.key === 'Escape') setEditingOption(null)
                                }}
                                className="flex-1 bg-transparent border-none text-[10px] font-black uppercase p-0 focus:ring-0"
                            />
                        ) : (
                            <button 
                                onClick={() => onSave(`[[${opt}]]`)}
                                className="flex-1 text-left text-[10px] font-black uppercase truncate"
                            >
                                {opt}
                            </button>
                        )}
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingOption(opt)
                                    setNewOptionValue(opt)
                                }}
                                className="p-1 hover:text-primary"
                            >
                                <Edit3 size={10} />
                            </button>
                            <button 
                                onClick={(e) => handleDeleteOption(e, opt)}
                                className="p-1 hover:text-destructive"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CoursePropertyGrid({ course, schema, onUpdate }: { course: any, schema: Record<string, any>, onUpdate: (key: string, value: any) => void }) {
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    // Merge schema keys with existing course properties, excluding internal ones
    const allKeys = useMemo(() => {
        const internalKeys = ['id', 'title', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by'];
        const keys = new Set([
            ...Object.keys(schema || {}),
            ...Object.keys(course || {})
        ]);
        return Array.from(keys).filter(key => !internalKeys.includes(key)).sort();
    }, [schema, course]);

    const handleSave = (key: string, overrideValue?: any) => {
        const valueToSave = overrideValue !== undefined ? overrideValue : editValue
        onUpdate(key, valueToSave)
        setEditingKey(null)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allKeys.map((key) => {
                const value = course?.[key]
                const isEmpty = value === undefined || value === null || value === ''
                const propSchema = schema?.[key] || {}
                const propType = propSchema.type || 'str'
                
                // For Checkbox (bool)
                if (propType === 'bool') {
                    const isChecked = value === true || value === 'true'
                    return (
                        <div key={key} className="p-4 bg-muted/5 border border-border/10 rounded-xl hover:bg-muted/10 transition-all flex items-center justify-between group/prop">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{key.replace(/_/g, ' ')}</span>
                            <button 
                                onClick={() => handleSave(key, !isChecked)}
                                className={cn(
                                    "w-4 h-4 flex items-center justify-center rounded transition-all",
                                    isChecked ? "bg-primary text-primary-foreground" : "border border-border/40 text-transparent hover:border-primary/50"
                                )}
                            >
                                <Check size={10} strokeWidth={4} />
                            </button>
                        </div>
                    )
                }
                
                return (
                    <div key={key} className="p-4 bg-muted/5 border border-border/10 rounded-xl hover:bg-muted/10 transition-all flex flex-col gap-2 group/prop relative">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{key.replace(/_/g, ' ')}</span>
                            <Edit3 size={10} className="text-muted-foreground/0 group-hover/prop:text-muted-foreground/20 transition-all" />
                        </div>
                        
                        {editingKey === key ? (
                            propType === 'select' || propType === 'relation' ? (
                                <SelectPropertyEditor 
                                    value={String(value || '')} 
                                    source={propSchema.source} 
                                    onSave={(v) => handleSave(key, v)} 
                                    onCancel={() => setEditingKey(null)} 
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input 
                                        autoFocus
                                        type={propType === 'date' ? 'date' : propType === 'number' ? 'number' : 'text'}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSave(key)
                                                e.currentTarget.blur()
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingKey(null)
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Don't save on blur for date pickers immediately, they can be tricky
                                            if (propType !== 'date') handleSave(key)
                                        }}
                                        className="flex-1 bg-transparent border-b border-primary text-[12px] font-bold text-foreground focus:outline-none pb-1"
                                    />
                                    <button onMouseDown={(e) => { e.preventDefault(); handleSave(key) }} className="p-1 hover:text-primary text-muted-foreground/40">
                                        <Check size={12}/>
                                    </button>
                                </div>
                            )
                        ) : (
                            <div 
                                className={cn(
                                    "text-[12px] font-bold cursor-text truncate min-h-[18px]",
                                    isEmpty ? "text-muted-foreground/20 italic" : "text-foreground",
                                    (propType === 'select' || propType === 'relation') && !isEmpty ? "text-primary hover:underline" : ""
                                )}
                                onClick={() => {
                                    setEditingKey(key)
                                    setEditValue(String(value || ''))
                                }}
                            >
                                {isEmpty ? 'Empty' : (
                                    propType === 'select' || propType === 'relation' ? 
                                        String(value).replace(/^\[\[(.*?)\]\]$/, '$1').split('/').pop() : 
                                    propType === 'date' ? 
                                        format(parseISO(String(value)), 'MMM dd, yyyy') :
                                        String(value)
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
            {allKeys.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-border/10 rounded-xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">No Configuration properties</span>
                </div>
            )}
        </div>
    )
}
