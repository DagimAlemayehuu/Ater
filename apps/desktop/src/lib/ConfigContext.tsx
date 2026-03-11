/**
 * Life OS - Configuration Context
 * 
 * Manages secure storage of API keys and paths via Tauri Store.
 * Provides global state for the app and identifies if onboarding is required.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { load } from '@tauri-apps/plugin-store';

import DEFAULT_PROFILE_PERSONAL from '@/templates/profiles/personal.md?raw';
import DEFAULT_PROFILE_ACADEMIC from '@/templates/profiles/academic.md?raw';
import DEFAULT_PROFILE_FINANCIAL from '@/templates/profiles/financial.md?raw';
import DEFAULT_PROFILE_FITNESS from '@/templates/profiles/fitness.md?raw';
import DEFAULT_PROFILE_MASTER_PLAN from '@/templates/profiles/master_plan.md?raw';

import DEFAULT_SYSTEM_PROMPT_STRATEGIST from '@/templates/system-prompts/strategist.md?raw';
import DEFAULT_SYSTEM_PROMPT_CREATOR from '@/templates/system-prompts/creator.md?raw';

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
    [key: string]: any;
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
    customPersonas: CustomPersona[];
    geminiModel: string;
}

interface ConfigContextType {
    config: AppConfig | null;
    isLoading: boolean;
    isConfigured: boolean;
    saveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
    addCustomPersona: (p: CustomPersona) => void;
    updateCustomPersona: (id: string, updates: Partial<CustomPersona>) => void;
    deleteCustomPersona: (id: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const STORE_FILENAME = 'life-os-config.json';
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
    customPersonas: [],
    geminiModel: 'gemini-2.5-flash',
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const store = await load(STORE_FILENAME, { autoSave: true, defaults: DEFAULT_CONFIG });

                // Load existing values or use defaults
                const notionKey = (await store.get<string>('notionApiKey')) || '';
                const geminiKey = (await store.get<string>('geminiApiKey')) || '';
                const vaultPath = (await store.get<string>('obsidianVaultPath')) || '';
                const pPersonal = (await store.get<string>('profilePersonal')) || DEFAULT_CONFIG.profilePersonal;
                const pAcademic = (await store.get<string>('profileAcademic')) || DEFAULT_CONFIG.profileAcademic;
                const pFinancial = (await store.get<string>('profileFinancial')) || DEFAULT_CONFIG.profileFinancial;
                const pFitness = (await store.get<string>('profileFitness')) || DEFAULT_CONFIG.profileFitness;
                const pMasterPlan = (await store.get<string>('profileMasterPlan')) || DEFAULT_CONFIG.profileMasterPlan;
                const sPrompt = (await store.get<string>('strategistPrompt')) || DEFAULT_CONFIG.strategistPrompt;
                const sSliders = (await store.get<string>('strategistSliders')) || '';
                const cPrompt = (await store.get<string>('creatorPrompt')) || DEFAULT_CONFIG.creatorPrompt;
                const cSliders = (await store.get<string>('creatorSliders')) || DEFAULT_CONFIG.creatorSliders;
                const customP = (await store.get<CustomPersona[]>('customPersonas')) || [];
                const gModel = (await store.get<string>('geminiModel')) || DEFAULT_CONFIG.geminiModel;

                setConfig({
                    notionApiKey: notionKey,
                    geminiApiKey: geminiKey,
                    obsidianVaultPath: vaultPath,
                    profilePersonal: pPersonal,
                    profileAcademic: pAcademic,
                    profileFinancial: pFinancial,
                    profileFitness: pFitness,
                    profileMasterPlan: pMasterPlan,
                    strategistPrompt: sPrompt,
                    strategistSliders: sSliders,
                    creatorPrompt: cPrompt,
                    creatorSliders: cSliders,
                    customPersonas: customP,
                    geminiModel: gModel,
                });
            } catch (err) {
                console.error('[Config] Failed to initialize store:', err);
                // Fallback to empty config if store fails
                setConfig(DEFAULT_CONFIG);
            } finally {
                setIsLoading(false);
            }
        };

        initStore();
    }, []);

    const saveConfig = async (newConfig: Partial<AppConfig>) => {
        if (!config) return;

        try {
            const store = await load(STORE_FILENAME, { autoSave: true, defaults: DEFAULT_CONFIG });

            const updatedConfig = { ...config, ...newConfig } as AppConfig;

            // Save to store
            if (newConfig.notionApiKey !== undefined) await store.set('notionApiKey', newConfig.notionApiKey);
            if (newConfig.geminiApiKey !== undefined) await store.set('geminiApiKey', newConfig.geminiApiKey);
            if (newConfig.obsidianVaultPath !== undefined) await store.set('obsidianVaultPath', newConfig.obsidianVaultPath);
            if (newConfig.profilePersonal !== undefined) await store.set('profilePersonal', newConfig.profilePersonal);
            if (newConfig.profileAcademic !== undefined) await store.set('profileAcademic', newConfig.profileAcademic);
            if (newConfig.profileFinancial !== undefined) await store.set('profileFinancial', newConfig.profileFinancial);
            if (newConfig.profileFitness !== undefined) await store.set('profileFitness', newConfig.profileFitness);
            if (newConfig.profileMasterPlan !== undefined) await store.set('profileMasterPlan', newConfig.profileMasterPlan);
            if (newConfig.strategistPrompt !== undefined) await store.set('strategistPrompt', newConfig.strategistPrompt);
            if (newConfig.strategistSliders !== undefined) await store.set('strategistSliders', newConfig.strategistSliders);
            if (newConfig.creatorPrompt !== undefined) await store.set('creatorPrompt', newConfig.creatorPrompt);
            if (newConfig.creatorSliders !== undefined) await store.set('creatorSliders', newConfig.creatorSliders);
            if (newConfig.customPersonas !== undefined) await store.set('customPersonas', newConfig.customPersonas);
            if (newConfig.geminiModel !== undefined) await store.set('geminiModel', newConfig.geminiModel);

            await store.save();
            setConfig(updatedConfig);
            console.log('[Config] Store updated successfully.');
        } catch (err) {
            console.error('[Config] Failed to save to store:', err);
            throw err;
        }
    };

    const isConfigured = Boolean(
        config?.notionApiKey &&
        config?.geminiApiKey &&
        config?.obsidianVaultPath
    );

    const addCustomPersona = async (p: CustomPersona) => {
        if (!config) return;
        const updatedPersonas = [...(config.customPersonas || []), p];
        await saveConfig({ customPersonas: updatedPersonas });
    };

    const updateCustomPersona = async (id: string, updates: Partial<CustomPersona>) => {
        if (!config) return;
        const updatedPersonas = config.customPersonas.map(persona =>
            persona.id === id ? { ...persona, ...updates } : persona
        );
        await saveConfig({ customPersonas: updatedPersonas });
    };

    const deleteCustomPersona = async (id: string) => {
        if (!config) return;
        const updatedPersonas = config.customPersonas.filter(persona => persona.id !== id);
        await saveConfig({ customPersonas: updatedPersonas });
    };

    return (
        <ConfigContext.Provider value={{
            config,
            isLoading,
            isConfigured,
            saveConfig,
            addCustomPersona,
            updateCustomPersona,
            deleteCustomPersona
        }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
