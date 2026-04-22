import React from 'react'
import { 
    GraduationCap, Calendar, Building, Circle, 
    Paperclip, FileText, Info, ChevronRight, Network 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function NoteProperties({ metadata, onNavigate }: { metadata: Record<string, any>, onNavigate: (link: string) => void }) {
    if (!metadata || Object.keys(metadata).length === 0) {
        return (
            <div className="py-8 text-center opacity-20">
                <Info size={24} className="mx-auto mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">No_Defined_Properties</span>
            </div>
        )
    }

    const getPropertyIcon = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes('course')) return <GraduationCap size={14} />
        if (k.includes('semester')) return <Calendar size={14} />
        if (k.includes('dept') || k.includes('institution') || k.includes('building')) return <Building size={14} />
        if (k.includes('status')) return <Circle size={14} />
        if (k.includes('hub') || k.includes('topology') || k.includes('network')) return <Network size={14} />
        if (k.includes('source')) return <Paperclip size={14} />
        return <Info size={14} />
    }
    
    return (
        <div className="flex flex-col bg-muted/5 rounded-xl border border-border/10 overflow-hidden divide-y divide-border/10 animate-in fade-in slide-in-from-top-4 duration-500">
            {Object.entries(metadata).map(([key, value]) => {
                const k = key.toLowerCase();
                if (['title', 'created', 'updated', 'tags', 'hub_title', 'quiz_path', 'score', 'completed'].includes(k)) return null;
                if (!value) return null;
                
                return (
                    <div key={key} className="grid grid-cols-[100px_1fr] items-center min-h-[44px] gap-2 px-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-2 py-2 overflow-hidden border-r border-border/5 pr-2 h-full">
                            <div className="text-muted-foreground/40 shrink-0">
                                {getPropertyIcon(key)}
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest truncate">
                                {key.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <div className="py-2 pl-2 overflow-hidden flex items-center h-full">
                            {k === 'status' ? (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest inline-block",
                                    value === 'Completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'
                                )}>{String(value)}</span>
                            ) : (
                                String(value).startsWith('[[') ? (
                                    <button 
                                        onClick={() => onNavigate(String(value).slice(2, -2))}
                                        className="text-primary hover:underline underline-offset-4 decoration-primary/20 text-left truncate font-black text-[11px]"
                                    >
                                        {String(value).slice(2, -2).split('/').pop()}
                                    </button>
                                ) : (
                                    <span className="truncate text-[11px] font-bold text-foreground/70 uppercase tracking-tight italic">
                                        {String(value)}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export type NavNode = { label: string; target: string | null; depth: number; children: NavNode[] }

export function parseHubTree(content: string): NavNode[] {
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
            <div key={`${node.target ?? node.label}-${idx}`} className="group/nav-item">
                <div 
                    className={cn(
                        "flex items-center transition-all duration-200 border-l py-2",
                        active 
                            ? "border-primary bg-primary/5 -mr-4 pr-4" 
                            : isRoot ? "border-transparent text-muted-foreground" : "border-transparent text-muted-foreground/60 group-hover/nav-item:border-border"
                    )}
                    style={{ paddingLeft: (indentLevel * 12) + 16 }}
                >
                    {node.target ? (
                        <button
                            onClick={() => onNavigate(node.target!)}
                            className={cn(
                                "text-left leading-tight truncate transition-colors w-full",
                                active 
                                    ? "text-[11px] font-black text-primary" 
                                    : "text-[10px] font-bold group-hover/nav-item:text-foreground"
                            )}
                            title={node.target}
                        >
                            {node.label}
                            {active && <span className="ml-2 opacity-50 text-[10px]">📍</span>}
                        </button>
                    ) : (
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em] leading-none px-1 py-0.5 rounded",
                            isRoot ? "text-primary bg-primary/5" : "text-muted-foreground/40"
                        )}>
                            {node.label}
                        </span>
                    )}
                </div>
                {hasChildren && (
                    <div className="mt-0.5 mb-1.5">
                        {node.children.map((child, cidx) => renderNode(child, cidx))}
                    </div>
                )}
            </div>
        )
    }

    if (tree.length === 0) {
        return (
            <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
                NO_ANCHORED_TOPOLOGIES
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-0.5 mt-4">
            <h4 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-6 px-6">Topology_Index</h4>
            {tree.map((node, idx) => renderNode(node, idx))}
        </div>
    )
}

export function Backlinks({ backlinks, onNavigate }: { backlinks: any[], onNavigate: (path: string) => void }) {
    if (!backlinks || backlinks.length === 0) return null

    return (
        <div className="flex flex-col mt-12 pt-12 border-t border-border/40">
            <h4 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-6 px-4 flex items-center gap-3">
                <Network size={14} className="text-primary/40" />
                Linked_Mentions
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
                {backlinks.map((link, idx) => (
                    <button 
                        key={`${link.path}-${idx}`}
                        onClick={() => onNavigate(link.path)}
                        className="p-5 bg-muted/5 border border-border/40 rounded-2xl flex items-center justify-between text-left group active:scale-[0.98] transition-all hover:border-primary/20"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[13px] font-bold text-foreground/90 group-hover:text-primary transition-colors">{link.name}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">{link.type}</span>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-primary" />
                    </button>
                ))}
            </div>
        </div>
    )
}
