import { useState, useMemo, useEffect } from 'react';
import { 
  format, addMonths, subMonths, 
  startOfWeek, endOfWeek, eachDayOfInterval, 
  startOfMonth, endOfMonth, isSameMonth, isToday, 
  isSameDay, parseISO, startOfDay, addYears, subYears,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarContent } from '@/context/sidebar-content-context';

type ViewMode = 'month' | 'year';

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

const groupNoteVisits = (events: CalendarEvent[]): CalendarEvent[] => {
  const otherEvents = events.filter(e => e._type !== 'Note Visit');
  const noteVisits = events.filter(e => e._type === 'Note Visit');

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

function MiniCalendar({ currentDate, setCurrentDate, onOpenDayOverview }: { currentDate: Date, setCurrentDate: (d: Date) => void, onOpenDayOverview: (d: Date) => void }) {
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
                onOpenDayOverview(day);
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

function DayOverviewModal({
  date,
  events,
  onClose,
  onSelectEvent
}: {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
  onSelectEvent: (path: string) => void;
}) {
  const getEventPath = (ev: CalendarEvent) => {
    if (ev._type === 'Assignment' && ev.id) return `database/assignments/${ev.id}.md`;
    if (ev._type === 'Exam' && ev.id) return `database/exams/${ev.id}.md`;
    if (ev._type === 'Note Visit' && ev.id) return ev.id;
    if (ev._type === 'Study' && (ev as any).notePath) return (ev as any).notePath;
    if (ev._type === 'Practice' && (ev as any).note_path) return (ev as any).note_path;
    return null;
  };

  const counts = useMemo(() => {
    const defaultCounts = { exams: 0, tasks: 0, study: 0, practice: 0, notes: 0 };
    return events.reduce((acc, ev) => {
      if (ev._type === 'Exam') acc.exams++;
      else if (ev._type === 'Assignment') acc.tasks++;
      else if (ev._type === 'Study' || ev._type === 'Study Session') acc.study++;
      else if (ev._type === 'Practice') acc.practice++;
      else if (ev._type === 'Note Visit') acc.notes++;
      return acc;
    }, defaultCounts);
  }, [events]);

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />
      <div className="bg-bento-panel border border-border/40 rounded-[20px] p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-150 z-10">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-1.5 text-muted-foreground/50 hover:text-foreground rounded-full hover:bg-muted/10 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1.5 font-mono">
          Day View
        </div>
        <h3 className="text-xl font-black uppercase text-foreground leading-none">
          {format(date, 'EEEE, MMM d')}
        </h3>

        <div className="grid grid-cols-5 gap-2 my-6 select-none">
          <div className="flex flex-col items-center justify-center p-2 rounded-[10px] border border-orange-500/20 bg-orange-500/5 text-orange-500">
            <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1 font-mono">Exams</span>
            <span className="text-lg font-black leading-none">{counts.exams}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-[10px] border border-blue-500/20 bg-blue-500/5 text-blue-500">
            <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1 font-mono">Tasks</span>
            <span className="text-lg font-black leading-none">{counts.tasks}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-[10px] border border-emerald-500/20 bg-emerald-500/5 text-emerald-500">
            <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1 font-mono">Study</span>
            <span className="text-lg font-black leading-none">{counts.study}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-[10px] border border-purple-500/20 bg-purple-500/5 text-purple-500">
            <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1 font-mono">Practice</span>
            <span className="text-lg font-black leading-none">{counts.practice}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-[10px] border border-pink-500/20 bg-pink-500/5 text-pink-500">
            <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1 font-mono">Notes</span>
            <span className="text-lg font-black leading-none">{counts.notes}</span>
          </div>
        </div>

        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 font-mono">
          Study Sessions
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest border border-dashed border-border/40 rounded-[12px] bg-muted/5 select-none">
            No Activity Logged
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
            {events.map((ev, idx) => {
              const path = getEventPath(ev);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (path) {
                      onSelectEvent(path);
                      onClose();
                    }
                  }}
                  className={cn(
                    "bg-muted/15 border border-border/30 rounded-[8px] px-3.5 py-2.5 flex items-center justify-between text-left",
                    path ? "hover:bg-muted/25 cursor-pointer hover:border-foreground/20" : "cursor-default"
                  )}
                >
                  <span className="text-[11px] font-bold text-foreground/80 truncate flex-1">
                    {cleanTitle(ev.title)}
                  </span>
                  {path && (
                    <ExternalLink size={10} className="text-muted-foreground/40 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MonthView({ currentDate, setCurrentDate, events, onOpenDayOverview }: { currentDate: Date, setCurrentDate: (d: Date) => void, events: CalendarEvent[], onOpenDayOverview: (d: Date) => void }) {
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
              onClick={() => { setCurrentDate(day); onOpenDayOverview(day); }}
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

function YearView({ currentDate, setCurrentDate, events, onOpenDayOverview }: { currentDate: Date, setCurrentDate: (d: Date) => void, events: CalendarEvent[], onOpenDayOverview: (d: Date) => void }) {
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
                      onClick={() => { setCurrentDate(day); onOpenDayOverview(day); }}
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
  const [selectedDayOverview, setSelectedDayOverview] = useState<Date | null>(null);
  
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    'Exams & Assignments': true,
    'Study Sessions': true,
    'Practice': true,
    'Notes': true
  });

  const { setSidebarContent } = useSidebarContent();

  const toggleFilter = (filter: string) => setActiveFilters(p => ({ ...p, [filter]: !p[filter] }));

  const filteredEvents = useMemo(() => {
    const grouped = groupNoteVisits(events);
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
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'year') setCurrentDate(subYears(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'year') setCurrentDate(addYears(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col w-full font-sans min-h-0 h-full">
        <div className="flex border-b border-border/20 text-[9px] font-black tracking-widest mb-3 shrink-0 select-none px-1">
          <button 
            onClick={() => setSidebarTab('calendar')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center cursor-pointer",
              sidebarTab === 'calendar' 
                ? "text-foreground border-foreground font-black" 
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/10"
            )}
          >
            CALENDAR
          </button>
          <button 
            onClick={() => setSidebarTab('filters')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center cursor-pointer",
              sidebarTab === 'filters' 
                ? "text-foreground border-foreground font-black" 
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/10"
            )}
          >
            FILTERS
          </button>
        </div>

        {sidebarTab === 'calendar' ? (
          <div className="flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
            <MiniCalendar 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              onOpenDayOverview={setSelectedDayOverview}
            />
          </div>
        ) : (
          <div className="px-3 py-1 flex flex-col gap-2 min-h-0 overflow-y-auto custom-scrollbar">
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
                    <div className={cn("w-3 h-3 rounded-[4px] transition-all", active ? "bg-foreground" : "bg-muted border border-border/40")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-foreground" : "text-muted-foreground/60")}>
                      {name}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>,
      'calendar'
    );
    return () => {
      setSidebarContent(null, 'calendar');
    }
  }, [currentDate, view, activeFilters, sidebarTab, setSidebarContent]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDayOverview) return [];
    return events.filter(e => {
      const d = safeParseDate(e._date);
      return d ? isSameDay(d, selectedDayOverview) : false;
    });
  }, [events, selectedDayOverview]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden h-full">
      <div className="h-16 border-b border-border/20 flex items-center justify-between px-8 shrink-0 bg-muted/5 z-30">
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tight uppercase text-foreground">
            {view === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-muted/20 p-1 rounded-[8px] border border-border/40">
            {(['month', 'year'] as ViewMode[]).map(v => (
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
          {view === 'month' && (
            <MonthView 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              events={filteredEvents} 
              onOpenDayOverview={setSelectedDayOverview}
            />
          )}
          {view === 'year' && (
            <YearView 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              events={filteredEvents} 
              onOpenDayOverview={setSelectedDayOverview}
            />
          )}
        </div>
      </div>

      {selectedDayOverview && (
        <DayOverviewModal
          date={selectedDayOverview}
          events={selectedDayEvents}
          onClose={() => setSelectedDayOverview(null)}
          onSelectEvent={onSelectEvent}
        />
      )}
    </div>
  );
}
