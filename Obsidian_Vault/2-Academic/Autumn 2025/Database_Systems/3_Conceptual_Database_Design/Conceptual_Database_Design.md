---
title: Conceptual Database Design
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 8
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Database System Development Life Cycle]]"
---

# 1. Technical Definition
Conceptual Database Design is the process of creating a high-level, abstract representation of a database using `Entity-Relationship Modeling` (ERM) or `Unified Modeling Language` (UML) to identify the main entities, attributes, and relationships. This design phase focuses on the overall structure and organization of the data, independent of any specific database management system.

# 2. Mental Model
Imagine you're building a huge library with millions of books. In Conceptual Database Design, you're creating a blueprint of how all the books (data) are organized, including how they're categorized, related to each other, and what information they contain. This helps you understand how everything fits together before you start building the library.

# 3. Schema Design
* Identify `entities` (e.g., books, authors, publishers) that will be represented in the database.
* Define the `attributes` (e.g., title, author name, publication date) of each entity.
* Determine the `relationships` (e.g., a book has one author, an author has written many books) between entities.
* Create a high-level diagram (e.g., ER diagram) to visualize the database structure.

# 4. Query Optimization
* The conceptual design phase does not involve optimization for specific queries.
* The design should be flexible enough to support various future queries.
* The focus is on creating a robust and scalable database structure.
* Performance considerations are typically addressed in later design phases (e.g., physical database design).

---

## 5. Worked Example

```markdown
+---------------+
|     Books    |
+---------------+
|  BookID (PK) |
|  Title       |
|  PublicationDate |
+---------------+

+---------------+
|    Authors   |
+---------------+
|  AuthorID (PK) |
|  Name         |
|  BirthDate    |
+---------------+

+---------------+
| Book_Authors |
+---------------+
|  BookID (FK)  |
|  AuthorID (FK) |
+---------------+
```

### Execution Walkthrough
1. Identify the main entities: `Books`, `Authors`, and the relationship between them `Book_Authors`.
2. Define the attributes for each entity: `Books` has `BookID`, `Title`, and `PublicationDate`; `Authors` has `AuthorID`, `Name`, and `BirthDate`; `Book_Authors` has `BookID` and `AuthorID` as foreign keys.
3. Determine the relationships: A book can have multiple authors, and an author can write multiple books, which is represented by the many-to-many relationship table `Book_Authors`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of creating an Entity-Relationship diagram in database design?

**Implementation Challenge**: Suppose you're designing a database for a bookstore. How would you apply the concepts of entities, attributes, and relationships to model the data for books, authors, and publishers?

**Debug Challenge**: Write an optimized SQL JOIN to retrieve the titles of books along with their authors' names from the `Books`, `Authors`, and `Book_Authors` tables.

---

### Answer Key
- L1_SCENARIO: The primary purpose is to create a high-level, abstract representation of a database to identify main entities, attributes, and relationships.
- L2_IMPLEMENTATION: Identify entities (Books, Authors, Publishers), define their attributes (e.g., title, author name, publisher name), and determine relationships (e.g., a book has one publisher, an author has written many books).
- L3_DEBUG: 
```sql
SELECT B.Title, A.Name
FROM Books B
JOIN Book_Authors BA ON B.BookID = BA.BookID
JOIN Authors A ON BA.AuthorID = A.AuthorID;
```