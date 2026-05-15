"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Database, Shield, Globe, Terminal } from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState<string>("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const initial = { token_price_per_1k: 0.002, registration_open: true, engine_version: "1.0.0" };
      await supabase.from('app_settings').insert({ id: 'global_config', config: initial });
      setConfig(JSON.stringify(initial, null, 2));
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const parsed = JSON.parse(config);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global_config', config: parsed, updated_at: new Date().toISOString() });
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  }

  useEffect(() => { fetchSettings(); }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      <header className="bg-background border-b border-border py-8 px-10 shrink-0">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase">
              Settings
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Global engine configuration
            </p>
          </div>
          <button 
            onClick={saveSettings}
            disabled={saving || loading}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] border border-primary hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="size-3.5" />
            {saving ? "Saving..." : "Commit Changes"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Editor Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="size-3.5 text-muted-foreground" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                    Runtime Config (JSON)
                  </h2>
                </div>
                {success && (
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                    Successfully Updated
                  </span>
                )}
              </div>

              {loading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <div className="relative group">
                  <textarea 
                    value={config}
                    onChange={(e) => setConfig(e.target.value)}
                    className="w-full h-[400px] p-6 bg-card border border-border font-mono text-[12px] leading-relaxed text-foreground focus:outline-none focus:border-primary custom-scrollbar resize-none"
                    spellCheck={false}
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-background/80 px-2 py-1 border border-border">
                      UTF-8
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 border border-destructive/30 bg-destructive/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-destructive mb-1">Parse Error</p>
                  <p className="text-[12px] font-bold text-foreground uppercase leading-tight">{error}</p>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <div className="p-6 bg-card border border-border">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                  <Database className="size-3" />
                  Infrastructure
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Storage</p>
                    <p className="text-[12px] font-bold text-foreground uppercase tabular-nums">Supabase Postgres</p>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Region</p>
                    <p className="text-[12px] font-bold text-foreground uppercase tabular-nums">us-west-1 (Oracle)</p>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="size-1.5 bg-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Synchronized</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card border border-border">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                  <Shield className="size-3" />
                  Access Control
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed mb-4">
                  Changes made here propagate to the desktop engine and waitlist portal within 300s.
                </p>
                <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 border border-border">
                  <Globe className="size-3 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Global Scope</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
