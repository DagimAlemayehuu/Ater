import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { AppMode, setRuntimeAppMode, toAppMode } from '@/lib/appMode'
import { useConfig } from '@/lib/ConfigContext'
import { getSimulationState, resetSimulationState } from '@/lib/simulation/state'
import type { SimulationProfile, SimulationState } from '@/lib/simulation/seed'

interface SimulationContextValue {
  appMode: AppMode
  isSimulation: boolean
  profile: SimulationProfile
  vault: SimulationState
  enterSimulation: () => Promise<void>
  exitSimulation: () => Promise<void>
  resetSimulation: () => void
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { config, saveConfig } = useConfig()
  const appMode = toAppMode(config?.appMode, config?.isDemoMode)
  const vault = getSimulationState()

  setRuntimeAppMode(appMode)

  const enterSimulation = useCallback(async () => {
    resetSimulationState()
    setRuntimeAppMode('simulation')
    await saveConfig({ appMode: 'simulation', isDemoMode: true } as any)
    window.dispatchEvent(new CustomEvent('ater:walkthrough-trigger', { detail: { trigger: 'simulation_started' } }))
  }, [saveConfig])

  const exitSimulation = useCallback(async () => {
    resetSimulationState()
    setRuntimeAppMode('real')
    await saveConfig({ appMode: 'real', isDemoMode: false } as any)
  }, [saveConfig])

  const resetSimulation = useCallback(() => {
    resetSimulationState()
  }, [])

  const value = useMemo<SimulationContextValue>(
    () => ({
      appMode,
      isSimulation: appMode === 'simulation',
      profile: vault.profile,
      vault,
      enterSimulation,
      exitSimulation,
      resetSimulation,
    }),
    [appMode, vault, enterSimulation, exitSimulation, resetSimulation],
  )

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider')
  }
  return context
}
