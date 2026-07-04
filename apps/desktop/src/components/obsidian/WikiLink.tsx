import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { sidecarApi } from '@/lib/sidecarApi';
import { toast } from 'sonner';

export const WikiLink = ({ dest, alias, onNavigate, className }: { dest: string, alias: string, onNavigate: (page: string) => void, className?: string }) => {
    // Clean up the alias to remove underscores and paths if it's the same as dest
    const displayAlias = alias.replace(/_/g, ' ').split(/[/\\]/).pop() || alias;
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        let active = true;
        const checkLock = async () => {
            const activeSessionId = localStorage.getItem('ater_active_session_id');
            if (!activeSessionId) {
                if (active) setIsLocked(false);
                return;
            }

            try {
                const session = await sidecarApi.getTutorStatus(activeSessionId);
                if (!session || !session.curriculum || !active) return;

                const getNoteStem = (p: string) => p.split(/[/\\]/).pop()?.replace(/\.(md|pdf)$/i, '')?.replace(/_/g, ' ')?.toLowerCase() || '';
                const destStem = getNoteStem(dest);

                const matchingItem = session.curriculum.find((p: string) => getNoteStem(p) === destStem);
                if (!matchingItem) {
                    if (active) setIsLocked(false);
                    return; // Not a curriculum lesson
                }

                const normalize = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase();
                const targetNorm = normalize(matchingItem);
                const completed = new Set((session.completed_notes || []).map(normalize));
                const unlocked = new Set((session.active_note_unlocks || []).map(normalize));
                const current = normalize(session.current_note_path || '');

                const unlockedState = completed.has(targetNorm) || unlocked.has(targetNorm) || targetNorm === current;
                if (active) {
                    setIsLocked(!unlockedState);
                }
            } catch (err) {
                console.error('Failed to check lock for WikiLink:', err);
            }
        };
        void checkLock();
        return () => { active = false; };
    }, [dest]);

    return (
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
                className
            )}
            title={isLocked ? "This lesson is locked." : (dest !== alias ? dest : undefined)}
        >
            {displayAlias}
        </button>
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
