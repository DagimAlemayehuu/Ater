## ADDED Requirements

### Requirement: Source graph compilation input
The Atomic Note compiler SHALL accept source-grounded concept graph nodes and deterministic teaching profiles as compilation input.

#### Scenario: Compile from concept graph node
- **WHEN** the compiler receives a concept graph node with title, source pages, source excerpts, prerequisites, domain, modality, and teaching profile
- **THEN** it SHALL produce an Atomic Note candidate with deterministic frontmatter, section headings, source citations, artifact constraints, and quiz schema

#### Scenario: Missing source pages fail grounding
- **WHEN** a concept graph node lacks source pages and no explicit unresolved-source warning exists
- **THEN** the compiler SHALL reject the node as not source-grounded
- **THEN** it SHALL not deploy the note as a completed source-grounded Atomic Note

### Requirement: Dynamic profile controls note shape
The Atomic Note compiler SHALL use the selected teaching profile to control note headings, artifact type, prohibitions, and assessment modes.

#### Scenario: Economics quantitative artifact constraints
- **WHEN** compiling an `ECON-MICRO` quantitative concept such as `Budget Line`
- **THEN** the compiler SHALL allow LaTeX, Markdown tables, and ASCII graphs
- **THEN** it SHALL reject Python, R, Java, or unrelated programming artifacts unless the source explicitly requires code

#### Scenario: Comparative concept uses contrast structure
- **WHEN** compiling a comparative concept such as cardinal versus ordinal utility
- **THEN** the compiler SHALL require contrast-oriented prose, a comparison artifact, and at least one assessment that tests the distinction

### Requirement: AI-minimized compiler validation
The Atomic Note compiler SHALL validate AI-generated content against deterministic source, profile, and schema constraints.

#### Scenario: Malformed AI output repaired or replaced
- **WHEN** AI output is missing required sections, malformed quiz JSON, forbidden artifact types, or valid citations
- **THEN** the compiler SHALL repair it when deterministic repair is safe
- **THEN** otherwise it SHALL replace the invalid portion with a deterministic fallback

#### Scenario: Fallback note remains valid
- **WHEN** all AI attempts fail for a source-grounded concept
- **THEN** the compiler SHALL produce a valid fallback Atomic Note from source excerpts when possible
- **THEN** the note SHALL include fallback metadata and SHALL remain parseable by the lesson compiler

