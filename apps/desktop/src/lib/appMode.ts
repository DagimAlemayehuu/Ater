export type AppMode = 'real' | 'simulation'

let runtimeAppMode: AppMode = 'real'

export function toAppMode(value: unknown, legacyIsDemoMode?: boolean): AppMode {
  if (value === 'simulation') return 'simulation'
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
