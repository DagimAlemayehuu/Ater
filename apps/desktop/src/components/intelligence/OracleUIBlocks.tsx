import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  Sparkles,
  Search,
  Layout,
  Calendar,
  Layers,
  Zap,
  Database,
  Sliders,
  Table,
  Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { sidecarApi } from '@/lib/sidecarApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// --- Focus HUD (Pomodoro) ---
export const FocusHUD = ({ payload }: { payload: any }) => {
    const store = usePomodoroStore();
    const { timeLeft, isActive, mode, currentHub, setTimeLeft, setIsActive, setCurrentHub } = store;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'focus' 
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
        : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

    return (
        <div className="p-6 border border-border bg-background my-4 rounded-[12px] select-none shadow-sm group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "size-10 rounded-[12px] border flex items-center justify-center transition-colors",
                        isActive ? "border-primary/40 bg-primary/5 animate-pulse" : "border-border bg-muted/20"
                    )}>
                        <Clock size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">
                            Focus Session
                        </h4>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            {mode === 'focus' ? 'Deep Work' : 'Break Time'}
                        </span>
                    </div>
                </div>
                <Badge variant="outline" className="rounded-[12px] font-black text-[9px] uppercase tracking-widest px-2 py-1">
                    {currentHub?.replace(/_/g, ' ') || 'No Hub Selected'}
                </Badge>
            </div>

            <div className="space-y-6">
                <div className="text-5xl font-black text-foreground text-center tracking-tighter tabular-nums py-2">
                    {formatTime(timeLeft)}
                </div>
                
                <div className="space-y-2">
                    <Progress value={progress} className="h-1.5 rounded-[12px] bg-muted/20" />
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                        <span>Started</span>
                        <span>{mode === 'focus' ? '25:00' : '05:00'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button 
                        variant="outline" 
                        className="rounded-[12px] border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Pause size={12} className="mr-2" /> : <Play size={12} className="mr-2" />}
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button 
                        variant="outline" 
                        className="rounded-[12px] border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                        onClick={() => {
                            setIsActive(false);
                            setTimeLeft(25 * 60);
                        }}
                    >
                        <Square size={12} className="mr-2" /> Reset
                    </Button>
                    <Button 
                        variant="outline" 
                        className="rounded-[12px] border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                    >
                        <Settings size={12} className="mr-2" /> Config
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- Generation Stepper ---
export const GenerationStepper = ({ payload }: { payload: any }) => {
    const { session_id, file_path, curriculum, plan } = payload;
    const [step, setStep] = useState(payload.current_step || 1);
    const [isDeploying, setIsDeploying] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleConfirm = async () => {
        setIsDeploying(true);
        try {
            await sidecarApi.aterConfirm({ session_id });
            toast.success("Generation pipeline initiated successfully!");
            setStep(4);
        } catch (err) {
            toast.error("Failed to initiate deployment.");
        } finally {
            setIsDeploying(false);
        }
    };

    const fileName = file_path.split(/[/\\]/).pop() || 'File';

    return (
        <div className="p-6 border border-border bg-background my-4 rounded-[12px] shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                <div className="size-10 border border-foreground bg-foreground text-background flex items-center justify-center">
                    <Zap size={20} />
                </div>
                <div>
                    <h3 className="text-[13px] font-black uppercase tracking-[0.25em] text-foreground">
                        Ater Pipeline
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                        Inference & Extraction System
                    </p>
                </div>
            </div>

            <div className="relative mb-12">
                <div className="absolute top-1/2 left-0 w-full h-px bg-border -translate-y-1/2" />
                <div className="relative flex justify-between">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center gap-3 bg-background px-2 z-10">
                            <div className={cn(
                                "size-8 flex items-center justify-center border-2 transition-all duration-300",
                                step >= s ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground/30"
                            )}>
                                <span className="text-[11px] font-black">{s}</span>
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                step === s ? "text-foreground" : "text-muted-foreground/40"
                            )}>
                                {s === 1 ? 'Curriculum' : s === 2 ? 'Planning' : 'Deployment'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="min-h-[160px] bg-muted/5 border border-border/30 p-5 mb-6">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className="text-muted-foreground" />
                            <span className="text-[11px] font-bold text-foreground/80">{fileName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Detected Course</label>
                                <div className="p-2 border border-border bg-background text-[10px] font-bold uppercase">{curriculum?.course || 'Not Found'}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Semester</label>
                                <div className="p-2 border border-border bg-background text-[10px] font-bold uppercase">{curriculum?.semester || 'Not Found'}</div>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full rounded-[12px] border-foreground/20 hover:border-foreground/40 text-[10px] font-black uppercase tracking-widest mt-4"
                            onClick={() => setStep(2)}
                        >
                            Confirm Curriculum <ArrowRight size={12} className="ml-2" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Proposed Atomic Notes</span>
                            <Badge variant="outline" className="rounded-[12px] text-[9px] font-black uppercase">{plan?.notes?.length || 0} Total</Badge>
                        </div>
                        <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                            {plan?.notes?.map((note: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2 border border-border/50 bg-background/50">
                                    <div className="size-1.5 bg-foreground/20" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/80 truncate">{note.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                        <Button 
                            className="w-full rounded-[12px] bg-foreground text-background hover:bg-foreground/90 text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-foreground/5 mt-4"
                            onClick={handleConfirm}
                            disabled={isDeploying}
                        >
                            {isDeploying ? 'Deploying Agents...' : 'Deploy Study Agents'}
                        </Button>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-500">
                        <div className="size-16 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-6 bg-emerald-500/5">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground mb-2">Deployment Active</h4>
                        <p className="text-[10px] text-muted-foreground max-w-[240px] leading-relaxed uppercase tracking-widest font-bold">
                            Your personal academic oracle is now processing this source into atomic notes.
                        </p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-center">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                    Phase: {step < 4 ? `Step ${step} of 3` : 'Complete'}
                </span>
            </div>
        </div>
    );
};

// --- Activity Vitals (Dashboard) ---
export const ActivityVitals = ({ payload }: { payload: any }) => {
    const { stats, streak, goal_progress } = payload;
    
    return (
        <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-5 border border-border bg-background flex flex-col justify-between h-32 group hover:border-foreground/30 transition-all cursor-default">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Study Streak</span>
                    <Sparkles size={14} className="text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">{streak || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Days</span>
                </div>
                <div className="w-full h-1 bg-muted/20 mt-2">
                    <div className="h-full bg-amber-500" style={{ width: '70%' }} />
                </div>
            </div>

            <div className="p-5 border border-border bg-background flex flex-col justify-between h-32 group hover:border-foreground/30 transition-all cursor-default">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Daily Goal</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">{goal_progress || 0}%</span>
                </div>
                <div className="w-full h-1 bg-muted/20 mt-2">
                    <div className="h-full bg-emerald-500" style={{ width: `${goal_progress || 0}%` }} />
                </div>
            </div>
        </div>
    );
};

// --- Search Navigator ---
export const SearchNavigator = ({ payload }: { payload: any }) => {
    const { query, results } = payload;
    const navigate = useNavigate();

    return (
        <div className="my-6 border border-border bg-background overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search size={14} className="text-muted-foreground" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/70">
                        Results for "{query}"
                    </span>
                </div>
                <Badge variant="outline" className="rounded-[12px] text-[9px] font-black uppercase">
                    {results?.length || 0} Found
                </Badge>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/50 custom-scrollbar">
                {results?.map((res: any, i: number) => (
                    <div 
                        key={i}
                        className="p-4 hover:bg-muted/5 transition-colors cursor-pointer group flex items-start justify-between gap-4"
                        onClick={() => navigate(`/obsidian?path=${encodeURIComponent(res.path)}`)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 size-7 border border-border flex items-center justify-center group-hover:border-foreground/40 transition-all">
                                <FileText size={12} className="text-muted-foreground group-hover:text-foreground" />
                            </div>
                            <div className="min-w-0">
                                <h5 className="text-[12px] font-black uppercase text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                                    {res.title?.replace(/_/g, ' ')}
                                </h5>
                                <p className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tight mt-1">
                                    {res.folder || 'Root'} • {res.relevance || 'High'} Match
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Button variant="ghost" size="icon" className="size-8 rounded-[12px] border border-border/50 hover:border-foreground/20">
                                <ArrowRight size={12} />
                           </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Calendar Bar ---
export const CalendarBar = ({ payload }: { payload: any }) => {
    const { events } = payload;
    
    return (
        <div className="my-6 space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">Upcoming Deadlines</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 px-1 -mx-1 snap-x scroll-smooth custom-scrollbar">
                {events?.map((ev: any, i: number) => (
                    <div 
                        key={i}
                        className="min-w-[160px] snap-start p-4 border border-border bg-background flex flex-col justify-between h-32 hover:border-foreground/40 transition-all cursor-default select-none group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{ev.type}</span>
                            <Badge variant="outline" className={cn(
                                "rounded-[12px] text-[8px] font-black",
                                ev.priority === 'High' ? "border-rose-500/20 text-rose-500" : "border-border"
                            )}>
                                {ev.priority || 'Normal'}
                            </Badge>
                        </div>
                        <h5 className="text-[11px] font-black uppercase text-foreground leading-tight mt-2 line-clamp-2">
                            {ev.title}
                        </h5>
                        <div className="text-[10px] font-black text-foreground/40 font-mono pt-2 border-t border-border/10 mt-2">
                            {ev.date}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Inbox Gallery ---
export const InboxGallery = ({ payload, onProcess }: { payload: any, onProcess?: (path: string) => void }) => {
    const { files } = payload;
    
    if (!files || files.length === 0) {
        return (
            <div className="p-8 border border-dashed border-border flex flex-col items-center justify-center text-center my-4 bg-muted/5">
                <FileText size={24} className="text-muted-foreground/20 mb-3" />
                <p className="text-[11px] font-black uppercase text-muted-foreground/40 tracking-widest">Inbox is Empty</p>
            </div>
        );
    }

    return (
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files?.map((file: any, i: number) => (
                <div key={i} className="group relative border border-border bg-background p-4 flex flex-col items-center gap-4 hover:border-foreground/40 transition-all cursor-default select-none">
                    <div className="size-16 bg-muted/5 border border-border/50 flex items-center justify-center group-hover:bg-muted/10 transition-colors">
                        <FileText size={24} className="text-muted-foreground/40 group-hover:text-foreground/20" />
                    </div>
                    <div className="text-center w-full">
                        <h5 className="text-[10px] font-black uppercase text-foreground truncate px-2">{file.name}</h5>
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1 block">
                            {file.size} • {file.type}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-4 border border-foreground/30">
                        <Button 
                            className="w-full h-8 rounded-[12px] text-[9px] font-black uppercase tracking-widest"
                            onClick={() => onProcess?.(file.path)}
                        >
                            Process with Ater
                        </Button>
                        <Button variant="outline" className="w-full h-8 rounded-[12px] text-[9px] font-black uppercase tracking-widest">
                            Preview
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- SRS Flashcard (Quick-Flip) ---
export const SRSFlashcard = ({ payload }: { payload: any }) => {
    const { question, answer, note_path } = payload;
    const [isFlipped, setIsFlipped] = useState(false);

    const handleGrade = async (grade: number) => {
        try {
            // sidecarApi.gradeSRS(note_path, grade)
            toast.success(`Card graded: ${grade}`);
        } catch (err) {
            toast.error("Failed to update SRS.");
        }
    };

    return (
        <div className="my-6 perspective-1000">
            <div className={cn(
                "relative w-full min-h-[240px] transition-all duration-500 transform-style-3d cursor-pointer",
                isFlipped ? "rotate-y-180" : ""
            )} onClick={() => setIsFlipped(!isFlipped)}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden border-2 border-border bg-background p-8 flex flex-col items-center justify-center text-center">
                    <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Question</span>
                    <h3 className="text-lg font-bold text-foreground leading-relaxed">
                        {question}
                    </h3>
                    <div className="mt-8 flex items-center gap-2 text-muted-foreground/40">
                        <Zap size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Click to reveal</span>
                    </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 border-2 border-foreground/20 bg-muted/5 p-8 flex flex-col items-center justify-center text-center">
                    <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Answer</span>
                    <div className="text-[13px] text-foreground leading-relaxed max-w-[280px]">
                        {answer}
                    </div>
                    
                    <div className="mt-8 grid grid-cols-4 gap-2 w-full max-w-[300px]" onClick={e => e.stopPropagation()}>
                        {[1, 2, 3, 4].map((g) => (
                            <Button 
                                key={g}
                                variant="outline" 
                                className="rounded-[12px] text-[9px] font-black uppercase h-9 border-border hover:border-foreground/40"
                                onClick={() => handleGrade(g)}
                            >
                                {g === 1 ? 'Again' : g === 2 ? 'Hard' : g === 3 ? 'Good' : 'Easy'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- App Config Block ---
export const AppConfigBlock = ({ payload, onSendMessage }: { payload: any; onSendMessage?: (text: string) => void }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameVal, setNameVal] = useState(payload.display_name || '');

    const handleSaveName = () => {
        if (nameVal && nameVal !== payload.display_name) {
            onSendMessage?.(`Update my display name to "${nameVal}"`);
        }
        setIsEditingName(false);
    };

    const handleToggleAutoDeploy = () => {
        const nextState = !payload.auto_deploy;
        onSendMessage?.(`Update config auto_deploy to ${nextState}`);
    };

    return (
        <div className="p-5 border-[0.5px] border-border bg-background/50 backdrop-blur-sm my-4 rounded-[12px] select-none shadow-sm space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Settings size={14} className="text-muted-foreground animate-spin-slow" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        App Preferences
                    </span>
                </div>
                <Badge variant="outline" className="rounded-[12px] font-bold text-[8px] uppercase tracking-wider border-border bg-muted/20 text-muted-foreground">
                    System
                </Badge>
            </div>

            {/* Profile Section */}
            <div className="flex items-center justify-between gap-4 p-3 border-[0.5px] border-border/60 bg-muted/5">
                <div className="min-w-0">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 block">User Persona</span>
                    {isEditingName ? (
                        <div className="flex items-center gap-2 mt-1">
                            <input 
                                type="text"
                                value={nameVal}
                                onChange={(e) => setNameVal(e.target.value)}
                                className="h-6 px-2 bg-background border border-border text-[11px] font-bold outline-none rounded-[12px] focus:border-foreground/40 w-32"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                autoFocus
                            />
                            <Button 
                                variant="outline" 
                                className="h-6 px-2 rounded-[12px] text-[9px] font-black uppercase border-foreground bg-foreground text-background hover:bg-foreground/90"
                                onClick={handleSaveName}
                            >
                                Save
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12px] font-black uppercase text-foreground truncate">
                                {payload.display_name || 'Anonymous Learner'}
                            </span>
                            <button 
                                onClick={() => setIsEditingName(true)}
                                className="text-[9px] font-bold text-muted-foreground/60 hover:text-foreground underline decoration-dotted transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Auto Ingestion Toggle */}
                <div className="flex items-center gap-3 pl-4 border-l border-border/40">
                    <div className="text-right">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 block">Auto Ingestion</span>
                        <span className="text-[9px] font-bold text-foreground/80">{payload.auto_deploy ? "ENABLED" : "DISABLED"}</span>
                    </div>
                    <button 
                        onClick={handleToggleAutoDeploy}
                        className={cn(
                            "w-8 h-4 rounded-full transition-colors relative border-[0.5px]",
                            payload.auto_deploy ? "bg-foreground border-foreground" : "bg-muted/35 border-border"
                        )}
                    >
                        <div className={cn(
                            "size-3 rounded-full bg-background absolute top-[1px] transition-all",
                            payload.auto_deploy ? "left-[15px]" : "left-[2px]"
                        )} />
                    </button>
                </div>
            </div>

            {/* Folder Paths */}
            <div className="space-y-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 block">Vault & System Paths</span>
                <div className="grid grid-cols-1 gap-2">
                    <div className="p-2.5 border-[0.5px] border-border bg-background hover:border-foreground/20 transition-all select-none">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>Obsidian Vault</span>
                            <span className="text-[7px] border-[0.5px] px-1 font-mono">MD Docs</span>
                        </div>
                        <p className="text-[10px] font-mono text-foreground/70 truncate mt-1">{payload.obsidian_vault_path || 'Not Configured'}</p>
                    </div>
                    <div className="p-2.5 border-[0.5px] border-border bg-background hover:border-foreground/20 transition-all select-none">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>Inbox Folder</span>
                            <span className="text-[7px] border-[0.5px] px-1 font-mono">Ingestion</span>
                        </div>
                        <p className="text-[10px] font-mono text-foreground/70 truncate mt-1">{payload.inbox_path || 'Not Configured'}</p>
                    </div>
                    <div className="p-2.5 border-[0.5px] border-border bg-background hover:border-foreground/20 transition-all select-none">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>Academic Folder</span>
                            <span className="text-[7px] border-[0.5px] px-1 font-mono">Curricula</span>
                        </div>
                        <p className="text-[10px] font-mono text-foreground/70 truncate mt-1">{payload.academic_folder_path || 'Not Configured'}</p>
                    </div>
                </div>
            </div>

            {/* Pomodoro Configurations */}
            <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 block">Focus Durations</span>
                    <div className="p-2.5 border-[0.5px] border-border bg-background text-[10px] text-foreground/80 space-y-1">
                        <div className="flex justify-between font-bold">
                            <span className="uppercase text-muted-foreground/70 font-black text-[8px]">Work Session:</span>
                            <span>{payload.pomodoro_work_duration}m</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="uppercase text-muted-foreground/70 font-black text-[8px]">Short Break:</span>
                            <span>{payload.pomodoro_short_break_duration}m</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="uppercase text-muted-foreground/70 font-black text-[8px]">Long Break:</span>
                            <span>{payload.pomodoro_long_break_duration}m</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 block">AI Engine</span>
                    <div className="p-2.5 border-[0.5px] border-border bg-background text-[10px] text-foreground/80 space-y-1">
                        <div className="flex justify-between font-bold">
                            <span className="uppercase text-muted-foreground/70 font-black text-[8px]">Provider:</span>
                            <span className="truncate max-w-[80px] text-right uppercase text-[9px] font-mono">{payload.ai_provider || 'OpenAI'}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="uppercase text-muted-foreground/70 font-black text-[8px]">Model:</span>
                            <span className="truncate max-w-[80px] text-right uppercase text-[9px] font-mono">{payload.ai_model || 'gpt-4o'}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span className="uppercase text-muted-foreground/70 font-black text-[8px]">Properties:</span>
                            <span>{payload.show_properties ? "Show" : "Hide"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Queue Status Block ---
export const QueueStatusBlock = ({ payload, onSendMessage }: { payload: any; onSendMessage?: (text: string) => void }) => {
    const { status, auto_process, active_files, current_file, current_batch, total_batches, last_action, queue_size, governor_pressure } = payload;
    const isProcessing = status === 'processing' || status === 'indexing';

    const handleToggleAutoIngest = () => {
        onSendMessage?.(`Update config auto_deploy to ${!auto_process}`);
    };

    const handleProcessQueue = () => {
        onSendMessage?.("Process the files in the ingestion queue");
    };

    return (
        <div className="p-5 border-[0.5px] border-border bg-background/50 backdrop-blur-sm my-4 rounded-[12px] select-none shadow-sm space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Database size={14} className={cn("text-muted-foreground", isProcessing && "animate-pulse text-foreground")} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        Ingestion Pipeline
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "size-2 rounded-full",
                        isProcessing ? "bg-foreground animate-ping" : "bg-muted-foreground/30"
                    )} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/80">
                        {status || 'Idle'}
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border-[0.5px] border-border/60 bg-muted/5 flex flex-col justify-between h-20">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Queue Load</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tracking-tight">{queue_size || 0}</span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Pending</span>
                    </div>
                </div>
                
                <div className="p-3 border-[0.5px] border-border/60 bg-muted/5 flex flex-col justify-between h-20">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Governor Pressure</span>
                        <span className="text-[9px] font-mono font-bold text-foreground/80">{governor_pressure || 0}%</span>
                    </div>
                    <div className="space-y-1">
                        <div className="w-full h-1 bg-muted/20">
                            <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${Math.min(governor_pressure || 0, 100)}%` }} />
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 block">
                            {governor_pressure > 80 ? "CRITICAL HEAT" : governor_pressure > 40 ? "ACTIVE THROTTLE" : "STABLE FLOW"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Active processing details */}
            {isProcessing && (current_file || active_files?.length > 0) && (
                <div className="p-3 border-[0.5px] border-border bg-background space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Currently Processing</span>
                        {total_batches > 0 && (
                            <span className="text-[9px] font-mono font-bold">
                                Batch {current_batch}/{total_batches}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] font-mono text-foreground/80 truncate">
                        {current_file || (active_files && active_files[0])}
                    </p>
                    {total_batches > 0 && (
                        <div className="w-full h-1 bg-muted/20">
                            <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${(current_batch / total_batches) * 100}%` }} />
                        </div>
                    )}
                </div>
            )}

            {/* Actions / Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
                <Button 
                    variant="outline" 
                    className="rounded-[12px] border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                    onClick={handleToggleAutoIngest}
                >
                    {auto_process ? 'Disable Auto Ingest' : 'Enable Auto Ingest'}
                </Button>
                <Button 
                    variant="outline" 
                    className={cn(
                        "rounded-[12px] border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9",
                        queue_size > 0 && !isProcessing && "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                    )}
                    onClick={handleProcessQueue}
                    disabled={isProcessing || queue_size === 0}
                >
                    {isProcessing ? 'Processing...' : 'Process Queue'}
                </Button>
            </div>
            
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 border-t border-border/30 pt-2.5">
                <span>Last Action: {last_action || 'None'}</span>
                <span>Active Files: {active_files?.length || 0}</span>
            </div>
        </div>
    );
};

// --- Study History Block ---
export const StudyHistoryBlock = ({ payload }: { payload: any }) => {
    const { sessions = [], practice = [] } = payload;
    const [activeTab, setActiveTab] = useState<'sessions' | 'practice'>('sessions');

    const formatDuration = (secs: number) => {
        if (!secs) return '0s';
        const mins = Math.floor(secs / 60);
        if (mins > 0) return `${mins}m`;
        return `${secs}s`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return dateStr.replace(/^\d{4}-/, '').slice(0, 11);
            }
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
                   date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            return dateStr;
        }
    };

    const getNoteTitle = (pathOrId: string) => {
        if (!pathOrId) return 'General Study';
        const parts = pathOrId.split(/[/\\]/);
        const filename = parts[parts.length - 1];
        return filename.replace(/\.md$/, '').replace(/[_-]/g, ' ');
    };

    return (
        <div className="p-5 border-[0.5px] border-border bg-background/50 backdrop-blur-sm my-4 rounded-[12px] select-none shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        Academic History
                    </span>
                </div>
                <div className="flex border-[0.5px] border-border p-0.5 bg-muted/10">
                    <button 
                        onClick={() => setActiveTab('sessions')}
                        className={cn(
                            "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-colors",
                            activeTab === 'sessions' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Focus Logs
                    </button>
                    <button 
                        onClick={() => setActiveTab('practice')}
                        className={cn(
                            "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-colors",
                            activeTab === 'practice' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Quizzes
                    </button>
                </div>
            </div>

            {/* Tab content */}
            <div className="min-h-[160px] max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {activeTab === 'sessions' ? (
                    sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[160px] text-center text-muted-foreground/40 font-mono">
                            <Clock size={20} className="mb-2 opacity-30" />
                            <span className="text-[10px] uppercase tracking-widest font-black">No focus logs found</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((session: any, idx: number) => (
                                <div key={idx} className="p-2.5 border-[0.5px] border-border bg-background flex justify-between items-center hover:border-foreground/20 transition-all select-none">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-7 border-[0.5px] flex items-center justify-center text-[9px] font-black uppercase",
                                            (session.mode === 'work' || session.mode === 'focus') ? "border-foreground bg-foreground text-background" : "border-border bg-muted/10"
                                        )}>
                                            {session.mode === 'work' ? 'W' : 'B'}
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-black uppercase text-foreground">
                                                {session.hub_id ? session.hub_id.replace(/[_-]/g, ' ') : 'General Unit'}
                                            </span>
                                            <span className="text-[8px] font-bold text-muted-foreground/60 block uppercase tracking-tight mt-0.5">
                                                {formatDate(session.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="rounded-[12px] border-border/70 text-[9px] font-mono px-1.5 py-0.5">
                                        {formatDuration(session.duration_seconds)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    practice.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[160px] text-center text-muted-foreground/40 font-mono">
                            <Sparkles size={20} className="mb-2 opacity-30" />
                            <span className="text-[10px] uppercase tracking-widest font-black">No quiz history found</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {practice.map((item: any, idx: number) => {
                                const noteTitle = getNoteTitle(item.note_id || item.note_path);
                                return (
                                    <div key={idx} className="p-2.5 border-[0.5px] border-border bg-background flex justify-between items-center hover:border-foreground/20 transition-all select-none">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "size-7 border-[0.5px] flex items-center justify-center font-bold text-[11px]",
                                                item.is_correct ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-600" : "border-rose-500/25 bg-rose-500/5 text-rose-600"
                                            )}>
                                                {item.is_correct ? '✓' : '✗'}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-black uppercase text-foreground truncate block">
                                                    {noteTitle}
                                                </span>
                                                <span className="text-[8px] font-bold text-muted-foreground/60 block uppercase tracking-tight mt-0.5 truncate">
                                                    {item.question_type || 'Quiz'} • {formatDate(item.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                        {item.time_taken_seconds && (
                                            <Badge variant="outline" className="rounded-[12px] border-border/70 text-[9px] font-mono px-1.5 py-0.5 shrink-0">
                                                {formatDuration(item.time_taken_seconds)}
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
            
            {/* Summary metrics footer */}
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 border-t border-border/30 pt-2.5">
                <span>Total Work Sessions: {sessions.filter((s: any) => s.mode === 'work' || s.mode === 'focus').length}</span>
                <span>Accuracy: {practice.length > 0 ? Math.round((practice.filter((p: any) => p.is_correct).length / practice.length) * 100) : 0}%</span>
            </div>
        </div>
    );
};

// --- Form Card (Dynamic Fields) ---
export const FormCard = ({ payload, onSendMessage }: { payload: any; onSendMessage?: (text: string) => void }) => {
    const { record_type, id, title: initialTitle, properties = {} } = payload;
    const isEdit = !!id;
    
    const cleanWikilinks = (val: any): string => {
        if (!val) return '';
        return String(val).replace(/\[\[/g, '').replace(/\]\]/g, '').replace(/_/g, ' ');
    };

    const [title, setTitle] = useState(() => cleanWikilinks(initialTitle || id || ''));
    const [fields, setFields] = useState<Record<string, string>>(() => {
        const initialFields: Record<string, string> = {};
        Object.entries(properties).forEach(([key, val]) => {
            initialFields[key] = typeof val === 'object' 
                ? JSON.stringify(val) 
                : cleanWikilinks(val);
        });
        return initialFields;
    });

    const handleInputChange = (key: string, value: string) => {
        setFields(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Title is required.");
            return;
        }

        const serializedProps = JSON.stringify(fields);
        if (isEdit) {
            onSendMessage?.(`Update academic record: record_type="${record_type}", id="${id}", properties=${serializedProps}`);
        } else {
            onSendMessage?.(`Create academic record: record_type="${record_type}", title="${title}", properties=${serializedProps}`);
        }
    };

    // Helper to get default properties based on type merged with prefilled properties keys
    const getKeys = () => {
        let defaults: string[] = [];
        if (record_type === 'courses') defaults = ['Professor', 'Credits', 'Semester', 'Status', 'Grade'];
        else if (record_type === 'exams') defaults = ['course', 'date', 'weight', 'status', 'location'];
        else if (record_type === 'assignments') defaults = ['course', 'due_date', 'status', 'priority', 'weight'];
        
        const uniqueKeys = new Set([...defaults, ...Object.keys(properties)]);
        return Array.from(uniqueKeys);
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 border border-border bg-bento-card my-4 rounded-[12px] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <Database size={14} className="text-muted-foreground" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        {isEdit ? 'Edit' : 'Create'} {record_type.replace(/s$/, '')}
                    </span>
                </div>
                <Badge variant="outline" className="rounded-[12px] font-bold text-[8px] uppercase tracking-wider border-border bg-background text-muted-foreground">
                    Form
                </Badge>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Title</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        disabled={isEdit}
                        className="w-full h-8 px-2 bg-background border border-border text-[11px] font-bold uppercase outline-none rounded-[8px] focus:border-foreground/40 disabled:opacity-50 text-foreground"
                        placeholder="Enter title..."
                    />
                </div>

                {getKeys().map((key) => (
                    <div key={key} className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{key.replace(/_/g, ' ')}</label>
                        <input 
                            type="text" 
                            value={fields[key] || ''} 
                            onChange={e => handleInputChange(key, e.target.value)} 
                            className="w-full h-8 px-2 bg-background border border-border text-[11px] font-bold outline-none rounded-[8px] focus:border-foreground/40 text-foreground"
                            placeholder={`Enter ${key}...`}
                        />
                    </div>
                ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
                <Button 
                    type="submit" 
                    className="rounded-[12px] bg-foreground text-background hover:bg-foreground/90 text-[10px] font-black uppercase tracking-widest h-9 px-4"
                >
                    Save Changes
                </Button>
            </div>
        </form>
    );
};

// --- Confirm Action Block ---
export const ConfirmActionBlock = ({ payload, onSendMessage }: { payload: any; onSendMessage?: (text: string) => void }) => {
    const { action_signature, message, record_type, id } = payload;

    const handleConfirm = () => {
        if (action_signature) {
            onSendMessage?.(action_signature);
        } else if (record_type && id) {
            onSendMessage?.(`Delete academic record: record_type="${record_type}", id="${id}"`);
        }
    };

    const handleCancel = () => {
        onSendMessage?.("Cancel");
    };

    return (
        <div className="p-5 border border-border bg-bento-card my-4 rounded-[12px] select-none shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-destructive">
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">Danger Zone</span>
            </div>
            <p className="text-[11px] font-bold text-foreground/80 leading-relaxed uppercase tracking-wider">
                {message || 'Are you absolutely sure you want to perform this action?'}
            </p>
            <div className="flex gap-2 justify-end pt-2">
                <Button 
                    variant="outline" 
                    className="rounded-[12px] border-border bg-background hover:bg-bento-card text-foreground text-[9px] font-black uppercase tracking-widest h-9"
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
                <Button 
                    className="rounded-[12px] bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[9px] font-black uppercase tracking-widest h-9"
                    onClick={handleConfirm}
                >
                    Confirm Action
                </Button>
            </div>
        </div>
    );
};


// --- Summary Card (Hub / Atomic Note) ---
export const SummaryCard = ({ payload }: { payload: any }) => {
    const { title, is_hub, overview, key_takeaways = [], key_terms = [], weak_spots = [] } = payload;
    
    return (
        <div className="p-5 border border-border bg-bento-card my-4 rounded-[12px] shadow-sm space-y-5 select-none text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    {is_hub ? <Layers size={14} className="text-primary" /> : <FileText size={14} className="text-primary" />}
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                        {is_hub ? 'Hub Summary' : 'Atomic Note Summary'}
                    </span>
                </div>
                <Badge variant="outline" className="rounded-[12px] font-bold text-[8px] uppercase tracking-wider border-border bg-background text-muted-foreground px-2 py-0.5">
                    {is_hub ? 'HUB' : 'NOTE'}
                </Badge>
            </div>

            {/* Title & Overview */}
            <div className="space-y-2">
                <h3 className="text-[13px] font-black uppercase tracking-wide leading-tight">{title}</h3>
                <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/80">{overview}</p>
            </div>

            {/* Key Takeaways */}
            {key_takeaways.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Core Takeaways</h4>
                    <ul className="space-y-1.5 pl-1">
                        {key_takeaways.map((item: string, i: number) => (
                            <li key={i} className="text-[11px] font-semibold text-foreground/90 flex items-start gap-2 leading-relaxed">
                                <span className="text-primary mt-1 text-[8px]">▪</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Key Terms Glossary */}
            {key_terms.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Key Glossary</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {key_terms.map((item: any, i: number) => (
                            <div key={i} className="p-2.5 border border-border bg-background rounded-[8px]">
                                <span className="text-[10px] font-black uppercase tracking-wider block text-primary">{item.term}</span>
                                <span className="text-[10px] font-medium text-muted-foreground/80 mt-1 block leading-relaxed">{item.definition}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weak spots / Review Targets */}
            {weak_spots.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-destructive/60">Review Targets (Watch Out)</h4>
                    <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-[8px] space-y-1.5">
                        {weak_spots.map((item: string, i: number) => (
                            <div key={i} className="text-[10px] font-bold text-destructive/80 leading-relaxed flex items-start gap-2">
                                <span className="mt-0.5">⚠️</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Practice Configuration Card ---
export const PracticeConfigCard = ({ payload }: { payload: any }) => {
    const { hubId, difficulty: initialDiff = "Mixed", gradingStrictness: initialGrading = "Lenient", distractorPlausibility: initialPlaus = "High", injectTrickAnswers: initialTrick = false, prioritizeWeaknesses: initialWeak = false, globalTimeLimitMinutes: initialTime = null, questionDistribution = {} } = payload;
    const navigate = useNavigate();

    const [difficulty, setDifficulty] = useState(initialDiff);
    const [gradingStrictness, setGradingStrictness] = useState(initialGrading);
    const [distractorPlausibility, setDistractorPlausibility] = useState(initialPlaus);
    const [injectTrickAnswers, setInjectTrickAnswers] = useState(initialTrick);
    const [prioritizeWeaknesses, setPrioritizeWeaknesses] = useState(initialWeak);
    const [globalTimeLimit, setGlobalTimeLimit] = useState<string>(initialTime ? String(initialTime) : '');
    const [dist, setDist] = useState<Record<string, number>>(() => {
        const initialDist: Record<string, number> = {
            mcq: 0, true_false: 0, writing: 0, fill_in: 0, matching: 0, order: 0, debug: 0, synthesis: 0, trace: 0, calculation: 0, data_analysis: 0, scenario: 0, code: 0
        };
        Object.entries(questionDistribution).forEach(([k, v]) => {
            if (k in initialDist) {
                initialDist[k] = Number(v);
            }
        });
        return initialDist;
    });

    const handleIncrement = (type: string) => {
        setDist(prev => ({ ...prev, [type]: Math.min(15, (prev[type] || 0) + 1) }));
    };

    const handleDecrement = (type: string) => {
        setDist(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
    };

    const handleStart = () => {
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        if (total <= 0) {
            toast.error("Please add at least one question type.");
            return;
        }

        const config = {
            hubId,
            difficulty,
            gradingStrictness,
            distractorPlausibility,
            injectTrickAnswers,
            prioritizeWeaknesses,
            globalTimeLimitMinutes: globalTimeLimit ? Number(globalTimeLimit) : null,
            questionDistribution: dist
        };

        localStorage.setItem('ater-pending-practice-config', JSON.stringify(config));
        navigate(`/practice?startPending=true&hubId=${encodeURIComponent(hubId)}`);
        toast.info("Configuring practice session...");
    };

    const qTypes = [
        { key: 'mcq', label: 'Multiple Choice' },
        { key: 'true_false', label: 'True / False' },
        { key: 'writing', label: 'Detailed Essay' },
        { key: 'fill_in', label: 'Fill in Blanks' },
        { key: 'matching', label: 'Matching Pairs' },
        { key: 'order', label: 'Step Ordering' },
        { key: 'calculation', label: 'Calculation' },
        { key: 'code', label: 'Code Snippet' },
        { key: 'debug', label: 'Find Bug' }
    ];

    return (
        <div className="p-5 border border-border bg-bento-card my-4 rounded-[12px] shadow-sm space-y-4 select-none text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Practice Setup</span>
                </div>
                <Badge variant="outline" className="rounded-[12px] font-bold text-[8px] uppercase tracking-wider border-border bg-background text-muted-foreground px-2">
                    {hubId.replace(/_/g, ' ')}
                </Badge>
            </div>

            {/* Question Type Distribution */}
            <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Question Types</h4>
                <div className="grid grid-cols-2 gap-2">
                    {qTypes.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between p-2 border border-border bg-background rounded-[8px]">
                            <span className="text-[10px] font-black uppercase tracking-wider leading-none">{label}</span>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => handleDecrement(key)}
                                    className="size-5 border border-border bg-bento-card hover:bg-bento-item active:scale-95 flex items-center justify-center text-[10px] font-black rounded-[4px] text-muted-foreground"
                                >
                                    -
                                </button>
                                <span className="text-[10px] font-mono font-bold w-4 text-center">{dist[key] || 0}</span>
                                <button 
                                    onClick={() => handleIncrement(key)}
                                    className="size-5 border border-border bg-bento-card hover:bg-bento-item active:scale-95 flex items-center justify-center text-[10px] font-black rounded-[4px] text-muted-foreground"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* General Configurations */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-1">Difficulty</label>
                    <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full text-[10px] font-bold uppercase tracking-wider bg-background border border-border p-2 rounded-[8px] text-foreground focus:outline-none"
                    >
                        <option value="Mixed">Mixed</option>
                        <option value="Easy">Easy (L1)</option>
                        <option value="Medium">Medium (L2)</option>
                        <option value="Hard">Hard (L3)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-1">Grading</label>
                    <select 
                        value={gradingStrictness} 
                        onChange={(e) => setGradingStrictness(e.target.value)}
                        className="w-full text-[10px] font-bold uppercase tracking-wider bg-background border border-border p-2 rounded-[8px] text-foreground focus:outline-none"
                    >
                        <option value="Lenient">Lenient</option>
                        <option value="Strict">Strict</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 border border-border bg-background rounded-[8px]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Trick Answers</span>
                    <input 
                        type="checkbox" 
                        checked={injectTrickAnswers} 
                        onChange={(e) => setInjectTrickAnswers(e.target.checked)}
                        className="accent-primary size-3 rounded"
                    />
                </div>
                <div className="flex items-center justify-between p-2 border border-border bg-background rounded-[8px]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Prioritize Weak</span>
                    <input 
                        type="checkbox" 
                        checked={prioritizeWeaknesses} 
                        onChange={(e) => setPrioritizeWeaknesses(e.target.checked)}
                        className="accent-primary size-3 rounded"
                    />
                </div>
            </div>

            <button 
                onClick={handleStart}
                className="w-full py-2.5 rounded-[12px] bg-foreground text-background hover:bg-foreground/90 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
                <Play size={12} fill="currentColor" />
                <span>Start Practice Session</span>
            </button>
        </div>
    );
};

// --- Interactive Sandbox Block ---
export const InteractiveSandboxBlock = ({ payload }: { payload: any }) => {
    const { 
        title = 'Interactive Sandbox', 
        type = 'math-plotter', 
        equation = 'sine',
        sliders = [],
        headers = [],
        rows = [],
        nodes = [],
        links = []
    } = payload;

    // 1. Math Plotter State
    const [sliderVals, setSliderVals] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        (sliders || []).forEach((s: any) => {
            initial[s.name] = s.default !== undefined ? s.default : (s.min + s.max) / 2;
        });
        return initial;
    });

    const handleSliderChange = (name: string, val: number) => {
        setSliderVals(prev => ({ ...prev, [name]: val }));
    };

    // 2. Table Explorer State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // 3. Node Graph State
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [propagationStep, setPropagationStep] = useState<number>(-1);
    const [isPropagating, setIsPropagating] = useState(false);

    // Dynamic wave / math calculation
    const pointsPath = React.useMemo(() => {
        if (type !== 'math-plotter') return '';
        const width = 400;
        const height = 200;
        const pts: string[] = [];

        // Parameters
        const amp = sliderVals['amplitude'] !== undefined ? sliderVals['amplitude'] : 50;
        const freq = sliderVals['frequency'] !== undefined ? sliderVals['frequency'] : 2;
        const phase = sliderVals['phase'] !== undefined ? sliderVals['phase'] : 0;
        const decay = sliderVals['decay'] !== undefined ? sliderVals['decay'] : 0;

        for (let x = 0; x <= width; x += 2) {
            let y = height / 2;
            const normX = x / width; // 0 to 1

            if (equation === 'sine') {
                y = height / 2 - amp * Math.sin(freq * normX * Math.PI * 2 + phase);
            } else if (equation === 'logistic') {
                const L = amp * 2;
                const k = freq * 5;
                const x0 = 0.5 + phase / 10;
                y = height - (L / (1 + Math.exp(-k * (normX - x0))));
            } else if (equation === 'decay') {
                const lam = decay * 4;
                y = height / 2 - amp * Math.exp(-lam * normX) * Math.cos(freq * normX * Math.PI * 2 + phase);
            } else if (equation === 'polynomial') {
                const a = decay * 200 - 100;
                const b = freq * 100 - 50;
                const c = amp;
                const devX = normX - 0.5;
                y = height / 2 - (a * devX * devX + b * devX + c);
            }

            if (x === 0) pts.push(`M ${x} ${y}`);
            else pts.push(`L ${x} ${y}`);
        }
        return pts.join(' ');
    }, [type, equation, sliderVals]);

    // Sorting and filtering table rows
    const filteredRows = React.useMemo(() => {
        if (type !== 'table-explorer') return [];
        let result = [...(rows || [])];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(row => 
                Object.values(row).some(val => String(val).toLowerCase().includes(q))
            );
        }

        if (sortKey) {
            result.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortAsc ? valA - valB : valB - valA;
                }
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }

        return result;
    }, [type, rows, searchQuery, sortKey, sortAsc]);

    // Trigger Node Graph flow propagation simulation
    const runPropagation = () => {
        if (isPropagating || !activeNode) return;
        setIsPropagating(true);
        setPropagationStep(0);

        let current = 0;
        const interval = setInterval(() => {
            current += 1;
            if (current > 3) {
                clearInterval(interval);
                setIsPropagating(false);
                setPropagationStep(-1);
            } else {
                setPropagationStep(current);
            }
        }, 600);
    };

    return (
        <div className="p-5 border border-border bg-bento-panel my-4 rounded-[12px] shadow-sm select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
                <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-muted-foreground" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        {title}
                    </span>
                </div>
                <Badge variant="outline" className="rounded-[12px] font-bold text-[8px] uppercase tracking-wider border-border bg-muted/20 text-muted-foreground">
                    Interactive
                </Badge>
            </div>

            {/* Render math plotter */}
            {type === 'math-plotter' && (
                <div className="space-y-4">
                    {/* SVG Canvas */}
                    <div className="relative h-52 bg-background border border-border/60 rounded-[8px] overflow-hidden flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 400 200">
                            {/* Grid Lines */}
                            <defs>
                                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {/* Coordinate Axis */}
                            <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                            <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />

                            {/* Math Curve */}
                            <path 
                                d={pointsPath} 
                                fill="none" 
                                stroke="#f59e0b" 
                                strokeWidth="2.5" 
                                className="transition-all duration-75 ease-out filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            />
                        </svg>

                        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground/50 uppercase">
                            f(x): {equation}
                        </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(sliders || []).map((s: any) => {
                            const val = sliderVals[s.name] !== undefined ? sliderVals[s.name] : s.default;
                            return (
                                <div key={s.name} className="space-y-1.5 p-3 border border-border/50 bg-background/30 rounded-[8px]">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        <span>{s.label}</span>
                                        <span className="font-mono text-foreground font-bold">{val.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={s.min} 
                                        max={s.max} 
                                        step={s.step} 
                                        value={val}
                                        onChange={(e) => handleSliderChange(s.name, parseFloat(e.target.value))}
                                        className="w-full accent-primary bg-muted/20 h-1 rounded-lg cursor-pointer"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Render table explorer */}
            {type === 'table-explorer' && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                            <input 
                                type="text"
                                placeholder="Search table..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background border border-border/60 rounded-[8px] py-1.5 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-border/85"
                            />
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="border border-border/60 rounded-[8px] overflow-hidden bg-background">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/10 border-b border-border/60">
                                        {(headers || []).map((h: string) => (
                                            <th 
                                                key={h}
                                                onClick={() => {
                                                    if (sortKey === h) setSortAsc(!sortAsc);
                                                    else { setSortKey(h); setSortAsc(true); }
                                                }}
                                                className="p-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground/80 cursor-pointer hover:text-foreground select-none"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {h.replace(/_/g, ' ')}
                                                    {sortKey === h && (sortAsc ? '↑' : '↓')}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-3 text-[9px] font-black uppercase text-muted-foreground/85 w-12" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-[11px]">
                                    {filteredRows.map((row: any, i: number) => {
                                        const isOpen = expandedRow === i;
                                        return (
                                            <React.Fragment key={i}>
                                                <tr 
                                                    onClick={() => setExpandedRow(isOpen ? null : i)}
                                                    className={cn(
                                                        "hover:bg-muted/5 cursor-pointer transition-colors",
                                                        isOpen ? "bg-muted/10" : ""
                                                    )}
                                                >
                                                    {(headers || []).map((h: string) => (
                                                        <td key={h} className="p-3 font-semibold text-foreground/80">
                                                            {typeof row[h] === 'boolean' 
                                                                ? (row[h] ? 'Yes' : 'No') 
                                                                : String(row[h] || '')}
                                                        </td>
                                                    ))}
                                                    <td className="p-3 text-right">
                                                        <span className="text-[10px] text-muted-foreground/40 font-black">
                                                            {isOpen ? 'Close' : 'Inspect'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {isOpen && (
                                                    <tr>
                                                        <td colSpan={(headers || []).length + 1} className="p-4 bg-muted/5 border-t border-b border-border/30">
                                                            <div className="space-y-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                <div className="text-[9px] font-black text-foreground mb-1">Row Details</div>
                                                                {Object.entries(row)
                                                                    .filter(([key]) => !(headers || []).includes(key))
                                                                    .map(([key, val]) => (
                                                                        <div key={key} className="flex justify-between py-1 border-b border-border/10">
                                                                            <span className="text-[#a1a1aa]">{key.replace(/_/g, ' ')}</span>
                                                                            <span className="text-foreground font-bold font-mono">{String(val)}</span>
                                                                        </div>
                                                                    ))
                                                                }
                                                                {Object.entries(row).filter(([key]) => !(headers || []).includes(key)).length === 0 && (
                                                                    <div className="text-muted-foreground/50 py-1 lowercase">No additional metadata found.</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    {filteredRows.length === 0 && (
                                        <tr>
                                            <td colSpan={(headers || []).length + 1} className="p-8 text-center text-muted-foreground/40 font-bold uppercase tracking-widest text-[9px]">
                                                No results match search query
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Render node graph */}
            {type === 'node-graph' && (
                <div className="space-y-4">
                    {/* SVG Interactive Canvas */}
                    <div className="relative h-60 bg-background border border-border/60 rounded-[8px] overflow-hidden flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 400 240">
                            {/* Lines / Edges */}
                            {(links || []).map((link: any, idx: number) => {
                                const sourceNode = (nodes || []).find((n: any) => n.id === link.source);
                                const targetNode = (nodes || []).find((n: any) => n.id === link.target);
                                if (!sourceNode || !targetNode) return null;

                                const isActiveLink = activeNode === link.source || activeNode === link.target;
                                const isFlowing = isPropagating && activeNode === link.source;

                                return (
                                    <g key={idx}>
                                        <line 
                                            x1={sourceNode.x} 
                                            y1={sourceNode.y} 
                                            x2={targetNode.x} 
                                            y2={targetNode.y} 
                                            stroke={isActiveLink ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'} 
                                            strokeWidth={isActiveLink ? 1.5 : 1}
                                            className="transition-all duration-300"
                                        />
                                        {isFlowing && (
                                            <circle r="3" fill="#f59e0b" className="animate-pulse">
                                                <animateMotion 
                                                    dur="1s" 
                                                    repeatCount="indefinite" 
                                                    path={`M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`}
                                                />
                                            </circle>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Node Circles */}
                            {(nodes || []).map((node: any) => {
                                const isActive = activeNode === node.id;
                                return (
                                    <g 
                                        key={node.id} 
                                        transform={`translate(${node.x}, ${node.y})`}
                                        onClick={() => setActiveNode(isActive ? null : node.id)}
                                        className="cursor-pointer group"
                                    >
                                        <circle 
                                            r={isActive ? 12 : 8} 
                                            fill={isActive ? '#f59e0b' : '#1f1f22'} 
                                            stroke={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'}
                                            strokeWidth={isActive ? 2 : 1}
                                            className="transition-all duration-300 filter group-hover:brightness-125"
                                        />
                                        <text 
                                            y="22" 
                                            textAnchor="middle" 
                                            fill={isActive ? '#ffffff' : '#a1a1aa'} 
                                            className="text-[9px] font-bold font-sans uppercase select-none pointer-events-none tracking-wider"
                                        >
                                            {node.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Interactive HUD overlay inside graph */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 text-[9px] font-mono text-muted-foreground/60 uppercase">
                            <div>Selected Node: <span className="text-foreground font-bold">{activeNode || 'None'}</span></div>
                            {activeNode && (
                                <button 
                                    onClick={runPropagation}
                                    disabled={isPropagating}
                                    className="px-2 py-0.5 mt-1 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-white rounded-[4px] uppercase text-[8px] font-black tracking-widest transition-all w-24 text-center disabled:opacity-40"
                                >
                                    {isPropagating ? 'Flowing...' : 'Test Flow'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


