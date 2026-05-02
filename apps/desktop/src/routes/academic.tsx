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
    Trash2,
    BookOpen,
    Zap,
    Calendar,
    ChevronDown,
    ChevronUp
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
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis
} from 'recharts'


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

type AcademicTab = 'PROGRAM' | 'SEMESTERS' | 'COURSES' | 'PLANNER' | 'ASSIGNMENTS' | 'EXAMS' | 'PRACTICE' | 'SYNC'

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
    const [activeTab, setActiveTab] = useState<AcademicTab>('COURSES')
    const [showCalendar, setShowCalendar] = useState(true)
    
    const [databases, setDatabases] = useState<VaultDatabase[]>([])
    const [selectedDb, setSelectedDb] = useState<VaultDatabase | null>(null)
    const [dbLoading, setDbLoading] = useState(false)
    const [dbSearch, setDbSearch] = useState('')
    const [globalNotePath, setGlobalNotePath] = useState<string | null>(null)
    const [showCourseProps, setShowCourseProps] = useState(true)
    
    // Custom Creation UI State
    const [createContext, setCreateContext] = useState<{ dbId: string, isCourse: boolean, initialProps?: any } | null>(null)
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
        fetchData();
        
        // Real-time Vault Synchronization
        const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/vault/events`);
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Refresh data on any relevant vault change
                if (data.type === "vault_change" || data.type === "file_create" || data.type === "file_delete") {
                    fetchData();
                }
            } catch (err) {
                console.error("SSE Parse Error:", err);
            }
        };

        return () => eventSource.close();
    }, [])

    useEffect(() => {
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

    const handleCreateRow = (dbId: string, initialProps: any = {}) => {
        setCreateName('')
        setCreateContext({ dbId, isCourse: false, initialProps })
    }

    const confirmCreate = async () => {
        if (!createContext || !createName.trim()) return
        
        try {
            const res = await sidecarApi.createVaultRow(createContext.dbId, createName.trim(), {
                ...(createContext.isCourse ? { status: '[[Active]]', code: 'NEW' } : {}),
                ...(createContext.initialProps || {})
            })
            
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

    
    const handleSetCurrentYear = async (id: string) => {
        try {
            const years = data?.years || [];
            for (const y of years) {
                if (y.id === id) {
                    await sidecarApi.updateVaultRow("09 - Years", y.id, { "Current Year": true });
                } else if (y["Current Year"] === true || y["Current Year"] === "true") {
                    await sidecarApi.updateVaultRow("09 - Years", y.id, { "Current Year": false });
                }
            }
            toast.success("Current Year Set");
            fetchData();
        } catch(err) {
            toast.error("Failed to set year");
        }
    }

    const handleSetCurrentSemester = async (id: string) => {
        try {
            const semesters = data?.semesters || [];
            for (const s of semesters) {
                if (s.id === id) {
                    await sidecarApi.updateVaultRow("08 - Semesters", s.id, { "Status": "[[Active]]" });
                } else if (s["Status"] === "[[Active]]" || s["Status"] === "Active") {
                    await sidecarApi.updateVaultRow("08 - Semesters", s.id, { "Status": "[[Completed]]" });
                }
            }
            toast.success("Current Semester Set");
            fetchData();
        } catch(err) {
            toast.error("Failed to set semester");
        }
    }

    const handleScaffoldProgram = async (name: string, targetYears: number, level: string, currentYearIdx: number) => {
        try {
            setLoading(true)
            const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
            for (let i = 0; i < targetYears; i++) {
                const yearTitle = `Year ${romanNumerals[i] || (i + 1)}`;
                
                let status = "[[Planned]]";
                if (i < currentYearIdx) status = "[[Completed]]";
                else if (i === currentYearIdx) status = "[[Active]]";

                await sidecarApi.createVaultRow("09 - Years", yearTitle, {
                    Program: `[[${name}]]`,
                    "Academic Level": `[[${level}]]`,
                    Status: status,
                    "Current Year": i === currentYearIdx,
                    "Target Years": targetYears,
                    "Target Credits": 0,
                    "Earned Credits": 0,
                    "Cumulative GPA": 0.00
                });
            }
            toast.success(`Scaffolded ${name}`);
            fetchData();
        } catch (err) {
            toast.error("Scaffolding failed");
        } finally {
            setLoading(false)
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
                                <TabButton active={activeTab === 'PROGRAM'} onClick={() => {setActiveTab('PROGRAM'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Layers size={14} />} label="Program" />
                                <TabButton active={activeTab === 'COURSES'} onClick={() => {setActiveTab('COURSES'); setSelectedCourseId(null); setCreateContext(null)}} icon={<BookOpen size={14} />} label="Courses" />
                                <TabButton active={activeTab === 'PLANNER'} onClick={() => {setActiveTab('PLANNER'); setSelectedCourseId(null); setCreateContext(null)}} icon={<RefreshCw size={14} />} label="Study Planner" />
                                <TabButton active={activeTab === 'ASSIGNMENTS'} onClick={() => {setActiveTab('ASSIGNMENTS'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Edit3 size={14} />} label="Assignments" />
                                <TabButton active={activeTab === 'EXAMS'} onClick={() => {setActiveTab('EXAMS'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Hash size={14} />} label="Exams" />
                                <TabButton active={activeTab === 'PRACTICE'} onClick={() => {setActiveTab('PRACTICE'); setSelectedCourseId(null); setCreateContext(null)}} icon={<Zap size={14} />} label="Practice" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'PRACTICE' ? (
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
                                    {activeTab === 'PROGRAM' && (
                                        <YearsDashboard 
                                            data={data?.years || []} 
                                            fullData={data}
                                            databases={databases}
                                            selectedId={selectedCourseId} onSelect={setSelectedCourseId}
                                            onUpdate={(key:string, val:any) => handleUpdateRow("09 - Years", key, val)}
                                            onCreateYear={() => handleCreateRow("09 - Years")}
                                            onCreateSemester={(yearTitle: string) => handleCreateRow("08 - Semesters", { Year: `[[${yearTitle}]]` })}
                                            onCreateCourse={(semTitle: string) => handleCreateRow("07 - Courses", { Semester: `[[${semTitle}]]`, Status: "[[Active]]" })}
                                            onDelete={(id:string) => handleDeleteRow("09 - Years", id)}
                                            onSetCurrent={handleSetCurrentYear}
                                            onScaffold={handleScaffoldProgram}
                                            navigate={(tab: string, id: string) => {
                                                setActiveTab(tab as any);
                                                setSelectedCourseId(id);
                                            }}
                                        />
                                    )}

                                    {activeTab === 'COURSES' && (
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
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={() => setShowCourseProps(!showCourseProps)}
                                                                className="p-1.5 hover:bg-muted rounded-md transition-all text-muted-foreground/20 hover:text-foreground"
                                                                title={showCourseProps ? "Hide Properties" : "Show Properties"}
                                                            >
                                                                {showCourseProps ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteRow("07 - Courses", selectedCourseId!)}
                                                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground/20 hover:text-destructive transition-all rounded-md"
                                                                title="Delete Course"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {showCourseProps && (
                                                        <CoursePropertyGrid 
                                                            course={selectedCourse?.properties} 
                                                            schema={courseSchema}
                                                            onUpdate={handleUpdateCourseProperty} 
                                                        />
                                                    )}
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

                                {activeTab === 'PLANNER' && (
                                        <PlannerDashboard 
                                            data={data?.study_sessions || []} fullData={data} databases={databases} navigate={navigate}
                                            selectedId={selectedCourseId} onSelect={setSelectedCourseId}
                                            onUpdate={(key:string, val:any) => handleUpdateRow("06 - Study Planner", key, val)}
                                            onCreate={() => handleCreateRow("06 - Study Planner")} onDelete={(id:string) => handleDeleteRow("06 - Study Planner", id)}
                                        />
                                    )}

                                {activeTab === 'ASSIGNMENTS' && (
                                        <AssignmentsDashboard 
                                            data={data?.assignments || []} fullData={data} databases={databases}
                                            selectedId={selectedCourseId} onSelect={setSelectedCourseId}
                                            onUpdate={(id:string, key:string, val:any) => {
                                                if (id && key && val !== undefined) {
                                                    sidecarApi.updateVaultRow("03 - Assignments", id, { [key]: val }).then(() => fetchData());
                                                } else {
                                                    handleUpdateRow("03 - Assignments", id, key);
                                                }
                                            }}
                                            onCreate={() => handleCreateRow("03 - Assignments")} onDelete={(id:string) => handleDeleteRow("03 - Assignments", id)}
                                        />
                                    )}

                                {activeTab === 'EXAMS' && (
                                        <ExamsDashboard 
                                            data={data?.exams || []} fullData={data} databases={databases}
                                            selectedId={selectedCourseId} onSelect={setSelectedCourseId}
                                            onUpdate={(key:string, val:any) => handleUpdateRow("04 - Exams", key, val)}
                                            onCreate={() => handleCreateRow("04 - Exams")} onDelete={(id:string) => handleDeleteRow("04 - Exams", id)}
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

function YearsDashboard({ data, fullData, databases, onSelect, selectedId, onUpdate, onCreateYear, onCreateSemester, onCreateCourse, onDelete, onSetCurrent, onScaffold, navigate }: any) {
    const [showSetup, setShowSetup] = useState(false);
    const [inspectSemId, setInspectSemId] = useState<string | null>(null);
    const [showProperties, setShowProperties] = useState(true);

    const activeYear = data.find((y:any) => y.properties?.["Current Year"] === true || y.properties?.["Current Year"] === "true");
    const activeProgram = activeYear?.properties?.Program || activeYear?.properties?.program || null;
    
    const programYears = activeProgram 
        ? data.filter((y:any) => (y.properties?.Program || y.properties?.program) === activeProgram)
        : data;

    const completedYearsCount = programYears.filter((y:any) => String(y.properties?.Status).includes('Completed')).length;
    const targetYears = parseInt(activeYear?.properties?.["Target Years"] || activeYear?.properties?.target_years || programYears.length || 1);

    const chartData = [
        { name: 'Completed', value: completedYearsCount, color: 'hsl(var(--foreground))' },
        { name: 'Active', value: Math.max(0, programYears.length - completedYearsCount), color: 'hsl(var(--primary))' },
        { name: 'Pending', value: Math.max(0, targetYears - programYears.length), color: 'hsl(var(--muted)/0.3)' },
    ];

    const selectedYear = data.find((y:any) => y.id === selectedId);
    const relatedSemesters = (fullData?.semesters || []).filter((s:any) => String(s.Year).includes(selectedYear?.title) || String(s.Year).includes(selectedYear?.id)).sort((a:any, b:any) => {
        const order = ["Autumn", "Spring", "Summer", "Winter"];
        return order.findIndex(o => a.title.includes(o)) - order.findIndex(o => b.title.includes(o));
    });

    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            <div className="col-span-4 border-r border-border/40 pr-8 space-y-12 overflow-y-auto custom-scrollbar pr-4">
                <div className="space-y-6">

                    <div className="p-6 border border-border/10 rounded-2xl bg-muted/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Program</span>
                            <button 
                                onClick={() => setShowSetup(!showSetup)}
                                className="px-2 py-1 bg-foreground/5 hover:bg-foreground/10 text-[8px] font-black uppercase tracking-widest rounded transition-all border border-border/10"
                            >
                                {showSetup ? "Back" : "Setup"}
                            </button>
                        </div>
                        <span className="text-lg font-black tracking-tighter uppercase text-primary">
                            {activeProgram ? activeProgram.replace(/\[\[(.*?)\]\]/g, '$1') : 'No Program'}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <SectionHeader title="Roadmap" />
                    <AcademicRoadmap items={data} activeId={selectedId} onSelect={onSelect} />
                </div>
            </div>

            <div className="col-span-8 space-y-12 overflow-y-auto custom-scrollbar pr-4">
                {showSetup ? (
                    <ProgramSetupForm onScaffold={(n, y, l, c) => {
                        onScaffold(n, y, l, c);
                        setShowSetup(false);
                    }} />
                ) : !selectedId ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                        <Layers size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Select a year</span>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-foreground">{selectedYear?.title}</h2>
                                    {(() => {
                                        const derived = deriveStatus(relatedSemesters);
                                        const current = String(selectedYear?.Status || '').replace(/\[\[(.*?)\]\]/g, '$1');
                                        if (derived === 'Completed' && current !== 'Completed') {
                                            return (
                                                <button 
                                                    onClick={() => onUpdate('Status', '[[Completed]]')}
                                                    className="mt-2 px-3 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-green-500/20 animate-pulse"
                                                >
                                                    Finish Year
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onSetCurrent(selectedId)}
                                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-black uppercase tracking-widest rounded transition-all"
                                    >
                                        Set Active
                                    </button>
                                    <button onClick={() => onDelete(selectedId)} className="p-1.5 text-muted-foreground/20 hover:text-destructive transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-5 border border-border/10 rounded-xl bg-muted/5 flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Level</span>
                                    <span className="text-[11px] font-black uppercase text-foreground truncate">{String(selectedYear?.properties?.["Academic Level"] || '--').replace(/\[\[(.*?)\]\]/g, '$1')}</span>
                                </div>
                                <div className="p-5 border border-border/10 rounded-xl bg-muted/5 flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Credits</span>
                                    <span className="text-[11px] font-black uppercase text-foreground">{selectedYear?.properties?.["Earned Credits"] || '0'} / {selectedYear?.properties?.["Target Credits"] || '0'}</span>
                                </div>
                                <div className="p-5 border border-border/10 rounded-xl bg-muted/5 flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">GPA</span>
                                    <span className="text-[11px] font-black uppercase text-primary">{selectedYear?.properties?.["Cumulative GPA"] || '0.00'}</span>
                                </div>
                            </div>
                        </div>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <SectionHeader title="Properties" />
                                <button 
                                    onClick={() => setShowProperties(!showProperties)}
                                    className="p-1 hover:bg-muted rounded transition-all text-muted-foreground/40 hover:text-foreground"
                                    title={showProperties ? "Hide Properties" : "Show Properties"}
                                >
                                    {showProperties ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                </button>
                            </div>
                            {showProperties && (
                                <CoursePropertyGrid course={selectedYear?.properties} schema={databases.find((d:any)=>d.id==="09 - Years")?.schema || {}} onUpdate={(k:string,v:any)=>onUpdate(k,v)} />
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <SectionHeader title="Semesters" />
                                <button 
                                    onClick={() => onCreateSemester(selectedYear?.title)} 
                                    className="px-2 py-1 bg-foreground text-background text-[8px] font-black uppercase tracking-widest rounded"
                                >
                                    Add Semester
                                </button>
                            </div>
                            <div className="roadmap-container pl-2">
                                <div className="roadmap-line opacity-5" />
                                {relatedSemesters.map((s:any, idx:number) => {
                                    const status = String(s.Status || '').toLowerCase();
                                    const isCompleted = status.includes('completed');
                                    const isActive = status.includes('active');
                                    const isInspecting = inspectSemId === s.id;
                                    
                                    return (
                                        <div key={idx} className="roadmap-node group cursor-pointer" onClick={() => setInspectSemId(isInspecting ? null : s.id)}>
                                            <div className={cn(
                                                "roadmap-dot",
                                                isCompleted ? "roadmap-dot-completed" : isActive ? "roadmap-dot-active pulse-node" : "roadmap-dot-planned",
                                                isInspecting && "ring-2 ring-primary/40"
                                            )}>
                                                {isCompleted ? <Check size={10} strokeWidth={4} /> : (idx + 1)}
                                            </div>
                                            <div className={cn(
                                                "roadmap-content p-4 border rounded-xl bg-muted/5 transition-all",
                                                isInspecting ? "border-primary/20 bg-primary/[0.02]" : "border-border/20 group-hover:border-foreground/10"
                                            )}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-[13px] font-black uppercase", isInspecting ? "text-primary" : "text-foreground")}>{s.title}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{status.replace(/\[\[(.*?)\]\]/g, '$1')}</span>
                                                    </div>
                                                    <ChevronDown size={12} className={cn("text-muted-foreground/20 transition-all", isInspecting && "rotate-180 text-primary/40")} />
                                                </div>

                                                {isInspecting && (
                                                    <div className="mt-6 pt-6 border-t border-border/10 animate-in fade-in slide-in-from-top-1">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Related Courses</span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onCreateCourse(s.title); }}
                                                                className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded border border-primary/20 hover:bg-primary/20 transition-all"
                                                            >
                                                                Add Course
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {(fullData?.courses || []).filter((c:any) => String(c.Semester).includes(s.title)).map((course: any, cidx: number) => (
                                                                <div 
                                                                    key={cidx} 
                                                                    onClick={(e) => { e.stopPropagation(); navigate('COURSES', course.id); }}
                                                                    className="p-3 border border-border/10 rounded-lg bg-background/40 flex items-center justify-between hover:border-primary/40 transition-all group/course"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-black uppercase group-hover/course:text-primary transition-colors">{course.title}</span>
                                                                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{course.Grade || '--'} • {course.Credits || '0'} CR</span>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full",
                                                                        String(course.Status).toLowerCase().includes('completed') ? "bg-foreground" : "bg-primary/20"
                                                                    )} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {relatedSemesters.length === 0 && <EmptyState message="No semesters linked" />}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    )
}


function SemestersDashboard({ data, fullData, databases, onSelect, selectedId, onUpdate, onCreate, onDelete, onSetCurrent }: any) {
    if (selectedId) {
        const selectedSem = data.find((s:any) => s.id === selectedId);
        const relatedCourses = (fullData?.courses || []).filter((c:any) => String(c.Semester).includes(selectedSem?.title) || String(c.Semester).includes(selectedSem?.id));
        
        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Semester Detail</span>
                            {(() => {
                                const derived = deriveStatus(relatedCourses);
                                const current = String(selectedSem?.Status || '').replace(/\[\[(.*?)\]\]/g, '$1');
                                if (derived === 'Completed' && current !== 'Completed') {
                                    return (
                                        <button 
                                            onClick={() => onUpdate('Status', '[[Completed]]')}
                                            className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded border border-green-500/20 animate-pulse hover:bg-green-500 hover:text-white transition-all"
                                        >
                                            Rollup: Mark Completed
                                        </button>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <h2 className="text-3xl font-black uppercase text-foreground">{selectedSem?.title}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onSetCurrent(selectedId)}
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-2"
                        >
                            <Check size={14}/> Set Active
                        </button>
                        <button onClick={() => onDelete(selectedId)} className="p-2 hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive rounded-md transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                
                <section className="space-y-6">
                    <SectionHeader title="Properties" />
                    <CoursePropertyGrid course={selectedSem} schema={databases.find((d:any)=>d.id==="08 - Semesters")?.schema || {}} onUpdate={(k:string,v:any)=>onUpdate(k,v)} />
                </section>
                
                <section className="space-y-6">
                    <SectionHeader title="Related Courses" />
                    <div className="grid grid-cols-2 gap-4">
                        {relatedCourses.map((c:any, idx:number) => (
                            <div key={idx} className="p-6 border border-border/40 rounded-xl bg-muted/5 flex flex-col gap-2">
                                <span className="text-[14px] font-black uppercase text-foreground">{c.title}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{String(c.Professor || 'No Prof').replace(/\[\[(.*?)\]\]/g, '$1')}</span>
                            </div>
                        ))}
                        {relatedCourses.length === 0 && <EmptyState message="No courses linked to this semester" />}
                    </div>
                </section>
            </div>
        )
    }
    
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-2 p-8 border border-border/10 rounded-2xl bg-primary/10 border-primary/20 flex flex-col justify-between relative overflow-hidden">
                    <div className="z-10 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Current Semester</span>
                        <h3 className="text-3xl font-black tracking-tight text-foreground uppercase">{data.find((s:any) => s.Status === '[[Active]]' || s.Status === 'Active')?.title || 'No Active Semester'}</h3>
                    </div>
                    
                </div>
                <div className="p-8 border border-border/10 rounded-2xl bg-muted/5 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total</span>
                    <span className="text-4xl font-black tracking-tighter text-foreground">{data.length}</span>
                </div>
                <div className="p-8 border border-border/10 rounded-2xl bg-muted/5 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Completed</span>
                    <span className="text-4xl font-black tracking-tighter text-muted-foreground/50">{data.filter((s:any) => String(s.Status).includes('Completed')).length}</span>
                </div>
            </div>
            <UniversalDatabaseTab dbId="08 - Semesters" data={data} databases={databases} selectedId={selectedId} onSelect={onSelect} onUpdate={onUpdate} onCreate={onCreate} onDelete={onDelete} />
        </div>
    )
}

function PlannerDashboard({ data, fullData, databases, onSelect, selectedId, onUpdate, onCreate, onDelete, navigate }: any) {
    if (selectedId) return <UniversalDatabaseTab dbId="06 - Study Planner" data={data} databases={databases} selectedId={selectedId} onSelect={onSelect} onUpdate={onUpdate} onCreate={onCreate} onDelete={onDelete} />;
    
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-3 p-8 border border-border/10 rounded-2xl bg-muted/5 flex items-center justify-between">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Knowledge Hubs</span>
                        <div className="text-2xl font-black uppercase text-foreground">Study Flow</div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-4xl font-black text-foreground">{data.length}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total Modules</div>
                    </div>
                </div>
            </div>
            <section className="space-y-6">
                <SectionHeader title="Active Modules" onAction={onCreate} />
                <div className="grid grid-cols-2 gap-4">
                    {data.slice(0, 8).map((hub: any, idx: number) => (
                        <div key={idx} onClick={() => navigate(`/obsidian?path=3-Database/06 - Study Planner/${hub.id}.md`)} className="p-6 border border-border/40 rounded-xl hover:border-primary/50 cursor-pointer transition-all bg-background group">
                            <div className="flex flex-col gap-2">
                                <span className="text-[14px] font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{hub.title}</span>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    <span>{String(hub.Course || 'General').replace(/\[\[(.*?)\]\]/g, '$1')}</span>
                                    <span>Unit {hub.Unit || '--'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

function AssignmentsDashboard({ data, fullData, databases, onSelect, selectedId, onUpdate, onCreate, onDelete }: any) {
    if (selectedId) return <UniversalDatabaseTab dbId="03 - Assignments" data={data} databases={databases} selectedId={selectedId} onSelect={onSelect} onUpdate={onUpdate} onCreate={onCreate} onDelete={onDelete} />;
    
    const pending = data.filter((a:any) => !a.done);
    const overdue = pending.filter((a:any) => new Date(a.due_date) < new Date());
    
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-3 gap-6">
                <div className="p-8 border border-border/10 rounded-2xl bg-muted/5 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Pending</span>
                    <span className="text-4xl font-black tracking-tighter text-foreground">{pending.length}</span>
                </div>
                <div className="p-8 border border-border/10 rounded-2xl bg-destructive/5 border-destructive/20 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Overdue</span>
                    <span className="text-4xl font-black tracking-tighter text-destructive">{overdue.length}</span>
                </div>
                <div className="p-8 border border-border/10 rounded-2xl bg-muted/5 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Done</span>
                    <span className="text-4xl font-black tracking-tighter text-muted-foreground/40">{data.length - pending.length}</span>
                </div>
            </div>
            
            <section className="space-y-6">
                <SectionHeader title="Urgent Triage" onAction={onCreate} />
                <div className="flex flex-col gap-2">
                    {pending.sort((a:any, b:any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 10).map((a:any, idx:number) => (
                        <div key={idx} className="flex items-center gap-4 p-4 border border-border/20 rounded-xl hover:bg-muted/5 transition-all cursor-pointer" onClick={() => onSelect(a.id)}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdate(a.id, 'done', true); }}
                                className="w-5 h-5 rounded border border-border/50 hover:border-primary flex items-center justify-center transition-all"
                            >
                                <Check size={12} className="text-transparent hover:text-primary transition-all"/>
                            </button>
                            <div className="flex-1 flex flex-col">
                                <span className="text-[12px] font-black uppercase text-foreground">{a.title}</span>
                                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">{String(a.Course || 'Uncategorized').replace(/\[\[(.*?)\]\]/g, '$1')}</span>
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-3 py-1 bg-muted/20 rounded-md">
                                {a.due_date ? a.due_date.split('T')[0] : 'No Date'}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

function ExamsDashboard({ data, fullData, databases, onSelect, selectedId, onUpdate, onCreate, onDelete }: any) {
    if (selectedId) return <UniversalDatabaseTab dbId="04 - Exams" data={data} databases={databases} selectedId={selectedId} onSelect={onSelect} onUpdate={onUpdate} onCreate={onCreate} onDelete={onDelete} />;
    
    const upcoming = data.filter((e:any) => new Date(e.date) >= new Date()).sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const nextExam = upcoming[0];

    return (
        <div className="space-y-12">
            {nextExam && (
                <div className="p-10 border border-border/10 rounded-2xl bg-foreground text-background flex items-center justify-between">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-background/60">Next Exam</span>
                        <h2 className="text-4xl font-black uppercase tracking-tighter">{nextExam.title}</h2>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary pt-2">{String(nextExam.Course).replace(/\[\[(.*?)\]\]/g, '$1')}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black tracking-tighter">{Math.ceil((new Date(nextExam.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-background/60">Days Left</div>
                    </div>
                </div>
            )}
            
            <section className="space-y-6">
                <SectionHeader title="All Exams" onAction={onCreate} />
                <div className="grid grid-cols-2 gap-4">
                    {data.map((exam: any, idx: number) => {
                        const isPast = new Date(exam.date) < new Date();
                        return (
                            <div key={idx} onClick={() => onSelect(exam.id)} className={`p-6 border border-border/40 rounded-xl hover:border-foreground/40 cursor-pointer transition-all ${isPast ? 'opacity-50' : 'bg-background'}`}>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[14px] font-black uppercase tracking-tight text-foreground">{exam.title}</span>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>{String(exam.Course || 'General').replace(/\[\[(.*?)\]\]/g, '$1')}</span>
                                        <span>{exam.date ? exam.date.split('T')[0] : '--'}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
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

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 text-center border border-border/10 rounded-2xl w-full bg-muted/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">{message}</p>
        </div>
    )
}

function deriveStatus(children: any[], statusKey: string = 'Status') {
    if (!children || children.length === 0) return 'Pending';
    const allCompleted = children.every(c => {
        const s = String(c[statusKey] || '').toLowerCase();
        return s.includes('completed') || c.done === true;
    });
    return allCompleted ? 'Completed' : 'In Progress';
}

function AcademicRoadmap({ items, activeId, onSelect }: { items: any[], activeId: string | null, onSelect: (id: string) => void }) {
    const sorted = [...items].sort((a, b) => {
        const romanToVal: Record<string, number> = { "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8 };
        const getVal = (title: string) => {
            const match = title.match(/Year\s+([IVX]+|\d+)/i);
            if (!match) return 999;
            const val = match[1].toUpperCase();
            return romanToVal[val] || parseInt(val) || 999;
        };
        return getVal(a.title) - getVal(b.title);
    });

    const activeIndex = sorted.findIndex(item => item["Current Year"] === true || item["Current Year"] === "true");
    const completedCount = sorted.filter(item => String(item.Status || '').toLowerCase().includes('completed')).length;
    
    const progressIndex = Math.max(activeIndex, completedCount - 1);
    const progressPercent = sorted.length > 1 ? (progressIndex / (sorted.length - 1)) * 100 : 0;

    return (
        <div className="roadmap-container pl-2">
            <div className="roadmap-line opacity-5" />
            <div 
                className="roadmap-line roadmap-line-solid transition-all duration-700 ease-out" 
                style={{ 
                    height: `${progressPercent}%`,
                    maxHeight: '100%',
                    opacity: progressPercent > 0 ? 1 : 0
                }} 
            />
            {sorted.map((item, idx) => {
                const status = String(item.Status || '').toLowerCase();
                const isCompleted = status.includes('completed');
                const isActive = item["Current Year"] === true || item["Current Year"] === "true";
                const isPlanned = !isCompleted && !isActive;

                return (
                    <div key={idx} className="roadmap-node group cursor-pointer" onClick={() => onSelect(item.id)}>
                        <div className={cn(
                            "roadmap-dot",
                            isCompleted && "roadmap-dot-completed",
                            isActive && "roadmap-dot-active pulse-node",
                            isPlanned && "roadmap-dot-planned"
                        )}>
                            {isCompleted ? <Check size={10} strokeWidth={4} /> : (idx + 1)}
                        </div>
                        <div className="roadmap-content">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className={cn(
                                        "text-[12px] font-black uppercase transition-colors",
                                        isActive ? "text-foreground" : "text-muted-foreground/30 group-hover:text-foreground/60",
                                        isCompleted && "text-muted-foreground/20"
                                    )}>
                                        {item.title}
                                    </span>
                                    <span className="text-[8px] font-black uppercase text-muted-foreground/20">
                                        {isActive ? "Active" : status.replace(/\[\[(.*?)\]\]/g, '')} 
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ProgramSetupForm({ onScaffold }: { onScaffold: (name: string, years: number, level: string, current: number) => void }) {
    const [name, setName] = useState('');
    const [years, setYears] = useState(4);
    const [currentYear, setCurrentYear] = useState(1);
    const [level, setLevel] = useState('Undergraduate');

    return (
        <div className="p-10 border border-border/10 rounded-2xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">New Program</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Initialize your roadmap scaffolding</p>
            </div>
            
            <div className="w-full max-w-xs space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Name</label>
                        <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. BSc Computer Science"
                            className="w-full bg-background border border-border/20 px-4 py-3 rounded-xl text-sm font-bold outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Duration</label>
                            <input 
                                type="number"
                                value={years}
                                onChange={e => setYears(parseInt(e.target.value))}
                                className="w-full bg-background border border-border/20 px-4 py-3 rounded-xl text-sm font-bold outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Current Year</label>
                            <input 
                                type="number"
                                min={1}
                                max={years}
                                value={currentYear}
                                onChange={e => setCurrentYear(parseInt(e.target.value))}
                                className="w-full bg-background border border-border/20 px-4 py-3 rounded-xl text-sm font-bold outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Level</label>
                        <select 
                            value={level}
                            onChange={e => setLevel(e.target.value)}
                            className="w-full bg-background border border-border/20 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                        >
                            <option>High School</option>
                            <option>Undergraduate</option>
                            <option>Master's</option>
                            <option>PhD</option>
                        </select>
                    </div>
                </div>
                
                <button 
                    onClick={() => onScaffold(name, years, level, currentYear - 1)}
                    disabled={!name}
                    className="w-full py-4 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-10"
                >
                    Deploy
                </button>
            </div>
        </div>
    );
}

function CoursePropertyGrid({ course, schema, onUpdate }: { course: any, schema: Record<string, any>, onUpdate: (key: string, value: any) => void }) {
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

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
                                        String(value).replace(/^\[\[(.*?)\]\]$/, '').split('/').pop() : 
                                    propType === 'date' ? 
                                        format(parseISO(String(value)), 'MMM dd, yyyy') :
                                        String(value)
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function SelectPropertyEditor({ value, source, onSave, onCancel }: { value: string, source?: string, onSave: (val: string) => void, onCancel: () => void }) {
    const [options, setOptions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

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

    const filteredOptions = options.filter(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
    const rawValue = typeof value === 'string' && value.startsWith('[[') ? value.replace(/\[\[(.*?)\]\]/, '') : value

    return (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[240px] bg-background border border-border/10 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2">
                <input 
                    autoFocus
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-muted/5 border-none text-[10px] uppercase font-black px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary/20"
                />
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {filteredOptions.map(opt => (
                    <button 
                        key={opt}
                        onClick={() => onSave(`[[${opt}]]`)}
                        className={cn(
                            "flex items-center justify-between px-3 py-1.5 rounded-md transition-all text-left text-[10px] font-black uppercase",
                            rawValue === opt ? "bg-primary/10 text-primary" : "hover:bg-muted/10 text-foreground/70"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
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
