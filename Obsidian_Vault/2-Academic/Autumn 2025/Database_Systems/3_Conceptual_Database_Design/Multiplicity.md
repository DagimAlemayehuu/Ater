---
title: Multiplicity
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 38
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Relationship]]"
---

# 1. Technical Definition
In the context of database design, `multiplicity` refers to the number of instances of one entity that can be associated with each instance of another entity in a relationship. It is often expressed using the notation of minimum and maximum cardinality, such as `0..1` or `1..*`, where `*` represents an unlimited number.

# 2. Mental Model
Imagine you have a bunch of toy boxes and each toy box can hold a certain number of toy cars. Multiplicity is like a rule that tells you how many toy cars can be in each toy box. For example, a toy box can have zero or one toy car, or it can have many toy cars.

# 3. Schema Design
* The multiplicity of a relationship is defined by specifying the minimum and maximum number of instances of one entity that can be associated with each instance of another entity.
* Multiplicity constraints can be used to enforce business rules and ensure data consistency.
* In a one-to-many relationship, the multiplicity on the "one" side is typically `1` and on the "many" side is `0..*` or `1..*`.
* Multiplicity can be used to model optional relationships, where the multiplicity is `0..1`, or mandatory relationships, where the multiplicity is `1..1`.

# 4. Query Optimization
* When querying a database with complex relationships, the multiplicity of those relationships can impact performance, particularly if the multiplicity is `1..*` or `0..*`.
* Joins and subqueries can be optimized by taking into account the multiplicity of the relationships between tables.
* Indexing strategies can be informed by the multiplicity of relationships, with more indexes potentially needed on the "many" side of a one-to-many relationship.
* The multiplicity of relationships can also impact data denormalization strategies, where redundant data is stored to improve query performance.

---

## 5. Worked Example

```sql
CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  Name VARCHAR(255)
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT,
  OrderDate DATE,
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

### Execution Walkthrough
1. We create two tables, `Customers` and `Orders`, to demonstrate a one-to-many relationship where one customer can have multiple orders.
2. The `Customers` table has a primary key `CustomerID` and a `Name` field.
3. The `Orders` table has a primary key `OrderID`, a foreign key `CustomerID` referencing the `CustomerID` in `Customers`, and an `OrderDate` field.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the multiplicity of the relationship between Customers and Orders?

**Implementation Challenge**: A customer wants to place multiple orders; how would you design the relationship to accommodate this?

**Debug Challenge**: Write an optimized SQL JOIN to retrieve all customers with their orders.

---

### Answer Key
- L1_SCENARIO: The multiplicity is one-to-many, or `1..*`, meaning one customer can have zero or more orders.
- L2_IMPLEMENTATION: The relationship is already designed to accommodate this, as one customer can have multiple orders through the foreign key in the `Orders` table.
- L3_DEBUG: 
```sql
SELECT C.CustomerID, C.Name, O.OrderID, O.OrderDate
FROM Customers C
LEFT JOIN Orders O ON C.CustomerID = O.CustomerID;
```
This optimized SQL JOIN retrieves all customers with their orders, if any, using a LEFT JOIN to include customers with no orders.