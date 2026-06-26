import { useNavigate } from 'react-router-dom'
import { useConfig } from '@/lib/ConfigContext'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { ThemeSwitch } from '@/components/theme-switch'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { config, saveConfig } = useConfig()
  const { profile } = useAuth()
  const [ready, setReady] = useState(false)

  const firstName = (
    profile?.full_name?.split(' ')[0] ||
    config?.displayName?.split(' ')[0] ||
    'there'
  )

  // Staggered entrance animation
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  const handleStartTour = async () => {
    // Enable simulation mode so the route guard allows access to all pages
    // The tour starts at Settings (2.1) — real config happens there
    await saveConfig({
      isDemoMode: true,
      appMode: 'simulation',
      walkthroughStatus: 'active',
      walkthroughMilestone: '2.1',
      walkthroughCompleted: false,
    } as any)
    navigate('/settings')
  }

  const handleSkip = () => {
    navigate('/onboarding')
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden select-none">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 60%, hsl(var(--primary) / 0.07) 0%, transparent 70%),
            radial-gradient(ellipse 30% 20% at 30% 30%, hsl(var(--primary) / 0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Top-right controls */}
      <div className="absolute top-8 right-8 z-10">
        <ThemeSwitch />
      </div>

      {/* Main content */}
      <div
        className="flex flex-col items-center text-center max-w-lg px-8 z-10"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Greeting eyebrow */}
        <div
          className="text-[9px] font-black uppercase tracking-[0.35em] text-primary mb-6"
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.9s ease 0.1s',
          }}
        >
          Welcome to the Ater Desktop
        </div>

        {/* Name hero */}
        <h1
          className="text-[52px] font-black uppercase tracking-tight text-foreground leading-[1.0] mb-6"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.9s ease 0.15s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}
        >
          {firstName}
        </h1>

        {/* Tagline */}
        <p
          className="text-[14px] font-medium text-muted-foreground leading-relaxed mb-3 max-w-sm"
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.9s ease 0.25s',
          }}
        >
          Your intelligence dashboard is ready. Before you dive in, let us show you around — every page, every feature, every tool.
        </p>

        <p
          className="text-[12px] text-muted-foreground/60 mb-12"
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.9s ease 0.3s',
          }}
        >
          It takes about 5 minutes.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col items-center gap-3 w-full max-w-xs"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.9s ease 0.4s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s',
          }}
        >
          <button
            data-tour="tour-start-btn"
            onClick={handleStartTour}
            className="w-full py-3.5 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.25em] rounded-[10px] hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-lg"
          >
            Walkthrough
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Enter Empty App
          </button>
        </div>
      </div>

      {/* Bottom watermark */}
      <div
        className="absolute bottom-8 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30"
        style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.9s ease 0.6s',
        }}
      >
        Ater · Intelligence Engine
      </div>
    </div>
  )
}
