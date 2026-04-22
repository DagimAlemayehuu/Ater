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
        if (k.includes('course')) return <GraduationCap size={14} className="text-primary" />
        if (k.includes('semester')) return <Calendar size={14} className="text-primary" />
        if (k.includes('dept') || k.includes('institution')) return <Building size={14} className="text-primary" />
        if (k.includes('status')) return <Circle size={14} className="text-primary" />
        if (k.includes('hub') || k.includes('topology')) return <Network size={14} className="text-primary" />
        return <Info size={14} className="text-primary" />
    }
    
    return (
        <div className="flex flex-col gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Prominent Primary Badges */}
            <div className="flex flex-wrap gap-3">
                {metadata.Status && (
                    <div className={cn(
                        "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border shadow-sm transition-all active:scale-95",
                        metadata.Status === 'Completed' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                    )}>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", metadata.Status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {metadata.Status}
                    </div>
                )}
                {metadata.Course && (
                    <button 
                        onClick={() => onNavigate(String(metadata.Course).replace(/\[\[|\]\]/g, ''))}
                        className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary/5 border border-primary/20 text-primary flex items-center gap-3 shadow-sm active:scale-95 transition-all"
                    >
                        <GraduationCap size={14} />
                        {String(metadata.Course).replace(/\[\[|\]\]/g, '')}
                    </button>
                )}
            </div>

            {/* Grid for Secondary Properties */}
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(metadata).map(([key, value]) => {
                    if (['hub', 'Course', 'Status', 'title', 'created'].includes(key)) return null;
                    return (
                        <div key={key} className="p-4 bg-muted/5 border border-border/40 rounded-2xl flex flex-col gap-3 transition-all hover:bg-muted/10">
                            <div className="flex items-center gap-2 opacity-40">
                                {getPropertyIcon(key)}
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">{key.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="text-[12px] font-bold text-foreground/90 truncate leading-tight">
                                {String(value).startsWith('[[') ? (
                                    <button 
                                        onClick={() => onNavigate(String(value).slice(2, -2))}
                                        className="text-primary hover:underline decoration-primary/30 underline-offset-4 text-left font-black"
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

export function Backlinks({ backlinks, onNavigate }: { backlinks: any[], onNavigate: (path: string) => void }) {
    if (!backlinks || backlinks.length === 0) return null

    return (
        <div className="flex flex-col mt-8">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 px-3 flex items-center gap-2">
                <Network size={12} className="text-primary" />
                Backlinks
            </h4>
            <div className="grid grid-cols-1 gap-2">
                {backlinks.map((link, idx) => (
                    <button 
                        key={`${link.path}-${idx}`}
                        onClick={() => onNavigate(link.path)}
                        className="p-4 bg-muted/5 border border-border/40 rounded-2xl flex items-center justify-between text-left group active:scale-[0.98] transition-all"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-foreground/80 group-hover:text-primary transition-colors">{link.name}</span>
                            <span className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">{link.type}</span>
                        </div>
                        <ChevronRight size={12} className="text-muted-foreground/20 group-hover:text-primary" />
                    </button>
                ))}
            </div>
        </div>
    )
}
