/**
 * PROPERTY MODEL:
 *   SELECT properties  → stored as YAML wikilinks: `Semester: "[[Spring 2024]]"`
 *                        → display: strip [[ ]] → "Spring 2024"
 *                        → the value points to a subfolder (database/semesters/)
 *   YAML properties    → raw scalars: text, date, number, bool
 *
 * NEVER render [[ ]] in the UI. Always call stripWL() before display.
 */

import { parseISO, differenceInDays, isBefore, startOfDay } from 'date-fns'

// ─── Wikilink helpers ──────────────────────────────────────────────────────────

/** Remove [[ ]] wikilink syntax from any value */
export const stripWL = (val: any): string => {
  if (val === undefined || val === null) return ''
  let s = String(val).trim()
  s = s.replace(/\[\[(.*?)\]\]/g, '$1')
  s = s.replace(/\[(.*?)\]/g, '$1')
  s = s.replace(/[\[\]]/g, '')
  return s.trim()
}

/** Wrap a value in [[ ]] if not already wrapped */
export const wrapWL = (val: any): string => {
  if (val === undefined || val === null || val === '') return ''
  const s = String(val).trim()
  if (s.startsWith('[[') && s.endsWith(']]')) return s
  return `[[${s}]]`
}

/** Check if a value is a wikilink (SELECT/RELATION property → subfolder reference) */
export const isWikilink = (val: any): boolean => {
  if (!val) return false
  const s = String(val).trim()
  return s.startsWith('[[') && s.endsWith(']]')
}

/** Clean display: remove underscores, strip wikilinks */
export const cleanTitle = (val: any): string => {
  if (!val) return ''
  return stripWL(String(val)).replace(/_/g, ' ').trim()
}

// ─── Property value reader ─────────────────────────────────────────────────────

/**
 * Read a property value from an item (which may have flat properties or a properties sub-object).
 * Always strips wikilinks from the output.
 */
export const getVal = (obj: any, ...keys: string[]): string => {
  if (!obj) return ''
  const props = obj.properties || obj

  const normalizedMap: Record<string, any> = {}
  Object.keys(props).forEach(k => {
    normalizedMap[k.toLowerCase().replace(/ /g, '_')] = props[k]
    normalizedMap[k.toLowerCase()] = props[k]
  })

  for (const k of keys) {
    const v = props[k]
    if (v !== undefined && v !== null && v !== '') return stripWL(String(v))

    const lk = k.toLowerCase()
    const lv = normalizedMap[lk]
    if (lv !== undefined && lv !== null && lv !== '') return stripWL(String(lv))

    const lku = lk.replace(/ /g, '_')
    const lvu = normalizedMap[lku]
    if (lvu !== undefined && lvu !== null && lvu !== '') return stripWL(String(lvu))
  }
  return ''
}

/** Read raw value (including wikilink brackets) - used for WRITING back */
export const getRawVal = (obj: any, ...keys: string[]): string => {
  if (!obj) return ''
  const props = obj.properties || obj
  for (const k of keys) {
    const v = props[k]
    if (v !== undefined && v !== null && v !== '') return String(v)
  }
  return ''
}

export const getBoolVal = (obj: any, ...keys: string[]): boolean => {
  if (!obj) return false
  const props = obj.properties || obj
  const normalizedMap: Record<string, any> = {}
  Object.keys(props).forEach(k => { normalizedMap[k.toLowerCase()] = props[k] })

  for (const k of keys) {
    const v = props[k]
    if (v === true || v === 'true') return true
    const lv = normalizedMap[k.toLowerCase()]
    if (lv === true || lv === 'true') return true
  }
  return false
}

export const getNumVal = (obj: any, ...keys: string[]): number => {
  const s = getVal(obj, ...keys)
  return parseFloat(s) || 0
}

// ─── Color helpers (greyscale only — Ater design law) ─────────────────────────

export const gradeColorClass = (grade: string): string => {
  const g = stripWL(grade).charAt(0).toUpperCase()
  if (g === 'A') return 'text-foreground bg-muted border-border/40 font-black'
  if (g === 'B') return 'text-foreground/80 bg-muted/50 border-border/20'
  if (g === 'C') return 'text-muted-foreground bg-muted/30 border-border/15'
  if (g === 'D') return 'text-muted-foreground/60 bg-muted/20 border-border/10'
  if (g === 'F') return 'text-muted-foreground/40 bg-muted/10 border-border/10 line-through'
  return 'text-muted-foreground/40 bg-muted/10 border-border/20'
}

export const priorityColorClass = (priority: string): string => {
  const p = stripWL(priority).toLowerCase()
  if (p === 'high' || p === 'critical') return 'text-foreground bg-foreground/10 border-foreground/20 font-black'
  if (p === 'medium' || p === 'normal') return 'text-muted-foreground bg-muted/30 border-border/20'
  if (p === 'low') return 'text-muted-foreground/40 bg-muted/10 border-border/10'
  return 'text-muted-foreground/40 bg-muted/10 border-border/20'
}

export const statusColorClass = (status: string): string => {
  const s = stripWL(status).toLowerCase()
  if (s.includes('complet') || s.includes('done') || s.includes('passed')) return 'text-muted-foreground/40 bg-muted/10 border-border/10'
  if (s.includes('active') || s.includes('progress') || s.includes('ongoing')) return 'text-foreground bg-muted border-border/40'
  if (s.includes('review') || s.includes('pending') || s.includes('graded')) return 'text-foreground/70 bg-muted/50 border-border/20'
  if (s.includes('plan') || s.includes('upcoming') || s.includes('scheduled')) return 'text-muted-foreground/50 bg-muted/5 border-border/10'
  if (s.includes('over') || s.includes('late') || s.includes('miss')) return 'text-foreground font-black bg-muted/20 border-foreground/30'
  return 'text-muted-foreground/40 bg-muted/10 border-border/10'
}

export const confidenceColorClass = (confidence: string): string => {
  const c = stripWL(confidence).toLowerCase()
  if (c.includes('expert') || c.includes('high') || c === '5') return 'text-foreground font-black'
  if (c.includes('medium') || c === '4' || c === '3') return 'text-muted-foreground'
  if (c.includes('low') || c === '2' || c === '1') return 'text-muted-foreground/40'
  return 'text-muted-foreground/20'
}

export const typeColorClass = (type: string): string => {
  const t = stripWL(type).toLowerCase()
  if (t.includes('final') || t.includes('midterm')) return 'text-foreground bg-muted border-foreground/30 font-black'
  if (t.includes('quiz') || t.includes('test')) return 'text-foreground/70 bg-muted/30 border-border/20'
  if (t.includes('lab') || t.includes('practical')) return 'text-muted-foreground bg-muted/20 border-border/15'
  return 'text-muted-foreground/40 bg-muted/10 border-border/10'
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

export const getDaysUntil = (dateStr: string): number | null => {
  if (!dateStr) return null
  try { return differenceInDays(parseISO(dateStr), startOfDay(new Date())) } catch { return null }
}

export const isOverdue = (dateStr: string): boolean => {
  if (!dateStr) return false
  try { return isBefore(parseISO(dateStr), startOfDay(new Date())) } catch { return false }
}

export const formatDateLabel = (days: number | null): string => {
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `${days}d`
  return `${days}d`
}

// ─── Derived state ─────────────────────────────────────────────────────────────

export const deriveStatus = (children: any[], statusKey = 'Status'): 'Completed' | 'In Progress' | 'Pending' => {
  if (!children || children.length === 0) return 'Pending'
  const allDone = children.every(c => {
    const s = stripWL(String(c[statusKey] || '')).toLowerCase()
    return s.includes('complet') || c.done === true
  })
  if (allDone) return 'Completed'
  const anyStarted = children.some(c => {
    const s = stripWL(String(c[statusKey] || '')).toLowerCase()
    return s.includes('progress') || s.includes('active')
  })
  return anyStarted ? 'In Progress' : 'Pending'
}

// ─── Collection helpers ────────────────────────────────────────────────────────

export const groupBy = <T>(items: T[], key: (item: T) => string): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const k = key(item) || 'Other'
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

// ─── Year ordering ────────────────────────────────────────────────────────────

export const romanToNum: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
}

export const getYearOrder = (title: any): number => {
  if (!title || typeof title !== 'string') return 999
  const match = title.match(/Year\s+([IVX]+|\d+)/i)
  if (!match) return 999
  const v = match[1].toUpperCase()
  return romanToNum[v] || parseInt(v) || 999
}

// ─── Vault folder names ────────────────────────────────────────────────────────
// These are the actual filesystem folder names used by the Rust backend.

export const DB_FOLDER_MAP: Record<string, string> = {
  years:           'years',
  semesters:       'semesters',
  courses:         'courses',
  exams:           'exams',
  assignments:     'assignments',
  'study planner': 'study planner',  // NOTE: Rust uses "study planner" (with 2 n's)
}

/** The folder path under database/ for a given db id */
export const dbFolder = (dbId: string): string =>
  DB_FOLDER_MAP[dbId.toLowerCase()] ?? dbId

// ─── GPA calculation ──────────────────────────────────────────────────────────

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
}

export const gradeToPoints = (grade: string): number | null => {
  const g = stripWL(grade).trim().toUpperCase()
  return GRADE_POINTS[g] ?? null
}

export const calcGPA = (courses: any[]): string => {
  let totalPoints = 0, totalCredits = 0
  for (const c of courses) {
    const grade = getVal(c, 'Grade', 'grade')
    const credits = getNumVal(c, 'Credits', 'credits')
    const pts = gradeToPoints(grade)
    if (pts !== null && credits > 0) {
      totalPoints += pts * credits
      totalCredits += credits
    }
  }
  if (totalCredits === 0) return '--'
  return (totalPoints / totalCredits).toFixed(2)
}

// ─── Default Schemas ───────────────────────────────────────────────────────────

import type { SchemaProperty } from './types'

export const DEFAULT_SCHEMAS: Record<string, Record<string, SchemaProperty>> = {
  years: {
    Program: { type: 'relation', source: 'database/programs' },
    Status: { type: 'select', source: 'database/years/status' },
    'Current Year': { type: 'bool' },
    'Target Credits': { type: 'number' },
    'Earned Credits': { type: 'number' },
    'Cumulative GPA': { type: 'number' }
  },
  semesters: {
    Year: { type: 'relation', source: 'database/years' },
    Status: { type: 'select', source: 'database/semesters/status' }
  },
  courses: {
    Semester: { type: 'relation', source: 'database/semesters' },
    Status: { type: 'select', source: 'database/courses/status' },
    Credits: { type: 'number' },
    Grade: { type: 'select', source: 'database/courses/grade' },
    Professor: { type: 'str' },
    Difficulty: { type: 'select', source: 'database/courses/difficulty' }
  },
  assignments: {
    Course: { type: 'relation', source: 'database/courses' },
    Status: { type: 'select', source: 'database/assignments/status' },
    Priority: { type: 'select', source: 'database/assignments/priority' },
    Type: { type: 'select', source: 'database/assignments/type' },
    due_date: { type: 'date' },
    Grade: { type: 'str' }
  },
  exams: {
    Course: { type: 'relation', source: 'database/courses' },
    Status: { type: 'select', source: 'database/exams/status' },
    Type: { type: 'select', source: 'database/exams/type' },
    date: { type: 'date' },
    Grade: { type: 'str' },
    'Confidence Level': { type: 'select', source: 'database/exams/confidence' }
  },
  'study planner': {
    Course: { type: 'relation', source: 'database/courses' },
    Status: { type: 'select', source: 'database/study planner/status' },
    due_date: { type: 'date' },
    'Confidence Level': { type: 'select', source: 'database/study planner/confidence' }
  }
}

