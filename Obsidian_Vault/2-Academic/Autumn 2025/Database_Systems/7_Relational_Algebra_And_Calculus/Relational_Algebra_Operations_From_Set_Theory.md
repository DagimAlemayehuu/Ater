---
title: Relational_Algebra_Operations_From_Set_Theory
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
- "[[Relational_Algebra]]"
---

# 1. Mental Model
Imagine you have two boxes of colored pencils. Each pencil represents a row in a database table. Relational algebra operations from set theory help you combine or compare these boxes (or tables) in different ways, like putting all the pencils from both boxes into one box (UNION), finding the pencils that are exactly the same in both boxes (INTERSECTION), or finding the pencils that are in one box but not the other (DIFFERENCE).

# 2. Schema & Query Mechanics
Relational algebra operations from set theory are used to combine or compare tables in a database. The UNION operation combines the rows of two tables, eliminating any duplicate rows. This is mechanically achieved through [[Tuple_Variables]] and [[Schema_Compatibility]] checks, ensuring that the tables have the same [[Attribute_Names]]. The INTERSECTION operation returns only the rows that are common to both tables, while the DIFFERENCE operation returns only the rows that are in one table but not the other. The CARTESIAN PRODUCT operation combines each row of one table with each row of another table, creating a new table with all possible combinations. This is often achieved through [[Join_Operations]] and [[Cross_Join]] mechanics.

# 3. ACID Violations & Scaling Limits
When performing relational algebra operations from set theory, there are several boundary conditions and failure states to consider. For example, if the tables being combined have different schemas, the operation may fail or produce incorrect results, potentially leading to [[Dirty_Reads]] or [[Inconsistent_Views]]. Additionally, large tables can cause scaling issues, particularly with the CARTESIAN PRODUCT operation, which can result in a huge table that exceeds the available [[Storage_Resources]]. Furthermore, concurrent modifications to the tables being combined can lead to [[Lost_Updates]] or [[Non-Repeatable_Reads]], violating [[Acid_Properties]]. As a result, careful planning and optimization are necessary to ensure that these operations are performed efficiently and safely.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Relational Algebra Operations From Set Theory",
  "type": "object",
  "properties": {
    "Table1": {
      "type": "object",
      "properties": {
        "Attribute1": {"type": "string"},
        "Attribute2": {"type": "integer"}
      },
      "required": ["Attribute1", "Attribute2"]
    },
    "Table2": {
      "type": "object",
      "properties": {
        "Attribute1": {"type": "string"},
        "Attribute2": {"type": "integer"}
      },
      "required": ["Attribute1", "Attribute2"]
    }
  },
  "required": ["Table1", "Table2"]
}
```
This JSON schema represents two tables, `Table1` and `Table2`, each with two attributes, `Attribute1` and `Attribute2`. The schema ensures that both tables have the same attribute names and data types, which is a requirement for performing relational algebra operations from set theory.

To read this schema, start by understanding the top-level properties, `Table1` and `Table2`, which represent the two tables being combined. Each table has two properties, `Attribute1` and `Attribute2`, which define the attributes of the table. The `required` keyword ensures that both attributes are present in each table.

## 5. Walkthrough
Suppose we have two tables, `Employees` and `Contractors`, with the following data:

`Employees`:

| EmployeeID | Name | Department |
| --- | --- | --- |
| 1 | John Smith | Sales |
| 2 | Jane Doe | Marketing |
| 3 | Bob Brown | IT |

`Contractors`:

| ContractorID | Name | Department |
| --- | --- | --- |
| 4 | Alice Johnson | Sales |
| 5 | Mike Davis | IT |
| 6 | Emily Taylor | HR |

We want to perform a UNION operation on these two tables to get a list of all employees and contractors.

1. First, we need to ensure that both tables have the same attribute names and data types. In this case, we can rename the `EmployeeID` and `ContractorID` attributes to `ID` to make them compatible.
2. Next, we perform the UNION operation by combining the rows of both tables and eliminating any duplicate rows.

Result:

| ID | Name | Department |
| --- | --- | --- |
| 1 | John Smith | Sales |
| 2 | Jane Doe | Marketing |
| 3 | Bob Brown | IT |
| 4 | Alice Johnson | Sales |
| 5 | Mike Davis | IT |
| 6 | Emily Taylor | HR |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The UNION operation in relational algebra eliminates duplicate rows.",
    "answer": "True",
    "explanation": "The UNION operation combines the rows of two tables and eliminates any duplicate rows."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `TableA` and `TableB`, with the same attribute names and data types. We perform a UNION operation on these tables. What is the result if `TableA` has 10 rows and `TableB` has 5 rows, with 2 rows being duplicates?",
    "answer": "13",
    "explanation": "The UNION operation combines the rows of both tables and eliminates any duplicate rows. Therefore, the result will have 10 + 5 - 2 = 13 rows."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "SELECT * FROM TableA UNION SELECT * FROM TableB INTERSECT SELECT * FROM TableC",
    "answer": "The INTERSECT operation should be performed before the UNION operation, or the query should be rewritten using subqueries or joins.",
    "explanation": "The given code is trying to perform a UNION operation followed by an INTERSECT operation. However, the INTERSECT operation has higher precedence than the UNION operation, which may lead to incorrect results. To fix this, we need to use parentheses to group the operations correctly or rewrite the query using subqueries or joins."
  }
]
```