import React from 'react'

export const WALKTHROUGH_TRIGGER_EVENT = 'ater:walkthrough-trigger'

export function dispatchWalkthroughTrigger(trigger: any) {
  // No-op
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useWalkthrough() {
  return {
    status: 'inactive',
    milestone: 'skip',
    trigger: () => {},
    dismiss: async () => {},
    skipStep: () => {},
    prevStep: () => {},
  }
}
