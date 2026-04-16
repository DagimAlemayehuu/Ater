---
title: Key_Constraints_In_SQL
created_at: '2026-01-30T11:42:11Z'
last_modified: '2026-01-30T11:42:11Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 2754e062-5925-4775-8f97-324aa1b2abbb
type: Core
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides
aliases: 
- Primary_Key
- Unique_Key
- SQL_Constraints
unit: 6_Structured_Query_Language
parent: Table_Creation_In_SQL
---

# Definition
Before proceeding, ensure you master [[Table_Creation_in_SQL]] and [[SQL_Data_Types]] because key constraints are crucial rules defined during table creation to maintain data integrity and uniqueness for specific columns or sets of columns.
Key constraints in SQL are rules applied to columns in a table to ensure data integrity and uniqueness. The most common key constraints are `PRIMARY KEY` and `UNIQUE`. A `PRIMARY KEY` uniquely identifies each row in a table and cannot contain `SQL_NULL_Values_and_Comparison`. A `UNIQUE` constraint ensures that all values in a column (or group of columns) are distinct, but it *can* allow one `NULL` value. Think of them as special identification rules: a `PRIMARY KEY` is like a person's fingerprint (always unique, never blank), while a `UNIQUE` constraint is like a phone number (unique to a person, but you might not have one).

# The Mental Model
Imagine a large parking lot. The `PRIMARY KEY` is like the unique license plate number on each car – it identifies that specific car and is never absent. The `UNIQUE` constraint is like a specific parking spot that only one car can occupy at a time, but it's okay if that spot is occasionally empty. Both ensure no two cars are identified in the same way or occupy the same designated "unique" space.

# Context & Framework
### Opening the Hood: What's Inside?
Key constraints are a fundamental aspect of `Table_Creation_in_SQL` and a core component of `SQL_Schema_Definition_Language_(DDL)`. They are declarative statements that enforce business rules and data integrity directly at the database level. By defining these constraints, you delegate the responsibility of ensuring uniqueness and non-nullability to the DBMS, rather than relying on application logic. This central enforcement prevents inconsistent data from entering the database, regardless of how the data is being added or modified.

# The Mastery Deep Dive
### How the Parts Talk to Each Other
Key constraints are defined at the column level or table level within the `CREATE TABLE` or `ALTER TABLE` statements.
*   **`PRIMARY KEY`**: A table can have **only one primary key**. It can be composed of a single column (simple primary key) or multiple columns (composite primary key). Its values **must be unique** and **cannot be NULL**. It inherently creates a unique index on the column(s) for fast data retrieval.
*   **`UNIQUE`**: A table can have **multiple unique constraints**. Values in a unique-constrained column **must be unique**, but **one NULL value is typically allowed** (though this can vary slightly across different SQL implementations). Like primary keys, unique constraints also typically create indexes for performance.
Both constraints ensure uniqueness but differ in their nullability and single-per-table nature.

### The Translator: From "Lego" to "Jargon"
When designing a database, identifying primary and unique keys is crucial.
*   **`PRIMARY KEY (column_name)`**: This is the formal way to declare the main identifier for records in your table. For example, `StudentID INT PRIMARY KEY` means `StudentID` will always be unique and never empty.
*   **`UNIQUE (column_name)`**: This allows you to enforce uniqueness on other attributes that are not the primary identifier. For example, `Email VARCHAR(100) UNIQUE` means no two students can have the same email, but a student might not have an email (i.e., it could be `NULL` if not `NOT NULL` as well).

# Constraints & Limitations
### The "Unseen Crack": Common Structural Flaws
A common structural flaw is choosing an inappropriate column for a `PRIMARY KEY`, especially one that might change over time (e.g., an employee's department code). While technically unique, changing a primary key's value can have ripple effects across related tables due to `Referential_Integrity_Constraints`, leading to complex update operations or even errors. Another limitation of the `UNIQUE` constraint is that, while most SQL implementations allow one `NULL` value, some strict interpretations might consider multiple `NULL`s to be distinct, or disallow `NULL`s if combined with `NOT NULL`. This subtle difference can lead to unexpected data entry behavior if not understood.

# Significance & Application
Key constraints are paramount for the logical and physical integrity of a relational database. Logically, they enforce the entity integrity rule (primary keys) and domain integrity (unique keys), preventing invalid or ambiguous data. Physically, the indexes created by these constraints significantly improve query performance, especially for search and join operations. Academically, they are direct implementations of relational model principles. In industry, they are essential for database designers to build robust data models and for developers to rely on the database itself to maintain data consistency, rather than implementing complex validation logic in application code.

# The Worked Example
This example demonstrates `PRIMARY KEY` and `UNIQUE` constraints during `Table_Creation_in_SQL` for a `Users` table.

1.  **Creating the `Users` Table with Key Constraints:**
    ```sql
```sql
    CREATE TABLE Users (
        UserID INT PRIMARY KEY,
        Username VARCHAR(50) NOT NULL UNIQUE,
        Email VARCHAR(100) UNIQUE,
        RegistrationDate DATE
    );
```
```text
    -- Scenario 1: Successful table creation
    -- Output:
    -- 'Table created.'
    --
    -- Scenario 2: Conceptual schema
    -- Table: Users
    -- Columns:
    --   UserID (INT, Primary Key)
    --   Username (VARCHAR(50), NOT NULL, Unique)
    --   Email (VARCHAR(100), Unique)
    --   RegistrationDate (DATE)
```
    In this example:
    *   `UserID` is the `PRIMARY KEY`, ensuring each user has a unique and non-null ID.
    *   `Username` is `NOT NULL` and `UNIQUE`, so every user must have a distinct username.
    *   `Email` is `UNIQUE`, allowing distinct emails but permitting `NULL` if a user chooses not to provide one.

2.  **Attempting to Violate Constraints:**
    ```sql
```sql
    -- Valid insertion
    INSERT INTO Users (UserID, Username, Email, RegistrationDate)
    VALUES (1, 'alice_smith', 'alice@example.com', '2026-01-01');

    -- Attempt to insert duplicate UserID (Primary Key violation)
    INSERT INTO Users (UserID, Username, Email, RegistrationDate)
    VALUES (1, 'bob_jones', 'bob@example.com', '2026-01-02');

    -- Attempt to insert duplicate Username (Unique constraint violation)
    INSERT INTO Users (UserID, Username, Email, RegistrationDate)
    VALUES (2, 'alice_smith', 'alice2@example.com', '2026-01-03');

    -- Attempt to insert duplicate Email (Unique constraint violation)
    INSERT INTO Users (UserID, Username, Email, RegistrationDate)
    VALUES (3, 'charlie_brown', 'alice@example.com', '2026-01-04');

    -- Attempt to insert NULL for Primary Key (NOT NULL violation inherent to PK)
    INSERT INTO Users (UserID, Username, Email, RegistrationDate)
    VALUES (NULL, 'david_doe', 'david@example.com', '2026-01-05');

    -- Valid insertion with NULL email (Unique allows one NULL)
    INSERT INTO Users (UserID, Username, Email, RegistrationDate)
    VALUES (4, 'eve_miller', NULL, '2026-01-06');
```
```text
    -- Scenario 1: Valid insertion
    -- Output:
    -- '1 row(s) affected.'

    -- Scenario 2: Duplicate UserID
    -- Output:
    -- 'Error: Duplicate entry '1' for key 'PRIMARY'.' (Or similar)

    -- Scenario 3: Duplicate Username
    -- Output:
    -- 'Error: Duplicate entry 'alice_smith' for key 'Users.Username'.' (Or similar)

    -- Scenario 4: Duplicate Email
    -- Output:
    -- 'Error: Duplicate entry 'alice@example.com' for key 'Users.Email'.' (Or similar)

    -- Scenario 5: NULL Primary Key
    -- Output:
    -- 'Error: Column 'UserID' cannot be null.' (Or similar)

    -- Scenario 6: Valid insertion with NULL email
    -- Output:
    -- '1 row(s) affected.'
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** State two key differences between a `PRIMARY KEY` constraint and a `UNIQUE` constraint in SQL.
> **Solution:** A `PRIMARY KEY` cannot contain `NULL` values and a table can only have one. A `UNIQUE` constraint can typically allow one `NULL` value (though this can vary by DBMS) and a table can have multiple.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You are designing a `Products` table and have identified `ProductID` as the primary identifier. However, each product also has a `SKU` (Stock Keeping Unit) which must be unique across all products, but it is not the main identifier.
**The Question:** Which type of key constraint would you apply to the `SKU` column, and why? Furthermore, if a new product is added without a `SKU` value, would the insertion be successful? Justify your answer.
> **Solution:** You would apply a **`UNIQUE` constraint** to the `SKU` column. This is because `SKU` needs to be unique (no two products can have the same SKU), but it is not the primary way to identify a product (that's `ProductID`). The insertion of a new product without an `SKU` value **would typically be successful**, because `UNIQUE` constraints generally allow one `NULL` value (unless a `NOT NULL` constraint is also explicitly applied to `SKU`). This allows for cases where an SKU might not yet be assigned.

# Key Takeaways
*   `PRIMARY KEY` uniquely identifies each row and enforces non-nullability, with only one per table.
*   `UNIQUE` constraint ensures distinct values in a column/set of columns, allowing one NULL (generally), and multiple can exist per table.
*   Both constraints are crucial for data integrity, preventing duplication and ensuring reliable data access and relationships.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Table_Creation_in_SQL]]   | Key constraints are defined during the creation of a table to enforce data rules.           |
| [[SQL_Data_Types]]          | The data type of a column influences how uniqueness and nullability are evaluated for keys. |
| [[SQL_Schema_Definition_Language_(DDL)]]| Key constraints are a fundamental part of DDL, defining structural rules.             |
| [[SQL_NULL_Values_and_Comparison]]| `PRIMARY KEY` inherently enforces `NOT NULL`, while `UNIQUE` generally allows one `NULL`.|
| [[Referential_Integrity_Constraints]]| Primary keys are often referenced by foreign keys to establish relationships.         |
| [[Altering_SQL_Tables]]     | Key constraints can be added, modified, or dropped on existing tables using `ALTER TABLE`.  |
---