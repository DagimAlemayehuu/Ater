"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Settings, 
  Save, 
  RefreshCw,
  Database,
  Terminal,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      // Not found, create default
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
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] animate-in fade-in duration-700">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/5 py-10 px-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-black">Settings</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 mt-2">
            Global Oracle Configuration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:scale-100"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar px-12 py-12">
        <div className="max-w-4xl mx-auto space-y-16">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="size-10 bg-gray-50 rounded-xl flex items-center justify-center border border-black/5">
                <Database className="size-4 text-gray-300" />
              </div>
              <div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-black">Global Config</h2>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">JSON Parameters</p>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute top-6 right-6 p-3 bg-white border border-black/5 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Terminal className="size-4 text-black" />
              </div>
              <textarea 
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                className="w-full h-[500px] p-10 bg-white border border-black/5 rounded-[3rem] font-mono text-[14px] leading-relaxed text-black focus:outline-none focus:border-black/20 transition-all custom-scrollbar shadow-[0_8px_40px_rgba(0,0,0,0.02)]"
                spellCheck={false}
              />
            </div>
            
            {error && (
              <div className="mt-8 p-6 bg-black text-white rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
                <AlertCircle className="size-5 text-white shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Configuration Fault</p>
                  <p className="text-[14px] font-bold mt-1">{error}</p>
                </div>
              </div>
            )}
          </section>

          <section className="p-12 bg-white border border-black/5 rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300 mb-10">Infrastructure Registry</h2>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-200 mb-2">Primary Node</p>
                <p className="text-[16px] font-bold text-black tracking-tight">db.ckqjwsmdbspmquxbdrgb.supabase.co</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-200 mb-2">Location</p>
                <p className="text-[16px] font-bold text-black tracking-tight">us-west-1 (San Francisco)</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
