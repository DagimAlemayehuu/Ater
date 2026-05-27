import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/context/theme-provider'

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      className='toaster group [&_div[data-content]]:w-full font-sans'
      toastOptions={{
        className: 'bg-[#151517] border border-[#242426] text-foreground rounded-[8px] p-4 shadow-xl',
      }}
      style={
        {
          '--normal-bg': '#151517',
          '--normal-text': '#ffffff',
          '--normal-border': '#242426',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
