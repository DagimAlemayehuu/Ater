---
title: INTERSECTION_Operation
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
Imagine you have two boxes of toys, one from your friend Emma and one from your friend Max. The INTERSECTION operation is like finding the toys that are exactly the same in both boxes. If Emma has a toy car, a doll, and a puzzle, and Max has a toy car, a bike, and the same puzzle, the intersection of their toys would be the toy car and the puzzle.

# 2. Schema & Query Mechanics
The INTERSECTION operation mechanically works by comparing the [[Tuple]] values from two relations, R and S, and returning only the tuples that are common to both. This operation assumes that both relations have the same [[Attribute_Set]], meaning they have the same columns with the same data types. The [[Relational_Algebra]] operation is typically implemented using a [[Hash Join]] or [[Sort-Merge Join]] algorithm, which allows for efficient comparison of tuples. When executing an INTERSECTION operation in SQL, the query optimizer may choose to use `INTERSECT` keyword or rewrite the query using `INNER JOIN` and `GROUP BY` clauses.

# 3. ACID Violations & Scaling Limits
When dealing with large relations, the INTERSECTION operation can be resource-intensive and may lead to [[Deadlocks]] or [[Livelocks]] if not properly synchronized. Additionally, if the relations are not properly indexed, the operation may incur significant [[I/O Overhead]], leading to performance bottlenecks. As the size of the relations grows, the INTERSECTION operation may also be limited by the available [[Memory_Buffer_Pool]], requiring careful tuning of database parameters to avoid [[Buffer_Pool_Starvation]]. Furthermore, if the relations are constantly being updated, the INTERSECTION operation may be prone to [[Dirty_Reads]] or [[Non-Repeatable_Reads]], requiring careful consideration of [[Transaction_Isolation_Level]]s.
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
This JSON schema represents two relations, R and S, with their respective attributes and the intersection of these relations. The intersection relation contains only the tuples common to both R and S.

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

1. Compare the tuples of `Employees` and `Managers` based on their `EmployeeID`, `Name`, and `Department` attributes.
2. Identify the common tuples: (1, John, Sales) and (3, Joe, IT).
3. Create a new relation, `Intersection`, containing only these common tuples.

`Intersection`:

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
    "question": "Suppose we have two relations, `Students` and `Scholarship_Winners`, with the same attributes (StudentID, Name, GPA). How would you write a query to find the students who are both in the `Students` relation and have won a scholarship (i.e., are in the `Scholarship_Winners` relation)?",
    "answer": "SELECT * FROM Students INTERSECT SELECT * FROM Scholarship_Winners",
    "explanation": "The INTERSECT keyword is used to find the intersection of two relations."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following query: SELECT * FROM Employees INNER JOIN Managers ON Employees.EmployeeID = Managers.EmployeeID",
    "content": "SELECT * FROM Employees INNER JOIN Managers ON Employees.EmployeeID = Managers.EmployeeID",
    "answer": "The bug is that this query returns a Cartesian product of the two relations, not their intersection. To fix this, we need to add additional conditions to the JOIN clause or use the INTERSECT keyword.",
    "explanation": "The given query performs an INNER JOIN, which returns a Cartesian product, not the intersection of the two relations."
  }
]
```