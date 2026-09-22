'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Globe,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { convertResearchToCurriculum } from '@/lib/research/bridge';
import type { ResearchFinding } from '@/lib/notebooklm/client';
import { stripEmojis } from '@/lib/curriculum/intake';
import { saveCourseToStore } from '@/lib/sync/store';
import type { CourseCurriculum } from '@/types';

export default function ResearchStationPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isAm = language === 'am';

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'fast' | 'deep'>('fast');
  const [sources, setSources] = useState<Array<'scholarxiv' | 'web' | 'notebooklm'>>([
    'scholarxiv',
    'web',
    'notebooklm',
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [finding, setFinding] = useState<ResearchFinding | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInductingCourse, setIsInductingCourse] = useState(false);

  const toggleSource = (src: 'scholarxiv' | 'web' | 'notebooklm') => {
    setSources((prev) => {
      if (prev.includes(src)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((s) => s !== src);
      }
      return [...prev, src];
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = stripEmojis(query).trim();
    if (!cleanQ || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setFinding(null);

    try {
      const res = await fetch('/api/research/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQ,
          mode,
          sources,
          limit: 10,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Research request failed with status ${res.status}`);
      }

      const resData = await res.json();
      const findingData: ResearchFinding = resData.data || {
        title: resData.title || cleanQ,
        summary: resData.summary || '',
        takeaways: resData.takeaways || [],
        papers: resData.papers || [],
      };

      setFinding(findingData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to conduct autonomous research.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToCourse = async () => {
    if (!finding || isInductingCourse) return;
    setIsInductingCourse(true);

    try {
      // 1. Convert research finding to CourseCurriculum contract
      const newCurriculum: CourseCurriculum = convertResearchToCurriculum({
        finding,
        language: isAm ? 'am' : 'en',
      });

      // 2. Persist locally to ater_curricula and save to sync store
      try {
        const stored = localStorage.getItem('ater_curricula');
        let existing: CourseCurriculum[] = [];
        if (stored) {
          existing = JSON.parse(stored);
        }
        const updated = [newCurriculum, ...existing.filter((c) => c.id !== newCurriculum.id)];
        localStorage.setItem('ater_curricula', JSON.stringify(updated));
        localStorage.setItem('ater_active_course_id', newCurriculum.id);
      } catch {}

      // Fire and forget cloud sync
      saveCourseToStore(newCurriculum).catch(() => {});

      // 3. Navigate directly to /app with course query to immediately start the living course
      router.push(`/app?courseId=${encodeURIComponent(newCurriculum.id)}&view=study`);
    } catch (err: any) {
      setIsInductingCourse(false);
      setErrorMessage(err.message || 'Failed to convert research into living course.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-1 rounded-md"
            title={isAm ? 'ወደ መተግበሪያ ተመለስ' : 'Back to Ater App'}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium hidden sm:inline">{isAm ? 'መተግበሪያ' : 'Workspace'}</span>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-500" />
            <h1 className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-900 dark:text-zinc-100">
              {isAm ? 'የምርምር ጣቢያ (Research Station)' : 'Autonomous Research Station'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-mono"
          >
            ATER
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Intro Hero */}
        <div className="space-y-2 text-center max-w-xl mx-auto pt-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
            <span>Scholarxiv & NotebookLM Grounding</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
            {isAm ? 'ሳይንሳዊ ምርምር እና ትንታኔ' : 'Deep Scholarly Research'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isAm
              ? 'ከ3 ሚሊዮን በላይ ጥናታዊ ወረቀቶች እና ሰነዶች ላይ በመመርኮዝ የመጀመሪያ መርሆችን ይመርምሩ እና በቀጥታ ወደ በይነተገናኝ ትምህርት ይቀይሩ።'
              : 'Synthesize academic preprints and verified literature with zero trivia. Turn any research topic directly into a living Socratic course.'}
          </p>
        </div>

        {/* Search Panel */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 shadow-xs space-y-4">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAm
                  ? 'የምርምር ርዕስ ያስገቡ (ለምሳሌ፡ Raft Consensus, Attention Mechanism, PagedAttention)...'
                  : 'Enter any research domain (e.g. Raft Consensus, FlashAttention, Virtual Memory)...'
              }
              className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAm ? (
                'ምርምር ጀምር'
              ) : (
                'Research'
              )}
            </button>
          </form>

          {/* Controls: Mode Toggle & Source Toggles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs border-t border-zinc-200/50 dark:border-zinc-800/50">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">
                {isAm ? 'ሁነታ' : 'Mode'}:
              </span>
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setMode('fast')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    mode === 'fast'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {isAm ? 'ፈጣን (~30s)' : 'Fast (~30s)'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('deep')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    mode === 'deep'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {isAm ? 'ጥልቅ (~5m)' : 'Deep (~5m)'}
                </button>
              </div>
            </div>

            {/* Source Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">
                {isAm ? 'ምንጮች' : 'Sources'}:
              </span>

              <button
                type="button"
                onClick={() => toggleSource('scholarxiv')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  sources.includes('scholarxiv')
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Scholarxiv (3M+)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSource('web')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  sources.includes('web')
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Web Insights</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSource('notebooklm')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  sources.includes('notebooklm')
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>NotebookLM</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-4">
            <div className="w-8 h-8 border-[2px] border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {isAm ? 'ጥናታዊ መረጃዎችን በማጣራት ላይ...' : 'Conducting multi-source literature synthesis...'}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {mode === 'deep'
                  ? isAm
                    ? 'ጥልቅ ምርምር ሁነታ፡ የበርካታ ሰነዶች ትንታኔ በመካሄድ ላይ...'
                    : 'Deep research mode: executing iterative academic synthesis...'
                  : isAm
                    ? 'ፈጣን ሁነታ፡ ስኮላርዛይቭ እና የማጠቃለያ ሰነዶች በመጣራት ላይ...'
                    : 'Fast mode: querying Scholarxiv and briefing models...'}
              </p>
            </div>
          </div>
        )}

        {/* Results View */}
        {finding && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Finding Card with Course Bridge CTA */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-0.5">
                    {isAm ? 'የተረጋገጠ የምርምር ማጠቃለያ' : 'Synthesized Research Brief'}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-serif">
                    {stripEmojis(finding.title)}
                  </h3>
                </div>

                {/* Turn Research into Living Course Bridge Button */}
                <button
                  type="button"
                  onClick={handleConvertToCourse}
                  disabled={isInductingCourse}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2 shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isInductingCourse ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>
                    {isAm ? 'ወደ ሕያው ትምህርት ቀይር' : 'Convert into Living Course'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Summary Paragraph */}
              <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                {stripEmojis(finding.summary)}
              </div>

              {/* Key Takeaways */}
              {finding.takeaways && finding.takeaways.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                    {isAm ? 'ቁልፍ የምርምር ግኝቶች' : 'Key Core Takeaways'}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {finding.takeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-800 dark:text-zinc-200 flex items-start gap-2.5"
                      >
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mt-0.5 shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="leading-snug">{stripEmojis(takeaway)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Academic Preprints Cards (Scholarxiv) */}
            {finding.papers && finding.papers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-500" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-900 dark:text-zinc-100">
                      {isAm ? 'የስኮላርዛይቭ ጥናታዊ ወረቀቶች' : 'Scholarxiv Academic Preprints'}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {finding.papers.length} {isAm ? 'ጥናቶች' : 'papers'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {finding.papers.map((paper) => {
                    const displayYear =
                      paper.year || (paper.published ? new Date(paper.published).getFullYear() : 2024);
                    const authors = Array.isArray(paper.authors)
                      ? paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '')
                      : 'Researcher';

                    return (
                      <div
                        key={paper.id}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                            {stripEmojis(paper.title)}
                          </h5>
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                          <span>{authors}</span>
                          <span>•</span>
                          <span>{displayYear}</span>
                        </div>

                        {paper.keyInsight && (
                          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {stripEmojis(paper.keyInsight)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
