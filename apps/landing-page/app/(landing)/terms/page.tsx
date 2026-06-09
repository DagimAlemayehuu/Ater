import React from "react";

export default function TermsPage() {
  return (
    <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full pt-28 pb-20 overflow-hidden border-b border-outline-variant">
      <div className="industrial-container w-full max-w-3xl mx-auto flex flex-col gap-12 px-4 md:px-8">
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-display-hero !leading-[0.9] uppercase text-foreground">
            Terms of Service
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Last Updated: June 9, 2026
          </p>
        </div>

        <div className="prose prose-stone dark:prose-invert max-w-none text-[13px] text-foreground/80 space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing the Ater application platforms, including this website and the desktop client,
              you agree to be bound by these Terms of Service. If you do not agree, you are prohibited from
              activating the application lease or utilizing its analytical interfaces.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              2. License Activation & DRM
            </h2>
            <p>
              Usage of the Ater Desktop application requires a valid, cryptographically signed lease key.
              Leases are issued to approved waitlist accounts and are subject to periodic verification.
              Standard users are prohibited from attempting to bypass RLS policies, spoof status variables,
              or reverse-engineer the lease validation signatures.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              3. Local Workspace Security
            </h2>
            <p>
              Because your workspace vaults and databases live locally on your computer, you are solely
              responsible for managing directory permissions and performing file backups. Ater does not provide
              cloud synchronization or data recovery solutions for your local markdown notes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              4. Termination of Access
            </h2>
            <p>
              We reserve the right to suspend or ban account leases if we detect billing irregularities,
              systemic API scraping, or hardware blacklist matches. Terminated leases block server-side features,
              but do not modify or restrict access to your local notes directory.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
