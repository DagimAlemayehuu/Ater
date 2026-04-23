---
title: ER Model
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 14
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Entity]]"
- "[[Attribute]]"
- "[[Relationship]]"
---

# 1. Technical Definition
The Entity-Relationship (ER) model is a conceptual data modeling technique that represents the structure of a database using `entities`, `attributes`, and `relationships`. It provides a high-level view of the data, using `entities` to represent real-world objects and `relationships` to represent the connections between them.

# 2. Mental Model
Imagine you're organizing a big library with lots of books, authors, and publishers. An ER model helps you create a map of how all these things are connected, like which authors wrote which books and which publishers printed those books.

# 3. Schema Design
* Entities are represented as rectangles, such as `Book` or `Author`.
* Relationships between entities are represented as diamonds, such as `wrote` or `published`.
* Attributes are represented as ovals, such as `title` or `name`.
* The ER model helps to identify the key attributes and relationships between entities.

# 4. Query Optimization
* The ER model does not directly impact query performance but a well-designed ER model can lead to more efficient database schema.
* A complex ER model with many relationships can lead to slower query performance if not properly optimized.
* The ER model should be simplified and refined to minimize data redundancy and improve data integrity.
* Indexing and other optimization techniques can be applied to the database schema derived from the ER model.

---

## 5. Worked Example

```markdown
+---------------+
|     Book     |
+---------------+
|  book_id (PK) |
|  title       |
|  author_id (FK) |
|  publisher_id (FK) |
+---------------+

+---------------+
|    Author    |
+---------------+
|  author_id (PK) |
|  name        |
+---------------+

+---------------+
|   Publisher  |
+---------------+
|  publisher_id (PK) |
|  name        |
+---------------+

+---------------+
|     wrote    |
+---------------+
|  book_id (FK)  |
|  author_id (FK) |
+---------------+

+---------------+
|   published  |
+---------------+
|  book_id (FK)  |
|  publisher_id (FK) |
+---------------+
```

### Execution Walkthrough
1. Identify the entities: `Book`, `Author`, and `Publisher`.
2. Define the attributes for each entity: `book_id`, `title`, `author_id`, `publisher_id`, `author_id`, `name`, `publisher_id`, and `name`.
3. Establish the relationships: A book is written by an author (one-to-one) and published by a publisher (one-to-one).

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary key of the `Book` entity?

**Implementation Challenge**: Create a SQL query to retrieve the titles of all books written by a specific author.

**Debug Challenge**: Optimize the SQL JOIN query to retrieve the titles of all books written by a specific author and published by a specific publisher.

---

### Answer Key
- L1_SCENARIO: `book_id`
- L2_IMPLEMENTATION: 
```sql
SELECT B.title 
FROM Book B 
JOIN Author A ON B.author_id = A.author_id 
WHERE A.name = 'Specific Author';
```
- L3_DEBUG: 
```sql
SELECT B.title 
FROM Book B 
JOIN Author A ON B.author_id = A.author_id 
JOIN Publisher P ON B.publisher_id = P.publisher_id 
WHERE A.name = 'Specific Author' AND P.name = 'Specific Publisher';
```