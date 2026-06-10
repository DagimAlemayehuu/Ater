import { describe, expect, it } from 'vitest'
import { advanceWalkthrough, WalkthroughState } from '@/lib/walkthroughMachine'

describe('advanceWalkthrough', () => {
  it('only advances when the success trigger matches the current milestone', () => {
    const initial: WalkthroughState = { status: 'active', milestone: '2.2' }

    expect(advanceWalkthrough(initial, 'nav_settings')).toEqual(initial)
    expect(advanceWalkthrough(initial, 'vaultPath_updated')).toEqual({
      status: 'active',
      milestone: '2.3',
    })
  })

  it('advances settings milestones correctly', () => {
    expect(advanceWalkthrough({ status: 'active', milestone: '2.3' }, 'ai_config_opened')).toEqual({
      status: 'active',
      milestone: '2.4',
    })
  })

  it('marks the walkthrough completed after conversion completion', () => {
    expect(
      advanceWalkthrough({ status: 'active', milestone: '7.1' }, 'conversion_completed'),
    ).toEqual({
      status: 'completed',
      milestone: '7.1',
    })
  })

  it('does not advance a completed or inactive walkthrough', () => {
    expect(advanceWalkthrough({ status: 'completed', milestone: '4.1' }, 'nav_obsidian')).toEqual({
      status: 'completed',
      milestone: '4.1',
    })
    expect(advanceWalkthrough({ status: 'inactive', milestone: '2.1' }, 'nav_settings')).toEqual({
      status: 'inactive',
      milestone: '2.1',
    })
  })
})

