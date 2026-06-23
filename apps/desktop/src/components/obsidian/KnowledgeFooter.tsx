import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Play, SkipForward } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { useConfig } from '@/lib/ConfigContext'
import { NavNode } from './HubConnectionsNav'

interface KnowledgeFooterProps {
  tree: NavNode[]
  activePath: string | null
  onNavigate: (path: string) => void
  onFinish?: () => Promise<void>
}

export const KnowledgeFooter = React.memo(({
  tree, 
  activePath, 
  onNavigate, 
  onFinish
}: KnowledgeFooterProps) => {
  const navigate = useNavigate();
  const { setCurrentHub, setTimeLeft, setIsActive, setShowOverlay } = usePomodoroStore();
  const { config } = useConfig();
  
  // Flatten tree to get linear order
  const flattened = useMemo(() => {
    const list: NavNode[] = [];
    const traverse = (nodes: NavNode[]) => {
      for (const node of nodes) {
        if (node.target) list.push(node);
        if (node.children && node.children.length > 0) traverse(node.children);
      }
    };
    traverse(tree);
    return list;
  }, [tree]);

  // Find current index with robust matching
  const currentIndex = useMemo(() => {
    if (!activePath || typeof activePath !== 'string') return -1;
    const activeNoteName = activePath.split(/[/\\]/).pop()?.replace('.md', '').replace('.html', '').replace('.pdf', '') || '';
    
    return flattened.findIndex(n => {
      if (!n.target) return false;
      const targetName = n.target.split(/[/\\]/).pop()?.replace('.md', '').replace('.html', '') || n.target;
      return targetName === activeNoteName || n.target === activePath;
    });
  }, [flattened, activePath]);

  const prevNode = currentIndex > 0 ? flattened[currentIndex - 1] : null;
  const nextNode = currentIndex < flattened.length - 1 && currentIndex !== -1 ? flattened[currentIndex + 1] : null;

  const isHub = typeof activePath === 'string' && activePath.toLowerCase().includes('_hub.md');
  const hubId = typeof activePath === 'string' ? activePath.split(/[/\\]/).pop()?.replace('.md', '').replace('.html', '') : '';

  if (!activePath) return null;

  return (
    <div className="mt-24 pt-12 border-t border-border/20 flex items-center justify-center pb-24 px-8">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {prevNode && (
            <button 
              onClick={() => onNavigate(prevNode.target!)}
              className="flex items-center gap-3 px-6 py-2.5 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-none border border-border/40 group transition-none"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 " />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Previous Note</span>
                <span className="text-[10px] font-bold truncate max-w-[150px]">{prevNode.label}</span>
              </div>
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 justify-center">
          {isHub && (
            <button 
              data-tour="obsidian-pomodoro"
              onClick={() => {
                let hubName = activePath?.split(/[/\\]/).pop()?.replace('_Hub.md', '').replace('.md', '').replace(/_/g, ' ') || 'Current Hub';
                hubName = hubName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                
                setCurrentHub(hubName);
                setTimeLeft((config?.pomodoroWorkDuration || 25) * 60);
                setIsActive(true);
                setShowOverlay(false);

                if (flattened.length > 0 && flattened[0].target) {
                  onNavigate(flattened[0].target);
                } else {
                  navigate(`/practice?hubId=${hubId}`);
                }
              }}
              className="flex items-center gap-3 px-10 py-3 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-none border border-border/40 font-bold uppercase tracking-widest text-[10px] transition-none w-full min-w-[200px]"
            >
              <Play size={14} fill="currentColor" />
              Start Study Session
            </button>
          )}

          {(!nextNode || isHub) && !(typeof activePath === 'string' && activePath.toLowerCase().endsWith('.pdf')) && (
            <button 
              onClick={() => navigate(`/practice?hubId=${hubId}`)}
              className="flex items-center gap-3 px-10 py-3 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-none border border-border/40 font-bold uppercase tracking-widest text-[10px] transition-none w-full min-w-[200px]"
            >
              <SkipForward size={14} />
              Start Final Practice
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          {nextNode && (
            <button 
              onClick={async () => {
                if (onFinish) await onFinish();
                onNavigate(nextNode.target!);
              }}
              className="flex items-center gap-3 px-6 py-2.5 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-none border border-border/40 group text-right transition-none"
            >
              <div className="flex flex-col items-end min-w-0">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Next Note</span>
                <span className="text-[10px] font-bold truncate max-w-[150px]">{nextNode.label}</span>
              </div>
              <ChevronRight size={16} className="group-hover:translate-x-1 " />
            </button>
          )}
        </div>
      </div>
    </div>
  );
})

KnowledgeFooter.displayName = 'KnowledgeFooter'
