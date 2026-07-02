## 2024-05-24 - [CRITICAL] Authentication Bypass via URL Parameter in Production
**Vulnerability:** AuthGuard allowed bypassing authentication completely in production builds by simply appending `?bypass=true` to the URL.
**Learning:** While other components (PageGuard, App) correctly gated the bypass behind `import.meta.env.DEV`, `AuthGuard.tsx` missed this check, exposing a critical security gap in the architecture where a developer feature leaked into production.
**Prevention:** Ensure development-only mock logic, debug flags, or authentication bypasses are strictly gated behind `import.meta.env.DEV` checks across the entire codebase to prevent exploitation in production builds. Review all bypass flags.
