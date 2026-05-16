---
name: Industrial V33.4
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c6'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636465'
  inverse-primary: '#5d5f5f'
  secondary: '#c5c7c8'
  on-secondary: '#2e3132'
  secondary-container: '#444748'
  on-secondary-container: '#b3b5b6'
  tertiary: '#fffeff'
  on-tertiary: '#342f2d'
  tertiary-container: '#eae0dd'
  on-tertiary-container: '#696360'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#444748'
  tertiary-fixed: '#eae0dd'
  tertiary-fixed-dim: '#cec4c2'
  on-tertiary-fixed: '#1f1b19'
  on-tertiary-fixed-variant: '#4b4543'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '900'
    lineHeight: 58px
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 29px
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '900'
    lineHeight: 22px
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.1em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0em
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for high-density information environments, developer tools, and industrial interfaces. It prioritizes technical precision over aesthetic flourish, adopting a **Minimalist-Brutalism** hybrid. 

The brand personality is authoritative, systematic, and uncompromising. The target audience includes engineers, developers, and data analysts who require a "tool-first" experience. The interface should evoke a sense of structural integrity and cold efficiency. Every element exists for a functional purpose, utilizing "Pure Black" foundations to eliminate visual noise and reduce eye strain in professional settings.

## Colors

The palette is strictly monochromatic and utilitarian, rooted in a true black (#000000) foundation. 

- **Foundation:** Pure Black (#000000) is used for the base background to provide maximum contrast.
- **Surface Tiers:** `Surface` (#131313) is used for primary UI containers. `Surface-Container-Low` and `High` create subtle structural hierarchy without the need for elevation or shadows.
- **Typography:** `On-Surface` (#e2e2e2) provides high legibility for data and content.
- **Structural:** `Outline` (#444748) is the primary method for defining boundaries, used for hairlines and borders.

## Typography

Typography is used as a structural element. 

**Headlines:** Utilize "Inter font-black" with tight tracking and a 0.9 line-height ratio. This creates a dense, "blocky" aesthetic reminiscent of industrial signage. Large display sizes should feel heavy and architectural.

**Labels:** All UI labels and metadata utilize "JetBrains Mono" at 9px. These must be set in uppercase with increased letter spacing to ensure legibility at small scales. 

**Body:** Standard reading text remains in Inter for maximum clarity, maintaining a functional contrast between the brutalist headlines and technical labels.

## Layout & Spacing

This design system employs a **Fixed Grid** model based on a 4px baseline unit. 

- **Grid:** Use a 12-column grid for desktop with 16px gutters. For mobile, collapse to a 4-column grid.
- **Alignment:** Every element must align strictly to the 4px grid. 
- **Density:** Spacing is compact. Use `stack-sm` for related technical data and `stack-md` for standard component separation.
- **Margins:** Containers should utilize internal padding that mirrors the external gutter size to maintain a "nested box" appearance.

## Elevation & Depth

This system rejects the concept of physical depth. There are **no shadows** or ambient blurs.

Depth is communicated exclusively through **Tonal Layers** and **Hairline Outlines**:
1. **Level 0 (Base):** Pure Black (#000000).
2. **Level 1 (Surface):** #131313 with a 1px #444748 outline.
3. **Level 2 (Active/High):** #2a2a2a for hovered or focused states.

All separation between components is achieved through the #444748 hairline border. In high-density layouts, borders should collapse so adjacent elements share a single-pixel divider.

## Shapes

The geometry of this design system is strictly **orthogonal**. 

All corner radii are set to **0px**. This includes buttons, input fields, cards, and modal windows. The sharp geometry reinforces the industrial nature of the system and ensures that hairlines align perfectly with the pixel grid without anti-aliasing artifacts.

## Components

**Buttons:** Rectangular blocks with a 1px #444748 border. Primary buttons use #e2e2e2 background with #131313 text. Secondary buttons use #131313 background with #e2e2e2 text. No hover transitions; state changes should be instantaneous.

**Input Fields:** #000000 background with a permanent 1px #444748 border. Focus state is indicated by changing the border color to #e2e2e2. Use JetBrains Mono for input text.

**Labels/Chips:** Small rectangular tags with #1b1b1b background and 9px JetBrains Mono uppercase text.

**Lists:** Data rows separated by 1px #444748 horizontal rules. Use JetBrains Mono for tabular data to ensure alignment.

**Cards:** No shadows. Defined solely by the #131313 surface and #444748 border. Header sections within cards should be separated by a hairline rule.

**Data Grids:** High-density tables with collapsed borders. Every cell is a strict rectangle. Header cells use the `label-caps` typography style.