import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'flex h-10 w-full min-w-0 rounded-[8px] border border-border bg-bento-card px-3 py-1 text-sm shadow-xs transition-all outline-none selection:bg-foreground/10 selection:text-foreground placeholder:text-muted-foreground/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground focus:border-foreground/20 focus:bg-bento-item',
        'focus-visible:ring-[3px] focus-visible:ring-white/5',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
    />
  )
}

export { Input }
