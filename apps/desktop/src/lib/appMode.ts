export type AppMode = 'real' | 'simulation' | 'beta'

let runtimeAppMode: AppMode = 'beta'

export function toAppMode(value: unknown, legacyIsDemoMode?: boolean): AppMode {
  if (value === 'simulation') return 'simulation'
  if (value === 'beta') return 'beta'
  if (legacyIsDemoMode === true) return 'simulation'
  return 'real'
}

export function setRuntimeAppMode(mode: AppMode) {
  runtimeAppMode = mode
}

export function getRuntimeAppMode(): AppMode {
  return runtimeAppMode
}

export function isSimulationMode(): boolean {
  return runtimeAppMode === 'simulation'
}

export function isBetaMode(): boolean {
  return runtimeAppMode === 'beta'
}
