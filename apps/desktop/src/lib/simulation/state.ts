import { SIMULATION_SEED, SimulationState } from './seed'

function cloneState(seed: SimulationState): SimulationState {
  return structuredClone(seed)
}

let currentState: SimulationState = cloneState(SIMULATION_SEED)

export function createSimulationState(): SimulationState {
  return cloneState(SIMULATION_SEED)
}

export function getSimulationState(): SimulationState {
  return currentState
}

export function resetSimulationState(): SimulationState {
  currentState = cloneState(SIMULATION_SEED)
  return currentState
}

export function patchSimulationNote(path: string, content: string) {
  const existing = currentState.notesByPath[path]
  if (!existing) {
    return { success: false, error: `Simulation note not found: ${path}` }
  }

  const updated = { ...existing, content }
  currentState.notesByPath[path] = updated
  currentState.notes = currentState.notes.map((entry) => (entry.path === path ? updated : entry))
  currentState.files = currentState.files.map((file) =>
    file.path === path ? { ...file, size: content.length } : file,
  )

  return { success: true, path }
}
