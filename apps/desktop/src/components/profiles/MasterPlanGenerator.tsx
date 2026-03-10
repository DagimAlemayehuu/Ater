import React, { useState, useCallback } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfig } from '@/lib/ConfigContext';
import { sidecarApi } from '@/lib/sidecarApi';
import { MASTER_PLAN_SCHEMA } from './schemas';

interface MasterPlanGeneratorProps {
    onComplete: (markdown: string) => void;
    onCancel: () => void;
}

const GENERATION_QUESTIONS = [
    {
        id: 'timeframe',
        label: 'Planning Horizon',
        question: 'What time period should this master plan cover?',
        placeholder: 'e.g., Next 12 months, Next 2 years, 2026-2027',
    },
    {
        id: 'top_priority',
        label: 'Top Priority',
        question: 'What is the single most important area of your life to improve right now?',
        placeholder: 'e.g., Academic performance, Financial independence, Physical fitness',
    },
    {
        id: 'biggest_obstacle',
        label: 'Biggest Obstacle',
        question: 'What is the single biggest thing holding you back from achieving your goals?',
        placeholder: 'e.g., Procrastination, Lack of clear direction, Time management',
    },
    {
        id: 'daily_hours',
        label: 'Available Hours',
        question: 'How many focused hours per day can you realistically dedicate to self-improvement?',
        placeholder: 'e.g., 3-4 hours, 6 hours on weekdays, 2 hours',
    },
    {
        id: 'non_negotiables',
        label: 'Non-Negotiables',
        question: 'What are 2-3 daily habits you absolutely will not skip?',
        placeholder: 'e.g., Morning workout, 2 hours of focused study, 8 hours sleep',
    },
    {
        id: 'dream_outcome',
        label: 'Dream Outcome',
        question: 'If this plan works perfectly, what does your life look like at the end of it?',
        placeholder: 'Describe your ideal outcome in vivid detail...',
    },
];

const MasterPlanGenerator: React.FC<MasterPlanGeneratorProps> = ({ onComplete, onCancel }) => {
    const { config } = useConfig();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const currentQ = GENERATION_QUESTIONS[currentStep];
    const isLastStep = currentStep === GENERATION_QUESTIONS.length - 1;
    const canProceed = (answers[currentQ?.id] || '').trim().length > 0;

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        setGenerationError(null);

        try {
            // Build context from all profiles
            const profiles = [
                config?.profilePersonal ? `## Personal Profile\n${config.profilePersonal}` : '',
                config?.profileAcademic ? `## Academic Profile\n${config.profileAcademic}` : '',
                config?.profileFinancial ? `## Financial Profile\n${config.profileFinancial}` : '',
                config?.profileFitness ? `## Fitness Profile\n${config.profileFitness}` : '',
            ].filter(Boolean).join('\n\n---\n\n');

            const userAnswers = GENERATION_QUESTIONS.map(q =>
                `- ${q.label}: ${answers[q.id] || 'Not specified'}`
            ).join('\n');

            const schemaSections = MASTER_PLAN_SCHEMA.map(s =>
                `### ${s.title}\n${s.fields.map(f => `- ${f.label}: [to be filled]`).join('\n')}`
            ).join('\n\n');

            const prompt = `You are a world-class life strategist and personal coach. Based on the user's detailed profile data and their answers to key planning questions, generate a comprehensive, actionable Master Plan.

USER'S PROFILE DATA:
${profiles || 'No profile data available yet.'}

USER'S PLANNING ANSWERS:
${userAnswers}

REQUIRED OUTPUT FORMAT (fill every field with specific, actionable content):
${schemaSections}

RULES:
1. Every field must be filled with specific, personalized content based on the user's data
2. Be direct, specific, and actionable — no vague platitudes
3. Quarterly plans should have measurable milestones
4. Non-negotiables should be realistic given the user's available hours
5. Output ONLY the markdown content in the exact schema format above, starting with "## Master Plan"
6. Each field value should be after the colon on the same line (e.g., "- Mission Statement: Your specific mission here")
7. Do not use bold or formatting within field values`;

            const result = await sidecarApi.brainstorm(prompt);
            onComplete(result.response);
        } catch (err: any) {
            setGenerationError(err.message || 'Failed to generate master plan');
        } finally {
            setIsGenerating(false);
        }
    }, [answers, config, onComplete]);

    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Loader2 size={28} className="text-primary animate-spin" />
                    </div>
                    <Sparkles size={14} className="absolute -top-1 -right-1 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Generating Your Master Plan</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Analyzing your profiles and crafting a personalized strategic roadmap...
                    </p>
                </div>
                <div className="flex gap-1 mt-4">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (generationError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Generation Failed</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">{generationError}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="px-4 py-2 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-10">
                <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                    Question {currentStep + 1} of {GENERATION_QUESTIONS.length}
                </span>
                <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary/40 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / GENERATION_QUESTIONS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="space-y-2 mb-8">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {currentQ.label}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {currentQ.question}
                </h2>
            </div>

            {/* Input */}
            <textarea
                value={answers[currentQ.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder={currentQ.placeholder}
                className="w-full bg-muted/10 border border-border/40 rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-muted-foreground/30 resize-none min-h-[120px] leading-relaxed"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && canProceed) {
                        e.preventDefault();
                        if (isLastStep) handleGenerate();
                        else setCurrentStep(s => s + 1);
                    }
                }}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
                <div className="flex gap-2">
                    {GENERATION_QUESTIONS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentStep(idx)}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                idx === currentStep ? "bg-primary w-4" : (answers[GENERATION_QUESTIONS[idx].id] ? "bg-primary/30" : "bg-muted-foreground/20")
                            )}
                        />
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => currentStep === 0 ? onCancel() : setCurrentStep(s => s - 1)}
                        className="px-4 py-2 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted border border-border/40 transition-all flex items-center gap-1.5"
                    >
                        <ChevronLeft size={12} />
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </button>

                    {isLastStep ? (
                        <button
                            disabled={!canProceed}
                            onClick={handleGenerate}
                            className="px-5 py-2 bg-foreground text-background rounded-lg text-[11px] font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-30 shadow-sm"
                        >
                            <Wand2 size={12} />
                            Generate Plan
                        </button>
                    ) : (
                        <button
                            disabled={!canProceed}
                            onClick={() => setCurrentStep(s => s + 1)}
                            className="px-5 py-2 bg-foreground text-background rounded-lg text-[11px] font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-30 shadow-sm"
                        >
                            Continue
                            <ChevronRight size={12} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterPlanGenerator;
