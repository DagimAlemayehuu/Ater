import { parseISO, differenceInDays, isBefore, startOfDay } from 'date-fns'

/** Strip [[WikiLink]] to plain text */
export const stripWL = (val: any): string => {
    if (val === undefined || val === null) return ''
    return String(val).replace(/\[\[(.*?)\]\]/g, '$1').trim()
}

/** Get a value from an object, trying multiple key casings */
export const getVal = (obj: any, ...keys: string[]): string => {
    for (const k of keys) {
        const v = obj?.[k]
        if (v !== undefined && v !== null && v !== '') return stripWL(String(v))
    }
    return ''
}

/** Color class for a grade letter */
export const gradeColorClass = (grade: string): string => {
    const g = stripWL(grade).charAt(0).toUpperCase()
    if (g === 'A') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    if (g === 'B') return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    if (g === 'C') return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    if (g === 'D') return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    if (g === 'F') return 'text-red-500 bg-red-500/10 border-red-500/20'
    return 'text-muted-foreground/40 bg-muted/10 border-border/20'
}

/** Color class for a priority level */
export const priorityColorClass = (priority: string): string => {
    const p = stripWL(priority).toLowerCase()
    if (p === 'high') return 'text-red-400 bg-red-400/10 border-red-400/20'
    if (p === 'medium') return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    if (p === 'low') return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    return 'text-muted-foreground/40 bg-muted/10 border-border/20'
}

/** Color class for a status value */
export const statusColorClass = (status: string): string => {
    const s = stripWL(status).toLowerCase()
    if (s.includes('complet')) return 'text-emerald-500 bg-emerald-500/10'
    if (s.includes('active') || s.includes('progress')) return 'text-blue-400 bg-blue-400/10'
    if (s.includes('review')) return 'text-amber-400 bg-amber-400/10'
    if (s.includes('plan')) return 'text-muted-foreground/40 bg-muted/10'
    return 'text-muted-foreground/40 bg-muted/10'
}

/** Color class for confidence */
export const confidenceColorClass = (confidence: string): string => {
    const c = stripWL(confidence).toLowerCase()
    if (c.includes('expert') || c.includes('high') || c === '5') return 'text-emerald-400'
    if (c.includes('medium') || c === '4' || c === '3') return 'text-amber-400'
    if (c.includes('low') || c === '2' || c === '1') return 'text-red-400'
    return 'text-muted-foreground/20'
}

/** Days until a date string. Negative = overdue */
export const getDaysUntil = (dateStr: string): number | null => {
    if (!dateStr) return null
    try {
        return differenceInDays(parseISO(dateStr), startOfDay(new Date()))
    } catch { return null }
}

/** Whether a date string is in the past */
export const isOverdue = (dateStr: string): boolean => {
    if (!dateStr) return false
    try { return isBefore(parseISO(dateStr), startOfDay(new Date())) } catch { return false }
}

/** Derive rollup status from children */
export const deriveStatus = (children: any[], statusKey = 'Status'): 'Completed' | 'In Progress' | 'Pending' => {
    if (!children || children.length === 0) return 'Pending'
    const allDone = children.every(c => {
        const s = stripWL(String(c[statusKey] || '')).toLowerCase()
        return s.includes('complet') || c.done === true
    })
    return allDone ? 'Completed' : 'In Progress'
}

/** Group array by a field value */
export const groupBy = <T>(items: T[], key: (item: T) => string): Record<string, T[]> => {
    return items.reduce((acc, item) => {
        const k = key(item) || 'Other'
        if (!acc[k]) acc[k] = []
        acc[k].push(item)
        return acc
    }, {} as Record<string, T[]>)
}

/** Roman numerals for sorting */
export const romanToNum: Record<string, number> = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
}

export const getYearOrder = (title: string): number => {
    const match = title.match(/Year\s+([IVX]+|\d+)/i)
    if (!match) return 999
    const v = match[1].toUpperCase()
    return romanToNum[v] || parseInt(v) || 999
}
