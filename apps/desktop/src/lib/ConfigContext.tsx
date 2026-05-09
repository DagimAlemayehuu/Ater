/**
 * Life OS - Configuration Context
 * 
 * Manages secure storage of API keys and paths via Tauri Store.
 * Provides global state for the app and identifies if onboarding is required.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { load } from '@tauri-apps/plugin-store';

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

export interface SavedApiKey {
    id: string;
    name: string;
    key: string;
    provider: string;
}

export interface AppConfig {
  [key: string]: any;
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
    academicFolderPath: string;
    autoDeploy: boolean;
    strategistPrompt: string;
    strategistSliders: string;
    creatorPrompt: string;
    creatorSliders: string;
    customPersonas: CustomPersona[];
    savedApiKeys: SavedApiKey[];
    showProperties: boolean;
}

interface ConfigContextType {
    config: AppConfig | null;
    isLoading: boolean;
    isConfigured: boolean;
    saveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
    addCustomPersona: (p: CustomPersona) => void;
    updateCustomPersona: (id: string, updates: Partial<CustomPersona>) => void;
    deleteCustomPersona: (id: string) => void;
    addApiKey: (key: SavedApiKey) => void;
    updateApiKey: (id: string, updates: Partial<SavedApiKey>) => void;
    deleteApiKey: (id: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const STORE_FILENAME = 'life-os-config.json';

export const DEFAULT_CONFIG: AppConfig = {
    aiProvider: 'google',
    aiApiKey: '',
    aiModel: 'gemini-2.0-flash',
    plannerProvider: 'google',
    plannerApiKey: '',
    plannerModel: 'gemini-2.0-flash',
    utilityProvider: 'google',
    utilityApiKey: '',
    utilityModel: 'gemini-1.5-flash-8b',
    obsidianVaultPath: '',
    inboxPath: '',
    academicFolderPath: '1-Academic',
    autoDeploy: false,
    strategistPrompt: DEFAULT_SYSTEM_PROMPT_STRATEGIST,
    strategistSliders: '',
    creatorPrompt: DEFAULT_SYSTEM_PROMPT_CREATOR,
    creatorSliders: JSON.stringify({ innovation: 8, detail: 6, collaboration: 7, polish: 5 }),
    customPersonas: [],
    savedApiKeys: [],
    showProperties: false,
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const store = await load(STORE_FILENAME, { autoSave: true, defaults: DEFAULT_CONFIG });

                // Load existing values or use defaults
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
                const academicFolderPath = (await store.get<string>('academicFolderPath')) || DEFAULT_CONFIG.academicFolderPath;
                const autoDeploy = (await store.get<boolean>('autoDeploy')) ?? false;
                const strategistPrompt = (await store.get<string>('strategistPrompt')) || DEFAULT_CONFIG.strategistPrompt;
                const strategistSliders = (await store.get<string>('strategistSliders')) || '';
                const creatorPrompt = (await store.get<string>('creatorPrompt')) || DEFAULT_CONFIG.creatorPrompt;
                const creatorSliders = (await store.get<string>('creatorSliders')) || DEFAULT_CONFIG.creatorSliders;
                const customPersonas = (await store.get<CustomPersona[]>('customPersonas')) || [];
                const savedApiKeys = (await store.get<SavedApiKey[]>('savedApiKeys')) || [];
                const showProperties = (await store.get<boolean>('showProperties')) ?? false;

                let loadedConfig: any = {
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
                    academicFolderPath,
                    autoDeploy,
                    strategistPrompt,
                    strategistSliders,
                    creatorPrompt,
                    creatorSliders,
                    customPersonas,
                    savedApiKeys,
                    showProperties,
                };

                // Auto-select first key if none active
                if (!aiApiKey && savedApiKeys.length > 0) {
                    const first = savedApiKeys[0];
                    loadedConfig.aiApiKey = first.key;
                    loadedConfig.aiProvider = first.provider;
                    // Persist this selection
                    await store.set('aiApiKey', first.key);
                    await store.set('aiProvider', first.provider);
                    await store.save();
                }

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

    const addApiKey = async (key: SavedApiKey) => {
        if (!config) return;
        const updatedKeys = [...(config.savedApiKeys || []), key];
        await saveConfig({ savedApiKeys: updatedKeys });
    };

    const updateApiKey = async (id: string, updates: Partial<SavedApiKey>) => {
        if (!config) return;
        const updatedKeys = config.savedApiKeys.map(key =>
            key.id === id ? { ...key, ...updates } : key
        );
        await saveConfig({ savedApiKeys: updatedKeys });
    };

    const deleteApiKey = async (id: string) => {
        if (!config) return;
        const updatedKeys = config.savedApiKeys.filter(key => key.id !== id);
        await saveConfig({ savedApiKeys: updatedKeys });
    };

    return (
        <ConfigContext.Provider value={{
            config,
            isLoading,
            isConfigured,
            saveConfig,
            addCustomPersona,
            updateCustomPersona,
            deleteCustomPersona,
            addApiKey,
            updateApiKey,
            deleteApiKey
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
