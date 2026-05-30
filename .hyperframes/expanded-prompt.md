# Expanded Production Prompt: Ater Desktop App Trailer

Visual Identity: Derived from `/Users/dabodestroyer/code/Antigravity/Ater/DESIGN.md` (Outfit typography, monochromatic de-warmed neutrals, flat-asymmetric Bento layouts, steel border #242426 accents).

## 🚀 Rhythm & Pacing Spec
Rhythm Pattern: `SLAM-proof-SLAM-hold` (High-energy launch teaser)
Total Duration: 20 seconds
Target Resolution: 1920x1080 (Landscape DESKTOP preview format)

---

## 🎬 Scene Breakdown

### Scene 1: The Genesis Node (0.0s - 4.0s)
*   **Concept**: A dark industrial void where the global brand font "Outfit" stamps the sovereign node title with massive kinetic scale, evoking a premium scientific instrument booting up.
*   **Mood Direction**: Cinematic brutalism, Swiss typography grid, cold and precise laboratory terminal.
*   **Depth Layers**:
    *   **Background (BG)**: Deep charcoal steel (`#111113`) canvas, with a subtle radial coordinate grid (monospace lat/long marks like `N 52° 31' / E 13° 24'`) fading in.
    *   **Midground (MG)**: Centered Outfit title "ATER" at an extreme scale (`240px`), surrounded by a thin hairline outline box that snaps to fit the text boundaries.
    *   **Foreground (FG)**: Faint tick marks and micro horizontal divider lines (`#242426`) animating from the center outwards.
*   **Animation Choreography**:
    *   `#s1-bg-grid` drifts slowly downwards (`y` moves by `20px` over `4s`).
    *   `#s1-brand-title` SLAMS into place from `scale: 1.4` and `opacity: 0` to `scale: 1.0` at `0.2s` with high-tension ease (`expo.out`).
    *   `#s1-outline-box` snaps shut via `stroke-dashoffset` or clip-path sweep exactly at `0.5s`.
    *   `#s1-sub` types on character by character at `0.7s` below the title.
*   **Transition Out**: Whip pan left (`x: -400px`, `blur: 24px`, `0.35s`, `power3.in`).

### Scene 2: The Core Workspace (4.0s - 9.0s)
*   **Concept**: Transitioning from text to the high-density desktop environment. A beautiful, clean Bento mock layout of Ater (Sidebar, CENTRAL Monaco editor, right ast status inspector) cascading into existence.
*   **Mood Direction**: Technical blueprint, premium Tauri app frame, high information density.
*   **Depth Layers**:
    *   **Background (BG)**: Vertical matrix lines drifting right.
    *   **Midground (MG)**: High-density Tauri container panel (`#151517` with 1px border `#242426`) cascading three distinct Bento cards:
        1. Left Sidebar Navigation (file explorer mock).
        2. Central Monaco Editor (rendering structured Rust/TypeScript AST parser code).
        3. Right Ast inspector (quizzes, AST status charts).
    *   **Foreground (FG)**: Accent tooltip highlights pointing to AST nodes.
*   **Animation Choreography**:
    *   Tauri container panel SLIDES in from bottom-center at `4.3s`.
    *   Three Bento cards CASCADE from left-to-right (staggered by `150ms`, entering via `y: 40px` and `opacity: 0` with `power3.out`).
    *   Mock cursor moves precisely to ast element, causing a subtle state hover popover at `6.5s` (80ms transition).
*   **Transition Out**: Zoom through (`scale: 1.2`, `blur: 20px`, `0.3s`, `power3.in`).

### Scene 3: The Agentic Engine (9.0s - 14.0s)
*   **Concept**: Diving deep into Ater's telemetry and RLS compiler engine. Code ast trees parsing dynamically while telemetry curves map active token transactions.
*   **Mood Direction**: Machined logic, telemetry dashboard, high-velocity data feeds.
*   **Depth Layers**:
    *   **Background (BG)**: Faint monospace telemetry terminal logs flowing vertically.
    *   **Midground (MG)**: Live telemetry chart. SVG curves draw dynamically in the center, and a radial tree diagram (AST nodes) pulses with active compiler cycles.
    *   **Foreground (FG)**: Alert dialog flashing "COMPILER OK / AST SECURE" in pure steel primary accent.
*   **Animation Choreography**:
    *   `#s3-telemetry-path` DRAWS dynamically via `stroke-dashoffset` over `2.5s` starting at `9.5s`.
    *   AST nodes PULSE sequentially with scaling from `1.0` to `1.2` and glowing borders staggered by `80ms`.
    *   Monospace coordinate tickers count up rapidly from `0` to `100%` compile completion.
*   **Transition Out**: Vertical whip pan upward (`y: -300px`, `blur: 20px`, `0.3s`, `power2.in`).

### Scene 4: Join the Sovereign Node (14.0s - 20.0s)
*   **Concept**: Resolution and Call to Action. The approved cryptographic key card "ATER-XJ9K4P2L" enters center frame with clean steel borders, inviting the user to claim their activation key.
*   **Mood Direction**: Editorial authority, Swiss design finish, absolute dark-mode premium resolution.
*   **Depth Layers**:
    *   **Background (BG)**: Very slow radial gradient glow pulsing from absolute center.
    *   **Midground (MG)**: Ater keycard in the center, displaying the cryptographic node key. Underneath, a solid steel highlight button: "DOWNLOAD TAURI NODE".
    *   **Foreground (FG)**: Outfit title "ATER SOVEREIGN NODE" and version tagline. Faint copyright metadata tick in the bottom footer.
*   **Animation Choreography**:
    *   `#s4-keycard` SLAMS into place from `y: 80px`, `rotation: -3deg`, and `opacity: 0` to standard alignment at `14.5s`.
    *   Cryptographic key codes reveal with a clean monospace typewriter effect.
    *   `#s4-cta-btn` fades in with a physical scale spring feedback (`scale: 0.9` to `1.0`) at `15.5s`.
    *   Final screen elements fade to absolute black slowly at `19.0s` - `20.0s`.

---

## 🚫 Negative Prompt (What NOT to Do)
*   **No Purple/Violet**: Strictly respect the Purple Ban. Gradients must use industrial de-warmed neutrals (`#111113`, HSL 240 gray scales).
*   **No Bento Box Grids on Landing Pages unless detailed**: Only use structured, asymmetric layout panels inside the mockup itself.
*   **No jump cuts without transitions**: Every scene transition is meticulously velocity-matched.
