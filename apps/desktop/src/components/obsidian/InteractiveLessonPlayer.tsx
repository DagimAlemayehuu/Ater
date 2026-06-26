import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AterMarkdown } from './MarkdownViewer'
import RubiksCubeWidget from './RubiksCubeWidget'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'

interface Chapter {
  title: string
  content: string
  widgetType?: 'rubiks-cube' | 'none' | string
  widgetPayload?: any
}

interface InteractiveLessonPlayerProps {
  payload: {
    title: string
    chapters: Chapter[]
  }
}

// Global cache for maintaining current chapter state across unmount/remount
const lessonChapterCache: Record<string, number> = {}

export default function InteractiveLessonPlayer({ payload }: InteractiveLessonPlayerProps) {
  const { title, chapters = [] } = payload
  const cacheKey = title || 'default-lesson'

  const [currentChapter, setCurrentChapter] = useState(() => {
    return lessonChapterCache[cacheKey] !== undefined ? lessonChapterCache[cacheKey] : 0
  })

  useEffect(() => {
    lessonChapterCache[cacheKey] = currentChapter
  }, [currentChapter, cacheKey])

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (!chapters || chapters.length === 0) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-[8px] text-center my-4 font-mono text-[11px] text-destructive uppercase tracking-wider">
        No chapters defined in interactive lesson.
      </div>
    )
  }

  const chapter = chapters[currentChapter]
  const totalChapters = chapters.length

  const handleNext = () => {
    if (currentChapter < totalChapters - 1) {
      setCurrentChapter(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1)
    }
  }

  const borderClass = 'border-border'
  const panelClass = 'bg-bento-panel'
  const innerClass = 'bg-bento-bg'
  const mutedClass = 'text-muted-foreground'

  return (
    <div className={cn('rounded-[8px] border p-5 space-y-5 my-6 w-full mx-auto shadow-sm', borderClass, panelClass)}>
      {/* Lesson Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className={cn('text-[9px] font-black uppercase tracking-[0.2em]', mutedClass)}>
            Interactive Lesson
          </span>
          <span className={cn('text-[10px] font-mono font-black', mutedClass)}>
            {currentChapter + 1} / {totalChapters}
          </span>
        </div>
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
          {title}
        </h3>
        
        {/* Navigation Step Bars */}
        <div className="flex gap-1 w-full h-1 mt-1">
          {chapters.map((_, idx) => {
            const active = idx === currentChapter
            const completed = idx < currentChapter
            return (
              <div
                key={idx}
                className={cn(
                  'h-full flex-1 transition-all duration-300 rounded-[1px]',
                  active
                    ? 'bg-foreground'
                    : completed
                    ? 'bg-muted-foreground/60'
                    : 'bg-muted'
                )}
              />
            )
          })}
        </div>
      </div>

      {/* Chapter Content Area */}
      <div className={cn('border rounded-[6px] p-4 min-h-[140px] space-y-4', innerClass, borderClass)}>
        <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground/90 border-b pb-1.5 border-border/10">
          {chapter.title}
        </h4>
        <div className="text-[13px] text-foreground/80 leading-relaxed">
          <AterMarkdown content={chapter.content} />
        </div>

        {/* Dynamic Embedded Widget */}
        {chapter.widgetType === 'rubiks-cube' && chapter.widgetPayload && (
          <div className="mt-6 pt-4 border-t border-border/10">
            <RubiksCubeWidget payload={chapter.widgetPayload} dark={isDark} />
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center gap-3">
        <button
          onClick={handlePrev}
          disabled={currentChapter === 0}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
            currentChapter === 0
              ? 'opacity-20 cursor-not-allowed'
              : 'hover:border-foreground text-foreground bg-transparent hover:bg-foreground/5'
          )}
        >
          <ChevronLeft size={12} />
          Prev
        </button>

        {currentChapter === totalChapters - 1 ? (
          <div className="flex items-center gap-1.5 px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-[4px] border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
            <Check size={12} />
            Completed
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all bg-primary text-primary-foreground border-primary hover:bg-transparent hover:text-primary"
          >
            Next
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
