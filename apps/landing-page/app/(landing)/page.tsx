"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Terminal, Download, Shield, Lock, Activity, Zap, Cpu, Search, Layout } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';
import { motion } from 'motion/react';


export default function Home() {
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#features") {
      const el = document.getElementById("features");
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <>
      {/* Hero & Mockup Integrated Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full overflow-hidden border-b border-outline-variant pt-16">
        <div className="industrial-container flex flex-col items-center justify-center gap-8 w-full h-full py-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start justify-center gap-6 w-full"
          >
            <h1 className="text-display-hero border-b border-outline-variant pb-4 text-left w-full">
              LEARN FASTER.<br />SCORE BETTER.
            </h1>
          </motion.div>

          {/* Integrated Mockup */}
          <div className="w-full max-w-4xl relative transform scale-[0.85] sm:scale-90 md:scale-95 lg:scale-100 origin-center transition-transform duration-500 flex items-center justify-center">
             <FullMacbookMockup />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 w-full items-center justify-center mt-4"
          >
            <Link href="/auth?mode=signup">
              <IndustrialButton className="w-full sm:w-auto h-14 px-12">
                JOIN WAITLIST
              </IndustrialButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Core Benefits */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 industrial-border bg-outline-variant w-full">
            <div className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <h2 className="text-lg font-bold tracking-tight text-on-background uppercase">IMPORT</h2>
              </div>
              <p className="text-body">
                Upload your PDFs and textbooks. Ater reads and understands them instantly.
              </p>
              <Download className="size-8 text-primary mt-auto pt-4" />
            </div>
            <div className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <h2 className="text-lg font-bold tracking-tight text-on-background uppercase">ORGANIZE</h2>
              </div>
              <p className="text-body">
                Turn messy notes into clear structures. Connect ideas effortlessly.
              </p>
              <Cpu className="size-8 text-primary mt-auto pt-4" />
            </div>
            <div className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <h2 className="text-lg font-bold tracking-tight text-on-background uppercase">STUDY</h2>
              </div>
              <p className="text-body">
                Find exactly what you need. Review for exams with perfect accuracy.
              </p>
              <Zap className="size-8 text-primary mt-auto pt-4" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">HOW IT WORKS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="flex flex-col gap-8">
                <p className="text-body max-w-xl">
                  Ater runs entirely on your device. Your data never leaves your computer, ensuring absolute privacy and security for your notes.
                </p>
              </div>
              <div className="p-8 industrial-border bg-surface font-mono text-[11px] leading-relaxed text-on-surface opacity-80 relative overflow-hidden">
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
      <section id="features" className="sticky top-0 z-[35] bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 industrial-border bg-outline-variant w-full">
              <Link href="/features/academic-dashboard" className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0 group cursor-pointer animate-none">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                  <h3 className="text-lg font-bold tracking-tight text-on-background uppercase group-hover:text-primary transition-colors">ACADEMIC DASHBOARD</h3>
                </div>
                <p className="text-body">
                  YOUR ENTIRE ACADEMIC LIFE IN A SINGLE VIEW. MANAGE COURSES, SEMESTERS, AND DEADLINES WITH SURGICAL PRECISION.
                </p>
                <div className="flex items-center gap-2 mt-auto pt-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="technical-label text-[10px]">EXPLORE</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/features/knowledge-base" className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0 group cursor-pointer animate-none">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                  <h3 className="text-lg font-bold tracking-tight text-on-background uppercase group-hover:text-primary transition-colors">KNOWLEDGE BASE</h3>
                </div>
                <p className="text-body">
                  LOCAL-FIRST KNOWLEDGE ARCHITECTURE. SECURED WITH MAXIMUM COMPRESSION AND GRAPH TOPOLOGY CONNECTIONS DIRECTLY INSIDE YOUR VAULT.
                </p>
                <div className="flex items-center gap-2 mt-auto pt-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="technical-label text-[10px]">EXPLORE</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/features/agents" className="bg-background p-12 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 group cursor-pointer animate-none">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                  <h3 className="text-lg font-bold tracking-tight text-on-background uppercase group-hover:text-primary transition-colors">AGENTS</h3>
                </div>
                <p className="text-body">
                  CONTEXT-AWARE ARTIFICIAL INTELLIGENCE. AGENTS DESIGNED TO REASON ACROSS THE ENTIRE KNOWLEDGE ARCHITECTURE.
                </p>
                <div className="flex items-center gap-2 mt-auto pt-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="technical-label text-[10px]">EXPLORE</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="sticky top-0 z-40 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">SECURITY</h2>
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="relative w-48 h-48 industrial-border flex items-center justify-center group overflow-hidden">
                  <Lock className="size-16 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex-grow flex flex-col gap-8">
                <p className="text-body leading-relaxed">
                  Your work is your own. We never use your data to train AI models. Everything stays on your local device, private and secure.
                </p>
              </div>
            </div>
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
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
