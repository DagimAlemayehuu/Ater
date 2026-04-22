---
title: Physical Database Design
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 10
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Logical Database Design]]"
---

# 1. Technical Definition
Physical Database Design is the process of producing a description of the implementation of the database on `secondary storage`, which refers to non-volatile storage devices such as hard drives. This process involves defining the physical structure of the database, including the `storage layout` and `access methods`.

# 2. Mental Model
Imagine you're building a huge library with millions of books. Physical database design is like deciding how to organize and store these books on shelves, including how to categorize them, how many shelves to use, and how to help people find specific books quickly.

# 3. Schema Design
* Define the `storage layout` for the database, including the allocation of storage space for each table and index.
* Determine the `block size` and `buffer size` to optimize data transfer and storage.
* Design the `indexing strategy` to support efficient data retrieval.
* Plan for `data partitioning` to improve data distribution and query performance.

# 4. Query Optimization
* Physical database design can be limited by storage constraints, such as available disk space and I/O bandwidth.
* The design must balance query performance with storage efficiency, as optimizing one may compromise the other.
* The choice of `storage devices` and `RAID configurations` can impact performance and reliability.
* Scalability and adaptability of the design are crucial to accommodate changing data volumes and query patterns.

---

## 5. Worked Example

```er
+---------------+
|     Books    |
+---------------+
|  BookID (PK)  |
|  Title       |
|  Author      |
|  Publisher   |
|  PublishDate |
+---------------+

+---------------+
|     Borrowers |
+---------------+
|  BorrowerID (PK) |
|  Name          |
|  Email         |
+---------------+

+---------------+
|  Borrowings  |
+---------------+
|  BorrowID (PK) |
|  BookID (FK)  |
|  BorrowerID (FK) |
|  BorrowDate  |
|  ReturnDate  |
+---------------+
```

### Execution Walkthrough
1. Identify the entities involved in the library management system: Books, Borrowers, and Borrowings.
2. Determine the attributes for each entity: Books (BookID, Title, Author, Publisher, PublishDate), Borrowers (BorrowerID, Name, Email), and Borrowings (BorrowID, BookID, BorrowerID, BorrowDate, ReturnDate).
3. Establish the relationships between entities: A book can be borrowed by many borrowers (one-to-many), and a borrower can borrow many books (one-to-many).

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary goal of physical database design in a library management system?

**Implementation Challenge**: Suppose you are designing a physical database for a library with 100,000 books and 10,000 borrowers. How would you organize the storage layout and indexing strategy to support efficient data retrieval?

**Debug Challenge**: Write an optimized SQL JOIN query to retrieve the list of books borrowed by a specific borrower, including the book title, author, and borrow date.

---

### Answer Key
- L1_SCENARIO: The primary goal of physical database design is to produce a description of the implementation of the database on secondary storage.
- L2_IMPLEMENTATION: A possible approach is to allocate storage space for each table and index, choose a suitable block size and buffer size, design an indexing strategy using B-tree or hash indexes on columns used in WHERE and JOIN clauses, and plan for data partitioning to improve data distribution and query performance.
- L3_DEBUG: 
```sql
SELECT B.Title, B.Author, Bo.BorrowDate
FROM Books B
JOIN Borrowings Bo ON B.BookID = Bo.BookID
JOIN Borrowers Br ON Bo.BorrowerID = Br.BorrowerID
WHERE Br.Name = 'Specific Borrower Name';
```