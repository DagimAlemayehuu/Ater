# Ater Admin Portal

The administrative control center for Ater, built with Next.js (App Router, Tailwind, Shadcn UI) and directly integrated with the Supabase backend. It allows administrators to govern waitlist applications, enforce DRM hardware bindings, and audit system usage statistics.

## Core Responsibilities

- **Waitlist Management**: Interface to view, approve, reject, or revoke access for waiting list applicants in real-time (integrated via Supabase real-time channels).
- **Hardware Binding & DRM Enforcement**: 
  - Governs user profiles and hardware registration ("Burn-In" locks).
  - Approves initial client machine bindings and manages hardware resets or access revocations via Row Level Security (RLS) policies.
- **System Usage Auditing**: Monitors global token counts, API call rates, and telemetry logs submitted by the distributed Ater clients.
- **Admin Authentication**: Secure gatekeeping using Supabase Auth (Cookie-based session persistence and role validation).

## Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Styling & UI**: Tailwind CSS + Shadcn UI (Monochrome High-Fidelity theme matching the Ater ecosystem design system)
- **Database Client**: Supabase Client SDK (`@supabase/supabase-js`)
- **Icons**: Lucide React

## Setup & Local Development

1. Ensure the root dependencies are installed (`pnpm install`).
2. Configure `.env.local` inside this directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
   Or launch it from the root workspace using Turborepo filter commands:
   ```bash
   pnpm --filter admin dev
   ```
