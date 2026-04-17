---
title: Keys
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Entity_Types]]
source: [[Chapter_3.pdf]]
source_pages:
- 33
- 34
mode: ENGINEER

---

# Definition & Mechanics
A **key** is a minimal set of attributes that uniquely identifies each occurrence of an entity type. There are two main types of keys:
* **Candidate Key**: a minimal set of attributes that uniquely identifies each occurrence of an entity type.
* **Primary Key**: a candidate key selected to uniquely identify each occurrence of an entity type.

**Key Characteristics:**
* **Uniqueness**: each key value must be unique.
* **Minimality**: a key must not have any redundant attributes.

# Worked Example
Domain: Film production

Suppose we have an entity type `Movie` with attributes `movie_id`, `title`, `release_year`, and `genre`. We want to identify a key for `Movie`.

| Attribute | Description | Candidate Key |
| --- | --- | --- |
| movie_id | unique identifier | movie_id |
| title | movie title | - |
| release_year | release year | - |
| genre | movie genre | - |

In this example, `movie_id` is a **candidate key** because it uniquely identifies each movie. We can also consider a composite key `(title, release_year)` if `movie_id` is not available. However, this may not be unique if there are multiple movies with the same title and release year.

# Edge Case
> **Q:** Consider an entity type `Employee` with attributes `employee_id`, `name`, and `email`. Suppose two employees have the same `email` but different `employee_id` and `name`. Can `email` be a candidate key?
> **A:** No, `email` cannot be a candidate key because it does not uniquely identify each employee occurrence. Although `email` may seem unique for each employee, the problem statement explicitly states that two employees can share the same `email`, violating the **uniqueness** property of a key.

# Connections
- **Depends on:** [[Entity_Types]] — Keys are used to uniquely identify entity occurrences.
- **Enables:** [[Logical_Database_Design]] — Keys are used to establish relationships between entity types and ensure data consistency.