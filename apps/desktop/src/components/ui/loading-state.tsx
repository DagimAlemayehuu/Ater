import { cn } from '@/lib/utils'

type LoadingStateProps = {
  label?: string
  detail?: string
  className?: string
}

export function MiniLoader({ label = 'Loading', detail, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 text-foreground p-6 select-none', className)}>
      <div className="ater-mini-loader shrink-0" aria-hidden="true" />
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground leading-none">{label}</span>
        {detail && (
          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 leading-none mt-0.5">{detail}</span>
        )}
      </div>
    </div>
  )
}

export function BlockingLoader({ label = 'Loading', detail, className }: LoadingStateProps) {
  return (
    <div className={cn('fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 text-foreground backdrop-blur-md transition-opacity duration-300', className)}>
      <MiniLoader label={label} detail={detail} />
    </div>
  )
}

export function PanelLoader({ label = 'Loading', detail, className }: LoadingStateProps) {
  return (
    <div className={cn('absolute inset-0 z-50 flex items-center justify-center bg-background/60 text-foreground backdrop-blur-md transition-opacity duration-300', className)}>
      <MiniLoader label={label} detail={detail} />
    </div>
  )
}

