# RAG & Notion Backend Tasks

## 🟢 Completed
- [x] **Hierarchical Mirroring**: Ported Notion macro-categorization logic to backend for folder structures.
- [x] **Individual Page Sync**: Switched from monolithic files to one .md file per Notion page.
- [x] **YAML Injection**: Automated property mapping to Obsidian frontmatter.
- [x] **Progress Callbacks**: Added real-time status reporting for sync operations.
- [x] **Robust RAG**: Integrated ChromaDB with local embeddings for $0 cost search.
- [x] **Escape YAML Newlines**: Fixed crash during sync caused by unescaped newlines in Notion properties.
- [x] **Large DB Support**: Implemented pagination for Notion database queries and block extraction (>100 items).
- [x] **Search Tuning**: Adjusted RAG k-results to 20 for optimal context injection.

## 🟡 In Progress
- [ ] **Hybrid Search**: Integrating BM25 with Vector search for better keyword matching.

## 🔴 Blocked
- None.
