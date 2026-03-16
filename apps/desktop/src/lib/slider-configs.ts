import type { CustomSliderConfig } from './config-types';

export interface SliderConfig {
    id: string;
    label: string;
    description: string;
    min: number;
    max: number;
    default: number;
    leftLabel: string;
    rightLabel: string;
}

export const STRATEGIST_SLIDERS: SliderConfig[] = [
    {
        id: 'directness',
        label: 'Directness',
        description: 'How bluntly should the AI communicate?',
        min: 1, max: 10, default: 7,
        leftLabel: 'Gentle', rightLabel: 'Blunt',
    },
    {
        id: 'brutality',
        label: 'Tough Love',
        description: 'How harsh should the AI be when you fall short?',
        min: 1, max: 10, default: 5,
        leftLabel: 'Supportive', rightLabel: 'Brutal',
    },
    {
        id: 'detail',
        label: 'Response Detail',
        description: 'How verbose should responses be?',
        min: 1, max: 10, default: 6,
        leftLabel: 'Concise', rightLabel: 'Exhaustive',
    },
    {
        id: 'proactiveness',
        label: 'Proactiveness',
        description: 'How much should the AI push you to act?',
        min: 1, max: 10, default: 7,
        leftLabel: 'Passive', rightLabel: 'Aggressive',
    },
    {
        id: 'accountability',
        label: 'Accountability',
        description: 'How intensely should the AI hold you accountable?',
        min: 1, max: 10, default: 6,
        leftLabel: 'Relaxed', rightLabel: 'Relentless',
    },
    {
        id: 'encouragement',
        label: 'Encouragement',
        description: 'How much should the AI celebrate your wins?',
        min: 1, max: 10, default: 5,
        leftLabel: 'Minimal', rightLabel: 'Enthusiastic',
    },
    {
        id: 'formality',
        label: 'Formality',
        description: 'How formal should the AI\'s tone be?',
        min: 1, max: 10, default: 3,
        leftLabel: 'Casual', rightLabel: 'Formal',
    },
    {
        id: 'structure',
        label: 'Structure',
        description: 'How organized/formatted should responses be?',
        min: 1, max: 10, default: 7,
        leftLabel: 'Free-form', rightLabel: 'Highly Structured',
    },
];

export const CREATOR_SLIDERS: SliderConfig[] = [
    {
        id: 'innovation',
        label: 'Innovation',
        description: 'How "unhinged" or novel should ideas be?',
        min: 1, max: 10, default: 8,
        leftLabel: 'Practical', rightLabel: 'Boundary-pushing',
    },
    {
        id: 'detail',
        label: 'Complexity',
        description: 'How complex should the creative output be?',
        min: 1, max: 10, default: 6,
        leftLabel: 'Simple', rightLabel: 'Intricate',
    },
    {
        id: 'collaboration',
        label: 'Collaboration',
        description: 'How much should the AI lead vs follow your ideas?',
        min: 1, max: 10, default: 7,
        leftLabel: 'Assistant', rightLabel: 'Co-creator',
    },
    {
        id: 'polish',
        label: 'Polish Level',
        description: 'Should the output be raw ideas or finished work?',
        min: 1, max: 10, default: 5,
        leftLabel: 'Conceptual', rightLabel: 'Production-ready',
    },
];

export type SliderValues = Record<string, number>;

export function slidersToPromptFragment(
    slidersJson: string,
    type: 'strategist' | 'creator' | 'custom' = 'strategist',
    customConfig?: CustomSliderConfig[]
): string {
    try {
        const sliders: SliderValues = JSON.parse(slidersJson || '{}');
        const activeConfig = type === 'custom' && customConfig ? customConfig : (type === 'creator' ? CREATOR_SLIDERS : STRATEGIST_SLIDERS);

        const lines: string[] = [];
        lines.push(`${type.toUpperCase()} PARAMETERS:`);

        activeConfig.forEach(s => {
            const val = sliders[s.id] ?? s.default;
            lines.push(`- ${s.label}: ${val}/10 (Range: ${s.leftLabel} to ${s.rightLabel})`);
        });

        return lines.join('\n');
    } catch {
        return '';
    }
}
