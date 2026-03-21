import { useState, useEffect } from 'react'
import { ArrowLeft, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'

interface PageViewProps {
    page: any
    onBack: () => void
}

export default function PageView({ page, onBack }: PageViewProps) {
    const [blocks, setBlocks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBlocks = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await sidecarApi.getNotionPageContent(page.id)
            setBlocks(res.blocks || [])
        } catch (err: any) {
            console.error('Failed to fetch page content:', err)
            setError(err.message || 'Failed to load page content.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBlocks()
    }, [page.id])

    const getTitle = () => {
        const props = page.properties
        for (const key in props) {
            if (props[key]?.type === 'title') {
                const titleArr = props[key].title
                if (titleArr && titleArr.length > 0) {
                    return titleArr.map((t: any) => t.plain_text).join('')
                }
            }
        }
        return 'Untitled'
    }

    const renderPropertyValue = (prop: any) => {
        if (!prop) return <span className="text-muted-foreground">-</span>

        switch (prop.type) {
            case 'title':
            case 'rich_text':
                const textArr = prop[prop.type]
                if (!textArr || textArr.length === 0) return <span className="text-muted-foreground">-</span>
                return textArr.map((t: any) => t.plain_text).join('')
            case 'number':
                return prop.number ?? <span className="text-muted-foreground">-</span>
            case 'select':
                return prop.select ? (
                    <span className="px-2 py-0.5 rounded-full bg-secondary/50 border border-border text-xs whitespace-nowrap">
                        {prop.select.name}
                    </span>
                ) : <span className="text-muted-foreground">-</span>
            case 'multi_select':
                return prop.multi_select && prop.multi_select.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {prop.multi_select.map((s: any) => (
                            <span key={s.id} className="px-2 py-0.5 rounded-full bg-secondary/50 border border-border text-xs whitespace-nowrap">
                                {s.name}
                            </span>
                        ))}
                    </div>
                ) : <span className="text-muted-foreground">-</span>
            case 'date':
                if (!prop.date) return <span className="text-muted-foreground">-</span>
                const { start, end } = prop.date
                return end ? `${start} → ${end}` : start
            case 'checkbox':
                return prop.checkbox ? '✅' : '⬜'
            case 'url':
                return prop.url ? (
                    <a href={prop.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 truncate max-w-[200px]">
                        {prop.url}
                    </a>
                ) : <span className="text-muted-foreground">-</span>
            case 'formula':
                const fType = prop.formula?.type
                return fType ? String(prop.formula[fType] ?? '-') : <span className="text-muted-foreground">-</span>
            case 'status':
                return prop.status ? (
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs whitespace-nowrap border">
                        {prop.status.name}
                    </span>
                ) : <span className="text-muted-foreground">-</span>
            default:
                return <span className="text-muted-foreground text-xs italic opacity-50">[{prop.type}]</span>
        }
    }

    const renderBlock = (block: any) => {
        const type = block.type;
        const content = block[type];
        if (!content) return null;

        const richText = content.rich_text?.map((t: any) => t.plain_text).join('') || '';

        switch (type) {
            case 'paragraph':
                return <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">{richText || '\u00A0'}</p>
            case 'heading_1':
                return <h1 className="text-2xl font-bold mt-6 mb-4">{richText}</h1>
            case 'heading_2':
                return <h2 className="text-xl font-bold mt-5 mb-3">{richText}</h2>
            case 'heading_3':
                return <h3 className="text-lg font-bold mt-4 mb-2">{richText}</h3>
            case 'bulleted_list_item':
                return <li className="ml-4 list-disc text-sm mb-1">{richText}</li>
            case 'numbered_list_item':
                return <li className="ml-4 list-decimal text-sm mb-1">{richText}</li>
            case 'to_do':
                return (
                    <div className="flex items-start gap-2 mb-2 text-sm">
                        <input type="checkbox" checked={content.checked} readOnly className="mt-1" />
                        <span className={content.checked ? 'line-through text-muted-foreground' : ''}>{richText}</span>
                    </div>
                )
            case 'toggle':
                return (
                    <details className="mb-2">
                        <summary className="cursor-pointer text-sm font-medium">{richText}</summary>
                        <div className="ml-4 mt-2 text-sm text-muted-foreground italic">Toggle content not fully supported yet</div>
                    </details>
                )
            case 'code':
                return (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono mb-4">
                        <code>{richText}</code>
                    </pre>
                )
            case 'quote':
                return (
                    <blockquote className="border-l-4 border-primary pl-4 italic mb-4 text-muted-foreground">
                        {richText}
                    </blockquote>
                )
            case 'divider':
                return <hr className="my-6 border-border" />
            case 'callout':
                return (
                    <div className="p-4 bg-muted/50 border border-border rounded-lg mb-4 text-sm flex gap-3">
                        {content.icon?.emoji && <span>{content.icon.emoji}</span>}
                        <div>{richText}</div>
                    </div>
                )
            default:
                return <div className="text-xs text-muted-foreground mb-2 italic">Unsupported block type: {type}</div>
        }
    }

    const properties = Object.entries(page.properties).filter(([key, prop]: any) => prop.type !== 'title');

    return (
        <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">{getTitle()}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchBlocks}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary bg-secondary/50 rounded-md hover:bg-secondary transition-colors"
                    >
                        <ExternalLink size={14} />
                        Open in Notion
                    </a>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Properties Grid */}
                    {properties.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
                            {properties.map(([key, prop]: any) => (
                                <div key={key} className="flex flex-col gap-1.5 min-w-0">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{key}</span>
                                    <div className="text-sm truncate">
                                        {renderPropertyValue(prop)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="bg-card border border-border rounded-xl shadow-sm p-8 min-h-[300px]">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-20">
                                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                                <p className="text-sm">Loading content...</p>
                            </div>
                        ) : error ? (
                            <div className="h-full flex flex-col items-center justify-center text-destructive gap-3 py-20 text-center">
                                <p className="text-sm font-medium">Error loading content</p>
                                <p className="text-xs opacity-70">{error}</p>
                            </div>
                        ) : blocks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-20">
                                <FileText className="w-8 h-8 opacity-20" />
                                <p className="text-sm">This page has no content blocks.</p>
                            </div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {blocks.map(block => (
                                    <div key={block.id}>
                                        {renderBlock(block)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}