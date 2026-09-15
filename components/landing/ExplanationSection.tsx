'use client';

import React from 'react';

export function ExplanationSection() {
  return (
    <section id="explanation" className="w-full max-w-4xl mx-auto px-4 py-16 scroll-mt-20">
      <div className="text-center mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          How Ater Works
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Most learning platforms give you text to read. Ater makes you think, structure, and articulate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Step 01</div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Tell us what you want to learn
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Enter any topic or concept. We ask quick questions to learn your current experience level and what you want to build.
          </p>
        </div>

        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Step 02</div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Generate and approve your roadmap
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Ater builds a clean step-by-step roadmap tailored to you. Review and approve it before starting.
          </p>
        </div>

        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Step 03</div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Short notes and voice questions
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Read a concise note without fluff, then answer questions aloud or in writing. Voice checks if you truly understand.
          </p>
        </div>
      </div>
    </section>
  );
}
