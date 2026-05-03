---
title: Relational_Algebra_Overview
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 3
mode: CS-DB
read: false
generated: true
---

# 1. Mental Model
Imagine you have a big box full of different colored cards, each with some information written on it, like a name and an age. Relational algebra is like a set of instructions that helps you pick out specific cards from the box, or combine cards from different boxes, based on certain rules. It's a way to work with these cards (or data) in a structured and logical way.

# 2. Schema & Query Mechanics
Relational algebra operates on relations, which are sets of tuples, by using various [[Algebraic_Operations]] such as [[Selection]], [[Projection]], and [[Join]]. When a query is executed, the relational algebra operations are applied to the [[Relation_Schema]], which defines the structure of the data, to produce a new relation. The [[Query_Optimizer]] analyzes the query and chooses the most efficient way to execute it, taking into account factors like [[Indexing]] and [[Data_Distribution]]. The query is then executed by applying the relational algebra operations to the data, producing a result set that is returned to the user.

# 3. ACID Violations & Scaling Limits
As the size of the data grows, relational algebra operations can become computationally expensive, leading to [[Scalability]] issues. If not properly managed, concurrent access to the data can lead to [[Acid]] violations, such as [[Dirty_Reads]] or [[Lost_Updates]]. To mitigate these risks, database systems use techniques like [[Locking]] and [[Transaction_Isolation]] to ensure data consistency and integrity. However, these techniques can introduce additional overhead and limit the scalability of the system, requiring careful tuning and optimization to achieve high performance.
# 4. Entity-Relationship Model
```json
{
  "entities": [
    {
      "name": "Customer",
      "attributes": [
        {"name": "customer_id", "type": "int"},
        {"name": "name", "type": "string"},
        {"name": "age", "type": "int"}
      ]
    },
    {
      "name": "Order",
      "attributes": [
        {"name": "order_id", "type": "int"},
        {"name": "customer_id", "type": "int"},
        {"name": "order_date", "type": "date"}
      ]
    }
  ],
  "relationships": [
    {
      "name": "places",
      "type": "one_to_many",
      "entities": ["Customer", "Order"]
    }
  ]
}
```
This entity-relationship model represents two entities: Customer and Order. A customer can place many orders, but an order is associated with only one customer. The relationships between entities are crucial in relational algebra.

## 5. Walkthrough
Suppose we have two relations: Customer and Order.

Customer:

| customer_id | name | age |
| --- | --- | --- |
| 1 | John | 25 |
| 2 | Jane | 30 |
| 3 | Joe | 20 |

Order:

| order_id | customer_id | order_date |
| --- | --- | --- |
| 101 | 1 | 2022-01-01 |
| 102 | 1 | 2022-01-15 |
| 103 | 2 | 2022-02-01 |

We want to find all orders placed by customers who are older than 25.

1. First, we select customers who are older than 25 from the Customer relation: 
   - Selection: σ (age > 25) (Customer) = { (2, Jane, 30) }

2. Then, we join the result with the Order relation on the customer_id attribute: 
   - Join: (σ (age > 25) (Customer)) ⨝ (Order) = { (2, Jane, 30, 103, 2, 2022-02-01) }

3. Finally, we project the result to only include order_id, customer_id, and order_date: 
   - Projection: π (order_id, customer_id, order_date) ({ (2, Jane, 30, 103, 2, 2022-02-01) }) = { (103, 2, 2022-02-01) }

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Relational algebra operates on relations, which are sets of tuples.",
    "answer": "True",
    "explanation": "Relational algebra indeed operates on relations, which are sets of tuples."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have a relation Student with attributes student_id, name, and age. We want to find all students who are older than 20. Which relational algebra operation should we use?",
    "answer": "Selection: σ (age > 20) (Student)",
    "explanation": "The selection operation is used to select tuples from a relation based on a condition."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug.",
    "content": "π (student_id, name) (σ (age > 20) (Student)) ⋈ Course",
    "answer": "The bug is that the join operation is not properly defined. The correct expression should be: π (student_id, name) (σ (age > 20) (Student)) ⋈_student_id (Course)",
    "explanation": "The join operation requires a common attribute to join the two relations."
  }
]
```