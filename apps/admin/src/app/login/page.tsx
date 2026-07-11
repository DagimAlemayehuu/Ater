"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = "dagimalemayehuu@gmail.com";
const ADMIN_PASSWORD = "0000";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError("Invalid admin credentials.");
      return;
    }

    setError("");
    router.replace("/?bypass=true");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-bento-panel border border-border/40 rounded-[8px] p-6 space-y-5"
      >
        <div className="space-y-2">
          <div className="size-10 rounded-[8px] bg-bento-item border border-border/40 flex items-center justify-center">
            <ShieldCheck className="size-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-[15px] font-black uppercase tracking-[0.2em] text-foreground">
              Admin Login
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
              Management console access
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Email
            </span>
            <span className="flex items-center gap-2 bg-bento-card border border-border/40 rounded-[8px] px-3 focus-within:border-primary/40 transition-colors">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="admin@example.com"
                required
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Password
            </span>
            <span className="flex items-center gap-2 bg-bento-card border border-border/40 rounded-[8px] px-3 focus-within:border-primary/40 transition-colors">
              <LockKeyhole className="size-4 text-muted-foreground shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Password"
                required
              />
            </span>
          </label>
        </div>

        {error ? (
          <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full h-11 bg-foreground text-background rounded-[8px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
