---
title: CARTESIAN_PRODUCT_Operation
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 6
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Relational_Algebra_Operations_From_Set_Theory]]"
---

# 1. Mental Model
Imagine you have two boxes, one containing 3 different colored shirts and the other containing 2 different pairs of pants. The CARTESIAN PRODUCT operation is like combining each shirt with each pair of pants, resulting in 6 unique outfit combinations. This operation pairs every item from the first box with every item from the second box.

# 2. Schema & Query Mechanics
The CARTESIAN PRODUCT operation, often denoted as a cross join, mechanically combines rows from two relations, `R1` and `R2`, by creating a new relation that contains all possible pairs of rows from `R1` and `R2`. This is achieved through a [[Nested_Loop_Join]] algorithm, which iterates over each row in `R1` and pairs it with each row in `R2`, resulting in a [[Cartesian_Product]] relation. The resulting relation's schema consists of all attributes from both `R1` and `R2`, with [[Attribute_Resolution]] ensuring that attribute names are properly qualified to avoid ambiguity. When executing a CARTESIAN PRODUCT query, the database optimizer may choose to use a [[Join_Algorithm]] that avoids creating an intermediate result set.

# 3. ACID Violations & Scaling Limits
The CARTESIAN PRODUCT operation can lead to [[Acid]] violations if not properly managed, particularly in terms of [[Isolation_Level]] and [[Atomicity]]. As the size of the input relations increases, the result set can grow exponentially, leading to [[Scalability]] issues and potential [[Deadlocks]]. Furthermore, if one or both of the input relations are very large, the operation may exceed available memory, causing the system to [[Page]] or even [[Abort]] the transaction. Therefore, careful consideration must be given to the size of the input relations and the available system resources when planning to execute a CARTESIAN PRODUCT operation.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Cartesian Product",
  "type": "object",
  "properties": {
    "Table1": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"}
      },
      "required": ["id", "name"]
    },
    "Table2": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "city": {"type": "string"}
      },
      "required": ["id", "city"]
    },
    "CartesianProduct": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"},
        "Table2_id": {"type": "integer"},
        "city": {"type": "string"}
      },
      "required": ["id", "name", "Table2_id", "city"]
    }
  }
}
```
This JSON schema represents two tables, `Table1` and `Table2`, and their Cartesian Product. The Cartesian Product combines each row from `Table1` with each row from `Table2`, resulting in a new table with all attributes from both tables.

## 5. Walkthrough
Suppose we have two tables:

`Table1`:

| id | name  |
|----|-------|
| 1  | John  |
| 2  | Alice |

`Table2`:

| id | city    |
|----|---------|
| 1  | New York|
| 2  | London  |

To compute the Cartesian Product of `Table1` and `Table2`, we follow these steps:

1. Take the first row from `Table1` (id = 1, name = John) and pair it with each row from `Table2`.
2. The first pair is (id = 1, name = John) from `Table1` and (id = 1, city = New York) from `Table2`, resulting in (id = 1, name = John, id = 1, city = New York).
3. The second pair is (id = 1, name = John) from `Table1` and (id = 2, city = London) from `Table2`, resulting in (id = 1, name = John, id = 2, city = London).
4. Take the second row from `Table1` (id = 2, name = Alice) and pair it with each row from `Table2`.
5. The first pair is (id = 2, name = Alice) from `Table1` and (id = 1, city = New York) from `Table2`, resulting in (id = 2, name = Alice, id = 1, city = New York).
6. The second pair is (id = 2, name = Alice) from `Table1` and (id = 2, city = London) from `Table2`, resulting in (id = 2, name = Alice, id = 2, city = London).

The resulting Cartesian Product table is:

| id | name  | id | city    |
|----|-------|----|---------|
| 1  | John  | 1  | New York|
| 1  | John  | 2  | London  |
| 2  | Alice | 1  | New York|
| 2  | Alice | 2  | London  |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The CARTESIAN PRODUCT operation can result in a relation with more rows than either of the input relations.",
    "answer": "True",
    "explanation": "The CARTESIAN PRODUCT operation combines each row from the first relation with each row from the second relation, resulting in a relation with more rows than either of the input relations."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `Customers` and `Orders`, with 5 and 10 rows respectively. How many rows will the Cartesian Product of these two tables have?",
    "answer": "50",
    "explanation": "The Cartesian Product of two tables with 5 and 10 rows will have 5 * 10 = 50 rows."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL code for computing the Cartesian Product of two tables:",
    "content": "SELECT * FROM Table1, Table2 WHERE Table1.id = Table2.id",
    "answer": "The bug is that the SQL code is attempting to compute an inner join instead of a Cartesian Product. To fix this, remove the WHERE clause.",
    "explanation": "The given SQL code is computing an inner join instead of a Cartesian Product because it includes a WHERE clause with a join condition. To compute a Cartesian Product, the query should be SELECT * FROM Table1, Table2 or SELECT * FROM Table1 CROSS JOIN Table2."
  }
]
```