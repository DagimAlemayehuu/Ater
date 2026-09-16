'use client';

import React from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeft, Bookmark, History, Trash2, GraduationCap } from 'lucide-react';
import type { DynamicLessonNote, AterAtomicNote, CourseCurriculum } from '@/types';
import { translations, type AppLanguage } from '@/lib/i18n/translations';

interface LeftDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  savedNotes: (DynamicLessonNote | AterAtomicNote)[];
  searchHistory?: string[];
  savedCourses?: CourseCurriculum[];
  onSelectNote: (note: any) => void;
  onSelectHistory?: (query: string) => void;
  onSelectCourse?: (course: CourseCurriculum) => void;
  onDeleteNote: (index: number) => void;
  onDeleteCourse?: (courseId: string) => void;
  activeCourseId?: string;
  language?: AppLanguage;
}

export const LeftDrawer: React.FC<LeftDrawerProps> = ({
  isOpen,
  onToggle,
  savedNotes,
  searchHistory = [],
  savedCourses = [],
  onSelectNote,
  onSelectHistory,
  onSelectCourse,
  onDeleteNote,
  onDeleteCourse,
  activeCourseId,
  language = 'en',
}) => {
  const t = translations[language] || translations.en;
  return (
    <aside
      className={`border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-all duration-200 ${
        isOpen ? 'w-72' : 'w-12'
      } shrink-0 font-sans`}
    >
      <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3">
        {isOpen ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans">
              {t.drawer.title}
            </span>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400"
              title={t.drawer.collapse}
              aria-label={t.drawer.collapse}
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="w-full flex justify-center p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400"
            title={t.drawer.expand}
            aria-label={t.drawer.expand}
          >
            <PanelLeft size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-6 text-sm">
          {/* Courses Section */}
          {savedCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide font-sans">
                <GraduationCap size={13} />
                <span>{t.drawer.activeCourses}</span>
                <span className="ml-auto text-[11px] text-zinc-400 font-mono">({savedCourses.length})</span>
              </div>
              <ul className="space-y-1">
                {savedCourses.map((c) => (
                  <li
                    key={c.id}
                    className={`group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      c.id === activeCourseId
                        ? 'bg-zinc-200/80 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700'
                        : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-900 border-transparent hover:border-zinc-300 dark:hover:border-zinc-800'
                    }`}
                    onClick={() => onSelectCourse?.(c)}
                  >
                    <div className="truncate pr-2">
                      <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200 block">
                        {c.title || c.topic}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-sans">
                        {t.drawer.lessonsCount(c.lessons.length)}
                      </span>
                    </div>
                    {onDeleteCourse && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCourse(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-opacity shrink-0"
                        title={t.drawer.removeCourse}
                        aria-label={t.drawer.removeCourse}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Saved Notes Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide font-sans">
              <Bookmark size={13} />
              <span>{t.drawer.savedNotes}</span>
              <span className="ml-auto text-[11px] text-zinc-400 font-mono">({savedNotes.length})</span>
            </div>
            {savedNotes.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">{t.drawer.noNotesYet}</p>
            ) : (
              <ul className="space-y-1">
                {savedNotes.map((note, idx) => (
                  <li
                    key={`${note.title}-${idx}`}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800 cursor-pointer"
                    onClick={() => onSelectNote(note)}
                  >
                    <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300 pr-2">
                      {note.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
                      title={t.drawer.removeNote}
                      aria-label={t.drawer.removeNote}
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* History Section */}
          {searchHistory.length > 0 && onSelectHistory && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide font-mono">
                <History size={13} />
                <span>{t.drawer.recentTopics}</span>
              </div>
              <ul className="space-y-1">
                {searchHistory.map((query, idx) => (
                  <li
                    key={`${query}-${idx}`}
                    className="truncate p-1.5 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                    onClick={() => onSelectHistory(query)}
                  >
                    {query}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
