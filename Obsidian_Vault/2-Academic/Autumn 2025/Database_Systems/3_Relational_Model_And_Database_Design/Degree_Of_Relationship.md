---
title: Degree_Of_Relationship
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Relationship_Types]]
source: [[Chapter_3.Pdf]]
source_pages:
- 22
- 23
mode: ENGINEER

---

# Definition & Mechanics
The **degree of a relationship** refers to the number of entity types that participate in a relationship. 
* **Unary relationship**: one entity type participates (e.g., a manager manages other managers).
* **Binary relationship**: two entity types participate (e.g., a staff member works at a branch).
* **Ternary relationship**: three entity types participate (e.g., a staff member registers a client at a branch).
* **Quaternary relationship**: four entity types participate.

# Worked Example
Domain: Film production

Suppose we have a relationship called `Arranges` involving four entity types: 
- `Film`
- `Cinematographer`
- `Screenwriter`
- `Producer`

This is a **quaternary relationship** because four entity types participate.

```mermaid
erDiagram
    FILM ||--o{ ARRANGES : "features"}
    CINEMATOGRAPHER ||--o{ ARRANGES : "works with"}
    SCREENWRITER ||--o{ ARRANGES : "collaborates with"}
    PRODUCER ||--o{ ARRANGES : "produces"}
```

# Edge Case
> **Q:** A university has a relationship called `Teaches` between `Professor` and `Student`. Is this relationship unary, binary, or ternary?
> **A:** This is a **binary relationship**. Although a professor may teach many students and a student may be taught by many professors (in a many-to-many scenario), the basic `Teaches` relationship as described is between two entity types: `Professor` and `Student`. If a professor teaches themselves (which is unusual but possible), it could be considered a **unary relationship**, but based on the typical interpretation, it is binary.

# Connections
- **Depends on:** [[Relationship_Types]] — Understanding relationship types is essential to determining the degree of a relationship.
- **Enables:** [[Multiplicity]] — Knowing the degree of a relationship helps in defining the multiplicity constraints.