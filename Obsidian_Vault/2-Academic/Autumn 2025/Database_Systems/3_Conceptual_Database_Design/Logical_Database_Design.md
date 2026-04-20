---
title: Logical Database Design
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: [[3_Conceptual_Database_Design_Hub]]
source: [[Chapter_3.Pdf]]
source_pages:
- 9
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Logical database design is the process of creating a detailed representation of a database structure, focusing on the relationships between entities and the attributes that describe them. It serves as a bridge between the conceptual and physical database designs.

## 2. Technical Deep-Dive
Logical database design involves several key steps:
  1. **Entity Identification**: Determine the entities that will be represented in the database. Entities are objects or concepts that have independent existence, such as customers, orders, or products.
  2. **Attribute Identification**: Identify the attributes or properties of each entity. For example, a customer entity might have attributes like customer ID, name, address, and phone number.
  3. **Key Selection**: Choose a primary key for each entity, which uniquely identifies each instance of the entity. Foreign keys are used to establish relationships between entities.
  4. **Relationship Establishment**: Define the relationships between entities, including one-to-one, one-to-many, and many-to-many relationships.
  5. **Normalization**: Apply normalization rules to ensure the database structure is efficient, scalable, and minimizes data redundancy.

  The goal of logical database design is to create a schema that supports the required transactions and queries efficiently while ensuring data integrity and scalability.

  Key concepts in logical database design include:
  - **Entities**: Represent objects or concepts in the database.
  - **Attributes**: Describe the properties of entities.
  - **Primary Key**: Uniquely identifies each instance of an entity.
  - **Foreign Key**: Establishes relationships between entities.
  - **Relationships**: Define how entities interact or are associated.
  - **Normalization**: The process of organizing data to minimize redundancy and dependency.

  By focusing on the logical structure, designers can create a database that meets the needs of the application while being adaptable to future changes.

## 3. Step-by-Step Visualization
### The Artifact

```text
Example of a simple logical database design:

  sql
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
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
  );
  

  In this example, `Customers` and `Orders` are entities. `CustomerID` is a primary key in `Customers` and a foreign key in `Orders`, establishing a relationship between the two tables.
```


### Logic Walkthrough / Execution Trace
1. **Identify Entities**: The entities here are `Customers` and `Orders`.
  2. **Identify Attributes**: 
    - `Customers` has `CustomerID`, `Name`, `Address`, and `Phone`.
    - `Orders` has `OrderID`, `CustomerID`, and `OrderDate`.
  3. **Select Keys**:
    - `CustomerID` is the primary key for `Customers`.
    - `OrderID` is the primary key for `Orders`.
    - `CustomerID` in `Orders` is a foreign key referencing `Customers`.
  4. **Establish Relationships**: A customer can have multiple orders (one-to-many).
  5. **Normalization**: The design is already normalized as each table has a primary key and dependencies are managed through foreign keys.

## 4. The Trap (Edge Case Analysis)
A common mistake in logical database design is failing to normalize the database properly, leading to data redundancy and potential inconsistencies. For example, storing customer information in the `Orders` table would lead to redundancy if the same customer places multiple orders.

  **Silver Bullet Solution**: Ensure that each piece of data has a single source of truth. In the example, customer information is only stored in the `Customers` table, and `Orders` references this information via the `CustomerID` foreign key.
---

## 5. Socratic Discovery (Probes)

> [!ABSTRACT] Knowledge Verification
> **Scenario-Based Question**: What happens if you have two entities, 'Customers' and 'Orders', with a one-to-many relationship between them, and you want to ensure that each order is associated with a valid customer?
> **Implementation Challenge**: A customer entity has attributes like customer ID, name, address, and phone number. If you want to establish a relationship between 'Customers' and 'Orders' such that each order is associated with one customer, what SQL constraint would you use in the 'Orders' table?
> **Socratic Debugger**: The following code block is intended to establish a relationship between 'Customers' and 'Orders' tables. However, there is a subtle error:

```
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
  FOREIGN KEY (Orders.CustomerID) REFERENCES Customers(CustomerID)
);
```

How would you fix this code to correctly establish the relationship?