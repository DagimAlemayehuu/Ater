---
title: Conceptual_Database_Design
type: Atomic Note
course: "[[Database Systems]]"
semester: "[[Autumn 2025]]"
unit: 3
hub: "[[3_Relational_Model_And_Database_Design_Hub]]"
parent: "[[Database_Development_Methodology]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 8
- 9
- 11
mode: ENGINEER

---

# Definition & Mechanics
**Conceptual Database Design** is the process of constructing a model of the data used in an enterprise, independent of all physical considerations. It focuses on identifying the **entities**, **attributes**, **relationships**, and **constraints** that are relevant to the database.

* **Key activities**:
	+ Identifying entities and their relationships
	+ Defining attributes and their domains
	+ Specifying constraints and business rules
* **Output**: a conceptual model, typically represented using an **Entity-Relationship (ER) diagram** and a descriptive text.

# Worked Example
Domain: Film production company

The company wants to design a database to manage information about **movies**, **actors**, and **directors**.

| Entity Type | Attributes |
| --- | --- |
| Movie | movie_id, title, release_year |
| Actor | actor_id, name, birth_date |
| Director | director_id, name, nationality |

```mermaid
erDiagram
    MOVIE ||--o{ ACTS_IN : "stars"
    MOVIE ||--o{ DIRECTED_BY : "directed by"
    ACTOR ||--o{ ACTS_IN : "acts in"
    DIRECTOR ||--o{ DIRECTED_BY : "directs"
    MOVIE {
        int movie_id PK
        string title
        int release_year
    }
    ACTOR {
        int actor_id PK
        string name
        date birth_date
    }
    DIRECTOR {
        int director_id PK
        string name
        string nationality
    }
    ACTS_IN {
        int movie_id FK
        int actor_id FK
    }
    DIRECTED_BY {
        int movie_id FK
        int director_id FK
    }
```

# Edge Case
> **Q:** A university wants to model **courses**, **students**, and **instructors**. A course can have multiple students and one instructor. A student can enroll in multiple courses. Is this a **ternary relationship**?
> **A:** No, this is a **binary relationship** with **multiplicity** constraints. We have two binary relationships: `Course` → `Student` (many-to-many) and `Course` → `Instructor` (one-to-many). A ternary relationship would involve a third entity type directly related to the others in a more complex way.

# Connections
- **Depends on:** [[Database_Development_Methodology]] — Conceptual database design is a phase within the database development methodology.
- **Enables:** [[Entity_Types]] — Understanding conceptual database design enables the identification and definition of entity types.