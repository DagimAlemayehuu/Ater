import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SimulationProvider, useSimulation } from '@/context/SimulationContext'

const saveConfig = vi.fn()

vi.mock('@/lib/ConfigContext', () => ({
  useConfig: () => ({
    config: { appMode: 'real', isDemoMode: false },
    saveConfig,
  }),
}))

function Probe() {
  const simulation = useSimulation()
  return (
    <div>
      <div data-testid="mode">{simulation.appMode}</div>
      <div data-testid="profile">{simulation.profile.name}</div>
      <button onClick={simulation.enterSimulation}>enter</button>
      <button onClick={simulation.exitSimulation}>exit</button>
    </div>
  )
}

describe('SimulationProvider', () => {
  it('enters and exits simulation through config mode only', async () => {
    render(
      <SimulationProvider>
        <Probe />
      </SimulationProvider>,
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('real')
    expect(screen.getByTestId('profile')).toHaveTextContent('Maya Chen')

    fireEvent.click(screen.getByText('enter'))
    expect(saveConfig).toHaveBeenCalledWith({ appMode: 'simulation', isDemoMode: true })

    fireEvent.click(screen.getByText('exit'))
    expect(saveConfig).toHaveBeenCalledWith({ appMode: 'real', isDemoMode: false })
  })
})
