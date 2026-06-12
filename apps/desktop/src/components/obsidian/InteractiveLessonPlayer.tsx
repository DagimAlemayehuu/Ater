import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AterMarkdown } from './MarkdownViewer'
import RubiksCubeWidget from './RubiksCubeWidget'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

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

function useAppTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() =>
      setIsDark(el.classList.contains('dark'))
    )
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
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

  const isDark = useAppTheme()

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

  const borderClass = isDark ? 'border-[#242426]' : 'border-zinc-200'
  const panelClass = isDark ? 'bg-[#151517]' : 'bg-zinc-50'
  const innerClass = isDark ? 'bg-[#111113]' : 'bg-white'
  const mutedClass = isDark ? 'text-[#a1a1aa]' : 'text-zinc-400'

  return (
    <div className={cn('rounded-[8px] border p-5 space-y-5 my-6 max-w-2xl mx-auto shadow-sm', borderClass, panelClass)}>
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
                    ? isDark ? 'bg-white' : 'bg-zinc-900'
                    : completed
                    ? isDark ? 'bg-zinc-600' : 'bg-zinc-400'
                    : isDark ? 'bg-[#242426]' : 'bg-zinc-200'
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
              : isDark
              ? 'hover:border-white text-white bg-transparent'
              : 'hover:border-zinc-900 text-zinc-900 bg-transparent'
          )}
        >
          <ChevronLeft size={12} />
          Prev
        </button>

        {currentChapter === totalChapters - 1 ? (
          <div className={cn('flex items-center gap-1.5 px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-[4px] border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400')}>
            <Check size={12} />
            Completed
          </div>
        ) : (
          <button
            onClick={handleNext}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
              isDark
                ? 'bg-[#ebebeb] text-zinc-950 border-[#ebebeb] hover:bg-transparent hover:text-white'
                : 'bg-zinc-900 text-white border-zinc-900 hover:bg-white hover:text-zinc-900'
            )}
          >
            Next
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
