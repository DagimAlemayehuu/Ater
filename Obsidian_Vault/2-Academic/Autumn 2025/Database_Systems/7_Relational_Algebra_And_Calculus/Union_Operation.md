---
title: UNION_Operation
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 23
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Relational_Algebra_Operations_From_Set_Theory]]"
---

# 1. Mental Model
Imagine you have two boxes of LEGOs, one from your friend Emma and one from your friend Max. The UNION operation is like combining these two boxes into one big box, where you put all the unique LEGO pieces from both boxes. If a LEGO piece is in both boxes, it only appears once in the big box.

# 2. Schema & Query Mechanics
The UNION operation mechanically combines the result sets of two or more SELECT statements into a single result set. This is achieved by first executing each SELECT statement and storing their results in temporary [[Stack_Frame]] structures. The UNION operator then eliminates duplicate rows by comparing the [[Column_Values]] of each row across the result sets, ensuring that only unique combinations of values are included in the final result set. The [[Operator_Precedence]] of the UNION operator is such that it is evaluated after the individual SELECT statements have been executed. When combining the result sets, the UNION operation requires that the number and data types of [[Column_Datatypes]] must match between the SELECT statements.

# 3. ACID Violations & Scaling Limits
The UNION operation can lead to [[Acid]] violations if not properly synchronized, particularly in a [[Distributed_Database]] environment where concurrent transactions may interfere with each other's result sets. As the size of the result sets increases, the UNION operation can become a scaling bottleneck due to the need to eliminate duplicate rows, which can lead to increased [[I/O_Throughput]] and [[Cpu_Utilization]]. Furthermore, if the SELECT statements being combined have different [[Isolation_Levels]], it can lead to inconsistent results. In a [[Load_Balancing]] scenario, the UNION operation can also lead to uneven load distribution if not properly optimized. To mitigate these issues, database administrators often employ [[Query_Optimization]] techniques, such as reordering the SELECT statements or using [[Indexing_Schemes]] to reduce the number of rows being combined.
# 4. Entity-Relationship Model
```json
{
  "entities": [
    {
      "name": "SELECT Statement",
      "attributes": [
        {
          "name": "Result Set",
          "type": "set"
        }
      ]
    },
    {
      "name": "UNION Operation",
      "attributes": [
        {
          "name": "Result Set",
          "type": "set"
        }
      ]
    }
  ],
  "relationships": [
    {
      "type": "one-to-many",
      "source": "SELECT Statement",
      "target": "UNION Operation",
      "description": "A SELECT statement can be part of multiple UNION operations."
    },
    {
      "type": "many-to-one",
      "source": "UNION Operation",
      "target": "SELECT Statement",
      "description": "A UNION operation can combine multiple SELECT statements."
    }
  ]
}
```
To read this Entity-Relationship diagram: The diagram shows two entities, `SELECT Statement` and `UNION Operation`, each with their own attributes. The relationships between these entities indicate that a SELECT statement can be part of multiple UNION operations, and a UNION operation can combine multiple SELECT statements.

## 5. Walkthrough
Suppose we have two tables, `Employees` and `Contractors`, with the following data:

`Employees` table:

| Employee ID | Name | Department |
| --- | --- | --- |
| 1 | John Smith | Sales |
| 2 | Jane Doe | Marketing |
| 3 | Bob Brown | IT |

`Contractors` table:

| Contractor ID | Name | Department |
| --- | --- | --- |
| 4 | Alice Johnson | Sales |
| 5 | Mike Davis | IT |
| 6 | Emily Taylor | HR |

We want to combine the result sets of two SELECT statements to retrieve the names and departments of all employees and contractors.

1. Execute the first SELECT statement to retrieve the names and departments of all employees:

```sql
SELECT Name, Department FROM Employees;
```

Result set:

| Name | Department |
| --- | --- |
| John Smith | Sales |
| Jane Doe | Marketing |
| Bob Brown | IT |

2. Execute the second SELECT statement to retrieve the names and departments of all contractors:

```sql
SELECT Name, Department FROM Contractors;
```

Result set:

| Name | Department |
| --- | --- |
| Alice Johnson | Sales |
| Mike Davis | IT |
| Emily Taylor | HR |

3. Combine the result sets using the UNION operation:

```sql
SELECT Name, Department FROM Employees
UNION
SELECT Name, Department FROM Contractors;
```

Result set:

| Name | Department |
| --- | --- |
| John Smith | Sales |
| Jane Doe | Marketing |
| Bob Brown | IT |
| Alice Johnson | Sales |
| Mike Davis | IT |
| Emily Taylor | HR |

4. Eliminate duplicate rows:

The result set already has no duplicates.

5. Return the final result set:

The final result set is the same as the previous step.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The UNION operation can combine SELECT statements with different numbers of columns.",
    "answer": "False",
    "explanation": "The UNION operation requires that the number and data types of columns must match between the SELECT statements."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `TableA` and `TableB`, with the same structure. We want to retrieve all rows from both tables using the UNION operation. However, `TableA` has 1000 rows and `TableB` has 500 rows, and 200 rows are common to both tables. How many rows will the UNION operation return?",
    "answer": "1300",
    "explanation": "The UNION operation will return 1300 rows because it eliminates duplicate rows."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query:",
    "content": "SELECT * FROM TableA UNION SELECT * FROM TableB",
    "answer": "The bug is that the query does not specify the columns to select, which can lead to errors if the tables have different structures.",
    "explanation": "The query should specify the columns to select, like this: SELECT column1, column2 FROM TableA UNION SELECT column1, column2 FROM TableB."
  }
]
```