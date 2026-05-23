import React from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/landing/HeroSection';
import { TerminalAnimation } from '@/components/landing/TerminalAnimation';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function Home() {
  return (
    <>
      <HeroSection />

      {/* SECTION 02: Core Benefits */}
      <section className="z-20 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 md:gap-8 flex-1 py-8">
          <div className="flex flex-col gap-4 sm:p-6 md:p-8 w-full">
            <h2 className="text-section-heading">HOW ATER HELPS YOU</h2>
            <p className="text-body max-w-xl text-on-surface-variant">
              Ater takes your textbooks or school slides, turns them into neat notes, and helps you test your memory. It keeps your school files organized in one clean place so you can study less and get better grades.
            </p>
          </div>

          <div className="flex flex-col border border-outline-variant w-full">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant last:border-b-0">
              <div className="md:col-span-4 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex items-center">
                <h3 className="text-sm font-bold tracking-tight uppercase">1. EASY DROP & INGEST</h3>
              </div>
              <div className="md:col-span-8 p-4 sm:p-6 md:p-8 bg-background flex items-center">
                <p className="text-body text-[11px] leading-relaxed text-on-surface-variant">
                  Just drop your study PDFs or class slides into your notes folder. Ater reads, splits, and structures them instantly. No manual typing, no copy-pasting.
                </p>
              </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant last:border-b-0">
              <div className="md:col-span-4 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex items-center">
                <h3 className="text-sm font-bold tracking-tight uppercase">2. SMART ROADMAPS</h3>
              </div>
              <div className="md:col-span-8 p-4 sm:p-6 md:p-8 bg-background flex items-center">
                <p className="text-body text-[11px] leading-relaxed text-on-surface-variant">
                  Ater builds a step-by-step roadmap for you. It automatically organizes topics from easiest to hardest, showing you exactly what to study next so you never get confused.
                </p>
              </div>
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant last:border-b-0">
              <div className="md:col-span-4 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex items-center">
                <h3 className="text-sm font-bold tracking-tight uppercase">3. INSTANT QUIZZES</h3>
              </div>
              <div className="md:col-span-8 p-4 sm:p-6 md:p-8 bg-background flex items-center">
                <p className="text-body text-[11px] leading-relaxed text-on-surface-variant">
                  Test yourself with practice quizzes made straight from your files. If you get an answer wrong, click the link to open the exact book page and review it instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: HOW IT WORKS */}
      <section className="z-30 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 md:gap-8 flex-1 py-8">
          <div className="flex flex-col gap-4 sm:p-6 md:p-8 w-full">
            <h2 className="text-display-hero max-w-5xl">HOW IT WORKS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed text-on-surface-variant">
                  Ater builds a private, connected study vault on your computer. All your files stay safe and local on your machine—never sent to the cloud.
                </p>
                <div className="space-y-3 text-[11px] leading-relaxed text-on-surface-variant">
                  <div><strong>Scan</strong>: Drop your books and slides into your folder.</div>
                  <div><strong>Sort</strong>: Ater organizes the topics from easy to hard.</div>
                  <div><strong>Learn</strong>: Study with clean, connected notes.</div>
                  <div><strong>Practice</strong>: Take auto-generated quizzes to test your memory.</div>
                </div>
              </div>
              
              <TerminalAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: FEATURES */}
      <section id="features" className="z-40 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 md:gap-8 flex-1 py-8">
          <div className="flex flex-col gap-4 sm:p-6 md:p-8 w-full">
            <h2 className="text-display-hero max-w-5xl">FEATURES</h2>
            <div className="flex flex-col gap-0 border border-outline-variant w-full">
              <Link href="/features/academic-dashboard" className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant hover:bg-surface-container transition-colors group">
                <div className="md:col-span-3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant flex items-center">
                  <h3 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">ACADEMIC DASHBOARD</h3>
                </div>
                <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex items-center">
                  <p className="text-body text-[11px] text-on-surface-variant leading-relaxed">
                    Your school control center. Track your semesters, grades, teacher info, and upcoming tests in one simple, clear dashboard.
                  </p>
                </div>
                <div className="md:col-span-2 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-outline-variant flex items-center justify-center bg-surface-container-low group-hover:bg-primary transition-colors">
                  <span className="text-[10px] tracking-widest uppercase group-hover:text-background transition-colors group-hover:translate-x-1 duration-300 transform">EXPLORE</span>
                </div>
              </Link>
              
              <Link href="/features/knowledge-base" className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant hover:bg-surface-container transition-colors group">
                <div className="md:col-span-3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant flex items-center">
                  <h3 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">KNOWLEDGE BASE</h3>
                </div>
                <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex items-center">
                  <p className="text-body text-[11px] text-on-surface-variant leading-relaxed">
                    A safe place for your notes. Read your books and notes side-by-side, click on links to jump to other lessons, and see a visual map of how everything connects.
                  </p>
                </div>
                <div className="md:col-span-2 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-outline-variant flex items-center justify-center bg-surface-container-low group-hover:bg-primary transition-colors">
                  <span className="text-[10px] tracking-widest uppercase group-hover:text-background transition-colors group-hover:translate-x-1 duration-300 transform">EXPLORE</span>
                </div>
              </Link>
              
              <Link href="/features/agents" className="grid grid-cols-1 md:grid-cols-12 border-b-0 hover:bg-surface-container transition-colors group">
                <div className="md:col-span-3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant flex items-center">
                  <h3 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">REASONING AGENTS</h3>
                </div>
                <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex items-center">
                  <p className="text-body text-[11px] text-on-surface-variant leading-relaxed">
                    Helpful study assistants. Ater uses small, private computer helpers that automatically write your notes, fix formatting mistakes, and make quizzes for you.
                  </p>
                </div>
                <div className="md:col-span-2 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-outline-variant flex items-center justify-center bg-surface-container-low group-hover:bg-primary transition-colors">
                  <span className="text-[10px] tracking-widest uppercase group-hover:text-background transition-colors group-hover:translate-x-1 duration-300 transform">EXPLORE</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: SECURITY & DATA PRIVACY */}
      <section className="z-50 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 md:gap-8 flex-1 py-8">
          <div className="flex flex-col gap-4 sm:p-6 md:p-8 w-full">
            <h2 className="text-display-hero max-w-5xl">LOCAL SECURITY</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed text-on-surface-variant">
                  Your files stay strictly on your computer. Ater doesn't store your documents on the cloud, keeping your personal school notes 100% private.
                </p>
                <div className="space-y-3 text-[11px] leading-relaxed text-on-surface-variant">
                  <div><strong>Data Ownership</strong>: 100% local markdown file structure.</div>
                  <div><strong>Provider Control</strong>: You choose which model endpoints, if any, receive context.</div>
                  <div><strong>Portability</strong>: Take your notes anywhere, completely tool-agnostic.</div>
                </div>
              </div>
              
              <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 max-w-md mx-auto relative overflow-hidden shadow-xl text-[10px] text-left">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                  <span className="text-primary font-black uppercase tracking-wider">SECURITY DAEMON</span>
                  <span className="text-emerald-500 animate-pulse">SECURE</span>
                </div>
                <div className="space-y-2.5 opacity-80">
                  <div className="flex justify-between">
                    <span className="opacity-40">YOUR NOTE FOLDER</span>
                    <span className="font-bold text-on-surface">~/.ater/vault config</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40">FILE ENCRYPTION</span>
                    <span className="font-bold text-on-surface">AES-256-GCM LOCAL STORE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40">INTERNET STATE</span>
                    <span className="font-bold text-red-500">OFFLINE FIRST (100% PRIVATE)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40">SEARCH DATABASE</span>
                    <span className="font-bold text-on-surface">LanceDB LOCAL v3.0</span>
                  </div>
                </div>
                <div className="border-t border-outline-variant/30 pt-2 flex items-center justify-between text-[8px]">
                  <span className="opacity-30 font-sans">ENCRYPTED USING USER HARDWARE KEY</span>
                  <span className="font-bold border border-outline-variant px-1 bg-surface-container-low">LOCK: TRUE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: PRICING PREVIEW */}
      <section className="z-60 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 md:gap-8 flex-1 py-8">
          <div className="flex flex-col gap-4 sm:p-6 md:p-8 w-full">
            <h2 className="text-display-hero max-w-5xl">BETA PRICING</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed text-on-surface-variant">
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
              
              <div className="border border-outline-variant bg-surface p-6 text-[11px] text-left flex flex-col gap-4 shadow-xl max-w-md w-full mx-auto">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="text-primary font-bold">BETA STATUS</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-bold">CURRENT PRICE</span>
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
      <section className="z-70 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20 flex flex-col items-center justify-center gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 text-center">
          <h2 className="text-display-hero uppercase">
            JOIN THE WAITLIST
          </h2>
          <p className="text-body max-w-xl leading-relaxed text-on-surface-variant">
            Get early access to Ater today. Secure your private school vault spot before we launch to the public.
          </p>
          <Link href="/auth?mode=signup">
            <IndustrialButton className="h-14 px-12">
              JOIN THE WAITLIST
            </IndustrialButton>
          </Link>
        </div>
      </section>

      {/* SECTION 08: DIRECT CHANNELS */}
      <section className="z-80 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col justify-center gap-6 md:gap-8 flex-1 py-8">
          <div className="flex flex-col gap-4 sm:p-6 md:p-8 w-full">
            <h2 className="text-display-hero max-w-5xl">GET IN TOUCH</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed text-on-surface-variant">
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
              
              <div className="grid grid-cols-2 gap-3 max-w-md w-full mx-auto text-[10px]">
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="text-on-surface-variant uppercase block mb-1">Email</span>
                  <span className="font-bold text-on-surface">hello@ater.io</span>
                </div>
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="text-on-surface-variant uppercase block mb-1">Twitter</span>
                  <span className="font-bold text-on-surface">@ater_app</span>
                </div>
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="text-on-surface-variant uppercase block mb-1">GitHub</span>
                  <span className="font-bold text-on-surface">ater-labs</span>
                </div>
                <div className="p-4 border border-outline-variant bg-surface">
                  <span className="text-on-surface-variant uppercase block mb-1">Discord</span>
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
