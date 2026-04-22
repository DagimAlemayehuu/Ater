import React from 'react';

export const WikiLink = ({ dest, alias, onNavigate }: { dest: string, alias: string, onNavigate: (page: string) => void }) => (
    <button
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNavigate(dest);
        }}
        className="text-primary underline decoration-border/50 hover:decoration-primary font-bold transition-all inline-block px-0.5 rounded hover:bg-muted bg-transparent border-none cursor-pointer p-0 h-auto align-baseline text-xs"
        title={dest !== alias ? dest : undefined}
    >
        {alias}
    </button>
);

export const renderWikiLinks = (text: string, onNavigate: (page: string) => void) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
        const match = part.match(/^\[\[(.*?)\]\]$/);
        if (match) {
            const content = match[1];
            const [dest, ...aliasParts] = content.split('|');
            const alias = aliasParts.length > 0 ? aliasParts.join('|') : dest;
            return <WikiLink key={i} dest={dest} alias={alias} onNavigate={onNavigate} />;
        }
        return part;
    });
};
