import React from 'react';

export const WikiLink = ({ dest, alias, onNavigate }: { dest: string, alias: string, onNavigate: (page: string) => void }) => (
    <button
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNavigate(dest);
        }}
        className="text-[#111827] underline decoration-gray-300 hover:decoration-gray-800 font-medium transition-all inline-block px-0.5 mx-0.5 rounded hover:bg-gray-50 bg-transparent border-none cursor-pointer p-0 h-auto align-baseline"
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
