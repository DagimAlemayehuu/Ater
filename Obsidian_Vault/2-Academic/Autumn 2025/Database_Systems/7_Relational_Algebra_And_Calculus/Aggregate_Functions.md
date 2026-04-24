---
title: Aggregate_Functions
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 55
mode: CS-DB
read: false
generated: true
---

# 1. Mental Model
Imagine you're the manager of a lemonade stand, and you want to know how much money you made in total or what the average price of a cup of lemonade is. You would add up all the money earned and divide by the number of cups sold. Aggregate functions in databases work similarly, helping you calculate totals, averages, counts, and more from a group of values.

# 2. Schema & Query Mechanics
When a query includes an aggregate function like `SUM`, `AVG`, `COUNT`, `MAX`, or `MIN`, the database engine must group the relevant rows and apply the function to the grouped values. This process involves creating a [[Temporary_Workspace]] to hold the grouped data and then applying the aggregate function to each group. The engine uses [[Hash_Tables]] or [[Sort_Merge]] algorithms to group the rows efficiently. The query optimizer considers [[Operator_Precedence]] when evaluating the query, ensuring that the aggregate function is applied correctly. For example, when using `GROUP BY`, the database groups rows by the specified columns and then applies the aggregate function to each group.

# 3. ACID Violations & Scaling Limits
As the volume of data grows, aggregate functions can become a bottleneck, especially if the database must scan a large portion of the data. This can lead to [[Deadlock]] situations or [[Livelock]] conditions if multiple transactions are contending for the same resources. Furthermore, if the database is not properly [[Partitioned]], the aggregate function may need to scan a large amount of data, leading to performance issues. In distributed databases, aggregate functions can also lead to [[Network_Partition]] issues if the data is not properly replicated or if there are communication failures between nodes. To mitigate these issues, databases often use techniques like [[Materialized_Views]] or [[Indexing]] to pre-aggregate data and reduce the load on the database engine.
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
This Entity-Relationship diagram represents a simple customer-order relationship. The `Customer` entity has attributes for `customer_id` and `name`, while the `Order` entity has attributes for `order_id`, `customer_id`, `order_date`, and `total`. The relationship between `Customer` and `Order` is one-to-many, as one customer can have multiple orders.

## 5. Walkthrough
Suppose we have a table called `Sales` with the following data:

| product_id | sales_date | quantity | price |
| --- | --- | --- | --- |
| 1 | 2022-01-01 | 10 | 10.99 |
| 1 | 2022-01-02 | 20 | 10.99 |
| 2 | 2022-01-01 | 5 | 5.99 |
| 2 | 2022-01-03 | 15 | 5.99 |

We want to calculate the total sales for each product using the `SUM` aggregate function.

1. Group the rows by `product_id`: 
   - Group 1: `product_id` = 1, with rows for `2022-01-01` and `2022-01-02`
   - Group 2: `product_id` = 2, with rows for `2022-01-01` and `2022-01-03`

2. Calculate the total sales for each group:
   - Group 1: 
     - Quantity: 10 + 20 = 30
     - Total sales: (10 * 10.99) + (20 * 10.99) = 109.9 + 219.8 = 329.7
   - Group 2: 
     - Quantity: 5 + 15 = 20
     - Total sales: (5 * 5.99) + (15 * 5.99) = 29.95 + 89.85 = 119.8

3. The result will be:
   | product_id | total_sales |
   | --- | --- |
   | 1 | 329.7 |
   | 2 | 119.8 |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Aggregate functions in databases are used to calculate totals, averages, counts, and more from a group of values.",
    "answer": "True",
    "explanation": "Aggregate functions are indeed used for such calculations."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A company has a table of employee salaries and wants to find the average salary. Which aggregate function should they use?",
    "answer": "AVG",
    "explanation": "The AVG function calculates the average of a set of values."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the SQL query.",
    "content": "SELECT product_id, SUM(quantity) FROM Sales GROUP BY sales_date",
    "answer": "The query should group by product_id instead of sales_date.",
    "explanation": "The query is attempting to select product_id but grouping by sales_date, which will cause an error."
  }
]
```