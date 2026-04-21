import React, { useState } from 'react'
import { useConfig } from '@/lib/ConfigContext'
import { cn } from '@/lib/utils'

export default function Settings() {
    const { config, saveConfig } = useConfig()
    
    const menuItems = [
        { id: 'identity', label: 'IDENTITY_CREDENTIALS', icon: 'fingerprint', desc: 'Secure sovereign key management' },
        { id: 'vault', label: 'VAULT_ARCHITECTURE', icon: 'account_tree', desc: 'Obsidian root and folder mapping' },
        { id: 'models', label: 'NEURAL_MODELS', icon: 'psychology', desc: 'AI tier and provider configuration' },
        { id: 'security', label: 'PRIVACY_PROTOCOL', icon: 'shield_lock', desc: 'Encryption and local cache rules' },
    ]

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-700 overflow-y-auto custom-scrollbar">
            {/* Header Content */}
            <div className="px-6 pt-12 pb-8">
                <nav className="flex items-center gap-2 mb-6">
                    <span className="label-sm text-secondary">SYSTEM</span>
                    <span className="material-symbols-outlined text-border text-[12px]">chevron_right</span>
                    <span className="label-sm text-primary">CONFIGURATION</span>
                </nav>
                
                <h1 className="display-md mb-8">System Profile</h1>

                {/* Profile Card (High Fidelity) */}
                <div className="bg-surface-container-low p-6 mb-10 ghost-border flex items-center gap-6 relative overflow-hidden">
                    <div className="w-16 h-16 bg-primary flex items-center justify-center text-white text-2xl font-black shrink-0 z-10">
                        D
                    </div>
                    <div className="flex-1 z-10">
                        <h2 className="headline-sm text-[1.25rem] mb-1 truncate">DABO DESTROYER</h2>
                        <span className="label-sm text-secondary text-[8px] tracking-[0.4em]">SOVEREIGN_ACCESS_GRANTED</span>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                         <span className="material-symbols-outlined text-[64px]">verified_user</span>
                    </div>
                </div>

                {/* configuration Items */}
                <section className="space-y-4">
                    <h2 className="label-sm text-secondary mb-6 tracking-[0.3em]">CORE_PARAMETERS</h2>
                    
                    <div className="space-y-3">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className="w-full bg-surface-container-lowest p-5 ghost-border flex items-center gap-5 hover:bg-accent transition-all group"
                            >
                                <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="font-bold text-[13px] tracking-tight text-primary uppercase">{item.label}</h3>
                                    <p className="body-md text-[11px] opacity-60 truncate">{item.desc}</p>
                                </div>
                                <span className="material-symbols-outlined text-border/40 group-hover:text-primary transition-colors">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="mt-12 space-y-4 pb-32">
                     <h2 className="label-sm text-red-500 mb-6 tracking-[0.3em]">DESTRUCTIVE_ACTIONS</h2>
                     <button className="w-full py-4 bg-red-50 text-red-600 border border-red-100 label-sm flex items-center justify-center gap-3">
                         <span className="material-symbols-outlined text-[18px]">logout</span>
                         REVOKE_SESSION_ACCESS
                     </button>
                </section>
            </div>

            {/* Bottom Versioning */}
            <div className="mt-auto p-10 text-center opacity-20">
                 <span className="label-sm text-[8px] tracking-[0.5em]">LIFE_OS_MOBILE_ALPHA_v0.1.0</span>
            </div>

            {/* Bottom Spacing */}
            <div className="h-24 shrink-0" />
        </div>
    )
}
