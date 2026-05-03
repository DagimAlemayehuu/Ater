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
Imagine you have two boxes of LEGOs, one from your friend and one from your sibling. The UNION operation is like combining these boxes into one big box, where you put all the unique LEGOs from both boxes. If there's a LEGO piece that appears in both boxes, it only goes into the big box once.

# 2. Schema & Query Mechanics
The UNION operation in SQL combines the result sets of two or more SELECT statements into a single result set. Mechanically, this involves [[Query Optimization]] and [[Result Set]] concatenation. When two queries are unioned, the DBMS performs a [[Distinct]] operation to eliminate duplicate rows. For the UNION operation to work, the number of columns and data types of the columns in the SELECT statements must match. The DBMS then uses [[Operator Precedence]] to evaluate the queries and combine their result sets. 

# 3. ACID Violations & Scaling Limits
The UNION operation can potentially lead to [[Acid]] violations if not implemented correctly, particularly in terms of [[Atomicity]] and [[Isolation]]. For instance, if the operation is part of a larger transaction and one of the SELECT statements fails, the entire transaction may need to be rolled back. Additionally, as the size of the result sets increases, the UNION operation can become a scaling bottleneck, especially if the DBMS needs to perform a large number of [[Disk I/O]] operations to retrieve and combine the data. Furthermore, if the UNION operation involves queries from different databases or servers, [[Distributed Transaction]] management becomes a concern.
# 4. Entity-Relationship Model
```json
{
  "entities": [
    {
      "name": "Query",
      "attributes": [
        {
          "name": "query_id",
          "type": "int"
        },
        {
          "name": "query_text",
          "type": "varchar"
        }
      ]
    },
    {
      "name": "Result_Set",
      "attributes": [
        {
          "name": "result_set_id",
          "type": "int"
        },
        {
          "name": "query_id",
          "type": "int",
          "reference": "Query.query_id"
        },
        {
          "name": "result",
          "type": "varchar"
        }
      ]
    }
  ],
  "relationships": [
    {
      "name": "performs",
      "entities": ["Query", "Result_Set"],
      "type": "one_to_many"
    }
  ]
}
```
The Entity-Relationship diagram models queries and their result sets. A query can have multiple result sets (one-to-many), and each result set is associated with one query.

## 5. Walkthrough
Suppose we have two tables, `Employees` and `Contractors`, and we want to combine their names and departments into a single list.

`Employees` table:

| employee_id | name | department |
| --- | --- | --- |
| 1 | John Smith | Sales |
| 2 | Jane Doe | Marketing |
| 3 | Bob Brown | IT |

`Contractors` table:

| contractor_id | name | department |
| --- | --- | --- |
| 1 | Alice Johnson | IT |
| 2 | Mike Davis | Sales |
| 3 | Emily Taylor | HR |

To perform a UNION operation:

1. We write two SELECT statements to retrieve the names and departments from `Employees` and `Contractors`:
```sql
SELECT name, department FROM Employees;
SELECT name, department FROM Contractors;
```
2. The DBMS performs the SELECT operations and retrieves the result sets:
```markdown
Result Set 1:
| name | department |
| --- | --- |
| John Smith | Sales |
| Jane Doe | Marketing |
| Bob Brown | IT |

Result Set 2:
| name | department |
| --- | --- |
| Alice Johnson | IT |
| Mike Davis | Sales |
| Emily Taylor | HR |
```
3. The DBMS concatenates the result sets and eliminates duplicate rows:
```markdown
Combined Result Set:
| name | department |
| --- | --- |
| John Smith | Sales |
| Jane Doe | Marketing |
| Bob Brown | IT |
| Alice Johnson | IT |
| Mike Davis | Sales |
| Emily Taylor | HR |
```
4. The final result set is returned, with no duplicates:
```markdown
Final Result Set:
| name | department |
| --- | --- |
| John Smith | Sales |
| Jane Doe | Marketing |
| Bob Brown | IT |
| Alice Johnson | IT |
| Mike Davis | Sales |
| Emily Taylor | HR |
```
5. Note that if an employee or contractor has the same name and department as another, they will be treated as a duplicate and only appear once in the final result set.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The UNION operation in SQL eliminates duplicate rows by default.",
    "answer": "True",
    "explanation": "The UNION operation in SQL combines the result sets of two or more SELECT statements into a single result set and eliminates duplicate rows by default."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `TableA` and `TableB`, with the same structure. We want to perform a UNION operation on them. However, `TableA` has 1000 rows and `TableB` has 500 rows, with 200 rows being identical. What is the maximum number of rows in the result set?",
    "answer": "1300",
    "explanation": "The UNION operation eliminates duplicate rows. Therefore, the maximum number of rows in the result set is 1000 (from TableA) + 500 (from TableB) - 200 (duplicates) = 1300."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query: `SELECT * FROM TableA UNION SELECT * FROM TableB`",
    "content": "SELECT * FROM TableA UNION SELECT name FROM TableB",
    "answer": "The number of columns and data types in the SELECT statements do not match.",
    "explanation": "The UNION operation requires that the number of columns and data types of the columns in the SELECT statements match. In this case, the first SELECT statement retrieves all columns (*), while the second SELECT statement only retrieves the 'name' column."
  }
]
```