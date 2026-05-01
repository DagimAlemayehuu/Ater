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
    Search
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
}

interface VaultDatabase {
    id: string
    name: string
    schema: Record<string, any>
    type: string
    area?: string
    views?: any[]
}

type AcademicTab = 'overview' | 'sync' | 'practice'

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
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Timeline</span>
                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground/80">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-md transition-colors border border-border/40 text-muted-foreground/40 hover:text-foreground">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-border/40 hover:bg-muted transition-all">Today</button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-md transition-colors border border-border/40 text-muted-foreground/40 hover:text-foreground">
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
                    <div key={day} className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 py-2">
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
                                isToday(cloneDay) ? "text-foreground" : "text-muted-foreground/20"
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
    const [activeTab, setActiveTab] = useState<AcademicTab>('overview')
    const [showCalendar, setShowCalendar] = useState(true)
    
    const [databases, setDatabases] = useState<VaultDatabase[]>([])
    const [selectedDb, setSelectedDb] = useState<VaultDatabase | null>(null)
    const [dbLoading, setDbLoading] = useState(false)
    const [dbSearch, setDbSearch] = useState('')
    const [globalNotePath, setGlobalNotePath] = useState<string | null>(null)

    const navigate = useNavigate()

    const fetchData = async () => {
        try {
            const res = await sidecarApi.academicsDashboard()
            setData(res as any)
        } catch (err) {
            console.error("Failed to fetch academic data", err)
            toast.error("Offline")
        } finally {
            setLoading(false)
        }
    }

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
    }, [fetchDatabases])

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
        <div className="h-full flex-1 flex flex-col bg-background font-sans overflow-hidden animate-in fade-in duration-500">
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
                    <aside className="w-[60%] border-r border-border/10 p-12 flex flex-col overflow-hidden animate-in slide-in-from-left duration-500">
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
                                    {(selectedCourseId || (activeTab === 'sync' && selectedDb)) && (
                                        <button 
                                            onClick={() => {
                                                if (activeTab === 'sync' && selectedDb) setSelectedDb(null)
                                                else setSelectedCourseId(null)
                                            }}
                                            className="p-2 hover:bg-muted rounded-md transition-colors border border-border/40 text-muted-foreground/40 hover:text-foreground"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                    )}
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
                                            {selectedCourseId ? "Subject" : (activeTab === 'sync' && selectedDb) ? "Database" : "Command Center"}
                                        </span>
                                        <h1 className="text-xl font-black tracking-tight uppercase text-foreground/80 truncate max-w-[240px]">
                                            {selectedCourseId ? selectedCourse?.title : (activeTab === 'sync' && selectedDb) ? selectedDb.name : "Academic Hub"}
                                        </h1>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                                            showCalendar 
                                                ? "bg-muted border-border/40 text-muted-foreground/40 hover:text-foreground" 
                                                : "border-foreground text-foreground hover:bg-foreground hover:text-background"
                                        )}
                                    >
                                        {showCalendar ? <EyeOff size={14} /> : <Eye size={14} />}
                                        <span className="hidden sm:inline">{showCalendar ? "Hide Calendar" : "Show Calendar"}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-muted/10 p-1 rounded-xl border border-border/10">
                                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutGrid size={14} />} label="Overview" />
                                <TabButton active={activeTab === 'sync'} onClick={() => setActiveTab('sync')} icon={<RefreshCw size={14} />} label="Sync" />
                                <TabButton active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} icon={<BrainCircuit size={14} />} label="Practice" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'practice' ? (
                            <div className="h-full w-full bg-background overflow-hidden animate-in fade-in duration-500">
                                <PracticeModule />
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-12 pb-32">
                                {activeTab === 'overview' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                        {!selectedCourseId ? (
                                            <>
                                                <section className="space-y-6">
                                                    <SectionHeader title="Active Courses" />
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {activeCourses.map((course, idx) => (
                                                            <CourseCard key={idx} course={course} onClick={() => setSelectedCourseId(course.id)} />
                                                        ))}
                                                        {activeCourses.length === 0 && <EmptyState message="No courses." />}
                                                    </div>
                                                </section>
                                                <section className="space-y-6">
                                                    <SectionHeader title="Upcoming" />
                                                    <div className="space-y-1">
                                                        {upcomingAssignments.slice(0, 4).map((item, idx) => (
                                                            <TimelineItem key={idx} title={item.title} date={item.due_date} type="Task" onClick={() => navigate(`/obsidian?path=3-Database/03 - Assignments/${item.id}.md`)} />
                                                        ))}
                                                    </div>
                                                </section>
                                            </>
                                        ) : (
                                            <section className="space-y-6">
                                                <SectionHeader title="Study Modules" />
                                                <div className="grid grid-cols-1 gap-2">
                                                    {courseHubs.map((hub, idx) => (
                                                        <HubCard key={idx} hub={hub} onClick={() => navigate(`/obsidian?path=3-Database/06 - Study Planner/${hub.id}.md&fullscreen=true`)} />
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'sync' && (
                                    <div className="h-full flex flex-col -m-10 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
                                        {selectedDb ? (
                                            <ObsidianDatabaseView database={selectedDb as any} onBack={() => setSelectedDb(null)} onNavigate={handleNavigate} onRefresh={fetchDatabases} />
                                        ) : (
                                            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                                                <section className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <SectionHeader title="Database Sync" />
                                                        <button onClick={handleSync} className="p-2 border border-border/40 rounded-md hover:bg-muted transition-all"><RefreshCw size={14} /></button>
                                                    </div>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={14} />
                                                        <input type="text" placeholder="SEARCH..." value={dbSearch} onChange={(e) => setDbSearch(e.target.value)} className="w-full bg-muted/10 border border-border/40 rounded-lg pl-9 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-0" />
                                                    </div>
                                                    <div className="space-y-8">
                                                        {Object.entries(categorizedDbs).map(([area, dbs]) => (
                                                            <div key={area} className="space-y-3">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">{area}</span>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {dbs.map(db => (
                                                                        <div key={db.id} onClick={() => setSelectedDb(db)} className="flex items-center justify-between p-5 border border-border/40 rounded-lg hover:border-foreground/20 cursor-pointer transition-all">
                                                                            <span className="text-[11px] font-black uppercase tracking-tight text-foreground/70">{db.name}</span>
                                                                            <ChevronRight size={14} className="text-muted-foreground/20" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                    : "text-muted-foreground/30 hover:text-muted-foreground"
            )}
        >
            {icon}
            <span className="hidden lg:inline">{label}</span>
        </button>
    )
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-4">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">{title}</h2>
            <div className="h-px flex-1 bg-border/10" />
        </div>
    )
}

function CourseCard({ course, onClick }: { course: any, onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-5 border border-border/40 rounded-xl hover:border-foreground/20 cursor-pointer transition-all flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-tight text-foreground/70">{course.title}</span>
                <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">{course.Professor || 'General'}</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20" />
        </div>
    )
}

function HubCard({ hub, onClick }: { hub: any, onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-5 border border-border/40 rounded-xl hover:border-foreground/20 cursor-pointer transition-all flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-tight text-foreground/70">{hub.title}</span>
                <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">Unit {hub.unit || '--'}</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20" />
        </div>
    )
}

function TimelineItem({ title, date, type, onClick }: { title: string, date: string, type: string, onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-4 border-b border-border/10 flex items-center justify-between hover:bg-muted/5 cursor-pointer transition-all">
            <span className="text-[11px] font-black uppercase tracking-tight text-foreground/60">{title}</span>
            <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">{date ? format(parseISO(date), 'MMM dd') : '--'}</span>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 text-center border border-dashed border-border/20 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">{message}</p>
        </div>
    )
}
