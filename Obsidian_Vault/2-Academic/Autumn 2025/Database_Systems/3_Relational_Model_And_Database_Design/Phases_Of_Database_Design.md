---
title: Phases_Of_Database_Design
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Database_System_Development_Lifecycle]]
source: [[Chapter_3.pdf]]
source_pages:
- 7
- 8
mode: ENGINEER

---

# Definition & Mechanics
The **phases of database design** are the stages involved in creating a database, categorized into three main phases: **conceptual**, **logical**, and **physical** design.

* **Conceptual Database Design**: Construct a model of the data used in an enterprise, independent of all physical considerations.
* **Logical Database Design**: Construct a model of the data used in an enterprise based on a specific data model (e.g., relational) and dependent on a particular DBMS but independent of other physical considerations.
* **Physical Database Design**: Produce a description of the implementation of the database on secondary storage, including base relations, file organizations, indexes, and integrity constraints.

# Worked Example
Domain: Film production company

Suppose a film production company wants to design a database to manage its operations. The company has the following requirements:

* Store information about films, directors, and actors.
* Each film has a unique title, release year, and director.
* Each director has a name and a list of films they have directed.
* Each actor has a name and a list of films they have acted in.

The phases of database design can be applied as follows:

1. **Conceptual Design**: Identify entities (Film, Director, Actor), attributes (title, release_year, name), and relationships (directed_by, acted_in).
2. **Logical Design**: Define the relational schema, including tables for Film, Director, and Actor, with their respective attributes and relationships.
3. **Physical Design**: Specify the storage details, such as file organizations and indexes, to optimize query performance.

# Edge Case
> **Q:** A company wants to design a database for its e-commerce platform. The platform has a complex pricing system that depends on multiple factors, including product category, customer location, and order total. Is it better to handle this complexity in the conceptual, logical, or physical design phase?
> **A:** The complexity of the pricing system should be handled in the **logical design** phase. This is because the logical design phase involves defining the relational schema and constraints, which can accommodate the complex pricing rules and calculations. The conceptual design phase focuses on identifying entities and relationships, while the physical design phase focuses on storage and performance optimization.

# Connections
- **Depends on:** [[Database_System_Development_Lifecycle]] — The phases of database design are part of the larger database system development lifecycle.
- **Enables:** [[Conceptual_Database_Design]], [[Logical_Database_Design]], [[Physical_Database_Design]] — Mastering the phases of database design enables a deeper understanding of each specific design phase.