import React from 'react'
import { 
    GraduationCap, Calendar, Building, Circle, 
    Paperclip, FileText, Info, ChevronRight, Network 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function NoteProperties({ metadata, onNavigate }: { metadata: Record<string, any>, onNavigate: (link: string) => void }) {
    if (!metadata || Object.keys(metadata).length === 0) return null

    const getPropertyIcon = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes('course')) return <GraduationCap size={14} className="text-primary/60" />
        if (k.includes('semester')) return <Calendar size={14} className="text-primary/60" />
        if (k.includes('dept') || k.includes('institution')) return <Building size={14} className="text-primary/60" />
        if (k.includes('status')) return <Circle size={14} className="text-primary/60" />
        if (k.includes('hub') || k.includes('topology')) return <Network size={14} className="text-primary/60" />
        return <Info size={14} className="text-primary/60" />
    }
    
    return (
        <div className="flex flex-col gap-6 mb-12 animate-in slide-in-from-top-4 duration-700">
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(metadata).map(([key, value]) => {
                    if (['hub', 'Course', 'Status'].includes(key)) return null; // These are often handled separately or prominent
                    return (
                        <div key={key} className="p-4 bg-muted/5 border border-border/40 rounded-2xl flex flex-col gap-2 transition-all hover:bg-muted/10 active:scale-95">
                            <div className="flex items-center gap-2">
                                {getPropertyIcon(key)}
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="text-[11px] font-bold text-primary truncate">
                                {String(value).startsWith('[[') ? (
                                    <button 
                                        onClick={() => onNavigate(String(value).slice(2, -2))}
                                        className="text-primary hover:underline decoration-primary/30 underline-offset-2 text-left"
                                    >
                                        {String(value).slice(2, -2).split('/').pop()}
                                    </button>
                                ) : (
                                    <span className="break-words">{String(value)}</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Prominent Metadata Badges */}
            <div className="flex flex-wrap gap-2">
                {metadata.Status && (
                    <div className={cn(
                        "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm",
                        metadata.Status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", metadata.Status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {metadata.Status}
                    </div>
                )}
                {metadata.Course && (
                    <div className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary flex items-center gap-2">
                        <GraduationCap size={12} />
                        {String(metadata.Course).replace(/\[\[|\]\]/g, '')}
                    </div>
                )}
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
