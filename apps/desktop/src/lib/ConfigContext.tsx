/**
 * Life OS - Configuration Context
 * 
 * Manages secure storage of API keys and paths via Tauri Store.
 * Provides global state for the app and identifies if onboarding is required.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { load } from '@tauri-apps/plugin-store';

export interface AppConfig {
    [key: string]: string;
    notionApiKey: string;
    geminiApiKey: string;
    obsidianVaultPath: string;
    profilePersonal: string;
    profileAcademic: string;
    profileFinancial: string;
    profileFitness: string;
    profileMasterPlan: string;
    strategistPrompt: string;
}

interface ConfigContextType {
    config: AppConfig | null;
    isLoading: boolean;
    isConfigured: boolean;
    saveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const STORE_FILENAME = 'life-os-config.json';
const DEFAULT_CONFIG: AppConfig = {
    notionApiKey: '',
    geminiApiKey: '',
    obsidianVaultPath: '',
    profilePersonal: '',
    profileAcademic: '',
    profileFinancial: '',
    profileFitness: '',
    profileMasterPlan: '',
    strategistPrompt: '',
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
                const pPersonal = (await store.get<string>('profilePersonal')) || '';
                const pAcademic = (await store.get<string>('profileAcademic')) || '';
                const pFinancial = (await store.get<string>('profileFinancial')) || '';
                const pFitness = (await store.get<string>('profileFitness')) || '';
                const pMasterPlan = (await store.get<string>('profileMasterPlan')) || '';
                const sPrompt = (await store.get<string>('strategistPrompt')) || '';

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

    return (
        <ConfigContext.Provider value={{ config, isLoading, isConfigured, saveConfig }}>
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
