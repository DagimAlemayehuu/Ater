import ReactMarkdown from 'react-markdown'
import { useTheme } from '@/context/theme-provider'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { updateProperty } from '@/lib/markdownHelper'
import { WikiLink, renderWikiLinks } from './WikiLink'
import mermaid from 'mermaid'
import { Check, RefreshCw, Copy, FileText, Layers, Award, CheckSquare, Sparkles, Clock, Folder, ArrowRight, Info, AlertTriangle, ShieldAlert, CheckCircle2, HelpCircle, Calendar, Play, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import DOMPurify from 'dompurify'
import MiniPracticeUI from '../MiniPracticeUI'
import type { Question } from '@/types/practice'
import RubiksCubeWidget from './RubiksCubeWidget'
import { stripArtifactMarkup } from '@/lib/artifacts/parser'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light'
// @ts-ignore
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js'
// @ts-ignore
import vs from 'react-syntax-highlighter/dist/esm/styles/prism/vs.js'

// Register languages to avoid dynamic import issues during build
// @ts-ignore
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript.js'
// @ts-ignore
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript.js'
// @ts-ignore
import py from 'react-syntax-highlighter/dist/esm/languages/prism/python.js'
// @ts-ignore
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash.js'

SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('typescript', ts)
SyntaxHighlighter.registerLanguage('python', py)
SyntaxHighlighter.registerLanguage('bash', bash)
import { ExplainSidebar } from './ExplainSidebar'
import {
    FocusHUD,
    GenerationStepper,
    ActivityVitals,
    SearchNavigator,
    CalendarBar,
    InboxGallery,
    SRSFlashcard,
    AppConfigBlock,
    QueueStatusBlock,
    StudyHistoryBlock,
    FormCard,
    ConfirmActionBlock,
    SummaryCard,
    PracticeConfigCard,
    InteractiveSandboxBlock,
    CurriculumPlannerCard
} from '../intelligence/OracleUIBlocks'

const MARKDOWN_REMARK_PLUGINS = [remarkGfm, remarkMath]
const MARKDOWN_REHYPE_PLUGINS = [[rehypeKatex, {strict: false, throwOnError: false}]]

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

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-[12px] text-center my-12">
          <p className="text-sm font-black text-destructive/60 uppercase tracking-[0.2em]">Document Parsing Error</p>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">The content structure is malformed or contains illegal sequences.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-destructive/20 transition-none"
          >
            Reload Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const sanitizeSvg = (rawSvg: string): string => {
  return DOMPurify.sanitize(rawSvg);
};

export const MermaidWrapper = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();

  const activeChartRef = useRef<string>(chart);

  useEffect(() => {
    activeChartRef.current = chart;
    const isDark = resolvedTheme === 'dark';

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isDark ? 'dark' : 'default',
      themeVariables: {
        primaryColor: isDark ? '#27272a' : '#f4f4f5',
        primaryTextColor: isDark ? '#fafafa' : '#18181b',
        primaryBorderColor: isDark ? '#3f3f46' : '#e4e4e7',
        lineColor: isDark ? '#52525b' : '#a1a1aa',
        secondaryColor: isDark ? '#18181b' : '#fafafa',
        tertiaryColor: isDark ? '#27272a' : '#f4f4f5',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        mainBkg: isDark ? '#1a1a1c' : '#ffffff',
        nodeSpacing: 40,
        rankSpacing: 40,
        curve: 'basis'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: true
      }
    });

    mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, chart).then((result) => {
      if (activeChartRef.current === chart) {
        setSvg(result.svg);
        setError(false);
      }
    }).catch((e) => {
      if (activeChartRef.current === chart) {
        console.error('Mermaid render error', e);
        setError(true);
      }
    });
  }, [chart, resolvedTheme]);

  if (error) return <div className="text-destructive font-mono text-[11px] p-4 bg-destructive/10 rounded-[8px]">Error rendering Mermaid diagram</div>;
  if (!svg) return <div className="text-muted-foreground font-mono text-[11px] p-4 text-center bg-bento-card rounded-[8px] border border-border">Rendering diagram...</div>;

  return (
  <div className="my-6 flex justify-center">
      <div
          className="max-w-[85%] w-fit bg-bento-card p-4 rounded-[8px] border border-border overflow-hidden [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
      />
  </div>
  );
}
interface MarkdownViewerProps {
    content: string
    onNavigate: (pageName: string) => void
    path?: string
    components?: any
    // v33.0: note metadata for persona-aware AI explain
    noteMode?: string
    noteTitle?: string
    noteCourse?: string
}

interface ProvingGroundsPayload {
    quizData: Question | Question[]
    notePath?: string
    initialQuestionIndex?: number
}



const CodeBlock = memo(({ language, value }: { language: string | null, value: string }) => {
    const [copied, setCopied] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-8 rounded-[8px] border border-border overflow-hidden bg-bento-card hover:border-border/40">
            {/* Header / Top Bar - Minimalist and blended */}
            <div className={cn(
                "flex items-center justify-between px-5 py-1.5 border-b border-border/60 bg-bento-item/50 ",
                !language && "opacity-0 group-hover:opacity-100"
            )}>
                <div className="flex items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 select-none">
                        {language || 'code'}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-bento-item/60 rounded-[6px] text-muted-foreground/75 hover:text-foreground group/copy"
                    title="Copy Code"
                >
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover/copy:opacity-100 ">
                        {copied ? 'Copied' : 'Copy'}
                    </span>
                    {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} className="group-hover/copy:scale-110 " />}
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
});

export const ProvingGroundsPractice = memo(({
    quizData,
    notePath,
    initialQuestionIndex = 0,
    initialStarted = false,
    onStart,
    onExit
}: {
    quizData: Question | Question[];
    notePath?: string;
    initialQuestionIndex?: number;
    initialStarted?: boolean;
    onStart?: () => void;
    onExit?: () => void;
}) => {
    const [isStarted, setIsStarted] = useState(initialStarted);
    const [isComplete, setIsComplete] = useState(false);
    const questions = Array.isArray(quizData) ? quizData : [quizData];
    const count = questions.length;

    const isRemediation = typeof notePath === 'string' && notePath.includes('remediation_temp');

    useEffect(() => {
        if (initialStarted) setIsStarted(true);
    }, [initialStarted]);

    useEffect(() => {
        setIsComplete(false);
        setTransferTask(null);
        setTransferTaskLoading(false);
        setTransferAnswer('');
        setTransferStatus('idle');
        setTransferFeedback('');
        setTransferRemediation('');
    }, [quizData, notePath, initialQuestionIndex]);

    // Transfer Task States
    const [transferTask, setTransferTask] = useState<any>(null);
    const [transferTaskLoading, setTransferTaskLoading] = useState(false);
    const [transferAnswer, setTransferAnswer] = useState('');
    const [transferStatus, setTransferStatus] = useState<'idle' | 'grading' | 'failed' | 'passed'>('idle');
    const [transferFeedback, setTransferFeedback] = useState('');
    const [transferRemediation, setTransferRemediation] = useState('');

    useEffect(() => {
        const handleOpenRemediation = () => {
            setIsStarted(false);
        };
        window.addEventListener('ater:open-remediation-lesson', handleOpenRemediation);
        return () => window.removeEventListener('ater:open-remediation-lesson', handleOpenRemediation);
    }, []);

    // Load transfer task and check previous outcomes
    useEffect(() => {
        if (!notePath || isRemediation) {
            setTransferTask(null);
            setTransferTaskLoading(false);
            return;
        }

        let active = true;
        setTransferTaskLoading(true);
        sidecarApi.readObsidianNote(notePath).then((res) => {
            if (!active) return;
            if (res.metadata && res.metadata.transfer_task) {
                setTransferTask(res.metadata.transfer_task);
            }
        }).catch((err) => {
            console.error('Failed to load transfer task:', err);
        });

        const sessId = localStorage.getItem('ater_active_session_id');
        if (sessId) {
            sidecarApi.getTutorStatus(sessId).then((sess) => {
                if (!active) return;
                const mastery = sess?.current_note_mastery;
                if (mastery?.note_path === notePath && mastery.transfer_task) {
                    setTransferTask(mastery.transfer_task);
                }
                if (sess && sess.transfer_gate_outcomes && sess.transfer_gate_outcomes[notePath]) {
                    const outcome = sess.transfer_gate_outcomes[notePath];
                    if (outcome.status === 'passed') {
                        setTransferStatus('passed');
                        setTransferFeedback(outcome.feedback || '');
                        setTransferAnswer(outcome.answer || '');
                    } else if (outcome.status === 'failed') {
                        setTransferStatus('failed');
                        setTransferFeedback(outcome.feedback || '');
                        setTransferRemediation(outcome.remediation || '');
                        setTransferAnswer(outcome.answer || '');
                    }
                }
            }).catch(() => {}).finally(() => {
                if (active) setTransferTaskLoading(false);
            });
        } else {
            setTransferTaskLoading(false);
        }
        return () => {
            active = false;
        };
    }, [notePath, isRemediation]);

    const handleSubmitTransfer = async () => {
        const sessId = localStorage.getItem('ater_active_session_id');
        if (!sessId || !notePath) {
            toast.error('No active learning session found.');
            return;
        }
        if (!transferAnswer.trim()) {
            toast.error('Please enter your response before submitting.');
            return;
        }

        setTransferStatus('grading');
        try {
            const res = await sidecarApi.submitTransferAnswer({
                session_id: sessId,
                note_path: notePath,
                user_answer: transferAnswer
            });
            if (res.is_correct) {
                setTransferStatus('passed');
                setTransferFeedback(res.feedback || 'Transfer task cleared!');
                toast.success('Transfer gate passed!');
            } else {
                setTransferStatus('failed');
                setTransferFeedback(res.feedback || 'Incorrect attempt.');
                setTransferRemediation(res.remediation || '');
                toast.error('Application failed. Check the remediation guidelines.');
            }
        } catch (err: any) {
            console.error('Failed to submit transfer answer:', err);
            setTransferStatus('idle');
            toast.error('Failed to submit transfer answer.');
        }
    };

    // When a remediation session completes with a correct answer, auto-restore original note
    useEffect(() => {
        if (isRemediation && isComplete) {
            let pendingResume: any = null;
            try {
                pendingResume = JSON.parse(localStorage.getItem('ater_pending_practice_resume') || 'null');
            } catch {
                pendingResume = null;
            }
            const originalPath = pendingResume?.originalPath || localStorage.getItem('ater_original_note_path');
            if (originalPath) {
                setTimeout(async () => {
                    const sessId = localStorage.getItem('ater_active_session_id');
                    if (sessId && pendingResume?.failedQuestionId) {
                        await sidecarApi.submitTutorAnswer({
                            session_id: sessId,
                            question_id: String(pendingResume.failedQuestionId),
                            is_correct: true,
                            wager: 'low',
                            user_answer: 'remediation-cleared',
                        }).catch((err) => {
                            console.error('[ProvingGroundsPractice] Failed to persist remediation-cleared recall:', err);
                        });
                    }
                    window.dispatchEvent(new CustomEvent('ater:restore-original-lesson', {
                        detail: {
                            originalPath,
                            resumePractice: true,
                            quizData: pendingResume?.quizData,
                            returnQuestionIndex: pendingResume?.returnQuestionIndex,
                        }
                    }));
                }, 150);
            } else {
                // No saved path — just close the overlay
                setTimeout(() => setIsStarted(false), 150);
            }
        }
    }, [isRemediation, isComplete]);

    const continueToNextLesson = () => {
        const completedPath = isRemediation
            ? localStorage.getItem('ater_original_note_path') || notePath
            : notePath;
        window.dispatchEvent(new CustomEvent('ater:practice-continue', { detail: { notePath: completedPath } }));
        localStorage.removeItem('ater_pending_practice_resume');
        setIsStarted(false);
        setIsComplete(false);
        setTransferAnswer('');
        setTransferStatus('idle');
        setTransferFeedback('');
        setTransferRemediation('');
        onExit?.();
    };

    const closePractice = () => {
        if (onExit) {
            onExit();
            return;
        }
        setIsStarted(false);
    };

    if (isStarted) {
        return (
                <section
                    aria-label="Proving Grounds Practice"
                    className="my-8 not-prose rounded-[8px] border border-border bg-bento-panel text-foreground shadow-sm"
                >
                    <div className="min-h-14 border-b border-border bg-bento-card px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/60">The Proving Grounds</div>
                            <div className="text-sm font-black text-foreground truncate">
                                {isComplete ? (isRemediation ? 'Returning to Lesson...' : 'Practice Complete') : isRemediation ? 'Follow-Up Practice' : `${count} Main Question${count === 1 ? '' : 's'}`}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isComplete && !isRemediation && !transferTaskLoading && (!transferTask || transferStatus === 'passed') && (
                                <button
                                    type="button"
                                    onClick={continueToNextLesson}
                                    className="h-9 rounded-[6px] border border-primary/30 bg-primary px-4 text-[9px] font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
                                >
                                    Next Lesson →
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closePractice}
                                className="size-9 rounded-[6px] border border-border bg-bento-card text-muted-foreground hover:text-foreground flex items-center justify-center"
                                aria-label="Close practice"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 md:p-6">
                        <div className="w-full">
                            {!isComplete ? (
                                <div className="w-full">
                                    <MiniPracticeUI
                                        question={quizData}
                                        notePath={notePath}
                                        initialQuestionIndex={initialQuestionIndex}
                                        onComplete={() => setIsComplete(true)}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col justify-start space-y-6">
                                    {/* Quiz complete card */}
                                    <div className="bg-bento-panel border border-border/60 rounded-[12px] p-5">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
                                            <Check className="text-emerald-500 w-5 h-5" />
                                            Recall Quiz Cleared
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            You have successfully completed the recall questions for this concept.
                                        </p>
                                    </div>

                                    {/* Transfer task card */}
                                    {transferTaskLoading && (
                                        <div className="bg-bento-panel border border-border/60 rounded-[12px] p-5">
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Checking Application Gate...
                                            </div>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Ater is loading the transfer requirement before this lesson can advance.
                                            </p>
                                        </div>
                                    )}

                                    {!transferTaskLoading && transferTask && (
                                        <div className="bg-bento-panel border border-border/60 rounded-[12px] p-6 space-y-4">
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                                                    Application Gate ({transferTask.type})
                                                </span>
                                                <h4 className="text-xs font-bold text-foreground mt-3 leading-relaxed">
                                                    {transferTask.prompt}
                                                </h4>
                                                {transferTask.grading_criteria && (
                                                    <p className="text-[10px] text-muted-foreground/80 mt-1 italic">
                                                        Criteria: {transferTask.grading_criteria}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                    Your Application / Solution
                                                </label>
                                                <textarea
                                                    value={transferAnswer}
                                                    onChange={(e) => setTransferAnswer(e.target.value)}
                                                    disabled={transferStatus === 'grading' || transferStatus === 'passed'}
                                                    placeholder="Explain your approach, paste your code, or detail your solution..."
                                                    className="w-full h-32 p-3 bg-bento-card border border-border/80 rounded-[8px] text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 resize-none font-mono"
                                                />
                                            </div>

                                            {transferFeedback && (
                                                <div className={cn(
                                                    "p-4 rounded-[8px] text-xs border",
                                                    transferStatus === 'passed'
                                                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                                )}>
                                                    <div className="font-bold uppercase tracking-wider text-[9px] mb-1">
                                                        {transferStatus === 'passed' ? 'Evaluation: Pass' : 'Evaluation: Feedback'}
                                                    </div>
                                                    <p className="leading-relaxed">{transferFeedback}</p>
                                                    {transferRemediation && (
                                                        <div className="mt-2 pt-2 border-t border-border/20">
                                                            <div className="font-bold uppercase tracking-wider text-[8px] opacity-75">Remediation Guidelines</div>
                                                            <p className="mt-0.5 leading-relaxed opacity-90">{transferRemediation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {transferStatus !== 'passed' && (
                                                <button
                                                    type="button"
                                                    onClick={handleSubmitTransfer}
                                                    disabled={transferStatus === 'grading'}
                                                    className="w-full h-10 rounded-[8px] bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 flex items-center justify-center gap-2"
                                                >
                                                    {transferStatus === 'grading' ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Evaluating Answer...
                                                        </>
                                                    ) : (
                                                        'Submit Application'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!transferTaskLoading && !transferTask && (
                                        <div className="text-center py-8">
                                            <p className="text-xs text-muted-foreground">
                                                No transfer task required for this lesson. Click <strong>Next Lesson</strong> to proceed.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
        );
    }

    return (
        <div className="my-8 not-prose rounded-[8px] border border-border bg-bento-panel overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-bento-card flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-sm font-black text-foreground truncate">
                        {isRemediation ? 'Follow-Up Question' : `${count} Question${count === 1 ? '' : 's'}`}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (onStart) {
                            onStart();
                            return;
                        }
                        setIsStarted(true);
                    }}
                    className="h-10 shrink-0 inline-flex items-center gap-2 rounded-[8px] border border-border bg-bento-item px-5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/50 transition-colors"
                >
                    <Play size={13} fill="currentColor" />
                    {isRemediation ? 'Try Again' : 'Start Practice'}
                </button>
            </div>
            <div className="px-5 py-4 text-[12px] leading-relaxed text-muted-foreground">
                {isRemediation
                    ? "Answer this question to verify you've understood the concept."
                    : "Answer one question at a time, then use Check to reveal the answer and explanation."}
            </div>
        </div>
    );
});

ProvingGroundsPractice.displayName = 'ProvingGroundsPractice';

const getMetaVal = (item: any, key: string, fallback: string = '') => {
    if (!item) return fallback;
    const lowerKey = key.toLowerCase();
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

    let rawVal: any = undefined;
    if (item[key] !== undefined && item[key] !== null) rawVal = item[key];
    else if (item[lowerKey] !== undefined && item[lowerKey] !== null) rawVal = item[lowerKey];
    else if (item[capitalizedKey] !== undefined && item[capitalizedKey] !== null) rawVal = item[capitalizedKey];
    else if (item.metadata && typeof item.metadata === 'object') {
        if (item.metadata[key] !== undefined && item.metadata[key] !== null) rawVal = item.metadata[key];
        else if (item.metadata[lowerKey] !== undefined && item.metadata[lowerKey] !== null) rawVal = item.metadata[lowerKey];
        else if (item.metadata[capitalizedKey] !== undefined && item.metadata[capitalizedKey] !== null) rawVal = item.metadata[capitalizedKey];
    }

    if (rawVal === undefined || rawVal === null) return fallback;
    return String(rawVal).replace(/[\[\]]/g, '').replace(/_/g, ' ');
};

const AterUIBlock = memo(({ payload, notePath, onSendMessage }: { payload: any; notePath?: string; onSendMessage?: (text: string) => void }) => {
    const navigate = useNavigate();
    const { ui_type, data, caption } = payload;

    const handleNavigate = (route: string) => {
        navigate(route);
    };

    if (!data) return null;

    const getItems = (): any[] => {
        if (Array.isArray(data)) return data;
        if (typeof data !== 'object') return [data];

        // Handle common object wrappers
        if (data.records && Array.isArray(data.records)) return data.records;
        if (data.results && Array.isArray(data.results)) return data.results;
        if (data.hubs && Array.isArray(data.hubs)) return data.hubs;
        if (data.cards && Array.isArray(data.cards)) return data.cards;
        if (data.sessions && Array.isArray(data.sessions)) return data.sessions;

        return [data];
    };

    const renderContent = () => {
        const list = getItems();

        switch (ui_type) {
            case 'course_cards': {
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        {list.map((item: any, i: number) => {
                            const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Course';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const professor = getMetaVal(item, 'Professor') || getMetaVal(item, 'professor') || '';
                            const semester = getMetaVal(item, 'Semester') || getMetaVal(item, 'semester') || '';
                            const credits = getMetaVal(item, 'Credits') || getMetaVal(item, 'credits') || '';
                            const grade = getMetaVal(item, 'Grade') || getMetaVal(item, 'grade') || '';
                            const id = item.id || item._title || cleanTitle.replace(/\s+/g, '_');
                            const path = item.path || '';

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(path ? `/obsidian?path=${encodeURIComponent(path)}` : `/academic?tab=COURSES&id=${id}`)}
                                    className="p-4 border border-border bg-bento-card hover:bg-bento-item/50 hover:border-foreground/40 cursor-pointer rounded-[12px] transition-all duration-150 group flex flex-col justify-between h-32 select-none shadow-sm"
                                >
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-[12px] font-black uppercase text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                {cleanTitle}
                                            </h4>
                                            {grade && (
                                                <Badge variant="outline" className="rounded-[6px] px-1.5 py-0.5 text-[8px] font-black uppercase border-border bg-bento-item text-foreground shrink-0">
                                                    {grade}
                                                </Badge>
                                            )}
                                        </div>
                                        {professor && (
                                            <p className="text-[9px] font-bold text-muted-foreground/65 mt-1.5 uppercase tracking-widest truncate">
                                                {professor}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center border-t border-border/60 pt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/65">
                                        <div className="flex items-center gap-2">
                                            {semester && (
                                                <Badge variant="outline" className="h-4 rounded-[6px] text-[7px] border-border bg-bento-item text-muted-foreground font-black px-1">
                                                    {semester}
                                                </Badge>
                                            )}
                                            {credits && <span>{credits} CR</span>}
                                        </div>
                                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'note_cards': {
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        {list.map((item: any, i: number) => {
                            const path = item.path || '';
                            const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Note';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const folder = path.split(/[/\\]/).slice(0, -1).join('/') || 'Root';
                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(`/obsidian?path=${encodeURIComponent(path)}`)}
                                    className="p-4 border border-border bg-bento-card hover:bg-bento-item/50 hover:border-foreground/40 cursor-pointer rounded-[12px] transition-all duration-150 group flex flex-col justify-between h-28 select-none"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <FileText size={14} className="text-muted-foreground/60 mt-0.5" />
                                        <div>
                                            <h4 className="text-[12px] font-black uppercase text-foreground leading-snug truncate max-w-[180px]">
                                                {cleanTitle}
                                            </h4>
                                            <span className="text-[8px] font-black uppercase text-muted-foreground/65 tracking-widest mt-1 block">
                                                {folder}
                                            </span>
                                        </div>
                                    </div>
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.tags.slice(0, 3).map((tag: string, tid: number) => (
                                                <span key={tid} className="px-1.5 py-0.5 text-[8px] text-muted-foreground border border-border bg-bento-item rounded-[6px] font-mono">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'hub_cards': {
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        {list.map((item: any, i: number) => {
                            const path = item.path || '';
                            const title = item.title || item._title || item.name || getMetaVal(item, 'title') || 'Untitled Hub';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const course = item.course || getMetaVal(item, 'Course') || getMetaVal(item, 'course') || '';
                            const isCompleted = item.status === 'Completed' || item.status === 'done';
                            const noteCount = item.note_count || item.noteCount || '';

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(`/obsidian?path=${encodeURIComponent(path)}`)}
                                    className="p-4 border border-border bg-bento-card hover:bg-bento-item/50 hover:border-foreground/40 cursor-pointer rounded-[12px] transition-all duration-150 group flex flex-col justify-between h-32 select-none shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <Layers size={14} className="text-muted-foreground/60 mt-1" />
                                            <div>
                                                <h4 className="text-[12px] font-black uppercase text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                                    {cleanTitle}
                                                </h4>
                                                {course && course !== '[]' && (
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground/65 tracking-widest mt-1 block">
                                                        {String(course).replace(/[\[\]]/g, '').replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "rounded-[8px] px-1.5 py-0.5 text-[8px] font-black uppercase shrink-0 border",
                                            isCompleted
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 rounded-[6px]"
                                                : "border-amber-500/20 bg-amber-500/10 text-amber-600 rounded-[6px]"
                                        )}>
                                            {item.status || 'Active'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/65 mt-3 pt-2 border-t border-border/60">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={10} />
                                            <span>Planner Hub</span>
                                        </div>
                                        {noteCount !== '' && (
                                            <span className="text-foreground/60">{noteCount} Notes</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'exam_list': {
                return (
                    <div className="border border-border bg-bento-card my-4 rounded-[12px] overflow-hidden divide-y divide-border/60">
                        {list.map((item: any, i: number) => {
                            const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Exam';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const course = getMetaVal(item, 'Course') || getMetaVal(item, 'course') || '';
                            const date = getMetaVal(item, 'Date') || getMetaVal(item, 'date') || 'No Date';
                            const type = getMetaVal(item, 'Type') || getMetaVal(item, 'type') || '';
                            const id = item.id || item._title || cleanTitle.replace(/\s+/g, '_');

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(item.path ? `/obsidian?path=${encodeURIComponent(item.path)}` : `/academic?tab=EXAMS&id=${id}`)}
                                    className="p-4 flex items-center justify-between hover:bg-muted/5 cursor-pointer transition-colors group select-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-8 border border-border flex items-center justify-center bg-bento-item rounded-[6px] group-hover:border-foreground/30 transition-all">
                                            <Award size={14} className="text-muted-foreground/50 group-hover:text-foreground" />
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-black uppercase text-foreground leading-tight group-hover:text-primary transition-colors">
                                                {cleanTitle}
                                            </h5>
                                            <p className="text-[9px] text-muted-foreground/65 uppercase font-bold tracking-widest mt-1">
                                                {course && course !== '[]' ? String(course).replace(/[\[\]]/g, '').replace(/_/g, ' ') : 'General Unit'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-foreground/80 font-mono tracking-tighter">
                                            {date}
                                        </div>
                                        {type && type !== '[]' && (
                                            <div className="text-[8px] text-muted-foreground/65 uppercase tracking-[0.15em] font-black mt-0.5">
                                                {String(type).replace(/[\[\]]/g, '')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'assignment_list': {
                return (
                    <div className="border border-border bg-bento-card my-4 rounded-[12px] overflow-hidden divide-y divide-border/60">
                        {list.map((item: any, i: number) => {
                            const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Assignment';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const course = getMetaVal(item, 'Course') || getMetaVal(item, 'course') || '';
                            const dueDate = getMetaVal(item, 'Due Date') || getMetaVal(item, 'due_date') || '';
                            const isCompleted = item.done === true || item.done === 'true' || getMetaVal(item, 'Done') === 'true' || getMetaVal(item, 'done') === 'true';

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(item.path ? `/obsidian?path=${encodeURIComponent(item.path)}` : '/academic?tab=ASSIGNMENTS')}
                                    className="p-4 flex items-center justify-between hover:bg-muted/5 cursor-pointer transition-colors group select-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "size-8 border flex items-center justify-center transition-all",
                                            isCompleted ? "border-emerald-500/20 bg-emerald-500/5 rounded-[6px]" : "border-border bg-bento-item rounded-[6px] group-hover:border-foreground/30"
                                        )}>
                                            <CheckSquare size={14} className={cn(
                                                isCompleted ? "text-emerald-500" : "text-muted-foreground/40 group-hover:text-foreground"
                                            )} />
                                        </div>
                                        <div>
                                            <h5 className={cn(
                                                "text-[11px] font-black uppercase leading-tight transition-colors",
                                                isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground group-hover:text-primary"
                                            )}>
                                                {cleanTitle}
                                            </h5>
                                            <p className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-widest mt-1">
                                                {course && course !== '[]' ? String(course).replace(/[\[\]]/g, '').replace(/_/g, ' ') : 'General Task'}
                                            </p>
                                        </div>
                                    </div>
                                    {dueDate && (
                                        <Badge variant="outline" className="rounded-[6px] text-[9px] font-black uppercase border-border bg-bento-item text-muted-foreground/60 font-mono">
                                            {dueDate}
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'srs_deck': {
                return (
                    <div className="space-y-3 my-4">
                        <div className="border border-border rounded-[12px] overflow-hidden divide-y divide-border bg-bento-card">
                            {list.map((item: any, i: number) => {
                                const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Card';
                                const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                                const path = item.path || '';
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleNavigate(`/obsidian?path=${encodeURIComponent(path)}`)}
                                        className="p-3.5 flex items-center justify-between hover:bg-muted/5 cursor-pointer transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Sparkles size={14} className="text-amber-500/80 animate-pulse" />
                                            <div>
                                                <h5 className="text-[11px] font-black uppercase text-foreground leading-normal">
                                                    {cleanTitle}
                                                </h5>
                                                {item.difficulty && (
                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mt-0.5">
                                                        Diff: {parseFloat(item.difficulty).toFixed(1)} | Stab: {parseFloat(item.stability || 0).toFixed(1)}d
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 tracking-wider">
                                            Due Now
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => handleNavigate('/practice')}
                            className="w-full h-9 border border-border bg-bento-item hover:bg-bento-item/80 text-foreground text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all select-none rounded-[8px]"
                        >
                            Start Spaced Repetition Practice
                        </button>
                    </div>
                );
            }
            case 'stats': {
                // Ensure we get the raw stats object (handling wrappers)
                const statsObj = (data.records || data.results || data);
                const list = Object.entries(statsObj).map(([key, val]) => ({
                    label: key.replace(/_/g, ' ').toUpperCase(),
                    value: typeof val === 'object' ? JSON.stringify(val) : String(val)
                })).filter(x => x.label !== 'HUB NAMES' && x.label !== 'TYPE');

                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 my-4">
                        {list.map((item, i) => (
                            <div key={i} className="p-4 border border-border bg-bento-card select-none flex flex-col justify-between h-20 rounded-[12px]">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    {item.label}
                                </span>
                                <span className="text-xl font-black text-foreground tracking-tight">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'semester_list': {
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        {list.map((item: any, i: number) => {
                            const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Semester';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const path = item.path || '';
                            const status = getMetaVal(item, 'Status') || getMetaVal(item, 'status') || 'Active';
                            const isActive = status.toLowerCase() === 'active';

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(path ? `/obsidian?path=${encodeURIComponent(path)}` : '/academic?tab=PROGRAM')}
                                    className="p-4 border border-border bg-bento-card hover:bg-bento-item/50 hover:border-foreground/40 cursor-pointer rounded-[12px] transition-all duration-150 group flex flex-col justify-between h-28 select-none shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <Folder size={14} className="text-muted-foreground/60 mt-1" />
                                            <h4 className="text-[12px] font-black uppercase text-foreground leading-snug group-hover:text-primary transition-colors">
                                                {cleanTitle}
                                            </h4>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "rounded-[6px] px-1.5 py-0.5 text-[8px] font-black uppercase border shrink-0",
                                            isActive ? "border-border bg-bento-item text-foreground" : "border-border text-muted-foreground"
                                        )}>
                                            {status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase text-muted-foreground/65 tracking-[0.2em] mt-2 pt-2 border-t border-border/60">
                                        <span>Academic Term</span>
                                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'year_list': {
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        {list.map((item: any, i: number) => {
                            const title = item.title || item._title || getMetaVal(item, 'title') || 'Untitled Year';
                            const cleanTitle = String(title).replace(/\.md$/, '').replace(/_/g, ' ');
                            const path = item.path || '';
                            const status = getMetaVal(item, 'Status') || getMetaVal(item, 'status') || 'Active';
                            const program = getMetaVal(item, 'Program') || getMetaVal(item, 'program') || '';
                            const isActive = status.toLowerCase() === 'active' || status.toLowerCase() === 'current';
                            const gpa = getMetaVal(item, 'GPA') || getMetaVal(item, 'gpa') || '';
                            const credits = getMetaVal(item, 'Earned Credits') || getMetaVal(item, 'earned_credits') || getMetaVal(item, 'credits') || '';

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleNavigate(path ? `/obsidian?path=${encodeURIComponent(path)}` : '/academic?tab=PROGRAM')}
                                    className="p-4 border border-border bg-bento-card hover:bg-bento-item/50 hover:border-foreground/40 cursor-pointer rounded-[12px] transition-all duration-150 group flex flex-col justify-between h-32 select-none shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <Calendar size={14} className="text-muted-foreground/60 mt-1" />
                                            <div>
                                                <h4 className="text-[12px] font-black uppercase text-foreground leading-snug group-hover:text-primary transition-colors">
                                                    {cleanTitle}
                                                </h4>
                                                {program && (
                                                    <span className="text-[9px] font-black uppercase text-muted-foreground/65 tracking-widest mt-1 block">
                                                        {program}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "rounded-[6px] px-1.5 py-0.5 text-[8px] font-black uppercase border shrink-0",
                                            isActive
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border text-muted-foreground"
                                        )}>
                                            {status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase text-muted-foreground/65 tracking-[0.2em] mt-2 pt-2 border-t border-border/60">
                                        <div className="flex items-center gap-2">
                                            {gpa && <span>GPA: {gpa}</span>}
                                            {credits && <span>• {credits} CR</span>}
                                        </div>
                                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            // --- New Dynamic Oracle UI Types ---
            case 'focus_hud':
                return <FocusHUD payload={data} />;
            case 'generation_stepper':
                return <GenerationStepper payload={data} />;
            case 'activity_vitals':
                return <ActivityVitals payload={data} />;
            case 'search_navigator':
                return <SearchNavigator payload={data} />;
            case 'calendar_bar':
                return <CalendarBar payload={data} />;
            case 'inbox_gallery':
                return <InboxGallery payload={data} onProcess={(path) => {
                    if (onSendMessage) {
                        onSendMessage(`Process the file at path: ${path}`);
                    }
                }} />;
            case 'srs_flashcard':
                return <SRSFlashcard payload={data} />;
            case 'app_config':
                return <AppConfigBlock payload={data} onSendMessage={onSendMessage} />;
            case 'queue_status':
                return <QueueStatusBlock payload={data} onSendMessage={onSendMessage} />;
            case 'form_card':
                return <FormCard payload={data} onSendMessage={onSendMessage} />;
            case 'confirm_action':
                return <ConfirmActionBlock payload={data} onSendMessage={onSendMessage} />;
            case 'study_history':
                return <StudyHistoryBlock payload={data} />;
            case 'summary_card':
                return <SummaryCard payload={data} />;
            case 'practice_config_card':
                return <PracticeConfigCard payload={data} />;
            case 'interactive_sandbox':
                return <InteractiveSandboxBlock payload={data} />;
            default:
                return (
                    <pre className="text-xs p-3 bg-bento-item border border-border overflow-x-auto rounded-[8px] font-mono">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                );
        }
    };

    return (
        <div className="my-6">
            {renderContent()}
            {caption && (
                <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono uppercase tracking-wider">
                    — {caption} —
                </p>
            )}
        </div>
    );
});

const MarkdownContext = React.createContext<{
    path?: string;
    onNavigate?: (page: string) => void;
    onSendMessage?: (text: string) => void;
    onOpenPractice?: (payload: ProvingGroundsPayload) => void;
    components?: any;
}>({});

const CodeRenderer = memo((props: any) => {
    const { className, children, node, notePath, onSendMessage, components } = props;
    const context = React.useContext(MarkdownContext);
    const activeNotePath = notePath ?? context.path;
    const activeOnSendMessage = onSendMessage ?? context.onSendMessage;
    const activeComponents = components ?? context.components;
    const { resolvedTheme } = useTheme();
    const dark = resolvedTheme === 'dark';

    const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
    const language = match ? match[1] : null

    const quizData = useMemo(() => {
        if (language !== 'interactive-quiz') return null;
        try {
            return JSON.parse(String(children).trim());
        } catch (e) {
            return null;
        }
    }, [children, language]);

    const aterUIData = useMemo(() => {
        if (language !== 'ater-ui') return null;
        try {
            return JSON.parse(String(children).trim());
        } catch (e) {
            return null;
        }
    }, [children, language]);

    const rubiksData = useMemo(() => {
        if (language !== 'rubiks-cube') return null;
        try {
            return JSON.parse(String(children).trim());
        } catch (e) {
            return null;
        }
    }, [children, language]);

    const curriculumPlannerData = useMemo(() => {
        if (language !== 'curriculum_planner') return null;
        try {
            return JSON.parse(String(children).trim());
        } catch (e) {
            return null;
        }
    }, [children, language]);

    if (language === 'rubiks-cube') {
        if (!rubiksData) {
            return (
                <div className="p-6 border border-border bg-bento-card my-4 rounded-[12px] animate-pulse space-y-4">
                    <div className="h-4 bg-muted-foreground/10 rounded w-1/3"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-muted-foreground/10 rounded w-full"></div>
                    </div>
                </div>
            );
        }
        return <RubiksCubeWidget payload={rubiksData} dark={dark} />;
    }

    if (language === 'curriculum_planner') {
        if (!curriculumPlannerData) {
            return (
                <div className="p-6 border border-border bg-bento-card my-4 rounded-[12px] animate-pulse space-y-4">
                    <div className="h-4 bg-muted-foreground/10 rounded w-1/3"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-muted-foreground/10 rounded w-full"></div>
                    </div>
                </div>
            );
        }
        return <CurriculumPlannerCard payload={curriculumPlannerData} />;
    }

    if (language === 'interactive-quiz') {
        if (!quizData) {
            return (
                <div className="p-6 border border-border bg-bento-card my-4 rounded-[12px] animate-pulse space-y-4">
                    <div className="h-4 bg-muted-foreground/10 rounded w-1/3"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-muted-foreground/10 rounded w-full"></div>
                        <div className="h-3 bg-muted-foreground/10 rounded w-5/6"></div>
                    </div>
                </div>
            );
        }

        return (
            <ProvingGroundsPractice
                quizData={quizData}
                notePath={activeNotePath}
                initialQuestionIndex={0}
                onStart={context.onOpenPractice ? () => context.onOpenPractice?.({ quizData, notePath: activeNotePath }) : undefined}
            />
        );
    }

    if (language === 'ater-ui') {
        if (!aterUIData) {
            return (
                <div className="p-6 border border-border bg-bento-card my-4 rounded-[12px] animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-4 bg-muted-foreground/10 rounded w-1/4"></div>
                        <div className="h-4 bg-muted-foreground/10 rounded w-12"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-muted-foreground/10 rounded w-full"></div>
                        <div className="h-3 bg-muted-foreground/10 rounded w-4/5"></div>
                    </div>
                </div>
            );
        }
        return <AterUIBlock payload={aterUIData} notePath={activeNotePath} onSendMessage={activeOnSendMessage} />;
    }

    if (language === 'mermaid') return <MermaidWrapper chart={String(children).replace(/\n$/, '')} />

    // Render ```markdown blocks as actual Markdown documents to support rendered artifact tables
    if (language === 'markdown') {
        return (
            <div className="my-6 p-6 bg-bento-card border border-border/60 rounded-[12px] prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-table:my-0">
                <ReactMarkdown
                    remarkPlugins={MARKDOWN_REMARK_PLUGINS as any}
                    rehypePlugins={MARKDOWN_REHYPE_PLUGINS as any}
                    components={activeComponents}
                >
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
            // Convert standard math environments to block math
            .replace(/\\begin\{(equation|align|gather|math|displaymath|split|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\*?\}/g, () => '\n$$\n')
            .replace(/\\end\{(equation|align|gather|math|displaymath|split|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\*?\}/g, () => '\n$$\n')
            .replace(/\\\[/g, () => '\n$$\n')
            .replace(/\\\]/g, () => '\n$$\n')
            .trim();

        return (
            <div className="my-6 relative group/latex">
                <div className="absolute -top-2 left-4 px-2 bg-background border border-border/50 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/65 z-10">
                    LaTeX Artifact
                </div>
                <div className="p-8 bg-bento-card border border-border/60 rounded-[12px] shadow-sm">
                    <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:my-4">
                        <ReactMarkdown
                            remarkPlugins={MARKDOWN_REMARK_PLUGINS as any}
                            rehypePlugins={MARKDOWN_REHYPE_PLUGINS as any}
                            components={activeComponents}
                        >
                            {mathContent}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    }

    const content = String(children).replace(/\n$/, '');
    const isBlock = !!match || content.includes('\n') || (node?.position && node.position.start.line !== node.position.end.line);

    if (isBlock) {
        return <CodeBlock language={language} value={content} />
    }

    return <code className={cn("bg-muted/30 px-1.5 py-0.5 text-[12px] font-mono text-foreground border border-border/5 font-medium mx-0.5", className)} {...props}>{children}</code>
});

const MarkdownP = ({ node, children, ...props }: any) => {
    const context = React.useContext(MarkdownContext);
    const activeOnNavigate = context.onNavigate || (() => {});
    return (
        <p className="mb-4 leading-relaxed text-[13px] text-foreground/80 antialiased">
            {React.Children.map(children, (child) =>
                typeof child === 'string' ? renderWikiLinks(child, activeOnNavigate) : child
            )}
        </p>
    );
};

const MarkdownH1 = ({ children }: any) => {
    const context = React.useContext(MarkdownContext);
    const activeOnNavigate = context.onNavigate || (() => {});
    return (
        <h1 className="text-2xl font-black mt-10 mb-6 tracking-tighter border-b pb-2 border-border text-foreground break-words">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, activeOnNavigate) : child)}
        </h1>
    );
};

const MarkdownH2 = ({ children }: any) => {
    const context = React.useContext(MarkdownContext);
    const activeOnNavigate = context.onNavigate || (() => {});
    return (
        <h2 className="text-xl font-black mt-8 mb-4 tracking-tight text-foreground break-words">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, activeOnNavigate) : child)}
        </h2>
    );
};

const MarkdownH3 = ({ children }: any) => {
    const context = React.useContext(MarkdownContext);
    const activeOnNavigate = context.onNavigate || (() => {});
    return (
        <h3 className="text-lg font-bold mt-6 mb-3 tracking-tight text-foreground/90 break-words">
            {React.Children.map(children, (child) => typeof child === 'string' ? renderWikiLinks(child, activeOnNavigate) : child)}
        </h3>
    );
};

const MarkdownLi = ({ children, className }: any) => {
    const context = React.useContext(MarkdownContext);
    const activeOnNavigate = context.onNavigate || (() => {});
    const isTask = className?.includes('task-list-item');

    const childrenArray = React.Children.toArray(children);
    const nestedBlocks: any[] = [];
    const inlineContent: any[] = [];

    childrenArray.forEach((child: any) => {
        const tagName = child?.props?.node?.tagName || child?.type;
        if (tagName === 'ul' || tagName === 'ol' || tagName === 'blockquote') {
            nestedBlocks.push(child);
        } else {
            if (typeof child === 'string') {
                inlineContent.push(renderWikiLinks(child, activeOnNavigate));
            } else {
                inlineContent.push(child);
            }
        }
    });

    if (isTask) {
        return (
            <li className="list-none mb-1 group/task">
                <div className="flex items-start gap-2">
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
};

const MarkdownInput = ({ node, type, checked, ...props }: any) => {
    const context = React.useContext(MarkdownContext);
    const activePath = context.path;
    if (type === 'checkbox') {
        return (
            <input
                type="checkbox"
                defaultChecked={checked}
                onChange={async (e) => {
                    if (!activePath) return;
                    const newChecked = e.target.checked;
                    const line = node?.position?.start?.line;
                    if (line) {
                        try {
                            const res = await sidecarApi.readObsidianNote(activePath);
                            const lines = res.content.split('\n');
                            const targetLine = lines[line - 1];
                            if (targetLine && targetLine.match(/\[[ xX]\]/)) {
                                lines[line - 1] = targetLine.replace(/\[[ xX]\]/, `[${newChecked ? 'x' : ' '}]`);
                                const updatedContent = lines.join('\n');
                                await sidecarApi.updateObsidianNote(activePath, updatedContent);

                                const wikilinkMatch = targetLine.match(/\[\[(.*?)\]\]/);
                                if (wikilinkMatch) {
                                    const targetNote = wikilinkMatch[1].split('|')[0];
                                    const targetRes = await sidecarApi.findVaultPage(targetNote);
                                    if (targetRes.path) {
                                        const atomicRes = await sidecarApi.readObsidianNote(targetRes.path);
                                        const newAtomicContent = updateProperty(atomicRes.content, 'read', newChecked);
                                        await sidecarApi.updateObsidianNote(targetRes.path, newAtomicContent);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Failed to toggle markdown checkbox", err);
                        }
                    }
                }}
                aria-label="Toggle task state"
                className="mt-1 size-3.5 shrink-0 appearance-none border border-border bg-bento-card rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3px] after:h-[7px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 cursor-pointer transition-all hover:border-foreground/20"
            />
        );
    }
    return null;
};

interface AterMarkdownProps {
    content: string
    path?: string
    onNavigate?: (page: string) => void
    onSendMessage?: (text: string) => void
    onOpenPractice?: (payload: ProvingGroundsPayload) => void
    className?: string
    components?: any
}

export const AterMarkdown = memo(({ content, path, onNavigate, onSendMessage, onOpenPractice, className, components }: AterMarkdownProps) => {
    const displayContent = useMemo(() => {
        let cleaned = stripArtifactMarkup(content);
        cleaned = cleaned.replace(/(?:(?:\r?\n)+\s*(?:---\s*)?|^\s*)##\s*The\s*Proving\s*Grounds(?:\r?\n)*/i, '\n');
        return cleaned;
    }, [content]);
    const handleNavigate = useCallback((pageName: string) => {
        if (onNavigate) {
            onNavigate(pageName);
        }
    }, [onNavigate]);

    const handleSendMessage = useCallback((text: string) => {
        if (onSendMessage) {
            onSendMessage(text);
        }
    }, [onSendMessage]);

    const markdownComponents = useMemo(() => {
        const comps: any = {
            ...(components || {}),
            p: MarkdownP,
            h1: MarkdownH1,
            h2: MarkdownH2,
            h3: MarkdownH3,
            h4: ({ children }: any) => <h4 className="text-[11px] font-black mt-5 mb-2 uppercase tracking-[0.2em] text-muted-foreground/60">{children}</h4>,
            ul: ({ children, className }: any) => {
                const isTaskList = className?.includes('contains-task-list');
                return <ul className={cn("space-y-1 mb-4 text-[13px] text-foreground", isTaskList ? "list-none pl-8" : "list-disc pl-5")}>{children}</ul>
            },
            ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1 mb-4 text-[13px] text-foreground">{children}</ol>,
            li: MarkdownLi,
            pre: ({ children }: any) => <div className="not-prose">{children}</div>,
            code: CodeRenderer,
            input: MarkdownInput,
            table: ({ children }: any) => (
                <div className="overflow-x-auto my-6 rounded-[8px] border border-border/60">
                    <table className="w-full border-collapse text-[12px]">{children}</table>
                </div>
            ),
            thead: ({ children }: any) => <thead className="bg-muted/30 border-b border-border/60">{children}</thead>,
            tbody: ({ children }: any) => <tbody className="divide-y divide-border/20">{children}</tbody>,
            tr: ({ children }: any) => <tr className="hover:bg-muted/5 transition-none">{children}</tr>,
            th: ({ children }: any) => <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-left border-r border-border/20 last:border-r-0">{children}</th>,
            td: ({ children }: any) => <td className="px-4 py-3 text-foreground/80 border-r border-border/10 last:border-r-0">{children}</td>,
            blockquote: ({ children, node }: any) => {
                let isCallout = false;
                let calloutType = '';

                // Find the first paragraph node in HAST (skipping whitespace/text nodes)
                const firstPara = node?.children?.find((c: any) => c.type === 'element' && c.tagName === 'p');

                if (firstPara) {
                    // Find the first text node in that paragraph
                    const firstTextNode = firstPara.children?.find((c: any) => c.type === 'text');
                    if (firstTextNode && typeof firstTextNode.value === 'string') {
                        const match = firstTextNode.value.trimStart().match(/^\[!(.*?)\]/);
                        if (match) {
                            isCallout = true;
                            calloutType = match[1].toLowerCase();
                        }
                    }
                }

                if (isCallout) {
                    let borderClass = "border-zinc-500 bg-zinc-500/5";
                    let IconComponent = Info;
                    if (['note', 'info'].includes(calloutType)) {
                        borderClass = "border-zinc-400 bg-zinc-400/5";
                        IconComponent = Info;
                    }
                    else if (['warning', 'caution'].includes(calloutType)) {
                        borderClass = "border-zinc-500 bg-zinc-500/10";
                        IconComponent = AlertTriangle;
                    }
                    else if (['danger', 'error', 'bug'].includes(calloutType)) {
                        borderClass = "border-zinc-600 bg-zinc-600/10";
                        IconComponent = ShieldAlert;
                    }
                    else if (['success', 'check', 'done'].includes(calloutType)) {
                        borderClass = "border-zinc-300 bg-zinc-300/10";
                        IconComponent = CheckCircle2;
                    }
                    else if (['question', 'help', 'faq'].includes(calloutType)) {
                        borderClass = "border-zinc-400 bg-zinc-400/10";
                        IconComponent = HelpCircle;
                    }

                    let foundFirstP = false;
                    const processedChildren = React.Children.map(children, (child: any) => {
                        // We look for the first valid React element (likely our custom 'p' component)
                        if (!foundFirstP && React.isValidElement(child)) {
                            foundFirstP = true;
                            const pProps: any = child.props;
                            const pChildren = React.Children.toArray(pProps.children);

                            let title = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
                            let strippedFirstChild = false;

                            const newPChildren = pChildren.map((pChild: any) => {
                                if (!strippedFirstChild && typeof pChild === 'string') {
                                    const trimmed = pChild.trimStart();
                                    const match = trimmed.match(/^\[!(.*?)\](.*)/);
                                    if (match) {
                                        strippedFirstChild = true;
                                        const customTitle = match[2].trim();
                                        if (customTitle) title = customTitle;
                                        return null;
                                    }
                                }
                                return pChild;
                            });

                            return (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px] text-foreground/70">
                                        <IconComponent size={14} className="shrink-0" />
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
                            "my-6 rounded-[8px] border-l-2 p-5 not-prose bg-muted/10",
                            borderClass
                        )}>
                            {processedChildren}
                        </div>
                    );
                }

                return (
                    <blockquote className="border-l-4 border-primary/20 pl-4 italic my-6 text-muted-foreground text-[13px] bg-muted/10 py-3 rounded-[8px]">
                        {children}
                    </blockquote>
                );
            },
            hr: () => <hr className="my-10 border-t border-border" />,
            a: ({ href, children }: any) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-foreground font-medium underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground/80">
                    {children}
                </a>
            )
        };
        return comps;
    }, [components]);

    const contextValue = useMemo(() => ({
        path,
        onNavigate: handleNavigate,
        onSendMessage: handleSendMessage,
        onOpenPractice,
        components: markdownComponents
    }), [path, handleNavigate, handleSendMessage, onOpenPractice, markdownComponents]);

    return (
        <div className={cn("prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 text-foreground select-text cursor-text content-visibility-auto", className)}>
            <MarkdownContext.Provider value={contextValue}>
                <ReactMarkdown
                    remarkPlugins={MARKDOWN_REMARK_PLUGINS as any}
                    rehypePlugins={MARKDOWN_REHYPE_PLUGINS as any}
                    components={markdownComponents}
                >
                    {displayContent}
                </ReactMarkdown>
            </MarkdownContext.Provider>
        </div>
    );
});

export function MarkdownViewer({ content, onNavigate, path, components, noteMode, noteTitle, noteCourse }: MarkdownViewerProps) {
    const onNavigateRef = useRef(onNavigate);
    const [activePractice, setActivePractice] = useState<ProvingGroundsPayload | null>(null);
    useEffect(() => {
        onNavigateRef.current = onNavigate;
    }, [onNavigate]);

    useEffect(() => {
        setActivePractice(null);
    }, [content, path]);

    useEffect(() => {
        if (!path) return;
        try {
            const pendingResume = JSON.parse(localStorage.getItem('ater_pending_practice_resume') || 'null');
            if (pendingResume?.originalPath === path && pendingResume?.quizData) {
                setActivePractice({
                    quizData: pendingResume.quizData,
                    notePath: path,
                    initialQuestionIndex: pendingResume.returnQuestionIndex || 0,
                });
                localStorage.removeItem('ater_pending_practice_resume');
            }
        } catch {
            // Ignore malformed resume state.
        }
    }, [path, content]);

    useEffect(() => {
        const handleOpenRemediation = () => {
            setActivePractice(null);
        };
        window.addEventListener('ater:open-remediation-lesson', handleOpenRemediation);
        window.addEventListener('ater:restore-original-lesson', handleOpenRemediation);
        return () => {
            window.removeEventListener('ater:open-remediation-lesson', handleOpenRemediation);
            window.removeEventListener('ater:restore-original-lesson', handleOpenRemediation);
        };
    }, []);

    const handleNavigate = useCallback((pageName: string) => {
        if (onNavigateRef.current) {
            onNavigateRef.current(pageName);
        }
    }, []);

    // Selection → Explain state
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [selectedText, setSelectedText] = useState('')
    const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarSelection, setSidebarSelection] = useState('')
    const [sidebarContext, setSidebarContext] = useState('')
    const floatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const buildSelectionContext = useCallback((text: string) => {
        const normalizedText = text.trim()
        if (!normalizedText) return ''
        const index = content.indexOf(normalizedText)
        if (index >= 0) {
            const start = Math.max(0, index - 1600)
            const end = Math.min(content.length, index + normalizedText.length + 1600)
            return content.slice(start, end)
        }

        const compactSelection = normalizedText.replace(/\s+/g, ' ')
        const compactContent = content.replace(/\s+/g, ' ')
        const compactIndex = compactContent.indexOf(compactSelection)
        if (compactIndex >= 0) {
            const start = Math.max(0, compactIndex - 1600)
            const end = Math.min(compactContent.length, compactIndex + compactSelection.length + 1600)
            return compactContent.slice(start, end)
        }

        return content.slice(0, 3200)
    }, [content])

    // Use native document listener — React's synthetic onMouseUp fires BEFORE
    // the browser finalises the selection, so getSelection() returns stale data.
    useEffect(() => {
        const onMouseUp = (e: MouseEvent) => {
            if (floatTimerRef.current) clearTimeout(floatTimerRef.current)
            floatTimerRef.current = setTimeout(() => {
                const sel = window.getSelection()
                const text = sel?.toString().trim() || ''
                const wrapper = wrapperRef.current
                if (!wrapper || !sel?.rangeCount) return

                // Only act on selections inside our content wrapper
                const range = sel.getRangeAt(0)
                if (!wrapper.contains(range.commonAncestorContainer)) {
                    setFloatPos(null)
                    setSelectedText('')
                    return
                }

                if (text.length > 3) {
                    const rect = range.getBoundingClientRect()
                    const wRect = wrapper.getBoundingClientRect()
                    // scrollTop accounts for the overflow-y-auto scroll offset
                    const scrollEl = wrapper.querySelector('.overflow-y-auto') as HTMLElement | null
                    const scrollTop = scrollEl ? scrollEl.scrollTop : 0
                    setSelectedText(text)
                    setFloatPos({
                        x: rect.left - wRect.left + rect.width / 2,
                        y: rect.top - wRect.top + scrollTop - 44,
                    })
                } else {
                    setSelectedText('')
                    setFloatPos(null)
                }
            }, 20)
        }
        document.addEventListener('mouseup', onMouseUp)
        return () => {
            document.removeEventListener('mouseup', onMouseUp)
            if (floatTimerRef.current) clearTimeout(floatTimerRef.current)
        }
    }, [])

    const handleClickExplain = useCallback(() => {
        setSidebarSelection(selectedText)
        setSidebarContext(buildSelectionContext(selectedText))
        setSidebarOpen(true)
        setFloatPos(null)
        setSelectedText('')
        window.getSelection()?.removeAllRanges()
    }, [selectedText, buildSelectionContext])

    return (
        <>
            <div
                ref={wrapperRef}
                className="relative h-full flex flex-row bg-transparent text-foreground"
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative select-text">
                    <ErrorBoundary>
                        {activePractice ? (
                            <ProvingGroundsPractice
                                quizData={activePractice.quizData}
                                notePath={activePractice.notePath}
                                initialQuestionIndex={activePractice.initialQuestionIndex || 0}
                                initialStarted
                                onExit={() => setActivePractice(null)}
                            />
                        ) : (
                            <AterMarkdown
                                content={content}
                                path={path}
                                onNavigate={handleNavigate}
                                onOpenPractice={setActivePractice}
                                components={components}
                            />
                        )}
                    </ErrorBoundary>
                </div>

                {/* Floating explain button */}
                {floatPos && selectedText && (
                    <button
                        data-tour="explain-btn"
                        onMouseDown={e => e.preventDefault()}
                        onClick={handleClickExplain}
                        className="absolute z-30 flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/60 shadow-lg rounded-[8px] text-[10px] font-black uppercase tracking-widest text-foreground/70 hover:text-foreground hover:border-foreground/30 hover:bg-muted/10 transition-none"
                        style={{
                            left: Math.max(0, floatPos.x - 60),
                            top: Math.max(0, floatPos.y),
                            pointerEvents: 'all',
                        }}
                    >
                        Explain More
                    </button>
                )}
            </div>

            <ExplainSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                selection={sidebarSelection}
                path={path}
                noteMode={noteMode}
                noteTitle={noteTitle}
                noteCourse={noteCourse}
                scope="selection"
                sourceKind="markdown"
                selectionContext={sidebarContext}
            />
        </>
    )
}
