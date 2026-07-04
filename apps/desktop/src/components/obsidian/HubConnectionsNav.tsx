import React, { useMemo, useState, useEffect } from 'react'
import { ChevronRight, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import { toast } from 'sonner'

export type NavNode = {
  label: string
  target: string | null
  depth: number
  children: NavNode[]
  isChecked: boolean
}

export function parseHubTree(content: string): NavNode[] {
  const lines = content.split('\n')
  const wikilinkRe = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/
  const listItemRe = /^(\s*)[-*]\s+(.*)/

  const roots: NavNode[] = []
  const stack: {node: NavNode; indent: number}[] = []

  for (const line of lines) {
    if (!line.trim()) continue
    const m = listItemRe.exec(line)
    if (!m) continue
    
    const indent = m[1].length
    const text = m[2].trim()

    const wm = wikilinkRe.exec(text)
    const target = wm ? wm[1].trim() : null
    let label = wm
      ? (wm[2] || wm[1]).trim().split(/[/\\]/).pop() || wm[1]
      : text.replace(/\[x\]|\[ \]/ig, '').replace(/\*\*/g, '').trim()

    label = label.replace(/^[\s🔒🔐🔓🔑]+/gu, '').trim()

    const isChecked = typeof text === 'string' && text.toLowerCase().startsWith('[x]')
    const node: NavNode = {label, target, depth: 0, children: [], isChecked}

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    if (stack.length === 0) {
      node.depth = 0
      roots.push(node)
    } else {
      node.depth = stack[stack.length - 1].node.depth + 1
      stack[stack.length - 1].node.children.push(node)
    }
    stack.push({node, indent})
  }
  return roots
}

interface HubConnectionsNavProps {
  content: string
  activePath: string | null
  onNavigate: (name: string) => void
  onToggleCheckbox: (label: string, isChecked: boolean, target: string | null) => void
  searchQuery?: string
}

export const HubConnectionsNav = React.memo(({
  content, 
  activePath, 
  onNavigate, 
  onToggleCheckbox, 
  searchQuery
}: HubConnectionsNavProps) => {
  const [tutorSession, setTutorSession] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTutorSession = async () => {
      const activeSessionId = localStorage.getItem('ater_active_session_id');
      if (!activeSessionId) {
        if (active) setTutorSession(null);
        return;
      }
      try {
        const session = await sidecarApi.getTutorStatus(activeSessionId);
        if (active && session) {
          setTutorSession(session);
        }
      } catch (err) {
        console.error('Failed to fetch session progress for HubConnectionsNav:', err);
      }
    };
    void fetchTutorSession();
    return () => { active = false; };
  }, [content, activePath]);

  const getNoteStem = (p: string) => {
    return p.split(/[/\\]/).pop()?.replace(/\.(md|pdf)$/i, '')?.replace(/_/g, ' ')?.toLowerCase() || '';
  };

  const completedStems = useMemo(() => {
    return new Set(
      (Array.isArray(tutorSession?.completed_notes) ? tutorSession.completed_notes : [])
        .map((p: string) => getNoteStem(p))
    );
  }, [tutorSession?.completed_notes]);

  const unlockedStems = useMemo(() => {
    return new Set(
      (Array.isArray(tutorSession?.active_note_unlocks) ? tutorSession.active_note_unlocks : [])
        .map((p: string) => getNoteStem(p))
    );
  }, [tutorSession?.active_note_unlocks]);

  const currentStem = useMemo(() => {
    return activePath ? getNoteStem(activePath) : (tutorSession?.current_note_path ? getNoteStem(tutorSession.current_note_path) : '');
  }, [activePath, tutorSession?.current_note_path]);

  const getNodeStatus = (target: string | null): 'completed' | 'active' | 'unlocked' | 'locked' | 'current' => {
    if (!target) return 'locked';
    const stem = getNoteStem(target);

    if (!tutorSession) {
      return 'unlocked';
    }

    const inCurriculum = tutorSession?.curriculum?.some((p: string) => getNoteStem(p) === stem);
    if (!inCurriculum) {
      return 'unlocked';
    }

    if (completedStems.has(stem)) return 'completed';
    if (stem === currentStem) return 'current';
    if (unlockedStems.has(stem)) return 'unlocked';
    return 'locked';
  };
  
  const tree = useMemo(() => {
    const baseTree = parseHubTree(content);
    if (!searchQuery) return baseTree;
    
    const lowerQuery = searchQuery.toLowerCase();
    const filterNodes = (nodes: NavNode[]): NavNode[] => {
      const result: NavNode[] = [];
      for (const node of nodes) {
        const matches = typeof node.label === 'string' && node.label.toLowerCase().includes(lowerQuery);
        const childrenMatches = node.children.length > 0 ? filterNodes(node.children) : [];
        if (matches || childrenMatches.length > 0) {
          result.push({
            ...node,
            children: childrenMatches
          });
        }
      }
      return result;
    };
    return filterNodes(baseTree);
  }, [content, searchQuery]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const expandAll = (nodes: NavNode[]) => {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        let changed = false;
        const traverse = (itemList: NavNode[]) => {
          for (const node of itemList) {
            if (!next.has(node.label)) {
              next.add(node.label);
              changed = true;
            }
            if (node.children.length > 0) traverse(node.children);
          }
        };
        traverse(nodes);
        return changed ? next : prev;
      });
    };
    expandAll(tree);
  }, [tree]);

  const toggleNode = (label: string) => {
    const next = new Set(expandedNodes);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setExpandedNodes(next);
  };

  function renderNode(node: NavNode, idx: number): React.ReactNode {
    const status = getNodeStatus(node.target);
    const completed = status === 'completed' || node.isChecked;
    const active = status === 'current' || status === 'active';
    const unlocked = status === 'unlocked';
    const locked = status === 'locked';
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.label);

    return (
      <div key={`${node.target ?? node.label}-${idx}`} className="flex flex-col">
        <div 
          className={cn(
            "group flex items-center gap-1.5 py-1 px-3 rounded-[4px] relative mx-1 transition-all",
            active && "bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/20",
            completed && !active && "text-muted-foreground/55",
            unlocked && !active && "hover:bg-foreground/[0.03] text-muted-foreground hover:text-foreground",
            locked && "opacity-45 select-none"
          )}
        >
          {node.depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 flex" style={{width: node.depth * 14}}>
              {Array.from({length: node.depth}).map((_, i) => (
                <div key={i} className="w-[14px] border-r border-border/20 h-full" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 w-full" style={{marginLeft: node.depth * 14}}>
            <div 
              className="w-4 h-4 shrink-0 flex items-center justify-center cursor-pointer"
              onClick={(e) => {e.stopPropagation(); toggleNode(node.label);}}
            >
              {hasChildren ? (
                <ChevronRight className={cn("w-3 h-3 text-muted-foreground/40 transition-transform", isExpanded ? "rotate-90" : "")} />
              ) : null}
            </div>

            <input 
              type="checkbox" 
              checked={completed} 
              readOnly
              aria-label={`${completed ? 'Completed' : active ? 'Current' : locked ? 'Locked' : 'Upcoming'} lesson: ${node.label.replace(/_/g, ' ')}`}
              className={cn(
                "h-3.5 w-3.5 shrink-0 appearance-none border border-border bg-bento-card rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3.5px] after:h-[7.5px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 transition-all hover:border-foreground/20",
                completed && "opacity-80",
                active && "border-primary/70 bg-primary/10",
                locked && "cursor-not-allowed opacity-20"
              )} 
            />
            
            {node.target ? (
              <button
                onClick={() => {
                  if (locked) {
                    toast.error("This lesson is locked. Complete your current lesson first.");
                    return;
                  }
                  onNavigate(node.target!);
                }}
                className={cn(
                  "text-left text-[11px] leading-tight truncate flex-1 hover:text-foreground font-medium",
                  active && "text-foreground font-black",
                  completed && !active && "text-muted-foreground/50 font-medium line-through",
                  locked && "text-muted-foreground/35 cursor-not-allowed",
                  unlocked && !active && !completed && "text-muted-foreground/70"
                )}
              >
                {node.label.replace(/_/g, ' ')}
              </button>
            ) : (
              <span 
                onClick={() => toggleNode(node.label)}
                className="text-[9px] font-black uppercase tracking-widest opacity-30 flex-1 select-none cursor-pointer"
              >
                {node.label.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child, cidx) => renderNode(child, cidx))}
          </div>
        )}
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 opacity-20">
        <Network size={24} strokeWidth={1} className="text-muted-foreground" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Empty</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-0.5">
      {tree.map((node, idx) => renderNode(node, idx))}
    </div>
  )
})

HubConnectionsNav.displayName = 'HubConnectionsNav'
