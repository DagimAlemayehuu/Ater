/**
 * Life OS - Configuration Context (Web/Mobile Version)
 * 
 * Manages storage of API keys and paths via localStorage.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

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
    obsidianVaultPath: string;
    inboxPath: string;
    academicFolderPath: string;
    autoDeploy: boolean;
}

interface ConfigContextType {
    config: AppConfig | null;
    isLoading: boolean;
    isConfigured: boolean;
    saveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'life-os-config';

export const DEFAULT_CONFIG: AppConfig = {
    aiProvider: 'google',
    aiApiKey: '',
    aiModel: 'gemini-2.0-flash',
    obsidianVaultPath: '/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault',
    inboxPath: '',
    academicFolderPath: '1-Academic',
    autoDeploy: false,
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initConfig = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
                } else {
                    setConfig(DEFAULT_CONFIG);
                }
            } catch (err) {
                console.error('[Config] Failed to load config:', err);
                setConfig(DEFAULT_CONFIG);
            } finally {
                setIsLoading(false);
            }
        };

        initConfig();
    }, []);

    const saveConfig = async (newConfig: Partial<AppConfig>) => {
        if (!config) return;

        try {
            const updatedConfig = { ...config, ...newConfig };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
            setConfig(updatedConfig);
            console.log('[Config] Storage updated successfully.');
        } catch (err) {
            console.error('[Config] Failed to save config:', err);
            throw err;
        }
    };

    const isConfigured = Boolean(
        config?.aiApiKey &&
        config?.obsidianVaultPath
    );

    return (
        <ConfigContext.Provider value={{
            config,
            isLoading,
            isConfigured,
            saveConfig,
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
