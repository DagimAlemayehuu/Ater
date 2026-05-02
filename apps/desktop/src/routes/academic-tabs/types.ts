export interface AcademicData {
    semesters: any[]
    courses: any[]
    units: any[]
    exams: any[]
    assignments: any[]
    study_sessions: any[]
    years: any[]
}

export interface VaultDatabase {
    id: string
    name: string
    schema: Record<string, any>
    type: string
    area?: string
    views?: any[]
}

export type AcademicTab = 'PROGRAM' | 'COURSES' | 'PLANNER' | 'ASSIGNMENTS' | 'EXAMS' | 'PRACTICE'

export interface TabProps {
    data: AcademicData
    databases: VaultDatabase[]
    onUpdate: (dbId: string, itemId: string, properties: Record<string, any>) => Promise<void>
    onCreate: (dbId: string, title: string, props?: Record<string, any>) => Promise<string | null>
    onDelete: (dbId: string, itemId: string) => Promise<void>
    onOpenNote: (path: string) => void
    navigateTo: (tab: AcademicTab, id?: string) => void
    onRefresh: () => void
}
