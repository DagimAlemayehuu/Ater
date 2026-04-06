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
    aiProvider: string;
    aiApiKey: string;
    aiModel: string;
    plannerProvider: string;
    plannerApiKey: string;
    plannerModel: string;
    utilityProvider: string;
    utilityApiKey: string;
    utilityModel: string;
    obsidianVaultPath: string;
    inboxPath: string;
    autoDeploy: boolean;
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
    aiProvider: 'google',
    aiApiKey: '',
    aiModel: 'gemini-2.0-flash',
    plannerProvider: 'google',
    plannerApiKey: '',
    plannerModel: 'gemini-2.0-flash',
    utilityProvider: 'google',
    utilityApiKey: '',
    utilityModel: 'gemini-1.5-flash-8b',
    obsidianVaultPath: '/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault',
    inboxPath: '',
    autoDeploy: false,
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
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const store = await load(STORE_FILENAME, { autoSave: true, defaults: DEFAULT_CONFIG });

                // Load existing values or use defaults
                const notionApiKey = (await store.get<string>('notionApiKey')) || '';
                const aiProvider = (await store.get<string>('aiProvider')) || DEFAULT_CONFIG.aiProvider;
                const aiApiKey = (await store.get<string>('aiApiKey')) || '';
                const aiModel = (await store.get<string>('aiModel')) || DEFAULT_CONFIG.aiModel;
                
                const plannerProvider = (await store.get<string>('plannerProvider')) || DEFAULT_CONFIG.plannerProvider;
                const plannerApiKey = (await store.get<string>('plannerApiKey')) || '';
                const plannerModel = (await store.get<string>('plannerModel')) || DEFAULT_CONFIG.plannerModel;

                const utilityProvider = (await store.get<string>('utilityProvider')) || DEFAULT_CONFIG.utilityProvider;
                const utilityApiKey = (await store.get<string>('utilityApiKey')) || '';
                const utilityModel = (await store.get<string>('utilityModel')) || DEFAULT_CONFIG.utilityModel;

                let obsidianVaultPath = await store.get<string>('obsidianVaultPath');
                if (!obsidianVaultPath || obsidianVaultPath.trim() === '') {
                    obsidianVaultPath = '/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault';
                    await store.set('obsidianVaultPath', obsidianVaultPath);
                    await store.save();
                }
                const inboxPath = (await store.get<string>('inboxPath')) || '';
                const autoDeploy = (await store.get<boolean>('autoDeploy')) ?? false;
                const profilePersonal = (await store.get<string>('profilePersonal')) || DEFAULT_CONFIG.profilePersonal;
                const profileAcademic = (await store.get<string>('profileAcademic')) || DEFAULT_CONFIG.profileAcademic;
                const profileFinancial = (await store.get<string>('profileFinancial')) || DEFAULT_CONFIG.profileFinancial;
                const profileFitness = (await store.get<string>('profileFitness')) || DEFAULT_CONFIG.profileFitness;
                const profileMasterPlan = (await store.get<string>('profileMasterPlan')) || DEFAULT_CONFIG.profileMasterPlan;
                const strategistPrompt = (await store.get<string>('strategistPrompt')) || DEFAULT_CONFIG.strategistPrompt;
                const strategistSliders = (await store.get<string>('strategistSliders')) || '';
                const creatorPrompt = (await store.get<string>('creatorPrompt')) || DEFAULT_CONFIG.creatorPrompt;
                const creatorSliders = (await store.get<string>('creatorSliders')) || DEFAULT_CONFIG.creatorSliders;
                const customPersonas = (await store.get<CustomPersona[]>('customPersonas')) || [];

                const loadedConfig: any = {
                    notionApiKey,
                    aiProvider,
                    aiApiKey,
                    aiModel,
                    plannerProvider,
                    plannerApiKey,
                    plannerModel,
                    utilityProvider,
                    utilityApiKey,
                    utilityModel,
                    obsidianVaultPath,
                    inboxPath,
                    autoDeploy,
                    profilePersonal,
                    profileAcademic,
                    profileFinancial,
                    profileFitness,
                    profileMasterPlan,
                    strategistPrompt,
                    strategistSliders,
                    creatorPrompt,
                    creatorSliders,
                    customPersonas,
                };

                setConfig(loadedConfig);
            } catch (err) {
                console.error('[Config] Failed to initialize store:', err);
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
            const updatedConfig = { ...config, ...newConfig } as any;

            // Update store for keys present in newConfig
            for (const key of Object.keys(newConfig)) {
                await store.set(key, (newConfig as any)[key]);
            }

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
        config?.aiApiKey &&
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
