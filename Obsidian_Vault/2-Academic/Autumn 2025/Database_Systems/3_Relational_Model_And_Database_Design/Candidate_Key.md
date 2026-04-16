---
title: Candidate_Key
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Entity_Types]]
source: [[Chapter_3.Pdf]]
source_pages:
- 33
mode: ENGINEER

---

# Definition & Mechanics
A **candidate key** is a minimal set of attributes that uniquely identifies each occurrence of an entity type. 
* **Minimality**: no subset of the attributes can uniquely identify the entity.
* **Uniqueness**: no two occurrences of the entity type can have the same values for all attributes in the candidate key.
* **Superkey**: a candidate key is a superkey with no redundant attributes.

# Worked Example
Domain: Film production

Suppose we have an entity type `Movie` with attributes:
| Attribute | Description |
| --- | --- |
| movie_title | title of the movie |
| release_year | year the movie was released |
| director_id | ID of the director |

To determine if `movie_title` is a candidate key:

| movie_title | release_year | director_id |
| --- | --- | --- |
| Inception | 2010 | 1 |
| Inception | 2015 | 2 |
| The Shawshank Redemption | 1994 | 3 |

`movie_title` alone is not a candidate key because it does not uniquely identify the entity (same title, different directors and years). However, the combination of `movie_title` and `release_year` could be a candidate key.

# Edge Case
> **Q:** Consider an entity type `Employee` with attributes `employee_id`, `name`, and `email`. Suppose two employees have the same `name` but different `employee_id` and `email`. Can `name` be a candidate key?
> **A:** No, `name` cannot be a candidate key because it does not uniquely identify each employee occurrence (multiple employees have the same name). A candidate key must uniquely identify each occurrence, and `employee_id` would be a better candidate key.

# Connections
- **Depends on:** [[Entity_Types]] — Candidate keys are a property of entity types.
- **Enables:** [[Primary_Key]] — A primary key is selected from the set of candidate keys.