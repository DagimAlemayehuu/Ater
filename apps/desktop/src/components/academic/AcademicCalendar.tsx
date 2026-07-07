import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  format, addMonths, subMonths, addDays, subDays, 
  startOfWeek, endOfWeek, eachDayOfInterval, 
  startOfMonth, endOfMonth, isSameMonth, isToday, 
  isSameDay, parseISO, startOfDay, addWeeks, subWeeks, addYears, subYears,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Target, Calendar as CalendarIcon, Filter, Clock, X, ExternalLink, BookOpen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarContent } from '@/context/sidebar-content-context';

type ViewMode = 'day' | 'week' | 'month' | 'year';

interface CalendarEvent {
  id?: string;
  title: string;
  _type: string;
  _date: string; // ISO string
  duration?: number; // seconds
  isCorrect?: boolean;
}

interface AcademicCalendarProps {
  events: CalendarEvent[];
  onSelectEvent: (path: string) => void;
}

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; glow: string }> = {
  'Exam': { bg: 'bg-foreground', border: 'border-foreground', text: 'text-background', dot: 'bg-background', glow: 'shadow-none' },
  'Assignment': { bg: 'bg-muted', border: 'border-border', text: 'text-foreground', dot: 'bg-muted-foreground', glow: 'shadow-none' },
  'Study Session': { bg: 'bg-muted/60', border: 'border-border/40', text: 'text-foreground/90', dot: 'bg-muted-foreground/60', glow: 'shadow-none' },
  'Study': { bg: 'bg-muted/60', border: 'border-border/40', text: 'text-foreground/90', dot: 'bg-muted-foreground/60', glow: 'shadow-none' },
  'Practice': { bg: 'bg-muted/60', border: 'border-border/40', text: 'text-foreground/90', dot: 'bg-muted-foreground/60', glow: 'shadow-none' },
  'Note Visit': { bg: 'bg-muted/30', border: 'border-border/20', text: 'text-muted-foreground', dot: 'bg-muted-foreground/40', glow: 'shadow-none' }
};

const getEventColor = (type: string) => EVENT_COLORS[type] || EVENT_COLORS['Note Visit'];
const cleanTitle = (title: string) => title.replace(/\.(md|pdf)$/, '').split(/[/\\]/).pop() || title;

const safeParseDate = (dateStr: any): Date | null => {
  if (!dateStr) return null;
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const MAX_COLS = 4;

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
}

const layoutDayEvents = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
  // Separate priority events from note visits
  const priorityEvents = dayEvents.filter(e => e._type !== 'Note Visit');
  const noteVisits = dayEvents.filter(e => e._type === 'Note Visit');

  // Limit and bucket note visits: group into hourly buckets showing max 3 per bucket
  const noteHourBuckets: Record<number, CalendarEvent[]> = {};
  noteVisits.forEach(nv => {
    const date = safeParseDate(nv._date);
    if (!date) return;
    const hour = date.getHours();
    if (!noteHourBuckets[hour]) noteHourBuckets[hour] = [];
    noteHourBuckets[hour].push(nv);
  });

  // Create representative note events per hour (up to 3 visible per hour, max 8 per day)
  const representativeNotes: CalendarEvent[] = Object.entries(noteHourBuckets)
    .flatMap(([, notes]) => notes.slice(0, 3))
    .slice(0, 8);

  const allEvents = [...priorityEvents, ...representativeNotes];

  const positioned = allEvents.map(ev => {
    const date = safeParseDate(ev._date) || new Date();
    const top = (date.getHours() * 64) + (date.getMinutes() / 60 * 64);
    const durationMins = ev.duration ? ev.duration / 60 : 30;
    const height = Math.max(22, (durationMins / 60) * 64);
    return {
      event: ev,
      top,
      height,
      end: top + height,
      left: 0,
      width: 100,
      colIndex: 0
    };
  });

  positioned.sort((a, b) => a.top - b.top || (b.end - b.top) - (a.end - a.top));

  const clusters: typeof positioned[] = [];
  let currentCluster: typeof positioned = [];
  let clusterEnd = 0;

  positioned.forEach(ev => {
    if (ev.top >= clusterEnd) {
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }
      currentCluster = [ev];
      clusterEnd = ev.end;
    } else {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.end);
    }
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedEvent[] = [];

  clusters.forEach(cluster => {
    const columns: number[] = [];

    cluster.forEach(ev => {
      let placed = false;
      for (let c = 0; c < columns.length && c < MAX_COLS; c++) {
        if (ev.top >= columns[c]) {
          columns[c] = ev.end;
          ev.colIndex = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        if (columns.length < MAX_COLS) {
          columns.push(ev.end);
          ev.colIndex = columns.length - 1;
        } else {
          ev.colIndex = MAX_COLS - 1;
          columns[MAX_COLS - 1] = Math.max(columns[MAX_COLS - 1], ev.end);
        }
      }
    });

    const colCount = Math.min(columns.length, MAX_COLS);
    cluster.forEach(ev => {
      const colIdx = Math.min(ev.colIndex, MAX_COLS - 1);
      const width = 100 / colCount;
      const left = colIdx * width;
      result.push({
        event: ev.event,
        top: ev.top,
        height: ev.height,
        left: left,
        width: width
      });
    });
  });

  return result;
};

const groupNoteVisits = (events: CalendarEvent[]): CalendarEvent[] => {
  const otherEvents = events.filter(e => e._type !== 'Note Visit');
  const noteVisits = events.filter(e => e._type === 'Note Visit' && e._date);

  const groups: Record<string, typeof noteVisits> = {};

  noteVisits.forEach(nv => {
    const date = safeParseDate(nv._date);
    if (!date) return;
    const key = `${format(date, 'yyyy-MM-dd-HH')}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(nv);
  });

  const groupedNotes: CalendarEvent[] = Object.entries(groups).map(([key, items]) => {
    const firstItem = items[0];
    const count = items.length;
    const dateStr = firstItem._date;
    
    const uniqueTitles = Array.from(new Set(items.map(i => cleanTitle(i.title))));
    const titleSummary = uniqueTitles.slice(0, 2).join(', ') + (uniqueTitles.length > 2 ? ` +${uniqueTitles.length - 2}` : '');
    
    return {
      id: `group-note-${key}`,
      title: `Read ${count} note${count > 1 ? 's' : ''}: ${titleSummary}`,
      _type: 'Note Visit',
      _date: dateStr,
      duration: items.reduce((acc, item) => acc + (item.duration || 60), 0)
    };
  });

  return [...otherEvents, ...groupedNotes];
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function MiniCalendar({ currentDate, setCurrentDate, view, setView }: { currentDate: Date, setCurrentDate: (d: Date) => void, view: ViewMode, setView: (v: ViewMode) => void }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{format(currentDate, 'MMMM yyyy')}</span>
        <div className="flex gap-1">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 text-muted-foreground/50 hover:text-foreground transition-none"><ChevronLeft size={12}/></button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 text-muted-foreground/50 hover:text-foreground transition-none"><ChevronRight size={12}/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {weekDays.map((d, i) => <div key={i} className="text-[9px] font-bold text-muted-foreground/40">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, currentDate);
          const isTodayDate = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <button
              key={i}
              onClick={() => {
                setCurrentDate(day);
                if (view === 'year' || view === 'month') setView('day');
              }}
              className={cn(
                "h-6 w-full flex items-center justify-center text-[10px] font-medium rounded-[8px] transition-none",
                !isCurrentMonth && "text-muted-foreground/20",
                isCurrentMonth && !isSelected && !isTodayDate && "text-muted-foreground hover:bg-muted",
                isSelected && !isTodayDate && "bg-muted text-foreground font-bold",
                isTodayDate && "bg-foreground text-background font-black"
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  );
}

function TimelineView({ days, events, currentDate, setCurrentDate, setView, onSelectEvent }: { days: Date[], events: CalendarEvent[], currentDate: Date, setCurrentDate: (d: Date) => void, setView: (v: ViewMode) => void, onSelectEvent: (path: string) => void }) {
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    if (scrollRef.current) {
      const hourHeight = 64;
      const scrollAmount = (now.getHours() - 2) * hourHeight;
      scrollRef.current.scrollTop = Math.max(0, scrollAmount);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b border-border/20 pl-14 shrink-0">
        {days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center py-4 border-l border-border/10 first:border-l-0 min-w-0">
            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isToday(day) ? "text-foreground" : "text-muted-foreground/40")}>
              {format(day, 'EEE')}
            </span>
            <button 
              onClick={() => { setCurrentDate(day); setView('day'); }}
              className={cn(
                "mt-1.5 w-9 h-9 flex items-center justify-center rounded-[8px] text-sm font-black transition-none",
                isToday(day) ? "bg-foreground text-background" : "hover:bg-muted text-foreground"
              )}
            >
              {format(day, 'd')}
            </button>
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative bg-muted/[0.01]">
        <div className="flex min-h-[1536px]">
          <div className="w-14 flex flex-col border-r border-border/10 sticky left-0 bg-background z-20">
            {hours.map(hour => (
              <div key={hour} className="h-16 flex justify-end pr-2.5 pt-2">
                <span className="text-[9px] font-black uppercase text-muted-foreground/20 tracking-tighter">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? 'NOON' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 flex relative">
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {hours.map(h => (
                <div key={h} className="h-16 border-t border-border/40 w-full" />
              ))}
            </div>

            {days.some(d => isSameDay(d, now)) && (
              <div 
                className="absolute left-0 right-0 h-px bg-foreground/10 z-10 pointer-events-none"
                style={{ top: `${(now.getHours() * 64) + (now.getMinutes() / 60 * 64)}px` }}
              >
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-[8px] bg-foreground/40" />
              </div>
            )}

            {days.map((day, dayIdx) => {
              const dayEvents = events.filter(e => {
                const d = safeParseDate(e._date);
                return d ? isSameDay(d, day) : false;
              });

              // Count total note visits before capping
              const totalNoteVisits = dayEvents.filter(e => e._type === 'Note Visit').length;
              
              const positionedEvents = layoutDayEvents(dayEvents);
              const shownNoteCount = positionedEvents.filter(pe => pe.event._type === 'Note Visit').length;
              const hiddenNoteCount = Math.max(0, totalNoteVisits - shownNoteCount);
              
              return (
                <div key={dayIdx} className="flex-1 relative border-l border-border/40 first:border-l-0 min-w-0">
                  {positionedEvents.map((pe, i) => {
                    const ev = pe.event;
                    const date = safeParseDate(ev._date) || new Date();
                    const style = getEventColor(ev._type);
                    const isClickable = ev._type === 'Assignment' || ev._type === 'Exam' || ev._type === 'Note Visit';
                    
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (ev._type === 'Assignment') onSelectEvent(`database/assignments/${ev.id}.md`);
                          if (ev._type === 'Exam') onSelectEvent(`database/exams/${ev.id}.md`);
                          if (ev._type === 'Note Visit' && ev.id) onSelectEvent(ev.id);
                        }}
                        className={cn(
                          "absolute rounded-[6px] px-2 py-1.5 overflow-hidden border flex flex-col justify-start gap-1 transition-none",
                          style.bg, style.border,
                          isClickable ? "cursor-pointer hover:bg-muted/10 transition-colors" : "cursor-default"
                        )}
                        style={{ 
                          top: `${pe.top}px`, 
                          height: `${pe.height}px`,
                          left: `${pe.left + 0.5}%`,
                          width: `${pe.width - 1}%`
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                          <div className={cn("font-bold truncate tracking-tight leading-none text-[10px]", style.text)}>
                            {cleanTitle(ev.title)}
                          </div>
                        </div>
                        {pe.height >= 40 && (
                          <div className={cn("text-[8px] truncate font-bold uppercase tracking-widest text-muted-foreground/60 pl-3")}>
                            {format(date, 'h:mm a')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {/* Hidden note count chip */}
                  {hiddenNoteCount > 0 && (
                    <div 
                      className="absolute right-1 bottom-2 text-[8px] font-black text-muted-foreground/40 bg-muted/20 border border-border/20 rounded-[4px] px-1.5 py-0.5 font-mono uppercase tracking-widest z-20 select-none pointer-events-none"
                    >
                      +{hiddenNoteCount} notes
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthView({ currentDate, setCurrentDate, events, setView, onOpenDayOverview }: { currentDate: Date, setCurrentDate: (d: Date) => void, events: CalendarEvent[], setView: (v: ViewMode) => void, onOpenDayOverview: (d: Date) => void }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <div className="grid grid-cols-7 border-b border-border/40 shrink-0">
        {weekDays.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-black tracking-[0.2em] text-muted-foreground/30 font-mono">
            {d}
          </div>
        ))}
      </div>
      <div 
        className="flex-1 grid grid-cols-7 bg-muted/10 min-h-0"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, 1fr)` }}
      >
        {days.map((day, i) => {
          const isCurrMonth = isSameMonth(day, currentDate);
          const dayEvents = events.filter(e => {
            const d = safeParseDate(e._date);
            return d ? isSameDay(d, day) : false;
          });
          
          return (
            <div 
              key={i} 
              onClick={() => { setCurrentDate(day); setView('day'); }}
              className={cn(
                "border-b border-l border-border/50 first:border-l-0 relative p-2 flex flex-col gap-1 transition-none group cursor-pointer min-h-0 w-full h-full",
                !isCurrMonth ? "bg-muted/10 opacity-40" : "bg-background hover:bg-muted/10",
                isToday(day) && "bg-muted/30"
              )}
            >
              <div className="flex justify-end mb-1 shrink-0">
                <span className={cn(
                  "text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-[6px] transition-none",
                  isToday(day) ? "bg-foreground text-background" : !isCurrMonth ? "text-muted-foreground/20" : "text-foreground group-hover:text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar-mini flex flex-col gap-1 min-h-0">
                {dayEvents.slice(0, 2).map((ev, idx) => {
                  const style = getEventColor(ev._type);
                  return (
                    <div key={idx} className={cn("text-[8px] font-black truncate px-1.5 py-0.5 rounded-[4px] border flex items-center gap-1.5 shrink-0", style.bg, style.border, style.text)}>
                      <div className={cn("w-1 h-1.5 rounded-full shrink-0", style.dot)} />
                      <span className="truncate">{cleanTitle(ev.title)}</span>
                    </div>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] font-black text-muted-foreground/45 pl-1.5 uppercase tracking-widest shrink-0 leading-none py-0.5 font-mono">
                    + {dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

function YearView({ currentDate, setCurrentDate, events, setView }: { currentDate: Date, setCurrentDate: (d: Date) => void, events: CalendarEvent[], setView: (v: ViewMode) => void }) {
  const yearStart = startOfDay(new Date(currentDate.getFullYear(), 0, 1));
  const months = Array.from({ length: 12 }).map((_, i) => addMonths(yearStart, i));
  
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-muted/[0.01]">
      <div className="grid grid-cols-3 gap-x-16 gap-y-12 max-w-6xl mx-auto">
        {months.map(month => {
          const mStart = startOfMonth(month);
          const mEnd = endOfMonth(mStart);
          const days = eachDayOfInterval({ start: startOfWeek(mStart, { weekStartsOn: 1 }), end: endOfWeek(mEnd, { weekStartsOn: 1 }) });
          
          return (
            <div key={month.getMonth()} className="flex flex-col">
              <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-4 pl-1">{format(month, 'MMMM')}</h4>
              <div className="grid grid-cols-7 text-center mb-3">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[9px] font-black text-muted-foreground/20">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {days.map((day, i) => {
                  const isCurr = isSameMonth(day, month);
                  const hasEvents = events.some(e => {
                    const d = safeParseDate(e._date);
                    return d ? isSameDay(d, day) : false;
                  });
                  
                  return (
                    <button
                      key={i}
                      onClick={() => { setCurrentDate(day); setView('day'); }}
                      className={cn(
                        "w-full aspect-square flex items-center justify-center text-[10px] font-medium rounded-[8px] relative transition-none",
                        !isCurr ? "text-transparent pointer-events-none" : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
                        isToday(day) && "bg-foreground text-background font-black"
                      )}
                    >
                      {format(day, 'd')}
                      {hasEvents && isCurr && !isToday(day) && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-[8px] bg-foreground/20" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AcademicCalendar({ events, onSelectEvent }: AcademicCalendarProps) {
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarTab, setSidebarTab] = useState<'calendar' | 'filters'>('calendar');
  
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    'Exams & Assignments': true,
    'Study Sessions': true,
    'Practice': true,
    'Notes': true
  });

  const { setSidebarContent } = useSidebarContent();

  const toggleFilter = (filter: string) => setActiveFilters(p => ({ ...p, [filter]: !p[filter] }));

  const filteredEvents = useMemo(() => {
    const validEvents = (events || []).filter(e => e && e._date);
    const grouped = groupNoteVisits(validEvents);
    return grouped.filter(ev => {
      const isExamOrAssign = ev._type === 'Exam' || ev._type === 'Assignment';
      const isStudy = ev._type === 'Study Session' || ev._type === 'Study';
      const isPractice = ev._type === 'Practice';
      const isNote = ev._type === 'Note Visit';
      
      if (isExamOrAssign && !activeFilters['Exams & Assignments']) return false;
      if (isStudy && !activeFilters['Study Sessions']) return false;
      if (isPractice && !activeFilters['Practice']) return false;
      if (isNote && !activeFilters['Notes']) return false;
      
      return ev._date;
    });
  }, [events, activeFilters]);

  const handlePrevious = () => {
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'year') setCurrentDate(subYears(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'year') setCurrentDate(addYears(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col w-full font-sans min-h-0 h-full divide-y divide-border/20">
        <div className="flex flex-col shrink-0">
          <MiniCalendar 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            view={view} 
            setView={setView} 
          />
        </div>

        <div className="px-3 py-4 flex flex-col gap-2 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3 px-1 select-none">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 leading-none font-mono">Filters</span>
            <Filter size={12} className="text-muted-foreground/45" />
          </div>
          {Object.entries(activeFilters).map(([name, active]) => {
            return (
              <button 
                key={name}
                onClick={() => toggleFilter(name)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none text-muted-foreground hover:text-foreground hover:bg-bento-item/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer", 
                    active ? "bg-bento-item border-foreground/35 text-foreground" : "border-border/40 bg-bento-panel"
                  )}>
                    {active && <Check size={10} className="text-foreground" strokeWidth={4} />}
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-foreground" : "text-muted-foreground/60")}>
                    {name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>,
      'calendar'
    );
    return () => {
      setSidebarContent(null, 'calendar');
    }
  }, [currentDate, view, activeFilters, setSidebarContent]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden h-full">
      <div className="h-16 border-b border-border/20 flex items-center justify-between px-8 shrink-0 bg-muted/5 z-30">
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tight uppercase text-foreground">
            {view === 'day' ? format(currentDate, 'MMMM d, yyyy') :
             view === 'week' ? `${format(startOfWeek(currentDate, {weekStartsOn:1}), 'MMM d')} - ${format(endOfWeek(currentDate, {weekStartsOn:1}), 'MMM d, yyyy')}` :
             view === 'year' ? format(currentDate, 'yyyy') :
             format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-muted/20 p-1 rounded-[8px] border border-border/40">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all cursor-pointer",
                  view === v ? "bg-bento-item text-foreground shadow-sm border border-border/40" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center p-1 bg-muted/20 rounded-[8px] border border-border/40">
              <button onClick={handlePrevious} className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer"><ChevronLeft size={16}/></button>
              <div className="w-px h-4 bg-border/40 mx-1" />
              <button onClick={handleToday} className="px-4 h-8 text-[9px] font-black uppercase tracking-widest rounded-[6px] hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer">Today</button>
              <div className="w-px h-4 bg-border/40 mx-1" />
              <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 flex flex-col">
          {view === 'day' && (
            <TimelineView 
              days={[currentDate]} 
              events={filteredEvents} 
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              setView={setView}
              onSelectEvent={onSelectEvent}
            />
          )}
          {view === 'week' && (
            <TimelineView 
              days={eachDayOfInterval({ start: startOfWeek(currentDate, {weekStartsOn: 1}), end: endOfWeek(currentDate, {weekStartsOn: 1}) })} 
              events={filteredEvents}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              setView={setView}
              onSelectEvent={onSelectEvent}
            />
          )}
          {view === 'month' && (
            <MonthView 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              events={filteredEvents} 
              setView={setView} 
              onOpenDayOverview={() => {}}
            />
          )}
          {view === 'year' && (
            <YearView 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              events={filteredEvents} 
              setView={setView} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
