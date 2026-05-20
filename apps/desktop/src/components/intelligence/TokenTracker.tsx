import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useConfig } from '@/lib/ConfigContext';
import { sidecarApi } from '@/lib/sidecarApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

async function hashKey(key: string) {
  if (!key) return 'default';
  const msgUint8 = new TextEncoder().encode(key.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

const TIMEFRAMES = [
  { id: 'day', label: 'Last 24 Hours' },
  { id: 'week', label: 'Past 7 Days' },
  { id: 'month', label: 'Last 30 Days' },
  { id: 'year', label: 'Last Year' },
];

export const TokenTracker: React.FC = () => {
  const { config, saveConfig } = useConfig();
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [keyHash, setKeyHash] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('day');
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allKeysUsage, setAllKeysUsage] = useState<any[]>([]);

  const [keyHashMap, setKeyHashMap] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const buildMap = async () => {
      const map: Record<string, string> = {};
      if (config?.savedApiKeys) {
        for (const k of config.savedApiKeys) {
          const hash = await hashKey(k.key);
          map[hash] = k.name;
        }
      }
      setKeyHashMap(map);
    };
    buildMap();
  }, [config?.savedApiKeys]);

  const activeKeyId = useMemo(() => {
    if (!config) return '';
    const found = config.savedApiKeys.find(k => k.key === config.aiApiKey);
    return found ? found.id : 'all';
  }, [config?.aiApiKey, config?.savedApiKeys]);

  useEffect(() => {
    if (activeKeyId && !selectedKeyId) {
      setSelectedKeyId(activeKeyId);
    }
  }, [activeKeyId]);

  const handleKeyChange = async (newId: string) => {
    setSelectedKeyId(newId);
    if (!config || newId === 'all') return;

    let newKey = '';
    let newProvider = config.aiProvider;
    let newModel = config.aiModel;
    let newBaseUrl = config.aiBaseUrl;

    const found = config.savedApiKeys.find(k => k.id === newId);
    if (found) {
      newKey = found.key;
      newProvider = found.provider;
      newModel = found.model || newModel;
      newBaseUrl = found.baseUrl || '';
    }

    if (newKey && newKey !== config.aiApiKey) {
      try {
        await saveConfig({
          aiApiKey: newKey,
          aiProvider: newProvider,
          aiModel: newModel,
          aiBaseUrl: newBaseUrl,
          aiMaxTpm: found?.maxTpm,
          aiMaxRpm: found?.maxRpm,
          aiMaxTpd: found?.maxTpd,
          aiMaxRpd: found?.maxRpd,
          aiMaxConcurrency: found?.maxConcurrency
        });
        toast.success('API key updated.');
      } catch (err) {
        toast.error('Failed to update key.');
      }
    }
  };

  useEffect(() => {
    const updateHash = async () => {
      if (selectedKeyId === 'all') {
        setKeyHash('all');
        return;
      }
      let keyToHash = '';
      const found = config?.savedApiKeys.find(k => k.id === selectedKeyId);
      keyToHash = found?.key || '';
      
      const hash = await hashKey(keyToHash);
      setKeyHash(hash);
    };
    updateHash();
  }, [selectedKeyId, config?.aiApiKey, config?.savedApiKeys]);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!keyHash) return;
      setLoading(true);
      try {
        const data = await sidecarApi.getAiUsage(keyHash, timeframe);
        setUsageData(data);
        const allUsage = await sidecarApi.getAllKeysUsage(timeframe);
        setAllKeysUsage(allUsage || []);
      } catch (err) {
        console.error('Usage fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, [keyHash, timeframe]);

  const activeKeyUsageSummary = useMemo(() => {
    return allKeysUsage.find(k => k.key_hash === keyHash);
  }, [allKeysUsage, keyHash]);

  const maxTpd = usageData?.max_tpd || 500000;
  const usedTpd = activeKeyUsageSummary?.used_tpd || 0;
  const tpdPct = Math.min(100, (usedTpd / maxTpd) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row gap-6 items-center justify-between border border-border p-6 bg-card rounded-md">
        <div>
          <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-foreground">API Usage</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">Hash: {keyHash}</p>
        </div>

        <div className="flex gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Key</label>
            <select 
              value={selectedKeyId}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-48 bg-background border border-border px-3 py-2 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary appearance-none cursor-pointer rounded-md"
            >
              <option value="all">Default Total</option>
              {config?.savedApiKeys.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period</label>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-40 bg-background border border-border px-3 py-2 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              {TIMEFRAMES.map(tf => (
                <option key={tf.id} value={tf.id}>{tf.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        {keyHash !== 'all' ? (
          <div className="border border-border p-6 bg-card">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Daily Quota</span>
            <div className="text-2xl font-black tracking-tighter text-foreground">
              {usedTpd.toLocaleString()} <span className="text-[12px] text-muted-foreground">/ {maxTpd.toLocaleString()}</span>
            </div>
            <div className="mt-4 h-1 w-full bg-muted">
              <div 
                className={cn("h-full bg-primary transition-none", tpdPct > 90 && "bg-destructive")} 
                style={{ width: `${tpdPct}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="border border-border p-6 bg-card">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Active Pool</span>
            <div className="text-2xl font-black tracking-tighter text-foreground">
              {allKeysUsage.length} <span className="text-[12px] text-muted-foreground uppercase">Keys Tracked</span>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-4">Aggregate Telemetry Active</p>
          </div>
        )}

        <div className="border border-border p-6 bg-card">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Tokens</span>
          <div className="text-2xl font-black tracking-tighter text-foreground">
            {usageData?.total_tokens?.toLocaleString() || 0}
          </div>
        </div>

        <div className="border border-border p-6 bg-card">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Requests</span>
          <div className="text-2xl font-black tracking-tighter text-foreground">
            {usageData?.total_requests?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-border bg-card p-6">
        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground mb-8">Token Usage</h3>
        <div className="h-[280px] w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center border border-dashed border-border">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing...</span>
            </div>
          ) : usageData?.breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData.breakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => timeframe === 'day' ? val.split(' ')[1] : val.split('-').slice(1).join('/')}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border p-3 shadow-none">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.label}</p>
                          <p className="text-[12px] font-black tracking-tighter text-foreground">{payload[0].value?.toLocaleString()} Tokens</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="tokens" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 0, 0, 0]}
                  barSize={timeframe === 'day' ? 20 : timeframe === 'week' ? 40 : 10}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-border opacity-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No data found</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Key Breakdown (only for "all") */}
      {keyHash === 'all' && allKeysUsage.length > 0 && (
        <div className="border border-border bg-card p-6">
          <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground mb-6">Key Contributions (24h)</h3>
          <div className="space-y-4">
            {allKeysUsage.map((usage, idx) => {
              const displayName = keyHashMap[usage.key_hash] || `Key ${usage.key_hash.substring(0, 6)}`;
              return (
                <div key={idx} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground">
                      {displayName}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">ID: {usage.key_hash.substring(0, 12)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-black tracking-tighter text-foreground">{usage.used_tpd.toLocaleString()} Tokens</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{usage.used_rpd} Requests</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
