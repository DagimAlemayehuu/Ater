"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Terminal, 
  Search, 
  RefreshCw, 
  Trash2, 
  Play, 
  Pause, 
  AlertTriangle, 
  Info, 
  ShieldAlert 
} from "lucide-react";

type LogLevel = "info" | "warn" | "error" | "critical";

type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  tokens?: number;
};

const INITIAL_MOCK_LOGS: LogEntry[] = [
  { id: "log_1", timestamp: "2026-05-29T21:58:32Z", level: "info", component: "AUTH_GATE", message: "User session authenticated successfully for uid=usr_1", tokens: 0 },
  { id: "log_2", timestamp: "2026-05-29T21:55:10Z", level: "warn", component: "SECURITY_SANDBOX", message: "Tauri sidecar execution blocked outside sandbox boundary. Degrading gracefully.", tokens: 0 },
  { id: "log_3", timestamp: "2026-05-29T21:50:18Z", level: "error", component: "DATABASE_VECTOR", message: "Failed to compile semantic index for vault path: /Notes/Optimizations.md. Retrying index build.", tokens: 120 },
  { id: "log_4", timestamp: "2026-05-29T21:44:05Z", level: "info", component: "ORACLE_AI", message: "Gemini-2.0-flash executed curriculum-compile task successfully.", tokens: 2310 },
  { id: "log_5", timestamp: "2026-05-29T21:38:12Z", level: "critical", component: "DRM_LICENSE", message: "Hardware identification conflict detected during sovereign node verification.", tokens: 0 },
  { id: "log_6", timestamp: "2026-05-29T21:30:45Z", level: "info", component: "SYNC_ENGINE", message: "Local note modifications synchronized with cloud persistence ledger.", tokens: 15 },
  { id: "log_7", timestamp: "2026-05-29T21:25:01Z", level: "info", component: "WAITLIST_SVC", message: "New Waitlist application received from feynman.richard@caltech.edu", tokens: 0 },
  { id: "log_8", timestamp: "2026-05-29T21:18:55Z", level: "warn", component: "CREDIT_LEDGER", message: "User uid=usr_5 credit reserves dropping below threshold. Warning dispatched.", tokens: 0 },
  { id: "log_9", timestamp: "2026-05-29T21:10:14Z", level: "info", component: "ORACLE_AI", message: "Claude-3-5-sonnet-latest processed user query on Mathematical Induction.", tokens: 1850 },
  { id: "log_10", timestamp: "2026-05-29T21:05:00Z", level: "info", component: "SYSTEM_BOOT", message: "Ater Sovereign Node Admin console client initialized on port 3000.", tokens: 0 }
];

const COMPONENT_OPTIONS = ["ALL", "SYSTEM_BOOT", "AUTH_GATE", "ORACLE_AI", "DATABASE_VECTOR", "SECURITY_SANDBOX", "SYNC_ENGINE", "WAITLIST_SVC", "DRM_LICENSE"];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | LogLevel>("all");
  const [componentFilter, setComponentFilter] = useState("ALL");
  const [isStreaming, setIsStreaming] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLogs(INITIAL_MOCK_LOGS);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Simulate realtime log streaming
  useEffect(() => {
    if (!isStreaming || loading) return;

    const interval = setInterval(() => {
      const components = ["AUTH_GATE", "ORACLE_AI", "DATABASE_VECTOR", "SYNC_ENGINE", "CREDIT_LEDGER"];
      const levels: LogLevel[] = ["info", "info", "warn", "info", "error"];
      const messages = [
        "Dynamic curriculum vector embeddings updated.",
        "Auth tokens refreshed successfully.",
        "FSRS recall decay stability factor recalculated.",
        "Headless browser Puppeteer capture actuated.",
        "GitHub Actions workflow dispatch trigged: Compile bundle."
      ];
      
      const idx = Math.floor(Math.random() * messages.length);
      const newLog: LogEntry = {
        id: `stream_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: levels[idx],
        component: components[idx],
        message: messages[idx],
        tokens: idx % 2 === 0 ? Math.floor(Math.random() * 2000) : undefined
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, 4500);

    return () => clearInterval(interval);
  }, [isStreaming, loading]);

  function handleClear() {
    setLogs([]);
  }

  function handleRefresh() {
    setLoading(true);
    setTimeout(() => {
      setLogs(INITIAL_MOCK_LOGS);
      setLoading(false);
    }, 500);
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.component.toLowerCase().includes(search.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesComponent = componentFilter === "ALL" || log.component === componentFilter;

    return matchesSearch && matchesLevel && matchesComponent;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      
      <header className="bg-background border-b border-border py-6 sm:py-8 px-4 sm:px-10 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase flex items-center gap-3">
              <Terminal className="size-8 text-primary" />
              System Logs
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className={cn("size-2 rounded-full", isStreaming ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
              {isStreaming ? "Streaming active" : "Streaming paused"} • Showing {filteredLogs.length} events
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter Events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border border-border pl-10 pr-5 py-2 text-[11px] font-bold uppercase tracking-widest focus:border-foreground outline-none w-full lg:w-48 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="bg-card border border-border px-3 py-2 text-[11px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer focus:border-foreground"
            >
              <option value="all">ALL LEVELS</option>
              <option value="info">INFO</option>
              <option value="warn">WARN</option>
              <option value="error">ERROR</option>
              <option value="critical">CRITICAL</option>
            </select>

            {/* Component Filter */}
            <select
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              className="bg-card border border-border px-3 py-2 text-[11px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer focus:border-foreground max-w-[150px] truncate"
            >
              {COMPONENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={cn(
                  "p-2 border border-border bg-card transition-colors",
                  isStreaming ? "hover:text-amber-500" : "hover:text-emerald-500"
                )}
                title={isStreaming ? "Pause Stream" : "Resume Stream"}
              >
                {isStreaming ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>

              <button
                onClick={handleClear}
                className="p-2 border border-border bg-card hover:text-destructive transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="size-4" />
              </button>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 border border-border bg-card hover:bg-accent disabled:opacity-50 transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-none overflow-hidden flex flex-col h-[550px]">
            {/* Header column names */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-muted/20 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground select-none shrink-0">
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2 text-center">Severity</div>
              <div className="col-span-3">Component</div>
              <div className="col-span-5">Message</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 font-mono text-[11px] leading-relaxed custom-scrollbar bg-black/10">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="col-span-2"><Skeleton className="h-3 w-20" /></div>
                    <div className="col-span-2"><Skeleton className="h-5 w-16 mx-auto" /></div>
                    <div className="col-span-3"><Skeleton className="h-3 w-28" /></div>
                    <div className="col-span-5"><Skeleton className="h-3 w-full" /></div>
                  </div>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "grid grid-cols-12 gap-4 px-6 py-3.5 items-start hover:bg-accent/10 transition-colors group",
                      log.level === "critical" && "bg-destructive/5 text-destructive-foreground/90",
                      log.level === "error" && "bg-red-500/5",
                      log.level === "warn" && "bg-amber-500/5"
                    )}
                  >
                    {/* Timestamp */}
                    <div className="col-span-2 text-muted-foreground py-0.5 truncate">
                      {mounted ? new Date(log.timestamp).toLocaleTimeString() : "—"}
                    </div>

                    {/* Level */}
                    <div className="col-span-2 flex justify-center">
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1 leading-none select-none",
                        log.level === "info" && "bg-primary/10 border-primary/20 text-primary",
                        log.level === "warn" && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                        log.level === "error" && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                        log.level === "critical" && "bg-red-500 border-red-600 text-white"
                      )}>
                        {log.level === "critical" && <ShieldAlert className="size-2.5 shrink-0" />}
                        {log.level === "error" && <AlertTriangle className="size-2.5 shrink-0" />}
                        {log.level === "warn" && <AlertTriangle className="size-2.5 shrink-0" />}
                        {log.level === "info" && <Info className="size-2.5 shrink-0" />}
                        {log.level}
                      </span>
                    </div>

                    {/* Component */}
                    <div className="col-span-3 font-bold uppercase tracking-wider text-foreground py-0.5 truncate">
                      {log.component}
                    </div>

                    {/* Message */}
                    <div className="col-span-5 text-muted-foreground group-hover:text-foreground transition-colors py-0.5 select-text break-words">
                      {log.message}
                      {log.tokens !== undefined && log.tokens > 0 && (
                        <span className="ml-2 px-1.5 py-0.2 bg-muted/40 border border-border text-[8px] text-muted-foreground uppercase font-black tracking-widest inline-block leading-none">
                          {log.tokens} tk
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center select-none">
                  <Terminal className="size-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    No matching log entries found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
