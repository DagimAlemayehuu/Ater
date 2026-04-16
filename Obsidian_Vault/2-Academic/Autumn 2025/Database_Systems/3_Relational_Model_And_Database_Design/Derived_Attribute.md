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
  + **Dependent on other attributes**: Its value is derived from one or more attributes.
  + **Indicated by a dotted line ellipse** in traditional ER diagrams.

# Worked Example
Domain: Film production

Suppose we have an entity type `Movie` with attributes `title`, `release_year`, and `duration_in_minutes`. We can derive an attribute `age_in_years` based on the current year and `release_year`.

| title | release_year | duration_in_minutes |
| --- | --- | --- |
| Inception | 2010 | 148 |
| Interstellar | 2014 | 169 |
| The Shawshank Redemption | 1994 | 142 |

The derived attribute `age_in_years` (assuming the current year is 2024):

| title | release_year | duration_in_minutes | age_in_years |
| --- | --- | --- | --- |
| Inception | 2010 | 148 | 14 |
| Interstellar | 2014 | 169 | 10 |
| The Shawshank Redemption | 1994 | 142 | 30 |

# Edge Case
> **Q:** Consider an entity type `Employee` with attributes `salary` and `bonus`. Is `total_compensation` (sum of `salary` and `bonus`) a derived attribute if it is stored in the database?
> **A:** Yes, it is still a derived attribute because its value can be calculated from other attributes. However, it is a **redundant** derived attribute since it is stored. Ideally, `total_compensation` should be calculated on the fly to avoid data inconsistencies.

# Connections
- **Depends on:** [[Attributes]] — Derived attributes are a type of attribute.
- **Enables:** [[Entity_Types]] — Understanding derived attributes helps in accurately modeling entity types and their relationships.