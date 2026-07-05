import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { sidecarApi } from '@/lib/sidecarApi';
import { toast } from 'sonner';
import { MarkdownContext } from './MarkdownViewer';
import { useConfig } from '@/lib/ConfigContext';
import { useTheme } from '@/context/theme-provider';
import { invoke } from '@tauri-apps/api/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
                    isLocked && "text-muted-foreground/60 cursor-not-allowed line-through decoration-transparent hover:text-muted-foreground/65",
                    isCompleted && !isActive && "text-muted-foreground/65 line-through decoration-transparent hover:text-muted-foreground/75",
                    className
                )}
                title={isLocked ? "This lesson is locked." : (dest !== alias ? dest : undefined)}
            >
                {displayAlias}
            </button>
        </span>
    );
};

export const WikiEmbed = ({ dest, alias }: { dest: string, alias: string }) => {
    const { config } = useConfig();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [resolvedPath, setResolvedPath] = useState<string | null>(null);
    const [sidecarPort, setSidecarPort] = useState<number>(8765);
    const [sidecarToken, setSidecarToken] = useState<string>('');
    const [noteContent, setNoteContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const init = async () => {
            try {
                // 1. Fetch sidecar details
                const port = await invoke<number>('get_sidecar_port').catch(() => 8765);
                const token = await invoke<string>('get_sidecar_token').catch(() => '');
                if (!active) return;
                setSidecarPort(port);
                setSidecarToken(token);

                // 2. Extract hash anchor if present (e.g. file.pdf#page=5)
                const [cleanDest] = dest.split('#');

                // 3. Resolve the path relative to vault
                const res = await sidecarApi.findVaultPage(cleanDest);
                if (!active) return;

                if (res.found && res.path) {
                    setResolvedPath(res.path);
                    const ext = res.path.split('.').pop()?.toLowerCase() || '';

                    // 4. If it's a note (.md), load its content for transclusion
                    if (ext === 'md') {
                        const noteRes = await sidecarApi.readObsidianNote(res.path);
                        if (active && noteRes.content) {
                            // Strip frontmatter and proves grounds section
                            let body = noteRes.content.replace(/^---[\s\S]*?---\r?\n?/, '');
                            body = body.replace(/(?:(?:\r?\n)+\s*(?:---\s*)?|^\s*)##\s*The\s*Proving\s*Grounds(?:\r?\n)*/i, '\n');
                            setNoteContent(body);
                        }
                    }
                }
            } catch (err) {
                console.error('[WikiEmbed] Failed to load embed:', err);
            } finally {
                if (active) setLoading(false);
            }
        };
        void init();
        return () => { active = false; };
    }, [dest, config?.obsidianVaultPath]);

    if (loading) {
        return <div className="text-[10px] text-muted-foreground animate-pulse p-2 border border-border/20 rounded">Loading embed...</div>;
    }

    if (!resolvedPath) {
        return <div className="text-[10px] text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded">Embed file not found: {dest}</div>;
    }

    const ext = resolvedPath.split('.').pop()?.toLowerCase() || '';
    const vaultPath = config?.obsidianVaultPath || '';

    // Render image embed
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        const relativePath = resolvedPath.replace(/\\/g, '/');
        const authQuery = vaultPath ? `?vault_path=${encodeURIComponent(vaultPath)}` : '';
        const tokenQuery = sidecarToken ? `${authQuery ? '&' : '?'}sidecar_token=${encodeURIComponent(sidecarToken)}` : '';
        const imgUrl = `http://127.0.0.1:${sidecarPort}/api/obsidian/serve/${encodeURI(relativePath)}${authQuery}${tokenQuery}`;
        
        return (
            <div className="my-6 flex flex-col items-center">
                <img src={imgUrl} alt={alias || dest} className="max-w-[85%] rounded-[8px] border border-border shadow-sm bg-bento-card" />
                {alias && alias !== dest && <span className="text-[10px] text-muted-foreground mt-2 italic">{alias}</span>}
            </div>
        );
    }

    // Render PDF embed
    if (ext === 'pdf') {
        const relativePath = resolvedPath.replace(/\\/g, '/');
        
        let pageNum = 1;
        const [, hash] = dest.split('#');
        if (hash) {
            const match = hash.match(/(?:page=)?(\d+)/i);
            if (match) {
                pageNum = parseInt(match[1], 10);
            }
        }

        const authQuery = vaultPath ? `&vault_path=${encodeURIComponent(vaultPath)}` : '';
        const tokenQuery = sidecarToken ? `&sidecar_token=${encodeURIComponent(sidecarToken)}` : '';
        const viewerUrl = `http://127.0.0.1:${sidecarPort}/api/obsidian/viewer/${encodeURI(relativePath)}?page=${pageNum}&theme=${isDark ? 'dark' : 'light'}${authQuery}${tokenQuery}`;

        return (
            <div className="my-6 border border-border rounded-[8px] overflow-hidden bg-card shadow-sm">
                <div className="bg-muted/30 border-b border-border px-3 py-1.5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/65">
                    <span>Embedded PDF: {dest.split(/[/\\]/).pop()}</span>
                    {pageNum > 1 && <span>Page {pageNum}</span>}
                </div>
                <iframe src={viewerUrl} className="w-full h-[400px] border-none" />
            </div>
        );
    }

    // Render Audio embed
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) {
        const relativePath = resolvedPath.replace(/\\/g, '/');
        const authQuery = vaultPath ? `?vault_path=${encodeURIComponent(vaultPath)}` : '';
        const tokenQuery = sidecarToken ? `${authQuery ? '&' : '?'}sidecar_token=${encodeURIComponent(sidecarToken)}` : '';
        const audioUrl = `http://127.0.0.1:${sidecarPort}/api/obsidian/serve/${encodeURI(relativePath)}${authQuery}${tokenQuery}`;

        return (
            <div className="my-6 flex flex-col items-center bg-bento-card border border-border/50 rounded-[8px] p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2.5">
                    Embedded Audio: {dest.split(/[/\\]/).pop()}
                </div>
                <audio src={audioUrl} controls className="w-full max-w-[400px] outline-none" />
            </div>
        );
    }

    // Render Video embed
    if (['mp4', 'webm', 'ogv', 'mov'].includes(ext)) {
        const relativePath = resolvedPath.replace(/\\/g, '/');
        const authQuery = vaultPath ? `?vault_path=${encodeURIComponent(vaultPath)}` : '';
        const tokenQuery = sidecarToken ? `${authQuery ? '&' : '?'}sidecar_token=${encodeURIComponent(sidecarToken)}` : '';
        const videoUrl = `http://127.0.0.1:${sidecarPort}/api/obsidian/serve/${encodeURI(relativePath)}${authQuery}${tokenQuery}`;

        return (
            <div className="my-6 flex flex-col items-center bg-bento-card border border-border/50 rounded-[8px] p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
                    Embedded Video: {dest.split(/[/\\]/).pop()}
                </div>
                <video src={videoUrl} controls className="w-full max-w-[85%] rounded-[6px] border border-border/40 shadow-inner bg-black" />
            </div>
        );
    }

    // Render Note transclusion
    if (ext === 'md') {
        const MARKDOWN_REMARK_PLUGINS = [remarkGfm, remarkMath];
        const MARKDOWN_REHYPE_PLUGINS = [[rehypeKatex, {strict: false, throwOnError: false}]];
        
        return (
            <div className="my-6 p-6 border border-border/80 rounded-[12px] bg-muted/5 shadow-inner relative group/transclude">
                <div className="absolute top-2 right-4 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/45 select-none">
                    Note Embedding: {alias || dest}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed text-[13px]">
                    <ReactMarkdown
                        remarkPlugins={MARKDOWN_REMARK_PLUGINS as any}
                        rehypePlugins={MARKDOWN_REHYPE_PLUGINS as any}
                    >
                        {noteContent}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }

    return (
        <span className="text-destructive font-mono text-xs">Unsupported embed type: .{ext}</span>
    );
};

export const renderWikiLinks = (text: string, onNavigate: (page: string) => void) => {
    if (typeof text !== 'string') return text;
    
    // Split by WikiLink pattern [[...]] or optional embed tag ![[...]]
    const parts = text.split(/(!?\[\[.*?\]\])/g);
    
    return parts.map((part, i) => {
        const embedMatch = part.match(/^!\[\[(.*?)\]\]$/);
        const linkMatch = part.match(/^\[\[(.*?)\]\]$/);
        
        if (embedMatch) {
            const content = embedMatch[1];
            const [dest, ...aliasParts] = content.split('|');
            const alias = aliasParts.length > 0 ? aliasParts.join('|') : dest;
            return <WikiEmbed key={i} dest={dest} alias={alias} />;
        }
        
        if (linkMatch) {
            const content = linkMatch[1];
            const [dest, ...aliasParts] = content.split('|');
            const alias = aliasParts.length > 0 ? aliasParts.join('|') : dest;
            return <WikiLink key={i} dest={dest} alias={alias} onNavigate={onNavigate} />;
        }
        
        // Also handle underscores in plain text between links
        return part.replace(/_/g, ' ');
    });
};
