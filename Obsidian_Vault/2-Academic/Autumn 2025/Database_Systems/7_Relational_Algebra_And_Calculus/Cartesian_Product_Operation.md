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
  "title": "CARTESIAN PRODUCT",
  "type": "object",
  "properties": {
    "R1": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"}
      },
      "required": ["id", "name"]
    },
    "R2": {
      "type": "object",
      "properties": {
        "dept_id": {"type": "integer"},
        "dept_name": {"type": "string"}
      },
      "required": ["dept_id", "dept_name"]
    },
    "Cartesian_Product": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"},
        "dept_id": {"type": "integer"},
        "dept_name": {"type": "string"}
      },
      "required": ["id", "name", "dept_id", "dept_name"]
    }
  }
}
```

The provided JSON schema defines the structure of two relations, `R1` and `R2`, and their CARTESIAN PRODUCT. `R1` has attributes `id` and `name`, while `R2` has attributes `dept_id` and `dept_name`. The `Cartesian_Product` relation combines all attributes from both `R1` and `R2`. 

## 5. Walkthrough
Suppose we have two tables:

`Employees` (R1):
| id | name  |
|----|-------|
| 1  | John  |
| 2  | Alice |
| 3  | Bob   |

`Departments` (R2):
| dept_id | dept_name |
|---------|-----------|
| 10      | Sales     |
| 20      | Marketing |

To compute the CARTESIAN PRODUCT of `Employees` and `Departments`:

1. Start with the first row of `Employees` (id = 1, name = John) and pair it with each row of `Departments`.
2. The first pair is (John, Sales) and the second pair is (John, Marketing).
3. Move to the second row of `Employees` (id = 2, name = Alice) and pair it with each row of `Departments`, resulting in (Alice, Sales) and (Alice, Marketing).
4. Repeat the process for the third row of `Employees` (id = 3, name = Bob), giving (Bob, Sales) and (Bob, Marketing).
5. The resulting CARTESIAN PRODUCT table will have 6 rows, each combining an employee with a department.

The resulting table:
| id | name  | dept_id | dept_name |
|----|-------|---------|-----------|
| 1  | John  | 10      | Sales     |
| 1  | John  | 20      | Marketing |
| 2  | Alice | 10      | Sales     |
| 2  | Alice | 20      | Marketing |
| 3  | Bob   | 10      | Sales     |
| 3  | Bob   | 20      | Marketing |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The CARTESIAN PRODUCT operation can result in a relation that has more rows than either of the input relations.",
    "answer": "True",
    "explanation": "The CARTESIAN PRODUCT combines each row from one relation with each row from another, potentially leading to an output relation that is larger than either input."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given two tables, `Products` with 4 rows and `Colors` with 3 rows, how many rows would the CARTESIAN PRODUCT of these two tables have?",
    "answer": "12",
    "explanation": "The CARTESIAN PRODUCT of two tables results in a table with the product of the number of rows of the input tables. Hence, 4 rows * 3 rows = 12 rows."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query intended to compute the CARTESIAN PRODUCT of two tables, `TableA` and `TableB`:",
    "content": "SELECT * FROM TableA, TableB WHERE TableA.id = TableB.id",
    "answer": "The bug is that the query incorrectly attempts to compute an inner join instead of a CARTESIAN PRODUCT. The correct query should simply be 'SELECT * FROM TableA, TableB' or 'SELECT * FROM TableA CROSS JOIN TableB'.",
    "explanation": "The provided query performs an inner join on the 'id' column instead of computing the CARTESIAN PRODUCT of the two tables."
  }
]
```