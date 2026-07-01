import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { sidecarApi } from '@/lib/sidecarApi'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { BlockingLoader } from '@/components/ui/loading-state'
import AcademicCalendar from '@/components/academic/AcademicCalendar'
import type { AcademicData } from './academic-tabs/types'

export default function CalendarRoute() {
  const { history: storeHistory } = usePomodoroStore()
  const [data, setData] = useState<AcademicData | null>(null)
  const [apiStudyHistory, setApiStudyHistory] = useState<{sessions: any[], telemetry: any[], practice?: any[]}>({sessions: [], telemetry: [], practice: []})
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const fetchData = useCallback(async () => {
    try {
      const dashRes = await sidecarApi.academicsDashboard()
      setData(dashRes as any)
      setLoading(false)

      sidecarApi.getStudyHistory()
        .then(studyRes => {
          setApiStudyHistory(studyRes || { sessions: [], telemetry: [], practice: [] })
        })
        .catch(() => {
          setApiStudyHistory({ sessions: [], telemetry: [], practice: [] })
        })
    } catch {
      toast.error('Could not connect to vault')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const handleFocus = () => {
      sidecarApi.clearOptionsCache()
      fetchData()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchData])

  const calendarEvents = [
    ...(data?.assignments || []).map(a => ({...a, _type: 'Assignment', _date: a.due_date})),
    ...(data?.exams || []).map(e => ({...e, _type: 'Exam', _date: e.date})),
    // Local Store History (Real-time)
    ...(storeHistory || []).map(h => ({
      ...h,
      _type: 'Study',
      _date: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      title: h.type === 'practice' 
        ? `Recall: ${h.score}/${h.totalQuestions}` 
        : h.type === 'note_focus' 
          ? `Note: ${h.notePath?.split(/[/\\]/).pop()?.replace('.md', '') || 'Focus'}`
          : `Session: ${h.hub || 'Focus'}`
    })),
    // API History (Persistent)
    ...(apiStudyHistory?.sessions || []).map(s => ({
      id: s.id,
      title: `${s.hub_id || 'Focus'} Session`,
      _type: 'Study Session',
      _date: s.timestamp || new Date().toISOString(),
      duration: s.duration_seconds
    })),
    ...(apiStudyHistory?.telemetry || []).map(t => ({
      id: t.id,
      title: `Read: ${t.note_path?.split(/[/\\]/).pop()?.replace('.md', '') || 'Note'}`,
      _type: 'Note Visit',
      _date: t.timestamp || new Date().toISOString(),
      duration: t.duration_seconds
    })),
    ...(apiStudyHistory?.practice || []).map(p => ({
      id: p.id,
      title: `Recall: ${p.note_path?.split(/[/\\]/).pop()?.replace('.md', '') || p.hub_id || 'Quiz'}`,
      _type: 'Practice',
      _date: p.timestamp,
      isCorrect: p.is_correct
    }))
  ]

  if (loading) {
    return <BlockingLoader label="Loading Calendar Events" />
  }

  return (
    <div className="h-full flex flex-col p-4 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm">
      <AcademicCalendar 
        events={calendarEvents} 
        onSelectEvent={(path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`)} 
      />
    </div>
  )
}
