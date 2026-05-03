---
title: EQUIJOIN
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 42
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Theta_Join]]"
---

# 1. Mental Model
Imagine you have two big boxes of files, one for your friends and one for your classmates. Each file has a name and a grade. An EQUIJOIN is like finding all the pairs of files where the name matches exactly, so you can see which of your friends are in the same class as you.

# 2. Schema & Query Mechanics
An EQUIJOIN is a type of [[Inner_Join]] operation where the join condition is based solely on equality comparisons between columns from two tables. Mechanically, when an EQUIJOIN is executed, the database [[Parser]] breaks down the query into a [[Query_Plan]], which involves creating a [[Join_Index]] to efficiently match rows between the two tables based on the equality condition. The database then iterates through both tables, using the [[Hash_Table]] data structure to group matching rows together, resulting in a combined table with columns from both sources. This process relies heavily on [[Operator_Precedence]] rules to ensure the correct evaluation of the join condition.

# 3. ACID Violations & Scaling Limits
EQUIJOIN operations can lead to [[Deadlocks]] and [[Livelocks]] if not properly optimized, particularly in high-transaction environments where multiple joins are executed concurrently. As the size of the tables increases, EQUIJOIN performance can degrade significantly, leading to [[Scalability]] issues. Furthermore, if the join columns are not properly indexed, the database may resort to [[Table_Scan]] operations, resulting in slower query performance and potential [[Data_Inconsistency]] issues. To mitigate these risks, careful consideration must be given to indexing strategies, [[Lock_Escalation]] thresholds, and query optimization techniques.
# 4. Entity-Relationship Model
```json
{
  "tables": [
    {
      "name": "Friends",
      "columns": [
        {"name": "Name", "type": "string"},
        {"name": "Grade", "type": "integer"}
      ]
    },
    {
      "name": "Classmates",
      "columns": [
        {"name": "Name", "type": "string"},
        {"name": "Grade", "type": "integer"}
      ]
    }
  ],
  "relationships": [
    {
      "type": "EQUIJOIN",
      "condition": "Friends.Name = Classmates.Name"
    }
  ]
}
```
This ER diagram represents two tables, `Friends` and `Classmates`, each with `Name` and `Grade` columns. The EQUIJOIN relationship is established on the equality of `Name` columns between the two tables.

## 5. Walkthrough
Suppose we have the following data:

`Friends` table:

| Name | Grade |
| --- | --- |
| John | 85 |
| Jane | 90 |
| Bob | 78 |

`Classmates` table:

| Name | Grade |
| --- | --- |
| John | 85 |
| Alice | 92 |
| Bob | 78 |

Let's perform an EQUIJOIN on the `Name` column:

1. Create a hash table to store the rows of the `Classmates` table, using the `Name` column as the key.
2. Iterate through the `Friends` table, and for each row, probe the hash table to find matching rows in the `Classmates` table.
3. For the first row in `Friends` (`John`, 85), find a matching row in `Classmates` (`John`, 85). Combine the rows to form a new row: (`John`, 85, `John`, 85).
4. For the second row in `Friends` (`Jane`, 90), no matching row is found in `Classmates`.
5. For the third row in `Friends` (`Bob`, 78), find a matching row in `Classmates` (`Bob`, 78). Combine the rows to form a new row: (`Bob`, 78, `Bob`, 78).

The resulting joined table:

| Name | Grade | Name | Grade |
| --- | --- | --- | --- |
| John | 85 | John | 85 |
| Bob | 78 | Bob | 78 |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "An EQUIJOIN is a type of outer join operation.",
    "answer": "False",
    "explanation": "An EQUIJOIN is a type of inner join operation where the join condition is based solely on equality comparisons between columns from two tables."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `Customers` and `Orders`, with a common column `CustomerID`. How would you perform an EQUIJOIN to retrieve the customer name and order total for each customer?",
    "answer": "SELECT Customers.Name, Orders.Total FROM Customers INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID",
    "explanation": "The EQUIJOIN is performed on the `CustomerID` column, and the resulting table contains columns from both `Customers` and `Orders` tables."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following EQUIJOIN query: `SELECT * FROM Friends, Classmates WHERE Friends.Name = Classmates.Name`",
    "content": "SELECT * FROM Friends, Classmates WHERE Friends.Name = Classmates.Name",
    "answer": "The bug is that the query uses the old-style comma-separated table list syntax, which can lead to ambiguous join conditions and incorrect results. The correct syntax is to use the `INNER JOIN` clause: `SELECT * FROM Friends INNER JOIN Classmates ON Friends.Name = Classmates.Name`",
    "explanation": "The old-style syntax can lead to confusion and errors, especially when dealing with multiple tables and complex join conditions."
  }
]
```