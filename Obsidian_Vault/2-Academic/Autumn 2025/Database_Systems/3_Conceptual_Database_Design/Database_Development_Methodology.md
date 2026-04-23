---
title: Database Development Methodology
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 3
mode: CS-DB
read: false
generated: true
---

# 1. Technical Definition
The Database Development Methodology (DDM) is a structured approach to designing, developing, and implementing databases, emphasizing a systematic and iterative process to ensure data quality and integrity. It involves a series of phases, including requirements gathering, conceptual design, logical design, physical design, implementation, and maintenance, utilizing techniques such as `entity-relationship modeling` and `normalization`.

# 2. Mental Model
Imagine building a huge library. First, you need to figure out what kinds of books (data) you'll have and how they'll be organized (requirements). Then, you create a master plan (conceptual design) of how all the bookshelves (tables) and catalogs (relationships) will fit together. After that, you decide on the exact size and material of the bookshelves (physical design) and finally, you start putting the books on the shelves (implementation) and make sure everything is in order (maintenance).

# 3. Schema Design
* The methodology starts with requirements gathering to understand the data needs of the organization.
* It involves creating a conceptual data model using techniques like entity-relationship diagrams.
* The logical design phase transforms the conceptual model into a more technical map of the database, including `tables`, `indexes`, and `relationships`.
* The physical design phase focuses on the actual implementation details, such as storage and data types.

# 4. Query Optimization
* One limitation is that poor design decisions made early in the process can lead to performance issues later on.
* There's a threshold to the amount of data that can be efficiently managed, beyond which the database may require significant re-engineering.
* A constraint is that changes to the database schema can be difficult and costly to implement once the database is in use.
* Optimization often involves balancing data redundancy and data integrity through careful application of `normalization` rules.

---

## 5. Worked Example

```sql
CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  Name VARCHAR(255),
  Email VARCHAR(255) UNIQUE
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT,
  OrderDate DATE,
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

CREATE TABLE Products (
  ProductID INT PRIMARY KEY,
  ProductName VARCHAR(255),
  Price DECIMAL(10, 2)
);

CREATE TABLE OrderDetails (
  OrderID INT,
  ProductID INT,
  Quantity INT,
  PRIMARY KEY (OrderID, ProductID),
  FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
  FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
```

### Execution Walkthrough
1. The first step is to create the `Customers` table with a unique identifier `CustomerID`, `Name`, and `Email`.
2. Next, create the `Orders` table with a unique identifier `OrderID`, a foreign key `CustomerID` referencing `Customers`, and `OrderDate`.
3. Then, create the `Products` table with a unique identifier `ProductID`, `ProductName`, and `Price`.
4. Finally, create the `OrderDetails` table with a composite primary key of `OrderID` and `ProductID`, and foreign keys referencing `Orders` and `Products`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What are the main entities in this database schema?

**Implementation Challenge**: Suppose you need to find all orders placed by a specific customer, along with the products ordered and their quantities. How would you write a SQL query to achieve this?

**Debug Challenge**: Optimize the SQL JOIN for the L2 scenario to reduce data redundancy and improve performance.

---

### Answer Key
- L1_SCENARIO: The main entities are `Customers`, `Orders`, `Products`, and `OrderDetails`.
- L2_IMPLEMENTATION: 
```sql
SELECT c.Name, o.OrderID, p.ProductName, od.Quantity
FROM Customers c
JOIN Orders o ON c.CustomerID = o.CustomerID
JOIN OrderDetails od ON o.OrderID = od.OrderID
JOIN Products p ON od.ProductID = p.ProductID
WHERE c.CustomerID = [specific_customer_id];
```
- L3_DEBUG: 
```sql
SELECT c.Name, o.OrderID, p.ProductName, od.Quantity
FROM Customers c
JOIN (
  SELECT o.OrderID, o.CustomerID, od.ProductID, od.Quantity
  FROM Orders o
  JOIN OrderDetails od ON o.OrderID = od.OrderID
) od ON c.CustomerID = od.CustomerID
JOIN Products p ON od.ProductID = p.ProductID
WHERE c.CustomerID = [specific_customer_id];
```