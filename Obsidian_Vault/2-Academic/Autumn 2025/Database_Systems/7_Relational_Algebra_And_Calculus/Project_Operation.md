---
title: PROJECT_Operation
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '7'
hub: "[[7_Relational_Algebra_And_Calculus_Hub]]"
source: "[[Chapter_7.Pdf]]"
source_pages:
- 12
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Unary_Relational_Operations]]"
---

# 1. Mental Model
Imagine you have a big box full of different colored balls, and each ball has a number and a color written on it. The PROJECT operation is like taking a picture of each ball, but only showing the color, and throwing away the number. You're left with a collection of pictures that only show the color of each ball.

# 2. Schema & Query Mechanics
The PROJECT operation works by taking a relation (or table) and returning a new relation that only includes the specified [[Projected_Attributes]]. Mechanically, this involves iterating over each [[Tuple]] in the original relation, and for each tuple, creating a new tuple that only includes the [[Projected_Attributes]]. The resulting relation has the same number of tuples as the original relation, but with a reduced [[Arity]] (number of attributes). The PROJECT operation does not eliminate duplicate tuples, so if there are duplicate tuples in the original relation, there will be duplicate tuples in the resulting relation as well. The operation relies on the [[Schema]] of the original relation to determine the structure of the output.

# 3. ACID Violations & Scaling Limits
The PROJECT operation does not violate [[Acid]] properties, as it is a read-only operation that does not modify the original relation. However, if the PROJECT operation is applied to a very large relation, it may exceed [[Storage_Limits]] or [[Memory_Constraints]], leading to performance degradation or errors. Additionally, if the PROJECT operation is applied to a relation with a large number of tuples, it may lead to [[Data_Skew]], where the resulting relation has a highly uneven distribution of tuples. In a distributed database system, the PROJECT operation may also be limited by [[Network_Bandwidth]] and [[Communication_Overhead]], leading to slower performance.
# 4. Entity-Relationship Model
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PROJECT Operation",
  "type": "object",
  "properties": {
    "originalRelation": {
      "type": "object",
      "properties": {
        "tuples": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "schema": {
          "type": "object",
          "properties": {
            "attributes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "projectedAttributes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "resultRelation": {
      "type": "object",
      "properties": {
        "tuples": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "schema": {
          "type": "object",
          "properties": {
            "attributes": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      }
    }
  }
}
```
This JSON schema represents the PROJECT operation, including the original relation, the projected attributes, and the resulting relation. The schema defines the structure of the input and output relations, including the tuples and attributes.

The schema can be read by understanding the properties of the original relation, projected attributes, and resulting relation. The original relation has tuples and a schema with attributes. The projected attributes are an array of strings representing the attributes to be projected. The resulting relation has tuples and a schema with attributes, which are a subset of the original relation's attributes.

## 5. Walkthrough
Suppose we have a relation `Employees` with the following tuples and schema:

| EmployeeID | Name | Department | Salary |
| --- | --- | --- | --- |
| 1 | John Smith | Sales | 50000 |
| 2 | Jane Doe | Marketing | 60000 |
| 3 | Bob Brown | Sales | 40000 |

The schema of the `Employees` relation is:

* EmployeeID (integer)
* Name (string)
* Department (string)
* Salary (integer)

We want to apply the PROJECT operation to the `Employees` relation to get a new relation that only includes the `Name` and `Department` attributes.

Here are the steps:

1. Identify the original relation: `Employees`
2. Identify the projected attributes: `Name`, `Department`
3. Iterate over each tuple in the original relation:
	* Tuple 1: EmployeeID = 1, Name = John Smith, Department = Sales, Salary = 50000
		+ Create a new tuple with only the projected attributes: Name = John Smith, Department = Sales
	* Tuple 2: EmployeeID = 2, Name = Jane Doe, Department = Marketing, Salary = 60000
		+ Create a new tuple with only the projected attributes: Name = Jane Doe, Department = Marketing
	* Tuple 3: EmployeeID = 3, Name = Bob Brown, Department = Sales, Salary = 40000
		+ Create a new tuple with only the projected attributes: Name = Bob Brown, Department = Sales
4. Create the resulting relation with the projected tuples:
	+ Tuple 1: Name = John Smith, Department = Sales
	+ Tuple 2: Name = Jane Doe, Department = Marketing
	+ Tuple 3: Name = Bob Brown, Department = Sales

The resulting relation has the following schema:

* Name (string)
* Department (string)

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The PROJECT operation eliminates duplicate tuples.",
    "answer": "False",
    "explanation": "The PROJECT operation does not eliminate duplicate tuples."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose we have a relation `Students` with attributes `StudentID`, `Name`, and `Grade`. We apply the PROJECT operation to get a new relation with only the `Name` and `Grade` attributes. If the original relation has 5 tuples, how many tuples will the resulting relation have?",
    "answer": "5",
    "explanation": "The PROJECT operation does not eliminate duplicate tuples, so the resulting relation will have the same number of tuples as the original relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "PROJECT (Students, [Name, Grade]) = SELECT * FROM Students",
    "answer": "The bug is that the PROJECT operation is implemented as a SELECT * operation, which does not project only the specified attributes.",
    "explanation": "The PROJECT operation should only return the specified attributes, not all attributes."
  }
]
```