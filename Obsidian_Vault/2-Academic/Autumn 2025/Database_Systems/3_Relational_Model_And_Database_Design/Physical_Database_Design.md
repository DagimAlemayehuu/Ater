---
title: Physical_Database_Design
type: Atomic Note
course: "[[Database Systems]]"
semester: "[[Autumn 2025]]"
unit: 3
hub: "[[3_Relational_Model_And_Database_Design_Hub]]"
parent: "[[Database_Design_Methodology]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 10
- 11
mode: ENGINEER

---

# Definition & Mechanics
**Physical Database Design** is the process of producing a description of the implementation of the database on secondary storage. It describes the base relations, file organizations, and indexes design used to achieve efficient access to the data, and any associated integrity constraints and security measures.

* **Key goals**: 
  + Efficient data storage and retrieval
  + Data integrity and security
* **Main tasks**: 
  + Choosing file organizations and indexes
  + Designing storage and access methods

# Worked Example
Domain: Film production company

Suppose we have a `Movies` table with columns `movie_id`, `title`, and `release_year`. To improve query performance, we want to design a physical database schema.

sql
CREATE TABLE Movies (
  movie_id INT PRIMARY KEY,
  title VARCHAR(255),
  release_year INT
);

CREATE INDEX idx_title ON Movies (title);
```text