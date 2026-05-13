/**
 * Ater - Configuration Context (Mobile Native Version)
 * 
 * Manages storage of API keys and paths via the Scriptable Native Bridge.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeStorage } from './safeStorage';

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
    savedApiKeys: SavedApiKey[];
}

interface ConfigContextType {
    config: AppConfig | null;
    isLoading: boolean;
    isConfigured: boolean;
    saveConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
    addApiKey: (key: SavedApiKey) => void;
    deleteApiKey: (id: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const DEFAULT_CONFIG: AppConfig = {
    aiProvider: 'google',
    aiApiKey: '',
    aiModel: 'gemini-2.0-flash',
    obsidianVaultPath: '',
    inboxPath: '',
    academicFolderPath: 'Notes',
    autoDeploy: false,
    savedApiKeys: []
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initConfig = async () => {
            let configLoaded = false;
            try {
                // Try to get config from native bridge first
                const requestId = Math.random().toString(36).substring(7);
                
                const handler = (event: any) => {
                    if (event.detail.requestId === requestId) {
                        window.removeEventListener('ater-api-response', handler);
                        const nativeConfig = event.detail.data;
                        setConfig({ ...DEFAULT_CONFIG, ...nativeConfig });
                        configLoaded = true;
                        setIsLoading(false);
                    }
                };
                
                window.addEventListener('ater-api-response', (handler as any));
                
                // Timeout fallback to localStorage or default
                setTimeout(() => {
                    window.removeEventListener('ater-api-response', (handler as any));
                    if (!configLoaded) {
                        console.warn('[Config] Native bridge timed out, checking localStorage');
                        const saved = safeStorage.getItem('ater-config');
                        if (saved) {
                            setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
                        } else {
                            setConfig(DEFAULT_CONFIG);
                        }
                        setIsLoading(false);
                    }
                }, 3000);

                if ((window as any).Ater && (window as any).Ater.send) {
                    (window as any).Ater.send('api_request', {
                        path: '/api/config',
                        method: 'GET',
                        requestId
                    });
                } else {
                    console.warn('[Config] Ater bridge not found during init');
                    // Immediately trigger fallback if bridge doesn't exist
                    const saved = safeStorage.getItem('ater-config');
                    if (saved) {
                        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
                    } else {
                        setConfig(DEFAULT_CONFIG);
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('[Config] Initialization failed:', err);
                setConfig(DEFAULT_CONFIG);
                setIsLoading(false);
            }
        };

        initConfig();
    }, []);

    const saveConfig = async (newConfig: Partial<AppConfig>) => {
        if (!config) return;

        try {
            const updatedConfig = { ...config, ...newConfig };
            const reqId = Math.random().toString(36).substring(7);
            setConfig(updatedConfig);

            // Persist to native storage
            if ((window as any).Ater) {
                (window as any).Ater.send('update_config', { ...updatedConfig, requestId: reqId });
            }

            // Fallback persistence
            safeStorage.setItem('ater-config', JSON.stringify(updatedConfig));
        } catch (err) {
            console.error('[Config] Save failed:', err);
            throw err;
        }
    };

    const addApiKey = (key: SavedApiKey) => {
        if (!config) return;
        const newKeys = [...(config.savedApiKeys || []), key];
        saveConfig({ savedApiKeys: newKeys });
    };

    const deleteApiKey = (id: string) => {
        if (!config) return;
        const newKeys = (config.savedApiKeys || []).filter(k => k.id !== id);
        saveConfig({ savedApiKeys: newKeys });
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
            addApiKey,
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
