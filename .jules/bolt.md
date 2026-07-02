## 2024-07-02 - [Interval removal in App Sidebar]
**Learning:** `activeConvTitle` was updating every 2s via interval, but it was nowhere used in the UI for the sidebar.
**Action:** Removed state & interval safely.
