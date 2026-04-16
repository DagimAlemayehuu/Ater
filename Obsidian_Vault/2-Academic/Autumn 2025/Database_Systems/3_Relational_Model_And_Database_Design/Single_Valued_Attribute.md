---
title: Single_Valued_Attribute
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
A **single-valued attribute** is an attribute that holds a single value for each occurrence of an entity type. 
* **Key characteristics:**
  + Each entity instance has only one value for the attribute.
  + No set or list of values; only a single value is allowed.
* **Notation:** Represented by a simple ellipse in traditional E-R models or a named field in UML.

# Worked Example
Domain: Film production

| Film | Title | Release_Year | Genre |
| --- | --- | --- | --- |
| 1    | Inception | 2010      | Action  |
| 2    | Interstellar | 2014      | Sci-Fi  |

In this example, `Title`, `Release_Year`, and `Genre` are single-valued attributes for the `Film` entity type. Each film has only one title, one release year, and one genre.

# Edge Case
> **Q:** A university course has multiple instructors, but for simplicity, we store only one primary instructor per course. Is the `instructor` attribute single-valued or multi-valued?
> **A:** At first glance, it seems single-valued because we store only one instructor. However, in reality, a course can have multiple instructors, making `instructor` potentially multi-valued. If the requirement is to store only one primary instructor, it is single-valued under that specific constraint. The nuance: the attribute's nature (single-valued) depends on the specific requirement rather than the inherent property of the attribute itself.

# Connections
- **Depends on:** [[Attributes]] — Single-valued attributes are a type of attribute.
- **Enables:** [[Entity_Types]] — Understanding single-valued attributes helps in defining entity types accurately.