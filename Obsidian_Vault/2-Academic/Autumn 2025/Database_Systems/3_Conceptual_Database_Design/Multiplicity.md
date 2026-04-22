---
title: Multiplicity
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 38
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Relationship]]"
---

# 1. Technical Definition
Multiplicity is defined as the number or range of possible occurrences of an entity type that may relate to a single occurrence of an associated entity type through a particular relationship, often expressed using `minCardinality` and `maxCardinality` values. In formal terms, it describes the `association` between two entity types, specifying how many instances of one entity can be related to another.

# 2. Mental Model
Imagine you have a bookshelf and you want to know how many books can be on that shelf. Multiplicity is like asking how many books (one, many, or none) can be associated with one bookshelf. It's about understanding the connection between two things, like how many friends you can have or how many pets you can own.

# 3. Schema Design
* Define the `minCardinality` and `maxCardinality` for each end of an association.
* Specify the multiplicity for each relationship between entity types.
* Use annotations like `0..1`, `1..1`, `0..*`, or `1..*` to denote the range of occurrences.
* Ensure that the multiplicity constraints are consistent across related entity types.

# 4. Query Optimization
* Be aware that a high `maxCardinality` can lead to performance issues if not properly indexed.
* Avoid using `0..*` or `1..*` without a clear understanding of the data distribution.
* Use efficient querying techniques to handle relationships with high multiplicity.
* Consider denormalization or materialized views for frequently queried relationships with complex multiplicity constraints.

---

## 5. Worked Example

```markdown
+---------------+
|     Books     |
+---------------+
|  book_id (PK) |
|  title        |
|  author       |
+---------------+

+---------------+
|  Bookshelf    |
+---------------+
|  shelf_id (PK) |
|  capacity     |
+---------------+

+---------------+
|  Bookshelf_Book|
+---------------+
|  shelf_id (FK) |
|  book_id (FK)  |
+---------------+
```

### Execution Walkthrough
1. **Identify Entity Types**: The entity types are `Books`, `Bookshelf`, and the associative entity `Bookshelf_Book` which represents the many-to-many relationship between `Books` and `Bookshelf`.
2. **Define Relationships**: A book can be on many bookshelves, and a bookshelf can hold many books. This is a many-to-many relationship.
3. **Specify Multiplicity**: 
   - For `Books` to `Bookshelf_Book`, the multiplicity is `0..*` because a book can be on zero or more bookshelves.
   - For `Bookshelf` to `Bookshelf_Book`, the multiplicity is `0..*` because a bookshelf can hold zero or more books.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the multiplicity of a book to a bookshelf in a library system?

**Implementation Challenge**: Design a database schema for a library system where a book can be borrowed by many patrons and a patron can borrow many books. Specify the multiplicity for each relationship.

**Debug Challenge**: Write an optimized SQL JOIN to retrieve all books on a specific bookshelf.

---

### Answer Key
- L1_SCENARIO: The multiplicity is `0..*` (zero to many).
- L2_IMPLEMENTATION: A many-to-many relationship with `Borrowing` as the associative entity. Multiplicity for `Patron` to `Borrowing` is `0..*` and for `Book` to `Borrowing` is `0..*`.
- L3_DEBUG:
```sql
SELECT B.title
FROM Books B
JOIN Bookshelf_Book BB ON B.book_id = BB.book_id
WHERE BB.shelf_id = ?;  -- Replace '?' with the specific shelf_id
```