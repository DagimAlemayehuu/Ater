import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  format, addMonths, subMonths, addDays, subDays, 
  startOfWeek, endOfWeek, eachDayOfInterval, 
  startOfMonth, endOfMonth, isSameMonth, isToday, 
  isSameDay, parseISO, startOfDay, addWeeks, subWeeks, addYears, subYears,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Target, Calendar as CalendarIcon, Filter, Clock, X, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
const cleanTitle = (title: string) => title.replace(/\.(md|pdf)$/, '').split('/').pop() || title;

const safeParseDate = (dateStr: any): Date | null => {
  if (!dateStr) return null;
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
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
                "h-6 w-full flex items-center justify-center text-[10px] font-medium rounded-none transition-none",
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
                "mt-1.5 w-9 h-9 flex items-center justify-center rounded-none text-sm font-black transition-none",
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
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-none bg-foreground/40" />
              </div>
            )}

            {days.map((day, dayIdx) => {
              const dayEvents = events.filter(e => {
                const d = safeParseDate(e._date);
                return d ? isSameDay(d, day) : false;
              });
              
              return (
                <div key={dayIdx} className="flex-1 relative border-l border-border/40 first:border-l-0 min-w-0">
                  {dayEvents.map((ev, i) => {
                    const date = safeParseDate(ev._date) || new Date();
                    const top = (date.getHours() * 64) + (date.getMinutes() / 60 * 64);
                    const durationMins = ev.duration ? ev.duration / 60 : 30;
                    const height = Math.max(22, (durationMins / 60) * 64);
                    const style = getEventColor(ev._type);
                    const isClickable = ev._type === 'Assignment' || ev._type === 'Exam' || ev._type === 'Note Visit';

                    const overlapping = dayEvents.filter(e => {
                      const d = safeParseDate(e._date);
                      if (!d) return false;
                      const t = (d.getHours() * 64) + (d.getMinutes() / 60 * 64);
                      const dur = e.duration ? e.duration / 60 : 30;
                      const h = Math.max(22, (dur / 60) * 64);
                      return (t < top + height && t + h > top);
                    });
                    const overlapIdx = overlapping.indexOf(ev);
                    const width = 100 / overlapping.length;
                    const left = width * overlapIdx;

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (ev._type === 'Assignment') onSelectEvent(`database/assignments/${ev.id}.md`);
                          if (ev._type === 'Exam') onSelectEvent(`database/exams/${ev.id}.md`);
                          if (ev._type === 'Note Visit' && ev.id) onSelectEvent(ev.id);
                        }}
                        className={cn(
                          "absolute rounded-none px-1.5 py-1 overflow-hidden border flex flex-col justify-start gap-1 transition-none",
                          style.bg, style.border,
                          isClickable ? "cursor-pointer hover:brightness-125 [0.98]" : "cursor-default"
                        )}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          left: `${left}%`,
                          width: `${width}%`
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn("w-1 h-2 rounded-none shrink-0", style.dot)} />
                          <div className={cn("font-black truncate tracking-tight leading-none", height < 30 ? "text-[8px]" : "text-[10px]", style.text)}>
                            {cleanTitle(ev.title)}
                          </div>
                        </div>
                        {height >= 45 && (
                          <div className={cn("text-[8px] truncate font-black uppercase tracking-widest text-muted-foreground pl-2.5")}>
                            {format(date, 'h:mm a')}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
    <div className="flex-1 flex flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-black tracking-[0.2em] text-muted-foreground/30">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-muted/10">
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
                "border-b border-l border-border/50 first:border-l-0 relative p-2 flex flex-col gap-1 transition-none group cursor-pointer",
                !isCurrMonth ? "bg-muted/10 opacity-40" : "bg-background hover:bg-muted/10",
                isToday(day) && "bg-muted/30"
              )}
            >
              <div className="flex justify-end mb-1">
                <span className={cn(
                  "text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-none transition-none",
                  isToday(day) ? "bg-foreground text-background" : !isCurrMonth ? "text-muted-foreground/20" : "text-foreground group-hover:text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar-mini flex flex-col gap-1">
                {dayEvents.slice(0, 4).map((ev, idx) => {
                  const style = getEventColor(ev._type);
                  return (
                    <div key={idx} className={cn("text-[8px] font-black truncate px-1.5 py-1 rounded-none border flex items-center gap-1.5", style.bg, style.border, style.text)}>
                      <div className={cn("w-1 h-2 rounded-none", style.dot)} />
                      {cleanTitle(ev.title)}
                    </div>
                  )
                })}
                {dayEvents.length > 4 && (
                  <div className="text-[8px] font-black text-muted-foreground/40 pl-1 uppercase tracking-widest">
                    + {dayEvents.length - 4}
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
                        "w-full aspect-square flex items-center justify-center text-[10px] font-medium rounded-none relative transition-none",
                        !isCurr ? "text-transparent pointer-events-none" : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
                        isToday(day) && "bg-foreground text-background font-black"
                      )}
                    >
                      {format(day, 'd')}
                      {hasEvents && isCurr && !isToday(day) && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-none bg-foreground/20" />
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
  
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    'Exams & Assignments': true,
    'Study Sessions': true,
    'Practice': true,
    'Notes': true
  });

  const toggleFilter = (filter: string) => setActiveFilters(p => ({ ...p, [filter]: !p[filter] }));

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
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

  return (
    <div className="flex h-full w-full bg-background border border-border/40 rounded-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border/20 flex flex-col bg-muted/30">
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center gap-3 text-foreground mb-1">
            <CalendarIcon size={18} />
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">Academic</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          <MiniCalendar 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            view={view} 
            setView={setView} 
          />
          
          <div className="px-6 py-4 flex flex-col gap-2 border-t border-border/10 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">Filters</span>
              <Filter size={10} className="text-foreground/10" />
            </div>
            {Object.entries(activeFilters).map(([name, active]) => {
              const color = "bg-muted-foreground/40";
              return (
                <button 
                  key={name}
                  onClick={() => toggleFilter(name)}
                  className="flex items-center justify-between group py-1"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-none transition-none", active ? "bg-foreground" : "bg-transparent border border-foreground/10")} />
                    <span className={cn("text-[10px] font-black transition-none uppercase tracking-widest", active ? "text-foreground" : "text-foreground/30 group-hover:text-foreground/50")}>
                      {name}
                    </span>
                  </div>
                  {active && <div className={cn("w-1 h-1 rounded-none bg-foreground")} />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="h-16 border-b border-border/10 flex items-center justify-between px-8 shrink-0 bg-background z-30">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight uppercase">
              {view === 'day' ? format(currentDate, 'MMMM d, yyyy') :
               view === 'week' ? `${format(startOfWeek(currentDate, {weekStartsOn:1}), 'MMM d')} - ${format(endOfWeek(currentDate, {weekStartsOn:1}), 'MMM d, yyyy')}` :
               view === 'year' ? format(currentDate, 'yyyy') :
               format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex bg-muted/20 p-1 rounded-none border border-border">
              {(['day', 'week', 'month', 'year'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-none transition-none",
                    view === v ? "bg-background text-foreground ring-1 ring-border/20" : "text-muted-foreground/40 hover:text-muted-foreground/60"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-muted/20 rounded-none border border-border">
                <button onClick={handlePrevious} className="w-8 h-8 flex items-center justify-center rounded-none hover:bg-muted text-muted-foreground hover:text-foreground transition-none "><ChevronLeft size={16}/></button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={handleToday} className="px-4 h-8 text-[10px] font-black uppercase tracking-widest rounded-none hover:bg-muted text-muted-foreground hover:text-foreground transition-none">Today</button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-none hover:bg-muted text-muted-foreground hover:text-foreground transition-none "><ChevronRight size={16}/></button>
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
    </div>
  );
}
