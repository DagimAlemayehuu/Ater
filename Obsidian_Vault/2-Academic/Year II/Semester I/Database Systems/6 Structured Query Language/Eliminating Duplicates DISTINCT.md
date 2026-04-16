---
title: "Eliminating_Duplicates_DISTINCT"
type: "Core"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "6 Structured Query Language"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.041209"
last_edited_time: "2026-04-16T13:47:45.041210"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[SQL_Retrieval_Queries_(SELECT)]] and Relational_Database_Model because the `DISTINCT` keyword is a crucial feature within `SELECT` statements that allows users to retrieve only unique rows from the query result, eliminating any duplicate combinations of the selected columns.
Eliminating duplicates in SQL refers to using the `DISTINCT` keyword in a `SQL_Retrieval_Queries_(SELECT)` statement to ensure that only unique rows are returned in the result set. This is important because, by default, SQL does not treat a relation as a mathematical "set" (which inherently contains only unique elements); thus, duplicate tuples (rows) can appear in query results. `DISTINCT` explicitly filters these out. A simpler way to think about it is like getting a list of all your friends' favorite ice cream flavors: if three friends like chocolate, `DISTINCT` would show 'Chocolate' only once, giving you a list of unique flavors, not how many times each was mentioned.

# The Mental Model
Imagine you have a long list of students and their majors, and many students share the same major. `DISTINCT` is like asking for "a list of all *unique* majors currently offered." Instead of getting 'Computer Science', 'Biology', 'Computer Science', 'Physics', 'Biology', you'd simply get 'Computer Science', 'Biology', 'Physics'. It cleans up the list by removing any repeated entries.

# Context & Framework
### The Transformation: Before and After
The `DISTINCT` keyword significantly transforms the result set of a `SQL_Retrieval_Queries_(SELECT)` query. By default, SQL returns all rows that match the query criteria, including duplicates. `DISTINCT` explicitly instructs the database to perform an additional processing step: after all other filtering (e.g., `WHERE` clause) and column projection (e.g., `SELECT` list) have occurred, it scans the resulting rows and removes any that are identical to another row in the final result set. This process can have performance implications for very large result sets, as it requires sorting or hashing to identify and remove duplicates.

# The Mastery Deep Dive
### The Transformation: Before and After
The `DISTINCT` keyword is placed directly after the `SELECT` keyword and applies to all columns specified in the `SELECT` list.

**Syntax:**
```sql
```sql
SELECT DISTINCT column1, column2, ...
FROM TableName
WHERE condition;
```
```text
-- Scenario 1: Conceptual structure for unique results
-- Output:
-- SELECT DISTINCT col1, col2, ... FROM TableName WHERE condition;
-- Returns only unique combinations of (col1, col2, ...).
```

**Key Considerations:**
*   **Applies to all selected columns**: `DISTINCT` operates on the *entire combination* of columns specified after it. For `SELECT DISTINCT city, state FROM Addresses;`, a row is considered unique if the `(city, state)` pair is unique. If you have ('New York', 'NY') and ('New York', 'CA'), both will be returned because the `(city, state)` pair is different.
*   **Performance Impact**: Eliminating duplicates requires the database to sort the data or use hash tables to identify unique combinations. For large datasets, this can be computationally expensive and impact query performance. It's best to use `DISTINCT` only when genuinely needed.
*   **`NULL` values**: `DISTINCT` treats two `NULL` values as equal for the purpose of identifying duplicates. So, if a column contains multiple `NULL`s, only one `NULL` will be included in the `DISTINCT` result.

# Constraints & Limitations
### The "Unseen Crack": Common Structural Flaws
A common mistake is misinterpreting the scope of `DISTINCT`. It applies to the *entire row* (or the entire set of selected columns), not just a single column within the `SELECT` list. For example, if you want only unique `DepartmentName`s, `SELECT DISTINCT DepartmentName, EmployeeName FROM Employees;` will give you unique *combinations* of `(DepartmentName, EmployeeName)`, which is likely not what was intended. This misapplication can lead to more rows than expected, failing to truly eliminate the desired duplicates. Another limitation is the performance overhead; for very large tables, `DISTINCT` can consume significant resources.

# Significance & Application
`Eliminating_Duplicates_(DISTINCT)` is a fundamental tool for data analysis and reporting. It's crucial when you need to get a clear, unique count of categories (e.g., how many unique departments exist, what are all the different product types), rather than just a raw list that might contain redundant entries. Academically, it highlights the difference between a multiset (bag) and a set in database theory. In industry, it's used extensively in business intelligence reports, statistical analysis, and to clean up or summarize data for presentation, ensuring that each unique item is counted or listed only once.

# The Worked Example
This example demonstrates the use of `DISTINCT` on a `Orders` table, showing how it filters duplicate `customer_id`s and combinations.

1.  **Initial `Orders` Table with Duplicates:**
    ```sql
```sql
    CREATE TABLE Orders (
        OrderID INT PRIMARY KEY,
        CustomerID INT,
        OrderDate DATE,
        ShippingCity VARCHAR(50)
    );

    INSERT INTO Orders (OrderID, CustomerID, OrderDate, ShippingCity)
    VALUES (1, 101, '2026-01-01', 'New York'),
           (2, 102, '2026-01-01', 'London'),
           (3, 101, '2026-01-05', 'New York'),
           (4, 103, '2026-01-06', 'Paris'),
           (5, 102, '2026-01-10', 'London');
```
```text
    -- Scenario 1: Successful table creation and initial data insertion
    -- Output:
    -- 'Table created.'
    -- '5 row(s) affected.'
    --
    -- Scenario 2: Initial table content
    -- OrderID | CustomerID | OrderDate  | ShippingCity
    -- ------- | ---------- | ---------- | ------------
    -- 1       | 101        | 2026-01-01 | New York
    -- 2       | 102        | 2026-01-01 | London
    -- 3       | 101        | 2026-01-05 | New York
    -- 4       | 103        | 2026-01-06 | Paris
    -- 5       | 102        | 2026-01-10 | London
```

2.  **`SELECT` without `DISTINCT` (Shows all rows):**
    ```sql
```sql
    SELECT CustomerID, ShippingCity
    FROM Orders;
```
```text
    -- Scenario 1: Retrieving all (potentially duplicate) combinations
    -- Output:
    -- CustomerID | ShippingCity
    -- ---------- | ------------
    -- 101        | New York
    -- 102        | London
    -- 101        | New York
    -- 103        | Paris
    -- 102        | London
    -- Shows all 5 rows, including duplicate (101, New York) and (102, London) pairs.
```

3.  **`SELECT DISTINCT` (Eliminates duplicate combinations):**
    ```sql
```sql
    SELECT DISTINCT CustomerID, ShippingCity
    FROM Orders;
```
```text
    -- Scenario 1: Retrieving only unique combinations of CustomerID and ShippingCity
    -- Output:
    -- CustomerID | ShippingCity
    -- ---------- | ------------
    -- 101        | New York
    -- 102        | London
    -- 103        | Paris
    -- Only 3 unique combinations are returned.
```

4.  **`SELECT DISTINCT` on a single column (Unique customer IDs):**
    ```sql
```sql
    SELECT DISTINCT CustomerID
    FROM Orders;
```
```text
    -- Scenario 1: Retrieving only unique CustomerIDs
    -- Output:
    -- CustomerID
    -- ----------
    -- 101
    -- 102
    -- 103
    -- Only 3 unique CustomerIDs are returned.
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What is the primary purpose of the `DISTINCT` keyword in a `SQL_Retrieval_Queries_(SELECT)` statement?
> **Solution:** The primary purpose of the `DISTINCT` keyword is to **eliminate duplicate rows** from the result set of a `SELECT` query, ensuring that only unique combinations of the selected columns are returned.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a `Registrations` table with columns `EventName`, `AttendeeName`, and `City`. Many attendees might be from the same `City`, and the same `EventName` might occur in multiple cities. You want to get a list of all unique cities where events have been registered, but a colleague mistakenly writes `SELECT DISTINCT EventName, City FROM Registrations;`
**The Question:** Explain why your colleague's query will likely return *more* rows than intended if the goal is to get a list of unique cities. Write the corrected `SQL_Retrieval_Queries_(SELECT)` query to achieve the goal of listing only unique cities.
> **Solution:** Your colleague's query, `SELECT DISTINCT EventName, City FROM Registrations;`, will likely return more rows than intended because `DISTINCT` applies to the **entire combination of selected columns**. If the same `City` (e.g., 'London') appears with different `EventName`s (e.g., 'Tech Expo', 'Design Conference'), both combinations `('Tech Expo', 'London')` and `('Design Conference', 'London')` would be considered unique and included in the result. This does not give a list of unique cities.
>
> The corrected `SQL_Retrieval_Queries_(SELECT)` query to achieve the goal of listing only unique cities is:
> ```sql
> SELECT DISTINCT City
> FROM Registrations;
> ```
> This query applies `DISTINCT` solely to the `City` column, ensuring that each unique city is listed only once.

# Key Takeaways
*   `DISTINCT` ensures only unique combinations of selected columns are returned.
*   It applies to all columns in the `SELECT` list, not just one.
*   `DISTINCT` is valuable for data analysis and reporting to avoid redundant entries but can impact performance on large datasets.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[SQL_Retrieval_Queries_(SELECT)]]| `DISTINCT` is a keyword used within the `SELECT` statement to filter results.           |
| Relational_Database_Model| `DISTINCT` helps convert a multiset (bag) of tuples into a set, aligning with relational theory. |
| [[SQL_Set_Operations]]      | `DISTINCT` is implicitly applied by set operations like `UNION` to ensure unique results. |
| [[SQL_Aggregate_Functions]] | `DISTINCT` can be used within aggregate functions (e.g., `COUNT(DISTINCT column)`) to count unique values. |
---