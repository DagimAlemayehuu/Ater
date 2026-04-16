---
title: SQL_NULL_Values_And_Comparison
created_at: '2026-01-30T11:50:33Z'
last_modified: '2026-01-30T11:50:33Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 4a355c68-fad0-42b5-aebe-d8cc0b4505fa
type: Core
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides
aliases: 
- NULL_in_SQL
- NULL_Comparison
- IS_NULL
- IS_NOT_NULL
unit: 6_Structured_Query_Language
parent: SQL_Retrieval_Queries_SELECT
---

# Definition
Before proceeding, ensure you master [[SQL_Data_Manipulation_Language_(DML)]] and [[SQL_Retrieval_Queries_(SELECT)]] because SQL `NULL` values represent missing, unknown, or inapplicable data, and their comparison requires special operators because `NULL` is not equal to anything, not even itself.
SQL `NULL` values represent data that is missing, unknown, or not applicable in a database column. It is not equivalent to zero, an empty string, or false. Because `NULL` is an indeterminate state, standard comparison operators (`=`, `!=`, `<`, `>`) do not work with `NULL` as one might expect; instead, special operators `IS NULL` and `IS NOT NULL` must be used to check for its presence or absence. A simpler way to think about `NULL` is like a blank spot on a form where information *could* be, but isn't. You can't say a blank spot "equals" another blank spot, or "equals" a filled spot; you can only ask if the spot *is* blank.

# The Mental Model
Imagine a survey form where some questions are left unanswered. `NULL` is the blank space for an unanswered question.
*   You can't say "unanswered = 'Male'" (standard comparison).
*   You can only ask, "Is this question *unanswered*?" (`IS NULL`).
*   Or, "Is this question *answered*?" (`IS NOT NULL`).
It's an acknowledgment of absence, not a value itself.

# Context & Framework
### The Transformation: Before and After
The concept of `NULL` permeates all `SQL_Data_Manipulation_Language_(DML)` operations, including `SQL_Retrieval_Queries_(SELECT)`, `Inserting_Data_in_SQL`, `Updating_Data_in_SQL`, and `Deleting_Data_in_SQL`. Understanding `NULL`'s unique comparison behavior is critical because it can lead to unexpected filtering results in `WHERE` clauses and affect `SQL_Aggregate_Functions`. By default, unless a `NOT NULL` constraint is explicitly defined during `Table_Creation_in_SQL` or `Altering_SQL_Tables`, any column can store `NULL` values. This flexibility allows for incomplete data, but it also introduces complexity in data handling.

# The Mastery Deep Dive
### The Transformation: Before and After
`NULL` is unique in that it cannot be compared using standard equality or inequality operators. This is due to SQL's three-valued logic (TRUE, FALSE, UNKNOWN). Any comparison involving `NULL` using `=`, `!=`, `>`, `<`, `>=`, `<=` will result in `UNKNOWN`.

**Special `NULL` Comparison Operators:**
*   **`IS NULL`**: Evaluates to `TRUE` if the expression (column value) is `NULL`.
*   **`IS NOT NULL`**: Evaluates to `TRUE` if the expression (column value) is not `NULL`.

**Syntax Examples:**
```sql
```sql
-- Select employees with no assigned manager
SELECT EmpName
FROM Employees
WHERE ManagerID IS NULL;

-- Select employees with an assigned manager
SELECT EmpName
FROM Employees
WHERE ManagerID IS NOT NULL;
```
```text
-- Scenario 1: Conceptual filtering for NULL values
-- Output for IS NULL: (Lists employees where ManagerID is blank/unknown)
-- Output for IS NOT NULL: (Lists employees where ManagerID has a known value)
```

**`NULL` in Other Contexts:**
*   **`ORDER BY`**: The placement of `NULL` values in sorted results (first or last) can vary between database systems but is often configurable.
*   **`SQL_Aggregate_Functions`**: Most aggregate functions (`COUNT`, `SUM`, `AVG`, `MAX`, `MIN`) **ignore `NULL` values** by default, except for `COUNT(*)`, which counts all rows regardless of `NULL`s. This is a crucial detail.
*   **`SQL_Join_Operations`**: `NULL` values will typically not match other `NULL` values in standard `JOIN` conditions, leading to rows with `NULL`s being excluded from `INNER JOIN` results. `OUTER JOIN`s are needed to include rows with `NULL`s.
*   **`IN` and `NOT IN`**: These operators behave specially with `NULL`s in the subquery result set (as discussed in [[Nested_SQL_Queries]] and [[EXISTS_and_NOT_EXISTS]]).

# Constraints & Limitations
### The "Unseen Crack": Common Structural Flaws
The most common and impactful structural flaw when dealing with `NULL` values is the misconception that `NULL = NULL` is `TRUE`, or that `column = NULL` will correctly filter for `NULL`s. These comparisons evaluate to `UNKNOWN`, which effectively acts as `FALSE` in `WHERE` clauses, leading to rows with `NULL` values being incorrectly excluded from query results. This is a subtle but critical distinction. Another limitation is the ambiguity of `NULL`: does it mean "value not yet entered," "value doesn't exist," or "value is unknown"? The database only indicates "NULL," leaving semantic interpretation to the application developer.

# Significance & Application
Correctly handling `SQL_NULL_Values_and_Comparison` is fundamental for accurate data retrieval, manipulation, and reporting. Misunderstanding `NULL`'s behavior can lead to incomplete query results, incorrect calculations from `SQL_Aggregate_Functions`, and subtle bugs in application logic. It's crucial for `Key_Constraints_in_SQL` (where `PRIMARY KEY` explicitly disallows `NULL`s) and `Referential_Integrity_Constraints` (where `ON DELETE SET NULL` is an option). Academically, it introduces the concept of three-valued logic. In industry, developers and data analysts must be diligent in using `IS NULL`/`IS NOT NULL` and understanding how `NULL`s affect joins and aggregations to ensure the integrity and reliability of their data operations.

# The Worked Example
This example demonstrates `NULL` values and their comparison operators on an `Employees` table with nullable columns.

1.  **Initial `Employees` Table Creation and Data:**
    ```sql
```sql
    CREATE TABLE Employees (
        EmpID INT PRIMARY KEY,
        EmpName VARCHAR(100) NOT NULL,
        ManagerID INT, -- Can be NULL
        PhoneNumber VARCHAR(15) -- Can be NULL
    );

    INSERT INTO Employees (EmpID, EmpName, ManagerID, PhoneNumber)
    VALUES (1, 'Alice', 101, '555-1111'),
           (2, 'Bob', 101, NULL), -- Bob has no phone number
           (3, 'Charlie', NULL, '555-3333'), -- Charlie has no manager
           (4, 'Diana', NULL, NULL); -- Diana has neither
```
```text
    -- Scenario 1: Successful table creation and initial data insertion
    -- Output:
    -- 'Table created.'
    -- '4 row(s) affected.'
    --
    -- Scenario 2: Initial table content
    -- EmpID | EmpName | ManagerID | PhoneNumber
    -- ------|---------|-----------|-------------
    -- 1     | Alice   | 101       | 555-1111
    -- 2     | Bob     | 101       | NULL
    -- 3     | Charlie | NULL      | 555-3333
    -- 4     | Diana   | NULL      | NULL
```

2.  **Using `IS NULL` (Finding employees without a manager):**
    ```sql
```sql
    SELECT EmpName
    FROM Employees
    WHERE ManagerID IS NULL;
```
```text
    -- Scenario 1: Finding rows where ManagerID is NULL
    -- Output:
    -- EmpName
    -- -------
    -- Charlie
    -- Diana
    -- Retrieves employees Charlie and Diana.
```

3.  **Using `IS NOT NULL` (Finding employees with a phone number):**
    ```sql
```sql
    SELECT EmpName
    FROM Employees
    WHERE PhoneNumber IS NOT NULL;
```
```text
    -- Scenario 1: Finding rows where PhoneNumber is NOT NULL
    -- Output:
    -- EmpName
    -- -------
    -- Alice
    -- Charlie
    -- Retrieves employees Alice and Charlie.
```

4.  **Incorrect Comparison (`=` with `NULL`) (Will return no rows):**
    ```sql
```sql
    SELECT EmpName
    FROM Employees
    WHERE ManagerID = NULL; -- This will not work as expected
```
```text
    -- Scenario 1: Incorrectly comparing with NULL using '='
    -- Output:
    -- (Empty result set)
    -- Despite Charlie and Diana having NULL ManagerID, this query returns no rows because NULL = NULL evaluates to UNKNOWN.
```

5.  **Using `COUNT(*)` vs. `COUNT(column)` with `NULL`s:**
    ```sql
```sql
    SELECT COUNT(*) AS TotalEmployees,
           COUNT(ManagerID) AS EmployeesWithManager,
           COUNT(PhoneNumber) AS EmployeesWithPhone
    FROM Employees;
```
```text
    -- Scenario 1: Demonstrating how COUNT() handles NULLs
    -- Output:
    -- TotalEmployees | EmployeesWithManager | EmployeesWithPhone
    -- -------------- | -------------------- | ------------------
    -- 4              | 2                    | 2
    -- COUNT(*) counts all rows (4).
    -- COUNT(ManagerID) counts non-NULL ManagerIDs (Alice, Bob = 2).
    -- COUNT(PhoneNumber) counts non-NULL PhoneNumbers (Alice, Charlie = 2).
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** In SQL, what does a `NULL` value represent, and what specific operators must be used to check if a column contains a `NULL` value?
> **Solution:** A `NULL` value in SQL represents **missing, unknown, or inapplicable data**. The specific operators that must be used to check for a `NULL` value are `IS NULL` and `IS NOT NULL`.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a `Projects` table with columns `ProjectID`, `ProjectName`, and `CompletionDate`. Some projects are ongoing and thus have `NULL` in their `CompletionDate`. You need to retrieve a list of all projects that are *not yet completed*. Your junior colleague writes `SELECT ProjectName FROM Projects WHERE CompletionDate != '2026-01-30';` (assuming today is `2026-01-30`).
**The Question:** Explain why your colleague's query is fundamentally flawed for retrieving all non-completed projects, specifically discussing how `NULL` values interact with the `!=` operator. Provide the correct SQL query to retrieve all projects that are not yet completed, including those with a `NULL CompletionDate`.
> **Solution:** Your colleague's query, `SELECT ProjectName FROM Projects WHERE CompletionDate != '2026-01-30';`, is fundamentally flawed because it will **exclude projects where `CompletionDate` is `NULL`**. Any comparison involving `NULL` using standard operators like `!=` (or `<>`, `<`, `>`) results in `UNKNOWN`. Since the `WHERE` clause only returns rows where the condition evaluates to `TRUE`, rows where `CompletionDate` is `NULL` will not satisfy `CompletionDate != '2026-01-30'` (because it's `UNKNOWN`), and thus will be excluded from the result set.
>
> The correct SQL query to retrieve all projects that are not yet completed (including those with a `NULL CompletionDate`) is:
> ```sql
> SELECT ProjectName
> FROM Projects
> WHERE CompletionDate IS NULL OR CompletionDate > CURRENT_DATE; -- Or whatever defines "not yet completed"
> ```
> This query uses `IS NULL` to explicitly include projects with an unknown completion date and combines it with a condition for future dates if applicable, using `OR` to ensure both conditions are considered for non-completion.

# Key Takeaways
*   `NULL` signifies missing or unknown data, not zero or empty.
*   Standard comparison operators (`=`, `!=`) return `UNKNOWN` when compared with `NULL`.
*   `IS NULL` and `IS NOT NULL` are the correct operators for checking `NULL` values.
*   `SQL_Aggregate_Functions` typically ignore `NULL`s, except `COUNT(*)`.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[SQL_Data_Manipulation_Language_(DML)]]| `NULL` values affect `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations.           |
| [[SQL_Retrieval_Queries_(SELECT)]]| `WHERE` clauses must correctly handle `NULL` values using `IS NULL`/`IS NOT NULL`.      |
| [[Key_Constraints_in_SQL]]  | `PRIMARY KEY`s explicitly disallow `NULL` values. `UNIQUE` keys generally allow one `NULL`.   |
| [[Referential_Integrity_Constraints]]| `ON DELETE SET NULL` is a foreign key action directly related to `NULL`s.             |
| [[SQL_Aggregate_Functions]] | `NULL` values are usually ignored by aggregate functions, affecting calculations.           |
| [[Nested_SQL_Queries]]      | `NULL`s in subquery results can complicate `IN` and `NOT IN` operators.                    |
| [[EXISTS_and_NOT_EXISTS]]   | `EXISTS`/`NOT EXISTS` are robust in handling `NULL`s in subqueries for existence checks.    |
| [[SQL_Join_Operations]]     | `NULL` values in join columns typically exclude rows from `INNER JOIN` results.             |
---