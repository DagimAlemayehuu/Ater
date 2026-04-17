---
title: Single_Valued_Attribute
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Attributes]]
source: [[Chapter_3.pdf]]
source_pages:
- 30
- 31
mode: ENGINEER

---

# Definition & Mechanics
A **single-valued attribute** is an attribute that holds a single value for each occurrence of an entity type. 
* **Key characteristics:**
  + Holds only one value per entity occurrence
  + No repeating groups or multiple values
  + Examples: `employee_id`, `name`, `date_of_birth`

# Worked Example
Domain: Film production

| Entity Type | Attributes | Values |
| --- | --- | --- |
| Movie | title, release_year, genre | The Shawshank Redemption, 1994, Drama |
| Actor | actor_id, name, nationality | 101, Tom Hanks, American |

In this example, `title`, `release_year`, and `genre` are single-valued attributes of the `Movie` entity type. Similarly, `actor_id`, `name`, and `nationality` are single-valued attributes of the `Actor` entity type.

# Edge Case
> **Q:** A university course has multiple instructors, but each instructor has only one role (e.g., lecturer, tutor). Is the `role` attribute single-valued or multi-valued?
> **A:** The `role` attribute is single-valued. Although there are multiple instructors for a course, each instructor has only one role. This is an example of a single-valued attribute with a many-to-one relationship between instructors and courses.

# Connections
- **Depends on:** [[Attributes]] — Single-valued attributes are a type of attribute.
- **Enables:** [[Entity_Types]] — Understanding single-valued attributes helps in defining entity types accurately.