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
      <section className="z-20 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-6 sm:py-12 md:py-8 sm:py-12 md:py-20">
          <div className="flex flex-col gap-6 md:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 w-full mb-8 md:mb-12">
            <h2 className="text-section-heading">SYSTEM BENEFITS</h2>
            <p className="text-body max-w-xl text-on-surface-variant">
              Ater integrates document parser pipelines with active learning methods to make study notes dynamic, organized, and testable.
            </p>
          </div>

          <div className="flex flex-col border border-outline-variant w-full">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant last:border-b-0">
              <div className="md:col-span-4 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex items-center">
                <h3 className="text-sm font-bold tracking-tight uppercase">1. AUTOMATIC IMPORT</h3>
              </div>
              <div className="md:col-span-8 p-4 sm:p-6 md:p-8 bg-background flex items-center">
                <p className="text-body text-[11px] leading-relaxed text-on-surface-variant">
                  Drop your textbook PDFs or slides directly into your vault folder. Our background watchers scan, split, and ingest new pages instantly without manual parsing.
                </p>
              </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant last:border-b-0">
              <div className="md:col-span-4 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex items-center">
                <h3 className="text-sm font-bold tracking-tight uppercase">2. INTUITION GRAPHS</h3>
              </div>
              <div className="md:col-span-8 p-4 sm:p-6 md:p-8 bg-background flex items-center">
                <p className="text-body text-[11px] leading-relaxed text-on-surface-variant">
                  Messy textbooks are automatically organized into clear study pathways. Kahn&apos;s dependency algorithms arrange topics from simple ideas to advanced concepts.
                </p>
              </div>
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant last:border-b-0">
              <div className="md:col-span-4 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex items-center">
                <h3 className="text-sm font-bold tracking-tight uppercase">3. VERIFIED RETRIEVAL</h3>
              </div>
              <div className="md:col-span-8 p-4 sm:p-6 md:p-8 bg-background flex items-center">
                <p className="text-body text-[11px] leading-relaxed text-on-surface-variant">
                  Locate exact formulas, definitions, or textbook pages in seconds. Ater links quiz questions directly to corresponding page metrics for reliable study review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: HOW IT WORKS */}
      <section className="z-30 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20">
          <div className="flex flex-col gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">HOW IT WORKS</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed text-on-surface-variant">
                  Ater builds an interconnected knowledge system inside your local vault. Account access is used for beta activation, while your study files stay on your machine.
                </p>
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-on-surface-variant">
                  <div>&gt; <strong>Scan</strong>: Background watchdog parses PDFs.</div>
                  <div>&gt; <strong>Analyze</strong>: Specialized agents classify context blocks.</div>
                  <div>&gt; <strong>Sort</strong>: Dependency algorithms build non-cyclic study guides.</div>
                  <div>&gt; <strong>Deploy</strong>: Markdown files are written straight to your vault.</div>
                </div>
              </div>
              
              <TerminalAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: FEATURES */}
      <section id="features" className="z-[35] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20">
          <div className="flex flex-col gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">FEATURES</h2>
            <div className="flex flex-col gap-0 border border-outline-variant w-full">
              <Link href="/features/academic-dashboard" className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant hover:bg-surface-container transition-colors group">
                <div className="md:col-span-3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant flex items-center">
                  <h3 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">ACADEMIC DASHBOARD</h3>
                </div>
                <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex items-center">
                  <p className="text-body text-[11px] text-on-surface-variant leading-relaxed">
                    Your entire study schedule in one view. Track courses, deadlines, exam goals, and review dynamic Spaced Repetition quiz cards.
                  </p>
                </div>
                <div className="md:col-span-2 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-outline-variant flex items-center justify-center bg-surface-container-low group-hover:bg-primary transition-colors">
                  <span className="font-mono text-[10px] tracking-widest uppercase group-hover:text-background transition-colors group-hover:translate-x-1 duration-300 transform">EXPLORE</span>
                </div>
              </Link>
              
              <Link href="/features/knowledge-base" className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant hover:bg-surface-container transition-colors group">
                <div className="md:col-span-3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant flex items-center">
                  <h3 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">KNOWLEDGE BASE</h3>
                </div>
                <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex items-center">
                  <p className="text-body text-[11px] text-on-surface-variant leading-relaxed">
                    Local-first note structure. Dynamic three-panel views, PDF reading overlays, D3 force graph visuals, and conceptual study paths.
                  </p>
                </div>
                <div className="md:col-span-2 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-outline-variant flex items-center justify-center bg-surface-container-low group-hover:bg-primary transition-colors">
                  <span className="font-mono text-[10px] tracking-widest uppercase group-hover:text-background transition-colors group-hover:translate-x-1 duration-300 transform">EXPLORE</span>
                </div>
              </Link>
              
              <Link href="/features/agents" className="grid grid-cols-1 md:grid-cols-12 border-b-0 hover:bg-surface-container transition-colors group">
                <div className="md:col-span-3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant flex items-center">
                  <h3 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">REASONING AGENTS</h3>
                </div>
                <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex items-center">
                  <p className="text-body text-[11px] text-on-surface-variant leading-relaxed">
                    Cooperative reasoning tools for note parsing, topic sorting, domain rules, and recovery from malformed inputs.
                  </p>
                </div>
                <div className="md:col-span-2 p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-outline-variant flex items-center justify-center bg-surface-container-low group-hover:bg-primary transition-colors">
                  <span className="font-mono text-[10px] tracking-widest uppercase group-hover:text-background transition-colors group-hover:translate-x-1 duration-300 transform">EXPLORE</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: SECURITY & DATA PRIVACY */}
      <section className="z-40 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20">
          <div className="flex flex-col gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">LOCAL SECURITY</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center">
              <div className="flex flex-col gap-6">
                <p className="text-body leading-relaxed text-on-surface-variant">
                  Your study materials remain under your control. Ater writes to local files and uses user-selected providers only when a feature needs model inference.
                </p>
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-on-surface-variant">
                  <div>&gt; <strong>Data Ownership</strong>: 100% local markdown file structure.</div>
                  <div>&gt; <strong>Provider Control</strong>: You choose which model endpoints, if any, receive context.</div>
                  <div>&gt; <strong>Portability</strong>: Take your notes anywhere, completely tool-agnostic.</div>
                </div>
              </div>
              
              <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-2 max-w-md mx-auto relative overflow-hidden shadow-xl">
                <span className="text-primary font-bold font-mono text-xs">VAULT_LOCK_STATUS</span>
                <span className="font-mono text-[11px] text-on-surface-variant uppercase">AES-256 Local Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: PRICING PREVIEW */}
      <section className="z-[45] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20">
          <div className="flex flex-col gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">BETA PRICING</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center">
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
      <section className="z-[48] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20 flex flex-col items-center justify-center gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 text-center">
          <h2 className="text-display-hero uppercase">
            JOIN THE WAITLIST
          </h2>
          <p className="text-body max-w-xl leading-relaxed text-on-surface-variant">
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
      <section className="z-[50] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-8 sm:py-12 md:py-20">
          <div className="flex flex-col gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 w-full">
            <h2 className="text-display-hero max-w-5xl">GET IN TOUCH</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center">
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
              
              <div className="grid grid-cols-2 gap-3 max-w-md w-full mx-auto font-mono text-[10px]">
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
