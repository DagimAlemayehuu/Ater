import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'flex h-10 w-full min-w-0 rounded-[8px] border border-[#242426] bg-[#1a1a1c] px-3 py-1 text-sm shadow-xs transition-all outline-none selection:bg-white/10 selection:text-white placeholder:text-muted-foreground/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-white focus:border-white/20 focus:bg-[#232326]',
        'focus-visible:ring-[3px] focus-visible:ring-white/5',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
    />
  )
}

export { Input }
