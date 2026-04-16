---
title: Multi_Valued_Attribute
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Attributes]]
source: [[Chapter_3.Pdf]]
source_pages:
- 31
- 32
mode: ENGINEER

---

# Definition & Mechanics
A **multi-valued attribute** is an attribute that holds multiple values for each occurrence of an entity type. 
* **Key characteristics:**
  + Holds multiple values for each entity occurrence.
  + Represented by a double line ellipse in the traditional E-R model.
  + Indicated by `[Min..Max]` boundary in UML.

# Worked Example
Domain: Online Shopping Platform

Consider a product with multiple colors and sizes.

| Product_ID | Name | Colors | Sizes |
|------------|------|--------|--------|
| 1          | Shirt | Red, Blue | S, M, L |
| 2          | Pants | Black   | M, L, XL |

In this example, `Colors` and `Sizes` are multi-valued attributes.

# Edge Case
> **Q:** A university course has multiple lecturers and multiple tutorials. Should `lecturers` and `tutorials` be modeled as multi-valued attributes of the `Course` entity?
> **A:** Yes, both `lecturers` and `tutorials` can be multi-valued attributes because a course can have more than one lecturer and more than one tutorial. This is in line with the definition of a multi-valued attribute.

# Connections
- **Depends on:** [[Attributes]] — Multi-valued attributes are a type of attribute.
- **Enables:** [[Entity_Types]] — Understanding multi-valued attributes helps in accurately modeling entity types.