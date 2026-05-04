import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useMemo, useRef, memo } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { WikiLink, renderWikiLinks } from './WikiLink'
import mermaid from 'mermaid'
import { Sparkles, Zap, Copy, Check, RefreshCw, X, Quote } from 'lucide-react'
import { AiSidecar } from './AiSidecar'
import MiniPracticeUI from '../MiniPracticeUI'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  themeVariables: {
    primaryColor: '#27272a', // zinc-800
    primaryTextColor: '#fafafa', // zinc-50
    primaryBorderColor: '#3f3f46', // zinc-700
    lineColor: '#52525b', // zinc-600
    secondaryColor: '#18181b', // zinc-950
    tertiaryColor: '#27272a'
  }
});

export const MermaidWrapper = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const neutralThemeVars = {
      primaryColor: isDark ? '#27272a' : '#f4f4f5',
      primaryTextColor: isDark ? '#fafafa' : '#18181b',
      primaryBorderColor: isDark ? '#3f3f46' : '#e4e4e7',
      lineColor: isDark ? '#52525b' : '#a1a1aa',
      secondaryColor: isDark ? '#18181b' : '#fafafa',
      tertiaryColor: isDark ? '#27272a' : '#f4f4f5',
      fontFamily: 'Inter, sans-serif'
    };
    
    mermaid.initialize({ 
      theme: isDark ? 'dark' : 'default',
      themeVariables: neutralThemeVars
    });
    
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
    components?: any
}



const CodeBlock = ({ language, value }: { language: string | null, value: string }) => {
    const [copied, setCopied] = useState(false);
    const isDark = document.documentElement.classList.contains('dark');

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-8 rounded-xl border border-border/20 overflow-hidden bg-transparent transition-all hover:border-border/40">
            {/* Header / Top Bar - Minimalist and blended */}
            <div className={cn(
                "flex items-center justify-between px-5 py-1.5 border-b border-border/5 bg-muted/5 transition-opacity",
                !language && "opacity-0 group-hover:opacity-100"
            )}>
                <div className="flex items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 select-none">
                        {language || 'code'}
                    </span>
                </div>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-muted/20 rounded-md transition-all text-muted-foreground/50 hover:text-foreground group/copy"
                    title="Copy Code"
                >
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover/copy:opacity-100 transition-opacity">
                        {copied ? 'Copied' : 'Copy'}
                    </span>
                    {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} className="group-hover/copy:scale-110 transition-transform" />}
                </button>
            </div>
            
            <div className="relative overflow-hidden">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={isDark ? vscDarkPlus : vs}
                    PreTag="div"
                    customStyle={{
                        background: 'transparent',
                        padding: language ? '1.25rem 1.5rem' : '1.5rem',
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '1.7',
                        fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace',
                        overflowX: 'auto',
                        WebkitFontSmoothing: 'antialiased'
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            background: 'transparent'
                        }
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const CodeRenderer = memo((props: any) => {
    const { className, children, node } = props;
    const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
    const language = match ? match[1] : null
    
    if (language === 'interactive-quiz') {
        try {
            const quizData = JSON.parse(String(children).trim());
            return <MiniPracticeUI question={quizData} />;
        } catch (e) {
            return <div className="text-destructive p-4 border border-destructive/30 bg-destructive/10 rounded-xl my-4 text-xs font-mono">Failed to load interactive quiz JSON.</div>;
        }
    }

    if (language === 'mermaid') return <MermaidWrapper chart={String(children).replace(/\n$/, '')} />

    // Render ```markdown blocks as actual Markdown documents to support rendered artifact tables
    if (language === 'markdown') {
        return (
            <div className="my-6 p-6 bg-muted/5 border border-border/20 rounded-xl prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-table:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, {strict: false, throwOnError: false}]]}>
                    {String(children).replace(/\n$/, '')}
                </ReactMarkdown>
            </div>
        );
    }
    
    // Render ```latex blocks as actual Markdown documents to support mixed text and equations
    if (language === 'latex') {
        const src = String(children).replace(/\n$/, '');
        // Strip LaTeX document boilerplate and convert equation environments to $$ blocks
        const mathContent = src
            .replace(/\\documentclass\{.*?\}/g, '')
            .replace(/\\usepackage\{.*?\}/g, '')
            .replace(/\\begin\{document\}|\\end\{document\}/g, '')
            .replace(/\\section\{.*?\}|\\subsection\{.*?\}/g, '')
            .replace(/\\begin\{equation\}/g, () => '\n$$\n')
            .replace(/\\end\{equation\}/g, () => '\n$$\n')
            .replace(/\\\[/g, () => '\n$$\n')
            .replace(/\\\]/g, () => '\n$$\n')
            .trim();
        return (
            <div className="my-6 p-6 bg-muted/10 border border-border/30 rounded-xl">
                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, {strict: false, throwOnError: false}]]}>
                        {mathContent}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }
    
    const content = String(children).replace(/\n$/, '');
    const isBlock = !!match || content.includes('\n') || (node?.position && node.position.start.line !== node.position.end.line);
    
    if (isBlock) {
        return <CodeBlock language={language} value={content} />
    }
    
    return <code className={cn("bg-muted/30 px-1.5 py-0.5 rounded text-[12px] font-mono text-foreground border border-border/5 font-medium mx-0.5", className)} {...props}>{children}</code>
});

export function MarkdownViewer({ content, onNavigate, path, components }: MarkdownViewerProps) {
    const [selection, setSelection] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [explanationSelection, setExplanationSelection] = useState('');
    const [isQuizMode, setIsQuizMode] = useState(false);

    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

    // Use refs to keep callbacks stable for the useMemo dependency array
    const onNavigateRef = useRef(onNavigate);
    const pathRef = useRef(path);
    const componentsRef = useRef(components);
    useEffect(() => {
        onNavigateRef.current = onNavigate;
        pathRef.current = path;
        componentsRef.current = components;
    }, [onNavigate, path, components]);

    const markdownComponents = useMemo(() => ({
        ...(componentsRef.current || {}),
        p: ({ node, children, ...props }: any) => {
            const childrenArray = React.Children.toArray(children);
            const textContent = childrenArray.map(c => typeof c === 'string' ? c : '').join(' ');
            

            return (
                <p className="mb-4 leading-relaxed text-[13px] text-foreground/80 antialiased">
                    {React.Children.map(children, (child) => 
                        typeof child === 'string' ? renderWikiLinks(child, onNavigateRef.current) : child
                    )}
                </p>
            )
        },
        h1: ({ children }: any) => <h1 className="text-2xl font-black mt-10 mb-6 tracking-tighter border-b pb-2 border-border text-foreground break-words">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigateRef.current) : child)}
        </h1>,
        h2: ({ children }: any) => <h2 className="text-xl font-black mt-8 mb-4 tracking-tight text-foreground break-words">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigateRef.current) : child)}
        </h2>,
        h3: ({ children }: any) => <h3 className="text-lg font-bold mt-6 mb-3 tracking-tight text-foreground/90 break-words">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, onNavigateRef.current) : child)}
        </h3>,
        h4: ({ children }: any) => <h4 className="text-[11px] font-black mt-5 mb-2 uppercase tracking-[0.2em] text-muted-foreground/60">{children}</h4>,
        ul: ({ children, className }: any) => {
            const isTaskList = className?.includes('contains-task-list');
            return <ul className={cn("space-y-1 mb-4 text-[13px] text-foreground", isTaskList ? "list-none pl-1" : "list-disc pl-5")}>{children}</ul>
        },
        ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1 mb-4 text-[13px] text-foreground">{children}</ol>,
        li: ({ children, className }: any) => {
            const isTask = className?.includes('task-list-item');
            
            // Separate children into inline content and nested blocks (like sub-lists)
            const childrenArray = React.Children.toArray(children);
            const nestedBlocks: any[] = [];
            const inlineContent: any[] = [];
            
            childrenArray.forEach((child: any) => {
                // If it's a list or another block-level element, it should be below
                // react-markdown uses custom components, so child.type is often a function. We check the AST node's tagName.
                const tagName = child?.props?.node?.tagName || child?.type;
                if (tagName === 'ul' || tagName === 'ol' || tagName === 'blockquote') {
                    nestedBlocks.push(child);
                } else {
                    // For string children, handle wiki links
                    if (typeof child === 'string') {
                        inlineContent.push(renderWikiLinks(child, onNavigateRef.current));
                    } else {
                        inlineContent.push(child);
                    }
                }
            });

            if (isTask) {
                return (
                    <li className="list-none mb-1 group/task">
                        <div className="flex items-start gap-2">
                            {/* This div will contain the checkbox and the item text */}
                            <div className="flex-1 flex items-start gap-2 text-[13px] leading-relaxed text-foreground/80">
                                {inlineContent}
                            </div>
                        </div>
                        {nestedBlocks.length > 0 && (
                            <div className="mt-1">
                                {nestedBlocks}
                            </div>
                        )}
                    </li>
                );
            }

            return (
                <li className="text-[13px] leading-relaxed mb-1 text-foreground/80 list-item">
                    {inlineContent}
                    {nestedBlocks}
                </li>
            );
        },
        pre: ({ children }: any) => <div className="not-prose">{children}</div>,
        code: CodeRenderer,
        input: ({ node, type, checked, ...props }: any) => {
            if (type === 'checkbox') {
                return (
                    <input 
                        type="checkbox" 
                        defaultChecked={checked} 
                        onChange={async (e) => {
                            if (!pathRef.current) return;
                            const newChecked = e.target.checked;
                            const line = node?.position?.start?.line;
                            if (line) {
                                try {
                                    const res = await sidecarApi.readObsidianNote(pathRef.current);
                                    const lines = res.content.split('\n');
                                    // remark positions are 1-indexed, but frontmatter might shift it depending on how the parser handles it.
                                    // Usually remark parses the whole file including frontmatter if it's not stripped.
                                    const targetLine = lines[line - 1];
                                    if (targetLine && targetLine.match(/\[[ xX]\]/)) {
                                        lines[line - 1] = targetLine.replace(/\[[ xX]\]/, `[${newChecked ? 'x' : ' '}]`);
                                        const updatedContent = lines.join('\n');
                                        await sidecarApi.updateObsidianNote(pathRef.current, updatedContent);
                                        
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
                let borderClass = "border-zinc-500 bg-zinc-500/5";
                let Icon = "📝";
                if (['note', 'info'].includes(calloutType)) { borderClass = "border-zinc-400 bg-zinc-400/5"; Icon = "ℹ️"; }
                else if (['warning', 'caution'].includes(calloutType)) { borderClass = "border-zinc-500 bg-zinc-500/10"; Icon = "⚠️"; }
                else if (['danger', 'error', 'bug'].includes(calloutType)) { borderClass = "border-zinc-600 bg-zinc-600/10"; Icon = "🚨"; }
                else if (['success', 'check', 'done'].includes(calloutType)) { borderClass = "border-zinc-300 bg-zinc-300/10"; Icon = "✅"; }
                else if (['question', 'help', 'faq'].includes(calloutType)) { borderClass = "border-zinc-400 bg-zinc-400/10"; Icon = "❓"; }

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
                                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px] text-foreground/70">
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
                        "my-6 rounded-lg border-l-2 p-5 not-prose border-border bg-muted/10",
                        borderClass
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
            <a href={href} target="_blank" rel="noreferrer" className="text-foreground font-black underline underline-offset-4 decoration-border/40 hover:decoration-foreground/40 transition-all font-medium">
                {children}
            </a>
        )
    }), []);

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
        <div className="relative h-full flex flex-row bg-background text-foreground" onMouseUp={handleMouseUp} onKeyUp={handleMouseUp}>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, {strict: false, throwOnError: false}]]} components={markdownComponents}>{content}</ReactMarkdown>
                </div>
            </div>
            {showSidebar && <AiSidecar selection={explanationSelection || selection} path={path || ""} onClose={() => setShowSidebar(false)} initialMode={isQuizMode ? 'quiz' : 'explain'} />}
        </div>
    )
}
