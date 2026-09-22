'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/i18n/translations';
import { Sun, Moon, Github, Languages } from 'lucide-react';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fbf7f0]/80 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand mark with same font size in English and Amharic */}
        <Link
          href="/"
          className="text-xl md:text-2xl font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span>ATER</span>
          <span className="text-xl md:text-2xl font-black opacity-60">አጠር</span>
        </Link>

        {/* Center: Clean navigation links - mathematically centered */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium absolute left-1/2 -translate-x-1/2">
          <a
            href="#how-it-works"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t.nav.howItWorks}
          </a>
          <a
            href="#demo"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t.nav.demo}
          </a>
          <a
            href="#waitlist"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t.nav.waitlist}
          </a>
        </nav>

        {/* Right: GitHub, Language Toggle, Theme Toggle, Sign In */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/DagimAlemayehuu/Ater"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Minimal Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-100/80 hover:bg-zinc-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title={language === 'en' ? 'ወደ አማርኛ ቀይር' : 'Switch to English'}
          >
            <Languages className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{language === 'en' ? 'EN' : 'አማ'}</span>
          </button>

          <Link
            href="/auth?mode=login"
            className="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all shadow-xs cursor-pointer"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
