import { useState, useEffect, useCallback } from 'react';
import { sidecarApi } from '@/lib/sidecarApi';

export interface NotionDBData {
    metadata: any;
    rows: any[];
}

// Global emitter-like pattern to sync updates across different hook instances
const dbListeners: Set<(update: any) => void> = new Set();

export const notifyDB = (update: any) => {
    dbListeners.forEach(l => l(update));
};

export function useNotionDB(databaseId: string | null) {
    const [data, setData] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (forceSync = false) => {
        if (!databaseId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await sidecarApi.getNotionDatabaseData(databaseId, forceSync);
            setMetadata(res.metadata);
            setData(res.rows);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch Notion data');
        } finally {
            setIsLoading(false);
        }
    }, [databaseId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Listen for updates from other instances or external calls
    useEffect(() => {
        const listener = (update: any) => {
            if (update.databaseId === databaseId) {
                if (update.type === 'update') {
                    setData(prev => prev.map(row => row.id === update.pageId ? { ...row, properties: { ...row.properties, ...update.properties } } : row));
                } else if (update.type === 'delete') {
                    setData(prev => prev.filter(row => row.id !== update.pageId));
                } else if (update.type === 'add') {
                    setData(prev => [update.page, ...prev]);
                } else if (update.type === 'replace') {
                    setData(prev => prev.map(row => row.id === update.oldId ? update.page : row));
                }
            }
        };
        dbListeners.add(listener);
        return () => { dbListeners.delete(listener); };
    }, [databaseId]);

    const updateProperty = async (pageId: string, propertyName: string, propertyValue: any) => {
        const optimisticProperties = { [propertyName]: propertyValue };
        notifyDB({ databaseId, type: 'update', pageId, properties: optimisticProperties });

        try {
            const res = await sidecarApi.updateNotionPage(pageId, optimisticProperties);
            if (!res.success) throw new Error('Update failed');
            if (res.page) {
                notifyDB({ databaseId, type: 'update', pageId, properties: res.page.properties });
            }
        } catch (err) {
            console.error("Update failed, refreshing...", err);
            fetchData();
        }
    };

    const addPage = async (properties: any) => {
        const tempId = `temp_${Date.now()}`;
        const tempPage = { id: tempId, properties, url: '', isOptimistic: true };
        notifyDB({ databaseId, type: 'add', page: tempPage });

        // Background sync
        sidecarApi.createNotionPage(databaseId!, properties).then(res => {
            if (res.page) {
                notifyDB({ databaseId, type: 'replace', oldId: tempId, page: res.page });
            } else {
                throw new Error('Failed');
            }
        }).catch(err => {
            notifyDB({ databaseId, type: 'delete', pageId: tempId });
            setError('Failed to create page');
        });

        return tempPage;
    };

    const deletePage = async (pageId: string) => {
        notifyDB({ databaseId, type: 'delete', pageId });
        try {
            await sidecarApi.deleteNotionPage(pageId);
        } catch (err) {
            console.error("Delete failed, refreshing...", err);
            fetchData();
        }
    };

    return {
        data,
        metadata,
        isLoading,
        error,
        refresh: () => fetchData(true),
        updateProperty,
        addPage,
        deletePage
    };
}
