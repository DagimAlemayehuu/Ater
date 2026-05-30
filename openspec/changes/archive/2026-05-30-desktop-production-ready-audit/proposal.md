## Why

The Ater desktop application has rich features, a robust unit test suite, and uniform styling, but it lacks the production-grade stability, error resiliency, and security hygiene required for a public release. Hardening the application's offline/online transitions, resolving silent runtime crashes (such as in Supabase realtime subscriptions), cleaning up obsolete code warnings, and ensuring robust error reporting will make it production-ready.

## What Changes

- **Offline/Online Resilience Hardening**: Refactor Supabase mock client to cleanly support chained `.on()` event listener bindings, preventing runtime errors in offline/hybrid dev loops.
- **Secure Error Handling and Toast Feedback**: Integrate production-ready global boundary guards and resilient visual indicators (`sonner` or `Radix Toast`) to cleanly alert users about RLS authentication rejections or DRM lease expiry.
- **Clean Type Checking & Dependency Audit**: Eliminate unused imports (e.g. `clipErr` and `sidecarApi` in settings), fix high-risk explicit `any` declarations, and set up clear error handling for charts container boundaries.
- **Security Footprint & DRM Guarding**: Verify and strengthen Ed25519 lease check flows in Tauri's native Rust layer under debug/release configurations to guarantee licensing robust against bypass.

## Capabilities

### New Capabilities
- `desktop-production-ready-audit`: Comprehensive verification, logging, resilience fixes, and lint cleaning to bring Ater to a robust, launchable standard.

### Modified Capabilities
<!-- None -->
