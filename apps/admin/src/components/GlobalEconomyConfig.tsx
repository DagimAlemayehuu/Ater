"use client";

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertOctagon, Power, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConfigRow = {
  slug: string
  credit_cost: number
  updated_at: string
}

const FEATURE_DESCRIPTIONS: Record<string, { title: string; desc: string }> = {
  'explain-features': {
    title: 'Explain with AI',
    desc: 'Billed when selecting text, PDFs, or questions for detailed main agent explanations.'
  },
  'generate-practice': {
    title: 'Practice Recall Generation',
    desc: 'Billed when dynamically generating personalized interactive quizzes and recall cards.'
  },
  'ater_generation': {
    title: 'Note Generation Pipeline',
    desc: 'Billed when processing hubs, raw outlines, or compiling academic progress sheets.'
  },
  'edc-features': {
    title: 'EDC Tracing Console',
    desc: 'Billed when using Explain-Debug-Code tracing for complex code engineering notes.'
  },
  'oracle-chat': {
    title: 'Oracle RAG Assistant',
    desc: 'Billed per streaming chat message exchange with the central Knowledge RAG Oracle.'
  },
  'ai-ingestion': {
    title: 'Document Vector Ingestion',
    desc: 'Billed per document uploaded and split into local vector embeddings.'
  },
  'ai-features': {
    title: 'AI Interface Access',
    desc: 'General access lease for executing baseline semantic modeling features.'
  },
  'ai_locked': {
    title: 'Legacy AI Lockout',
    desc: 'Governance status flag for standard AI processing pipelines.'
  }
}

export function GlobalEconomyConfig() {
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [circuitBreaker, setCircuitBreaker] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [inputCosts, setInputCosts] = useState<Record<string, number>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [allAiCost, setAllAiCost] = useState<number>(0)
  const [updatingAllAi, setUpdatingAllAi] = useState(false)
  const [seeding, setSeeding] = useState(false)

  async function seedDefaultRules() {
    setSeeding(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const defaults = [
        { slug: 'explain-features', credit_cost: 1 },
        { slug: 'generate-practice', credit_cost: 1 },
        { slug: 'ater_generation', credit_cost: 5 },
        { slug: 'edc-features', credit_cost: 1 },
        { slug: 'oracle-chat', credit_cost: 2 },
        { slug: 'ai-ingestion', credit_cost: 1 },
        { slug: 'ai-features', credit_cost: 1 },
        { slug: 'ai_locked', credit_cost: 1 },
        { slug: 'circuit-breaker', credit_cost: 0 }
      ]

      const { error } = await supabase
        .from('system_config')
        .upsert(defaults, { onConflict: 'slug' })

      if (!error) {
        setSuccessMessage('Default system pricing rules initialized successfully!')
        fetchConfigs()
      } else {
        if (error.message?.includes('violates row-level security')) {
          setErrorMessage('Security Alert: Your profile is not configured as an Admin in the remote Supabase database. Try appending "?bypass=true" to the URL path to bypass RLS in full interactive mockup mode!')
        } else {
          setErrorMessage(error.message)
        }
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Seeding failed:', e)
      setErrorMessage('Failed to initialize database pricing rules.')
    } finally {
      setSeeding(false)
    }
  }

  // Clear messages
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setErrorMessage(null)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  async function fetchConfigs() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
      
      if (!error && data) {
        // Filter out circuit-breaker flag from base pricing list
        const pricing = data.filter((c: ConfigRow) => c.slug !== 'circuit-breaker')
        const cbRow = data.find((c: ConfigRow) => c.slug === 'circuit-breaker')
        
        setConfigs(pricing)
        setCircuitBreaker(cbRow ? cbRow.credit_cost === 1 : false)

        // Hydrate cost input values
        const costs: Record<string, number> = {}
        pricing.forEach((c: ConfigRow) => {
          costs[c.slug] = c.credit_cost
        })
        setInputCosts(costs)
      } else if (error) {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Failed to load configuration details:', e)
      setErrorMessage('Failed to connect to economy database.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Apply cost adjustment for ALL feature rows together
  const [savingAll, setSavingAll] = useState(false)

  async function applyPriceChangeAll() {
    setSavingAll(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const promises = configs.map(c => {
        const cost = inputCosts[c.slug]
        return supabase
          .from('system_config')
          .update({ 
            credit_cost: cost !== undefined ? cost : c.credit_cost,
            updated_at: new Date().toISOString()
          })
          .eq('slug', c.slug)
      })

      const results = await Promise.all(promises)
      const failed = results.find(r => r.error)

      if (!failed) {
        setSuccessMessage('Successfully updated all pricing rules in system cost matrix!')
        fetchConfigs()
      } else {
        if (failed.error?.message?.includes('violates row-level security')) {
          setErrorMessage('Security Alert: Your profile is not configured as an Admin in the remote Supabase database. Try appending "?bypass=true" to the URL path to bypass RLS in full interactive mockup mode!')
        } else {
          setErrorMessage(failed.error?.message || 'Failed to update some pricing rules.')
        }
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Batch pricing save failed:', e)
      setErrorMessage('Failed to save unified pricing cost matrix.')
    } finally {
      setSavingAll(false)
    }
  }

  async function applyPriceChangeToAllAi() {
    setUpdatingAllAi(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const aiSlugs = ['ai-ingestion', 'oracle-chat', 'ai-features', 'ai_locked', 'explain-features', 'generate-practice', 'ater_generation', 'edc-features']
      
      const promises = aiSlugs.map(slug => 
        supabase
          .from('system_config')
          .update({ 
            credit_cost: allAiCost,
            updated_at: new Date().toISOString()
          })
          .eq('slug', slug)
      )

      const results = await Promise.all(promises)
      const failed = results.find(r => r.error)

      if (!failed) {
        setSuccessMessage(`Pricing updated for all AI features to ${allAiCost} credits`)
        fetchConfigs()
      } else {
        if (failed.error?.message?.includes('violates row-level security')) {
          setErrorMessage('Security Alert: Your profile is not configured as an Admin in the remote Supabase database. Try appending "?bypass=true" to the URL path to bypass RLS in full interactive mockup mode!')
        } else {
          setErrorMessage(failed.error?.message || 'Failed to update some AI feature costs.')
        }
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Failed to batch adjust pricing:', e)
      setErrorMessage('Failed to batch adjust pricing rules.')
    } finally {
      setUpdatingAllAi(false)
    }
  }

  // Toggle Circuit Breaker
  async function toggleCircuitBreaker() {
    const nextState = !circuitBreaker
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          slug: 'circuit-breaker',
          credit_cost: nextState ? 1 : 0,
          updated_at: new Date().toISOString()
        })
      
      if (!error) {
        setCircuitBreaker(nextState)
        setSuccessMessage(`Gateway status: ${nextState ? 'Disconnected' : 'Active'}`)
      } else {
        if (error.message?.includes('violates row-level security')) {
          setErrorMessage('Security Alert: Your profile is not configured as an Admin in the remote Supabase database. Try appending "?bypass=true" to the URL path to bypass RLS in full interactive mockup mode!')
        } else {
          setErrorMessage(error.message)
        }
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Failed to toggle circuit breaker:', e)
      setErrorMessage('Failed to actuate circuit breaker.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-[10px] max-w-6xl relative select-none">
      {/* Toast notifications */}
      {(successMessage || errorMessage) && (
        <div className={cn(
          "fixed bottom-6 right-6 px-4 py-3 border border-border/40 rounded-[8px] text-[9px] uppercase tracking-widest z-50 shadow-2xl flex items-center gap-2 bg-bento-card",
          successMessage ? "text-foreground" : "text-destructive border-destructive/20 bg-destructive/5"
        )}>
          {successMessage ? successMessage : errorMessage}
        </div>
      )}

      {/* Left Column: Circuit Breaker & Batch AI Cost */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Left: Circuit Breaker Card */}
        <div className="bg-bento-card border border-border/40 rounded-[12px] p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertOctagon className={cn("size-4.5 transition-colors", circuitBreaker ? 'text-destructive' : 'text-muted-foreground')} />
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">
                Kill switch
              </h3>
            </div>

            <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">
              Disconnects client api gateways instantly.
            </p>
          </div>

          <div className="pt-8">
            <button
              onClick={toggleCircuitBreaker}
              className={cn(
                "w-full py-4 border text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 rounded-[8px] transition-all cursor-pointer",
                circuitBreaker 
                  ? 'bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/20' 
                  : 'bg-bento-bg border-border/40 text-muted-foreground hover:text-foreground hover:border-border/80'
              )}
            >
              <Power className="size-4" />
              {circuitBreaker ? 'Gateway disconnected' : 'Gateway active'}
            </button>
          </div>
        </div>

        {/* AI Batch Pricing Card */}
        <div className="bg-bento-card border border-border/40 rounded-[12px] p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">
              AI Feature Groups
            </h3>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">
              Batch update cost rules for all integrated AI processors.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div>
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
                Credit Cost (All AI features)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={allAiCost}
                  onChange={e => setAllAiCost(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 bg-bento-bg border border-border/40 text-foreground text-[11px] px-3 py-1.5 rounded-[6px] focus:border-border/80 outline-none"
                />
                <button
                  onClick={applyPriceChangeToAllAi}
                  disabled={updatingAllAi}
                  className="border border-border/40 bg-bento-card hover:bg-bento-item text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-[6px] transition-colors cursor-pointer text-foreground shrink-0"
                >
                  {updatingAllAi ? 'Saving...' : 'Set Cost'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Pricing matrix */}
      <div className="lg:col-span-7 bg-bento-card border border-border/40 rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40 bg-bento-panel/30 flex justify-between items-center">
          <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Pricing
          </h3>
          <button 
            onClick={fetchConfigs}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer border border-border/40 rounded-[6px] bg-bento-card"
          >
            <RefreshCw className="size-3" />
          </button>
        </div>

        <div className="p-6 divide-y divide-border/20">
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground text-[8px] uppercase tracking-widest">
              Loading...
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 px-6 flex flex-col items-center justify-center space-y-4">
              <div className="size-10 rounded-full border border-border/40 bg-bento-bg flex items-center justify-center text-muted-foreground text-[14px]">⚡</div>
              <div className="space-y-1">
                <p className="text-foreground text-[9px] font-black uppercase tracking-[0.2em]">Database Uninitialized</p>
                <p className="text-muted-foreground text-[8px] uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                  No pricing rules found in system_config. Initialize dynamic cost parameters below.
                </p>
              </div>
              <button
                onClick={seedDefaultRules}
                disabled={seeding}
                className="mt-2 border border-border bg-foreground text-background hover:bg-foreground/80 transition-all uppercase text-[8px] font-black tracking-widest px-4 py-2 rounded-[6px] cursor-pointer disabled:opacity-50"
              >
                {seeding ? 'Initializing...' : 'Initialize Default Rules'}
              </button>
            </div>
          ) : (
            configs.map(c => {
              const meta = FEATURE_DESCRIPTIONS[c.slug] || {
                title: c.slug.replace(/[-_]/g, ' '),
                desc: 'Integrated system transaction rule cost mapping.'
              }
              return (
                <div key={c.slug} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 first:pt-0">
                  <div className="space-y-1 max-w-[70%] text-left">
                    <div className="font-bold text-foreground text-[10px] uppercase tracking-wider">{meta.title}</div>
                    <div className="text-[8px] text-muted-foreground uppercase tracking-widest leading-normal">{meta.desc}</div>
                    <div className="text-[7px] text-muted-foreground/60 uppercase tracking-widest pt-1">
                      slug: {c.slug} | Updated: {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto items-center shrink-0">
                    <input
                      type="number"
                      min="0"
                      value={inputCosts[c.slug] ?? 0}
                      onChange={e => setInputCosts({ 
                        ...inputCosts, 
                        [c.slug]: Math.max(0, parseInt(e.target.value) || 0) 
                      })}
                      className="w-20 bg-bento-bg border border-border/40 text-foreground text-[11px] px-3 py-1.5 rounded-[6px] focus:border-border/80 outline-none font-mono"
                    />
                    <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-black shrink-0">credits</span>
                  </div>
                </div>
              )
            }).concat(
              configs.length > 0 ? [
                <div key="save-all" className="pt-6 mt-4 border-t border-border/20 flex justify-end">
                  <button
                    onClick={applyPriceChangeAll}
                    disabled={savingAll}
                    className="border border-border bg-foreground text-background hover:bg-foreground/80 transition-all uppercase text-[8px] font-black tracking-widest px-5 py-3 rounded-[6px] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingAll ? 'Saving cost matrix...' : 'Save All Pricing Rules'}
                  </button>
                </div>
              ] : []
            )
          )}
        </div>
      </div>
    </div>
  )
}
