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
Relational Algebra works by taking relations (or tables) as input and producing new relations as output through a set of operators. The operations include [[Union]], [[Intersection]], and [[Difference]] for combining or filtering relations, as well as [[Projection]] and [[Selection]] to manipulate the structure and content of the relations. These operations can be composed together to form more complex queries. The [[Cartesian Product]] operator combines each row of one relation with each row of another, allowing for joins and other combinations. Queries in Relational Algebra are typically expressed using a formal notation, often using `σ` for selection, `π` for projection, and `⋈` for joins.

# 3. ACID Violations & Scaling Limits
When implementing Relational Algebra operations in a real-world database, there are constraints and potential failure states to consider. For instance, the [[Atomicity]] of transactions that perform complex Relational Algebra operations must be maintained to prevent partial updates. Additionally, [[Isolation]] levels can affect the outcome of concurrent queries that involve Relational Algebra operations like [[Union]] or [[Intersection]]. As databases scale, operations like [[Cartesian Product]] can become extremely resource-intensive, leading to performance bottlenecks. Ensuring [[Consistency]] across distributed databases when executing Relational Algebra queries also poses significant challenges.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Relational Algebra Operations",
  "type": "object",
  "properties": {
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "description": {"type": "string"}
        },
        "required": ["name", "description"]
      }
    }
  },
  "required": ["operations"]
}
```
This JSON schema represents the entity-relationship model for Relational Algebra operations. It defines a structure for describing various operations, including their names and descriptions.

The schema consists of an array of operation objects, each containing a name and a description. This allows for the representation of different Relational Algebra operations, such as Union, Intersection, and Projection.

## 5. Walkthrough
Suppose we have two relations, `Students` and `Courses`, with the following tuples:

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

Let's perform the following operations:

1. **Selection**: Find all students with age greater than 20.
   - `σ Age > 20 (Students)`
   - Result: `{(2, Jane, 22), (3, Joe, 21)}`

2. **Projection**: Find the names and ages of all students.
   - `π Name, Age (Students)`
   - Result: `{(John, 20), (Jane, 22), (Joe, 21)}`

3. **Union**: Find all students and courses combined.
   - `Students ∪ Courses`
   - Note: This requires compatible schemas. For simplicity, let's assume we're only considering StudentID and Name.
   - `Students` (projected to `StudentID`, `Name`): `{(1, John), (2, Jane), (3, Joe)}`
   - `Courses` (projected to `StudentID`, `Name`): `{(1, Math), (2, Science), (3, History)}`
   - Result: `{(1, John), (2, Jane), (3, Joe), (1, Math), (2, Science), (3, History)}`

4. **Cartesian Product**: Find the Cartesian product of `Students` and `Courses`.
   - `Students × Courses`
   - This will result in a large relation with all possible combinations of students and courses.

5. **Join**: Find the courses each student is enrolled in.
   - `Students ⋈ Courses`
   - Result: `{(1, John, 20, 101, Math), (2, Jane, 22, 102, Science), (3, Joe, 21, 103, History)}`

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Relational Algebra operations are used to manipulate and combine relations.",
    "answer": "True",
    "explanation": "Relational Algebra provides a set of operations to work with relations, including selection, projection, union, intersection, and more."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given two relations, `Employees` and `Departments`, how would you find the names of all employees and their respective department names?",
    "answer": "First, project the `Employees` relation to include employee names and department IDs. Then, join this projected relation with the `Departments` relation on the department ID to get the department names. Finally, project the result to include only employee names and department names.",
    "explanation": "This involves a combination of projection and join operations in Relational Algebra."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug.",
    "content": "σ Age > 20 (Students) ∪ π Name (Courses)",
    "answer": "The schemas are incompatible for union.",
    "explanation": "The bug involves a misunderstanding of the schema requirements for union operations in Relational Algebra."
  }
]
```