# ADR-0005: Tauri v2 Desktop Shell

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Ater is designed as a desktop-native interface. Building cross-platform desktop interfaces requires a framework that compiles to macOS, Windows, and Linux. While Electron is the industry default, it packages the entire Chromium rendering engine, leading to excessive resource consumption and security risks. Ater requires native system security, lightweight execution, and clean access to system APIs (machine ID, cryptographic storage).

## Decision

Utilize **Tauri v2** as the desktop application shell.
- The user interface is built using React and compiled to static assets, which Tauri renders using the operating system's native webview (WebKit on macOS, WebView2 on Windows).
- System-level operations (filesystems, child process control, machine signature retrieval, cryptographic vaults) are implemented in Rust in the `src-tauri` workspace.
- The Rust layer exposes commands to the UI using Tauri's IPC message bus (`invoke` calls).

## Alternatives Considered

**Electron**: Rejected. Electron apps consume substantial memory (often >200MB RAM idle) and produce bundle installers exceeding 150MB. Furthermore, writing secure system calls in JavaScript requires complex Node-native modules, whereas Rust provides memory-safe system APIs out of the box.

**Pure Native App (Swift / C#)**: Rejected. Writing separate codebases for macOS and Windows increases development timelines and makes it impossible to share UI components.

## Consequences

**What becomes easier**:
- Performance: Idle RAM consumption remains low (typically under 50-80MB), and startup is nearly instantaneous.
- Security: Rust provides a memory-safe boundary for accessing sensitive APIs. Tauri's Stronghold integration enables secure local credential caching.
- Installer footprint: The compiled app binary is extremely small (excluding sidecar assets).

**What becomes harder**:
- Webview discrepancies: Because Tauri relies on native OS webviews rather than a bundled Chromium instance, CSS styling and Javascript APIs can behave slightly differently between WebKit (macOS) and WebView2 (Windows). (Mitigation: Comprehensive E2E cross-browser testing is enforced).
