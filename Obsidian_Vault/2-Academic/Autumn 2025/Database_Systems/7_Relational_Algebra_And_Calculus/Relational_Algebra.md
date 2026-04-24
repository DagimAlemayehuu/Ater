---
title: Relational_Algebra
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 3
mode: CS-DB
read: false
generated: true
---

# 1. Mental Model
Imagine you have a big box full of different colored cards, each with some information written on it, like a name and an age. Relational Algebra is like having a set of instructions on how to pick specific cards from the box, combine them, or throw some away based on certain rules. It's a way to work with these sets of information using basic operations.

# 2. Schema & Query Mechanics
Relational Algebra works by taking relations (or tables) as input and producing new relations as output through a set of operators. The operations include [[Union]], [[Intersection]], and [[Difference]] for combining or filtering relations, as well as [[Projection]] and [[Selection]] to manipulate the structure and content of the relations. When a query is executed, the relational algebra expression is typically [[Optimized]] by the database system to produce an efficient query plan, which involves operations like [[Join]] to combine relations based on common attributes. The query plan is then executed using [[Indexing]] and [[Buffer Management]] to access and process the data efficiently.

# 3. ACID Violations & Scaling Limits
As databases scale and handle more complex queries, Relational Algebra operations can lead to [[Acid]] violations if not properly managed, particularly in distributed systems where [[Atomicity]] and [[Consistency]] are crucial. For instance, if two transactions are executing a [[Join]] operation simultaneously, it can lead to inconsistent results if not properly synchronized. Moreover, operations like [[Union]] and [[Join]] can result in large intermediate relations, which can cause [[Scalability]] issues and lead to performance bottlenecks if the database system is not designed to handle them efficiently. Therefore, database administrators must carefully optimize queries and ensure that the system is properly [[Tuned]] to handle the workload.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Relational Algebra Entity-Relationship Model",
  "type": "object",
  "properties": {
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "attributes": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["name", "attributes"]
      }
    },
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "type": {"type": "string"},
          "relations": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["name", "type", "relations"]
      }
    }
  },
  "required": ["relations", "operations"]
}
```
This JSON schema represents the entity-relationship model for relational algebra, which includes relations with their attributes and operations that can be performed on these relations. The schema defines the structure of the data, including the relations and operations, and their respective properties.

## 5. Walkthrough
Suppose we have two relations, `Students` and `Courses`, with the following attributes:

`Students`:

| StudentID | Name | Age |
| --- | --- | --- |
| 1 | John | 20 |
| 2 | Jane | 22 |
| 3 | Joe | 21 |

`Courses`:

| CourseID | CourseName | StudentID |
| --- | --- | --- |
| 101 | Math | 1 |
| 102 | Science | 2 |
| 103 | History | 3 |

Let's perform a walkthrough of a relational algebra query:

1. **Selection**: Select all students with age greater than 20.
```σ age > 20 (students)```
Result:

| StudentID | Name | Age |
| --- | --- | --- |
| 2 | Jane | 22 |
| 3 | Joe | 21 |

2. **Projection**: Project the `Name` and `Age` attributes of the selected students.
```
Result:

| Name | Age |
| --- | --- |
| Jane | 22 |
| Joe | 21 |

3. **Join**: Join the `Students` relation with the `Courses` relation on the `StudentID` attribute.
```students ⨝ courses```
Result:

| StudentID | Name | Age | CourseID | CourseName |
| --- | --- | --- | --- | --- |
| 1 | John | 20 | 101 | Math |
| 2 | Jane | 22 | 102 | Science |
| 3 | Joe | 21 | 103 | History |

4. **Union**: Combine the results of two queries.
```
Result:

| Name | Age |
| --- | --- |
| John | 20 |
| Jane | 22 |
| Joe | 21 |
| ... | ... |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Relational Algebra is a way to work with sets of information using basic operations.",
    "answer": "True",
    "explanation": "Relational Algebra is a formal system for manipulating relational databases, using basic operations like Union, Intersection, and Difference."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two relations, `Employees` and `Departments`, with attributes `EmployeeID`, `Name`, `DepartmentID`, and `DepartmentName`. Write a relational algebra query to find the names of employees who work in the 'Sales' department.",
    "answer": "σ DepartmentName = 'Sales' (Departments) ⨝ Employees",
    "explanation": "First, select the 'Sales' department from the `Departments` relation, then join the result with the `Employees` relation on the `DepartmentID` attribute."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following relational algebra query: `π Name (σ Age > 20 (Employees) ∪ σ Age < 20 (Employees))`.",
    "content": "π Name (σ Age > 20 (Employees) ∩ σ Age < 20 (Employees))",
    "answer": "The bug is using Intersection instead of Union. The correct query should use Union to combine the two selections.",
    "explanation": "The Intersection operation returns only the tuples that are common to both selections, which would be empty since a tuple cannot have Age > 20 and Age < 20 at the same time. The correct query should use Union to combine the two selections and return all employees."
  }
]
```