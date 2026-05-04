---

title: Data_Types
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '6'
hub: '[[6_Database_Design_Hub]]'
source: '[[Chapter_6.pdf]]'
source_pages:
- 15
mode: CS-DB
read: false
generated: true
prerequisites:
- '[[Table_Definition]]'
- '[[Data_Definition_Language]]'
- '[[Create_Table]]'
- '[[System_Catalog]]'
- '[[Table_Creation_Steps]]'

---


# 1. Mental Model

A database's data type system can be thought of as a librarian's cataloging system, where each book (data) is assigned a specific category (data type) that defines its characteristics and the operations that can be performed on it. Just as a librarian uses categories like fiction or biography to organize books, a database uses data types like integer or string to organize and manage data. The data type determines the amount of memory allocated to store the data, as well as the types of operations that can be performed on it.

# 2. Schema & Query Mechanics

In a relational database, [[Data_Types]] play a crucial role in defining the structure of a [[Table_Definition]] using [[Data_Definition_Language]] (DDL) commands like [[Create_Table]]. When creating a table, you must specify the [[Data_Types]] for each column, which determines the type of data that can be stored in that column. For example, a column defined with a [[Sql_Definition]] of CHAR(10) can store fixed-length character strings, while a column defined with an INTEGER data type can store whole numbers. The [[Sql_Environment]] and [[System_Catalog]] work together to manage and enforce these data type constraints. The [[Table_Creation_Steps]] involve specifying the data types for each column, which affects the [[Default_Values]] and [[Referential_Integrity_Options]] that can be applied.

# 3. ACID Violations & Scaling Limits

When working with different [[Data_Types]], it's essential to consider the implications of [[Nulls_In_Sql_Queries]] and how they interact with [[Aggregate_Functions]] and [[Grouping]]. If not handled correctly, data type inconsistencies can lead to [[Acid]] violations, particularly in distributed databases where [[Correlated_Nested_Queries]] and [[Nesting_Of_Queries]] can introduce complexity. As databases scale, the limitations of certain data types become apparent, such as the maximum length of a CHAR data type, which can lead to errors if not properly accounted for. For instance, attempting to insert a string longer than 2000 bytes into a CHAR(2000) column can result in a data type mismatch error.

## 4. Entity-Relationship Model

```mermaid

erDiagram
    SHIP ||--o{ CARGO : transports
    CARGO }|..|> FREIGHT_FORWARDER : handled_by
    FREIGHT_FORWARDER ||--o{ WAREHOUSE : manages
    WAREHOUSE }|..|> PORT : located_at

```

In this Mermaid entity-relationship diagram, each entity (e.g., `SHIP`, `CARGO`, etc.) represents a real-world object or concept in the global supply chain and maritime logistics domain. The lines and symbols (`||--o{`, `}|..|>`) represent the relationships between entities, such as one-to-many (1:N) or many-to-many (M:N) relationships.

## 5. Walkthrough

Here are the steps to understand the entity-relationship model in the context of global supply chain and maritime logistics:

1. **Identify the entities**: We start by identifying the key entities involved in the global supply chain and maritime logistics, such as `SHIP`, `CARGO`, `FREIGHT_FORWARDER`, `WAREHOUSE`, and `PORT`.
2. **Define the relationships**: Next, we define the relationships between these entities. For example, a `SHIP` can transport multiple `CARGO` containers, so we represent this as a 1:N relationship (`SHIP ||--o{ CARGO`).
3. **Establish the handling relationship**: We also need to establish the relationship between `CARGO` and `FREIGHT_FORWARDER`, as a freight forwarder handles multiple cargo containers. This is represented as an M:N relationship (`CARGO }|..|> FREIGHT_FORWARDER`).
4. **Manage warehouse operations**: A `FREIGHT_FORWARDER` manages multiple `WAREHOUSE` locations, so we represent this as a 1:N relationship (`FREIGHT_FORWARDER ||--o{ WAREHOUSE`).
5. **Locate warehouses at ports**: Each `WAREHOUSE` is located at a specific `PORT`, so we represent this as an M:N relationship (`WAREHOUSE }|..|> PORT`).
6. **Analyze the overall model**: Finally, we analyze the overall entity-relationship model to ensure that it accurately represents the complex relationships between entities in the global supply chain and maritime logistics domain.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A database's data type system determines the amount of memory allocated to store the data.",
    "answer": true,
    "explanation": "The data type system in a database indeed determines the amount of memory allocated to store the data, as different data types have varying storage requirements."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given a database table with a column of type integer, what happens when a user attempts to insert a string value into that column?",
    "answer": "The database will likely throw an error, as the data type of the column is integer and it cannot store string values.",
    "explanation": "When a user attempts to insert a string value into an integer column, the database will reject the operation and throw an error, as it cannot store string values in a column defined for integers."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "CREATE TABLE users (id INT, name VARCHAR(255));\nINSERT INTO users (id, name) VALUES (1, 'John');\nSELECT * FROM users WHERE id = '1';",
    "answer": "The bug is in the SELECT statement. The id column is of type INT, but the query is comparing it to a string '1'. The fix is to change the query to SELECT * FROM users WHERE id = 1;",
    "explanation": "The bug is a type mismatch error. The id column is defined as an integer, but the query is comparing it to a string '1'. This can lead to incorrect results or errors, depending on the database system. The fix is to change the query to use an integer literal, rather than a string."
  }
]

```