---
title: Composite_Key
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Keys]]
source: [[Chapter_3.Pdf]]
source_pages:
- 33
mode: ENGINEER

---

# Definition & Mechanics
A **composite key** is a candidate key that consists of two or more attributes. 
* A composite key is used when no single attribute can uniquely identify each occurrence of an entity type.
* **Components**: each attribute in the composite key must be necessary to ensure uniqueness.

# Worked Example
Domain: Film production

Suppose we have an entity type `Movie_Role` with attributes:
* `movie_title`
* `actor_name`
* `role_name`

| movie_title | actor_name | role_name |
| --- | --- | --- |
| Inception | Leonardo DiCaprio | Cobb |
| Inception | Joseph Gordon-Levitt | Arthur |
| The Dark Knight | Christian Bale | Batman |

A composite key for `Movie_Role` could be `(movie_title, actor_name, role_name)`, ensuring each role occurrence is unique.

# Edge Case
> **Q:** A university uses a `Course_Enrollment` entity with attributes `course_id`, `student_id`, and `semester`. Can `(course_id, student_id)` be a composite key?
> **A:** No. While `(course_id, student_id)` could uniquely identify enrollments for a given semester, it does not account for multiple semesters. A correct composite key would be `(course_id, student_id, semester)` to ensure uniqueness across all semesters.

# Connections
- **Depends on:** [[Candidate_Key]] — A composite key is a specific type of candidate key.
- **Enables:** [[Entity_Types]] — Composite keys help define and uniquely identify occurrences of entity types.