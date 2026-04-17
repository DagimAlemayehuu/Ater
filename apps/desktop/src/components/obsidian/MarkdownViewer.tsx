import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useMemo } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import ObsidianDatabaseView from '@/routes/obsidian-database-view'
import { WikiLink, renderWikiLinks } from './WikiLink'
import mermaid from 'mermaid'
import { Sparkles, Zap, Copy, Check, RefreshCw, X, Quote } from 'lucide-react'
import { AiSidecar } from './AiSidecar'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

const MermaidWrapper = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, chart).then((result) => {
      setSvg(result.svg);
      setError(false);
    }).catch((e) => {
      console.error('Mermaid render error', e);
      setError(true);
    });
  }, [chart]);

  if (error) return <div className="text-red-500 font-mono text-[11px] p-4 bg-red-50 rounded bg-opacity-50">Error rendering Mermaid diagram</div>;
  if (!svg) return <div className="text-gray-400 font-mono text-[11px] p-4 text-center">Rendering diagram...</div>;

  return <div className="my-6 flex justify-center bg-gray-50 p-6 rounded-lg border border-gray-100" dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface MarkdownViewerProps {
    content: string
    onNavigate: (pageName: string) => void
    path?: string
}

const InlineDatabaseResolver = ({ dbName, onNavigate }: { dbName: string, onNavigate: (p: string) => void }) => {
    const [dbSchema, setDbSchema] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        sidecarApi.listVaultDatabases().then(res => {
            const db = res.databases?.find((d: any) => d.id === dbName || d.name === dbName);
            setDbSchema(db || null);
        }).catch(console.error).finally(() => setLoading(false));
    }, [dbName]);

    if (loading) return <div className="p-8 text-center text-[10px] text-gray-500 font-mono tracking-widest uppercase animate-pulse border border-dashed border-gray-200 bg-gray-50 rounded-lg">Syncing Database: {dbName}</div>;
    if (!dbSchema) return <div className="p-8 text-center text-[10px] text-red-500 font-mono tracking-widest uppercase border border-dashed border-red-200 bg-red-50 rounded-lg">Error: Database '{dbName}' Not Found</div>;

    return (
        <div className="my-10 rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[500px] relative not-prose bg-white group/inline-db hover:ring-1 hover:ring-gray-300 transition-all">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/inline-db:opacity-100 transition-opacity">
                <button 
                    onClick={() => onNavigate(`DATABASE:${dbSchema.id}`)}
                    className="p-1 px-3 bg-white border border-gray-200 rounded-md text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:border-black transition-all shadow-sm"
                >
                    Expand to Full Page
                </button>
            </div>
            <ObsidianDatabaseView 
                database={{ id: dbSchema.id, name: dbSchema.name, schema: dbSchema.schema, views: dbSchema.views }} 
                onBack={() => {}} 
                onNavigate={onNavigate} 
                onRefresh={() => {}} 
            />
        </div>
    )
}

export function MarkdownViewer({ content, onNavigate, path }: MarkdownViewerProps) {
    const [selection, setSelection] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [explanationSelection, setExplanationSelection] = useState('');
    const [isQuizMode, setIsQuizMode] = useState(false);

    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

    const markdownComponents = useMemo(() => ({
        // Override text nodes to detect wikilinks
        p: ({ children }: any) => {
            // Detect Synced Database Injections
            if (React.Children.count(children) === 1 && typeof children === 'string') {
                const str = children as string;
                if (str.startsWith('/table ')) {
                    const dbName = str.replace('/table ', '').trim();
                    return <InlineDatabaseResolver dbName={dbName} onNavigate={onNavigate} />;
                }
            }
            
            return (
                <p className="mb-3 leading-relaxed text-[13px] text-gray-800 antialiased">
                    {React.Children.map(children, (child) => 
                        typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child
                    )}
                </p>
            )
        },
        h1: ({ children }: any) => <h1 className="text-2xl font-black mt-10 mb-6 tracking-tighter border-b pb-2 border-gray-100 text-black">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child)}
        </h1>,
        h2: ({ children }: any) => <h2 className="text-xl font-black mt-8 mb-4 tracking-tight text-gray-900">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child)}
        </h2>,
        h3: ({ children }: any) => <h3 className="text-lg font-bold mt-6 mb-3 tracking-tight text-gray-800">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child)}
        </h3>,
        h4: ({ children }: any) => <h4 className="text-[11px] font-black mt-5 mb-2 uppercase tracking-[0.2em] opacity-40">{children}</h4>,
        ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1 mb-4 text-[13px] opacity-80">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1 mb-4 text-[13px] opacity-80">{children}</ol>,
        li: ({ children, ...props }: any) => {
            const content = React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child);
            // Check if it's a task list item
            if (props.className?.includes('task-list-item')) {
                return <li className="flex items-start gap-2 list-none -ml-5 mb-1">{content}</li>;
            }
            return <li className="mb-0.5">{content}</li>;
        },
        input: ({ type, checked }: any) => {
            if (type === 'checkbox') {
                return (
                    <input 
                        type="checkbox" 
                        checked={checked} 
                        readOnly 
                        className="mt-1 size-3.5 rounded border-gray-200 bg-gray-50 accent-black" 
                    />
                );
            }
            return null;
        },
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : null

            if (language === 'mermaid') {
                return <MermaidWrapper chart={String(children).replace(/\n$/, '')} />
            }

            if (!inline && match) {
                return (
                    <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        className="rounded-lg my-6 border border-gray-800 custom-scrollbar text-[12px]"
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                )
            }

            // Inline code block
            return <code className={cn("bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-gray-800 dark:text-gray-200", className)} {...props}>{children}</code>
        },
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-6 rounded-md border border-gray-100">
                <table className="w-full border-collapse text-[12px]">{children}</table>
            </div>
        ),
        thead: ({ children }: any) => <thead className="bg-gray-50 border-b border-gray-100">{children}</thead>,
        th: ({ children }: any) => <th className="px-4 py-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-left">{children}</th>,
        td: ({ children }: any) => <td className="px-4 py-2 border-b border-gray-200/10 opacity-80">{children}</td>,
        blockquote: ({ children, node }: any) => {
            let isCallout = false;
            let calloutType = '';
            
            const firstPara = node?.children?.[0];
            if (firstPara && firstPara.type === 'element' && firstPara.tagName === 'p') {
                const firstTextNode = firstPara.children?.[0];
                if (firstTextNode && firstTextNode.type === 'text') {
                    const match = firstTextNode.value.match(/^\[!(.*?)\]/);
                    if (match) {
                        isCallout = true;
                        calloutType = match[1].toLowerCase();
                    }
                }
            }

            if (isCallout) {
                let bgClass = "bg-gray-50";
                let borderClass = "border-gray-500";
                let textClass = "text-gray-900";
                let Icon = "📝";
                
                if (['note', 'info'].includes(calloutType)) { bgClass = "bg-blue-50"; borderClass = "border-blue-500"; textClass = "text-blue-900"; Icon = "ℹ️"; }
                else if (['warning', 'caution'].includes(calloutType)) { bgClass = "bg-orange-50"; borderClass = "border-orange-500"; textClass = "text-orange-900"; Icon = "⚠️"; }
                else if (['danger', 'error', 'bug'].includes(calloutType)) { bgClass = "bg-red-50"; borderClass = "border-red-500"; textClass = "text-red-900"; Icon = "🚨"; }
                else if (['success', 'check', 'done'].includes(calloutType)) { bgClass = "bg-green-50"; borderClass = "border-green-500"; textClass = "text-green-900"; Icon = "✅"; }
                else if (['question', 'help', 'faq'].includes(calloutType)) { bgClass = "bg-yellow-50"; borderClass = "border-yellow-500"; textClass = "text-yellow-900"; Icon = "❓"; }

                const processedChildren = React.Children.map(children, (child: any, index) => {
                    if (index === 0 && child?.type === 'p') {
                        const pChildren = React.Children.toArray(child.props.children);
                        let title = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
                        
                        const newPChildren = pChildren.map((pChild: any, i) => {
                            if (i === 0 && typeof pChild === 'string') {
                                const match = pChild.match(/^\[!(.*?)\](.*)/);
                                if (match) {
                                    if (match[2].trim()) title = match[2].trim();
                                    return null;
                                }
                            }
                            return pChild;
                        });
                        
                        return (
                            <div className="flex flex-col gap-2">
                                <div className={`flex items-center gap-2 font-bold ${textClass}`}>
                                    <span>{Icon}</span>
                                    <span>{title}</span>
                                </div>
                                <div className="text-[13px] opacity-80 leading-relaxed font-normal">
                                    {newPChildren}
                                </div>
                            </div>
                        )
                    }
                    return child;
                });

                return (
                    <div className={`my-6 rounded-md border border-l-4 p-4 ${bgClass} ${borderClass} not-prose`}>
                        {processedChildren}
                    </div>
                );
            }

            return (
                <blockquote className="border-l-4 border-gray-200 pl-4 italic my-6 opacity-60 text-[13px] bg-gray-50 py-2">
                    {children}
                </blockquote>
            );
        },
        hr: () => <hr className="my-10 border-t border-gray-200/10" />,
        a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-[#111827] underline hover:text-gray-800 transition-colors font-medium">
                {children}
            </a>
        )
    }), [onNavigate]);

    const handleMouseUp = (e?: React.MouseEvent | React.KeyboardEvent) => {
        // Don't trigger if clicking inside buttons/popover (handled by propagation stop, but safe to check)
        if (e && (e.target as HTMLElement).closest('.stop-selection-clear')) return;

        const sel = window.getSelection();
        const text = sel?.toString().trim();
        
        if (text && text.length > 0) {
            const range = sel?.getRangeAt(0);
            if (range) {
                const rect = range.getBoundingClientRect();
                setPopoverPosition({
                    top: rect.top - 40,
                    left: rect.left + rect.width / 2
                });
            }
            setSelection(text);
            setShowPopover(true);
        } else {
            // Delay hiding slightly to allow click events on the popover to register first
            setTimeout(() => {
                const currentSel = window.getSelection()?.toString().trim();
                if (!currentSel) {
                    setShowPopover(false);
                }
            }, 50);
        }
    };

    const handleExplain = async () => {
        if (!selection) return;
        setExplanationSelection(selection);
        setIsQuizMode(false);
        setShowPopover(false);
        setShowSidebar(true);
    };

    const handleQuickQuestions = async () => {
        if (!selection) return;
        setExplanationSelection(selection);
        setIsQuizMode(true);
        setShowPopover(false);
        setShowSidebar(true);
    };

    // handleCopy removed as it's now internal to AiSidecar if needed, or we can add it back later.

    return (
        <div 
            className="relative h-full flex flex-row select-text"
            onMouseUp={handleMouseUp}
            onKeyUp={handleMouseUp}
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative">
                {/* Floating Popover */}
                {showPopover && selection && (
                    <div 
                        className="fixed z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 rounded-full h-10 flex items-center px-2 shadow-2xl animate-in fade-in zoom-in duration-200 stop-selection-clear"
                        style={{ 
                            left: `${popoverPosition.left}px`,
                            top: `${popoverPosition.top}px`,
                            transform: 'translateX(-50%)'
                        }}
                        onMouseUp={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleExplain} 
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-gray-50 rounded-full transition-all active:scale-95 group text-gray-800"
                        >
                            <Sparkles size={11} className="group-hover:scale-110 transition-transform text-indigo-500" />
                            <span>Explain</span>
                        </button>
                        <div className="w-px h-5 bg-gray-100 mx-1" />
                        <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleQuickQuestions} 
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-gray-50 rounded-full transition-all active:scale-95 group text-gray-800"
                        >
                            <Zap size={11} className="group-hover:scale-110 transition-transform text-amber-500" />
                            <span>Questions</span>
                        </button>
                        <div className="w-px h-5 bg-gray-100 mx-1" />
                        <button onClick={() => { navigator.clipboard.writeText(selection); setShowPopover(false); }} title="Copy Selection" className="p-2 hover:bg-gray-50 rounded-full transition-colors group">
                            <Copy size={12} className="text-gray-400 group-hover:text-black" />
                        </button>
                    </div>
                )}

                <div className="prose prose-sm prose-zinc max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 text-foreground">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
            </div>
            </div>

            {/* AI Sidecar (Matches PdfViewer) */}
            {showSidebar && (
                <AiSidecar 
                    selection={explanationSelection || selection}
                    path={path || ""}
                    onClose={() => setShowSidebar(false)}
                    initialMode={isQuizMode ? 'quiz' : 'explain'}
                />
            )}
        </div>
    )
}
