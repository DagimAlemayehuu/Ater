# ADR-0003: Obsidian Vault as Primary Note Database

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Most knowledge management tools lock user data inside binary SQLite databases or remote cloud data centers. This restricts portability, prevents integration with external text editors, and violates the privacy concerns of technical students and engineers. Ater requires a storage mechanism that is offline-first, future-proof, and easily readable by other tools.

## Decision

Use a standard local Obsidian Vault (a directory containing structured Markdown files, images, and PDF assets) as the primary database for notes.
- Ater reads and writes notes directly as plain text `.md` files.
- Metadata (such as course associations, stability scores, tags, and unit links) is serialized into the YAML frontmatter block at the top of each note.
- Quizzes are serialized as JSON data and embedded inside a ````interactive-quiz` markdown code block at the bottom of notes.
- Filesystem folders (e.g. `Notes/`, `Inbox/`, `database/`) establish the data model.

## Alternatives Considered

**Relational SQLite DB for note contents**: Rejected. While SQLite provides easy relational querying, it makes it impossible for users to edit their notes in external applications (like Obsidian, VS Code, or Typora) and risks complete data loss if the application database becomes corrupted.

**Central Cloud Document DB (Supabase/Firestore)**: Rejected. Violates the core offline-first invariant.

## Consequences

**What becomes easier**:
- Complete data portability: Users own their notes. If they stop using Ater, their knowledge vault remains fully functional in any Markdown viewer.
- Interoperability: Users can use external Obsidian plugins (e.g., Dataview, force-graphs) alongside Ater.

**What becomes harder**:
- Search efficiency: Querying notes requires scanning file structures recursively. (Mitigation: metadata is cached in a local SQLite index `ater.db` and searched offline via local vector embeddings).
- Concurrency issues: Writes must be atomic to prevent race conditions with Obsidian's internal filesystem indexers. (Mitigation: files are written to a temp file first and swapped atomically via `os.replace`).
