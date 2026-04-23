---
title: Attribute
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 29
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Entity]]"
---

# 1. Technical Definition
An `attribute` is a characteristic or property of an `entity` that describes it, such as a name, address, or phone number. In computing, an attribute is a data element that is used to define the properties of an object, and is often represented as a `key-value pair`.

# 2. Mental Model
Imagine you have a friend, and you want to describe them to someone else. You might say they have blue eyes, curly brown hair, and a big smile. These are all attributes that help describe your friend. Just like how attributes help describe an object or a person in the real world.

# 3. Schema Design
* Attributes are used to define the properties of an `entity`.
* Attributes can be simple, such as a `string` or `integer`, or complex, such as a `struct` or `list`.
* Attributes are often used to store metadata about an entity.
* Attributes can be used to enable searching, filtering, and sorting of entities.

# 4. Query Optimization
* Attributes have limitations on their data type and size.
* Attributes can have thresholds on their values, such as a maximum length for a string attribute.
* Attributes can have constraints, such as uniqueness or mandatory requirements.
* Attributes can impact query performance, and optimizing attribute access can improve query speed.

---

## 5. Worked Example

```sql
CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  Name VARCHAR(255),
  Address VARCHAR(255),
  Phone VARCHAR(20)
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT,
  OrderDate DATE,
  Total DECIMAL(10, 2),
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

### Execution Walkthrough
1. We create two tables, `Customers` and `Orders`, to store information about customers and their orders.
2. The `Customers` table has attributes `CustomerID`, `Name`, `Address`, and `Phone`, which describe a customer.
3. The `Orders` table has attributes `OrderID`, `CustomerID`, `OrderDate`, and `Total`, which describe an order, and a foreign key `CustomerID` that references the `CustomerID` in the `Customers` table.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the name of the attribute that stores the customer's phone number in the `Customers` table?

**Implementation Challenge**: Suppose we want to retrieve the names and phone numbers of all customers who have placed an order. How would we write a SQL query to achieve this?

**Debug Challenge**: Optimize the SQL JOIN for the query in L2_IMPLEMENTATION to reduce the number of columns being joined.

---

### Answer Key
- L1_SCENARIO: The attribute that stores the customer's phone number is `Phone`.
- L2_IMPLEMENTATION: We can write a SQL query using a JOIN to retrieve the required information: 
```sql
SELECT C.Name, C.Phone 
FROM Customers C 
JOIN Orders O ON C.CustomerID = O.CustomerID;
```
- L3_DEBUG: To optimize the SQL JOIN, we can specify only the required columns in the SELECT statement and use a more efficient JOIN type if possible:
```sql
SELECT C.Name, C.Phone 
FROM Customers C 
INNER JOIN Orders O ON C.CustomerID = O.CustomerID;
```