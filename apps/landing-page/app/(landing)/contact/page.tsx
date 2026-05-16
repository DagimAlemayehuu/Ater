"use client";

import React from 'react';
import { Router, Terminal, Network, Rss, Check, ChevronRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow industrial-container py-20 space-y-12">
        {/* Header Section */}
        <div className="border-b border-outline-variant pb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary active-status-pulse"></div>
              <span className="technical-label text-primary uppercase tracking-widest">GET IN TOUCH</span>
            </div>
            <h1 className="text-display-hero">
              CONTACT<br />US.
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Column */}
          <section className="lg:col-span-8 flex flex-col gap-10">
            <div className="flex items-center gap-4">
              <Router className="size-8 text-primary" />
              <h2 className="text-section-heading uppercase">SEND A MESSAGE</h2>
            </div>

            <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="technical-label text-on-surface-variant text-[10px] uppercase tracking-widest">FULL NAME</label>
                  <input 
                    className="industrial-input" 
                    placeholder="YOUR NAME" 
                    type="text" 
                  />
                </div>
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="technical-label text-on-surface-variant text-[10px] uppercase tracking-widest">EMAIL ADDRESS</label>
                  <input 
                    className="industrial-input" 
                    placeholder="EMAIL@DOMAIN.COM" 
                    type="email" 
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="technical-label text-on-surface-variant text-[10px] uppercase tracking-widest">SUBJECT</label>
                <div className="relative">
                  <select className="industrial-input appearance-none cursor-pointer">
                    <option value="GENERAL">GENERAL INQUIRY</option>
                    <option value="SUPPORT">TECHNICAL SUPPORT</option>
                    <option value="SECURITY">SECURITY REPORT</option>
                    <option value="FEEDBACK">FEEDBACK</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="size-4 rotate-90 opacity-40" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="technical-label text-on-surface-variant text-[10px] uppercase tracking-widest">YOUR MESSAGE</label>
                <textarea 
                  className="industrial-input min-h-[200px] resize-none" 
                  placeholder="HOW CAN WE HELP YOU?" 
                />
              </div>

              {/* CTA */}
              <button 
                className="industrial-btn industrial-btn-primary w-full h-20 text-[14px] uppercase tracking-widest" 
                type="submit"
              >
                SEND MESSAGE
                <ChevronRight className="ml-4 size-4" />
              </button>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-12">
            <div className="space-y-6">
              <h3 className="technical-label text-on-surface-variant border-b border-outline-variant pb-2 uppercase tracking-widest">LINKS</h3>
              <div className="flex flex-col gap-1">
                <TerminalNode label="GITHUB" icon={<Terminal className="size-5" />} />
                <TerminalNode label="DISCORD" icon={<Network className="size-5" />} />
                <TerminalNode label="TWITTER" icon={<Rss className="size-5" />} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="technical-label text-on-surface-variant border-b border-outline-variant pb-2 uppercase tracking-widest">STATUS</h3>
              <div className="flex flex-col gap-6 font-mono text-[11px] tracking-widest">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">SUPPORT TEAM</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary active-status-pulse"></span>
                    <span className="text-primary text-[10px]">ONLINE</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">RESPONSE TIME</span>
                  <span className="text-primary text-[10px]">&lt; 24 HOURS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">SYSTEM UPTIME</span>
                  <span className="text-primary text-[10px]">99.9%</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function TerminalNode({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <a 
      href="#" 
      className="industrial-border p-6 flex justify-between items-center hover:bg-surface transition-colors group bg-surface-container-lowest"
    >
      <span className="technical-label group-hover:text-primary transition-colors uppercase tracking-widest">[{label}]</span>
      <span className="text-on-surface-variant group-hover:text-primary transition-colors">
        {icon}
      </span>
    </a>
  );
}
