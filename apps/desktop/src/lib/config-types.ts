import DEFAULT_PROFILE_PERSONAL from '@/templates/profiles/personal.md?raw';
import DEFAULT_PROFILE_ACADEMIC from '@/templates/profiles/academic.md?raw';
import DEFAULT_PROFILE_FINANCIAL from '@/templates/profiles/financial.md?raw';
import DEFAULT_PROFILE_FITNESS from '@/templates/profiles/fitness.md?raw';
import DEFAULT_PROFILE_MASTER_PLAN from '@/templates/profiles/master_plan.md?raw';

import DEFAULT_SYSTEM_PROMPT_STRATEGIST from '@/templates/system-prompts/strategist.md?raw';
import DEFAULT_SYSTEM_PROMPT_CREATOR from '@/templates/system-prompts/creator.md?raw';
import DEFAULT_SYSTEM_PROMPT_OKA from '@/templates/system-prompts/oka.md?raw';

export interface CustomSliderConfig {
    id: string;
    label: string;
    description: string;
    min: number;
    max: number;
    default: number;
    leftLabel: string;
    rightLabel: string;
}

export interface CustomPersona {
    id: string;
    name: string;
    description: string;
    icon: string;
    prompt: string;
    slidersConfig: CustomSliderConfig[];
    slidersValues: Record<string, number>;
}

export interface AppConfig {
    notionApiKey: string;
    geminiApiKey: string;
    obsidianVaultPath: string;
    profilePersonal: string;
    profileAcademic: string;
    profileFinancial: string;
    profileFitness: string;
    profileMasterPlan: string;
    strategistPrompt: string;
    strategistSliders: string;
    creatorPrompt: string;
    creatorSliders: string;
    okaPrompt: string;
    customPersonas: CustomPersona[];
    geminiModel: string;
}

export const DEFAULT_CONFIG: AppConfig = {
    notionApiKey: '',
    geminiApiKey: '',
    obsidianVaultPath: '',
    profilePersonal: DEFAULT_PROFILE_PERSONAL,
    profileAcademic: DEFAULT_PROFILE_ACADEMIC,
    profileFinancial: DEFAULT_PROFILE_FINANCIAL,
    profileFitness: DEFAULT_PROFILE_FITNESS,
    profileMasterPlan: DEFAULT_PROFILE_MASTER_PLAN,
    strategistPrompt: DEFAULT_SYSTEM_PROMPT_STRATEGIST,
    strategistSliders: '',
    creatorPrompt: DEFAULT_SYSTEM_PROMPT_CREATOR,
    creatorSliders: JSON.stringify({ innovation: 8, detail: 6, collaboration: 7, polish: 5 }),
    okaPrompt: DEFAULT_SYSTEM_PROMPT_OKA,
    customPersonas: [],
    geminiModel: 'gemini-2.5-flash',
};
