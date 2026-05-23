import Link from "next/link";
import { Twitter, Github, MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative md:sticky md:top-0 z-[100] min-h-[50vh] md:h-screen bg-background grid-background flex flex-col items-center justify-center border-t border-outline-variant py-20 md:py-0">
      <div className="industrial-container w-full flex flex-col gap-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black tracking-tighter">
                ATER <span className="text-on-surface-variant font-bold normal-case text-on-surface-variant">አጠር</span>
              </span>
            </div>
            <p className="text-body text-on-surface-variant leading-relaxed max-w-sm">
              HIGH-PERFORMANCE STUDY ENGINE. BUILT FOR STUDENTS WHO DEMAND PERFORMANCE AND PRIVACY.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="technical-label text-primary">NAVIGATION</h4>
            <ul className="space-y-4">
              {['FEATURES', 'PRICING', 'CONTACT', 'WAITLIST'].map(link => (
                <li key={link}>
                  <Link href={link === 'WAITLIST' ? '/waitlist' : `/${link.toLowerCase()}`} className="technical-label text-on-surface-variant hover:text-on-surface transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="technical-label text-primary">SOCIALS</h4>
            <ul className="space-y-4">
              {[
                { label: 'TWITTER', icon: Twitter, href: 'https://x.com/ater_app' },
                { label: 'GITHUB', icon: Github, href: 'https://github.com/DagimAlemayehuu/Ater' },
                { label: 'DISCORD', icon: MessageSquare, href: 'https://discord.com' }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
                    <item.icon className="size-4 text-on-surface-variant group-hover:opacity-100 group-hover:text-primary transition-all" />
                    <span className="technical-label text-on-surface-variant group-hover:text-on-surface transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 technical-label text-on-surface-variant text-[10px] border-t border-outline-variant pt-12">
          <span>© 2026 ATER</span>
          <div className="flex gap-12">
            <span>PRIVACY</span>
            <span>TERMS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
