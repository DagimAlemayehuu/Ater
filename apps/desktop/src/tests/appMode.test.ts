import { describe, expect, it } from 'vitest'
import {
  getRuntimeAppMode,
  isSimulationMode,
  isBetaMode,
  setRuntimeAppMode,
  toAppMode,
} from '@/lib/appMode'

describe('appMode', () => {
  it('defaults to beta mode', () => {
    expect(getRuntimeAppMode()).toBe('beta')
    expect(isBetaMode()).toBe(true)
    expect(isSimulationMode()).toBe(false)
  })

  it('can switch to real mode', () => {
    setRuntimeAppMode('real')

    expect(getRuntimeAppMode()).toBe('real')
    expect(isBetaMode()).toBe(false)
    expect(isSimulationMode()).toBe(false)
  })

  it('normalizes legacy demo flags to simulation', () => {
    expect(toAppMode('simulation', false)).toBe('simulation')
    expect(toAppMode('beta', false)).toBe('beta')
    expect(toAppMode(undefined, true)).toBe('simulation')
    expect(toAppMode('real', false)).toBe('real')
  })

  it('tracks simulation mode for non-React API routing', () => {
    setRuntimeAppMode('simulation')

    expect(getRuntimeAppMode()).toBe('simulation')
    expect(isSimulationMode()).toBe(true)
  })
})
