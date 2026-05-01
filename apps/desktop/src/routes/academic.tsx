import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    GraduationCap, 
    BookOpen, 
    ChevronRight,
    Plus,
    Target,
    Zap,
    LayoutGrid,
    Clock,
    ArrowLeft,
    Layers
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AcademicData {
    semesters: any[]
    courses: any[]
    units: any[]
    exams: any[]
    assignments: any[]
    study_sessions: any[]
}

export default function AcademicDashboard() {
    const [data, setData] = useState<AcademicData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const navigate = useNavigate()

    const fetchData = async () => {
        try {
            const res = await sidecarApi.academicsDashboard()
            setData(res as any)
        } catch (err) {
            console.error("Failed to fetch academic data", err)
            toast.error("Database Offline")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="w-4 h-4 border border-border border-t-foreground/20 rounded-full animate-spin" />
            </div>
        )
    }

    const activeCourses = data?.courses || []
    const upcomingAssignments = data?.assignments?.filter(a => !a.done).sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime()) || []
    const upcomingExams = data?.exams?.sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime()) || []
    const allHubs = data?.study_sessions || []

    const selectedCourse = activeCourses.find(c => c.id === selectedCourseId)
    const courseHubs = allHubs.filter(h => {
        const courseProp = h.course || h.Course || ''
        const courseName = selectedCourse?.title || ''
        return String(courseProp).includes(courseName) || String(h.id).includes(courseName)
    })

    return (
        <div className="h-full flex-1 flex flex-col bg-background font-sans overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-16 pt-24 pb-16 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {selectedCourseId && (
                        <button 
                            onClick={() => setSelectedCourseId(null)}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} className="text-muted-foreground" />
                        </button>
                    )}
                    <h1 className="text-3xl font-black tracking-tight uppercase text-foreground/80">
                        {selectedCourseId ? selectedCourse?.title : "Academic Mastery"}
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-16 pb-32">
                {!selectedCourseId ? (
                    <div className="grid grid-cols-12 gap-20">
                        {/* Course List */}
                        <div className="col-span-8 space-y-16">
                            <section className="space-y-8">
                                <SectionHeader title="Active Courses" />
                                <div className="grid grid-cols-2 gap-6">
                                    {activeCourses.map((course, idx) => (
                                        <CourseCard 
                                            key={idx} 
                                            course={course} 
                                            onClick={() => setSelectedCourseId(course.id)}
                                        />
                                    ))}
                                    {activeCourses.length === 0 && (
                                        <EmptyState message="No subjects detected." />
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Timeline & Operations */}
                        <div className="col-span-4 space-y-16">
                            <section className="space-y-8">
                                <SectionHeader title="Timeline" />
                                <div className="space-y-3">
                                    {upcomingAssignments.slice(0, 5).map((item, idx) => (
                                        <TimelineItem 
                                            key={idx} 
                                            title={item.title} 
                                            date={item.due_date} 
                                            type="Task"
                                            onClick={() => navigate(`/obsidian?path=3-Database/03 - Assignments/${item.id}.md`)}
                                        />
                                    ))}
                                    {upcomingAssignments.length === 0 && (
                                        <div className="py-12 border border-dashed border-border/10 rounded-lg text-center">
                                            <span className="text-[7px] font-black uppercase text-muted-foreground/10 tracking-[0.4em]">Standby</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <ActionButton icon={<Clock size={12} />} label="Practice" onClick={() => navigate('/practice')} />
                                <ActionButton icon={<Plus size={12} />} label="Log Database" onClick={() => navigate('/vault-sync')} />
                            </section>
                        </div>
                    </div>
                ) : (
                    /* Drill-down View: Course Hubs */
                    <div className="grid grid-cols-12 gap-20">
                        <div className="col-span-8 space-y-16">
                            <section className="space-y-8">
                                <SectionHeader title="Knowledge Hubs" />
                                <div className="grid grid-cols-2 gap-6">
                                    {courseHubs.map((hub, idx) => (
                                        <HubCard 
                                            key={idx} 
                                            hub={hub} 
                                            onClick={() => navigate(`/obsidian?path=3-Database/06 - Study Planner/${hub.id}.md&fullscreen=true`)}
                                        />
                                    ))}
                                    {courseHubs.length === 0 && (
                                        <div className="col-span-2 py-20 border border-dashed border-border/10 rounded-lg flex flex-col items-center justify-center gap-6">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">No hubs linked to this course yet.</p>
                                            <button 
                                                onClick={() => navigate('/obsidian')}
                                                className="px-6 py-2 border border-border/30 text-muted-foreground/40 text-[8px] font-black uppercase tracking-widest rounded hover:bg-muted transition-all"
                                            >
                                                Create Hub
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="col-span-4 space-y-8">
                            <section className="p-8 border border-border/60 bg-muted/5 rounded-xl space-y-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Course Metadata</span>
                                    <h3 className="text-lg font-black text-foreground/60">{selectedCourse?.title}</h3>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-border/10">
                                    <MetaItem label="Professor" value={selectedCourse?.Professor || 'N/A'} />
                                    <MetaItem label="Units" value={selectedCourse?.Units || '0'} />
                                    <MetaItem label="Semester" value={selectedCourse?.Semester || 'N/A'} />
                                </div>
                                <div className="pt-8">
                                    <button 
                                        onClick={() => navigate(`/obsidian?path=3-Database/07 - Courses/${selectedCourse?.id}.md`)}
                                        className="w-full py-3 bg-muted/10 border border-border/40 text-[8px] font-black uppercase tracking-widest rounded hover:bg-muted/20 transition-all"
                                    >
                                        Open Syllabus Note
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-4">
            <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/30">{title}</h2>
            <div className="h-[1px] flex-1 bg-border/10" />
        </div>
    )
}

function CourseCard({ course, onClick }: { course: any, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="group p-6 bg-background border border-border/40 rounded-lg hover:border-foreground/20 transition-all cursor-pointer space-y-4"
        >
            <div className="flex flex-col gap-1">
                <h3 className="text-[14px] font-black tracking-tight text-foreground/60">{course.title}</h3>
                <span className="text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest">{course.Professor || 'Independent'}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <span className="text-[7px] font-black text-muted-foreground/10 uppercase tracking-widest">{course.Semester || 'Current'}</span>
                <ChevronRight size={10} className="text-muted-foreground/10 group-hover:text-foreground/40 transition-all" />
            </div>
        </div>
    )
}

function HubCard({ hub, onClick }: { hub: any, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="group p-6 bg-background border border-border/40 rounded-lg hover:border-foreground/20 transition-all cursor-pointer space-y-4"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-muted/20 rounded">
                    <Layers size={14} className="text-muted-foreground/30" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[13px] font-black tracking-tight text-foreground/60">{hub.title}</h3>
                    <span className="text-[7px] font-black text-muted-foreground/20 uppercase tracking-widest">Unit {hub.unit || '?'}</span>
                </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <span className="text-[7px] font-black text-muted-foreground/10 uppercase tracking-widest">Topic Hub</span>
                <ChevronRight size={10} className="text-muted-foreground/10 group-hover:text-foreground/40 transition-all" />
            </div>
        </div>
    )
}

function TimelineItem({ title, date, type, urgent, onClick }: { title: string, date: string, type: string, urgent?: boolean, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="group flex items-center justify-between p-3 border border-border/10 rounded hover:bg-muted/5 cursor-pointer transition-all"
        >
            <div className="flex items-center gap-3">
                <div className={cn("w-1 h-1 rounded-full", urgent ? "bg-foreground/20" : "bg-muted-foreground/10")} />
                <span className="text-[10px] font-bold text-foreground/50 tracking-tight line-clamp-1">{title}</span>
            </div>
            <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-tighter shrink-0 ml-4">
                {date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '---'}
            </span>
        </div>
    )
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between p-3 border border-border/20 bg-background hover:bg-muted/10 rounded transition-all group"
        >
            <div className="flex items-center gap-3 text-muted-foreground/40 group-hover:text-foreground/60">
                <span className="opacity-20 group-hover:opacity-100 transition-opacity">{icon}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">{label}</span>
            </div>
            <ChevronRight size={10} className="text-muted-foreground/10 group-hover:text-foreground/20" />
        </button>
    )
}

function MetaItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">{label}</span>
            <span className="text-[10px] font-bold text-foreground/40">{value}</span>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    const handleSetup = async () => {
        try {
            await sidecarApi.academicsSyncProfile();
            toast.success("Ready.");
            window.location.reload();
        } catch (err) {
            toast.error("Error.");
        }
    }

    return (
        <div className="col-span-2 py-20 border border-dashed border-border/10 rounded-lg flex flex-col items-center justify-center gap-6">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">{message}</p>
            <button 
                onClick={handleSetup}
                className="px-6 py-2 border border-border/30 text-muted-foreground/40 text-[8px] font-black uppercase tracking-widest rounded hover:bg-muted transition-all"
            >
                Initialize
            </button>
        </div>
    )
}
