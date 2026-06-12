import { describe, expect, it } from 'vitest'
import { shouldShowArtifactReopenButton } from '../lib/artifacts/panel'

describe('artifact panel controls', () => {
  it('shows a reopen control when artifacts exist and the panel is collapsed', () => {
    expect(shouldShowArtifactReopenButton(2, false)).toBe(true)
  })

  it('hides the reopen control when the panel is already open or no artifact exists', () => {
    expect(shouldShowArtifactReopenButton(2, true)).toBe(false)
    expect(shouldShowArtifactReopenButton(0, false)).toBe(false)
  })
})
