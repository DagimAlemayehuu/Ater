---

title: Sql_Definition
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '6'
hub: '[[6_Database_Design_Hub]]'
source: '[[Chapter_6.pdf]]'
source_pages:
- 2
mode: CS-DB
read: false
generated: true
prerequisites:
- '[[Table_Definition]]'
- '[[Constraint_Definition]]'
- '[[Data_Types]]'
- '[[Data_Definition_Language]]'
- '[[Create_Table]]'

---


# 1. Mental Model

A relational database schema can be thought of as a network of interconnected maps, where each map represents a [[Table_Definition]] and the connections between them represent relationships. Just as a map has boundaries and coordinates, a relational schema has [[Constraint_Definition]] and [[Data_Types]] that define the structure of the data. The relationships between tables are like roads on a map, enabling navigation and querying of the data.

# 2. Schema & Query Mechanics

A [[Sql_Definition]] provides a way to define and manipulate the structure of a relational database using [[Sql_Sub_Languages]], including [[Data_Definition_Language]] and [[Sql_Environment]]. When creating a table, [[Create_Table]] statements specify the [[Table_Definition]], including [[Data_Types]] and [[Constraint_Definition]], which are stored in the [[System_Catalog]]. The [[Data_Definition_Language]] is used to manage schema changes, such as [[Alter_Table]], [[Drop_Table]], and [[Insert]], [[Update]], [[Delete]] operations on the data. [[Table_Creation_Steps]] involve defining the table structure, specifying [[Default_Values]], and establishing [[Referential_Integrity_Options]].

# 3. ACID Violations & Scaling Limits

When multiple transactions are executed concurrently, [[Acid]] properties ensure data consistency and integrity. However, if transactions are not properly synchronized, [[Acid]] violations can occur, leading to data inconsistencies. For example, if two transactions attempt to update the same data simultaneously, the resulting data may be inconsistent. As the database scales, the likelihood of [[Acid]] violations increases, and mechanisms such as locking and timestamping are used to prevent them. 

| Scaling Issue | Description |
|---|---|
| Increased Latency | Longer response times due to contention |
| Data Inconsistency | Inconsistent data due to concurrent updates |
| System Crash | System failure due to unhandled exceptions | 
| Deadlocks | Transactions blocked due to circular waits |

## 4. Entity-Relationship Model

```mermaid

erDiagram
    SHIP ||--o{ CARGO : transports
    SHIP ||--o{ ROUTE : follows
    CARGO }|..|> PRODUCT : contains
    ROUTE ||--o{ PORT : stops_at

```

In this Mermaid `erDiagram`, the entities are represented as boxes (e.g., `SHIP`, `CARGO`, etc.) and the relationships between them are represented as lines with specific notations. 
- The `||--o{` notation indicates a 1:N (one-to-many) relationship, where the entity on the left side of the line can have multiple instances of the entity on the right side (e.g., a ship can transport many cargo items).
- The `}|..|>` notation indicates a M:N (many-to-many) relationship, but with a specific notation to show which side has the "identifying" relationship; however, a more standard M:N would use `||..||`, but here we adjusted to properly reflect containment.

## 5. Walkthrough

Here are the steps to understand and apply the entity-relationship model in the context of Global Supply Chain & Maritime Logistics:

1. **Identify Key Entities**: In the global supply chain and maritime logistics domain, key entities include `SHIP`, `CARGO`, `ROUTE`, `PORT`, and `PRODUCT`. Each of these entities has its own set of attributes and plays a crucial role in the logistics operations.

2. **Define Relationships**: 
   - A ship (`SHIP`) can transport multiple cargo items (`CARGO`), establishing a 1:N relationship.
   - A ship follows a specific route (`ROUTE`), which is another 1:N relationship.
   - A cargo item contains a specific product (`PRODUCT`), establishing a M:N relationship but shown with a specific notation here.

3. **Establish Relationship Cardinality**: 
   - The 1:N relationship between `SHIP` and `CARGO` implies that for each ship, there can be multiple cargo items, but each cargo item is associated with only one ship.

4. **Consider Operational Constraints**: 
   - A route (`ROUTE`) can have multiple ports (`PORT`) as stops, indicating another 1:N relationship.

5. **Apply to Logistics Scenario**: 
   - For instance, a cargo ship (SHIP) named "Global Carrier" transports multiple containers (CARGO) of electronics (PRODUCT) from Shanghai to Los Angeles, following a predefined route (ROUTE) that includes stops at Hong Kong and Honolulu ports (PORT).

6. **Refine and Iterate**: 
   - Based on specific operational requirements, such as types of cargo, ship capacities, and route optimizations, the entity-relationship model can be refined and updated to better reflect the complexities of global supply chain and maritime logistics operations.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A relational database schema defines the structure of the data.",
    "answer": true,
    "explanation": "A relational database schema indeed defines the structure of the data, including tables, constraints, and relationships."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given two tables, Orders and Customers, with a one-to-many relationship between them, what happens when you delete a customer?",
    "answer": "All orders associated with the deleted customer are also deleted, or the deletion is prevented to maintain data integrity.",
    "explanation": "When a customer is deleted, the database must handle the related orders to maintain referential integrity. This can be achieved through cascading delete or by preventing the deletion if there are associated orders."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "CREATE TABLE Orders (\n  OrderID int PRIMARY KEY,\n  CustomerID int,\n  OrderDate date,\n  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE SET NULL\n);",
    "answer": "The bug is that the ON DELETE action is set to SET NULL, which could lead to orphaned orders. A more suitable action would be ON DELETE CASCADE or ON DELETE RESTRICT.",
    "explanation": "The ON DELETE SET NULL action sets the CustomerID to NULL in the Orders table when a customer is deleted, potentially leaving orders without a valid customer reference. A more appropriate action would be to cascade the deletion or restrict it to maintain data integrity."
  }
]

```