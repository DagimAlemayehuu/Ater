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
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

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

  if (error) return <div className="text-destructive font-mono text-[11px] p-4 bg-destructive/10 rounded">Error rendering Mermaid diagram</div>;
  if (!svg) return <div className="text-muted-foreground font-mono text-[11px] p-4 text-center">Rendering diagram...</div>;

  return <div className="my-6 flex justify-center bg-muted/30 p-6 rounded-lg border border-border" dangerouslySetInnerHTML={{ __html: svg }} />;
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

    if (loading) return <div className="p-8 text-center text-[10px] text-muted-foreground font-mono tracking-widest uppercase animate-pulse border border-dashed border-border bg-muted/20 rounded-lg">Syncing Database: {dbName}</div>;
    if (!dbSchema) return <div className="p-8 text-center text-[10px] text-destructive font-mono tracking-widest uppercase border border-dashed border-destructive/20 bg-destructive/5 rounded-lg">Error: Database '{dbName}' Not Found</div>;

    return (
        <div className="my-10 rounded-xl border border-border shadow-sm overflow-hidden h-[500px] relative not-prose bg-background group/inline-db hover:ring-1 hover:ring-primary/20 transition-all">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/inline-db:opacity-100 transition-opacity">
                <button 
                    onClick={() => onNavigate(`DATABASE:${dbSchema.id}`)}
                    className="p-1 px-3 bg-background border border-border rounded-md text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary transition-all shadow-sm"
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
        p: ({ children }: any) => {
            const childrenArray = React.Children.toArray(children);
            const textContent = childrenArray.map(c => typeof c === 'string' ? c : '').join(' ');
            
            // Detect and fix horizontal connection lists
            if (textContent.includes('- [ ]') || textContent.includes('- [x]')) {
                const parts = textContent.split(/(?=- \[[ xX]\])/).filter(p => p.trim().length > 0);
                if (parts.length > 1) {
                    return (
                        <div className="flex flex-col gap-1.5 my-4 pl-0 border-l-2 border-border/10 ml-1">
                            {parts.map((part, i) => (
                                <div key={i} className="flex items-start gap-2 text-[13px] text-foreground font-medium group/task">
                                    {renderWikiLinks(part.replace(/_/g, ' '), onNavigate, true)}
                                </div>
                            ))}
                        </div>
                    );
                }
            }

            if (React.Children.count(children) === 1 && typeof children === 'string') {
                const str = children as string;
                if (str.startsWith('/table ')) {
                    const dbName = str.replace('/table ', '').trim();
                    return <InlineDatabaseResolver dbName={dbName} onNavigate={onNavigate} />;
                }
            }
            return (
                <p className="mb-3 leading-relaxed text-[13px] text-foreground/90 antialiased">
                    {React.Children.map(children, (child) => 
                        typeof child === 'string' ? renderWikiLinks(child.replace(/_/g, ' '), onNavigate) : child
                    )}
                </p>
            )
        },
        h1: ({ children }: any) => <h1 className="text-2xl font-black mt-10 mb-6 tracking-tighter border-b pb-2 border-border text-foreground">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child.replace(/_/g, ' '), onNavigate) : child)}
        </h1>,
        h2: ({ children }: any) => <h2 className="text-xl font-black mt-8 mb-4 tracking-tight text-foreground">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child.replace(/_/g, ' '), onNavigate) : child)}
        </h2>,
        h3: ({ children }: any) => <h3 className="text-lg font-bold mt-6 mb-3 tracking-tight text-foreground/90">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child.replace(/_/g, ' '), onNavigate) : child)}
        </h3>,
        h4: ({ children }: any) => <h4 className="text-[11px] font-black mt-5 mb-2 uppercase tracking-[0.2em] text-muted-foreground/60">{children}</h4>,
        ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1 mb-4 text-[13px] text-foreground">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1 mb-4 text-[13px] text-foreground">{children}</ol>,
        li: ({ children, ...props }: any) => {
            const content = React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigate) : child);
            if (props.className?.includes('task-list-item')) {
                return <li className="flex items-start gap-2 list-none -ml-5 mb-1 text-foreground/80">{content}</li>;
            }
            return <li className="mb-0.5 text-foreground/80">{content}</li>;
        },
        input: ({ node, type, checked, ...props }: any) => {
            if (type === 'checkbox') {
                return (
                    <input 
                        type="checkbox" 
                        defaultChecked={checked} 
                        onChange={async (e) => {
                            if (!path) return;
                            const newChecked = e.target.checked;
                            const line = node?.position?.start?.line;
                            if (line) {
                                try {
                                    const res = await sidecarApi.readObsidianNote(path);
                                    const lines = res.content.split('\n');
                                    // remark positions are 1-indexed, but frontmatter might shift it depending on how the parser handles it.
                                    // Usually remark parses the whole file including frontmatter if it's not stripped.
                                    const targetLine = lines[line - 1];
                                    if (targetLine && targetLine.match(/\[[ xX]\]/)) {
                                        lines[line - 1] = targetLine.replace(/\[[ xX]\]/, `[${newChecked ? 'x' : ' '}]`);
                                        const updatedContent = lines.join('\n');
                                        await sidecarApi.updateObsidianNote(path, updatedContent);
                                        
                                        // Update atomic note if it's a wikilink connection
                                        const wikilinkMatch = targetLine.match(/\[\[(.*?)\]\]/);
                                        if (wikilinkMatch) {
                                            const targetNote = wikilinkMatch[1].split('|')[0];
                                            const targetRes = await sidecarApi.findVaultPage(targetNote);
                                            if (targetRes.path) {
                                                const atomicRes = await sidecarApi.readObsidianNote(targetRes.path);
                                                let newAtomicContent = atomicRes.content;
                                                if (newAtomicContent.includes('read: ')) {
                                                    newAtomicContent = newAtomicContent.replace(/read:\s*(true|false|True|False)/i, `read: ${newChecked}`);
                                                } else if (newAtomicContent.startsWith('---\n')) {
                                                    newAtomicContent = newAtomicContent.replace('---\n', `---\nread: ${newChecked}\n`);
                                                }
                                                await sidecarApi.updateObsidianNote(targetRes.path, newAtomicContent);
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error("Failed to toggle markdown checkbox", err);
                                }
                            }
                        }}
                        className="mt-1 size-3.5 appearance-none border border-border/50 bg-transparent rounded-sm checked:bg-primary/20 checked:border-primary relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[3px] after:top-[0px] after:w-[4px] after:h-[7px] after:border-r-2 after:border-b-2 after:border-primary after:rotate-45 cursor-pointer transition-colors" 
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
                const isDark = document.documentElement.classList.contains('dark');
                return (
                    <SyntaxHighlighter
                        {...props}
                        style={isDark ? vscDarkPlus : vs}
                        language={language}
                        PreTag="div"
                        customStyle={{
                            background: 'transparent',
                            padding: '1rem 0',
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: '1.6'
                        }}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                )
            }
            return <code className={cn("bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground border border-border/50", className)} {...props}>{children}</code>
        },
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-6 rounded-md border border-border">
                <table className="w-full border-collapse text-[12px]">{children}</table>
            </div>
        ),
        thead: ({ children }: any) => <thead className="bg-muted/50 border-b border-border">{children}</thead>,
        th: ({ children }: any) => <th className="px-4 py-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-left">{children}</th>,
        td: ({ children }: any) => <td className="px-4 py-2 border-b border-border/10 text-foreground/80">{children}</td>,
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
                let colorClass = "primary";
                let Icon = "📝";
                if (['note', 'info'].includes(calloutType)) { colorClass = "blue"; Icon = "ℹ️"; }
                else if (['warning', 'caution'].includes(calloutType)) { colorClass = "orange"; Icon = "⚠️"; }
                else if (['danger', 'error', 'bug'].includes(calloutType)) { colorClass = "red"; Icon = "🚨"; }
                else if (['success', 'check', 'done'].includes(calloutType)) { colorClass = "green"; Icon = "✅"; }
                else if (['question', 'help', 'faq'].includes(calloutType)) { colorClass = "yellow"; Icon = "❓"; }

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
                                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px] text-foreground">
                                    <span>{Icon}</span>
                                    <span>{title}</span>
                                </div>
                                <div className="text-[13px] text-foreground/80 leading-relaxed font-normal">
                                    {newPChildren}
                                </div>
                            </div>
                        )
                    }
                    return child;
                });

                return (
                    <div className={cn(
                        "my-6 rounded-lg border-l-4 p-4 not-prose bg-muted/20 border-border",
                        calloutType === 'note' && "border-blue-500 bg-blue-500/5",
                        calloutType === 'warning' && "border-orange-500 bg-orange-500/5",
                        calloutType === 'danger' && "border-red-500 bg-red-500/5",
                        calloutType === 'success' && "border-green-500 bg-green-500/5",
                        calloutType === 'question' && "border-yellow-500 bg-yellow-500/5"
                    )}>
                        {processedChildren}
                    </div>
                );
            }

            return (
                <blockquote className="border-l-4 border-primary/20 pl-4 italic my-6 text-muted-foreground text-[13px] bg-muted/10 py-3 rounded-r-lg">
                    {children}
                </blockquote>
            );
        },
        hr: () => <hr className="my-10 border-t border-border" />,
        a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors font-medium">
                {children}
            </a>
        )
    }), [onNavigate]);

    const handleMouseUp = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e && (e.target as HTMLElement).closest('.stop-selection-clear')) return;
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 0) {
            const range = sel?.getRangeAt(0);
            if (range) {
                const rect = range.getBoundingClientRect();
                setPopoverPosition({ top: rect.top - 40, left: rect.left + rect.width / 2 });
            }
            setSelection(text); setShowPopover(true);
        } else {
            setTimeout(() => {
                if (!window.getSelection()?.toString().trim()) setShowPopover(false);
            }, 50);
        }
    };

    const handleExplain = async () => {
        if (!selection) return;
        setExplanationSelection(selection); setIsQuizMode(false); setShowPopover(false); setShowSidebar(true);
    };

    const handleQuickQuestions = async () => {
        if (!selection) return;
        setExplanationSelection(selection); setIsQuizMode(true); setShowPopover(false); setShowSidebar(true);
    };

    return (
        <div className="relative h-full flex flex-row select-text bg-background text-foreground" onMouseUp={handleMouseUp} onKeyUp={handleMouseUp}>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative">
                {showPopover && selection && (
                    <div 
                        className="fixed z-[9999] bg-popover/95 backdrop-blur-md border border-border rounded-full h-10 flex items-center px-2 shadow-2xl animate-in fade-in zoom-in duration-200 stop-selection-clear"
                        style={{ left: `${popoverPosition.left}px`, top: `${popoverPosition.top}px`, transform: 'translateX(-50%)' }}
                        onMouseUp={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button onMouseDown={(e) => e.preventDefault()} onClick={handleExplain} className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-accent rounded-full transition-all active:scale-95 group text-foreground">
                            <Sparkles size={11} className="group-hover:scale-110 transition-transform text-indigo-500" />
                            <span>Explain</span>
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button onMouseDown={(e) => e.preventDefault()} onClick={handleQuickQuestions} className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-accent rounded-full transition-all active:scale-95 group text-foreground">
                            <Zap size={11} className="group-hover:scale-110 transition-transform text-amber-500" />
                            <span>Questions</span>
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button onClick={() => { navigator.clipboard.writeText(selection); setShowPopover(false); }} title="Copy Selection" className="p-2 hover:bg-accent rounded-full transition-colors group text-muted-foreground hover:text-foreground">
                            <Copy size={12} />
                        </button>
                    </div>
                )}
                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>{content}</ReactMarkdown>
                </div>
            </div>
            {showSidebar && <AiSidecar selection={explanationSelection || selection} path={path || ""} onClose={() => setShowSidebar(false)} initialMode={isQuizMode ? 'quiz' : 'explain'} />}
        </div>
    )
}
