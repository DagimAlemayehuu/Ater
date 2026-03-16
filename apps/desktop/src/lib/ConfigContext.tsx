/* eslint-disable react-refresh/only-export-components */

/**
 * Life OS - Configuration Context
 * 
 * Manages secure storage of API keys and paths via Tauri Store.
 * Provides global state for the app and identifies if onboarding is required.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { load } from '@tauri-apps/plugin-store';
import {
    type AppConfig,
    type CustomPersona,
    DEFAULT_CONFIG
} from './config-types';

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

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const store = await load(STORE_FILENAME, { autoSave: true, defaults: DEFAULT_CONFIG as unknown as Record<string, unknown> });

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
                const oPrompt = (await store.get<string>('okaPrompt')) || DEFAULT_CONFIG.okaPrompt;
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
                    okaPrompt: oPrompt,
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

    const saveConfig = useCallback(async (newConfig: Partial<AppConfig>) => {
        try {
            const store = await load(STORE_FILENAME, { autoSave: true, defaults: DEFAULT_CONFIG as unknown as Record<string, unknown> });

            setConfig(prev => {
                if (!prev) return prev;
                const updated = { ...prev, ...newConfig } as AppConfig;
                
                // Save to store asynchronously
                Object.entries(newConfig).forEach(([key, value]) => {
                    store.set(key, value);
                });
                store.save();
                
                return updated;
            });

            console.log('[Config] Store update requested.');
        } catch (err) {
            console.error('[Config] Failed to save to store:', err);
            throw err;
        }
    }, []);

    const isConfigured = Boolean(
        config?.notionApiKey &&
        config?.geminiApiKey &&
        config?.obsidianVaultPath
    );

    const addCustomPersona = useCallback(async (p: CustomPersona) => {
        if (!config) return;
        const updatedPersonas = [...(config.customPersonas || []), p];
        await saveConfig({ customPersonas: updatedPersonas });
    }, [config, saveConfig]);

    const updateCustomPersona = useCallback(async (id: string, updates: Partial<CustomPersona>) => {
        if (!config) return;
        const updatedPersonas = config.customPersonas.map(persona =>
            persona.id === id ? { ...persona, ...updates } : persona
        );
        await saveConfig({ customPersonas: updatedPersonas });
    }, [config, saveConfig]);

    const deleteCustomPersona = useCallback(async (id: string) => {
        if (!config) return;
        const updatedPersonas = config.customPersonas.filter(persona => persona.id !== id);
        await saveConfig({ customPersonas: updatedPersonas });
    }, [config, saveConfig]);

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
