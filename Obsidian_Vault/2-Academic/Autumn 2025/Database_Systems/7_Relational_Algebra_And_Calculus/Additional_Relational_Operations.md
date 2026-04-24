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
Imagine you have two big boxes of LEGOs, one with pictures of cars and the other with pictures of trees. Additional Relational Operations are like special tools that help you combine these boxes in different ways, like matching cars with trees that have similar colors or combining all the pictures into one big box while keeping track of which ones came from where.

# 2. Schema & Query Mechanics
Additional Relational Operations such as OUTER JOINS, OUTER UNION, and AGGREGATE FUNCTIONS work by extending the basic JOIN and UNION operations. When performing an OUTER JOIN, the database engine will [[Hash Join]] the two tables on the specified columns, producing a result set that includes all records from both tables, with NULL values in the columns where there are no matches. The [[Sql Parser]] analyzes the query and determines the [[Operator Precedence]] to ensure that the operations are executed correctly. For AGGREGATE FUNCTIONS, the database engine groups the rows based on the specified columns and applies the aggregate function, such as SUM or COUNT, to produce the result.

# 3. ACID Violations & Scaling Limits
When dealing with Additional Relational Operations, there is a risk of [[Dirty Reads]] and [[Non-Repeatable Reads]] if the database does not properly handle concurrent transactions. For example, if two transactions are executing an OUTER JOIN simultaneously, the results may be inconsistent if one transaction modifies the data being joined while the other transaction is still executing. Additionally, as the size of the tables increases, the performance of these operations can degrade, leading to [[Scalability]] issues. To mitigate these risks, database administrators must carefully design the schema, index the tables, and optimize the queries to ensure that the operations are executed efficiently and consistently, adhering to [[Acid Properties]].
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Additional Relational Operations",
  "type": "object",
  "properties": {
    "tables": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "columns": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["name", "columns"]
      }
    },
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string"},
          "table1": {"type": "string"},
          "table2": {"type": "string"},
          "columns": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["type", "table1", "table2", "columns"]
      }
    }
  },
  "required": ["tables", "operations"]
}
```
This JSON schema represents the entity-relationship model for additional relational operations. It defines two main entities: tables and operations. Tables have a name and a list of columns, while operations have a type, two table names, and a list of columns.

## 5. Walkthrough
Suppose we have two tables: `cars` and `trees`. The `cars` table has columns `id`, `color`, and `model`, while the `trees` table has columns `id`, `color`, and `species`.

| id | color | model |
|----|-------|-------|
| 1  | red   | Toyota|
| 2  | blue  | Honda |
| 3  | green | Ford  |

| id | color | species |
|----|-------|---------|
| 1  | red   | Oak     |
| 2  | blue  | Pine    |
| 3  | yellow| Maple   |

We want to perform an OUTER JOIN on these two tables based on the `color` column.

Here are the steps:

1. Identify the common column: The common column between the two tables is `color`.
2. Choose the join type: We want to perform an OUTER JOIN, which means we want to include all records from both tables, with NULL values in the columns where there are no matches.
3. Perform the join:

| id | color | model | id | species |
|----|-------|-------|----|---------|
| 1  | red   | Toyota| 1  | Oak     |
| 2  | blue  | Honda | 2  | Pine    |
| 3  | green | Ford  | NULL| NULL    |
| NULL| red   | NULL  | 1  | Oak     |
| NULL| blue  | NULL  | 2  | Pine    |
| NULL| yellow| NULL  | 3  | Maple   |

4. The result set includes all records from both tables, with NULL values in the columns where there are no matches.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "An OUTER JOIN returns only the rows that have matches in both tables.",
    "answer": "False",
    "explanation": "An OUTER JOIN returns all rows from both tables, with NULL values in the columns where there are no matches."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables: `orders` and `customers`. The `orders` table has columns `id`, `customer_id`, and `order_date`, while the `customers` table has columns `id`, `name`, and `email`. We want to perform an OUTER JOIN on these two tables based on the `customer_id` column. If there are 10 rows in the `orders` table and 5 rows in the `customers` table, how many rows will be in the result set?",
    "answer": "At least 10 rows",
    "explanation": "The result set will include all rows from the `orders` table, with NULL values in the columns where there are no matches in the `customers` table. Since there are 10 rows in the `orders` table, the result set will have at least 10 rows."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL query: SELECT * FROM orders OUTER JOIN customers ON orders.customer_id = customers.id",
    "content": "SELECT * FROM orders OUTER JOIN customers ON orders.customer_id = customers.id",
    "answer": "The bug is that the type of OUTER JOIN is not specified. It should be LEFT OUTER JOIN or RIGHT OUTER JOIN.",
    "explanation": "The SQL query is missing the type of OUTER JOIN. It should specify whether it is a LEFT OUTER JOIN or RIGHT OUTER JOIN."
  }
]
```