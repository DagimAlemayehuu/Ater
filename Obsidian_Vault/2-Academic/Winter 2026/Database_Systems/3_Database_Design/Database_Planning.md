---

title: Database_Planning
type: Atomic Note
course: Database Systems
semester: Winter 2026
unit: '3'
hub: "[[3_Database_Design_Hub]]"
source: "[[Chapter_3.pdf]]"
source_pages:
- 4
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Database_Development_Methodology]]"

---

# 1. Mental Model

A database planning process can be likened to constructing a city's infrastructure. Just as urban planners must consider the relationships between different districts (entities) and the roads (relationships) that connect them, database planners must think about how different data entities interact and the rules that govern these interactions. For instance, just as a city's infrastructure is designed with future growth in mind, a well-planned database anticipates future data needs and scalability requirements.

# 2. Schema & Query Mechanics

Database planning involves a series of steps that start with [[Database_Development_Methodology]] and proceed through [[Database_System_Development_Lifecycle]]. The process begins with [[Requirements_Collection_And_Analysis]] to understand the needs of the [[Information_System]], followed by [[Conceptual_Database_Design]] which utilizes the [[Entity_Relationship_Model]] to define [[Entity_Type]]s and their [[Relationship_Type]]s. This conceptual design is then translated into a [[Logical_Database_Design]] and eventually a [[Physical_Database_Design]], which takes into account the specifics of the chosen [[Dbms_Selection]]. Throughout these phases, considerations of [[Cardinality]], [[Multiplicity]], and [[Participation]] are crucial, often visualized through an [[Er_Diagram]].

# 3. ACID Violations & Scaling Limits

Inadequate database planning can lead to issues such as data inconsistencies and scalability problems, particularly when dealing with concurrent transactions that may violate [[Acid]] properties. For example, if a database is not properly normalized, it may suffer from data redundancy, leading to anomalies. Moreover, poor planning can result in a database that cannot scale to meet growing demands, leading to performance degradation and increased risk of failure. As databases grow, [[Dbms_Selection]] and [[Database_Planning]] decisions made early on can significantly impact the system's ability to handle increased load and ensure data integrity.

## 4. Entity-Relationship Model

```mermaid

erDiagram
    AIRCRAFT ||--o{ AVIONIC_SYSTEM : has
    AIRCRAFT ||--o{ FLIGHT_DATA : records
    AVIONIC_SYSTEM }|..|> FLIGHT_DATA : provides
    PILOT ||--o{ FLIGHT_DATA : generates

```

In this Mermaid `erDiagram`, the entities are represented as boxes (e.g., `AIRCRAFT`, `AVIONIC_SYSTEM`, etc.) and the relationships between them are represented as lines. The cardinality of each relationship is indicated by the symbols: `||--o{` represents a 1:N (one-to-many) relationship, and `}|..|>` represents a M:N (many-to-many) relationship, although the latter isn't explicitly shown here but implied through understanding of the context; however, in strict ER diagrams, it would be shown differently.

## 5. Walkthrough

Here are the steps for a walkthrough in the context of Aerospace Engineering & Avionics:

1. **Define Entities**: Identify key entities in the aerospace domain such as `AIRCRAFT`, `AVIONIC_SYSTEM`, `PILOT`, and `FLIGHT_DATA`. Each entity represents a critical component or actor in the system.

2. **Establish Relationships**: Determine how these entities interact. For instance, an `AIRCRAFT` can have multiple `AVIONIC_SYSTEM`s, establishing a 1:N relationship.

3. **Define Cardinality**: Specify the cardinality of each relationship. For example, an `AIRCRAFT` can record multiple `FLIGHT_DATA` entries, indicating another 1:N relationship.

4. **Consider Data Requirements**: Think about the data needs for each entity. For instance, `FLIGHT_DATA` might include information about flight path, speed, and altitude.

5. **Anticipate Scalability**: Plan for future growth. As the aerospace company expands its fleet or adds more avionics systems, the database should be able to accommodate this growth.

6. **Refine and Iterate**: Based on feedback from stakeholders and further analysis, refine the entity-relationship model to ensure it accurately reflects the needs of the aerospace engineering and avionics domain.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A database plan should only consider current data needs.",
    "answer": false,
    "explanation": "A well-planned database should anticipate future data needs, just like a city's infrastructure is designed with future growth in mind."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given that a database is designed for a company with multiple departments, each with its own set of data, what happens when a new department is added?",
    "answer": "The database plan should be flexible enough to accommodate the new department's data needs without requiring a complete overhaul.",
    "explanation": "A good database plan should be scalable and adaptable to changing needs, such as the addition of a new department."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "function calculateTotal(data) {\n  let total = 0;\n  for (let i = 0; i < data.length; i++) {\n    total = data[i].value;\n  }\n  return total;\n}",
    "answer": "The bug is the assignment operator (=) instead of the addition operator (+). The fix is to change the line to 'total += data[i].value;'.",
    "explanation": "The code is intended to calculate the total value of a set of data, but the current implementation overwrites the total value on each iteration instead of accumulating it."
  }
]

```