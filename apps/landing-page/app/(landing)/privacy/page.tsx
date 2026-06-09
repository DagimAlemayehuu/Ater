import React from "react";

export default function PrivacyPage() {
  return (
    <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full pt-28 pb-20 overflow-hidden border-b border-outline-variant">
      <div className="industrial-container w-full max-w-3xl mx-auto flex flex-col gap-12 px-4 md:px-8">
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-display-hero !leading-[0.9] uppercase text-foreground">
            Privacy Policy
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Last Updated: June 9, 2026
          </p>
        </div>

        <div className="prose prose-stone dark:prose-invert max-w-none text-[13px] text-foreground/80 space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              1. Local-First Sovereignty
            </h2>
            <p>
              Ater is designed as a local-first study engine. Your notes, class slides, parsed PDFs,
              and index databases reside entirely on your physical storage device. We do not transmit,
              replicate, or store your personal files or study contents on remote cloud servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              2. Vector Embeddings & Local Inference
            </h2>
            <p>
              Retrieval-Augmented Generation (RAG) vector embeddings and tokenization are computed
              locally on your system. No document content is uploaded to external AI APIs for vector indexing
              or processing. Your local notes never leave your system for semantic parsing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              3. Telemetry and Analytics
            </h2>
            <p>
              For system diagnostic and credit ledger verification purposes, Ater communicates basic telemetry
              parameters with our secure backend API. This data includes account authentication state,
              lease cryptographic signatures, system hardware hashes, and resource utilization counters.
              No note body text or academic file content is ever collected or monitored.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              4. Data Protection & Deletion
            </h2>
            <p>
              You maintain full ownership and custody of your data. To permanently erase your account ledger
              and waitlist registrations, you may trigger the delete operation from your dashboard profile settings,
              which purges authenticated metadata within 30 days. Local workspaces can be wiped by removing the local
              directory from your system storage.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
