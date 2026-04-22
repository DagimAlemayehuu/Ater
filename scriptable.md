# LifeOS Mobile: Scriptable Bridge Architecture

This document provides a deep dive into how the LifeOS mobile client operates within the **Scriptable iOS environment**.

---

## 1. The Core Architecture
The system consists of three distinct layers:

### A. The Native Host (LifeOs_Mobile.js)
The entry point that orchestrates the Scriptable environment:
-   **NativeBackend Class**: Handles disk I/O (`FileManager`), Network requests (`Request`), and Universal AI routing.
-   **Native Configuration**: Stores settings in `lifeos_config.json` within the iOS documents directory.
-   **WebView Instance**: Loads the shell and injects the React engine.

### B. The Resilient Communication Bridge
Communication between the `WebView` and Scriptable script uses a Base64-optimized async message bus:
-   **Frontend → Native**: `window.LifeOS.send(type, payload)` via `webkit.messageHandlers`.
-   **Native → Frontend**: `webview.evaluateJavaScript()` calls `window.LifeOS.onResponse(requestId, data, error)`.

### C. The React Frontend (mobile-client)
A standard React application compiled into an **IIFE Library Bundle**. It is injected directly into the `WebView` using Base64 encoding to prevent parsing errors.

---

## 2. Universal AI Bridge
Mobile LifeOS supports multiple reasoning engines natively on iOS:
-   **Google Gemini**: Direct REST integration via Scriptable `Request`.
-   **OpenAI / Groq / OpenRouter**: Routed through an OpenAI-compatible endpoint.
-   **Anthropic**: Full Claude 3.5 support.

Keys are stored securely in the native filesystem, never in browser `localStorage`.

---

## 3. High-Performance Injection
To avoid "White Page" hangs, LifeOS uses a **Streaming Bootloader**:
1.  **HTML Shell**: Renders a black background and `SYNCING_SYSTEM` spinner instantly.
2.  **URL/Fetch Shims**: Overrides `window.URL` to handle the `app://lifeos.local` origin, preventing parsing malfunctions.
3.  **Base64 Evaluation**: Injects the core JavaScript logic as a Base64 blob, which iOS parses faster and more reliably than raw template literals.

---

## 4. Deployment Workflow

Handled by `scratch/bundle_scriptable.py`:
1.  **IIFE Build**: Vite bundles the project into a single non-module file.
2.  **Base64 Encoding**: Converts assets into safe transport strings.
3.  **Template Synthesis**: Merges the `NativeBackend` with the encoded frontend.

---

## 5. Persistence & Settings
Settings are managed in the **Settings > Infrastructure** tab:
-   **Obsidian Vault Path**: Requires the absolute iOS path (e.g., `/private/var/mobile/Library/Mobile Documents/iCloud~md~obsidian/Documents/VaultName`).
-   **AI Stack**: Multi-provider registry for primary, planner, and utility reasoning tiers.
