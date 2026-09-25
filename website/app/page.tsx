'use client';

import React from 'react';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { InteractiveFlowDemo } from '@/components/landing/InteractiveFlowDemo';
import { WaitlistCtaSection } from '@/components/landing/WaitlistCtaSection';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/i18n/translations';
import Link from 'next/link';

export default function LandingPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <HeroSection />
        {/* How it works placed above the live demo */}
        <BenefitsSection />
        <InteractiveFlowDemo />
        <WaitlistCtaSection />
      </main>

      <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 py-8 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span>ATER</span>
              <span className="text-sm font-black opacity-60">አጠር</span>
            </Link>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <a
              href="https://github.com/DagimAlemayehuu/Ater"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {t.nav.github}
            </a>
            <Link href="/auth?mode=login" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {t.footer.signIn}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
