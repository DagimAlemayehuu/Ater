"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/" },
  { name: "Waitlist", href: "/waitlist" },
  { name: "Users", href: "/users" },
  { name: "Logs", href: "/logs" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[72px] lg:w-[240px] border-r border-border bg-background flex flex-col h-full shrink-0">
      <div className="p-4 lg:p-8 border-b border-border">
        <h1 className="text-[16px] lg:text-[18px] font-black tracking-tighter uppercase leading-none text-foreground">Ater</h1>
      </div>

      <div className="flex-1 px-2 lg:px-4 mt-4 lg:mt-6 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-none border-l-2 transition-none",
                  isActive 
                    ? "bg-accent text-foreground border-primary font-black" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent font-medium"
                )}
              >
                <span className="hidden lg:inline text-[11px] tracking-widest uppercase">{item.name}</span>
                <span className="lg:hidden text-[10px] tracking-widest uppercase">{item.name.slice(0, 2)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2 lg:p-6 border-t border-border mt-auto">
        <div className="flex items-center justify-center lg:justify-start gap-4 px-2 lg:px-3 py-3 bg-accent/30 border border-border">
          <div className="size-8 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black uppercase">AD</div>
          <div className="hidden lg:block flex-1 truncate">
            <p className="text-[10px] font-black uppercase tracking-widest truncate text-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
