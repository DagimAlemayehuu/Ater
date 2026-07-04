import React, { useMemo, useState, useEffect } from 'react'
import { ChevronRight, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const activeNoteName = typeof activePath === 'string' ? activePath.split(/[/\\]/).pop()?.replace('.md', '').replace('.pdf', '')?.toLowerCase() || '' : ''
  
  const tree = useMemo(() => {
    const baseTree = parseHubTree(content);
    if (!searchQuery) return baseTree;
    
    const filterNodes = (nodes: NavNode[]): NavNode[] => {
      return nodes.filter(node => {
        const matches = typeof node.label === 'string' && node.label.toLowerCase().includes((searchQuery || '').toLowerCase());
        const childrenMatches = node.children.length > 0 ? filterNodes(node.children) : [];
        if (matches || childrenMatches.length > 0) {
          node.children = childrenMatches;
          return true;
        }
        return false;
      });
    };
    return filterNodes(JSON.parse(JSON.stringify(baseTree)));
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
    const active = (typeof node.target === 'string' ? node.target.split(/[/\\]/).pop()?.replace('.md', '')?.replace('.pdf', '')?.toLowerCase() : '') === activeNoteName;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.label);

    return (
      <div key={`${node.target ?? node.label}-${idx}`} className="flex flex-col">
        <div 
          className={cn(
            "group flex items-center gap-1.5 py-1 px-3 rounded-[4px] cursor-pointer relative mx-1",
            active ? "bg-accent text-foreground font-semibold shadow-sm" : "hover:bg-foreground/[0.03] text-muted-foreground hover:text-foreground"
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
              className="w-4 h-4 shrink-0 flex items-center justify-center"
              onClick={(e) => {e.stopPropagation(); toggleNode(node.label);}}
            >
              {hasChildren ? (
                <ChevronRight className={cn("w-3 h-3  text-muted-foreground/40", isExpanded ? "rotate-90" : "")} />
              ) : null}
            </div>

            <input 
              type="checkbox" 
              checked={node.isChecked} 
              onChange={(e) => onToggleCheckbox(node.label, e.target.checked, node.target)}
              aria-label={`Toggle check state for ${node.label}`}
              className={cn(
                "h-3.5 w-3.5 shrink-0 appearance-none border border-border bg-bento-card rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3.5px] after:h-[7.5px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 cursor-pointer transition-all hover:border-foreground/20",
                node.isChecked && "opacity-30"
              )} 
            />
            
            {node.target ? (
              <button
                onClick={() => onNavigate(node.target!)}
                className={cn(
                  "text-left text-[11px] leading-tight truncate flex-1 hover:text-foreground ",
                  node.isChecked && "line-through opacity-40"
                )}
              >
                {node.label.replace(/_/g, ' ')}
              </button>
            ) : (
              <span 
                onClick={() => toggleNode(node.label)}
                className="text-[9px] font-black uppercase tracking-widest opacity-30 flex-1 select-none"
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
