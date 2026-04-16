---
title: Logical_Database_Design
type: Atomic Note
course: [[Database Systems]]
semester: [[Autumn 2025]]
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Conceptual_Database_Design]]
source: [[Chapter_3.Pdf]]
source_pages:
- 9
- 10
mode: ENGINEER

---

# Definition & Mechanics
**Logical Database Design** is the process of constructing a model of the data used in an enterprise based on a specific data model (e.g., relational), and dependent on a particular DBMS but independent of other physical considerations. The goal is to create a platform-independent model that can be implemented on various DBMS platforms.

* **Key activities**:
	+ Constructing a **relational schema** based on the conceptual model.
	+ Mapping **entity types** to **relations**.
	+ Mapping **attributes** to **columns**.
	+ Establishing **relationships** between relations.

# Worked Example
Domain: Film production

Suppose we have the following entities and attributes from the conceptual design:

* **Film** (film_id, title, release_year)
* **Actor** (actor_id, name, birth_date)
* **Acts_In** (film_id, actor_id)

The logical design would involve creating the following relational schema:

sql
CREATE TABLE Film (
  film_id INT PRIMARY KEY,
  title VARCHAR(255),
  release_year INT
);

CREATE TABLE Actor (
  actor_id INT PRIMARY KEY,
  name VARCHAR(255),
  birth_date DATE
);

CREATE TABLE Acts_In (
  film_id INT,
  actor_id INT,
  PRIMARY KEY (film_id, actor_id),
  FOREIGN KEY (film_id) REFERENCES Film(film_id),
  FOREIGN KEY (actor_id) REFERENCES Actor(actor_id)
);
```text