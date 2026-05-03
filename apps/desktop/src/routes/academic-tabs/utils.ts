import { parseISO, differenceInDays, isBefore, startOfDay } from 'date-fns'

export const stripWL = (val: any): string => {
    if (val === undefined || val === null) return ''
    return String(val).replace(/\[\[(.*?)\]\]/g, '$1').trim()
}

export const getVal = (obj: any, ...keys: string[]): string => {
    for (const k of keys) {
        const v = obj?.[k]
        if (v !== undefined && v !== null && v !== '') return stripWL(String(v))
    }
    return ''
}

// Greyscale-only: weight/opacity conveys quality
export const gradeColorClass = (grade: string): string => {
    const g = stripWL(grade).charAt(0).toUpperCase()
    if (g === 'A') return 'text-foreground bg-muted border-border/40 font-black'
    if (g === 'B') return 'text-foreground/80 bg-muted/50 border-border/20'
    if (g === 'C') return 'text-muted-foreground bg-muted/30 border-border/15'
    if (g === 'D') return 'text-muted-foreground/60 bg-muted/20 border-border/10'
    if (g === 'F') return 'text-muted-foreground/40 bg-muted/10 border-border/10 line-through'
    return 'text-muted-foreground/40 bg-muted/10 border-border/20'
}

// Greyscale-only: high priority = high contrast
export const priorityColorClass = (priority: string): string => {
    const p = stripWL(priority).toLowerCase()
    if (p === 'high') return 'text-foreground bg-foreground/10 border-foreground/20 font-black'
    if (p === 'medium') return 'text-muted-foreground bg-muted/30 border-border/20'
    if (p === 'low') return 'text-muted-foreground/40 bg-muted/10 border-border/10'
    return 'text-muted-foreground/40 bg-muted/10 border-border/20'
}

// Greyscale-only: active = high contrast, completed = faded
export const statusColorClass = (status: string): string => {
    const s = stripWL(status).toLowerCase()
    if (s.includes('complet')) return 'text-muted-foreground/40 bg-muted/10 border-border/10'
    if (s.includes('active') || s.includes('progress')) return 'text-foreground bg-muted border-border/40'
    if (s.includes('review')) return 'text-foreground/70 bg-muted/50 border-border/20'
    if (s.includes('plan')) return 'text-muted-foreground/50 bg-muted/5 border-border/10'
    return 'text-muted-foreground/40 bg-muted/10 border-border/10'
}

// Greyscale-only: high confidence = high contrast
export const confidenceColorClass = (confidence: string): string => {
    const c = stripWL(confidence).toLowerCase()
    if (c.includes('expert') || c.includes('high') || c === '5') return 'text-foreground font-black'
    if (c.includes('medium') || c === '4' || c === '3') return 'text-muted-foreground'
    if (c.includes('low') || c === '2' || c === '1') return 'text-muted-foreground/40'
    return 'text-muted-foreground/20'
}

export const getDaysUntil = (dateStr: string): number | null => {
    if (!dateStr) return null
    try { return differenceInDays(parseISO(dateStr), startOfDay(new Date())) } catch { return null }
}

export const isOverdue = (dateStr: string): boolean => {
    if (!dateStr) return false
    try { return isBefore(parseISO(dateStr), startOfDay(new Date())) } catch { return false }
}

export const deriveStatus = (children: any[], statusKey = 'Status'): 'Completed' | 'In Progress' | 'Pending' => {
    if (!children || children.length === 0) return 'Pending'
    const allDone = children.every(c => {
        const s = stripWL(String(c[statusKey] || '')).toLowerCase()
        return s.includes('complet') || c.done === true
    })
    return allDone ? 'Completed' : 'In Progress'
}

export const groupBy = <T>(items: T[], key: (item: T) => string): Record<string, T[]> => {
    return items.reduce((acc, item) => {
        const k = key(item) || 'Other'
        if (!acc[k]) acc[k] = []
        acc[k].push(item)
        return acc
    }, {} as Record<string, T[]>)
}

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
