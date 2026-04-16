---
title: "Referential_Integrity_Constraints"
type: "Core"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "6 Structured Query Language"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.047443"
last_edited_time: "2026-04-16T13:47:45.047444"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Key_Constraints_in_SQL]] and [[Table_Creation_in_SQL]] because referential integrity constraints establish and enforce relationships between tables, typically using foreign keys that reference primary keys in other tables.
Referential integrity constraints are a set of rules in a database that ensure that relationships between tables remain consistent. They prevent actions that would destroy links between tables, ensuring that a foreign key in one table always refers to a valid primary key in another table. The most common way to enforce this is through a `FOREIGN KEY` constraint. Think of it like a library system: if you have a `Borrowed_Books` table, a foreign key ensures that every `Book_ID` in that table genuinely refers to an existing `Book_ID` in the `All_Books` table. You can't borrow a book that doesn't exist.

# The Mental Model
Imagine you have two linked lists, one for "Courses" and another for "Students Enrolled." Referential integrity is like a strict rule that says: "Every entry in 'Students Enrolled' MUST point to an actual, existing course in the 'Courses' list. You cannot enroll a student in a non-existent course." It's the safety net that prevents broken links between your data.

# Context & Framework
### How to Break It (The Villain's Plan)
Without referential integrity, a database is vulnerable to "orphan" records – data in one table that references a non-existent entry in another. For example, an `Orders` table might have an `CustomerID` that no longer exists in the `Customers` table, making the order's origin untraceable. This breaks the logical consistency of the database, leading to inaccurate reports, application errors, and a general loss of trust in the data. The "villain" in this scenario is any operation (DELETE, UPDATE) that inadvertently removes or changes a primary key that is actively referenced by foreign keys.

# The Mastery Deep Dive
### The Shield: How We Stop the Villain
`FOREIGN KEY` constraints are the primary "shield" for referential integrity. When you define a foreign key, you also specify `ON DELETE` and `ON UPDATE` actions, which dictate how the database should react when the referenced primary key in the parent table is deleted or updated. These actions are critical for maintaining consistency.

| Action         | Description                                                                                                                                                                                                                                                                                                                                       |
| :
------------- | :
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`RESTRICT`** | **Prevents** the deletion or update of a primary key value in the parent table if it has matching foreign key values in the child table. The operation is disallowed. This is often the default behavior.                                                                                                                                                 |
| **`CASCADE`**  | If a primary key value in the parent table is deleted or updated, the corresponding foreign key values in the child table are **also deleted or updated**. This "cascades" the change. Use with extreme caution for DELETE.                                                                                                                              |
| **`SET NULL`** | If a primary key value in the parent table is deleted or updated, the corresponding foreign key values in the child table are **set to `NULL`**. This requires the foreign key column in the child table to be nullable.                                                                                                                            |
| **`SET DEFAULT`**| If a primary key value in the parent table is deleted or updated, the corresponding foreign key values in the child table are **set to their predefined default value**. This requires a default value to be specified for the foreign key column.                                                                                               |
| **`NO ACTION`**| Similar to `RESTRICT`, it rejects the delete/update if there are dependent rows. However, `NO ACTION` performs the check *after* attempting to execute the statement, while `RESTRICT` checks *before*. In most practical scenarios, their effect is indistinguishable for `DELETE` operations.                                                    |

### The "Vulnerable vs. Secure" Pattern
Consider an `Orders` table (child) referencing a `Customers` table (parent) by `customer_id`.

**Vulnerable (No Referential Integrity / Poor Choice):**
If no `FOREIGN KEY` is defined, or if `ON DELETE CASCADE` is used carelessly, deleting a customer could silently delete all their orders, which might be undesirable for historical records.

**Secure (Carefully Chosen Referential Action):**
```sql
```sql
-- Parent Table
CREATE TABLE Customers (
    CustomerID INT PRIMARY KEY,
    CustomerName VARCHAR(100)
);

-- Child Table
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY,
    OrderDate DATE,
    CustomerID INT,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
        ON DELETE SET NULL ON UPDATE CASCADE -- Secure choice for this scenario
);
```
```text
-- Scenario 1: Initial state (Customers and Orders tables created)
-- Output:
-- 'Table created.' (for Customers)
-- 'Table created.' (for Orders)
--
-- Scenario 2: Deleting a customer with ON DELETE SET NULL
-- Example:
-- INSERT INTO Customers VALUES (1, 'Alice');
-- INSERT INTO Orders VALUES (101, '2026-01-01', 1);
-- DELETE FROM Customers WHERE CustomerID = 1;
-- SELECT * FROM Orders WHERE OrderID = 101;
-- Result:
-- OrderID | OrderDate  | CustomerID
-- ------- | ---------- | ----------
-- 101     | 2026-01-01 | NULL
-- (The order remains, but its CustomerID is set to NULL, preserving historical order data.)
--
-- Scenario 3: Updating a customer ID with ON UPDATE CASCADE
-- Example:
-- INSERT INTO Customers VALUES (2, 'Bob');
-- INSERT INTO Orders VALUES (102, '2026-01-02', 2);
-- UPDATE Customers SET CustomerID = 20 WHERE CustomerID = 2;
-- SELECT * FROM Orders WHERE OrderID = 102;
-- Result:
-- OrderID | OrderDate  | CustomerID
-- ------- | ---------- | ----------
-- 102     | 2026-01-02 | 20
-- (The order's CustomerID is automatically updated to reflect the new parent ID.)
```

### The Translator: Hacker Slang to Exam Terms
*   "Orphan record" = a row in the child table that points to a non-existent row in the parent table.
*   "Broken link" = a foreign key value that has no corresponding primary key value.
*   "Cascading delete" = `ON DELETE CASCADE` action.

# Constraints & Limitations
### The Engineering Trade-off
While crucial for data integrity, referential integrity constraints introduce an overhead. Each DML operation (INSERT, UPDATE, DELETE) on either the parent or child table requires the DBMS to perform checks against the foreign key constraints, which consumes processing time. For very large tables or high-volume transactions, this can impact performance. Additionally, `ON DELETE CASCADE` is powerful but dangerous; a single DELETE operation on a parent table can wipe out vast amounts of related data across many child tables, potentially leading to irreversible data loss if not carefully managed. The choice of referential action is an engineering trade-off between strict data integrity, desired system behavior, and performance.

# Significance & Application
Referential integrity is a cornerstone of the relational database model, directly implementing the relationships defined in ER diagrams. It guarantees data consistency across related tables, preventing inaccurate or incomplete data from being stored. Academically, it's a practical application of the integrity rules of relational algebra. In the real world, it's essential for any application that relies on interconnected data, from financial systems where every transaction must link to a valid account, to inventory systems where every product variant must link to a master product. It enables developers to build reliable applications without having to implement complex, error-prone data validation logic in their code.

# The Worked Example
This example illustrates `FOREIGN KEY` constraint with different `ON DELETE` actions to manage a `Students` and `Courses` relationship.

1.  **Creating Parent (`Courses`) and Child (`Enrollments`) Tables:**
    ```sql
```sql
    -- Parent Table
    CREATE TABLE Courses (
        CourseID INT PRIMARY KEY,
        CourseName VARCHAR(100) NOT NULL
    );

    -- Child Table: Students enrolling in courses
    CREATE TABLE Enrollments (
        EnrollmentID INT PRIMARY KEY,
        StudentID INT NOT NULL,
        CourseID INT,
        EnrollmentDate DATE,
        FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
            ON DELETE RESTRICT ON UPDATE CASCADE -- Restrict deletion of course if enrolled students exist
    );
```
```text
    -- Scenario 1: Initial state (Courses and Enrollments tables created)
    -- Output:
    -- 'Table created.' (for Courses)
    -- 'Table created.' (for Enrollments)
    --
    -- Scenario 2: Inserting data
    -- Example:
    -- INSERT INTO Courses VALUES (101, 'Database Systems');
    -- INSERT INTO Enrollments VALUES (1, 1001, 101, '2026-01-15');
    -- SELECT * FROM Courses;
    -- SELECT * FROM Enrollments;
    -- Result:
    -- (Shows the inserted data)
```

2.  **Demonstrating `ON DELETE RESTRICT`:**
    ```sql
```sql
    -- Attempt to delete a course that has enrolled students
    DELETE FROM Courses WHERE CourseID = 101;
```
```text
    -- Scenario 1: Attempt to delete referenced parent row
    -- Output:
    -- 'Error: Cannot delete or update a parent row: a foreign key constraint fails.'
    -- (Or similar error message indicating RESTRICT action prevented the deletion.)
    -- The deletion is prevented because CourseID 101 is referenced in the Enrollments table.
```

3.  **Demonstrating `ON DELETE SET NULL` (Requires modifying `Enrollments` foreign key):**
    First, let's `ALTER TABLE` to change the `ON DELETE` action. Note: For this to work, `CourseID` in `Enrollments` must be nullable.
    ```sql
```sql
    -- Modify the foreign key to use ON DELETE SET NULL
    ALTER TABLE Enrollments
    DROP CONSTRAINT FK_CourseID; -- Assuming the constraint has a system-generated name like FK_CourseID

    ALTER TABLE Enrollments
    ADD CONSTRAINT FK_CourseID FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
        ON DELETE SET NULL ON UPDATE CASCADE;

    -- Now, delete the course (it will succeed, setting CourseID in Enrollments to NULL)
    DELETE FROM Courses WHERE CourseID = 101;

    SELECT * FROM Enrollments WHERE StudentID = 1001; -- Check the enrollment status
```
```text
    -- Scenario 1: Modifying ON DELETE action
    -- Output:
    -- 'Table altered.' (for DROP CONSTRAINT)
    -- 'Table altered.' (for ADD CONSTRAINT)
    --
    -- Scenario 2: Deleting a course with ON DELETE SET NULL
    -- Output:
    -- '1 row(s) affected.' (for DELETE)
    -- (From SELECT after DELETE)
    -- EnrollmentID | StudentID | CourseID | EnrollmentDate
    -- ------------ | --------- | -------- | --------------
    -- 1            | 1001      | NULL     | 2026-01-15
    -- (The course is deleted, and the student's enrollment now points to NULL.)
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What is the primary purpose of a `FOREIGN KEY` constraint, and which column type (primary key or foreign key) can contain values that are `NULL`?
> **Solution:** The primary purpose of a `FOREIGN KEY` constraint is to establish and enforce a link between data in two tables, ensuring that a value in the foreign key column corresponds to an existing value in the primary key of the referenced table. The **foreign key** column can contain `NULL` values, provided it is not also defined with a `NOT NULL` constraint.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You are designing a database for a hospital. You have a `Doctors` table (with `DoctorID` as `PRIMARY KEY`) and a `Patients` table (with `AssignedDoctorID` as `FOREIGN KEY` referencing `DoctorID`). The requirement is that if a doctor leaves the hospital (their record is deleted), all patients previously assigned to them should have their `AssignedDoctorID` automatically updated to a special 'Unassigned' doctor ID (e.g., `0`), which always exists in the `Doctors` table.
**The Question:** Which `ON DELETE` action would you specify for the `FOREIGN KEY` constraint in the `Patients` table to meet this requirement, and why? Explain how this action differs from `ON DELETE CASCADE` in this specific scenario.
> **Solution:** You would specify **`ON DELETE SET DEFAULT`** for the `FOREIGN KEY` constraint in the `Patients` table. This action would ensure that when a doctor's record is deleted, the `AssignedDoctorID` for all their patients is automatically set to `0` (the 'Unassigned' doctor ID), provided that `0` is defined as the `DEFAULT` value for the `AssignedDoctorID` column. This differs from `ON DELETE CASCADE` because `CASCADE` would **delete the patient records entirely** if their assigned doctor was deleted, which is not the requirement. `SET DEFAULT` preserves the patient records while correctly reassigning them, maintaining historical data and adhering to the business rule.

# Key Takeaways
*   Referential integrity ensures consistent relationships between tables, primarily through `FOREIGN KEY` constraints.
*   `ON DELETE` and `ON UPDATE` actions (RESTRICT, CASCADE, SET NULL, SET DEFAULT, NO ACTION) define database behavior when referenced primary keys are modified.
*   Careful selection of referential actions is crucial for data integrity, system behavior, and preventing data loss.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Key_Constraints_in_SQL]]  | Foreign keys reference primary keys to establish and enforce inter-table relationships.     |
| [[Table_Creation_in_SQL]]   | Foreign key constraints are typically defined during table creation or alteration.          |
| [[SQL_Schema_Definition_Language_(DDL)]]| Referential integrity is a key aspect of DDL for defining database structure.       |
| [[SQL_NULL_Values_and_Comparison]]| `ON DELETE SET NULL` is a referential action that sets foreign key values to `NULL`.  |
| [[Altering_SQL_Tables]]     | `ALTER TABLE` can be used to add, modify, or drop foreign key constraints.                 |
| [[Deleting_Data_in_SQL]]    | `ON DELETE` actions directly impact how `DELETE` operations affect related data.          |
| [[Updating_Data_in_SQL]]    | `ON UPDATE` actions directly impact how `UPDATE` operations affect related data.          |
---