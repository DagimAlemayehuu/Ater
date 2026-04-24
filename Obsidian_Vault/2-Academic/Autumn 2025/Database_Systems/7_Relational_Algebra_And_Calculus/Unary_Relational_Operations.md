---
title: Unary_Relational_Operations
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
Imagine you have a big box of different colored pens, and you want to pick out only the red ones or show only the pens with their colors written on them. Unary relational operations work similarly, helping you filter or change how you view data in a database table, one table at a time.

# 2. Schema & Query Mechanics
Unary relational operations involve working with a single relation [[Relation_Schema]] at a time. The SELECT operation, denoted as `σ` (sigma), filters tuples based on a [[Predicate]] condition, producing a new relation with the same [[Attribute_Set]] as the original. For example, `σ age > 18 (Employees)` selects only the employees older than 18. The PROJECT operation, denoted as `π` (pi), returns a relation with a subset of the attributes, eliminating duplicates through [[Tuple_Visibility]]. Lastly, the RENAME operation, often symbolized as `ρ` (rho), changes the names of attributes in the relation, useful for clarity or when combining operations.

# 3. ACID Violations & Scaling Limits
Unary operations like SELECT, PROJECT, and RENAME do not inherently violate [[Acid_Properties]] since they do not involve multiple transactions or alter data integrity directly. However, when these operations are part of complex queries or transactions, ensuring [[Isolation_Level]]s can prevent [[Dirty_Reads]] or [[Lost_Update]]s. Scaling limits arise when dealing with very large relations, as operations like PROJECT may require significant [[Storage_Engine]] resources to eliminate duplicates efficiently. Moreover, frequent or complex RENAME operations can lead to confusion if not managed within a coherent [[Database_Schema]] evolution strategy.
# 4. Entity-Relationship Model
```json
{
  "entities": [
    {
      "name": "Relation",
      "attributes": [
        {
          "name": "Attribute_Set",
          "type": "string"
        },
        {
          "name": "Tuple_Visibility",
          "type": "boolean"
        }
      ]
    },
    {
      "name": "Unary_Operation",
      "attributes": [
        {
          "name": "Operation_Type",
          "type": "string"
        },
        {
          "name": "Predicate",
          "type": "string"
        }
      ]
    }
  ],
  "relationships": [
    {
      "name": "applies",
      "entities": ["Unary_Operation", "Relation"],
      "cardinality": "many-to-one"
    }
  ]
}
```
To read this Entity-Relationship diagram, focus on the entities `Relation` and `Unary_Operation`, and the relationship `applies`. The `Relation` entity has attributes like `Attribute_Set` and `Tuple_Visibility`, while `Unary_Operation` has attributes like `Operation_Type` and `Predicate`. The `applies` relationship connects a unary operation to the relation it is applied to.

## 5. Walkthrough
Consider a database table `Employees` with attributes `Employee_ID`, `Name`, `Age`, and `Department`. We want to apply unary relational operations to this table.

1. **SELECT Operation**: First, we apply a SELECT operation to filter employees older than 30. The operation is denoted as `σ Age > 30 (Employees)`. The resulting relation will have the same attributes as `Employees` but only include tuples where `Age` is greater than 30.

| Employee_ID | Name | Age | Department |
|-------------|------|-----|------------|
| 101         | John | 35  | Sales      |
| 102         | Jane | 32  | Marketing  |

2. **PROJECT Operation**: Next, we apply a PROJECT operation to only include `Name` and `Department` attributes. The operation is denoted as `π Name, Department (σ Age > 30 (Employees))`. This will eliminate any duplicate combinations of `Name` and `Department`.

| Name | Department |
|------|------------|
| John | Sales      |
| Jane | Marketing  |

3. **RENAME Operation**: Finally, we apply a RENAME operation to change the attribute names to `Employee_Name` and `Department_Name`. The operation is denoted as `ρ Employee_Name=Name, Department_Name=Department (π Name, Department (σ Age > 30 (Employees)))`.

| Employee_Name | Department_Name |
|---------------|-----------------|
| John          | Sales           |
| Jane          | Marketing       |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Unary relational operations involve working with multiple relations at a time.",
    "answer": "False",
    "explanation": "Unary relational operations involve working with a single relation at a time."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given a table `Students` with attributes `Student_ID`, `Name`, and `Grade`, apply a SELECT operation to find students with a grade greater than 85, then apply a PROJECT operation to only include `Name` and `Grade`.",
    "answer": "The resulting relation will have attributes `Name` and `Grade`, and only include tuples where `Grade` is greater than 85.",
    "explanation": "This requires applying SELECT and PROJECT operations in sequence."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following query: `π Name, Department (σ Age > 30 (Employees))` where the intention is to find employees older than 30 with names and departments, but the original table has a typo in age values.",
    "content": "SELECT * FROM Employees WHERE Age > 30; // Age values are actually stored in 'Years_Old'",
    "answer": "The bug is that the query is using 'Age' instead of 'Years_Old'. The correct query should be `SELECT Name, Department FROM Employees WHERE Years_Old > 30;`",
    "explanation": "The bug is in the attribute name used in the SELECT and WHERE clauses."
  }
]
```