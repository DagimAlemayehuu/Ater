---
title: INTERSECTION_Operation
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages: []
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Relational_Algebra_Operations_From_Set_Theory]]"
---

# 1. Mental Model
Imagine you have two boxes of toys, one from your friend Emma and one from your friend Max. The INTERSECTION operation is like finding the toys that are exactly the same in both boxes. If Emma has a toy car, a doll, and a puzzle, and Max has a toy car, a bike, and the same puzzle, the intersection of their toys would be the toy car and the puzzle.

# 2. Schema & Query Mechanics
The INTERSECTION operation mechanically works by comparing the [[Tuple]] values from two relations, R and S, and returning only the tuples that are common to both. This operation assumes that both relations have the same [[Attribute_Set]], meaning they have the same columns with the same data types. The [[Relational_Algebra]] operation is typically implemented using a [[Hash Join]] or [[Sort-Merge Join]] algorithm, which allows for efficient comparison of tuples. When executing an INTERSECTION operation in SQL, the query optimizer may choose to use `INTERSECT` keyword or rewrite the query using `INNER JOIN` and `GROUP BY` clauses.

# 3. ACID Violations & Scaling Limits
When dealing with large relations, the INTERSECTION operation can be resource-intensive and may lead to [[Deadlocks]] or [[Livelocks]] if not properly synchronized. Additionally, if the relations are not properly indexed, the operation may incur significant [[I/O Overhead]], leading to performance bottlenecks. As the size of the relations grows, the INTERSECTION operation may also be limited by the available [[Memory_Buffer_Pool]], requiring careful tuning of database parameters to avoid [[Buffer_Pool_Starvation]]. Furthermore, if the relations are constantly being updated, the INTERSECTION operation may return inconsistent results if not properly [[Locking]] the relations during execution.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Intersection Operation",
  "type": "object",
  "properties": {
    "Relation_R": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "Attribute1": {"type": "string"},
          "Attribute2": {"type": "string"}
        },
        "required": ["Attribute1", "Attribute2"]
      }
    },
    "Relation_S": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "Attribute1": {"type": "string"},
          "Attribute2": {"type": "string"}
        },
        "required": ["Attribute1", "Attribute2"]
      }
    },
    "Intersection": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "Attribute1": {"type": "string"},
          "Attribute2": {"type": "string"}
        },
        "required": ["Attribute1", "Attribute2"]
      }
    }
  },
  "required": ["Relation_R", "Relation_S", "Intersection"]
}
```
This JSON schema represents two relations, R and S, with their respective attributes and the intersection result. The schema defines the structure of the data, including the attributes and their data types.

## 5. Walkthrough
Suppose we have two relations, `Employees` and `Managers`, with the following data:

`Employees`:

| EmployeeID | Name | Department |
| --- | --- | --- |
| 1 | John | Sales |
| 2 | Jane | Marketing |
| 3 | Joe | IT |

`Managers`:

| EmployeeID | Name | Department |
| --- | --- | --- |
| 1 | John | Sales |
| 3 | Joe | IT |
| 4 | Sarah | HR |

To find the intersection of these two relations, we perform the following steps:

1. Compare the attributes of both relations: Both `Employees` and `Managers` have the same attributes, `EmployeeID`, `Name`, and `Department`.
2. Identify the common tuples: Compare each tuple in `Employees` with each tuple in `Managers`. The common tuples are those with the same `EmployeeID`, `Name`, and `Department`.
3. Return the common tuples: The intersection of `Employees` and `Managers` is:

| EmployeeID | Name | Department |
| --- | --- | --- |
| 1 | John | Sales |
| 3 | Joe | IT |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The INTERSECTION operation returns all tuples that are present in either of the two relations.",
    "answer": "False",
    "explanation": "The INTERSECTION operation returns only the tuples that are common to both relations."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two relations, `Orders` and `Shipments`, with the following data: Orders: OrderID, CustomerID, OrderDate; Shipments: OrderID, ShipmentDate. How would you write a query to find the intersection of these two relations?",
    "answer": "SELECT OrderID FROM Orders INTERSECT SELECT OrderID FROM Shipments",
    "explanation": "The INTERSECT keyword is used to find the intersection of two relations. In this case, we select the OrderID from both relations and use INTERSECT to find the common OrderIDs."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following query: SELECT * FROM R INTERSECT SELECT * FROM S WHERE R.Attribute1 = S.Attribute1",
    "content": "SELECT * FROM R INTERSECT SELECT * FROM S WHERE R.Attribute1 = S.Attribute1",
    "answer": "The bug is that the INTERSECT operation requires both relations to have the same attributes. However, the query adds a condition to the second relation, which may change the result set. To fix this, the condition should be applied before the INTERSECT operation.",
    "explanation": "The INTERSECT operation requires both relations to have the same attributes. Adding a condition to one of the relations changes the result set and may lead to incorrect results."
  }
]
```