---
title: Conceptual Database Design
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 8
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Database System Development Lifecycle]]"
---

# 1. Technical Definition
Conceptual Database Design is the process of constructing a model of the data used in an enterprise, independent of all physical considerations. It focuses on identifying the entities, attributes, and relationships that are relevant to the enterprise, often using `Entity-Relationship Diagrams` (ERDs) or `Unified Modeling Language` (UML) to represent the data structure.

# 2. Mental Model
Imagine you're building a big Lego castle. Before you start building, you need to plan what it will look like. You think about what rooms it will have, what the walls will look like, and how everything will fit together. Conceptual Database Design is like planning the Lego castle, but instead of blocks, you're planning how all the information in a company will be organized and connected.

# 3. Schema Design
* Identify key entities and their relationships within the enterprise.
* Define the attributes of each entity to capture relevant data.
* Determine the cardinality and optionality of relationships between entities.
* Develop a high-level data model using `Entity-Relationship Diagrams` (ERDs) or similar notations.

# 4. Query Optimization
* The design should be flexible enough to accommodate changing business needs.
* It should not be overly influenced by specific database management system (DBMS) capabilities or limitations.
* The model must be able to handle large volumes of data and scale as needed.
* Performance considerations are not the primary focus at this stage, but the design should support efficient querying and data retrieval.

---

## 5. Worked Example

```markdown
+---------------+
|     Customer  |
+---------------+
|  CustomerID   |
|  Name         |
|  Email        |
+---------------+
       |
       | 1:N
       v
+---------------+
|     Order     |
+---------------+
|  OrderID      |
|  CustomerID   |
|  OrderDate    |
+---------------+
       |
       | 1:N
       v
+---------------+
|     OrderItem |
+---------------+
|  OrderItemID  |
|  OrderID      |
|  ProductID    |
|  Quantity     |
+---------------+
       |
       | 1:N
       v
+---------------+
|     Product   |
+---------------+
|  ProductID    |
|  ProductName  |
|  Price        |
+---------------+
```

### Execution Walkthrough
1. Identify the key entities: Customer, Order, OrderItem, and Product.
2. Define the attributes for each entity: Customer (CustomerID, Name, Email), Order (OrderID, CustomerID, OrderDate), OrderItem (OrderItemID, OrderID, ProductID, Quantity), and Product (ProductID, ProductName, Price).
3. Determine the relationships and cardinalities: A customer can have many orders (1:N), an order is associated with one customer, an order can have many order items (1:N), and an order item is associated with one order and one product.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary goal of conceptual database design?

**Implementation Challenge**: Design a simple database schema for an e-commerce platform that includes customers, orders, and products.

**Debug Challenge**: Write an optimized SQL JOIN to retrieve all orders with their corresponding customer information and order items.

---

### Answer Key
- L1_SCENARIO: The primary goal of conceptual database design is to construct a model of the data used in an enterprise, independent of all physical considerations.
- L2_IMPLEMENTATION: The provided ER diagram block represents a simple schema for an e-commerce platform.
- L3_DEBUG: 
```sql
SELECT 
    c.CustomerID, 
    c.Name, 
    o.OrderID, 
    o.OrderDate, 
    oi.OrderItemID, 
    p.ProductName, 
    oi.Quantity
FROM 
    Customer c
INNER JOIN 
    Order o ON c.CustomerID = o.CustomerID
INNER JOIN 
    OrderItem oi ON o.OrderID = oi.OrderID
INNER JOIN 
    Product p ON oi.ProductID = p.ProductID;
```