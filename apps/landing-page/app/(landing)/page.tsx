"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Terminal, Download, Shield, Lock, Activity, Zap, Cpu, Search, Layout } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero & Mockup Integrated Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center h-screen w-full overflow-hidden border-b border-outline-variant pt-16">
        <div className="industrial-container flex flex-col items-center justify-center gap-8 w-full h-full">
          <div className="flex flex-col items-start justify-center gap-6 w-full">
            <h1 className="text-display-hero border-b border-outline-variant pb-4 text-left w-full text-[48px] md:text-[60px] lg:text-[72px]">
              LEARN FASTER.<br />SCORE BETTER.
            </h1>
          </div>

          {/* Integrated Mockup */}
          <div className="w-full max-w-4xl relative transform scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500">
             <FullMacbookMockup />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full items-center justify-center">
            <Link href="/waitlist" className="industrial-btn industrial-btn-primary w-full sm:w-auto h-14 group">
              <span>JOIN WAITLIST</span>
              <ChevronRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core Benefits */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 industrial-border bg-outline-variant w-full">
            <div className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <div className="w-3 h-3 bg-primary active-status-pulse"></div>
                <h2 className="technical-label text-on-background uppercase">IMPORT</h2>
              </div>
              <p className="text-body font-bold text-on-surface-variant">
                Upload your PDFs and textbooks. Ater reads and understands them instantly.
              </p>
              <Download className="size-8 text-primary mt-auto pt-4" />
            </div>
            <div className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <div className="w-3 h-3 bg-primary active-status-pulse"></div>
                <h2 className="technical-label text-on-background uppercase">ORGANIZE</h2>
              </div>
              <p className="text-body font-bold text-on-surface-variant">
                Turn messy notes into clear structures. Connect ideas effortlessly.
              </p>
              <Cpu className="size-8 text-primary mt-auto pt-4" />
            </div>
            <div className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <div className="w-3 h-3 bg-primary active-status-pulse"></div>
                <h2 className="technical-label text-on-background uppercase">STUDY</h2>
              </div>
              <p className="text-body font-bold text-on-surface-variant">
                Find exactly what you need. Review for exams with perfect accuracy.
              </p>
              <Zap className="size-8 text-primary mt-auto pt-4" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">HOW IT WORKS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="flex flex-col gap-6">
                <p className="text-body font-bold text-on-surface-variant max-w-xl">
                  Ater runs entirely on your device. Your data never leaves your computer, ensuring absolute privacy and security for your notes.
                </p>
                <p className="technical-label text-primary uppercase tracking-widest">PRIVATE STORAGE. LOCAL PROCESSING. NO DATA LEAKS.</p>
              </div>
              <div className="p-8 industrial-border bg-surface font-mono text-[11px] leading-relaxed text-on-surface opacity-80 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-2 technical-label opacity-40">
                  <Terminal className="size-3" />
                  <span>SYSTEM_STATUS</span>
                </div>
                <div className="space-y-1">
                  <p className="text-primary">&gt; READY FOR INPUT</p>
                  <p>&gt; SECURE VAULT MOUNTED</p>
                  <p>&gt; ALL DATA ENCRYPTED</p>
                  <p className="active-status-pulse text-primary">_</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sticky top-0 z-[35] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-background p-8 industrial-border flex flex-col gap-4 hover:bg-surface transition-colors">
                <span className="technical-label text-primary uppercase tracking-widest">[SIMULATE]</span>
                <p className="text-body font-bold text-on-surface-variant">Test your knowledge before the actual exam.</p>
              </div>
              <div className="bg-background p-8 industrial-border flex flex-col gap-4 hover:bg-surface transition-colors">
                <span className="technical-label text-primary uppercase tracking-widest">[SUMMARIZE]</span>
                <p className="text-body font-bold text-on-surface-variant">Turn long chapters into short, simple notes.</p>
              </div>
              <div className="bg-background p-8 industrial-border flex flex-col gap-4 hover:bg-surface transition-colors">
                <span className="technical-label text-primary uppercase tracking-widest">[CONNECT]</span>
                <p className="text-body font-bold text-on-surface-variant">See how different topics relate to each other.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="sticky top-0 z-40 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">SECURITY</h2>
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="relative w-48 h-48 industrial-border flex items-center justify-center group overflow-hidden">
                  <Lock className="size-16 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex-grow flex flex-col gap-6">
                <p className="text-body font-bold text-on-surface-variant leading-relaxed">
                  Your work is your own. We never use your data to train AI models. Everything stays on your local device, private and secure.
                </p>
                <p className="technical-label text-primary uppercase tracking-widest">ZERO CLOUD STORAGE. NO AI TRAINING. TOTAL PRIVACY.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STUDY CENTER */}
      <section className="sticky top-0 z-[45] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">STUDY CENTER</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="flex flex-col gap-6">
                <p className="text-body font-bold text-on-surface-variant leading-relaxed">
                  Track your progress with simple charts. Our study planner helps you focus on what you need to learn most.
                </p>
                <p className="technical-label text-primary uppercase tracking-widest">PROGRESS TRACKING. SMART PLANNING. BETTER GRADES.</p>
              </div>
              <div className="flex flex-col gap-4 p-8 industrial-border bg-surface w-full">
                <span className="technical-label opacity-40 uppercase tracking-widest">PROGRESS STREAM</span>
                <div className="w-full h-2 bg-outline-variant/20 industrial-border">
                  <div className="w-[78%] h-full bg-primary shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                </div>
                <div className="flex justify-between technical-label opacity-40 text-[10px]">
                  <span>RECALL: 78%</span>
                  <span>STATUS: ON TRACK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="sticky top-0 z-[48] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full max-w-md mx-auto">
          <div className="relative group">
            <input 
              className="w-full bg-transparent border-0 border-b border-outline-variant text-on-background font-mono uppercase tracking-widest focus:ring-0 focus:border-primary p-4 placeholder:opacity-20 outline-none" 
              placeholder="SEARCH YOUR NOTES" 
              type="text"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-outline-variant group-focus-within:text-primary transition-colors" />
          </div>
        </div>
      </section>
    </>
  );
}

function FullMacbookMockup() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Lid / Screen */}
      <div className="w-[85%] aspect-[2560/1664] bg-[#1A1A1A] rounded-t-[2rem] p-[2px] border-x border-t border-white/10 relative flex flex-col shadow-2xl">
        <div className="flex-1 bg-[#000] rounded-t-[1.8rem] overflow-hidden p-[10px] relative flex flex-col">
          {/* M2 Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[34px] bg-[#000] z-30 rounded-b-[0.8rem]" />
          
          <div className="flex-1 bg-[#FFFFFF] rounded-t-[1rem] overflow-hidden relative">
            <Image 
              src="/dashboard.png" 
              alt="Ater Dashboard" 
              fill 
              className="object-cover object-top" 
            />
          </div>
        </div>
      </div>
      
      {/* Base / Keyboard Area */}
      <div className="w-full h-4 bg-[#1A1A1A] rounded-b-[1rem] border-x border-b border-white/10 shadow-xl relative">
        {/* Thumb Indentation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-black/40 rounded-b-full shadow-inner" />
      </div>
    </div>
  );
}
