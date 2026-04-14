# Global Skills & Capabilities

This document defines the specialized skills and autonomous protocols available to all agents in the monorepo.

## Available Skills

### stitch-design
Unified entry point for Stitch design work. Handles prompt enhancement (UI/UX keywords, atmosphere), design system synthesis (`.stitch/DESIGN.md`), and high-fidelity screen generation/editing via Stitch MCP.
- **Tools**: `stitch_mcp:*`
- **Goal**: High-fidelity UI generation.

### stitch-loop
Generates a complete multi-page website from a single prompt using Stitch, with automated file organization and validation.
- **Workflow**: Iterative baton-passing between agent turns.
- **File Structure**: `.stitch/SITE.md`, `.stitch/next-prompt.md`.

### design-md
Analyzes Stitch projects and generates comprehensive `DESIGN.md` files documenting design systems in natural, semantic language optimized for Stitch screen generation.
- **Output**: `.stitch/DESIGN.md` (The design law for generation).

### enhance-prompt
Transforms vague UI ideas into polished, Stitch-optimized prompts. Enhances specificity, adds UI/UX keywords, injects design system context, and structures output for better generation results.

### react:components
Converts Stitch screens to React component systems with automated validation and design token consistency.
- **Process**: Extraction of HTML/CSS -> Modular React components -> Shadcn primitives.

### remotion
Generates walkthrough videos from Stitch projects using Remotion with smooth transitions, zooming, and text overlays to showcase app screens professionally.

### shadcn-ui
Expert guidance for integrating and building applications with shadcn/ui components. Helps discover, install, customize, and optimize shadcn/ui components with best practices for React applications.
