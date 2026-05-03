---
title: OUTER_UNION_Operation
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 63
mode: CS-DB
read: false
generated: true
---

# 1. Mental Model
Imagine you have two boxes of LEGOs, each with different shaped bricks that don't quite fit together. The outer union operation is like a special adapter that lets you combine these boxes, even if the bricks aren't exactly the same, by adding a kind of "universal" connector that makes them compatible.

# 2. Schema & Query Mechanics
The outer union operation is used to combine the tuples of two relations that are not type compatible. When performing an outer union, the database creates a new relation that includes all the attributes from both relations. To make the relations compatible, [[Null]] values are used to fill in the gaps where the relations have different attributes. The [[Union Operator]] is used in conjunction with [[Outer Join]] mechanics to achieve this. The resulting relation has a [[Schema]] that is the superset of the schemas of the two input relations.

# 3. ACID Violations & Scaling Limits
When performing an outer union operation, there is a risk of [[Data Inconsistency]] if the relations being combined have different data types or lengths, which can lead to [[Acid]] violations. Additionally, the operation can be resource-intensive and may lead to [[Scalability]] issues if the relations being combined are very large. The database must also handle [[Null]] values properly to avoid errors. Furthermore, the outer union operation may not be [[Atomic]] if the relations being combined are being modified concurrently, which can lead to [[Isolation]] issues. As a result, careful consideration must be given to [[Transaction Management]] when using outer union operations.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Outer Union Operation",
  "type": "object",
  "properties": {
    "Relation1": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"}
      },
      "required": ["id", "name"]
    },
    "Relation2": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "age": {"type": "integer"}
      },
      "required": ["id", "age"]
    },
    "OuterUnion": {
      "type": "object",
      "properties": {
        "id": {"type": ["integer", "null"]},
        "name": {"type": ["string", "null"]},
        "age": {"type": ["integer", "null"]}
      },
      "required": ["id"]
    }
  }
}
```
This JSON schema represents two relations, `Relation1` and `Relation2`, with different attributes. The `OuterUnion` relation combines the attributes of both relations, using null values to fill in the gaps where the relations have different attributes.

## 5. Walkthrough
Suppose we have two relations, `Employees` and `Departments`, with the following data:

`Employees`:

| id | name |
| --- | --- |
| 1  | John |
| 2  | Jane |
| 3  | Joe  |

`Departments`:

| id | age | department |
| --- | --- | --- |
| 1  | 25  | Sales      |
| 2  | 30  | Marketing  |
| 4  | 35  | IT         |

To perform an outer union operation on these relations, we follow these steps:

1. Identify the relations to be combined: `Employees` and `Departments`.
2. Determine the common attribute: `id`.
3. Create a new relation with all attributes from both relations: `id`, `name`, `age`, and `department`.
4. Fill in the gaps with null values:
	* For `Employees`, add null values for `age` and `department`.
	* For `Departments`, add null values for `name`.
5. Combine the tuples:
	* For `id` = 1, `Employees` has `name` = John, and `Departments` has `age` = 25 and `department` = Sales. The resulting tuple is (1, John, 25, Sales).
	* For `id` = 2, `Employees` has `name` = Jane, and `Departments` has `age` = 30 and `department` = Marketing. The resulting tuple is (2, Jane, 30, Marketing).
	* For `id` = 3, `Employees` has `name` = Joe, but there is no matching tuple in `Departments`. The resulting tuple is (3, Joe, null, null).
	* For `id` = 4, `Departments` has `age` = 35 and `department` = IT, but there is no matching tuple in `Employees`. The resulting tuple is (4, null, 35, IT).

The resulting relation, `OuterUnion`, has the following data:

| id | name | age | department |
| --- | --- | --- | --- |
| 1  | John | 25  | Sales      |
| 2  | Jane | 30  | Marketing  |
| 3  | Joe  | null | null      |
| 4  | null | 35  | IT         |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The outer union operation is used to combine relations with identical schemas.",
    "answer": "False",
    "explanation": "The outer union operation is used to combine relations that are not type compatible."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have two relations, `Customers` and `Orders`, with different attributes. How would you perform an outer union operation on these relations?",
    "answer": "Create a new relation with all attributes from both relations, fill in the gaps with null values, and combine the tuples.",
    "explanation": "The outer union operation combines the tuples of two relations that are not type compatible by adding null values to fill in the gaps."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following SQL code: `SELECT * FROM Customers UNION SELECT * FROM Orders`",
    "content": "SELECT * FROM Customers UNION SELECT * FROM Orders",
    "answer": "The bug is that the UNION operator is used without properly handling null values for incompatible attributes. To fix this, use the outer union operation with null values.",
    "explanation": "The UNION operator requires the relations to have compatible schemas, which is not the case here."
  }
]
```