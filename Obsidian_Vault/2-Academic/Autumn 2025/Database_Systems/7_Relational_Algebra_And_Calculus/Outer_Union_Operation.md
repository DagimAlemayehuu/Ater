---
title: OUTER_UNION_Operation
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 62
mode: CS-DB
read: false
generated: true
---

# 1. Mental Model
Imagine you have two boxes of LEGOs, one with wheels and the other with windows, but both have a special kind of brick that can connect them. The outer union operation is like combining these boxes, making sure that all the unique LEGOs (or data) from both boxes are included, even if some LEGOs from one box don't have a matching connection brick to the other box.

# 2. Schema & Query Mechanics
The outer union operation is used to combine tuples from two relations that have partially compatible schemas. When performing an outer union, the [[Result_Set]] will contain all the attributes from both relations, with [[Null]] values in the columns where the relations do not overlap. The operation starts by identifying the common attributes between the two relations, which must have the same [[Data_Type]] and [[Domain]]. The [[Union_Operator]] then combines the tuples, ensuring that each tuple in the result set is unique. 

# 3. ACID Violations & Scaling Limits
When performing an outer union operation, there is a risk of [[Data_Inconsistency]] if the relations being combined are very large and the operation is not properly optimized, potentially leading to [[Deadlocks]] in a multi-user database environment. Additionally, the outer union operation may violate [[Atomicity]] if one of the relations being combined is being modified simultaneously, resulting in an inconsistent result set. As the size of the relations increases, the outer union operation can become a [[Bottleneck]], impacting the overall performance and [[Scalability]] of the database. Therefore, careful consideration must be given to indexing and [[Query_Optimization]] when performing outer union operations on large datasets.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Outer Union Operation",
  "type": "object",
  "properties": {
    "Relation1": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"},
        "age": {"type": "integer"}
      },
      "required": ["id", "name", "age"]
    },
    "Relation2": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "department": {"type": "string"},
        "salary": {"type": "number"}
      },
      "required": ["id", "department", "salary"]
    },
    "Result_Set": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": ["string", "null"]},
        "age": {"type": ["integer", "null"]},
        "department": {"type": ["string", "null"]},
        "salary": {"type": ["number", "null"]}
      },
      "required": ["id", "name", "age", "department", "salary"]
    }
  }
}
```
This JSON schema represents two relations, `Relation1` and `Relation2`, with partially compatible schemas. The `Result_Set` shows the combined attributes from both relations, with nullable values for non-overlapping columns.

The schema defines the structure of the relations and the result set, including data types and required properties.

## 5. Walkthrough
Suppose we have two relations, `Employees` and `Departments`, with the following data:

`Employees`:

| id | name | age |
| --- | --- | --- |
| 1  | John | 25  |
| 2  | Jane | 30  |
| 3  | Joe  | 35  |

`Departments`:

| id | department | salary |
| --- | --- | --- |
| 1  | Sales     | 50000  |
| 2  | Marketing | 60000  |
| 4  | IT        | 70000  |

To perform an outer union operation on these relations, we follow these steps:

1. Identify the common attribute between the two relations, which is `id`.
2. Ensure that the common attribute has the same data type and domain in both relations.
3. Combine the tuples from both relations, using `NULL` values for non-overlapping columns.
4. Eliminate duplicate tuples from the result set.

The result set will be:

| id | name | age | department | salary |
| --- | --- | --- | --- | --- |
| 1  | John | 25  | Sales     | 50000  |
| 2  | Jane | 30  | Marketing | 60000  |
| 3  | Joe  | 35  | NULL      | NULL   |
| 4  | NULL | NULL | IT        | 70000  |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The outer union operation requires the relations to have identical schemas.",
    "answer": "False",
    "explanation": "The outer union operation can combine relations with partially compatible schemas."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two relations, `Customers` and `Orders`, with the following data: ... Perform an outer union operation on these relations.",
    "answer": "The result set will contain all unique customers and orders, with NULL values for non-overlapping columns.",
    "explanation": "The outer union operation combines tuples from both relations, ensuring each tuple in the result set is unique."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query: `SELECT * FROM Customers OUTER UNION SELECT * FROM Orders`",
    "content": "SELECT * FROM Customers OUTER UNION SELECT * FROM Orders",
    "answer": "The bug is that the query does not specify the common attribute between the two relations.",
    "explanation": "The outer union operation requires identifying the common attribute between the two relations."
  }
]
```