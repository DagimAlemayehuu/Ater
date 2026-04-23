import React from 'react';
import { cn } from '@/lib/utils';

export const WikiLink = ({ dest, alias, onNavigate, className }: { dest: string, alias: string, onNavigate: (page: string) => void, className?: string }) => {
    // Clean up the alias to remove underscores and paths if it's the same as dest
    const displayAlias = alias.replace(/_/g, ' ').split('/').pop() || alias;

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate(dest);
            }}
            className={cn(
                "text-foreground/90 font-medium transition-all inline-block hover:text-primary underline decoration-border hover:decoration-primary/50 underline-offset-4 cursor-pointer p-0 h-auto align-baseline bg-transparent border-none",
                className
            )}
            title={dest !== alias ? dest : undefined}
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
