import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
    AlertCircle, RefreshCw, Zap, ChevronRight, Plus, X, ExternalLink, Save, Trash2, Hash, Search
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { sidecarApi } from '../../lib/sidecarApi'

const DB_COURSES = "2a9219ed-7519-817e-aedb-da156d06134c"
const DB_STUDY_PLANNER = "2a9219ed-7519-81e2-81f8-de21e47c26fc"
const DB_EXAMS = "2a9219ed-7519-8182-be2c-e7e7523dcf3b"
const DB_ASSIGNMENTS = "2a9219ed-7519-816a-a0cf-ed1a32abce49"

function DetailProperty({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            {children}
        </div>
    )
}

function TableView({ items, columns, onRowClick, emptyMessage, selectedItemId }: { items: any[], columns: { key: string, label: string, render: (item: any) => React.ReactNode }[], onRowClick: (item: any) => void, emptyMessage: string, selectedItemId?: string }) {
    if (!items || items.length === 0) {
        return (
            <div className="p-8 text-center bg-card rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="bg-card border rounded-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-4 py-3 font-medium whitespace-nowrap">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item, idx) => (
                            <tr key={item.id || idx} onClick={() => onRowClick(item)} className={cn("transition-colors cursor-pointer group hover:bg-muted/50", selectedItemId === item.id ? "bg-accent" : "")}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-4 py-3 whitespace-nowrap">
                                        {col.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function Academics() {
    // const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [data, setData] = useState<{
        semesters: any[];
        courses: any[];
        units: any[];
        exams: any[];
        assignments: any[];
    } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'Courses' | 'Study Planner' | 'Assignments' | 'Exams'>('Courses')
    const [editingItem, setEditingItem] = useState<any | null>(null)

    // Form stuff for creating
    const [showCreate, setShowCreate] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    // Editor content state
    const [markdownContent, setMarkdownContent] = useState('')
    const [loadingContent, setLoadingContent] = useState(false)
    const [savingContent, setSavingContent] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await sidecarApi.academicsDashboard()
            setData(result)

            if (editingItem) {
                // Determine which array the editing item is from to update it
                const allItems = [...result.courses, ...result.units, ...result.exams, ...result.assignments]
                const updated = allItems.find(i => i.id === editingItem.id)
                if (updated) setEditingItem(updated)
            }

        } catch (err: any) {
            setError(err.message || "Failed to load academic data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (editingItem) {
            fetchContent(editingItem.id)
        }
    }, [editingItem?.id])

    const fetchContent = async (id: string) => {
        setLoadingContent(true)
        try {
            const res = await sidecarApi.getNotionPageContent(id)
            const text = res.blocks
                .map((b: any) => {
                    const blockType = b.type
                    const content = b[blockType]?.rich_text?.map((t: any) => t.plain_text).join('') || ''
                    if (blockType === 'heading_1') return `# ${content}`
                    if (blockType === 'heading_2') return `## ${content}`
                    if (blockType === 'heading_3') return `### ${content}`
                    if (blockType === 'bulleted_list_item') return `- ${content}`
                    if (blockType === 'numbered_list_item') return `1. ${content}`
                    return content
                })
                .join('\n')
            setMarkdownContent(text)
        } catch (err) {
            console.error('Failed to fetch page content:', err)
        } finally {
            setLoadingContent(false)
        }
    }

    const saveContent = async () => {
        if (!editingItem) return
        setSavingContent(true)
        try {
            await sidecarApi.updateNotionPageContent(editingItem.id, markdownContent)
        } catch (err) {
            console.error('Failed to save content:', err)
        } finally {
            setSavingContent(false)
        }
    }

    const handleSyncProfile = async () => {
        setSyncing(true)
        try {
            await sidecarApi.academicsSyncProfile()
        } catch (err: any) {
            console.error("Sync failed", err)
        } finally {
            setSyncing(false)
        }
    }

    const updateProperty = async (id: string, updates: Record<string, any>) => {
        try {
            await sidecarApi.updateNotionPage(id, updates)
            await fetchData()
        } catch (err) {
            console.error('Failed to update property', err)
        }
    }

    const deleteTarget = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return
        setLoading(true)
        try {
            await sidecarApi.deleteNotionPage(id)
            setEditingItem(null)
            await fetchData()
        } catch (err) {
            console.error('Failed to delete target:', err)
        } finally {
            setLoading(false)
        }
    }

    const createTarget = async () => {
        if (!newTitle.trim()) return
        setLoading(true)
        try {
            let dbId = ''
            let props: Record<string, any> = {}

            if (activeTab === 'Courses') {
                dbId = DB_COURSES
                props = { 'Course Name': { title: [{ text: { content: newTitle.trim() } }] }, 'Type': { select: { name: 'LEC' } } }
            } else if (activeTab === 'Study Planner') {
                dbId = DB_STUDY_PLANNER
                props = { 'Name of Unit': { title: [{ text: { content: newTitle.trim() } }] }, 'Confidence': { select: { name: 'Neutral' } }, 'Difficulty': { select: { name: 'Moderate' } } }
            } else if (activeTab === 'Assignments') {
                dbId = DB_ASSIGNMENTS
                props = { 'Name': { title: [{ text: { content: newTitle.trim() } }] } }
            } else if (activeTab === 'Exams') {
                dbId = DB_EXAMS
                props = { 'Name': { title: [{ text: { content: newTitle.trim() } }] } }
            }

            if (dbId) {
                await sidecarApi.createNotionPage(dbId, props)
            }
            setNewTitle('')
            setShowCreate(false)
            await fetchData()
        } catch (err) {
            console.error('Failed to create target:', err)
        } finally {
            setLoading(false)
        }
    }

    const tabs = ['Courses', 'Study Planner', 'Assignments', 'Exams']

    if (loading && !data) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <p className="text-sm font-medium">Loading data...</p>
                </div>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="p-6 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex flex-col items-center gap-4 text-center max-w-sm">
                    <AlertCircle size={24} />
                    <div>
                        <h3 className="text-sm font-semibold">Failed to load data</h3>
                        <p className="text-sm mt-1 opacity-80">{error}</p>
                        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-all">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Determine current item title based on tab context to display in Editor
    const getEditorTitleRaw = () => {
        if (!editingItem) return 'Untitled'
        if (activeTab === 'Courses') return editingItem.properties['Course Name']?.title?.[0]?.plain_text
        if (activeTab === 'Study Planner') return editingItem.properties['Name of Unit']?.title?.[0]?.plain_text
        return editingItem.properties['Name']?.title?.[0]?.plain_text
    }

    const setEditorTitleRaw = (val: string) => {
        if (!editingItem) return
        if (activeTab === 'Courses') updateProperty(editingItem.id, { 'Course Name': { title: [{ text: { content: val } }] } })
        else if (activeTab === 'Study Planner') updateProperty(editingItem.id, { 'Name of Unit': { title: [{ text: { content: val } }] } })
        else updateProperty(editingItem.id, { 'Name': { title: [{ text: { content: val } }] } })
    }

    const filterItems = (items: any[], getTitle: (item: any) => string) => {
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase()
        return items.filter(i => getTitle(i)?.toLowerCase().includes(q))
    }

    return (
        <div className="h-full flex-1 flex-col space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Academics</h2>
                    <p className="text-sm text-muted-foreground">Manage courses, assignments, and study planner.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncProfile}
                        disabled={syncing}
                        className="inline-flex items-center justify-center rounded-md border text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 bg-background"
                        title="Sync Profile Context"
                    >
                        <Zap className={cn("h-4 w-4", syncing && "animate-pulse")} />
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md border text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 bg-background"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin", !loading && "mr-2")} />
                        {!loading && "Refresh"}
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
                <div className="flex items-center p-1 bg-muted/50 rounded-md">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => { setActiveTab(tab as any); setEditingItem(null); setSearchQuery(''); }}
                            className={cn(
                                "px-3 py-1.5 rounded-sm text-xs font-medium transition-all whitespace-nowrap",
                                activeTab === tab
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex h-[calc(100vh-220px)] gap-6 overflow-hidden relative">
                <div className="flex flex-col transition-all duration-300 overflow-hidden h-full rounded-md border bg-card text-card-foreground shadow-sm w-full">

                    <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                        {activeTab === 'Courses' && (
                            <TableView
                                selectedItemId={editingItem?.id}
                                items={filterItems(data?.courses || [], c => c.properties['Course Name']?.title?.[0]?.plain_text)}
                                emptyMessage="No active courses found."
                                onRowClick={(item) => setEditingItem(item)}
                                columns={[
                                    {
                                        key: 'name', label: 'Course Name', render: (c) => (
                                            <div className="font-medium text-foreground">
                                                {c.properties['Course Name']?.title?.[0]?.plain_text || 'Untitled'}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'goal', label: 'Target', render: (c) => (
                                            <div className="text-muted-foreground">
                                                {c.properties['Goal']?.select?.name || '-'}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'grade', label: 'Current Grade', render: (c) => (
                                            <div className="font-medium text-emerald-500">{c.properties['Grade']?.select?.name || '-'}</div>
                                        )
                                    }
                                ]}
                            />
                        )}

                        {activeTab === 'Study Planner' && (() => {
                            const courseMap = new Map<string, string>();
                            data?.courses?.forEach(c => {
                                const name = c.properties['Course Name']?.title?.[0]?.plain_text || 'Untitled';
                                courseMap.set(c.id, name);
                            });

                            const unitsByCourse: Record<string, any[]> = {};
                            data?.units?.forEach(u => {
                                const relations = u.properties['Course']?.relation || [];
                                const courseId = relations.length > 0 ? relations[0].id : 'unlinked';
                                if (!unitsByCourse[courseId]) unitsByCourse[courseId] = [];
                                unitsByCourse[courseId].push(u);
                            });

                            const filteredUnitsByCourse: Record<string, any[]> = {};
                            for (const [cid, units] of Object.entries(unitsByCourse)) {
                                const fUnits = filterItems(units, u => u.properties['Name of Unit']?.title?.[0]?.plain_text);
                                if (fUnits.length > 0) {
                                    filteredUnitsByCourse[cid] = fUnits;
                                }
                            }

                            const courseIds = Object.keys(filteredUnitsByCourse);
                            if (courseIds.length === 0) {
                                return (
                                    <div className="p-8 text-center bg-card border border-dashed rounded-md">
                                        <p className="text-sm text-muted-foreground">No matching units in your study planner.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6">
                                    {courseIds.map(cid => {
                                        const cName = cid === 'unlinked' ? 'Unlinked Units / General' : (courseMap.get(cid) || 'Unknown Course');
                                        const units = filteredUnitsByCourse[cid];
                                        return (
                                            <div key={cid} className="space-y-3">
                                                <div className="flex items-center gap-2 px-1">
                                                    <h3 className="text-sm font-semibold text-foreground">{cName}</h3>
                                                    <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground ml-2">{units.length}</span>
                                                </div>
                                                <TableView
                                                    selectedItemId={editingItem?.id}
                                                    items={units}
                                                    emptyMessage="No units in this course."
                                                    onRowClick={(item) => setEditingItem(item)}
                                                    columns={[
                                                        {
                                                            key: 'name', label: 'Unit / Topic', render: (u) => (
                                                                <div className="font-medium text-foreground max-w-[200px] truncate" title={u.properties['Name of Unit']?.title?.[0]?.plain_text}>
                                                                    {u.properties['Name of Unit']?.title?.[0]?.plain_text || 'Untitled'}
                                                                </div>
                                                            )
                                                        },
                                                        {
                                                            key: 'confidence', label: 'Confidence Status', render: (u) => {
                                                                const confidence = u.properties['Confidence']?.select?.name || 'Neutral'
                                                                return (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={cn(
                                                                            "w-2 h-2 rounded-full shrink-0",
                                                                            confidence === 'Confidet' ? "bg-emerald-500" :
                                                                                confidence === 'Not Confident' ? "bg-destructive" :
                                                                                    "bg-amber-500"
                                                                        )} />
                                                                        <span className="text-xs text-muted-foreground truncate">{confidence === 'Confidet' ? 'Confident' : confidence}</span>
                                                                    </div>
                                                                )
                                                            }
                                                        },
                                                        {
                                                            key: 'actions', label: '', render: (u) => {
                                                                return null
                                                            }
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })()}

                        {activeTab === 'Assignments' && (
                            <TableView
                                selectedItemId={editingItem?.id}
                                items={filterItems(data?.assignments || [], a => a.properties['Name']?.title?.[0]?.plain_text)}
                                emptyMessage="No upcoming assignments."
                                onRowClick={(item) => setEditingItem(item)}
                                columns={[
                                    {
                                        key: 'name', label: 'Task Name', render: (a) => (
                                            <div className="font-medium text-foreground">
                                                {a.properties['Name']?.title?.[0]?.plain_text || 'Untitled'}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'status', label: 'Status', render: (a) => {
                                            const status = a.properties['Status']?.status?.name || a.properties['Status']?.select?.name || 'To Do'
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        status === 'Done' ? "bg-emerald-500" :
                                                            status === 'In Progress' ? "bg-blue-500" :
                                                                "bg-muted-foreground"
                                                    )} />
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{status}</span>
                                                </div>
                                            )
                                        }
                                    },
                                    {
                                        key: 'deadline', label: 'Deadline', render: (a) => (
                                            <div className="text-muted-foreground text-xs">
                                                {a.properties['Deadline']?.date?.start || 'No Date'}
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}

                        {activeTab === 'Exams' && (
                            <TableView
                                selectedItemId={editingItem?.id}
                                items={filterItems(data?.exams || [], e => e.properties['Name']?.title?.[0]?.plain_text)}
                                emptyMessage="No upcoming exams."
                                onRowClick={(item) => setEditingItem(item)}
                                columns={[
                                    {
                                        key: 'name', label: 'Assessment Name', render: (e) => (
                                            <div className="font-medium text-foreground flex items-center gap-2">
                                                <AlertCircle size={14} className="text-destructive" />
                                                {e.properties['Name']?.title?.[0]?.plain_text || 'Untitled'}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'date', label: 'Exam Date', render: (e) => (
                                            <div className="text-foreground text-xs border bg-muted/50 px-2 py-1 rounded inline-flex">
                                                {e.properties['Exam Date']?.date?.start || 'TBD'}
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}

                    </div>
                </div>

                {/* Editing Panel Modal */}
                {editingItem && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20">
                        <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" onClick={() => setEditingItem(null)} />
                        <div className="relative w-full max-w-4xl h-[85vh] flex flex-col rounded-xl border bg-card text-card-foreground shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-4 border-b bg-muted/10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">
                                        {activeTab === 'Courses' ? 'Course Details' : activeTab === 'Study Planner' ? 'Unit Details' : activeTab === 'Assignments' ? 'Assignment Details' : 'Exam Details'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <a href={editingItem?.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent text-muted-foreground transition-colors">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <button onClick={() => setEditingItem(null)} className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent text-muted-foreground transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto flex flex-col bg-background custom-scrollbar">
                                <div className="p-6 space-y-6 shrink-0 border-b border-border/50">
                                    <div>
                                        <input
                                            value={getEditorTitleRaw() || ''}
                                            onChange={(e) => setEditorTitleRaw(e.target.value)}
                                            className="w-full bg-transparent text-xl sm:text-2xl font-bold tracking-tight text-foreground outline-none border-none placeholder:text-muted-foreground"
                                            placeholder="Untitled"
                                        />
                                    </div>

                                    {/* Property Editor Grid based on Tab */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {activeTab === 'Courses' && (
                                            <>
                                                <DetailProperty label="Course Code">
                                                    <input value={editingItem.properties['Course Code']?.rich_text?.[0]?.plain_text || ''} onChange={e => updateProperty(editingItem.id, { 'Course Code': { rich_text: [{ text: { content: e.target.value } }] } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" />
                                                </DetailProperty>
                                                <DetailProperty label="Category">
                                                    <select value={editingItem.properties['Category']?.select?.name || ''} onChange={e => updateProperty(editingItem.id, { 'Category': { select: { name: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="Major Course">Major Course</option><option value="Major Elective">Major Elective</option><option value="General Education">General Education</option><option value="Critical Path">Critical Path</option>
                                                    </select>
                                                </DetailProperty>
                                                <DetailProperty label="Status">
                                                    <select value={editingItem.properties['Status']?.status?.name || ''} onChange={e => updateProperty(editingItem.id, { 'Status': { status: { name: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="Waiting">Waiting</option><option value="On Progress">On Progress</option><option value="Done">Done</option>
                                                    </select>
                                                </DetailProperty>
                                                <DetailProperty label="Difficulty">
                                                    <select value={editingItem.properties['Difficulty']?.select?.name || ''} onChange={e => updateProperty(editingItem.id, { 'Difficulty': { select: { name: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="Easy">Easy</option><option value="Moderate">Moderate</option><option value="Hard">Hard</option>
                                                    </select>
                                                </DetailProperty>
                                                <DetailProperty label="Credit Hours">
                                                    <input type="number" value={editingItem.properties['Credit Hour']?.number || 0} onChange={e => updateProperty(editingItem.id, { 'Credit Hour': { number: Number(e.target.value) } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" />
                                                </DetailProperty>
                                            </>
                                        )}

                                        {activeTab === 'Study Planner' && (
                                            <>
                                                <DetailProperty label="Confidence">
                                                    <select value={editingItem.properties['Confidence']?.select?.name || ''} onChange={e => updateProperty(editingItem.id, { 'Confidence': { select: { name: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="Confidet">Confident</option><option value="Neutral">Neutral</option><option value="Not Confident">Not Confident</option>
                                                    </select>
                                                </DetailProperty>
                                                <DetailProperty label="Difficulty">
                                                    <select value={editingItem.properties['Difficulty']?.select?.name || ''} onChange={e => updateProperty(editingItem.id, { 'Difficulty': { select: { name: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="Hard">Hard</option><option value="Moderate">Moderate</option><option value="Easy">Easy</option>
                                                    </select>
                                                </DetailProperty>
                                                <DetailProperty label="Course">
                                                    <select value={editingItem.properties['Course']?.relation?.[0]?.id || ''} onChange={e => updateProperty(editingItem.id, { 'Course': { relation: [{ id: e.target.value }] } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="">Unlinked</option>
                                                        {data?.courses?.map(c => <option key={c.id} value={c.id}>{c.properties['Course Name']?.title?.[0]?.plain_text || 'Unnamed'}</option>)}
                                                    </select>
                                                </DetailProperty>
                                            </>
                                        )}

                                        {activeTab === 'Assignments' && (
                                            <>
                                                <DetailProperty label="Status">
                                                    <select value={editingItem.properties['Status']?.status?.name || editingItem.properties['Status']?.select?.name || 'To Do'} onChange={e => updateProperty(editingItem.id, { 'Status': { select: { name: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                                        <option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
                                                    </select>
                                                </DetailProperty>
                                                <DetailProperty label="Deadline">
                                                    <input type="date" value={editingItem.properties['Deadline']?.date?.start || ''} onChange={e => updateProperty(editingItem.id, { 'Deadline': { date: { start: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer" />
                                                </DetailProperty>
                                            </>
                                        )}

                                        {activeTab === 'Exams' && (
                                            <>
                                                <DetailProperty label="Exam Date">
                                                    <input type="date" value={editingItem.properties['Exam Date']?.date?.start || ''} onChange={e => updateProperty(editingItem.id, { 'Exam Date': { date: { start: e.target.value } } })}
                                                        className="h-9 px-3 rounded-md border border-input bg-background py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer" />
                                                </DetailProperty>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 flex flex-col relative min-h-[300px]">
                                    <div className="flex items-center justify-between px-6 py-2 bg-muted/10 border-b border-border/50 shrink-0">
                                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" /> Content Notes
                                        </span>
                                        <button
                                            onClick={saveContent}
                                            disabled={savingContent}
                                            className="inline-flex items-center justify-center rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 px-3 border shadow-sm"
                                        >
                                            {savingContent ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                                            {savingContent ? "Saving" : "Save changes"}
                                        </button>
                                    </div>

                                    <div className="flex-1 relative">
                                        {loadingContent && (
                                            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        <textarea
                                            value={markdownContent}
                                            onChange={(e) => setMarkdownContent(e.target.value)}
                                            placeholder="Add notes, context, subtasks..."
                                            className="w-full h-full p-6 bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/50 custom-scrollbar"
                                        />
                                    </div>
                                </div>

                                {/* Footer details */}
                                <div className="p-4 bg-muted/10 shrink-0 flex items-center justify-between border-t border-border/50">
                                    <span className="text-xs text-muted-foreground">Markdown supported</span>
                                    <button
                                        onClick={() => deleteTarget(editingItem.id)}
                                        className="flex items-center gap-1.5 text-xs text-destructive hover:underline font-medium"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete {activeTab.slice(0, -1)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Create Overlay */}
                {showCreate && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" onClick={() => setShowCreate(false)} />
                        <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-5">
                                <div className="space-y-1">
                                    <h3 className="font-semibold tracking-tight text-xl">Create {activeTab}</h3>
                                    <p className="text-sm text-muted-foreground">Add a new entry to your academics workspace.</p>
                                </div>
                                <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-accent focus:outline-none">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Title</label>
                                    <input
                                        autoFocus
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Enter title..."
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-2">
                                <button onClick={() => setShowCreate(false)} className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4">
                                    Cancel
                                </button>
                                <button
                                    onClick={createTarget}
                                    disabled={!newTitle.trim()}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 shadow-sm"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}
