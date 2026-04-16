---
title: Simple_Attribute
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Attributes]]
source: [[Chapter_3.Pdf]]
source_pages:
- 30
- 31
mode: ENGINEER

---

# Definition & Mechanics
A **simple attribute** is an attribute composed of a single component with an independent existence. 
* **Key characteristics:**
  + Composed of a single component
  + Has an independent existence
  + Cannot be broken down further

# Worked Example
Domain: Film production

Consider a film entity with attributes:
| Attribute Name | Type | Description |
| --- | --- | --- |
| film_id | Simple | Unique identifier |
| film_title | Simple | Title of the film |
| film_length | Simple | Length in minutes |

In this example, `film_id`, `film_title`, and `film_length` are simple attributes.

# Edge Case
> **Q:** An e-commerce company models a `Product` entity with an attribute `address`. The `address` attribute includes street, city, state, and zip code. Is `address` a simple or composite attribute?
> **A:** Composite. Although `address` is a single attribute, it can be broken down into multiple components (street, city, state, zip code), making it composite. A simple attribute like `product_id` would be a single, indivisible component.

# Connections
- **Depends on:** [[Attributes]] — Simple attributes are a type of attribute.
- **Enables:** [[Entity_Types]] — Understanding simple attributes helps in defining entity types accurately.