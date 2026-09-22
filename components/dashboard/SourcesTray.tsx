'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, ExternalLink, BookOpen, X, Loader2 } from 'lucide-react';
import type { ScholarxivPaper } from '@/types/scholarxiv';
import { stripEmojis } from '@/lib/curriculum/intake';

export interface SourcesTrayProps {
  initialQuery?: string;
  topicTitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  language?: 'en' | 'am';
  initialPapers?: ScholarxivPaper[];
}

export const SourcesTray: React.FC<SourcesTrayProps> = ({
  initialQuery = '',
  topicTitle = '',
  isOpen,
  onToggle,
  language = 'en',
  initialPapers = [],
}) => {
  const isAm = language === 'am';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [papers, setPapers] = useState<ScholarxivPaper[]>(initialPapers);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync initial papers when they change
  useEffect(() => {
    if (initialPapers && initialPapers.length > 0) {
      setPapers(initialPapers);
    }
  }, [initialPapers]);

  // Load initial related papers based on topicTitle if list is empty
  useEffect(() => {
    const q = initialQuery || topicTitle;
    if (isOpen && q && papers.length === 0 && !hasSearched) {
      handleSearch(q);
    }
  }, [isOpen, topicTitle, initialQuery]);

  const handleSearch = async (queryToSearch?: string) => {
    const term = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!term) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/research/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: term,
          sources: ['scholarxiv'],
          limit: 8,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.papers || data.data?.papers || [];
        setPapers(results);
      }
    } catch (_err) {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPaperId((prev) => (prev === id ? null : id));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Literature grounding sources tray"
      className="w-80 lg:w-96 shrink-0 h-full border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col z-20 transition-all font-sans select-none overflow-hidden"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-500" />
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-sans">
            {isAm ? 'የጥናት ምንጮች እና ሰነዶች' : 'Grounding Literature'}
          </h2>
          {papers.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {papers.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={isAm ? 'ዝጋ' : 'Close tray'}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex items-center"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAm ? 'ተዛማጅ ጥናቶችን ፈልግ...' : 'Find related sources...'}
            className="w-full pl-8 pr-16 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="absolute right-1 px-2 py-0.5 text-[11px] font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-30 transition-opacity"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : isAm ? 'ፈልግ' : 'Find'}
          </button>
        </form>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading && papers.length === 0 && (
          <div className="py-12 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{isAm ? 'ጥናታዊ ጽሑፎችን በማፈላለግ ላይ...' : 'Searching Scholarxiv literature...'}</span>
          </div>
        )}

        {!isLoading && papers.length === 0 && (
          <div className="py-12 text-center text-zinc-400 text-xs px-4">
            <p className="font-medium text-zinc-500 mb-1">
              {isAm ? 'ምንም ጥናቶች አልተገኙም' : 'No grounding papers found'}
            </p>
            <p className="text-[11px] leading-relaxed">
              {isAm
                ? 'ሌላ ርዕስ በመፈለግ ወይም ከትምህርቱ ጋር ተያያዥ ቃላትን በማስገባት ይሞክሩ።'
                : 'Enter a topic above to ground this lesson with verified academic preprints.'}
            </p>
          </div>
        )}

        {papers.map((paper) => {
          const isExpanded = expandedPaperId === paper.id;
          const displayYear = paper.year || (paper.published ? new Date(paper.published).getFullYear() : 2024);
          const authorsString = Array.isArray(paper.authors)
            ? paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')
            : 'Author';

          return (
            <div
              key={paper.id}
              className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs"
            >
              {/* Paper Title & Year */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                    {stripEmojis(paper.title)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                    <span>{authorsString}</span>
                    <span>•</span>
                    <span>{displayYear}</span>
                  </div>
                </div>

                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={isAm ? 'ወረቀቱን በድረ-ገጽ አንብብ' : 'View paper online'}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Key Insight Highlight */}
              {paper.keyInsight && (
                <div className="mt-2.5 p-2 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                    {isAm ? 'ቁልፍ ግኝት' : 'Key Insight'}
                  </span>
                  <p>{stripEmojis(paper.keyInsight)}</p>
                </div>
              )}

              {/* Expand to read Abstract */}
              {(paper.abstract || paper.summary) && (
                <div className="mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => toggleExpand(paper.id)}
                    className="w-full flex items-center justify-between text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <span>{isExpanded ? (isAm ? 'ማጠቃለያውን ዝጋ' : 'Hide Abstract') : (isAm ? 'ሙሉ ማጠቃለያውን አንብብ' : 'Read Abstract')}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-h-48 overflow-y-auto pr-1">
                      {stripEmojis(paper.abstract || paper.summary)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info banner */}
      <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px] text-zinc-400 text-center font-mono">
        {isAm ? 'በስኮላርዛይቭ 3M+ ጥናታዊ ጽሑፎች የተደገፈ' : 'Grounded via Scholarxiv Academic Index'}
      </div>
    </aside>
  );
};
