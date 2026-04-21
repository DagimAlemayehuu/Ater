import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 border border-border rounded-full hover:bg-muted transition-colors relative w-10 h-10 flex items-center justify-center overflow-hidden"
    >
        <Sun className={cn(
            "w-5 h-5 transition-all duration-500",
            resolvedTheme === 'dark' ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"
        )} />
        <Moon className={cn(
            "w-5 h-5 absolute transition-all duration-500",
            resolvedTheme === 'dark' ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        )} />
    </button>
  )
}
