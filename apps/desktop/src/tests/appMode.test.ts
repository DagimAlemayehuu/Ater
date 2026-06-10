import { describe, expect, it } from 'vitest'
import {
  getRuntimeAppMode,
  isSimulationMode,
  setRuntimeAppMode,
  toAppMode,
} from '@/lib/appMode'

describe('appMode', () => {
  it('defaults to real mode', () => {
    setRuntimeAppMode('real')

    expect(getRuntimeAppMode()).toBe('real')
    expect(isSimulationMode()).toBe(false)
  })

  it('normalizes legacy demo flags to simulation', () => {
    expect(toAppMode('simulation', false)).toBe('simulation')
    expect(toAppMode(undefined, true)).toBe('simulation')
    expect(toAppMode('real', false)).toBe('real')
  })

  it('tracks simulation mode for non-React API routing', () => {
    setRuntimeAppMode('simulation')

    expect(getRuntimeAppMode()).toBe('simulation')
    expect(isSimulationMode()).toBe(true)
  })
})
