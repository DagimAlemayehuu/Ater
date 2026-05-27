import { useSecurityStore } from '@/context/securityStore'

export function useSecurity() {
  const { status, lockedFeatures, checkOnlineLockout, isFeatureLocked } = useSecurityStore()

  const isBricked = status === 'Bricked'
  const isLeaseExpired = status === 'LeaseExpired'

  return {
    status,
    lockedFeatures,
    isBricked,
    isLeaseExpired,
    isFeatureLocked,
    checkSecurity: checkOnlineLockout,
    getLockProps: (feature: string) => {
      const locked = isFeatureLocked(feature)
      if (!locked) return {}

      return {
        className: 'opacity-40 pointer-events-none border-dashed border-muted-foreground/50',
        'data-tooltip': '[ACCESS DENIED: Module restricted by controller]',
        disabled: true,
      }
    }
  }
}
