---
title: Entity
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 16
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Conceptual Database Design]]"
---

# 1. Technical Definition
An `Entity` is a thing that has `attributes` and can be described with a set of `properties`. In a database, an entity is a table that stores data about a specific thing, such as a customer or product.

# 2. Mental Model
Imagine you have a notebook where you store information about your friends. Each friend is like an entity, and the notebook has pages (or tables) where you write down their names, ages, and favorite foods. Just like how your notebook has many pages for different friends, a database has many entities to store different types of information.

# 3. Schema Design
* An entity is typically represented as a table in a relational database.
* Each entity has a unique identifier, often called a primary key.
* Entities can have various attributes, such as name, age, or address.
* Entities can be related to each other through foreign keys.

# 4. Query Optimization
* When querying an entity, it's essential to index the columns used in the WHERE clause to improve performance.
* The number of rows in an entity table can impact query performance, with larger tables requiring more resources.
* Joining multiple entities can lead to slower query performance if not optimized properly.
* Using efficient data types for entity attributes can reduce storage costs and improve query performance.

---

## 5. Worked Example

```sql
CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  Name VARCHAR(255),
  Age INT,
  Address VARCHAR(255)
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT,
  OrderDate DATE,
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

### Execution Walkthrough
1. We create a `Customers` table with attributes `CustomerID`, `Name`, `Age`, and `Address`. The `CustomerID` is designated as the primary key.
2. We create an `Orders` table with attributes `OrderID`, `CustomerID`, `OrderDate`. The `CustomerID` is a foreign key that references the `CustomerID` in the `Customers` table, establishing a relationship between the two entities.
3. This schema design allows us to store information about customers and their orders, with the ability to query and analyze the data.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary key of the `Customers` table?

**Implementation Challenge**: A company wants to analyze the orders made by customers in a specific age group. How would you design a query to retrieve this information?

**Debug Challenge**: Optimize the SQL JOIN query to retrieve customer information and their corresponding orders.

---

### Answer Key
- L1_SCENARIO: CustomerID
- L2_IMPLEMENTATION: A query can be designed using a SELECT statement with a WHERE clause to filter customers by age group and then joining the Orders table to retrieve the corresponding orders.
- L3_DEBUG: 
```sql
SELECT c.CustomerID, c.Name, o.OrderID, o.OrderDate
FROM Customers c
INNER JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE c.Age BETWEEN 25 AND 40;
```
This optimized query uses an INNER JOIN to combine the `Customers` and `Orders` tables, and applies a filter to retrieve only customers within a specific age group.