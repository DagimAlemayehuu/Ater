---
title: Additional_Relational_Operations
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
Imagine you have two big boxes of LEGOs, one with pictures of cars and the other with pictures of trees. Additional relational operations help you combine these boxes in more flexible ways, like finding all the car pictures that also have a matching tree picture, or getting all the pictures from both boxes even if there's no match.

# 2. Schema & Query Mechanics
Additional relational operations such as OUTER JOINS, OUTER UNION, and AGGREGATE FUNCTIONS are implemented mechanically through [[Relational_Algebra]] operations that extend the basic JOIN and UNION operations. An OUTER JOIN, for instance, returns all records from one or both tables, with [[Null]] values in the columns where there are no matches. This is achieved by modifying the [[Join_Algorithm]] to include non-matching rows. AGGREGATE FUNCTIONS, on the other hand, group rows based on one or more columns and apply a function to each group, utilizing [[Group_By]] and [[Having_Clause]] mechanisms. The OUTER UNION operation combines the result sets of two or more SELECT statements, allowing for [[Union_Operator]] and [[Intersect_Operation]].

# 3. ACID Violations & Scaling Limits
When dealing with additional relational operations, especially in distributed databases, there are risks of [[Acid]] violations, such as inconsistent reads during OUTER JOIN operations if proper [[Locking_Mechanisms]] are not in place. Moreover, AGGREGATE FUNCTIONS can lead to performance bottlenecks and scaling limits if not optimized, particularly when dealing with large datasets and complex [[Query_Plan]]s. OUTER UNION operations can also result in slower performance due to the need for [[Data_Sorting]] and [[Duplicate_Elimination]], which can strain system resources. Effective use of [[Indexing_Schemes]] and [[Query_Optimization]] techniques is crucial to mitigate these issues.
# 4. Entity-Relationship Model
```json
{
  "entities": [
    {
      "name": "TableA",
      "attributes": [
        {"name": "id", "type": "int"},
        {"name": "car_picture", "type": "varchar"}
      ]
    },
    {
      "name": "TableB",
      "attributes": [
        {"name": "id", "type": "int"},
        {"name": "tree_picture", "type": "varchar"}
      ]
    }
  ],
  "relationships": [
    {
      "name": "matches",
      "type": "one-to-one",
      "entities": ["TableA", "TableB"],
      "attributes": ["id"]
    }
  ]
}
```
This Entity-Relationship diagram represents two tables, `TableA` and `TableB`, with a one-to-one relationship based on the `id` attribute. This relationship can be used to illustrate the concept of additional relational operations.

## 5. Walkthrough
Suppose we have two tables, `Cars` and `Trees`, with the following data:

`Cars` table:

| id | car_picture |
|----|--------------|
| 1  | picture1     |
| 2  | picture2     |
| 3  | picture3     |

`Trees` table:

| id | tree_picture |
|----|--------------|
| 1  | picture4     |
| 2  | picture5     |

We want to perform an OUTER JOIN on these tables based on the `id` attribute.

1. First, we identify the common attribute between the two tables, which is `id`.
2. We then perform an OUTER JOIN on the `Cars` and `Trees` tables based on the `id` attribute. This will return all records from both tables, with NULL values in the columns where there are no matches.

| id | car_picture | tree_picture |
|----|--------------|--------------|
| 1  | picture1     | picture4     |
| 2  | picture2     | picture5     |
| 3  | picture3     | NULL         |

3. Next, we can apply an AGGREGATE FUNCTION, such as COUNT(), to count the number of rows in each group.

| id | car_picture | tree_picture | count |
|----|--------------|--------------|-------|
| 1  | picture1     | picture4     | 1     |
| 2  | picture2     | picture5     | 1     |
| 3  | picture3     | NULL         | 1     |

4. We can also perform an OUTER UNION operation to combine the result sets of two or more SELECT statements.

`Cars` table:

| id | car_picture |
|----|--------------|
| 1  | picture1     |
| 2  | picture2     |

`Trees` table:

| id | tree_picture |
|----|--------------|
| 3  | picture6     |
| 4  | picture7     |

The OUTER UNION operation will return:

| id | picture     |
|----|--------------|
| 1  | picture1     |
| 2  | picture2     |
| 3  | picture6     |
| 4  | picture7     |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "An OUTER JOIN returns only the records that have matches in both tables.",
    "answer": "False",
    "explanation": "An OUTER JOIN returns all records from one or both tables, with NULL values in the columns where there are no matches."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `Employees` and `Departments`, with the following data: `Employees` table: | id | name | department_id | |----|------|---------------| | 1  | John | 1             | | 2  | Jane | 2             | `Departments` table: | id | name    | |----|---------| | 1  | Sales   | | 3  | Marketing| Perform an OUTER JOIN on these tables based on the `department_id` attribute.",
    "answer": "| id | name | department_id | id | name    | |----|------|---------------|----|---------| | 1  | John | 1             | 1  | Sales   | | 2  | Jane | 2             | NULL| NULL    |",
    "explanation": "The OUTER JOIN returns all records from the `Employees` table and the matching records from the `Departments` table. If there is no match, the result is NULL on the right side."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query: SELECT * FROM TableA OUTER JOIN TableB ON TableA.id = TableB.id WHERE TableB.id IS NULL",
    "content": "SELECT * FROM TableA OUTER JOIN TableB ON TableA.id = TableB.id WHERE TableB.id = NULL",
    "answer": "The bug is that the query is using '=' to compare with NULL, which is incorrect. The correct syntax is 'IS NULL'.",
    "explanation": "The corrected query would be: SELECT * FROM TableA OUTER JOIN TableB ON TableA.id = TableB.id WHERE TableB.id IS NULL"
  }
]
```