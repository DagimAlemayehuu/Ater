---
title: Keys
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '3'
hub: "[[3_Conceptual_Database_Design_Hub]]"
source: "[[Chapter_3.Pdf]]"
source_pages:
- 33
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Entity]]"
---

# 1. Technical Definition
A key is a set of attributes in a database table that uniquely identifies each row, ensuring data integrity and facilitating efficient data retrieval through `primary keys` and `foreign keys`. In relational databases, keys are used to establish relationships between tables, with a primary key uniquely identifying each record and a foreign key linking a table to another table's primary key.

# 2. Mental Model
Imagine you have a huge library with millions of books. A key is like a special code assigned to each book so that you can easily find it and make sure no two books have the same code. This helps keep track of all the books and makes it easier to find a specific one. Just like how a book's code helps you find it on the shelf, a key in a database helps the computer find and manage data efficiently.

# 3. Schema Design
* A primary key is a unique identifier for each row in a table, ensuring no duplicates exist.
* A foreign key is a field in a table that links to the primary key of another table, establishing a relationship between them.
* Composite keys are combinations of multiple attributes that together serve as a unique identifier for a record.
* Surrogate keys are artificially generated keys, often used when natural keys are not available or practical.

# 4. Query Optimization
* Using primary keys and indexes can significantly speed up data retrieval queries by allowing the database to quickly locate specific rows.
* Foreign key constraints can slow down insert and update operations because the database must verify the linked data exists.
* Composite keys can become cumbersome and may lead to slower query performance if not properly indexed.
* Over-reliance on surrogate keys can lead to increased storage needs and potentially slower query performance due to the additional index requirements.

---

## 5. Worked Example

```sql
CREATE TABLE Students (
  StudentID INT PRIMARY KEY,
  Name VARCHAR(255),
  Email VARCHAR(255) UNIQUE
);

CREATE TABLE Courses (
  CourseID INT PRIMARY KEY,
  CourseName VARCHAR(255)
);

CREATE TABLE Enrollments (
  StudentID INT,
  CourseID INT,
  EnrollmentDate DATE,
  PRIMARY KEY (StudentID, CourseID),
  FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
  FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);
```

### Execution Walkthrough
1. We start by creating three tables: `Students`, `Courses`, and `Enrollments`. The `Students` table has a primary key `StudentID`, and the `Courses` table has a primary key `CourseID`.
2. The `Enrollments` table has a composite primary key `(StudentID, CourseID)`, which uniquely identifies each enrollment record. It also has foreign keys `StudentID` and `CourseID` that reference the primary keys of the `Students` and `Courses` tables, respectively.
3. This schema design establishes relationships between students, courses, and enrollments, ensuring data integrity and facilitating efficient data retrieval.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary key of the `Students` table?

**Implementation Challenge**: A university wants to track which students are enrolled in which courses. Design a database schema to store this information, including the primary keys and foreign keys.

**Debug Challenge**: Write an optimized SQL JOIN query to retrieve the names of students enrolled in a specific course (e.g., 'Mathematics 101').

---

### Answer Key
- L1_SCENARIO: `StudentID`
- L2_IMPLEMENTATION: The provided schema design (`Students`, `Courses`, and `Enrollments` tables) can be used to store this information.
- L3_DEBUG: 
```sql
SELECT S.Name
FROM Students S
JOIN Enrollments E ON S.StudentID = E.StudentID
JOIN Courses C ON E.CourseID = C.CourseID
WHERE C.CourseName = 'Mathematics 101';
```