---
title: Altering_SQL_Tables
created_at: '2026-01-30T11:42:11Z'
last_modified: '2026-01-30T11:42:11Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 604e55d8-948f-40ff-9e97-7a7bf9e4e81b
type: Core
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides
aliases: 
- ALTER_TABLE
- Schema_Modification
unit: 6_Structured_Query_Language
parent: SQL_Schema_Definition_Language_DDL
---

# Definition
Before proceeding, ensure you master [[SQL_Schema_Definition_Language_(DDL)]] and [[Table_Creation_in_SQL]] because altering SQL tables involves using DDL commands to modify the structure of existing tables after they have been created.
Altering SQL tables refers to using the `ALTER TABLE` DDL command to make structural changes to an existing table. These changes can include adding, dropping, or modifying columns, adding or dropping constraints (`Key_Constraints_in_SQL`, `Referential_Integrity_Constraints`), or setting default values. It's like renovating a house: after the initial construction, you might decide to add a new room (add column), remove a wall (drop column), change the material of a wall (modify column data type), or add a new security system (add constraint).

# The Mental Model
Imagine your database as a living organism. `ALTER TABLE` is like performing surgery or making evolutionary changes to its structure. It's not about changing the cells (data) inside, but rather changing the organs or skeletal system (columns, constraints) of the organism itself. This capability is vital because requirements evolve, and databases are rarely static after their initial creation.

# Context & Framework
### The "Pilot's Checklist" (Do Not Skip)
Modifying an existing table's schema, especially one containing production data, is a critical operation that requires careful planning and execution. It's not a casual task. Just like a pilot meticulously checks every item before a flight, a database administrator must:
1.  **Backup the database:** Always have a recovery point.
2.  **Understand dependencies:** Identify any views, stored procedures, or application code that might be affected by the schema change.
3.  **Test the change:** Execute the `ALTER TABLE` command in a non-production environment first.
4.  **Consider data impact:** Understand how adding or dropping a column, or changing a data type, will affect existing data.

# The Mastery Deep Dive
### "It's Not Working!" - The Fix-it Guide
`ALTER TABLE` is a powerful command with several clauses to perform different structural modifications:
*   **`ADD COLUMN`**: Adds a new column to the table. Newly added columns will initially contain `SQL_NULL_Values_and_Comparison` for all existing rows, unless a `DEFAULT` value is specified. A `NOT NULL` constraint cannot be applied to a new column on a table with existing data *unless* a `DEFAULT` value is also provided (otherwise, existing rows would violate the constraint).
*   **`DROP COLUMN`**: Removes a column and all its data from the table. This is an irreversible operation.
*   **`MODIFY COLUMN` / `ALTER COLUMN`**: Changes the data type, length, or constraints of an existing column. This can fail if existing data doesn't conform to the new definition (e.g., trying to shorten a `VARCHAR` column when existing data exceeds the new length).
*   **`ADD CONSTRAINT` / `DROP CONSTRAINT`**: Adds or removes integrity constraints, such as `PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY`, or `CHECK` constraints.
*   **`ALTER COLUMN SET DEFAULT / DROP DEFAULT`**: Sets or removes a default value for a column.

### The Warning Lights: Signs of Trouble
*   **Adding `NOT NULL` to an existing column without a `DEFAULT` value:** This will fail if the table already contains rows, as existing rows would immediately violate the new constraint. The warning light indicates "incompatible schema change with existing data."
*   **Dropping a column that is part of a `PRIMARY KEY` or `FOREIGN KEY`**: This will fail unless the constraint is dropped first. The warning light indicates "dependency conflict."
*   **Changing a data type to a less permissive one (e.g., `VARCHAR(50)` to `INT`)**: This will likely fail or cause data loss if existing data cannot be implicitly converted. The warning light indicates "data type mismatch/truncation risk."

# Significance & Application
The ability to alter tables is crucial for the evolutionary maintenance of databases. Business requirements are fluid, and data models must adapt. `ALTER TABLE` enables database designers and administrators to respond to these changes without having to rebuild entire tables or databases from scratch. It's a key part of schema migration strategies in software development and DevOps. Proper use ensures that the database schema remains aligned with current business needs, accommodating new features or optimizing existing data structures.

# The Worked Example
This example demonstrates altering a `Customers` table by adding a new column, setting a default, and then dropping a constraint.

1.  **Initial `Customers` Table Creation:**
    ```sql
```sql
    CREATE TABLE Customers (
        CustomerID INT PRIMARY KEY,
        FirstName VARCHAR(50) NOT NULL,
        LastName VARCHAR(50) NOT NULL,
        Email VARCHAR(100) UNIQUE
    );

    INSERT INTO Customers (CustomerID, FirstName, LastName, Email)
    VALUES (1, 'Alice', 'Smith', 'alice@example.com'),
           (2, 'Bob', 'Johnson', 'bob@example.com');
```
```text
    -- Scenario 1: Successful table creation and initial data insertion
    -- Output:
    -- 'Table created.'
    -- '2 row(s) affected.'
    --
    -- Scenario 2: Initial table content
    -- CustomerID | FirstName | LastName | Email
    -- ---------- | --------- | -------- | -----------------
    -- 1          | Alice     | Smith    | alice@example.com
    -- 2          | Bob       | Johnson  | bob@example.com
```

2.  **Adding a New Column `Phone` (Nullable):**
    ```sql
```sql
    ALTER TABLE Customers
    ADD Phone VARCHAR(15);

    SELECT * FROM Customers;
```
```text
    -- Scenario 1: Adding a new nullable column
    -- Output:
    -- 'Table altered.'
    -- (From SELECT)
    -- CustomerID | FirstName | LastName | Email             | Phone
    -- ---------- | --------- | -------- | ----------------- | -----
    -- 1          | Alice     | Smith    | alice@example.com | NULL
    -- 2          | Bob       | Johnson  | bob@example.com   | NULL
    -- The 'Phone' column is added, and existing rows have NULL values for it.
```

3.  **Adding a New Column `IsActive` (with `DEFAULT` and `NOT NULL`):**
    This requires a default value for existing rows.
    ```sql
```sql
    ALTER TABLE Customers
    ADD IsActive BOOLEAN NOT NULL DEFAULT TRUE;

    SELECT * FROM Customers;
```
```text
    -- Scenario 1: Adding a new NOT NULL column with a default
    -- Output:
    -- 'Table altered.'
    -- (From SELECT)
    -- CustomerID | FirstName | LastName | Email             | Phone | IsActive
    -- ---------- | --------- | -------- | ----------------- | ----- | --------
    -- 1          | Alice     | Smith    | alice@example.com | NULL  | TRUE
    -- 2          | Bob       | Johnson  | bob@example.com   | NULL  | TRUE
    -- The 'IsActive' column is added, and existing rows automatically get the TRUE default value.
```

4.  **Modifying a Column's Data Type:**
    Let's increase the `Email` column's length.
    ```sql
```sql
    ALTER TABLE Customers
    MODIFY COLUMN Email VARCHAR(255); -- Syntax might be ALTER COLUMN SET DATA TYPE in some DBMS

    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'Email'; -- Illustrative check
```
```text
    -- Scenario 1: Modifying a column's length
    -- Output:
    -- 'Table altered.'
    -- (Illustrative check output)
    -- COLUMN_NAME | DATA_TYPE | CHARACTER_MAXIMUM_LENGTH
    -- ----------- | --------- | ------------------------
    -- Email       | varchar   | 255
    -- The 'Email' column can now store longer email addresses.
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What SQL DDL command is used to modify the structure of an existing table, and what is one common type of modification it can perform?
> **Solution:** The SQL DDL command is `ALTER TABLE`. One common modification it can perform is `ADD COLUMN` to add a new column.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A `Sales` table currently has a `ProductPrice` column defined as `DECIMAL(5,2)`. Due to new international products, the prices can now exceed this precision (e.g., up to 99999.99).
**The Question:** Write the `ALTER TABLE` statement to change the `ProductPrice` column to `DECIMAL(7,2)`. Explain a potential risk of this operation if `ProductPrice` were instead being *reduced* in precision (e.g., from `DECIMAL(7,2)` to `DECIMAL(5,2)`) and contained values that would then exceed the new, lower precision.
> **Solution:** The `ALTER TABLE` statement would be:
> ```sql
> ALTER TABLE Sales
> MODIFY COLUMN ProductPrice DECIMAL(7,2); -- Or ALTER COLUMN ProductPrice TYPE DECIMAL(7,2);
> ```
> A potential risk if `ProductPrice` were being *reduced* in precision (e.g., from `DECIMAL(7,2)` to `DECIMAL(5,2)`) and contained values like `12345.67` (which fit `DECIMAL(7,2)` but not `DECIMAL(5,2)`) is **data truncation or an error preventing the alteration**. The DBMS would either attempt to round or cut off digits (losing precision) or, more likely, reject the `ALTER TABLE` operation because existing data violates the new, stricter constraint. This highlights the importance of auditing existing data before reducing column precision.

# Key Takeaways
*   `ALTER TABLE` is a DDL command for modifying the structure of existing tables.
*   It supports adding, dropping, or modifying columns and constraints.
*   Schema alterations are critical operations that require careful planning and understanding of their impact on existing data and system dependencies.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[SQL_Schema_Definition_Language_(DDL)]]| `ALTER TABLE` is a core component of DDL used for schema evolution.                 |
| [[Table_Creation_in_SQL]]   | Tables created with `CREATE TABLE` can later be modified using `ALTER TABLE`.               |
| [[SQL_Data_Types]]          | `ALTER TABLE` is used to change the data type or length of existing columns.                |
| [[Key_Constraints_in_SQL]]  | `ALTER TABLE` can add, drop, or modify primary key and unique constraints.                  |
| [[Referential_Integrity_Constraints]]| `ALTER TABLE` is used to add, drop, or modify foreign key constraints.              |
| [[SQL_NULL_Values_and_Comparison]]| `ALTER TABLE` can add `NOT NULL` constraints (with defaults) or modify nullability.    |
| [[Dropping_SQL_Objects]]    | `ALTER TABLE DROP COLUMN` is a specific DDL operation related to dropping objects.          |
---