<!--
[TEMPLATE: THE GLOBAL ERROR TRACKER]
Instructions for the Inquisitor (Tester) and Detective (Debugger) (Delete this block before use):
The Inquisitor writes failed tests here. The Detective reads this file, fixes the bugs, and clears the entries.
-->

# Global Bug Registry
## 1. Active Integration Bugs
> List issues that span across multiple domains or that slipped past local testing.

*   *(Empty)*

## 2. Active E2E Test Failures
> Paste Playwright/Cypress error logs here. The Detective Agent will use this to debug.

*   *(Empty)*

## 3. Resolved Issues Log
> Keep a history of fixed bugs so the system learns from its mistakes.

*   **[2026-04-21] Ater Hub Deployment Failure**: Fixed a `TypeError` in ` AterDeployer.deploy_hub_note` signature and a schema drift in `SovereignPlan` that caused Hub notes to be mislocated in the Academic root instead of the Study Planner. Also removed a destructive logic block in `service.py` that was overwriting full hubs with empty stubs.
*   **[2026-04-21] Project Directory Contamination**: Removed 50+ redundant logs, build artifacts (`dist/`, `build/`), and macOS metadata (`.DS_Store`) to achieve a clean project structure.
