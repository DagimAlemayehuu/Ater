---
title: Binary_Relational_Operations
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
Imagine you have two boxes of LEGOs, one with different colored bricks and the other with various shapes. A binary relational operation is like combining these boxes based on specific rules, such as matching colors with shapes. This helps create a new, more organized box of LEGOs that shows relationships between the bricks and shapes.

# 2. Schema & Query Mechanics
Binary relational operations, specifically JOIN and DIVISION, work by taking two relations (or tables) as input and producing a new relation as output. In a JOIN operation, the [[Relational_Algebra]] defines how to combine rows from two tables based on a common attribute, such as a key. The [[Theta_Join]] and [[Equijoin]] are types of JOIN operations that apply different conditions for matching rows. Mechanically, the database uses [[Hash_Joins]] or [[Sort_Merge_Joins]] to efficiently combine the rows. When performing a DIVISION operation, the database produces a new relation that contains attributes not present in the divisor relation.

# 3. ACID Violations & Scaling Limits
When performing binary relational operations, especially in a [[Distributed_Database]] or under high concurrency, there is a risk of [[Dirty_Reads]] and [[Non-Repeatable_Reads]], which can violate [[Acid]] properties. As the size of the input relations increases, the operation's performance may degrade, leading to [[Scalability]] issues. In such cases, the database may need to employ [[Sharding]] or [[Parallel_Processing]] to distribute the workload and maintain performance. However, these solutions can introduce additional complexity and potential [[Deadlocks]], requiring careful tuning and monitoring.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Binary Relational Operations",
  "type": "object",
  "properties": {
    "tables": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "attributes": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["name", "attributes"]
      }
    },
    "operation": {
      "type": "string",
      "enum": ["JOIN", "DIVISION"]
    },
    "joinCondition": {
      "type": "object",
      "properties": {
        "type": {"type": "string", "enum": ["Equijoin", "Theta Join"]},
        "attribute": {"type": "string"}
      },
      "required": ["type", "attribute"]
    }
  },
  "required": ["tables", "operation", "joinCondition"]
}
```
This JSON schema represents the structure of binary relational operations, including the tables involved, the type of operation (JOIN or DIVISION), and the join condition (if applicable). The schema defines the properties of the tables, such as their names and attributes, and the join condition, including the type of join (Equijoin or Theta Join) and the attribute used for matching.

## 5. Walkthrough
Suppose we have two tables, `Orders` and `Customers`, and we want to perform an Equijoin on the `CustomerID` attribute.

`Orders` table:

| OrderID | CustomerID | OrderDate |
| --- | --- | --- |
| 1 | 101 | 2022-01-01 |
| 2 | 102 | 2022-01-15 |
| 3 | 101 | 2022-02-01 |

`Customers` table:

| CustomerID | Name | Address |
| --- | --- | --- |
| 101 | John Smith | New York |
| 102 | Jane Doe | Los Angeles |

Here are the steps to perform the Equijoin:

1. Identify the join attribute: `CustomerID`.
2. Match the rows from `Orders` and `Customers` based on the `CustomerID` attribute.
3. Create a new table with the combined attributes from both tables.

Resulting table:

| OrderID | CustomerID | OrderDate | Name | Address |
| --- | --- | --- | --- | --- |
| 1 | 101 | 2022-01-01 | John Smith | New York |
| 3 | 101 | 2022-02-01 | John Smith | New York |
| 2 | 102 | 2022-01-15 | Jane Doe | Los Angeles |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A binary relational operation can only be performed on two tables with the same attributes.",
    "answer": "False",
    "explanation": "Binary relational operations can be performed on two tables with different attributes, as long as there is a common attribute to join on."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two tables, `Employees` and `Departments`, and we want to perform a Theta Join on the `Salary` attribute. The `Employees` table has the following rows: `| EmployeeID | Name | Salary | DepartmentID |`, and the `Departments` table has the following rows: `| DepartmentID | DepartmentName |`. How would you perform the Theta Join to get the employees with a salary greater than $50,000 and their corresponding department names?",
    "answer": "SELECT * FROM Employees JOIN Departments ON Employees.DepartmentID = Departments.DepartmentID AND Employees.Salary > 50000",
    "explanation": "The Theta Join is performed by specifying the join condition, including the attribute to join on and the condition for the salary."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code: `SELECT * FROM Orders JOIN Customers ON Orders.CustomerID = Customers.CustomerID OR Orders.OrderID = Customers.CustomerID`",
    "content": "SELECT * FROM Orders JOIN Customers ON Orders.CustomerID = Customers.CustomerID OR Orders.OrderID = Customers.CustomerID",
    "answer": "The bug is that the join condition is using an OR operator, which can lead to incorrect results. The correct join condition should only use the AND operator to specify the join attribute.",
    "explanation": "The OR operator can cause the join to produce incorrect results, as it will match rows based on either the CustomerID or the OrderID attributes."
  }
]
```