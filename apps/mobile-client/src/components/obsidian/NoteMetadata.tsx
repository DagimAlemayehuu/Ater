import React from 'react'
import { 
    GraduationCap, Calendar, Building, Circle, 
    Paperclip, FileText, Info, ChevronRight 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function NoteProperties({ metadata, onNavigate }: { metadata: Record<string, any>, onNavigate: (link: string) => void }) {
    if (!metadata || Object.keys(metadata).length === 0) return null

    const getPropertyIcon = (key: string) => {
        switch (key.toLowerCase()) {
            case 'course': return <GraduationCap size={16} />
            case 'semester': return <Calendar size={16} />
            case 'department': return <Building size={16} />
            case 'status': return <Circle size={16} />
            case 'source': return <Paperclip size={16} />
            case 'source_page': return <FileText size={16} />
            default: return <Info size={16} />
        }
    }
    
    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="grid grid-cols-1 gap-y-4 py-6 border-y border-border/50">
                {Object.entries(metadata).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-4">
                        <div className="w-5 flex justify-center text-muted-foreground mt-0.5">
                            {getPropertyIcon(key)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{key.replace(/_/g, ' ')}</span>
                            <div className="text-xs font-bold text-primary">
                                {key.toLowerCase() === 'status' ? (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-sm text-[9px] uppercase font-black tracking-widest inline-block",
                                        value === 'Completed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    )}>{String(value)}</span>
                                ) : (
                                    String(value).startsWith('[[') ? (
                                        <button 
                                            onClick={() => onNavigate(String(value).slice(2, -2))}
                                            className="text-primary underline decoration-border/50 underline-offset-2 text-left"
                                        >
                                            {String(value).slice(2, -2).split('/').pop()}
                                        </button>
                                    ) : (
                                        <span className="break-words">{String(value)}</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

type NavNode = { label: string; target: string | null; depth: number; children: NavNode[] }

function parseHubTree(content: string): NavNode[] {
    const lines = content.split('\n')
    const wikilinkRe = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/
    const listItemRe = /^(\s*)[\-\*]\s+(.*)/

    const roots: NavNode[] = []
    const stack: NavNode[] = []

    for (const line of lines) {
        const m = listItemRe.exec(line)
        if (!m) continue
        const indent = m[1].length
        const text = m[2].trim()

        const wm = wikilinkRe.exec(text)
        const target = wm ? wm[1].trim() : null
        const label = wm
            ? (wm[2] || wm[1]).trim().split('/').pop() || wm[1]
            : text.replace(/\*\*/g, '').trim()

        const depth = Math.floor(indent / 2)
        const node: NavNode = { label, target, depth, children: [] }

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            stack.pop()
        }

        if (stack.length === 0) {
            roots.push(node)
        } else {
            stack[stack.length - 1].children.push(node)
        }
        stack.push(node)
    }
    return roots
}

export function HubConnectionsNav({ content, activePath, onNavigate }: { content: string, activePath: string | null, onNavigate: (name: string) => void }) {
    const activeNoteName = activePath?.split('/').pop()?.replace('.md', '').replace('.pdf', '')?.toLowerCase() || ''
    const tree = parseHubTree(content)

    function isActive(node: NavNode): boolean {
        if (!node.target) return false
        const targetClean = node.target.split('/').pop()?.replace('.md', '')?.replace('.pdf', '')?.toLowerCase() || ''
        return targetClean === activeNoteName || node.label.toLowerCase() === activeNoteName
    }

    function renderNode(node: NavNode, idx: number): React.ReactNode {
        const active = isActive(node)
        const hasChildren = node.children.length > 0
        const indentLevel = node.depth
        const isRoot = indentLevel === 0

        return (
            <div key={`${node.target ?? node.label}-${idx}`} className="flex flex-col">
                <div 
                    className={cn(
                        "flex items-center border-l py-2 my-0.5",
                        active 
                            ? "border-primary bg-primary/5" 
                            : "border-transparent"
                    )}
                    style={{ paddingLeft: (indentLevel * 12) + 12 }}
                >
                    {node.target ? (
                        <button
                            onClick={() => onNavigate(node.target!)}
                            className={cn(
                                "text-left leading-tight truncate w-full",
                                active 
                                    ? "text-[12px] font-black text-primary" 
                                    : "text-[11px] font-bold text-muted-foreground"
                            )}
                        >
                            {node.label}
                            {active && <span className="ml-2 text-[10px]">📍</span>}
                        </button>
                    ) : (
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isRoot ? "text-primary" : "text-muted-foreground/60"
                        )}>
                            {node.label}
                        </span>
                    )}
                </div>
                {hasChildren && (
                    <div className="flex flex-col">
                        {node.children.map((child, cidx) => renderNode(child, cidx))}
                    </div>
                )}
            </div>
        )
    }

    if (tree.length === 0) {
        return (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                NO_CONNECTIONS
            </div>
        )
    }

    return (
        <div className="flex flex-col mt-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 px-3">Topologies</h4>
            {tree.map((node, idx) => renderNode(node, idx))}
        </div>
    )
}
