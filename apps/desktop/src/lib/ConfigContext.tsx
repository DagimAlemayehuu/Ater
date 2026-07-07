/**
 * Ater - Configuration Context
 * 
 * Manages secure storage of API keys and paths via Tauri Store.
 * Provides global state for the app and identifies if onboarding is required.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAppStore } from '@/lib/store';
import { sidecarApi } from '@/lib/sidecarApi';
import { AppMode, setRuntimeAppMode, toAppMode } from '@/lib/appMode';

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
    model?: string;
    baseUrl?: string;
    maxTpm?: number;
    maxRpm?: number;
    maxTpd?: number;
    maxRpd?: number;
    maxConcurrency?: number;
}

export interface AppConfig {
  [key: string]: any;
    aiProvider: string;
    aiApiKey: string;
    aiModel: string;
    aiBaseUrl: string;
    aiMaxTpm?: number;
    aiMaxRpm?: number;
    aiMaxTpd?: number;
    aiMaxRpd?: number;
    aiMaxConcurrency?: number;
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
    pomodoroWorkDuration: number;
    pomodoroShortBreakDuration: number;
    pomodoroLongBreakDuration: number;
    pomodoroSessionsBeforeLongBreak: number;
    isActivated: boolean;
    activationEmail: string;
    activationCode: string;
    machineId: string;
    displayName: string;
    isProgramConfigured: boolean;
    appMode: AppMode;
    isDemoMode: boolean;
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

const STORE_FILENAME = 'ater_config.json';

export const DEFAULT_CONFIG: AppConfig = {
    aiProvider: 'google',
    aiApiKey: '',
    aiModel: 'gemini-2.0-flash',
    aiBaseUrl: '',
    aiMaxTpm: undefined,
    aiMaxRpm: undefined,
    aiMaxTpd: undefined,
    aiMaxRpd: undefined,
    aiMaxConcurrency: undefined,
    obsidianVaultPath: '',
    inboxPath: '',
    academicFolderPath: 'Notes',
    autoDeploy: false,
    strategistPrompt: DEFAULT_SYSTEM_PROMPT_STRATEGIST,
    strategistSliders: '',
    creatorPrompt: DEFAULT_SYSTEM_PROMPT_CREATOR,
    creatorSliders: JSON.stringify({ innovation: 8, detail: 6, collaboration: 7, polish: 5 }),
    customPersonas: [],
    savedApiKeys: [],
    showProperties: false,
    pomodoroWorkDuration: 25,
    pomodoroShortBreakDuration: 5,
    pomodoroLongBreakDuration: 15,
    pomodoroSessionsBeforeLongBreak: 4,
    isActivated: false,
    activationEmail: '',
    activationCode: '',
    machineId: '',
    displayName: '',
    isProgramConfigured: false,
    appMode: 'beta',
    isDemoMode: false,
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const store = await getAppStore();

                // Load existing values or use defaults
                const aiProvider = (await store.get<string>('aiProvider')) || DEFAULT_CONFIG.aiProvider;
                const aiApiKey = (await store.get<string>('aiApiKey')) || '';
                const aiModel = (await store.get<string>('aiModel')) || DEFAULT_CONFIG.aiModel;
                const aiBaseUrl = (await store.get<string>('aiBaseUrl')) || '';
                const aiMaxTpm = await store.get<number>('aiMaxTpm');
                const aiMaxRpm = await store.get<number>('aiMaxRpm');
                const aiMaxTpd = await store.get<number>('aiMaxTpd');
                const aiMaxRpd = await store.get<number>('aiMaxRpd');
                const aiMaxConcurrency = await store.get<number>('aiMaxConcurrency');

                let obsidianVaultPath = await store.get<string>('obsidianVaultPath');
                if (!obsidianVaultPath || obsidianVaultPath.trim() === '') {
                    obsidianVaultPath = '';
                    await store.set('obsidianVaultPath', obsidianVaultPath);
                    await store.save();
                }
                const inboxPath = (await store.get<string>('inboxPath')) || '';
                let academicFolderPath = (await store.get<string>('academicFolderPath')) || DEFAULT_CONFIG.academicFolderPath;
                
                // ── MIGRATION: 'database' was wrongly used as academic root. Correct to 'Notes'. ──
                // Atomic notes belong in Notes/, NOT database/ (which is reserved for hubs/metadata).
                if (academicFolderPath === 'database' || academicFolderPath === '1-Academic') {
                    academicFolderPath = 'Notes';
                    await store.set('academicFolderPath', 'Notes');
                    await store.save();
                }
                const autoDeploy = (await store.get<boolean>('autoDeploy')) ?? false;
                const strategistPrompt = (await store.get<string>('strategistPrompt')) || DEFAULT_CONFIG.strategistPrompt;
                const strategistSliders = (await store.get<string>('strategistSliders')) || '';
                const creatorPrompt = (await store.get<string>('creatorPrompt')) || DEFAULT_CONFIG.creatorPrompt;
                const creatorSliders = (await store.get<string>('creatorSliders')) || DEFAULT_CONFIG.creatorSliders;
                const customPersonas = (await store.get<CustomPersona[]>('customPersonas')) || [];
                const savedApiKeys = (await store.get<SavedApiKey[]>('savedApiKeys')) || [];
                const showProperties = (await store.get<boolean>('showProperties')) ?? false;
                const pomodoroWorkDuration = (await store.get<number>('pomodoroWorkDuration')) || DEFAULT_CONFIG.pomodoroWorkDuration;
                const pomodoroShortBreakDuration = (await store.get<number>('pomodoroShortBreakDuration')) || DEFAULT_CONFIG.pomodoroShortBreakDuration;
                const pomodoroLongBreakDuration = (await store.get<number>('pomodoroLongBreakDuration')) || DEFAULT_CONFIG.pomodoroLongBreakDuration;
                const pomodoroSessionsBeforeLongBreak = (await store.get<number>('pomodoroSessionsBeforeLongBreak')) || DEFAULT_CONFIG.pomodoroSessionsBeforeLongBreak;
                const isActivated = (await store.get<boolean>('isActivated')) ?? false;
                const activationEmail = (await store.get<string>('activationEmail')) || '';
                const activationCode = (await store.get<string>('activationCode')) || '';
                const displayName = (await store.get<string>('displayName')) || '';
                const isProgramConfigured = (await store.get<boolean>('isProgramConfigured')) ?? false;
                const legacyIsDemoMode = (await store.get<boolean>('isDemoMode')) ?? false;
                const appMode = toAppMode(await store.get<string>('appMode'), legacyIsDemoMode);
                const isDemoMode = appMode === 'simulation';
                const walkthroughMilestone = (await store.get<string>('walkthroughMilestone')) || '1.6';
                const walkthroughStatus = (await store.get<string>('walkthroughStatus')) || 'inactive';
                const walkthroughCompleted = (await store.get<boolean>('walkthroughCompleted')) ?? false;
                
                let machineId = await store.get<string>('machineId');
                if (!machineId) {
                    try {
                        const { invoke } = await import('@tauri-apps/api/core');
                        machineId = await Promise.race([
                            invoke<string>('get_machine_id'),
                            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
                        ]);
                    } catch (err) {
                        console.warn('[Config] Failed to get native machine ID; leaving machineId unresolved:', err);
                        machineId = '';
                    }
                    if (machineId) {
                        await store.set('machineId', machineId);
                        await store.save();
                    }
                }

                let loadedConfig: any = {
                    aiProvider,
                    aiApiKey,
                    aiModel,
                    aiBaseUrl,
                    aiMaxTpm,
                    aiMaxRpm,
                    aiMaxTpd,
                    aiMaxRpd,
                    aiMaxConcurrency,
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
                    pomodoroWorkDuration,
                    pomodoroShortBreakDuration,
                    pomodoroLongBreakDuration,
                    pomodoroSessionsBeforeLongBreak,
                    isActivated,
                    activationEmail,
                    activationCode,
                    machineId,
                    displayName,
                    isProgramConfigured,
                    appMode,
                    isDemoMode,
                    walkthroughMilestone,
                    walkthroughStatus,
                    walkthroughCompleted,
                };

                const isBypass = import.meta.env.DEV &&
                    (new URLSearchParams(window.location.search).get('bypass') === 'true' ||
                     window.location.hash.includes('bypass=true'))
                if (isBypass) {
                    loadedConfig.appMode = 'simulation';
                    loadedConfig.isDemoMode = true;
                    loadedConfig.displayName = "Stitch Explorer";
                    loadedConfig.obsidianVaultPath = "/Mock/Vault";
                    loadedConfig.isProgramConfigured = true;
                    loadedConfig.isActivated = true;
                    loadedConfig.aiApiKey = "mock_key";
                }

                // Auto-select first key if none active
                if (!aiApiKey && savedApiKeys.length > 0) {
                    const first = savedApiKeys[0];
                    loadedConfig.aiApiKey = first.key;
                    loadedConfig.aiProvider = first.provider;
                    loadedConfig.aiModel = first.model || loadedConfig.aiModel;
                    loadedConfig.aiBaseUrl = first.baseUrl || '';
                    loadedConfig.aiMaxTpm = first.maxTpm;
                    loadedConfig.aiMaxRpm = first.maxRpm;
                    loadedConfig.aiMaxTpd = first.maxTpd;
                    loadedConfig.aiMaxRpd = first.maxRpd;
                    loadedConfig.aiMaxConcurrency = first.maxConcurrency;
                    // Persist this selection
                    await store.set('aiApiKey', first.key);
                    await store.set('aiProvider', first.provider);
                    if (first.model) await store.set('aiModel', first.model);
                    await store.set('aiBaseUrl', first.baseUrl || '');
                    await store.set('aiMaxTpm', first.maxTpm);
                    await store.set('aiMaxRpm', first.maxRpm);
                    await store.set('aiMaxTpd', first.maxTpd);
                    await store.set('aiMaxRpd', first.maxRpd);
                    await store.set('aiMaxConcurrency', first.maxConcurrency);
                    await store.save();
                }

                setRuntimeAppMode(loadedConfig.appMode);
                setConfig(loadedConfig);
            } catch (err) {
                console.error('[Config] Failed to initialize store:', err);
                setRuntimeAppMode(DEFAULT_CONFIG.appMode);
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
            const store = await getAppStore();
            const nextMode = toAppMode(
                (newConfig as any).appMode ?? config.appMode,
                (newConfig as any).isDemoMode ?? config.isDemoMode
            );
            const updatedConfig = {
                ...config,
                ...newConfig,
                appMode: nextMode,
                isDemoMode: nextMode === 'simulation',
            } as any;
            const entries = { ...newConfig } as any;
            if ('appMode' in entries || 'isDemoMode' in entries) {
                entries.appMode = nextMode;
                entries.isDemoMode = nextMode === 'simulation';
            }
            setRuntimeAppMode(nextMode);

            // Update store — skip undefined values (not JSON-serializable by Tauri IPC).
            // Delete the key from the store instead so it cleanly reverts to default.
            await Promise.all(
                Object.keys(entries).map(async (key) => {
                    const val = entries[key];
                    if (val === undefined) {
                        try {
                            await store.delete(key);
                        } catch {
                            /* key may not exist yet */
                        }
                    } else {
                        await store.set(key, val);
                    }
                })
            );

            await store.save();
            setConfig(updatedConfig);
            console.log('[Config] Store updated successfully.');
        } catch (err) {
            console.error('[Config] Failed to save to store:', err);
            throw err;
        }
    };

    const isConfigured = Boolean(
        config?.obsidianVaultPath && config?.displayName && config?.isProgramConfigured
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
