'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/i18n/translations';

export function BenefitsSection() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section id="how-it-works" className="snap-section w-full min-h-[85vh] md:min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-12 md:py-16 scroll-mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-5xl mx-auto flex flex-col justify-center"
      >
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
            {t.benefits.title}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-parchment-300 dark:border-zinc-800 bg-parchment-200/50 dark:bg-zinc-900/40 space-y-3 shadow-xs hover:border-parchment-400 dark:hover:border-zinc-700 transition-colors">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{t.benefits.step1Tag}</span>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.benefits.step1Title}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t.benefits.step1Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-parchment-300 dark:border-zinc-800 bg-parchment-200/50 dark:bg-zinc-900/40 space-y-3 shadow-xs hover:border-parchment-400 dark:hover:border-zinc-700 transition-colors">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{t.benefits.step2Tag}</span>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.benefits.step2Title}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t.benefits.step2Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-parchment-300 dark:border-zinc-800 bg-parchment-200/50 dark:bg-zinc-900/40 space-y-3 shadow-xs hover:border-parchment-400 dark:hover:border-zinc-700 transition-colors">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{t.benefits.step3Tag}</span>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.benefits.step3Title}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t.benefits.step3Desc}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
