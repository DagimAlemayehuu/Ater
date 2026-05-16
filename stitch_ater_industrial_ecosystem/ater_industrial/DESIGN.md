---
name: Ater Industrial
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c6'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#484949'
  on-secondary-container: '#b8b8b8'
  tertiary: '#ffffff'
  on-tertiary: '#313031'
  tertiary-container: '#e5e2e2'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e5e2e2'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474647'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '900'
    lineHeight: '0.9'
    letterSpacing: -0.05em
  section-heading:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '900'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  micro-label:
    fontFamily: Inter
    fontSize: 9px
    fontWeight: '900'
    lineHeight: '1'
    letterSpacing: 0.2em
  technical-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: 0.05em
spacing:
  container-max: 1280px
  section-py-lg: 8rem
  section-py-sm: 6rem
  gutter: 1.5rem
  unit: 4px
---

# Ater Design System — Ground Truth Specification (v34.0)

> **North Star:** "Surgical Clarity" — A website built for technical experts. **Use Simple English only.** No marketing fluff. Use short, objective sentences.

---

## 1. Color System (True Dark Mode)
- **Background:** `surface` (#000000). Pure black base for infinite contrast.
- **Foreground:** `on-surface` (#e2e2e2).
- **Accent/Text:** `primary` (#e8e8e8).
- **Borders:** `outline-variant` (#444748).

---

## 2. Typography & Optical Alignment
- **Hero Display:** `display-hero` (72px / 0.9).
- **Heading Alignment:** All headings must have zero horizontal offset. The left stroke of the first character must touch the container boundary.
- **Copy Logic:** Subject-Verb-Object. No metaphors.

---

## 3. Component Manifest

### The Anti-White Button Rule
- **CRITICAL:** Never use a white or light-grey background for buttons in Dark Mode. 
- **Button Style:** `border border-outline bg-transparent text-on-surface`.
- **Hover/Active:** `bg-surface-container text-on-surface`.

### Global Structural Footer
- **Structure:** 3-column centered grid.
- **Column 1:** Navigation (HOME, PRODUCT, PRICING, CONTACT).
- **Column 2:** Documentation (MANUAL, API, PRIVACY, TERMS).
- **Column 3:** Status (SYSTEM STATUS: ONLINE, VERSION: v34.0).
- **Style:** `text-micro-label opacity-30 py-12 border-t border-outline-variant`.

---

## 4. Layout: Vertical Rhythm
- **Containers:** `max-w-[1280px] mx-auto px-6`.
- **Dividers:** Every page section is separated by a 1px `outline-variant` hairline.
- **Mockups:** MacBook mockups must be perfectly centered within a section.

---

# [END OF SPECIFICATION]