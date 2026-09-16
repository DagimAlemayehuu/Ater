'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { CourseCurriculum, RoadmapLesson, LessonStatus } from '@/types';
import { translations, type AppLanguage } from '@/lib/i18n/translations';

interface RoadmapPanelProps {
  curriculum: CourseCurriculum | null;
  activeLessonId?: string;
  onSelectLesson: (lesson: RoadmapLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onOpenIntakeModal: () => void;
  onDeleteCourse?: (courseId: string) => void;
  isLoading?: boolean;
  language?: AppLanguage;
}

export const RoadmapPanel: React.FC<RoadmapPanelProps> = ({
  curriculum,
  activeLessonId,
  onSelectLesson,
  onDeleteLesson,
  onOpenIntakeModal,
  onDeleteCourse,
  isLoading = false,
  language = 'en',
}) => {
  const t = translations[language] || translations.en;
  const lessons = curriculum?.lessons || [];

  const masteredCount = lessons.filter((l) => l.status === 'mastered').length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  const renderStatus = (status: LessonStatus, isRemediation?: boolean) => {
    if (isRemediation || status === 'remediation') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-sans text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-2 decoration-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          <span>{t.roadmap.statusRemediation}</span>
        </span>
      );
    }
    switch (status) {
      case 'mastered':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans text-zinc-500 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
            <span>{t.roadmap.statusMastered}</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans text-zinc-900 dark:text-zinc-100 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
            <span>{t.roadmap.statusActive}</span>
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-sans text-zinc-400 dark:text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>{t.roadmap.statusLocked}</span>
          </span>
        );
    }
  };

  return (
    <aside className="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950 flex flex-col h-full shrink-0 font-sans overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] font-sans uppercase text-zinc-400 block tracking-wider">{t.roadmap.title}</span>
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
            {curriculum?.topic || t.roadmap.noCourse}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {curriculum && onDeleteCourse && (
            <button
              onClick={() => onDeleteCourse(curriculum.id)}
              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-colors"
              title={t.drawer.removeCourse}
              aria-label={t.drawer.removeCourse}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onOpenIntakeModal}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t.roadmap.newBtn}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {curriculum && (
        <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-sans text-zinc-400 shrink-0">
          <span>{t.roadmap.progress(masteredCount, totalCount)}</span>
          <span className="font-mono">{progressPercent}%</span>
        </div>
      )}

      {/* Clean Minimal Lesson List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-zinc-400 font-sans">
            {t.roadmap.loading}
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            {t.roadmap.noLessons}
          </div>
        ) : (
          lessons.map((lesson) => {
            const isSelected = lesson.id === activeLessonId;
            const isLocked = lesson.status === 'locked';

            return (
              <div
                key={lesson.id}
                onClick={() => !isLocked && onSelectLesson(lesson)}
                className={`group p-2.5 rounded-lg transition-colors text-left space-y-1 relative ${
                  isSelected
                    ? 'bg-zinc-200/60 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                    : isLocked
                      ? 'opacity-40 cursor-not-allowed text-zinc-500'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900/50 cursor-pointer text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-sans">
                  <span>
                    {lesson.isRemediation ? t.roadmap.statusRemediation : String(lesson.order).padStart(2, '0')} · {t.roadmap.minShort(lesson.estimatedMinutes)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onDeleteLesson && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLesson(lesson.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-opacity"
                        title={language === 'am' ? 'ትምህርቱን ሰርዝ' : 'Delete lesson'}
                        aria-label={language === 'am' ? 'ትምህርቱን ሰርዝ' : 'Delete lesson'}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    {renderStatus(lesson.status, lesson.isRemediation)}
                  </div>
                </div>

                <h3 className="text-xs font-medium truncate leading-tight pr-4">
                  {lesson.title}
                </h3>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
