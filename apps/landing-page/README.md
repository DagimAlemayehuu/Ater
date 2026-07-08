# Ater Landing Page & Waitlist Portal

The public landing page and waitlist registration portal for Ater, built with Next.js and styled in strict accordance with the **Ater Industrial Design System (v33.4)**. 

It serves as the front-facing entry terminal for organized professionals seeking to request access to the Ater offline-first sovereign intelligence client.

## Design Highlights (Ater Industrial v33.4)

- **Strict Dark Monochrome**: Employs a premium high-contrast greyscale theme (`surface` #131313, `primary` #e8e8e8, `outline-variant` hairlines).
- **Anti-White Button Rule**: Buttons avoid standard light-grey backgrounds in dark mode, utilizing transparent borders with subtle greyscale active states (`bg-surface-container` on hover).
- **Optical Typography Grid**: Uses Inter for Display Hero titles (72px / 0.9 line-height) and JetBrains Mono for clean, precise technical labels.
- **Surgical Brevity**: Avoids typical SaaS marketing fluff in favor of continuous subject-verb-objective prose, structural MacBook mockups, and transparent waitlist progress queues.

## Core Features

- **Interactive Waitlist Terminal**: High-fidelity registration form allowing prospective users to join the Supabase-backed queue.
- **Product Architecture Briefing**: Clean section modules detailing the Tauri client, native Rust LanceDB vector engines, and custom Obsidian workspace orchestration.
- **Real-Time Client Count**: Displays aggregate stats of waitlist sizes and active activations directly from Supabase.
- **Standardized Industrial Footer**: Strict 3-column structural grid displaying main navigation paths, documentation indices, and real-time network statuses (Version: v33.0).

## Technology Stack

- **Framework**: Next.js (App Router, Server Components)
- **Styling**: Tailwind CSS + Vanilla CSS Tokens
- **Icons**: Lucide React + Material Symbols Outlined
- **Database Client**: Supabase JS SDK (for waitlist submissions and global queue counts)

## Setup & Running Locally

1. Install root workspace packages (`pnpm install`).
2. Add a `.env` file to this folder:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the development server:
   ```bash
   pnpm --filter landing-page dev
   ```

## Security & Environment

- **Production-Only RLS**: The landing page and waitlist portal interact directly with Supabase via Row Level Security (RLS).
- **Mock Bypass Removal**: As of v0.2, the `?bypass=true` mock layer has been completely removed from the landing page to ensure all waitlist interactions are live and authenticated.
