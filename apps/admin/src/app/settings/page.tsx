"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const [config, setConfig] = useState<string>("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'global_config')
      .single();
    
    if (data) {
      setConfig(JSON.stringify(data.config, null, 2));
    } else if (error && error.code === 'PGRST116') {
      await supabase.from('app_settings').insert({ id: 'global_config', config: { token_price_per_1k: 0.002, registration_open: true } });
      setConfig(JSON.stringify({ token_price_per_1k: 0.002, registration_open: true }, null, 2));
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(config);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global_config', config: parsed, updated_at: new Date().toISOString() });
      
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      <header className="bg-background border-b border-border py-10 px-12 flex items-center justify-between">
        <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase">Settings</h1>
        <button 
          onClick={saveSettings}
          disabled={saving || loading}
          className="px-8 py-4 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-widest rounded-none hover:opacity-90 transition-none disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <div className="flex-1 overflow-auto px-12 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Configuration</h2>
              {loading && <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Loading JSON...</span>}
            </div>
            
            {loading ? (
              <Skeleton className="w-full h-96" />
            ) : (
              <textarea 
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                className="w-full h-96 p-8 bg-card border border-border rounded-none font-mono text-[13px] leading-relaxed text-foreground focus:outline-none focus:border-primary transition-none custom-scrollbar"
                spellCheck={false}
              />
            )}
            
            {error && (
              <div className="mt-8 p-6 border border-border bg-accent/30 rounded-none">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Error</p>
                <p className="text-[13px] font-bold text-foreground uppercase">{error}</p>
              </div>
            )}
          </section>

          <section className="p-10 border border-border rounded-none bg-card">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-8">System Info</h2>
            <div className="grid grid-cols-2 gap-10">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Database</p>
                <p className="text-[14px] font-bold text-foreground uppercase truncate">db.supabase.co</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Region</p>
                <p className="text-[14px] font-bold text-foreground uppercase">us-west-1</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
