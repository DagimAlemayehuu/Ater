import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    FileText,
    LayoutGrid,
    Sparkles,
    ArrowRight,
    RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    parseMarkdownToProfileData,
    profileDataToMarkdown,
    type ProfileSection,
    type ProfileField,
    type ProfileData
} from './ProfileDataMapper';

interface ProfileEditorProps {
    id: string;
    title: string;
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    schema?: ProfileSection[];
}

/* ────────────────────────────────────────────────────────────
 *  Flatten schema into a single question list for onboarding
 * ──────────────────────────────────────────────────────────── */
interface FlatQuestion {
    sectionIndex: number;
    fieldIndex: number;
    sectionTitle: string;
    label: string;
    question: string;
    value: string;
}

function flattenSchema(sections: ProfileSection[]): FlatQuestion[] {
    const flat: FlatQuestion[] = [];
    if (!sections || !Array.isArray(sections)) return flat;

    sections.forEach((s, sIdx) => {
        if (!s || !s.fields || !Array.isArray(s.fields)) return;
        s.fields.forEach((f, fIdx) => {
            if (!f) return;
            flat.push({
                sectionIndex: sIdx,
                fieldIndex: fIdx,
                sectionTitle: s.title || 'Untitled Section',
                label: f.label || 'Untitled Field',
                question: f.question || f.label || 'Please provide an answer',
                value: f.value || '',
            });
        });
    });
    return flat;
}

/* ══════════════════════════════════════════════════════════════
 *  ONBOARDING WIZARD — one question at a time
 * ══════════════════════════════════════════════════════════════ */

function OnboardingWizard({
    profileData,
    onFieldChange,
    onComplete,
}: {
    profileData: ProfileData;
    onFieldChange: (sIdx: number, fIdx: number, value: string) => void;
    onComplete: () => void;
}) {
    const questions = useMemo(() => flattenSchema(profileData.sections), [profileData.sections]);
    const [current, setCurrent] = useState(0);
    const [localAnswer, setLocalAnswer] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const total = questions.length;

    // When current question changes, focus input
    useEffect(() => {
        // Auto-focus
        const timer = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
    }, [current]);

    const saveAndGo = (direction: 'next' | 'prev') => {
        const q = questions[current];
        if (q) {
            onFieldChange(q.sectionIndex, q.fieldIndex, localAnswer);
        }

        if (direction === 'next') {
            if (current < total - 1) {
                const nextQ = questions[current + 1];
                setLocalAnswer(nextQ.value || '');
                setCurrent(c => c + 1);
            } else {
                onComplete();
            }
        } else {
            if (current > 0) {
                const prevQ = questions[current - 1];
                setLocalAnswer(prevQ.value || '');
                setCurrent(c => c - 1);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveAndGo('next');
        }
    };

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 animate-in fade-in duration-500 bg-muted/5 rounded-[2rem] border border-dashed border-border/30">
                <div className="p-4 rounded-2xl bg-muted/40 text-muted-foreground/30">
                    <LayoutGrid size={32} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight">No Questions Available</h3>
                    <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">The schema for this profile has not been initialized or is empty.</p>
                </div>
                <button
                    onClick={onComplete}
                    className="px-6 py-3 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                    Return to Overview
                </button>
            </div>
        );
    }

    const q = questions[current];
    const progress = ((current + 1) / total) * 100;
    const isLastQuestion = current === total - 1;

    // Find section boundaries for the progress dots
    const currentSectionTitle = q.sectionTitle;

    return (
        <div className="flex flex-col h-full min-h-[500px] animate-in fade-in duration-500">
            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                        {currentSectionTitle}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground/40 tabular-nums">
                        {current + 1} / {total}
                    </span>
                </div>
                <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-foreground/60 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question area */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full">
                {/* Label chip */}
                <div className="px-3 py-1 rounded-full bg-muted/40 border border-border/30 mb-5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {q.label}
                    </span>
                </div>

                {/* Question */}
                <h2 className="text-xl font-bold text-foreground text-center leading-snug mb-8 tracking-tight">
                    {q.question}
                </h2>

                {/* Answer input */}
                <div className="w-full">
                    <textarea
                        ref={inputRef}
                        value={localAnswer}
                        onChange={e => setLocalAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer..."
                        className="w-full h-[160px] bg-muted/20 border border-border/40 rounded-2xl px-6 py-5 text-foreground text-sm leading-relaxed outline-none focus:border-primary/30 placeholder:text-muted-foreground/20 resize-none transition-all duration-200 shadow-inner"
                    />
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3 mt-8 w-full">
                    <button
                        onClick={() => saveAndGo('prev')}
                        disabled={current === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-20 disabled:pointer-events-none border border-transparent hover:border-border/40"
                    >
                        <ChevronLeft size={14} />
                        Back
                    </button>

                    <div className="flex-1" />

                    {localAnswer.trim() === '' && !isLastQuestion && (
                        <button
                            onClick={() => saveAndGo('next')}
                            className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground transition-all"
                        >
                            Skip
                        </button>
                    )}

                    <button
                        onClick={() => saveAndGo('next')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 transition-all duration-200"
                    >
                        {isLastQuestion ? (
                            <>
                                <Sparkles size={13} />
                                Complete
                            </>
                        ) : (
                            <>
                                Next
                                <ArrowRight size={13} />
                            </>
                        )}
                    </button>
                </div>

                {/* Keyboard hint */}
                <p className="text-[10px] text-muted-foreground/30 mt-4">
                    Press <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] font-mono border border-border/30">Enter</kbd> to continue · <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] font-mono border border-border/30">Shift+Enter</kbd> for new line
                </p>
            </div>
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════
 *  OVERVIEW VIEW — clean grid to edit everything
 * ══════════════════════════════════════════════════════════════ */

function OverviewView({
    profileData,
    onFieldChange,
    value,
    onChange,
}: {
    profileData: ProfileData;
    onFieldChange: (sIdx: number, fIdx: number, value: string) => void;
    value: string;
    onChange: (v: string) => void;
}) {
    const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
    const hasSections = profileData.sections.length > 0;

    // Compute completion stats 
    const totalFields = profileData.sections.reduce((acc, s) => acc + s.fields.length, 0);
    const filledFields = profileData.sections.reduce((acc, s) => acc + s.fields.filter(f => f.value.trim()).length, 0);
    const completionPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    return (
        <div className="flex flex-col h-full min-h-[500px] animate-in fade-in duration-300">
            {/* Header bar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/30">
                {/* Completion indicator */}
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9">
                        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                            <circle
                                cx="18" cy="18" r="15" fill="none"
                                stroke={completionPct === 100 ? 'hsl(142 71% 45%)' : 'hsl(var(--foreground))'}
                                strokeWidth="2.5"
                                strokeDasharray={`${completionPct * 0.942} 100`}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-foreground">
                            {completionPct}%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-foreground">{filledFields} of {totalFields} fields</p>
                        <p className="text-[10px] text-muted-foreground">
                            {completionPct === 100 ? 'Profile complete' : 'Fill in remaining fields'}
                        </p>
                    </div>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/30">
                    <button
                        onClick={() => setViewMode('structured')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all",
                            viewMode === 'structured' ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid size={11} />
                        Fields
                    </button>
                    <button
                        onClick={() => setViewMode('raw')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all",
                            viewMode === 'raw' ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <FileText size={11} />
                        Markdown
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-auto custom-scrollbar pb-8">
                {viewMode === 'raw' ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-[600px] bg-muted/10 border border-border/30 rounded-xl p-6 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-border transition-all font-mono text-xs leading-relaxed resize-none"
                    />
                ) : hasSections ? (
                    <div className="space-y-8">
                        {profileData.sections.map((section, sIdx) => {
                            const sectionFilled = section.fields.filter(f => f.value.trim()).length;
                            const sectionTotal = section.fields.length;
                            return (
                                <div key={section.title} className="animate-in fade-in duration-300" style={{ animationDelay: `${sIdx * 50}ms` }}>
                                    {/* Section header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase">
                                            {section.title}
                                        </h3>
                                        <div className="h-px flex-1 bg-border/20" />
                                        <span className="text-[9px] font-semibold text-muted-foreground/30 tabular-nums">
                                            {sectionFilled}/{sectionTotal}
                                        </span>
                                    </div>

                                    {/* Fields grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {section.fields.map((field, fIdx) => (
                                            <FieldCard
                                                key={`${sIdx}-${fIdx}`}
                                                field={field}
                                                onChange={(val) => onFieldChange(sIdx, fIdx, val)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                        <LayoutGrid size={32} className="text-muted-foreground/30" />
                        <p className="text-xs font-bold text-foreground uppercase tracking-widest">No Data Yet</p>
                        <p className="text-[10px] text-muted-foreground">Start the onboarding to fill in your profile.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Individual field card ── */
function FieldCard({ field, onChange }: { field: ProfileField; onChange: (val: string) => void }) {
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasValue = field.value.trim().length > 0;

    // Static size: removed auto-resize
    useEffect(() => {
        // No-op for static height
    }, [field.value]);

    return (
        <div
            className={cn(
                "relative flex flex-col p-4 rounded-xl border transition-all duration-200 h-[140px] overflow-hidden",
                isFocused
                    ? "border-foreground/15 bg-muted/10"
                    : "border-border/30 bg-transparent hover:border-border/50"
            )}
        >
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {field.label}
                </span>
                {hasValue && (
                    <CheckCircle2 size={11} className="text-green-500/50" />
                )}
            </div>

            {field.question && (
                <p className="text-[10px] text-muted-foreground/40 mb-2 leading-tight font-medium">
                    {field.question}
                </p>
            )}

            <textarea
                ref={textareaRef}
                value={field.value}
                placeholder="—"
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full flex-1 bg-transparent border-none p-0 text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/15 resize-none font-medium leading-relaxed custom-scrollbar overflow-y-auto"
            />
        </div>
    );
}


/* ══════════════════════════════════════════════════════════════
 *  MAIN PROFILE EDITOR — orchestrates Onboarding vs Overview
 * ══════════════════════════════════════════════════════════════ */

const ProfileEditor: React.FC<ProfileEditorProps> = ({ id, title, value, onChange, schema }) => {
    // Determine if we should start in onboarding mode
    const [mode, setMode] = useState<'onboarding' | 'overview'>(() => {
        // Use a simple check for empty/template markdown
        const hasValues = value.match(/^[-*]\s+.+?:\s*[^\s-].*$/m);
        return (!hasValues && schema && schema.length > 0) ? 'onboarding' : 'overview';
    });

    // Local mutable copy of profile data
    const [localData, setLocalData] = useState<ProfileData | null>(null);
    const lastSyncedMarkdown = useRef<string>('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const normalize = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    const buildProfileData = useCallback((rawValue: string): ProfileData => {
        try {
            const parsed = parseMarkdownToProfileData(rawValue, title);
            const totalParsedFields = parsed.sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0);

            // If we have no fields parsed, or the markdown is basically empty/garbage that doesn't match schema
            if ((totalParsedFields === 0 || !rawValue || rawValue.trim() === '') && schema) {
                return {
                    title: title,
                    sections: JSON.parse(JSON.stringify(schema)),
                    extraContent: ''
                };
            }

            // Fallback: If parsed successfully but resulted in 0 sections for some reason (rare)
            if (parsed.sections.length === 0 && schema) {
                return {
                    title: title,
                    sections: JSON.parse(JSON.stringify(schema)),
                    extraContent: ''
                };
            }

            if (schema && parsed.sections) {
                // Ensure we don't have empty sections if schema exists
                if (parsed.sections.length === 0) {
                    parsed.sections = JSON.parse(JSON.stringify(schema));
                }

                parsed.sections = parsed.sections.map((section: ProfileSection) => {
                    if (!section) return section;
                    const normalizedTitle = normalize(section.title);
                    const schemaSection = schema.find((s: ProfileSection) => {
                        const sn = normalize(s.title);
                        return sn === normalizedTitle || normalizedTitle.includes(sn) || sn.includes(normalizedTitle);
                    });
                    if (schemaSection && section.fields) {
                        section.fields = section.fields.map((field: ProfileField) => {
                            if (!field) return field;
                            const normalizedLabel = normalize(field.label);
                            const schemaField = schemaSection.fields.find((f: ProfileField) => {
                                const fn = normalize(f.label);
                                return fn === normalizedLabel || normalizedLabel.includes(fn) || fn.includes(normalizedLabel);
                            });
                            if (schemaField) {
                                return { ...field, question: schemaField.question };
                            }
                            return field;
                        });
                    }
                    return section;
                });
            }

            return parsed;
        } catch (error) {
            console.error('Error building profile data:', error);
            return {
                title,
                sections: schema ? JSON.parse(JSON.stringify(schema)) : [],
                extraContent: ''
            };
        }
    }, [title, schema]);

    // Update local data when markdown value changes from parent
    useEffect(() => {
        if (value === lastSyncedMarkdown.current) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalData(buildProfileData(value));
    }, [value, buildProfileData]);

    const syncToParent = useCallback((data: ProfileData) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const md = profileDataToMarkdown(data);
            lastSyncedMarkdown.current = md;
            onChange(md);
        }, 600);
    }, [onChange]);

    const handleFieldChange = useCallback((sectionIndex: number, fieldIndex: number, newValue: string) => {
        setLocalData(prev => {
            if (!prev) return prev;
            const updated: ProfileData = {
                ...prev,
                sections: prev.sections.map((s, sIdx) => {
                    if (sIdx !== sectionIndex) return s;
                    return {
                        ...s,
                        fields: s.fields.map((f, fIdx) => {
                            if (fIdx !== fieldIndex) return f;
                            return { ...f, value: newValue };
                        })
                    };
                })
            };
            syncToParent(updated);
            return updated;
        });
    }, [syncToParent]);

    const profileData = localData || buildProfileData(value);

    // Determine if profile has data
    const hasData = profileData.sections.some(s => s.fields.some(f => f.value.trim()));

    // Suggest onboarding only if we explicitly switched to overview but have no data
    const showOnboardingSuggestion = !hasData && schema && schema.length > 0 && mode === 'overview';

    return (
        <div id={`editor-${id}`} className="flex flex-col h-full">
            {/* Mode header (only show when there's data or in overview) */}
            {hasData && mode === 'overview' && (
                <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={() => setMode('onboarding')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-border/30"
                    >
                        <RotateCcw size={11} />
                        Re-do Onboarding
                    </button>
                </div>
            )}

            {/* Empty state with onboarding prompt */}
            {showOnboardingSuggestion && mode === 'overview' && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in duration-500">
                    <div className="p-5 rounded-2xl bg-muted/30 border border-border/30">
                        <Sparkles size={28} className="text-foreground/40" />
                    </div>
                    <div className="text-center max-w-sm space-y-2">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Set Up Your Profile</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Answer a few questions one at a time to build your {title.toLowerCase()} profile. This data powers your AI strategist.
                        </p>
                    </div>
                    <button
                        onClick={() => setMode('onboarding')}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                        <Sparkles size={14} />
                        Start Onboarding
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Onboarding mode */}
            {mode === 'onboarding' && (
                <OnboardingWizard
                    profileData={profileData}
                    onFieldChange={handleFieldChange}
                    onComplete={() => setMode('overview')}
                />
            )}

            {/* Overview mode (only when there's data or user explicitly entered overview) */}
            {mode === 'overview' && (hasData || !showOnboardingSuggestion) && (
                <OverviewView
                    profileData={profileData}
                    onFieldChange={handleFieldChange}
                    value={value}
                    onChange={onChange}
                />
            )}
        </div>
    );
};

export default ProfileEditor;
