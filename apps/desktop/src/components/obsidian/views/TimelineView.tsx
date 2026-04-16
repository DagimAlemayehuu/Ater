import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutList } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfDay, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface TimelineViewProps {
    rows: any[]
    schema: Record<string, any>
    onSelectRow: (id: string) => void
}

export function TimelineView({ rows, schema, onSelectRow }: TimelineViewProps) {
    const [currentRange, setCurrentRange] = useState(new Date())

    const targetDateProp = Object.keys(schema).find(k => schema[k] === 'date' || schema[k]?.type === 'date')
    
    const { days, months } = useMemo(() => {
        const start = startOfMonth(subMonths(currentRange, 1))
        const end = endOfMonth(addMonths(currentRange, 2))
        const interval = eachDayOfInterval({ start, end })
        
        // Group days by month for the header
        const monthMap: Record<string, Date[]> = {}
        interval.forEach(d => {
            const key = format(d, 'MMM yyyy')
            if (!monthMap[key]) monthMap[key] = []
            monthMap[key].push(d)
        })
        
        return {
            days: interval,
            months: Object.entries(monthMap).map(([name, days]) => ({ name, days }))
        }
    }, [currentRange])

    const getItemsForTimeline = () => {
        if (!targetDateProp) return []
        return rows.filter(r => r.properties[targetDateProp]).sort((a, b) => {
            return new Date(a.properties[targetDateProp]).getTime() - new Date(b.properties[targetDateProp]).getTime()
        })
    }

    const items = getItemsForTimeline()

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-900">
                        <LayoutList size={16} className="text-gray-400" />
                        <span className="text-[14px] font-black uppercase tracking-tight">Timeline View</span>
                    </div>
                    {targetDateProp && (
                        <div className="text-[9px] font-black tracking-widest text-gray-400 uppercase bg-gray-200/50 px-2.5 py-1 rounded-full border border-gray-200">
                            Plotting by: {targetDateProp}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentRange(new Date())} 
                        className="px-4 py-1.5 bg-white border border-gray-200 hover:border-gray-900 rounded-md text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all mr-2 shadow-sm"
                    >
                        Today
                    </button>
                    <div className="flex bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                        <button onClick={() => setCurrentRange(subMonths(currentRange, 1))} className="p-2 border-r border-gray-100 hover:bg-gray-50 transition-colors"><ChevronLeft size={14} /></button>
                        <button onClick={() => setCurrentRange(addMonths(currentRange, 1))} className="p-2 hover:bg-gray-50 transition-colors"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            {!targetDateProp ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50/30">
                    <div className="p-4 bg-white rounded-full border border-gray-100 shadow-sm text-gray-200">
                        <LayoutList size={32} />
                    </div>
                    <div className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                        No Date property found in schema
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Timeline Header (Months and Days) */}
                    <div className="flex overflow-hidden bg-white border-b border-gray-200 shrink-0 select-none">
                        <div className="w-[200px] shrink-0 border-r border-gray-200 bg-gray-50/50 flex items-end px-4 py-2">
                             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 line-clamp-1">Items</span>
                        </div>
                        <div className="flex flex-col flex-1 overflow-x-hidden">
                            <div className="flex border-b border-gray-100">
                                {months.map(m => (
                                    <div 
                                        key={m.name} 
                                        style={{ width: `${m.days.length * 40}px` }}
                                        className="shrink-0 text-center py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r border-gray-100 bg-gray-50/30"
                                    >
                                        {m.name}
                                    </div>
                                ))}
                            </div>
                            <div className="flex">
                                {days.map(d => {
                                    const today = isToday(d)
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                                    return (
                                        <div 
                                            key={d.toISOString()} 
                                            style={{ width: '40px' }}
                                            className={cn(
                                                "shrink-0 text-center py-1.5 text-[9px] font-bold border-r border-gray-100 last:border-r-0",
                                                today ? "bg-[#111827] text-white" : isWeekend ? "bg-gray-50/80 text-gray-400" : "text-gray-500"
                                            )}
                                        >
                                            {format(d, 'd')}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Body */}
                    <div className="flex-1 overflow-auto custom-scrollbar flex">
                        {/* Sidebar */}
                        <div className="w-[200px] shrink-0 border-r border-gray-200 bg-gray-50/30">
                            {items.map(item => (
                                <div 
                                    key={item.id} 
                                    className="h-10 flex items-center px-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors group"
                                    onClick={() => onSelectRow(item.id)}
                                >
                                    <span className="text-[11px] font-bold text-gray-800 truncate group-hover:underline">
                                        {item.title || 'Untitled'}
                                    </span>
                                </div>
                            ))}
                            <div className="h-20" /> {/* Spacer */}
                        </div>

                        {/* Grid */}
                        <div className="relative flex-1 bg-white min-h-full" style={{ width: `${days.length * 40}px` }}>
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {days.map(d => (
                                    <div 
                                        key={`line-${d.toISOString()}`} 
                                        style={{ width: '40px' }}
                                        className={cn(
                                            "h-full border-r border-gray-50 last:border-r-0",
                                            isToday(d) && "bg-blue-50/10 border-r-blue-200/50"
                                        )} 
                                    />
                                ))}
                            </div>

                            {/* Item Bars */}
                            <div className="relative z-10 py-0">
                                {items.map((item, idx) => {
                                    const dateVal = item.properties[targetDateProp]
                                    if (!dateVal) return null
                                    
                                    const itemDate = startOfDay(new Date(dateVal))
                                    const startOfTimeline = startOfDay(days[0])
                                    
                                    const diff = Math.floor((itemDate.getTime() - startOfTimeline.getTime()) / (1000 * 60 * 60 * 24))
                                    
                                    // If its outside our current 3-month scale, we can hide it or pin it
                                    if (diff < 0 || diff >= days.length) return null

                                    return (
                                        <div 
                                            key={`bar-${item.id}`} 
                                            className="h-10 flex items-center border-b border-gray-50 px-1"
                                        >
                                            <div 
                                                className="absolute h-6 bg-[#111827] rounded shadow-lg flex items-center px-2 cursor-pointer hover:scale-[1.02] transition-transform z-20 overflow-hidden group/bar"
                                                style={{ 
                                                    left: `${diff * 40 + 4}px`, 
                                                    width: 'auto',
                                                    minWidth: '32px'
                                                }}
                                                onClick={() => onSelectRow(item.id)}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                        {item.title}
                                                    </span>
                                                </div>
                                                
                                                {/* Tooltip on hover */}
                                                <div className="absolute left-0 -top-6 bg-black text-white px-2 py-0.5 rounded text-[8px] opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap font-bold">
                                                    {format(itemDate, 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
