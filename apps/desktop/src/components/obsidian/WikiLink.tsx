import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { sidecarApi } from '@/lib/sidecarApi';
import { toast } from 'sonner';
import { MarkdownContext } from './MarkdownViewer';

const getNoteStatus = (dest: string, session: any) => {
    if (!session || !session.curriculum) return 'not_in_curriculum';

    const getNoteStem = (p: string) => p.split(/[/\\]/).pop()?.replace(/\.(md|pdf)$/i, '')?.replace(/_/g, ' ')?.toLowerCase() || '';
    const destStem = getNoteStem(dest);

    const matchingItem = session.curriculum.find((p: string) => getNoteStem(p) === destStem);
    if (!matchingItem) return 'not_in_curriculum';

    const normalize = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase();
    const targetNorm = normalize(matchingItem);
    const completed = new Set((session.completed_notes || []).map(normalize));
    const unlocked = new Set((session.active_note_unlocks || []).map(normalize));
    const current = normalize(session.current_note_path || '');

    if (completed.has(targetNorm)) return 'completed';
    if (targetNorm === current) return 'current';
    if (unlocked.has(targetNorm)) return 'unlocked';
    return 'locked';
};

export const WikiLink = ({ dest, alias, onNavigate, className }: { dest: string, alias: string, onNavigate: (page: string) => void, className?: string }) => {
    // Clean up the alias to remove underscores and paths if it's the same as dest
    const displayAlias = alias.replace(/_/g, ' ').split(/[/\\]/).pop() || alias;
    
    const [status, setStatus] = useState(() => {
        const cachedSession = sidecarApi.getTutorStatusSync?.() || null;
        return getNoteStatus(dest, cachedSession);
    });

    useEffect(() => {
        let active = true;
        const fetchStatus = async () => {
            const activeSessionId = localStorage.getItem('ater_active_session_id');
            if (!activeSessionId) return;

            try {
                const session = await sidecarApi.getTutorStatus?.(activeSessionId);
                if (!session || !active) return;

                const newStatus = getNoteStatus(dest, session);
                if (active) {
                    setStatus(newStatus);
                }
            } catch (err) {
                console.error('Failed to check lock status for WikiLink:', err);
            }
        };
        void fetchStatus();
        return () => { active = false; };
    }, [dest]);

    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isActive = status === 'current';

    const markdownCtx = React.useContext(MarkdownContext);
    const currentNotePath = markdownCtx?.path || '';
    const isHubView = currentNotePath.toLowerCase().includes('hub.md') || 
                      currentNotePath.toLowerCase().includes('_hub');

    return (
        <span className="inline-flex items-center">
            {isHubView && status !== 'not_in_curriculum' && (
                <input 
                    type="checkbox" 
                    checked={isCompleted} 
                    readOnly
                    className={cn(
                        "h-3.5 w-3.5 shrink-0 appearance-none border border-border bg-bento-card rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3.5px] after:h-[7.5px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 transition-all hover:border-foreground/20 mr-2 inline-block align-middle",
                        isCompleted && "opacity-80",
                        isActive && "border-primary/70 bg-primary/10",
                        isLocked && "cursor-not-allowed opacity-20"
                    )} 
                />
            )}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLocked) {
                        toast.error("This lesson is locked. Complete your current lesson first.");
                        return;
                    }
                    onNavigate(dest);
                }}
                className={cn(
                    "text-foreground font-medium inline-block underline decoration-foreground/30 hover:decoration-foreground/80 underline-offset-4 cursor-pointer p-0 h-auto align-baseline bg-transparent border-none",
                    isLocked && "text-muted-foreground/35 cursor-not-allowed opacity-40 line-through decoration-transparent hover:text-muted-foreground/35",
                    isCompleted && !isActive && "text-muted-foreground/50 line-through decoration-transparent hover:text-muted-foreground/50",
                    className
                )}
                title={isLocked ? "This lesson is locked." : (dest !== alias ? dest : undefined)}
            >
                {displayAlias}
            </button>
        </span>
    );
};

export const renderWikiLinks = (text: string, onNavigate: (page: string) => void) => {
    if (typeof text !== 'string') return text;
    
    // Split by WikiLink pattern [[...]]
    const parts = text.split(/(\[\[.*?\]\])/g);
    
    return parts.map((part, i) => {
        const match = part.match(/^\[\[(.*?)\]\]$/);
        if (match) {
            const content = match[1];
            const [dest, ...aliasParts] = content.split('|');
            const alias = aliasParts.length > 0 ? aliasParts.join('|') : dest;
            return <WikiLink key={i} dest={dest} alias={alias} onNavigate={onNavigate} />;
        }
        // Also handle underscores in plain text between links
        return part.replace(/_/g, ' ');
    });
};
