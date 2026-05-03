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
To read this Entity-Relationship (ER) diagram: The diagram describes two entities, `SELECT Statement` and `UNION Operation`, each with a `Result Set` attribute. The relationships between these entities indicate that a `SELECT Statement` can be part of multiple `UNION Operation`s and a `UNION Operation` can combine multiple `SELECT Statement`s.

## 5. Walkthrough
Suppose we have two tables, `Employees` and `Contractors`, with the following data:

`Employees` table:

| EmployeeID | Name | Department |
| --- | --- | --- |
| 1 | John Smith | Sales |
| 2 | Jane Doe | Marketing |
| 3 | Bob Brown | IT |

`Contractors` table:

| ContractorID | Name | Department |
| --- | --- | --- |
| 4 | Alice Johnson | Sales |
| 5 | Mike Davis | IT |
| 6 | Emily Taylor | HR |

We want to combine the names of all employees and contractors who work in the Sales or IT departments.

1. First, we execute two SELECT statements to retrieve the names of employees and contractors in the Sales and IT departments:

```sql
SELECT Name FROM Employees WHERE Department IN ('Sales', 'IT');
SELECT Name FROM Contractors WHERE Department IN ('Sales', 'IT');
```

2. The result sets of these SELECT statements are:

`Employees` result set:

| Name |
| --- |
| John Smith |
| Bob Brown |

`Contractors` result set:

| Name |
| --- |
| Alice Johnson |
| Mike Davis |

3. The UNION operation combines these result sets into a single result set, eliminating duplicates:

| Name |
| --- |
| John Smith |
| Bob Brown |
| Alice Johnson |
| Mike Davis |

4. The final result set contains all unique names of employees and contractors who work in the Sales or IT departments.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The UNION operation allows duplicate rows in the result set.",
    "answer": "False",
    "explanation": "The UNION operation eliminates duplicate rows by default."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `TableA` and `TableB`, with the same structure. We want to combine the rows of these tables into a single result set. However, `TableA` has 1000 rows and `TableB` has 500 rows, and 200 rows are common to both tables. How many rows will the UNION operation return?",
    "answer": "1300",
    "explanation": "The UNION operation will return 1300 rows (1000 + 500 - 200)."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query:",
    "content": "SELECT * FROM TableA UNION SELECT * FROM TableB ORDER BY Column1;",
    "answer": "The ORDER BY clause should be applied to each SELECT statement separately, or a subquery should be used to order the combined result set.",
    "explanation": "The ORDER BY clause is applied to the combined result set, not to each individual SELECT statement."
  }
]
```