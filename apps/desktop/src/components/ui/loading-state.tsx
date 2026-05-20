import { cn } from '@/lib/utils'

type LoadingStateProps = {
  label?: string
  detail?: string
  className?: string
}

export function MiniLoader({ label = 'Loading', detail, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-foreground', className)}>
      <div className="ater-mini-loader" aria-hidden="true" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-foreground/80">{label}</span>
        {detail && (
          <span className="text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground/45">{detail}</span>
        )}
      </div>
    </div>
  )
}

export function BlockingLoader({ label = 'Loading', detail, className }: LoadingStateProps) {
  return (
    <div className={cn('fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 text-white', className)}>
      <MiniLoader label={label} detail={detail} />
    </div>
  )
}

export function PanelLoader({ label = 'Loading', detail, className }: LoadingStateProps) {
  return (
    <div className={cn('absolute inset-0 z-50 flex items-center justify-center bg-black/95 text-white', className)}>
      <MiniLoader label={label} detail={detail} />
    </div>
  )
}
