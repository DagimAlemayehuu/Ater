import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import React from 'react'

interface MarkdownViewerProps {
    content: string
    onNavigate: (pageName: string) => void
}

export function MarkdownViewer({ content, onNavigate }: MarkdownViewerProps) {
    
    // Simple custom component to handle wikilinks in text strings
    const renderWikiLinks = (text: string) => {
        if (typeof text !== 'string') return text;
        const parts = text.split(/(\[\[.*?\]\])/g);
        return parts.map((part, i) => {
            const match = part.match(/^\[\[(.*?)\]\]$/);
            if (match) {
                const pageName = match[1];
                return (
                    <button
                        key={i}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onNavigate(pageName);
                        }}
                        className="text-primary hover:underline font-bold transition-all inline-block"
                    >
                        {pageName}
                    </button>
                );
            }
            return part;
        });
    };

    return (
        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Override text nodes to detect wikilinks
                    p: ({ children }) => (
                        <p className="mb-3 leading-relaxed text-[13px] opacity-80 antialiased">
                            {React.Children.map(children, (child) => 
                                typeof child === 'string' ? renderWikiLinks(child) : child
                            )}
                        </p>
                    ),
                    h1: ({ children }) => <h1 className="text-2xl font-black mt-10 mb-6 tracking-tighter border-b pb-2 border-border/20 text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-black mt-8 mb-4 tracking-tight opacity-90 text-foreground/90">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3 tracking-tight opacity-80">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-[11px] font-black mt-5 mb-2 uppercase tracking-[0.2em] opacity-40">{children}</h4>,
                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-4 text-[13px] opacity-80">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-4 text-[13px] opacity-80">{children}</ol>,
                    li: ({ children, ...props }: any) => {
                        // Check if it's a task list item
                        if (props.className?.includes('task-list-item')) {
                            return <li className="flex items-start gap-2 list-none -ml-5 mb-1">{children}</li>;
                        }
                        return <li className="mb-0.5">{children}</li>;
                    },
                    input: ({ type, checked }) => {
                        if (type === 'checkbox') {
                            return (
                                <input 
                                    type="checkbox" 
                                    checked={checked} 
                                    readOnly 
                                    className="mt-1 size-3.5 rounded border-border bg-secondary/20 accent-primary" 
                                />
                            );
                        }
                        return null;
                    },
                    code: ({ inline, children, className }: any) => {
                        if (inline) {
                            return <code className="bg-secondary/40 px-1.5 py-0.5 rounded text-[11px] font-mono text-primary/80">{children}</code>
                        }
                        return (
                            <pre className="bg-secondary/20 p-4 rounded-lg overflow-x-auto my-6 border border-border/20 custom-scrollbar">
                                <code className="text-[12px] font-mono leading-relaxed">{children}</code>
                            </pre>
                        )
                    },
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-md border border-border/20">
                            <table className="w-full border-collapse text-[12px]">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-secondary/20 border-b border-border/20">{children}</thead>,
                    th: ({ children }) => <th className="px-4 py-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-left">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-2 border-b border-border/10 opacity-80">{children}</td>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/20 pl-4 italic my-6 opacity-60 text-[13px] bg-secondary/5 py-1">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="my-10 border-t border-border/10" />,
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80 transition-colors font-medium">
                            {children}
                        </a>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
