'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/i18n/translations';

export function WaitlistCtaSection() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section id="waitlist" className="snap-section relative w-full min-h-[550px] md:h-screen md:min-h-[600px] flex flex-col justify-center items-center overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 px-4 sm:px-8 py-16 md:py-0 scroll-mt-16 select-none">
      {/* Foreground Content: Exactly centered in the viewport */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-5 flex flex-col items-center justify-center"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          {t.cta.title}
        </h2>
        
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed font-normal">
          {t.cta.subtitle}
        </p>

        <div className="pt-2">
          <Link
            href="/auth?mode=signup"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-sm sm:text-base transition-all shadow-xs hover:shadow-sm cursor-pointer"
          >
            <span>{t.cta.button}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Watermark: Slightly raised and wider with tracking */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[42%] pointer-events-none select-none text-center leading-none w-full flex justify-center">
        <div className="opacity-[0.07] dark:opacity-[0.10] text-zinc-900 dark:text-zinc-100 font-black leading-none text-center select-none whitespace-nowrap">
          {language === 'am' ? (
            <span className="text-[190px] sm:text-[260px] md:text-[340px] lg:text-[420px] block font-black scale-y-95 tracking-wide leading-none">
              አጠር
            </span>
          ) : (
            <span className="text-[170px] sm:text-[240px] md:text-[320px] lg:text-[400px] block font-black font-sans tracking-[0.08em] leading-none">
              ATER
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
