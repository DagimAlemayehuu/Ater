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
mode: ENGINEER

---

# Definition & Mechanics
A **simple attribute** is an attribute composed of a single component with an independent existence. It has only one part and cannot be further subdivided.

* **Characteristics:**
  + Composed of a single component
  + Has an independent existence
  + Cannot be further subdivided
* **Example:** `employee_name`, `product_id`, `order_date`

# Worked Example
Domain: Film production

Suppose we are designing a database for a film production company. The entity type `Movie` has the following simple attributes:

| Attribute Name | Description |
| --- | --- |
| movie_title | The title of the movie |
| release_year | The year the movie was released |
| budget | The budget allocated for the movie |

In this example, `movie_title`, `release_year`, and `budget` are simple attributes because they are single components with independent existence.

# Edge Case
> **Q:** Consider an attribute `address` that consists of `street`, `city`, `state`, and `zip_code`. Is `address` a simple or composite attribute?
> **A:** `address` is a composite attribute because it can be further subdivided into its constituent parts: `street`, `city`, `state`, and `zip_code`. If we had an attribute `phone_number` that is a single component (e.g., a string of 10 digits), then `phone_number` would be a simple attribute.

# Connections
- **Depends on:** [[Attributes]] — Simple attributes are a type of attribute.
- **Enables:** [[Composite_Attribute]] — Understanding simple attributes helps distinguish them from composite attributes.