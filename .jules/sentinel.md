## Sentinel Journal
## 2024-07-03 - [CRITICAL] Prevent Bypass Exploit in Production
**Vulnerability:** Authentication and authorization bypass logic based on URL parameters (e.g., `?bypass=true`) is present in frontend components like `AuthGuard.tsx`, `PageGuard.tsx`, `App.tsx`, and `ConfigContext.tsx`. While some uses check `import.meta.env.DEV`, others do not.
**Learning:** Development-only features left unprotected in production builds allow attackers to bypass critical security controls by simply modifying the URL.
**Prevention:** All debug flags, mock logic, and authentication bypasses must be strictly gated behind environment checks like `import.meta.env.DEV` or completely removed from production builds.
