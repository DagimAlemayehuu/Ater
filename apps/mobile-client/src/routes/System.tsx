import React from 'react'
import { User, ShieldCheck, Zap, HardDrive, Trash2, FolderOpen, ChevronRight } from 'lucide-react'

export default function System() {
  const sections = [
    { title: 'Identity', icon: User, desc: 'Personal & Academic Profiles' },
    { title: 'Intelligence', icon: Zap, desc: 'LLM Tier Configuration' },
    { title: 'Local Vault', icon: HardDrive, desc: 'Obsidian Path & Integrity' },
    { title: 'Security', icon: ShieldCheck, desc: 'API Key Vault' },
  ]

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <span className="label-sm">Configuration</span>
        <h1 className="display-md uppercase">Core<br/><span className="text-muted-foreground/30 text-3xl">System</span></h1>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <button key={i} className="w-full flex items-center justify-between p-6 bg-accent/10 border border-border/10 rounded-md hover:bg-accent/20 transition-all text-left">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-background rounded-sm text-muted-foreground">
                <section.icon size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[12px] font-black uppercase tracking-widest">{section.title}</h3>
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-wider">{section.desc}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20" />
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-12 space-y-6">
        <h3 className="label-sm text-destructive/50">Maintenance</h3>
        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-md flex items-center justify-between">
           <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-foreground">Reset All Buffers</p>
              <p className="text-[8px] font-black text-destructive/40 uppercase">Wipe Local Configuration Cache</p>
           </div>
           <button className="p-2 bg-destructive text-destructive-foreground rounded-md active:scale-95 transition-all">
              <Trash2 size={16} />
           </button>
        </div>
      </div>

      <div className="pt-10 flex flex-col items-center gap-4 border-t border-border/10">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-muted-foreground/20">LifeOS Mobile v1.0.0 (TIER-3)</p>
      </div>
    </div>
  )
}
