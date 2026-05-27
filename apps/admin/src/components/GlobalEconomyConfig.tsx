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

export function GlobalEconomyConfig() {
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [circuitBreaker, setCircuitBreaker] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [inputCosts, setInputCosts] = useState<Record<string, number>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [allAiCost, setAllAiCost] = useState<number>(0)
  const [updatingAllAi, setUpdatingAllAi] = useState(false)

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

  // Apply cost adjustment for a single feature row
  async function applyPriceChange(slug: string) {
    const cost = inputCosts[slug]
    if (cost === undefined || cost < 0) return
    try {
      const { error } = await supabase
        .from('system_config')
        .update({ 
          credit_cost: cost,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug)
      
      if (!error) {
        setSuccessMessage(`Pricing updated for ${slug.toUpperCase()} to ${cost} credits`)
        fetchConfigs()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Failed to adjust pricing:', e)
      setErrorMessage('Failed to adjust pricing rules.')
    }
  }

  async function applyPriceChangeToAllAi() {
    setUpdatingAllAi(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const aiSlugs = ['ai-ingestion', 'oracle-chat', 'ai-features', 'ai_locked']
      
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
        setErrorMessage(failed.error?.message || 'Failed to update some AI feature costs.')
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
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[Economy Config] Failed to toggle circuit breaker:', e)
      setErrorMessage('Failed to actuate circuit breaker.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-[10px] max-w-4xl relative select-none">
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
            <div className="text-center py-6 text-muted-foreground text-[8px] uppercase tracking-widest">
              No pricing rules.
            </div>
          ) : (
            configs.map(c => (
              <div key={c.slug} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="font-bold text-foreground text-[10px] uppercase tracking-wider">{c.slug.replace('_', ' ')}</div>
                  <div className="text-[8px] text-muted-foreground uppercase tracking-widest">
                    Updated: {new Date(c.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto items-center">
                  <input
                    type="number"
                    min="0"
                    value={inputCosts[c.slug] ?? 0}
                    onChange={e => setInputCosts({ 
                      ...inputCosts, 
                      [c.slug]: Math.max(0, parseInt(e.target.value) || 0) 
                    })}
                    className="w-20 bg-bento-bg border border-border/40 text-foreground text-[11px] px-3 py-1.5 rounded-[6px] focus:border-border/80 outline-none"
                  />
                  <button
                    onClick={() => applyPriceChange(c.slug)}
                    className="border border-border/40 bg-bento-card hover:bg-bento-item text-[8px] font-black uppercase tracking-widest px-3 py-2 rounded-[6px] transition-colors cursor-pointer text-foreground"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
