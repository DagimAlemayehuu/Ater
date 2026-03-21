import { useState, useEffect } from 'react'
import { ArrowLeft, RefreshCw, Table as TableIcon, FileText, ExternalLink } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import PageView from './page-view'

interface DatabaseViewProps {
    database: {
        id: string
        title: any[]
        url: string
    }
    onBack: () => void
}

export default function DatabaseView({ database, onBack }: DatabaseViewProps) {
    const [rows, setRows] = useState<any[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedPage, setSelectedPage] = useState<any | null>(null)

    const fetchRows = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await sidecarApi.queryNotionDatabase(database.id)
            const results = res.results || []
            setRows(results)

            if (results.length > 0) {
                // Extract unique column names from the properties of the first row
                const firstRowProps = results[0].properties
                const cols = Object.keys(firstRowProps)
                
                // Try to move 'Name' or 'Title' to the front
                cols.sort((a, b) => {
                    if (firstRowProps[a]?.type === 'title') return -1
                    if (firstRowProps[b]?.type === 'title') return 1
                    return 0
                })
                
                setColumns(cols)
            }
        } catch (err: any) {
            console.error('Failed to fetch database rows:', err)
            setError(err.message || 'Failed to load database content.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRows()
    }, [database.id])

    const getTitle = () => {
        if (!database.title || database.title.length === 0) return 'Untitled Database'
        return database.title.map(t => t.plain_text).join('') || 'Untitled Database'
    }

    const renderCellValue = (prop: any) => {
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
                    <a href={prop.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline text-xs flex items-center gap-1">
                        Link <ExternalLink size={10} />
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

    if (selectedPage) {
        return <PageView page={selectedPage} onBack={() => setSelectedPage(null)} />
    }

    return (
        <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4 duration-300">
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
                        <TableIcon size={18} className="text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">{getTitle()}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRows}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <a
                        href={database.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary bg-secondary/50 rounded-md hover:bg-secondary transition-colors"
                    >
                        <ExternalLink size={14} />
                        Open in Notion
                    </a>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden border rounded-xl bg-card shadow-sm">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-sm">Loading database rows...</p>
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center text-destructive gap-3 p-6 text-center">
                        <p className="text-sm font-medium">Error loading data</p>
                        <p className="text-xs opacity-70">{error}</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <FileText className="w-8 h-8 opacity-20" />
                        <p className="text-sm">This database is empty.</p>
                    </div>
                ) : (
                    <div className="h-full overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} className="px-4 py-3 font-medium text-muted-foreground border-b whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map((row) => (
                                    <tr 
                                        key={row.id} 
                                        onClick={() => setSelectedPage(row)}
                                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        {columns.map(col => (
                                            <td key={`${row.id}-${col}`} className="px-4 py-3 max-w-[300px] truncate">
                                                {renderCellValue(row.properties[col])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
