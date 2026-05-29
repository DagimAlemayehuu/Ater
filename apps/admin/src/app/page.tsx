"use client";

import React, { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { UserManagementGrid } from '@/components/UserManagementGrid'
import { GlobalEconomyConfig } from '@/components/GlobalEconomyConfig'
import { SecurityPipelines } from '@/components/SecurityPipelines'
import { RefreshCw, Activity, Terminal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { TelemetryBroker, UsageLogRow } from '@/lib/telemetryBroker'

type TabId = 'telemetry' | 'users' | 'economy' | 'pipelines'

function ControllerContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId
  const [activeTab, setActiveTab] = useState<TabId>('telemetry')
  const [stats, setStats] = useState({
    creditsBurned: 0,
    activeNodes: 0,
    geminiRatio: 100,
    waitlistCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [logFeed, setLogFeed] = useState<string[]>([])
  const [chartPaths, setChartPaths] = useState({
    linePath: "M 0 28 L 100 28",
    areaPath: "M 0 28 L 100 28 L 100 30 L 0 30 Z"
  })
  const [chartLabels, setChartLabels] = useState<string[]>([])

  // Sync tab from URL query params
  useEffect(() => {
    if (tabParam && ['telemetry', 'users', 'economy', 'pipelines'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  async function fetchSummaryMetrics() {
    setIsLoading(true)
    try {
      const metrics = await TelemetryBroker.fetchSummaryMetrics()

      let ratio = 100
      let computedLinePath = "M 0 28 L 100 28"
      let computedAreaPath = "M 0 28 L 100 28 L 100 30 L 0 30 Z"
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const days: Date[] = []
      const counts = new Array(7).fill(0)

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d)
      }

      const labels = days.map((d, index) => {
        if (index === 6) return 'Today'
        const dayName = weekdayNames[d.getDay()]
        const dayNum = d.getDate()
        return `${dayName} ${dayNum}`
      })
      setChartLabels(labels)

      if (metrics.usageLogs7Days && metrics.usageLogs7Days.length > 0) {
        // Calculate Gemini Ratio
        const totalLogs = metrics.usageLogs7Days.length
        const geminiLogs = metrics.usageLogs7Days.filter((log: UsageLogRow) => 
          log.model_name && log.model_name.toLowerCase().includes('gemini')
        ).length
        ratio = Math.round((geminiLogs / totalLogs) * 100)

        // Calculate usage trend coordinates
        metrics.usageLogs7Days.forEach((log: UsageLogRow) => {
          const logDateStr = new Date(log.created_at).toDateString()
          const dayIndex = days.findIndex(d => d.toDateString() === logDateStr)
          if (dayIndex !== -1) {
            counts[dayIndex]++
          }
        })

        const maxCount = Math.max(...counts, 1)
        const points = counts.map((count, index) => {
          const x = index * (100 / 6)
          const y = 26 - (count / maxCount) * 22 // Map count between y=4 and y=26
          return { x, y }
        })

        computedLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
        computedAreaPath = `${computedLinePath} L 100 30 L 0 30 Z`
      }

      setChartPaths({
        linePath: computedLinePath,
        areaPath: computedAreaPath
      })

      setStats({
        creditsBurned: metrics.creditsBurned,
        activeNodes: metrics.activeNodes,
        geminiRatio: ratio,
        waitlistCount: metrics.waitlistCount
      })

      if (metrics.latestLogs15 && metrics.latestLogs15.length > 0) {
        const formattedLogs = metrics.latestLogs15.map((log: UsageLogRow) => {
          const timestamp = new Date(log.created_at).toISOString().slice(0, 19).replace('T', ' ')
          const feature = (log.feature_type || 'EXEC').toUpperCase()
          const model = log.model_name || 'unknown'
          const domain = (log.academic_domain || 'general').toUpperCase()
          const tokens = log.token_count || 0
          return `${timestamp} ${feature} - ${model} [${domain}]: Deducted ${tokens} tokens`
        })
        setLogFeed(formattedLogs)
      } else {
        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ')
        setLogFeed([
          `${nowStr} SEC_GATE - Core engine monitoring initiated.`,
          `${nowStr} DRM_AUDIT - Hardware blacklist cache synchronized.`,
          `${nowStr} RPC_BILL - Credit monitoring system: OK.`
        ])
      }

    } catch (e) {
      console.error('[Telemetry] Failed to load summaries:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummaryMetrics()

    // Realtime subscribers
    const channel = supabase
      .channel("admin-realtime-telemetry")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchSummaryMetrics()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waiting_list" },
        () => {
          fetchSummaryMetrics()
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "usage_logs" },
        () => {
          fetchSummaryMetrics()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      {/* Top Header */}
      <header className="border-b border-border/40 bg-bento-panel/30 py-6 px-10 shrink-0 select-none">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-foreground leading-none">
              Controller
            </h2>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              System overview and user stats
            </p>
          </div>
          <button 
            onClick={fetchSummaryMetrics}
            disabled={isLoading}
            className="flex items-center gap-2 border border-border/40 bg-bento-card hover:bg-bento-item text-muted-foreground hover:text-foreground px-4 py-2 rounded-[8px] text-[9px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Telemetry Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 bg-bento-card border border-border/40 rounded-[8px]">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
              Credits Used Today
            </div>
            <div className="text-xl font-black text-foreground">
              {stats.creditsBurned}
            </div>
          </div>
          <div className="p-5 bg-bento-card border border-border/40 rounded-[8px]">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
              Active Users
            </div>
            <div className="text-xl font-black text-foreground">
              {stats.activeNodes}
            </div>
          </div>
          <div className="p-5 bg-bento-card border border-border/40 rounded-[8px]">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
              Waitlist Applicants
            </div>
            <div className="text-xl font-black text-foreground">
              {stats.waitlistCount}
            </div>
          </div>
          <div className="p-5 bg-bento-card border border-border/40 rounded-[8px]">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
              Gemini Execution Ratio
            </div>
            <div className="text-xl font-black text-foreground">
              {stats.geminiRatio}%
            </div>
          </div>
        </div>
      </header>

      {/* Tab Render Viewport */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-transparent">
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
            {/* Rolling Usage Chart */}
            <div className="lg:col-span-2 bg-bento-card border border-border/40 rounded-[8px] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Activity className="size-3.5 text-foreground" />
                  Usage trend
                </h3>
                <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Live</span>
              </div>
              
              <div className="h-64 border border-border/40 bg-bento-bg/80 rounded-[8px] flex flex-col justify-end p-4 text-[9px] uppercase tracking-widest text-muted-foreground relative">
                {/* SVG Graph Layout Grid */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="w-full border-t border-muted-foreground h-px" />
                  <div className="w-full border-t border-muted-foreground h-px" />
                  <div className="w-full border-t border-muted-foreground h-px" />
                  <div className="w-full border-t border-muted-foreground h-px" />
                </div>
                
                <svg className="w-full h-full text-foreground/80" viewBox="0 0 100 30" preserveAspectRatio="none">
                  {/* Area fill */}
                  <path
                    fill="currentColor"
                    className="text-foreground/5"
                    d={chartPaths.areaPath}
                  />
                  {/* Clean vector line */}
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    className="text-foreground"
                    d={chartPaths.linePath}
                  />
                </svg>

                <div className="flex justify-between mt-4 text-[8px] text-muted-foreground uppercase tracking-widest border-t border-border/40 pt-3 select-none">
                  {chartLabels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Terminal Feed */}
            <div className="bg-bento-card border border-border/40 rounded-[8px] p-6 flex flex-col h-full max-h-[360px] lg:max-h-none">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="size-3.5 text-foreground" />
                  Activity
                </h3>
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 p-4 text-[9px] leading-relaxed text-muted-foreground overflow-y-auto bg-bento-bg/80 border border-border/40 rounded-[8px] custom-scrollbar select-text">
                {logFeed.map((log, index) => (
                  <div key={index} className="border-b border-border/20 py-1.5 last:border-0 hover:text-foreground transition-colors break-words">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagementGrid />}
        {activeTab === 'economy' && <GlobalEconomyConfig />}
        {activeTab === 'pipelines' && <SecurityPipelines />}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] uppercase tracking-widest">
        Loading...
      </div>
    }>
      <ControllerContent />
    </Suspense>
  )
}
