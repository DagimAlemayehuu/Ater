---
title: Aggregate_Functions
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 54
mode: CS-DB
read: false
generated: true
---

# 1. Mental Model
Imagine you're the manager of a lemonade stand, and you want to know how much money you made in total or what the average price of a cup of lemonade is. You would add up all the money earned and divide by the number of cups sold. Aggregate functions in databases work similarly, helping you calculate totals, averages, counts, and more from a group of values.

# 2. Schema & Query Mechanics
When a query includes an aggregate function like `SUM`, `AVG`, `COUNT`, `MAX`, or `MIN`, the database engine must group the relevant rows and apply the function to the grouped values. This process involves creating a [[Temporary_Workspace]] to hold the grouped data and then applying the aggregate function to each group. The engine uses [[Hash_Tables]] or [[Sort_Merge]] algorithms to group the rows efficiently. The query optimizer considers [[Operator_Precedence]] when evaluating the query, ensuring that the aggregate function is applied correctly. For example, when using `GROUP BY`, the database groups rows by the specified columns and then applies the aggregate function to each group.

# 3. ACID Violations & Scaling Limits
As the volume of data grows, aggregate functions can become a bottleneck, especially if the database must scan a large portion of the data. This can lead to [[Deadlock]] situations or [[Livelock]] conditions if multiple transactions are contending for the same resources. Furthermore, if the database is not properly [[Partitioned]], the aggregate function may need to scan a large amount of data, leading to performance issues. In distributed databases, aggregate functions can also lead to [[Network_Partition]] issues if the data is not properly replicated or if there are communication failures between nodes. To mitigate these issues, databases often use [[Materialized_Views]] or [[Indexing]] to pre-aggregate data and reduce the load on the database.
# 4. Entity-Relationship Model
```json
{
  "entities": [
    {
      "name": "Customer",
      "attributes": [
        {"name": "customer_id", "type": "int"},
        {"name": "name", "type": "varchar"}
      ]
    },
    {
      "name": "Order",
      "attributes": [
        {"name": "order_id", "type": "int"},
        {"name": "customer_id", "type": "int"},
        {"name": "order_date", "type": "date"},
        {"name": "total", "type": "decimal"}
      ]
    }
  ],
  "relationships": [
    {
      "type": "one_to_many",
      "source": "Customer",
      "target": "Order",
      "attributes": ["customer_id"]
    }
  ]
}
```
This Entity-Relationship model represents customers and their orders. The `customer_id` attribute in the `Order` entity establishes a relationship with the `customer_id` attribute in the `Customer` entity.

## 5. Walkthrough
Suppose we have an e-commerce database with an `Orders` table containing the following data:

| order_id | customer_id | order_date | total |
| --- | --- | --- | --- |
| 1 | 1 | 2022-01-01 | 100.00 |
| 2 | 1 | 2022-01-15 | 200.00 |
| 3 | 2 | 2022-02-01 | 50.00 |
| 4 | 3 | 2022-03-01 | 150.00 |
| 5 | 1 | 2022-04-01 | 300.00 |

To calculate the total amount spent by each customer, we can use the `SUM` aggregate function.

1. Group the rows by `customer_id`.
2. Apply the `SUM` function to the `total` column for each group.
3. The result will be a new table with the `customer_id` and the total amount spent.

| customer_id | total_spent |
| --- | --- |
| 1 | 600.00 |
| 2 | 50.00 |
| 3 | 150.00 |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Aggregate functions can be used without the GROUP BY clause.",
    "answer": "True",
    "explanation": "Aggregate functions can be used without the GROUP BY clause to calculate a single value for the entire table."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A database administrator wants to calculate the average order total for each customer. Which aggregate function and clause should be used?",
    "answer": "AVG and GROUP BY",
    "explanation": "The AVG aggregate function calculates the average value, and the GROUP BY clause groups the rows by customer to calculate the average order total for each customer."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the SQL query.",
    "content": "SELECT customer_id, SUM(total) FROM Orders GROUP BY order_id",
    "answer": "The GROUP BY clause should reference customer_id, not order_id.",
    "explanation": "The query is grouping by the wrong column."
  }
]
```