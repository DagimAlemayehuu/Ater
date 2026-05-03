---
title: OUTER_UNION
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
Imagine you have two boxes of LEGOs, one with mostly blue bricks and the other with mostly red bricks, but some bricks in each box have different shapes and sizes. An OUTER UNION is like combining these two boxes into one big box where every unique LEGO brick from both boxes is included, even if the bricks from one box don't perfectly match the bricks from the other box.

# 2. Schema & Query Mechanics
The OUTER UNION operation is used to combine the result sets of two or more SELECT statements into a single result set. Mechanically, this is achieved by first ensuring that the number and data types of columns in both queries are compatible, although not necessarily identical. The [[Union_Operator]] is utilized, but unlike the standard UNION, OUTER UNION allows for the combination of tables with [[Incompatible Schemas]]. This is particularly useful when dealing with data from different sources that don't perfectly align. The [[Sql_Engine]] handles this by performing a [[Schema_Mapping]] to align the columns from both queries. 

# 3. ACID Violations & Scaling Limits
When performing an OUTER UNION, there are potential [[Acid]] violations to consider, particularly in terms of [[Atomicity]] and [[Consistency]], as the operation involves combining data from potentially disparate sources. If one of the sources is down or experiences [[Deadlock]], the entire operation could be rolled back, impacting [[Isolation]] levels. Scaling limits are also a concern, as large datasets can lead to [[Resource_Contention]], causing performance bottlenecks. Moreover, handling [[Null]] values and ensuring data integrity across heterogeneous data sources can pose significant challenges. The [[Database_Administrator]] must carefully plan and monitor OUTER UNION operations to mitigate these risks.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Outer Union",
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
        "description": {"type": "string"}
      },
      "required": ["id", "description"]
    },
    "OuterUnionResult": {
      "type": "object",
      "properties": {
        "id": {"type": ["integer", "null"]},
        "name": {"type": ["string", "null"]},
        "description": {"type": ["string", "null"]}
      }
    }
  }
}
```
This JSON schema represents two tables, `Table1` and `Table2`, with different structures, and the result of an OUTER UNION operation, `OuterUnionResult`, which combines the columns of both tables, allowing for null values.

The schema shows that `Table1` has an `id` and a `name`, while `Table2` has an `id` and a `description`. The `OuterUnionResult` can have an `id`, `name`, and `description`, with each field potentially being null if the corresponding field is not present in one of the source tables.

## 5. Walkthrough
Suppose we have two tables:

`Table1`:

| id | name    |
|----|---------|
| 1  | John    |
| 2  | Jane    |

`Table2`:

| id | description |
|----|-------------|
| 1  | Engineer    |
| 3  | Manager     |

To perform an OUTER UNION on these tables:

1. First, we ensure that the number and data types of columns are compatible. Here, both tables have an `id` column of integer type, but the second column has different names (`name` and `description`) and types (string and string, respectively).
2. We perform a schema mapping to align the columns. For simplicity, let's map both to a common structure: `id`, `name`, and `description`.
3. Convert `Table2`'s rows to fit the new structure:
   - For `id` 1, we have `id` = 1, `name` = null, and `description` = Engineer.
   - For `id` 3, we have `id` = 3, `name` = null, and `description` = Manager.
4. Similarly, convert `Table1`'s rows:
   - For `id` 1, we have `id` = 1, `name` = John, and `description` = null.
   - For `id` 2, we have `id` = 2, `name` = Jane, and `description` = null.
5. Combine the rows, ensuring each unique `id` is included:
   - For `id` 1, we combine to get `id` = 1, `name` = John, and `description` = Engineer.
   - For `id` 2, we have `id` = 2, `name` = Jane, and `description` = null.
   - For `id` 3, we have `id` = 3, `name` = null, and `description` = Manager.

The result of the OUTER UNION operation is:

| id | name    | description |
|----|---------|-------------|
| 1  | John    | Engineer    |
| 2  | Jane    | null        |
| 3  | null    | Manager     |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The OUTER UNION operation requires the number and data types of columns in both queries to be identical.",
    "answer": "False",
    "explanation": "The OUTER UNION operation requires the number and data types of columns to be compatible, but not necessarily identical."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "You have two tables, Employees and Contractors, with different structures. Employees has id, name, and department, while Contractors has id, name, and project. How would you use OUTER UNION to combine these tables into a single view that includes all unique individuals and their respective details?",
    "answer": "Perform schema mapping to align the columns, then use OUTER UNION. The result can have columns like id, name, department, and project, with nulls where data is not applicable.",
    "explanation": "This approach allows for combining data from different sources with different structures into a unified view."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following OUTER UNION SQL query: SELECT id, name FROM Table1 UNION SELECT id, description FROM Table2",
    "content": "SELECT id, name FROM Table1 UNION SELECT id, description FROM Table2",
    "answer": "The bug is that the data types of the second columns in both SELECT statements (name and description) are not explicitly handled for compatibility, potentially causing type mismatch errors during the OUTER UNION operation.",
    "explanation": "The fix involves ensuring type compatibility, possibly through casting, and ensuring schema mapping is correctly applied."
  }
]
```