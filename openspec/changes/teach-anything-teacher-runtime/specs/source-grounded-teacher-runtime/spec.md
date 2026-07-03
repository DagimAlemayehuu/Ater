## ADDED Requirements

### Requirement: Synthetic source packs are accepted sources
The source-grounded teacher runtime SHALL accept synthetic source packs as first-class auditable sources.

#### Scenario: Synthetic source enters graph service
- **WHEN** a prompt teacher job creates a synthetic source pack
- **THEN** the source runtime SHALL build concept graph nodes with citations to synthetic source pack sections
- **THEN** provenance and confidence SHALL remain visible in coverage state

#### Scenario: Synthetic and PDF sources remain distinguishable
- **WHEN** source status is shown to the user
- **THEN** the runtime SHALL distinguish PDF/user-provided sources from generated synthetic source material

