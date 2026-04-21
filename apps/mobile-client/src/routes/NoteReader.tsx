import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sidecarApi } from '@/lib/sidecarApi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

export function NoteReader() {
    const { path } = useParams()
    const navigate = useNavigate()
    const [note, setNote] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            if (!path) return
            try {
                const decodedPath = decodeURIComponent(path)
                const res = await sidecarApi.readObsidianNote(decodedPath)
                setNote(res)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [path])

    if (loading) return (
        <div className="flex-1 flex items-center justify-center h-screen bg-background text-primary">
            <span className="material-symbols-outlined animate-spin text-[32px]">refresh</span>
        </div>
    )

    const metadata = note?.metadata || {}
    const noteTitle = path?.split('/').pop()?.replace('.md', '').replace(/_/g, ' ') || 'Untitled Manuscript'

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 overflow-y-auto custom-scrollbar pt-16">
            {/* Top Toolbar (Fixed-ish) */}
            <div className="fixed top-0 left-0 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border/10 flex items-center justify-between px-6 z-[60]">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="text-lg font-bold tracking-[-0.04em] uppercase text-primary">Manuscript</div>
                <button className="p-2 -mr-2 text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            <main className="flex-1 px-6 flex flex-col w-full max-w-3xl mx-auto pb-32">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mt-8 mb-6 overflow-x-auto whitespace-nowrap">
                    <span className="label-sm text-secondary uppercase">{metadata.department || 'GENERAL'}</span>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-secondary uppercase">{metadata.semester || 'CORE'}</span>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-primary uppercase">{noteTitle}</span>
                </nav>

                {/* Document Title */}
                <h1 className="display-md text-primary mb-8 break-words">{noteTitle}</h1>

                {/* Metadata Panel */}
                <div className="bg-surface-container-low p-5 mb-10 flex flex-col gap-4 tonal-separation-bottom">
                    {metadata.course && (
                        <div className="flex justify-between items-center border-b border-border/10 pb-3">
                            <span className="label-md text-secondary">Course</span>
                            <span className="body-md font-medium text-primary">{metadata.course}</span>
                        </div>
                    )}
                    {metadata.semester && (
                        <div className="flex justify-between items-center border-b border-border/10 pb-3">
                            <span className="label-md text-secondary">Semester</span>
                            <span className="body-md font-medium text-primary">{metadata.semester}</span>
                        </div>
                    )}
                    {metadata.topic && (
                        <div className="flex justify-between items-center border-b border-border/10 pb-3">
                            <span className="label-md text-secondary">Topic</span>
                            <span className="body-md font-medium text-primary">{metadata.topic}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="label-md text-secondary">Status</span>
                        <span className="label-sm bg-primary text-on-primary px-2 py-1 tracking-wider uppercase">
                            {metadata.status || 'MASTERED'}
                        </span>
                    </div>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-sm max-w-none text-on-surface-variant flex flex-col gap-6 font-['Inter']">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h2: ({ ...props }) => <h2 className="headline-sm text-primary mb-4 mt-12 border-l-2 border-border/20 pl-4" {...props} />,
                            p: ({ ...props }) => <p className="body-md leading-[1.6]" {...props} />,
                            ul: ({ ...props }) => <ul className="flex flex-col gap-4 list-none pl-4 border-l-2 border-border/10" {...props} />,
                            li: ({ ...props }) => (
                                <li className="flex items-start gap-4">
                                    <span className="material-symbols-outlined text-primary text-[18px] mt-1 shrink-0">arrow_right_alt</span>
                                    <span className="body-md">{props.children}</span>
                                </li>
                            ),
                            blockquote: ({ ...props }) => (
                                <div className="bg-surface-container-lowest p-5 my-6 ghost-border border-l-4 border-primary">
                                    <span className="label-sm text-secondary mb-2 block tracking-widest">EXCERPT</span>
                                    <div className="body-md italic">{props.children}</div>
                                </div>
                            )
                        }}
                    >
                        {note?.content || '_No content found in this manuscript._'}
                    </ReactMarkdown>
                </div>
            </main>
        </div>
    )
}
