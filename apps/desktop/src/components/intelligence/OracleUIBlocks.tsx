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
  Database
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
        <div className="p-6 border border-border bg-background my-4 rounded-none select-none shadow-sm group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "size-10 rounded-none border flex items-center justify-center transition-colors",
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
                <Badge variant="outline" className="rounded-none font-black text-[9px] uppercase tracking-widest px-2 py-1">
                    {currentHub?.replace(/_/g, ' ') || 'No Hub Selected'}
                </Badge>
            </div>

            <div className="space-y-6">
                <div className="text-5xl font-black text-foreground text-center tracking-tighter tabular-nums py-2">
                    {formatTime(timeLeft)}
                </div>
                
                <div className="space-y-2">
                    <Progress value={progress} className="h-1.5 rounded-none bg-muted/20" />
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                        <span>Started</span>
                        <span>{mode === 'focus' ? '25:00' : '05:00'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button 
                        variant="outline" 
                        className="rounded-none border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Pause size={12} className="mr-2" /> : <Play size={12} className="mr-2" />}
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button 
                        variant="outline" 
                        className="rounded-none border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                        onClick={() => {
                            setIsActive(false);
                            setTimeLeft(25 * 60);
                        }}
                    >
                        <Square size={12} className="mr-2" /> Reset
                    </Button>
                    <Button 
                        variant="outline" 
                        className="rounded-none border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
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

    const fileName = file_path.split('/').pop() || 'File';

    return (
        <div className="p-6 border border-border bg-background my-4 rounded-none shadow-sm">
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
                            className="w-full rounded-none border-foreground/20 hover:border-foreground/40 text-[10px] font-black uppercase tracking-widest mt-4"
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
                            <Badge variant="outline" className="rounded-none text-[9px] font-black uppercase">{plan?.notes?.length || 0} Total</Badge>
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
                            className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90 text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-foreground/5 mt-4"
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
                <Badge variant="outline" className="rounded-none text-[9px] font-black uppercase">
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
                           <Button variant="ghost" size="icon" className="size-8 rounded-none border border-border/50 hover:border-foreground/20">
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
                                "rounded-none text-[8px] font-black",
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
                            className="w-full h-8 rounded-none text-[9px] font-black uppercase tracking-widest"
                            onClick={() => onProcess?.(file.path)}
                        >
                            Process with Ater
                        </Button>
                        <Button variant="outline" className="w-full h-8 rounded-none text-[9px] font-black uppercase tracking-widest">
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
                                className="rounded-none text-[9px] font-black uppercase h-9 border-border hover:border-foreground/40"
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
        <div className="p-5 border-[0.5px] border-border bg-background/50 backdrop-blur-sm my-4 rounded-none select-none shadow-sm space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Settings size={14} className="text-muted-foreground animate-spin-slow" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                        App Preferences
                    </span>
                </div>
                <Badge variant="outline" className="rounded-none font-bold text-[8px] uppercase tracking-wider border-border bg-muted/20 text-muted-foreground">
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
                                className="h-6 px-2 bg-background border border-border text-[11px] font-bold outline-none rounded-none focus:border-foreground/40 w-32"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                autoFocus
                            />
                            <Button 
                                variant="outline" 
                                className="h-6 px-2 rounded-none text-[9px] font-black uppercase border-foreground bg-foreground text-background hover:bg-foreground/90"
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
        <div className="p-5 border-[0.5px] border-border bg-background/50 backdrop-blur-sm my-4 rounded-none select-none shadow-sm space-y-5">
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
                    className="rounded-none border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9"
                    onClick={handleToggleAutoIngest}
                >
                    {auto_process ? 'Disable Auto Ingest' : 'Enable Auto Ingest'}
                </Button>
                <Button 
                    variant="outline" 
                    className={cn(
                        "rounded-none border-border hover:border-foreground/40 text-[9px] font-black uppercase tracking-widest h-9",
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
        const parts = pathOrId.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.md$/, '').replace(/[_-]/g, ' ');
    };

    return (
        <div className="p-5 border-[0.5px] border-border bg-background/50 backdrop-blur-sm my-4 rounded-none select-none shadow-sm space-y-4">
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
                                    <Badge variant="outline" className="rounded-none border-border/70 text-[9px] font-mono px-1.5 py-0.5">
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
                                            <Badge variant="outline" className="rounded-none border-border/70 text-[9px] font-mono px-1.5 py-0.5 shrink-0">
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
