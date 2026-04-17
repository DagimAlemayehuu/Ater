---
title: Database_Development_Methodology
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Information_System]]
source: [[Chapter_3.Pdf]]
source_pages:
- 3
- 4
- 5
mode: ENGINEER

---

# Definition & Mechanics
**Database Development Methodology (DDLC)** is a structured approach to developing a database, ensuring it meets the organization's needs. It involves:
* **Phases**: a series of steps to design, implement, and maintain a database.
* **Life cycle**: the entire process from planning to maintenance.

The DDLC consists of:
* **Database planning**: defining the scope and objectives.
* **System definition**: identifying the system's boundaries.
* **Requirements collection and analysis**: gathering user requirements.

# Worked Example
Domain: Film production company

| Phase | Description |
| --- | --- |
| Database Planning | Define project scope and objectives |
| System Definition | Identify system boundaries and stakeholders |
| Requirements Collection | Gather requirements from producers and directors |

Suppose we are developing a database for a film production company. The methodology would guide us through:
1. Planning: Define the project's scope and objectives.
2. System definition: Identify the system's boundaries and stakeholders.

```mermaid
graph LR
    A[Database Planning] --> B[System Definition]
    B --> C[Requirements Collection]
```

# Edge Case
> **Q:** A startup wants to create a database for their e-commerce platform. They have limited resources and a small customer base. Should they follow the entire DDLC?
> **A:** Yes, but adapt it. For a small-scale project, some phases (e.g., prototyping) might be optional or lightweight. However, skipping the requirements collection phase could lead to a database that doesn't meet user needs.

# Connections
- **Depends on:** [[Information_System]] — Understanding the broader context of information systems.
- **Enables:** [[Conceptual_Database_Design]] — A structured approach to database development enables effective conceptual design.