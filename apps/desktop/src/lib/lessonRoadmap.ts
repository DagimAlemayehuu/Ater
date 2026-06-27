export type LessonRoadmapStatus = 'completed' | 'active' | 'unlocked' | 'locked'

export type LessonRoadmapItem = {
  path: string
  title: string
  lessonPath: string
  status: LessonRoadmapStatus
}

export type LessonRoadmapChapter = {
  id: string
  title: string
  items: LessonRoadmapItem[]
}

function normalizePath(path: string): string {
  return String(path || '').replace(/\\/g, '/')
}

function titleFromSegment(segment: string): string {
  return String(segment || 'Roadmap')
    .replace(/\.(md|html)$/i, '')
    .replace(/^\d+[_\-\s]+/, '')
    .replace(/^Chapter[_\-\s]*\d*[_\-\s]*/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Roadmap'
}

export function getSimpleLessonPath(notePath: string): string {
  const normalized = normalizePath(notePath)
  const parts = normalized.split('/')
  const filename = parts.pop() || ''
  const stem = filename.replace(/\.md$/i, '')
  return [...parts, 'lessons', `${stem}.simple.html`].join('/')
}

export function buildLessonRoadmap(session: any | null | undefined): LessonRoadmapChapter[] {
  const curriculum = Array.isArray(session?.curriculum) ? session.curriculum.map(normalizePath) : []
  const completed = new Set((Array.isArray(session?.completed_notes) ? session.completed_notes : []).map(normalizePath))
  const unlocked = new Set((Array.isArray(session?.active_note_unlocks) ? session.active_note_unlocks : []).map(normalizePath))
  const current = normalizePath(session?.current_note_path || '')

  const chapters: LessonRoadmapChapter[] = []
  const chapterById = new Map<string, LessonRoadmapChapter>()

  for (const path of curriculum) {
    const parts = path.split('/')
    const filename = parts[parts.length - 1] || path
    const chapterSegment = parts.length >= 2 ? parts[parts.length - 2] : 'Roadmap'
    const chapterId = parts.slice(0, -1).join('/') || chapterSegment

    let status: LessonRoadmapStatus = 'locked'
    if (completed.has(path)) status = 'completed'
    else if (path === current) status = 'active'
    else if (unlocked.has(path)) status = 'unlocked'

    let chapter = chapterById.get(chapterId)
    if (!chapter) {
      chapter = {
        id: chapterId,
        title: titleFromSegment(chapterSegment),
        items: [],
      }
      chapterById.set(chapterId, chapter)
      chapters.push(chapter)
    }

    chapter.items.push({
      path,
      title: titleFromSegment(filename),
      lessonPath: getSimpleLessonPath(path),
      status,
    })
  }

  return chapters
}
