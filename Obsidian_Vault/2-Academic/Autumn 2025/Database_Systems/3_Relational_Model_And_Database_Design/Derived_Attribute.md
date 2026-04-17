---
title: Derived_Attribute
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Attributes]]
source: [[Chapter_3.Pdf]]
source_pages:
- 32
mode: ENGINEER

---

# Definition & Mechanics
A **derived attribute** represents a value that is calculable from related attributes, not necessarily in the same entity type. It is **computed on the fly** and does not store redundant data.

* **Characteristics:**
  + **Not stored physically**: The value is calculated when needed.
  + **Dependent on other attributes**: Changes in base attributes affect the derived attribute.
  + **Indicated by a dotted line ellipse** in traditional ER models or a “/” prefix in UML.

# Worked Example
Domain: Film production

Suppose we have an entity type `Movie` with attributes `production_cost` and `marketing_cost`. We can derive the `total_cost` as the sum of these two attributes.

| Movie_ID | production_cost | marketing_cost |
|----------|------------------|-----------------|
| M1       | 1000000          | 500000          |
| M2       | 800000           | 300000          |

The derived attribute `total_cost` would be:

| Movie_ID | total_cost |
|----------|------------|
| M1       | 1500000    |
| M2       | 1100000    |

# Edge Case
> **Q:** Consider an entity type `Order` with attributes `order_date` and `delivery_date`. Is `order_age` (calculated as the difference between `delivery_date` and `order_date`) a derived attribute if `order_age` is stored in the database and updated periodically?
> **A:** Yes, `order_age` is still a derived attribute because its value is determined by other attributes, even though it is stored. The key characteristic is that it is derived from other data, not that it is never stored.

# Connections
- **Depends on:** [[Attributes]] — Derived attributes are a type of attribute.
- **Enables:** [[Entity_Types]] — Understanding derived attributes helps in accurately modeling entity types and their relationships.