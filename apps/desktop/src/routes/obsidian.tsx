import { useState, useEffect } from 'react'
import { FileText, Search, RefreshCw, Save, ChevronRight, FileCode } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'

export default function Obsidian() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [files, setFiles] = useState<any[]>([])
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingContent, setLoadingContent] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listObsidianFiles()
            setFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch obsidian files:', err)
        } finally {
            setLoading(false)
        }
    }

    const selectFile = async (path: string) => {
        setSelectedPath(path)
        setLoadingContent(true)
        try {
            const res = await sidecarApi.readObsidianNote(path)
            setContent(res.content || '')
        } catch (err) {
            console.error('Failed to read note:', err)
            setContent('Error loading content.')
        } finally {
            setLoadingContent(false)
        }
    }

    const saveNote = async () => {
        if (!selectedPath) return
        setSaving(true)
        try {
            await sidecarApi.updateObsidianNote(selectedPath, content)
            // Success animation or toast? For now just silent
        } catch (err) {
            console.error('Failed to save note:', err)
            alert('Failed to save changes.')
        } finally {
            setSaving(false)
        }
    }

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const currentFile = files.find(f => f.path === selectedPath)

    return (
        <>
            <Header>
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                </div>
            </Header>

            <Main>
                <div className="h-full flex-1 flex flex-col space-y-6 md:flex max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
                    <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Zettelkasten</h2>
                            <p className="text-muted-foreground">
                                Local knowledge vault and strategic notes.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Find local knowledge..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex h-9 w-[240px] rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <button
                                onClick={fetchFiles}
                                disabled={loading}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-6 flex-1 min-h-0">
                        {/* Notes list */}
                        <div className="w-[300px] flex flex-col gap-4 border-r border-border pr-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-semibold tracking-tight text-foreground">Directory</h3>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">{filteredFiles.length} Notes</span>
                            </div>
                            <div className="flex-1 overflow-auto space-y-1 custom-scrollbar pr-2">
                                {loading && files.length === 0 && (
                                    <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">Scanning vault...</div>
                                )}
                                {filteredFiles.map((file) => (
                                    <button
                                        key={file.path}
                                        onClick={() => selectFile(file.path)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 min-h-9 rounded-md text-sm font-medium transition-colors group",
                                            selectedPath === file.path
                                                ? "bg-muted text-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className={cn("w-4 h-4 shrink-0", selectedPath === file.path ? "text-primary" : "opacity-70")} />
                                            <div className="flex flex-col items-start truncate h-full justify-center">
                                                <span className="truncate w-full leading-none mb-1 mt-0.5">{file.name}</span>
                                                <span className="truncate w-full text-[10px] uppercase font-normal text-muted-foreground">
                                                    {file.path.split('/').slice(0, -1).join(' / ') || 'ROOT'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-3 h-3 transition-transform opacity-0 group-hover:opacity-50",
                                            selectedPath === file.path && "rotate-90 opacity-100"
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor / Preview */}
                        <div className="flex-1 flex flex-col min-w-0 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            {!selectedPath ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/60 gap-4 bg-muted/10">
                                    <div className="p-4 rounded-full bg-muted border border-border">
                                        <FileCode className="w-8 h-8 opacity-70" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-foreground">Knowledge Archive</p>
                                        <p className="text-sm text-muted-foreground">Select a local resource to begin</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full animate-in fade-in duration-300">
                                    {/* Toolbar */}
                                    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/20">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-1.5 rounded-md bg-muted text-muted-foreground border">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-sm font-semibold text-foreground truncate">
                                                    {currentFile?.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                    <span>{currentFile?.path}</span>
                                                    <span>·</span>
                                                    <span>Synced {new Date().toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={saveNote}
                                                disabled={saving}
                                                className={cn(
                                                    "inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                                    saving && "animate-pulse"
                                                )}
                                            >
                                                <Save className="mr-2 h-3.5 w-3.5" />
                                                {saving ? 'Syncing...' : 'Sync Changes'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Two-Pane Editor */}
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Editor Side */}
                                        <div className="flex-1 border-r border-border relative flex flex-col">
                                            <div className="px-6 py-2 bg-muted/10 border-b border-border text-xs font-medium text-muted-foreground flex items-center justify-between">
                                                <span>Markdown Base</span>
                                                <span>{content.length} characters</span>
                                            </div>
                                            <textarea
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="Begin synthesizing knowledge..."
                                                className="flex-1 w-full p-6 bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground custom-scrollbar"
                                            />
                                        </div>

                                        {/* Preview Side */}
                                        <div className="flex-1 bg-muted/5 flex flex-col overflow-hidden">
                                            <div className="px-6 py-2 bg-muted/10 border-b border-border text-xs font-medium text-muted-foreground">
                                                Live Preview
                                            </div>
                                            <div className="flex-1 overflow-auto p-6 custom-scrollbar prose prose-sm dark:prose-invert max-w-none">
                                                {loadingContent ? (
                                                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                                        <span className="text-xs font-medium">Hydrating source...</span>
                                                    </div>
                                                ) : (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {content}
                                                    </ReactMarkdown>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
