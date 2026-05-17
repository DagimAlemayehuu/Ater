"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';
import { motion } from 'motion/react';

export default function Home() {
  const [demoMessage, setDemoMessage] = React.useState("");

  const handleWatchDemo = () => {
    setDemoMessage("DEMO ON THE WAY");
    setTimeout(() => setDemoMessage(""), 3000);
  };

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
      {/* SECTION 01: Hero & Mockup Integrated Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full overflow-hidden border-b border-outline-variant pt-16">
        <div className="industrial-container flex flex-col items-center justify-center gap-8 w-full h-full py-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start justify-center gap-6 w-full"
          >
            <h1 className="text-display-hero border-b border-outline-variant pb-4 text-left w-full uppercase">
              EVER HATED STUDYING?
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
            className="flex flex-col items-center justify-center gap-2 mt-4 w-full"
          >
            <IndustrialButton onClick={handleWatchDemo} className="w-full sm:w-auto h-14 px-12">
              WATCH DEMO
            </IndustrialButton>
            {demoMessage && (
              <span className="font-mono text-[10px] text-primary animate-pulse tracking-widest mt-2">
                {demoMessage}
              </span>
            )}
          </motion.div>
        </div>
      </section>

      {/* SECTION 02: Core Benefits */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-8 w-full mb-12">
            <h2 className="text-section-heading">SYSTEM BENEFITS</h2>
            <p className="text-body max-w-xl opacity-85">
              Ater integrates document parser pipelines with active learning methods to make study notes dynamic, organized, and testable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant bg-outline-variant w-full">
            <div className="bg-background p-10 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <h3 className="text-sm font-bold tracking-tight text-on-background uppercase">1. AUTOMATIC IMPORT</h3>
              </div>
              <p className="text-body text-[11px] leading-relaxed opacity-75">
                Drop your textbook PDFs or slides directly into your vault folder. Our background watchers scan, split, and ingest new pages instantly without manual parsing.
              </p>
            </div>
            
            <div className="bg-background p-10 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <h3 className="text-sm font-bold tracking-tight text-on-background uppercase">2. INTUITION GRAPHS</h3>
              </div>
              <p className="text-body text-[11px] leading-relaxed opacity-75">
                Messy textbooks are automatically organized into clear study pathways. Kahn's dependency algorithms arrange topics from simple ideas to advanced concepts.
              </p>
            </div>
            
            <div className="bg-background p-10 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <h3 className="text-sm font-bold tracking-tight text-on-background uppercase">3. VERIFIED RETRIEVAL</h3>
              </div>
              <p className="text-body text-[11px] leading-relaxed opacity-75">
                Locate exact formulas, definitions, or textbook pages in seconds. Ater links quiz questions directly to corresponding page metrics for reliable study review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: HOW IT WORKS */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">HOW IT WORKS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed opacity-85">
                  Ater builds an interconnected knowledge system directly inside your local storage directories. There are no cloud logins, server sync delays, or private data leaks.
                </p>
                <div className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
                  <div>&gt; <strong>Scan</strong>: Background watchdog parses PDFs.</div>
                  <div>&gt; <strong>Analyze</strong>: 11 cooperative agents classify context blocks.</div>
                  <div>&gt; <strong>Sort</strong>: Dependency algorithms build non-cyclic study guides.</div>
                  <div>&gt; <strong>Deploy</strong>: Markdown files are written straight to your vault.</div>
                </div>
              </div>
              
              <div className="p-6 border border-outline-variant bg-surface font-mono text-[11px] leading-relaxed text-on-surface opacity-80 relative overflow-hidden shadow-xl max-w-md w-full mx-auto">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-3">
                  <span className="text-primary font-bold">LOCAL_ORACLE_PIPELINE</span>
                </div>
                <div className="space-y-2">
                  <p className="text-emerald-500 font-bold">&gt; WATCHER DETECTED: CS_Algorithm_Intro.pdf</p>
                  <p>&gt; RUNNING METASCANNER AGENT... BRIEFING READY</p>
                  <p>&gt; TOPOLOGICAL DEP ENGINE RESOLVED 14 CONCEPT NODES</p>
                  <p>&gt; DEPLOYING NOTE: Kahn_Algorithm_Complexity.md</p>
                  <p className="text-primary animate-pulse">&gt; WORKSPACE SECURED IN LOCAL VAULT_</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: FEATURES */}
      <section id="features" className="sticky top-0 z-[35] bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant bg-outline-variant w-full">
              <Link href="/features/academic-dashboard" className="bg-background p-10 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0 group cursor-pointer animate-none">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                  <h3 className="text-sm font-bold tracking-tight text-on-background uppercase group-hover:text-primary transition-colors">ACADEMIC DASHBOARD</h3>
                </div>
                <p className="text-body text-[11px] opacity-75 leading-relaxed">
                  Your entire study schedule in one view. Track courses, deadlines, exam goals, and review dynamic Spaced Repetition quiz cards.
                </p>
                <div className="mt-auto pt-4 w-full">
                  <div className="w-full h-10 border border-outline-variant flex items-center justify-center font-mono text-[10px] tracking-widest uppercase hover:bg-primary hover:text-background transition-colors">
                    EXPLORE DASHBOARD
                  </div>
                </div>
              </Link>
              
              <Link href="/features/knowledge-base" className="bg-background p-10 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 border-r border-outline-variant last:border-r-0 group cursor-pointer animate-none">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                  <h3 className="text-sm font-bold tracking-tight text-on-background uppercase group-hover:text-primary transition-colors">KNOWLEDGE BASE</h3>
                </div>
                <p className="text-body text-[11px] opacity-75 leading-relaxed">
                  Local-first note structure. Dynamic three-panel views, PDF reading overlays, D3 force graph visuals, and conceptual study paths.
                </p>
                <div className="mt-auto pt-4 w-full">
                  <div className="w-full h-10 border border-outline-variant flex items-center justify-center font-mono text-[10px] tracking-widest uppercase hover:bg-primary hover:text-background transition-colors">
                    EXPLORE VAULTS
                  </div>
                </div>
              </Link>
              
              <Link href="/features/agents" className="bg-background p-10 flex flex-col gap-6 hover:bg-surface transition-colors duration-150 group cursor-pointer animate-none">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                  <h3 className="text-sm font-bold tracking-tight text-on-background uppercase group-hover:text-primary transition-colors">REASONING AGENTS</h3>
                </div>
                <p className="text-body text-[11px] opacity-75 leading-relaxed">
                  Cooperative network of 11 local agents. Epistemic note parsing, automatic topic sorting, 85+ domain rules, and self-healing.
                </p>
                <div className="mt-auto pt-4 w-full">
                  <div className="w-full h-10 border border-outline-variant flex items-center justify-center font-mono text-[10px] tracking-widest uppercase hover:bg-primary hover:text-background transition-colors">
                    EXPLORE AGENTS
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: SECURITY & DATA PRIVACY */}
      <section className="sticky top-0 z-40 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">LOCAL SECURITY</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed opacity-85">
                  Your study materials remain strictly your own. Ater runs fully offline on your CPU with zero remote servers or cloud tracking trackers.
                </p>
                <div className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
                  <div>&gt; <strong>Data Ownership</strong>: 100% local markdown file structure.</div>
                  <div>&gt; <strong>Zero Training</strong>: None of your documents are uploaded to cloud servers.</div>
                  <div>&gt; <strong>Portability</strong>: Take your notes anywhere, completely tool-agnostic.</div>
                </div>
              </div>
              
              <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-2 max-w-md mx-auto relative overflow-hidden shadow-xl">
                <span className="text-primary font-bold font-mono text-xs">VAULT_LOCK_STATUS</span>
                <span className="font-mono text-[11px] opacity-75 uppercase">AES-256 Local Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: PRICING PREVIEW */}
      <section className="sticky top-0 z-[45] bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">BETA PRICING</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed opacity-85">
                  We believe in highly transparent, local-first utility. Ater is currently in private beta, making all core features fully functional and free of charge. Full commercial plans will be launched during our public release.
                </p>
                <div className="mt-4">
                  <Link href="/pricing">
                    <IndustrialButton size="sm">
                      EXPLORE BETA PRICING
                    </IndustrialButton>
                  </Link>
                </div>
              </div>
              
              <div className="border border-outline-variant bg-surface p-6 font-mono text-[11px] text-left flex flex-col gap-4 shadow-xl max-w-md w-full mx-auto">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="text-primary font-bold">BETA_STATUS</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-bold">CURRENT_PRICE</span>
                  <div className="flex items-baseline gap-1 text-primary">
                    <span className="text-2xl font-black">FREE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07: WAITLIST CTA */}
      <section className="sticky top-0 z-[48] bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20 flex flex-col items-center justify-center gap-8 text-center">
          <h2 className="text-display-hero uppercase">
            JOIN THE WAITLIST
          </h2>
          <p className="text-body max-w-xl leading-relaxed opacity-85">
            Secure early-access to the local-first Ater Study Engine. Reserve your vault slots before our public launch.
          </p>
          <Link href="/waitlist">
            <IndustrialButton className="h-14 px-12">
              JOIN THE WAITLIST
            </IndustrialButton>
          </Link>
        </div>
      </section>

      {/* SECTION 08: DIRECT CHANNELS */}
      <section className="sticky top-0 z-[50] bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">GET IN TOUCH</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed opacity-85">
                  Have questions, feature requests, or technical feedback? Reach out directly to our cooperative core labs team. We support open communication through all channels.
                </p>
                <div className="mt-4">
                  <Link href="/contact">
                    <IndustrialButton size="sm">
                      EXPLORE SOCIAL CHANNELS
                    </IndustrialButton>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-w-md w-full mx-auto font-mono text-[10px]">
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="opacity-40 uppercase block mb-1">Email</span>
                  <span className="font-bold text-on-surface">hello@ater.io</span>
                </div>
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="opacity-40 uppercase block mb-1">Twitter</span>
                  <span className="font-bold text-on-surface">@ater_app</span>
                </div>
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="opacity-40 uppercase block mb-1">GitHub</span>
                  <span className="font-bold text-on-surface">ater-labs</span>
                </div>
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="opacity-40 uppercase block mb-1">Discord</span>
                  <span className="font-bold text-on-surface">ater_community</span>
                </div>
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
