---

title: Using_Aliases
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '6'
hub: '[[6_Database_Design_Hub]]'
source: '[[Chapter_6.pdf]]'
source_pages:
- 42
mode: CS-DB
read: false
generated: true
prerequisites:
- '[[Table_Definition]]'
- '[[Unspecified_Where_Clause]]'

---


# 1. Mental Model

The concept of using aliases in SQL queries can be likened to a scenario where a person has multiple roles in an organization. Just as a person might have a work name and a nickname, tables in a query can have an actual name and an alias. This analogy maps to the structural components of SQL queries, where a table's actual name is like a person's legal name, and the alias is like a nickname, allowing for easier reference and distinction between multiple instances of the same table in a query.

# 2. Schema & Query Mechanics

When writing SQL queries, particularly those that involve joining a table to itself or referencing the same table multiple times, it's often necessary to use [[Using_Aliases]] to distinguish between the different instances of the table. This is achieved by specifying an alias for a table using the `AS` keyword after the table name in the `FROM` clause. For example, if we have a query that involves a self-join on a [[Table_Definition]], we might use an alias to refer to each instance of the table. The [[Sql_Definition]] allows for the use of aliases in the `FROM` clause, which can then be used in the rest of the query, including in the `WHERE` and `SELECT` clauses. The use of aliases can also help simplify complex queries by providing a shorthand way to refer to tables, making it easier to write and maintain queries that involve multiple references to the same [[Sql_Environment]].

# 3. ACID Violations & Scaling Limits

When using aliases in SQL queries, there is generally no risk of ACID violations, as aliases are simply a way to refer to tables or subqueries and do not affect the underlying data or transactions. However, if not used carefully, aliases can lead to confusion and errors in queries, particularly if the same alias is used for different tables or subqueries. In terms of scaling limits, the use of aliases does not typically have a significant impact on the performance of a database, as it is simply a matter of resolving the alias to the actual table or subquery. Nevertheless, poorly written queries that use aliases can lead to slower performance or even errors, such as [[Unspecified_Where_Clause]] or [[Nulls_In_Sql_Queries]], if not properly optimized.

## 4. Entity-Relationship Model

```mermaid

erDiagram
    VESSEL ||--o{ CARGO : transports
    VESSEL ||--o{ ROUTE : follows
    CARGO }|..|> SHIPMENT : part_of
    SHIPMENT ||--o{ PORT : stops_at

```

In this Mermaid `erDiagram`, entities are represented as boxes (e.g., `VESSEL`, `CARGO`), and relationships between them are depicted as lines. The cardinality of the relationships (e.g., 1:N, M:N) is indicated by the symbols `||--o{` for 1:N and `}|..|>` for M:N (or more accurately for M:N, but Mermaid does not directly support all variations; it implies the nature through line ends).

## 5. Walkthrough

Here are the steps for a walkthrough on using aliases in SQL queries within the context of Global Supply Chain & Maritime Logistics:

1. **Identify the Need for Aliases**: Suppose we need to compare the departure and arrival times of vessels at different ports. We have a query that joins the `VESSEL`, `ROUTE`, and `PORT` tables. Without aliases, the query can become confusing, especially when dealing with multiple instances of the same table.

2. **Basic Query Without Aliases**: Initially, we might write a query like:

```sql

SELECT VESSEL.name, ROUTE.departure_time, PORT.name 
FROM VESSEL 
JOIN ROUTE ON VESSEL.id = ROUTE.vessel_id 
JOIN PORT ON ROUTE.port_id = PORT.id;

```

   However, this becomes cumbersome when joining the same table multiple times.

3. **Introducing Aliases**: To simplify, we introduce aliases for `VESSEL`, `ROUTE`, and `PORT`:

```sql

SELECT v.name, r.departure_time, p.name 
FROM VESSEL v 
JOIN ROUTE r ON v.id = r.vessel_id 
JOIN PORT p ON r.port_id = p.id;

```

4. **Complex Scenario**: Consider a scenario where a vessel's cargo details are needed, and we join `VESSEL`, `CARGO`, and `SHIPMENT` tables. We might need to reference the `VESSEL` table multiple times if we are comparing different vessels.

5. **Using Aliases in Complex Queries**: 

```sql

SELECT v1.name AS "Vessel1", v2.name AS "Vessel2", c.description 
FROM VESSEL v1 
JOIN CARGO c ON v1.id = c.vessel_id 
JOIN VESSEL v2 ON c.second_vessel_id = v2.id;

```

   Here, `v1` and `v2` are aliases for `VESSEL`, allowing us to distinguish between two instances of the `VESSEL` table.

6. **Benefits of Aliases**: Aliases make queries more readable and easier to maintain. They are especially useful in complex queries involving multiple joins and subqueries, making it clear which table or instance of a table is being referenced.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Using an alias in a SQL query changes the actual name of the table in the database.",
    "answer": false,
    "explanation": "An alias in a SQL query does not change the actual name of the table in the database; it is merely a temporary name used in the query for reference and readability."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Consider a query that joins a table with itself. How can aliases be used to distinguish between the two instances of the table?",
    "answer": "Aliases can be used to give temporary names to each instance of the table, allowing columns from each instance to be referenced distinctly in the query.",
    "explanation": "When a table is joined with itself, aliases are essential to differentiate between the two instances of the same table. For example, if the table is named 'employees', aliases like 'e1' and 'e2' can be used to refer to the two instances, enabling the query to reference columns from each instance clearly."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "SELECT orders.order_id, customers.customer_name FROM orders, customers WHERE orders.customer_id = customers.customer_id AND orders.customer_id = 100",
    "answer": "The bug is in the join condition; it seems like a Cartesian product is intended but not properly executed. However, the real issue here could be the unintended filtering by a specific customer_id. A more typical query would involve an INNER JOIN or aliases for clarity. The correct approach might involve specifying the join type and using aliases for clarity: SELECT o.order_id, c.customer_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id",
    "explanation": "The provided SQL query seems to filter orders for a specific customer (ID = 100) but lacks clarity and proper join syntax. A more standard and clear approach would use an INNER JOIN with aliases for better readability and understanding."
  }
]

```