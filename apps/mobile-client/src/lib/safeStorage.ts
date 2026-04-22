/**
 * Safe Storage Utility
 * 
 * Provides a fallback for localStorage when it's blocked by Security Policy
 * (common in certain WebView environments like iOS Scriptable).
 */

const memoryStorage: Record<string, string> = {};

const isStorageAvailable = () => {
    try {
        localStorage.setItem('__storage_test__', 'test');
        localStorage.removeItem('__storage_test__');
        return true;
    } catch (e) {
        return false;
    }
};

const storageAvailable = isStorageAvailable();

export const safeStorage = {
    getItem: (key: string): string | null => {
        if (storageAvailable) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return memoryStorage[key] || null;
            }
        }
        return memoryStorage[key] || null;
    },
    setItem: (key: string, value: string): void => {
        if (storageAvailable) {
            try {
                localStorage.setItem(key, value);
                return;
            } catch (e) {
                // Fallback to memory
            }
        }
        memoryStorage[key] = value;
    },
    removeItem: (key: string): void => {
        if (storageAvailable) {
            try {
                localStorage.removeItem(key);
                return;
            } catch (e) {
                // Fallback to memory
            }
        }
        delete memoryStorage[key];
    }
};
