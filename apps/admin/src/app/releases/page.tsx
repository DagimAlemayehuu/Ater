"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Cpu,
  RefreshCw,
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  ArrowUpRight
} from "lucide-react";

type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_branch: string;
  head_sha: string;
  created_at: string;
  event: string;
  display_title: string;
};

type ReleaseAsset = {
  id: number;
  name: string;
  browser_download_url: string;
  download_count: number;
  size: number;
};

type Release = {
  id: number;
  name: string;
  tag_name: string;
  draft: boolean;
  published_at: string | null;
  created_at: string;
  body: string | null;
  html_url: string;
  assets: ReleaseAsset[];
};

export default function ReleasesPage() {
  const [pat, setPat] = useState<string | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger form state
  const [dispatchRef, setDispatchRef] = useState("");
  const [triggeringBuild, setTriggeringBuild] = useState(false);
  
  // Publishing state
  const [publishingId, setPublishingId] = useState<number | null>(null);

  // Load PAT and initial telemetry
  async function loadConfigAndTelemetry() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("config")
        .eq("id", "global_config")
        .single();

      const githubToken = data?.config?.github_pat || null;
      setPat(githubToken);

      await fetchAllTelemetry(githubToken);
    } catch (e: unknown) {
      console.error("[Releases] Failed to load dashboard config:", e);
      setErrorMsg("Failed to read settings from Supabase.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllTelemetry(tokenString: string | null) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (tokenString && tokenString.trim()) {
      headers["Authorization"] = `Bearer ${tokenString.trim()}`;
    }

    try {
      // 1. Fetch live package workflows (last 5 runs)
      const runsRes = await fetch(
        "https://api.github.com/repos/DagimAlemayehuu/Ater/actions/runs?per_page=5",
        { headers }
      );
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(runsData.workflow_runs || []);
      } else {
        console.warn("[Releases] Failed to fetch workflows:", runsRes.statusText);
      }

      // 2. Fetch Ater Releases
      const relsRes = await fetch(
        "https://api.github.com/repos/DagimAlemayehuu/Ater_Releases/releases?per_page=10",
        { headers }
      );
      if (relsRes.ok) {
        const relsData = await relsRes.json();
        setReleases(relsData || []);
      } else {
        console.warn("[Releases] Failed to fetch releases:", relsRes.statusText);
      }
    } catch (e) {
      console.error("[Releases] Failed to fetch GitHub metrics:", e);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    await fetchAllTelemetry(pat);
    setRefreshing(false);
    setSuccessMsg("Telemetry synchronized.");
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // Trigger release compiler pipeline via dispatch
  async function triggerWorkflowBuild() {
    if (!pat || !pat.trim()) {
      setErrorMsg("Write Actions require a Personal Access Token. Save one in Settings.");
      return;
    }
    if (!dispatchRef.trim()) {
      setErrorMsg("Branch, tag or commit SHA is required.");
      return;
    }

    setTriggeringBuild(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // release.yml workflow ID or file name
      const res = await fetch(
        "https://api.github.com/repos/DagimAlemayehuu/Ater/actions/workflows/release.yml/dispatches",
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${pat.trim()}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: dispatchRef.trim(),
          }),
        }
      );

      if (res.ok) {
        setSuccessMsg(`Workflow successfully actuated for: ${dispatchRef}`);
        setDispatchRef("");
        // Wait a second for GitHub to register and re-fetch runs
        setTimeout(async () => {
          await fetchAllTelemetry(pat);
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network transaction aborted";
      setErrorMsg(`Build actuate failed: ${msg}`);
    } finally {
      setTriggeringBuild(false);
    }
  }

  // Promote a draft release to public
  async function publishDraft(releaseId: number, tag: string) {
    if (!pat || !pat.trim()) {
      setErrorMsg("Write Actions require a Personal Access Token. Save one in Settings.");
      return;
    }

    setPublishingId(releaseId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(
        `https://api.github.com/repos/DagimAlemayehuu/Ater_Releases/releases/${releaseId}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${pat.trim()}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draft: false,
          }),
        }
      );

      if (res.ok) {
        setSuccessMsg(`Release version ${tag} published to Ater_Releases!`);
        await fetchAllTelemetry(pat);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Publish transaction failed";
      setErrorMsg(`Publish failed: ${msg}`);
    } finally {
      setPublishingId(null);
    }
  }

  useEffect(() => {
    loadConfigAndTelemetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      {/* Toast notifications */}
      {(successMsg || errorMsg) && (
        <div
          className={cn(
            "fixed bottom-6 right-6 px-4 py-3 border border-border/40 rounded-[8px] text-[9px] uppercase tracking-widest z-50 shadow-2xl flex items-center gap-2 bg-bento-card",
            successMsg ? "text-foreground" : "text-destructive border-destructive/20 bg-destructive/5"
          )}
        >
          {successMsg || errorMsg}
        </div>
      )}

      {/* Header */}
      <header className="bg-background border-b border-border py-6 sm:py-8 px-4 sm:px-10 shrink-0 select-none">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase flex items-center gap-3">
              <Package className="size-8" />
              Releases
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              GitHub Action compilations and deployment assets
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!pat && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[8px] font-black uppercase tracking-widest">
                <AlertTriangle className="size-3" /> Anonymous Fallback
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-[8px] text-[9px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", refreshing ? "animate-spin" : "")} />
              {refreshing ? "Syncing..." : "Sync Pipeline"}
            </button>
          </div>
        </div>
      </header>

      {/* Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar select-none">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Top row: Pipeline runs & Dispatcher */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Compiler Pipeline (Left) */}
            <div className="lg:col-span-7 bg-card border border-border rounded-[12px] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-border bg-accent/10 flex justify-between items-center select-none shrink-0">
                <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="size-3.5 text-foreground" />
                  Packaging Workflows
                </h3>
                <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Live Feed</span>
              </div>

              <div className="p-6 divide-y divide-border/40 overflow-y-auto max-h-[320px] custom-scrollbar bg-card">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-24" /></div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))
                ) : runs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-[9px] uppercase tracking-widest font-black">
                    No active workflows detected.
                  </div>
                ) : (
                  runs.map((run) => (
                    <div key={run.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[11px] text-foreground truncate max-w-[200px] select-text">
                            {run.display_title || "Build Release"}
                          </span>
                          <span className="flex items-center gap-1 text-[8.5px] font-mono text-muted-foreground uppercase bg-accent/30 px-1.5 py-0.5 rounded-[4px]">
                            <GitBranch className="size-2.5" />
                            {run.head_branch}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[8.5px] font-medium text-muted-foreground uppercase tracking-widest">
                          <span>{run.event}</span>
                          <span className="h-2 w-px bg-border/80" />
                          <span>{new Date(run.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 text-[8px] uppercase font-black tracking-widest border rounded-[4px] flex items-center gap-1.5",
                            run.status === "completed" && run.conclusion === "success"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : run.status === "completed" && run.conclusion === "failure"
                              ? "bg-destructive/10 border-destructive/20 text-destructive"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse"
                          )}
                        >
                          {run.status === "completed" && run.conclusion === "success" && (
                            <CheckCircle2 className="size-2.5" />
                          )}
                          {run.status === "completed" && run.conclusion === "failure" && (
                            <XCircle className="size-2.5" />
                          )}
                          {run.status !== "completed" && <div className="size-1.5 bg-amber-500 rounded-full animate-ping" />}
                          {run.status === "completed" ? run.conclusion : "building"}
                        </span>
                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground rounded-[6px] transition-colors"
                          title="View Actions Log"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manual Release Dispatcher (Right) */}
            <div className="lg:col-span-5 p-6 bg-card border border-border rounded-[12px] space-y-5 flex flex-col justify-between self-stretch">
              <div className="space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                  <Play className="size-3.5 text-muted-foreground" />
                  Actuate Release
                </h3>
                <p className="text-[9.5px] text-muted-foreground uppercase tracking-widest leading-normal">
                  Dispatches `release.yml` for target Tag footprint.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
                    Tag / Ref target
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. v33.5.0 or main..."
                    value={dispatchRef}
                    onChange={(e) => setDispatchRef(e.target.value)}
                    className="w-full bg-bento-bg border border-border/80 text-foreground text-[10px] px-3.5 py-2 focus:border-foreground outline-none rounded-[6px]"
                  />
                </div>
                <button
                  onClick={triggerWorkflowBuild}
                  disabled={triggeringBuild || loading || !dispatchRef.trim()}
                  className="w-full py-3.5 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 text-[9px] font-black uppercase tracking-widest transition-opacity rounded-[6px] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="size-3" />
                  {triggeringBuild ? "Dispatching..." : "Actuate Compiler Pipeline"}
                </button>
              </div>
            </div>
          </div>

          {/* Release Assets Grid (Full Width) */}
          <div className="bg-card border border-border rounded-[12px] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-accent/10 flex justify-between items-center select-none shrink-0">
              <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Release Catalog
              </h3>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">
                {!loading && releases.length > 0 ? `${releases.length} Build Profiles` : ""}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-5 border border-border/50 rounded-[8px] space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : releases.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-[9px] uppercase tracking-widest font-black">
                  No published releases found.
                </div>
              ) : (
                releases.map((rel) => (
                  <div
                    key={rel.id}
                    className="border border-border/60 hover:border-border p-5 rounded-[8px] space-y-4 bg-accent/5"
                  >
                    {/* Title Header */}
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-[14px] font-black tracking-tight text-foreground select-text">
                            {rel.name || `Ater ${rel.tag_name}`}
                          </h4>
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[8px] uppercase font-black tracking-widest border rounded-[4px]",
                              rel.draft
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse"
                                : "bg-primary/10 border-primary/20 text-primary"
                            )}
                          >
                            {rel.draft ? "draft" : "public"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            {rel.published_at
                              ? new Date(rel.published_at).toLocaleDateString()
                              : new Date(rel.created_at).toLocaleDateString()}
                          </span>
                          <span className="h-2.5 w-px bg-border/80" />
                          <span className="font-mono">{rel.tag_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rel.draft && (
                          <button
                            onClick={() => publishDraft(rel.id, rel.tag_name)}
                            disabled={publishingId === rel.id}
                            className="px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {publishingId === rel.id ? "Publishing..." : "Publish Draft"}
                          </button>
                        )}
                        <a
                          href={rel.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground rounded-[6px] transition-colors"
                          title="View on GitHub"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Release Notes */}
                    {rel.body && (
                      <div className="text-[10px] text-muted-foreground bg-card/60 p-3.5 border border-border/40 font-mono leading-relaxed select-text rounded-[6px] max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                        {rel.body}
                      </div>
                    )}

                    {/* Build Assets downloads */}
                    <div className="space-y-2">
                      <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Layers className="size-3" />
                        Compiled Artifacts
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {rel.assets.length === 0 ? (
                          <span className="text-[9px] text-muted-foreground font-bold uppercase py-1">
                            No assets uploaded yet (Compilation in progress).
                          </span>
                        ) : (
                          rel.assets.map((asset) => (
                            <div
                              key={asset.id}
                              className="flex justify-between items-center border border-border/50 bg-card p-3 rounded-[6px] hover:border-foreground/20 transition-all select-text"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-mono text-[9.5px] font-bold text-foreground truncate" title={asset.name}>
                                  {asset.name}
                                </div>
                                <div className="flex items-center gap-3.5 mt-1.5 text-[8.5px] font-bold text-muted-foreground uppercase tracking-widest">
                                  <span>{Math.round(asset.size / (1024 * 1024))} MB</span>
                                  <span className="h-2 w-px bg-border/80" />
                                  <span className="flex items-center gap-1">
                                    <Download className="size-2.5 text-muted-foreground" />
                                    {asset.download_count.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={asset.browser_download_url}
                                className="p-2 border border-border bg-accent/20 hover:bg-accent text-muted-foreground hover:text-foreground rounded-[6px] transition-colors shrink-0"
                                title="Download asset file"
                              >
                                <Download className="size-3" />
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
