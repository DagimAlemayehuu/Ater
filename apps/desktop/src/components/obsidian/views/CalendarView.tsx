import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
    rows: any[]
    schema: Record<string, any>
    onSelectRow: (id: string) => void
    dateProperty?: string 
}

export function CalendarView({ rows, schema, onSelectRow, dateProperty }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const targetDateProp = dateProperty || Object.keys(schema).find(k => schema[k] === 'date' || schema[k]?.type === 'date')
    
    const { days, emptyStartDays } = useMemo(() => {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        return {
            days: eachDayOfInterval({ start, end }),
            emptyStartDays: Array.from({ length: getDay(start) }).map((_, i) => i)
        }
    }, [currentMonth])

    const getItemsForDay = (day: Date) => {
        if (!targetDateProp) return []
        return rows.filter(r => {
            const val = r.properties[targetDateProp]
            if (!val) return false
            try { return isSameDay(new Date(val), day) } catch { return false }
        })
    }

    return (
        <div className="flex flex-col h-full bg-white rounded border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="text-[14px] font-bold text-gray-800 tracking-tight">{format(currentMonth, 'MMMM yyyy')}</div>
                    {targetDateProp && (
                        <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase bg-gray-200/50 px-2 py-0.5 rounded">
                            By: {targetDateProp}
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 rounded text-gray-900 text-[10px] font-bold uppercase tracking-wider transition-colors mr-2 shadow-sm">Today</button>
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded text-[#111827] shadow-sm"><ChevronLeft size={14} /></button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded text-[#111827] shadow-sm"><ChevronRight size={14} /></button>
                </div>
            </div>

            {!targetDateProp ? (
                <div className="flex-1 flex items-center justify-center text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-gray-50/50">
                    No Date property available
                </div>
            ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-[#111827] text-center bg-gray-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2 border-r border-gray-200 last:border-r-0">{d}</div>)}
                    </div>
                    <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px border-b border-gray-200 overflow-y-auto custom-scrollbar">
                        {emptyStartDays.map(i => <div key={`empty-${i}`} className="bg-white/50" />)}
                        
                        {days.map(day => {
                            const items = getItemsForDay(day)
                            const today = isToday(day)
                            return (
                                <div key={day.toISOString()} className={cn("bg-white p-1.5 flex flex-col gap-1 min-h-[100px]", today && "bg-blue-50/20")}>
                                    <div className="flex justify-end mb-1">
                                        <div className={cn("text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full", today ? "bg-[#111827] text-white" : "text-gray-400")}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
                                        {items.map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => onSelectRow(item.id)}
                                                className="bg-[#111827] text-white text-[9px] font-bold px-1.5 py-1 rounded cursor-pointer hover:bg-black truncate transition-colors shadow-sm"
                                            >
                                                {item.title || 'Untitled'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
