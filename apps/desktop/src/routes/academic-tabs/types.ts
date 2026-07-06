// ─── Property Model ────────────────────────────────────────────────────────────
// SELECT properties = wikilinks pointing to subfolders → strip [[...]] for display
// YAML properties  = raw scalar values (text, date, number, bool)
// Rule: NEVER render [[ ]] brackets in the UI

export interface AcademicItem {
  id: string
  title: string
  path?: string
  [key: string]: any
}

export interface AcademicData {
  semesters: AcademicItem[]
  courses:   AcademicItem[]
  units:     AcademicItem[]
  exams:     AcademicItem[]
  assignments: AcademicItem[]
  study_sessions: AcademicItem[] // maps to "study planner" folder
  years:     AcademicItem[]
}

export interface SchemaProperty {
  type: 'str' | 'select' | 'relation' | 'date' | 'bool' | 'number' | 'multi_select'
  source?: string   // the folder/db name for select/relation
  options?: string[]
}

export interface VaultDatabase {
  id: string
  name: string
  schema: Record<string, SchemaProperty | string>
  type: string
  area?: string
  views?: any[]
}

export type AcademicTab =
  | 'PROGRAM'
  | 'YEARS'
  | 'SEMESTERS'
  | 'COURSES'
  | 'HUBS'
  | 'PLANNER'
  | 'ASSIGNMENTS'
  | 'EXAMS'
  | 'PRACTICE'
  | 'CALENDAR'

export interface TabProps {
  data: AcademicData
  databases: VaultDatabase[]
  onUpdate:  (dbId: string, itemId: string, properties: Record<string, any>) => Promise<void>
  onCreate:  (dbId: string, title: string, props?: Record<string, any>) => Promise<string | null>
  onDelete:  (dbId: string, itemId: string) => Promise<void>
  onOpenNote: (path: string) => void
  navigateTo: (tab: AcademicTab, id?: string) => void
  onRefresh: () => void
  initialSelectedId?: string | null
  onClearSelection?: () => void
  onScaffold?: (name: string, years: number, level: string, currentYearIdx: number) => void
}

// ─── Calendar event ─────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id?: string
  title: string
  _type: string
  _date: string      // ISO string
  duration?: number  // seconds
  isCorrect?: boolean
}
