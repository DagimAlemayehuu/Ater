## 2024-05-19 - Removed unnecessary deep clone in HubConnectionsNav

**Learning:** `JSON.parse(JSON.stringify())` on recursive structures (like nested node trees for navigation hubs) inside React renders/memos can act as a massive bottleneck, especially when filtering. Combining map/filter into a single-pass immutable update array construction avoids the need to deep-clone the structure.

**Action:** Look for instances of `JSON.parse(JSON.stringify(tree))` inside `useMemo` hooks, especially where standard map/filter functions mutate children properties. Replace them with single pass reduction or `map` spreading (`...node`).
