import re

with open('apps/desktop/src/routes/agents.tsx', 'r') as f:
    content = f.read()

# We need to replace the entire return block of OkaDashboard
start_idx = content.find('    return (\n        <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden p-12">')

# Replace the layout
new_return = """    return (
        <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden">
            <div className="flex items-center justify-between p-8 shrink-0 border-b border-border/10 bg-muted/5">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mb-2">
                        <span>Knowledge</span>
                        <span>/</span>
                        <span>Architect</span>
                    </div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-foreground">OKA Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-background border border-border/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>Auto-Ingest</span>
                        <button 
                            onClick={toggleAutoDeploy}
                            className={cn("relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none", config?.autoDeploy ? 'bg-foreground' : 'bg-muted-foreground/30')}
                        >
                            <span className={cn("pointer-events-none inline-block h-3 w-3 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0')} />
                        </button>
                    </div>
                    <button onClick={() => { fetchInbox(); fetchStatus(); }} className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-foreground/30 transition-all">
                        <RefreshCw size={12} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                <div className="max-w-3xl mx-auto py-12 px-6">
                    {/* AUTO INGESTION VIEW */}
                    {queueStatus?.status !== 'idle' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 mb-12">
                            <div className="p-8 rounded-2xl border border-border/10 bg-muted/5 space-y-8">
                                <div className="flex items-center justify-between border-b border-border/10 pb-6">
                                    <div className="flex items-center gap-3">
                                        <Activity size={24} className="text-primary animate-pulse" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Autonomous Execution</p>
                                            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{queueStatus.current_file || 'Initializing...'}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Progress</p>
                                        <p className="text-xl font-black tracking-tight text-foreground">{queueStatus.current_batch} / {queueStatus.total_batches}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>Completion</span>
                                        <span>{Math.round((queueStatus.current_batch / (queueStatus.total_batches || 1)) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/20">
                                        <div className="h-full bg-foreground transition-all duration-700 ease-in-out" style={{ width: `${(queueStatus.current_batch / (queueStatus.total_batches || 1)) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="p-4 bg-background rounded border border-border/10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">Last Action</p>
                                    <p className="text-[11px] font-bold text-muted-foreground">{queueStatus.last_action || 'Waking up agent...'}</p>
                                </div>

                                {queueStatus.plan_raw && (
                                    <div className="pt-6 border-t border-border/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4">Architectural Blueprint</h4>
                                        <PlanCardView planRaw={queueStatus.plan_raw} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INBOX VIEW (When idle and no file selected) */}
                    {queueStatus?.status === 'idle' && !selectedInboxFile && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <div className="text-center mb-12">
                                <Brain size={48} strokeWidth={1} className="mx-auto mb-6 text-muted-foreground/20" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-3">Knowledge Architect</h2>
                                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Select a file from your inbox to begin structural ingestion.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loadingInbox ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-24 rounded-xl bg-muted/5 border border-border/10 animate-pulse" />
                                    ))
                                ) : inboxFiles.length > 0 ? (
                                    inboxFiles.map(f => (
                                        <div 
                                            key={f.path} 
                                            onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); setIsCurriculumReady(false); setBatchFeed([]); }}
                                            className="p-6 rounded-xl border border-border/10 bg-muted/5 hover:bg-muted/10 hover:border-border/30 cursor-pointer transition-all group flex flex-col justify-between"
                                        >
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-tight text-foreground truncate">{f.name}</h3>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate mt-2">{f.path}</p>
                                            </div>
                                            <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={16} className="text-muted-foreground" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 border border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground/30">
                                        <Archive size={32} className="mb-4 opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Inbox is empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MANUAL FLOW (When file is selected) */}
                    {selectedInboxFile && queueStatus?.status === 'idle' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Selected File Header */}
                            <div className="p-6 rounded-2xl border border-border/10 bg-muted/5 mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedInboxFile(null)} className="p-2 bg-background border border-border/10 rounded-lg text-muted-foreground hover:text-foreground transition-all">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Target File</p>
                                        <h3 className="text-base font-black uppercase tracking-tight text-foreground truncate max-w-sm">{selectedInboxFile.name}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!isCurriculumReady && !processing && (
                                        <button onClick={() => processSelectedFile()} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-lg transition-all">
                                            <Zap size={12} /> Analyze Context
                                        </button>
                                    )}
                                    {isCurriculumReady && !activePlan && !processing && (
                                        <button onClick={startPlanning} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-foreground bg-muted/5 hover:bg-muted/10 rounded-lg transition-all">
                                            <ChevronRight size={12} /> Generate Plan
                                        </button>
                                    )}
                                    {isAwaitingConfirmation && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-foreground bg-muted/5 hover:bg-muted/10 rounded-lg transition-all disabled:opacity-50">
                                                <Zap size={12} /> Full Deploy
                                            </button>
                                            <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-lg transition-all disabled:opacity-50">
                                                <ShieldCheck size={12} /> Deploy Step 1
                                            </button>
                                        </div>
                                    )}
                                    {isAwaitingNextBatch && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-foreground bg-muted/5 hover:bg-muted/10 rounded-lg transition-all disabled:opacity-50">
                                                <Zap size={12} /> Finish All
                                            </button>
                                            <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-lg transition-all disabled:opacity-50">
                                                <ChevronRight size={12} /> Next Step
                                            </button>
                                        </div>
                                    )}
                                    {isCompleted && (
                                        <button onClick={resetOkaSession} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-lg transition-all">
                                            <RefreshCw size={12} /> Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Processing Indicator */}
                            {processing && !activePlan && !batchFeed.length && (
                                <div className="py-24 flex flex-col items-center justify-center text-center animate-pulse">
                                    <RefreshCw size={32} className="animate-spin text-foreground/20 mb-6" />
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-foreground/40">Architecting...</h4>
                                </div>
                            )}

                            {processing && (activePlan || batchFeed.length > 0) && (
                                <div className="mb-8 p-6 rounded-2xl bg-muted/5 border border-border/10 flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-1">Status</p>
                                            <p className="text-sm font-black uppercase tracking-tight text-foreground">Executing Plan...</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 uppercase">
                                        Batch {currentBatch} / {totalBatches}
                                    </p>
                                </div>
                            )}

                            {/* Curriculum Editor */}
                            {isCurriculumReady && !activePlan && !processing && (
                                <div className="mb-8 p-8 rounded-2xl bg-muted/5 border border-border/10 space-y-6 animate-in fade-in zoom-in-95">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                        <Sparkles size={20} className="text-foreground/40" />
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Structure Extracted</h4>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Review metadata below</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <CurriculumPill label="Anchor" value={anchoredHub?.title || 'Standalone'} icon={Database} isEditable={false} />
                                        <CurriculumPill label="Hub Title" value={curriculum.hub_title} onChange={v => setCurriculum(p => ({ ...p, hub_title: v }))} icon={FileEdit} />
                                        <CurriculumPill label="Course" value={curriculum.course} onChange={v => setCurriculum(p => ({ ...p, course: v }))} icon={BookOpen} options={availableOptions.courses} />
                                        <CurriculumPill label="Unit" value={curriculum.unit} onChange={v => setCurriculum(p => ({ ...p, unit: v }))} icon={Tag} options={availableOptions.units} />
                                        <CurriculumPill label="Semester" value={curriculum.semester} onChange={v => setCurriculum(p => ({ ...p, semester: v }))} icon={Calendar} options={availableOptions.semesters} />
                                    </div>
                                </div>
                            )}

                            {/* Plan Review */}
                            {activePlan && !processing && !batchFeed.length && (
                                <div className="mb-8 animate-in fade-in zoom-in-95">
                                    <div className="p-8 rounded-2xl bg-muted/5 border border-border/10">
                                        <div className="flex items-center gap-3 border-b border-border/10 pb-4 mb-6">
                                            <Layers size={20} className="text-foreground/40" />
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Plan Generated</h4>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Confirm deployment strategy</p>
                                            </div>
                                        </div>
                                        <PlanCardView planRaw={activePlan} />
                                    </div>
                                </div>
                            )}

                            {/* Execution Feed */}
                            {batchFeed.length > 0 && (
                                <div className="space-y-6 mt-8">
                                    <div className="flex items-center justify-between pb-4 border-b border-border/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Deployment Feed</h4>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{currentBatch} / {totalBatches} Completed</span>
                                    </div>
                                    
                                    {batchFeed.map(b => (
                                        <div key={b.batch} className="p-6 rounded-2xl border border-border/10 bg-muted/5 animate-in fade-in zoom-in-95">
                                             <div className="flex items-center gap-3 mb-6">
                                                 <div className="w-6 h-6 rounded-md bg-foreground text-[10px] font-black text-background flex items-center justify-center">
                                                     {b.batch}
                                                 </div>
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest", b.results.length > 0 ? "text-foreground" : "text-destructive")}>
                                                    {b.results.length > 0 ? "Execution Successful" : "Validation Failed"}
                                                </span>
                                            </div>
                                            
                                            {b.results.length === 0 && (
                                                <div className="mb-4 mt-2 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                                                    <p className="text-[10px] text-destructive font-black uppercase tracking-widest mb-3">No OKA Regions detected.</p>
                                                    <pre className="text-[9px] bg-background border border-border/20 p-3 rounded-lg overflow-x-auto font-mono text-muted-foreground/60">
                                                        {b.ai_output}
                                                    </pre>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {b.results.map((r: any, i: number) => (
                                                    <div key={i} className="p-4 border border-border/10 rounded-xl bg-background flex items-center gap-3">
                                                        <div className="p-2 bg-muted/5 rounded-lg border border-border/10 text-muted-foreground/40">
                                                            <FileText size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest truncate text-foreground/80">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {isCompleted && (
                                        <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                                            <div className="w-16 h-16 rounded-2xl bg-muted/5 border border-border/10 text-foreground/40 flex items-center justify-center mb-6">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-foreground">Architecture Complete</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8 max-w-sm">All knowledge fragments have been successfully deployed to your vault.</p>
                                            <button onClick={() => navigate('/obsidian')} className="flex items-center justify-center rounded-lg px-6 py-3 text-[10px] font-black uppercase tracking-widest text-foreground bg-background border border-border hover:border-foreground/50 transition-all">
                                                Go to Vault
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {okaError && (
                                <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 mt-8">
                                    <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-destructive">
                                        <X size={14} />
                                        Error during architecture
                                    </div>
                                    <p className="text-[10px] font-mono text-destructive/80">{okaError}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ─── Main Agents Hub ─── */
export default function Agents() {
    return <OkaDashboard onBack={() => {}} />
}
"""

with open('apps/desktop/src/routes/agents.tsx', 'w') as f:
    f.write(content[:start_idx] + new_return)

