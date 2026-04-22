import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useMemo } from 'react'
import { WikiLink, renderWikiLinks } from './WikiLink'
import { Sparkles, Copy, Check, RefreshCw, X, Quote, Table, ChevronRight, Info } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { AiSidecar } from './AiSidecar'
import mermaid from 'mermaid'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
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

  if (error) return <div className="text-destructive font-mono text-[10px] p-4 bg-destructive/10 rounded-xl my-4">Error rendering Mermaid diagram</div>;
  if (!svg) return <div className="text-muted-foreground font-mono text-[10px] p-4 text-center my-4">Rendering diagram...</div>;

  return <div className="my-8 flex justify-center bg-muted/20 p-6 rounded-2xl border border-border/50 overflow-hidden" dangerouslySetInnerHTML={{ __html: svg }} />;
}

const InlineDatabaseResolver = ({ dbName, onNavigate }: { dbName: string, onNavigate: (p: string) => void }) => {
    const [dbSchema, setDbSchema] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await sidecarApi.listVaultDatabases();
                const db = res.databases?.find((d: any) => d.id === dbName || d.name === dbName);
                if (db) {
                    setDbSchema(db);
                    const unitsRes = await sidecarApi.listDatabaseUnits(db.id);
                    setUnits(unitsRes.results || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dbName]);

    if (loading) return <div className="p-8 text-center text-[9px] text-muted-foreground font-black tracking-[0.2em] uppercase animate-pulse border border-dashed border-border bg-muted/10 rounded-2xl my-6">Syncing_Database: {dbName}</div>;
    if (!dbSchema) return <div className="p-8 text-center text-[9px] text-destructive font-black tracking-[0.2em] uppercase border border-dashed border-destructive/20 bg-destructive/5 rounded-2xl my-6">Error: Database_Not_Found</div>;

    return (
        <div className="my-8 rounded-2xl border border-border/40 bg-muted/5 overflow-hidden flex flex-col transition-all active:scale-[0.99]">
            <div className="p-5 border-b border-border/20 flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Table size={14} className="text-primary" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{dbSchema.name}</span>
                </div>
                <button 
                    onClick={() => window.location.href = `#/databases/${dbSchema.id}`}
                    className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                >
                    <ChevronRight size={16} className="text-muted-foreground" />
                </button>
            </div>
            <div className="p-2 flex flex-col gap-1">
                {units.slice(0, 5).map((unit, idx) => (
                    <button 
                        key={idx}
                        onClick={() => onNavigate(unit.path)}
                        className="p-4 rounded-xl hover:bg-muted/30 flex items-center justify-between group transition-all"
                    >
                        <span className="text-[12px] font-bold text-foreground/80 truncate">{unit.title}</span>
                        <ChevronRight size={12} className="text-muted-foreground/20 group-hover:text-primary transition-colors" />
                    </button>
                ))}
                {units.length > 5 && (
                    <button 
                        onClick={() => window.location.href = `#/databases/${dbSchema.id}`}
                        className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                    >
                        View all {units.length} items
                    </button>
                )}
            </div>
        </div>
    )
}

interface MarkdownViewerProps {
    content: string
    onNavigate: (pageName: string) => void
    path?: string
}

export function MarkdownViewer({ content, onNavigate, path }: MarkdownViewerProps) {
    const [selection, setSelection] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [explanationSelection, setExplanationSelection] = useState('');
    const [isQuizMode, setIsQuizMode] = useState(false);

    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

    const markdownComponents = useMemo(() => ({
        p: ({ children }: any) => {
            if (React.Children.count(children) === 1) {
                const child = React.Children.toArray(children)[0];
                if (typeof child === 'string' && child.startsWith('/table ')) {
                    const dbName = child.replace('/table ', '').trim();
                    return <InlineDatabaseResolver dbName={dbName} onNavigate={onNavigate} />;
                }
            }
            return (
                <p className="mb-4 leading-relaxed text-[15px] text-foreground/90 antialiased">
                    {React.Children.map(children, (child) => 
                        typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child
                    )}
                </p>
            )
        },
        h1: ({ children }: any) => <h1 className="text-3xl font-black mt-12 mb-6 tracking-tighter border-b pb-3 border-border text-foreground">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child)}
        </h1>,
        h2: ({ children }: any) => <h2 className="text-2xl font-black mt-10 mb-5 tracking-tight text-foreground">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child)}
        </h2>,
        h3: ({ children }: any) => <h3 className="text-xl font-bold mt-8 mb-4 tracking-tight text-foreground/90">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child)}
        </h3>,
        h4: ({ children }: any) => <h4 className="text-[12px] font-black mt-6 mb-3 uppercase tracking-[0.25em] text-muted-foreground">{children}</h4>,
        ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-3 mb-6 text-[15px] text-foreground/80">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-3 mb-6 text-[15px] text-foreground/80">{children}</ol>,
        li: ({ children, ...props }: any) => {
            const content = React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child);
            if (props.className?.includes('task-list-item')) {
                return <li className="flex items-start gap-3 list-none -ml-5 mb-2 text-foreground/80">{content}</li>;
            }
            return <li className="mb-1 text-foreground/80">{content}</li>;
        },
        input: ({ type, checked }: any) => {
            if (type === 'checkbox') {
                return (
                    <input 
                        type="checkbox" 
                        checked={checked} 
                        readOnly 
                        className="mt-1 size-4 rounded border-border bg-muted accent-primary" 
                    />
                );
            }
            return null;
        },
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : null
            if (language === 'mermaid') return <MermaidWrapper chart={String(children).replace(/\n$/, '')} />
            if (!inline && match) {
                return (
                    <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        className="rounded-xl my-8 border border-border overflow-hidden text-[13px]"
                        customStyle={{ margin: 0, padding: '1.5rem' }}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                )
            }
            return <code className={cn("bg-muted px-2 py-0.5 rounded text-[13px] font-mono text-primary border border-border/50", className)} {...props}>{children}</code>
        },
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-8 rounded-xl border border-border bg-muted/5">
                <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
        ),
        thead: ({ children }: any) => <thead className="bg-muted/50 border-b border-border">{children}</thead>,
        th: ({ children }: any) => <th className="px-5 py-3 font-black uppercase tracking-widest text-[11px] text-muted-foreground text-left">{children}</th>,
        td: ({ children }: any) => <td className="px-5 py-4 border-b border-border/10 text-foreground/80">{children}</td>,
        blockquote: ({ children }: any) => {
            const firstChild = React.Children.toArray(children)[0];
            let calloutType = '';
            let calloutTitle = '';
            let content = children;

            if (firstChild && (firstChild as any).props && (firstChild as any).props.children) {
                const text = String((firstChild as any).props.children[0] || '');
                const match = text.match(/^\[!(.*?)\]\s*(.*)/);
                if (match) {
                    calloutType = match[1].toLowerCase();
                    calloutTitle = match[2] || calloutType.toUpperCase();
                    // Remove the [!type] prefix from the first child
                    const remainingChildren = React.Children.toArray(children).slice(1);
                    content = (
                        <>
                            <div className="font-black uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                                <Info size={12} /> {calloutTitle}
                            </div>
                            {remainingChildren}
                        </>
                    );
                }
            }

            const calloutStyles: Record<string, string> = {
                info: 'border-blue-500 bg-blue-500/5 text-blue-900 dark:text-blue-200',
                note: 'border-blue-500 bg-blue-500/5 text-blue-900 dark:text-blue-200',
                tip: 'border-emerald-500 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200',
                hint: 'border-emerald-500 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200',
                important: 'border-purple-500 bg-purple-500/5 text-purple-900 dark:text-purple-200',
                warning: 'border-amber-500 bg-amber-500/5 text-amber-900 dark:text-amber-200',
                caution: 'border-red-500 bg-red-500/5 text-red-900 dark:text-red-200',
                error: 'border-red-500 bg-red-500/5 text-red-900 dark:text-red-200',
                danger: 'border-red-500 bg-red-500/5 text-red-900 dark:text-red-200',
                question: 'border-indigo-500 bg-indigo-500/5 text-indigo-900 dark:text-indigo-200',
                quote: 'border-primary bg-muted/10 text-muted-foreground'
            };

            const style = calloutStyles[calloutType] || calloutStyles['quote'];

            return (
                <blockquote className={cn("border-l-4 pl-6 italic my-8 py-5 rounded-r-2xl shadow-sm", style)}>
                    {content}
                </blockquote>
            );
        },
        hr: () => <hr className="my-12 border-t border-border" />,
        a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary font-bold transition-all">
                {children}
            </a>
        ),
        img: ({ src, alt }: any) => {
            const [dataUrl, setDataUrl] = useState<string | null>(null);
            
            useEffect(() => {
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    const fetchImg = async () => {
                        try {
                            const res = await (sidecarApi as any).readBinaryFile(src);
                            setDataUrl(`data:${res.mime};base64,${res.data}`);
                        } catch (e) { console.error("Img fail", e); }
                    };
                    fetchImg();
                }
            }, [src]);

            return (
                <div className="my-8 rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                    <img src={dataUrl || src} alt={alt} className="w-full h-auto object-cover animate-in fade-in duration-700" />
                    {alt && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-4 bg-muted/20 border-t border-border/10 text-center">{alt}</p>}
                </div>
            )
        }
    }), [onNavigate]);

    const handleMouseUp = (e?: React.MouseEvent | React.KeyboardEvent) => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 0) {
            const range = sel?.getRangeAt(0);
            if (range) {
                const rect = range.getBoundingClientRect();
                setPopoverPosition({ top: rect.top - 50, left: rect.left + rect.width / 2 });
            }
            setSelection(text); setShowPopover(true);
        } else {
            setTimeout(() => {
                if (!window.getSelection()?.toString().trim()) setShowPopover(false);
            }, 50);
        }
    };

    return (
        <div className="relative h-full flex flex-col select-text bg-background" onMouseUp={handleMouseUp} onKeyUp={handleMouseUp}>
            <div className="flex-1 overflow-y-auto px-6 pt-2 pb-40 relative touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                {showPopover && selection && (
                    <div 
                        className="fixed z-[100] bg-primary text-primary-foreground border border-primary rounded-full h-11 flex items-center px-4 shadow-2xl animate-in fade-in zoom-in duration-200"
                        style={{ left: `${popoverPosition.left}px`, top: `${popoverPosition.top}px`, transform: 'translateX(-50%)' }}
                    >
                        <button onClick={() => { setExplanationSelection(selection); setIsQuizMode(false); setShowPopover(false); setShowSidebar(true); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary-foreground/10 rounded-full">
                            <Sparkles size={14} />
                            <span>Explain</span>
                        </button>
                    </div>
                )}
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>{content}</ReactMarkdown>
                </div>
            </div>
            {showSidebar && <AiSidecar selection={explanationSelection} path={path || ""} onClose={() => setShowSidebar(false)} initialMode={isQuizMode ? 'quiz' : 'explain'} />}
        </div>
    )
}

