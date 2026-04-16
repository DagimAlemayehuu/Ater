---
title: "Substring_Comparison_With_LIKE"
type: "Core"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "6 Structured Query Language"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.049304"
last_edited_time: "2026-04-16T13:47:45.049305"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[SQL_Retrieval_Queries_(SELECT)]] and [[SQL_Data_Types]] because substring comparison with `LIKE` is a powerful feature in SQL's `WHERE` clause that allows for pattern matching against string data, rather than exact value comparisons.
Substring comparison with `LIKE` is an SQL operator used in `WHERE` clauses to search for specified patterns within string data. It's particularly useful when you need to find rows where a text column contains, starts with, or ends with a specific sequence of characters, or matches a more complex pattern involving wildcards. The two main wildcard characters are `%` (representing zero or more characters) and `_` (representing a single character). A simpler way to think about it is like using a flexible search function: instead of "find me a book *titled* 'Database Systems'", you can ask "find me books *where the title contains* 'Database' or *starts with* 'SQL'".

# The Mental Model
Imagine you're searching through a physical address book.
*   `Name LIKE 'J%'`: You're looking for anyone whose name *starts with* 'J'. You don't care what comes after 'J'.
*   `Phone LIKE '555-____'`: You're looking for a phone number that *starts with* '555-' followed by *exactly four more digits*.
*   `Email LIKE '%@gmail.com'`: You're looking for any email address that *ends with* '@gmail.com'. You don't care what comes before.
The `LIKE` operator, with its wildcards, allows you to specify these flexible search patterns.

# Context & Framework
### The Transformation: Before and After
The `LIKE` operator significantly enhances the filtering capabilities of the `WHERE` clause in `SQL_Retrieval_Queries_(SELECT)` statements, moving beyond simple equality comparisons. It allows for `Substring_Comparison_with_LIKE` against textual data (`CHAR`, `VARCHAR` `SQL_Data_Types`). This is crucial for applications that involve searching, fuzzy matching, or parsing information stored as strings. The patterns used with `LIKE` can be static string literals or dynamic values derived from other parts of a query or application. When combined with logical operators (`AND`, `OR`), complex text-based searches can be constructed.

# The Mastery Deep Dive
### The Transformation: Before and After
The `LIKE` operator is used within the `WHERE` clause and takes a string pattern as its argument.

**Syntax:**
```sql
```sql
SELECT column1, column2
FROM TableName
WHERE text_column LIKE 'pattern';
```
```text
-- Scenario 1: Conceptual structure for pattern matching
-- Output:
-- SELECT col1, col2 FROM TableName WHERE text_column LIKE 'pattern';
-- Filters rows where text_column matches the specified pattern.
```

**Wildcard Characters:**
*   **`%` (Percent sign)**: Represents zero, one, or multiple characters.
    *   `'A%'`: Matches any string starting with 'A'.
    *   `'%A'`: Matches any string ending with 'A'.
    *   `'%A%'`: Matches any string containing 'A'.
*   **`_` (Underscore)**: Represents a single, arbitrary character.
    *   `'A_'`: Matches any two-character string starting with 'A'.
    *   `'_A'`: Matches any two-character string ending with 'A'.
    *   `'__A%'`: Matches any string with 'A' as its third character.

**Escaping Wildcards:**
If you need to search for a literal `%` or `_` character in your data, you must use an `ESCAPE` clause.
```sql
```sql
WHERE ProductCode LIKE 'ABC\_%' ESCAPE '\'; -- Searches for 'ABC_' followed by anything
```
```text
-- Scenario 1: Escaping a literal underscore in a LIKE pattern
-- Output:
-- Filters products where the ProductCode literally starts with 'ABC_' and then any characters.
```

# Constraints & Limitations
### The "Unseen Crack": Common Structural Flaws
A common structural flaw when using `LIKE` is misinterpreting the behavior of the wildcard characters, especially `_`. Forgetting that `_` matches *exactly one* character, not zero or many, can lead to incorrect or incomplete results. Performance is another significant limitation: `LIKE` comparisons, especially those with a leading wildcard (e.g., `'%keyword'`), often prevent the database from using indexes efficiently, forcing a full table scan. This can make `Substring_Comparison_with_LIKE` very slow on large tables. For more advanced or high-performance text searches, full-text indexing or other specialized search technologies are usually preferred.

# Significance & Application
`Substring_Comparison_with_LIKE` is a vital capability for any application dealing with textual data, enabling flexible and user-friendly search functionalities. It's essential for tasks such as finding products by partial name, searching customer records by fragments of addresses, or filtering logs for specific error messages. Academically, it introduces basic pattern matching concepts in database queries. In industry, it's used extensively in search bars of web applications, data validation routines, reporting tools, and any scenario where exact string matching is too restrictive.

# The Worked Example
This example demonstrates `LIKE` with various wildcard patterns on a `Customers` table.

1.  **Initial `Customers` Table Creation and Data:**
    ```sql
```sql
    CREATE TABLE Customers (
        CustomerID INT PRIMARY KEY,
        FirstName VARCHAR(50),
        LastName VARCHAR(50),
        Email VARCHAR(100),
        City VARCHAR(50)
    );

    INSERT INTO Customers (CustomerID, FirstName, LastName, Email, City)
    VALUES (1, 'Alice', 'Smith', 'alice.smith@example.com', 'New York'),
           (2, 'Bob', 'Johnson', 'bob.j@sample.net', 'London'),
           (3, 'Charlie', 'Brown', 'charlie.b@test.org', 'Newark'),
           (4, 'David', 'Davis', 'david_d@domain.co', 'London'),
           (5, 'Eve', 'Evans', 'eve@example.com', 'New Orleans');
```
```text
    -- Scenario 1: Successful table creation and initial data insertion
    -- Output:
    -- 'Table created.'
    -- '5 row(s) affected.'
    --
    -- Scenario 2: Initial table content
    -- CustomerID | FirstName | LastName | Email                     | City
    -- ---------- | --------- | -------- | ------------------------- | -----------
    -- 1          | Alice     | Smith    | alice.smith@example.com   | New York
    -- 2          | Bob       | Johnson  | bob.j@sample.net          | London
    -- 3          | Charlie   | Brown    | charlie.b@test.org        | Newark
    -- 4          | David     | Davis    | david_d@domain.co         | London
    -- 5          | Eve       | Evans    | eve@example.com           | New Orleans
```

2.  **`LIKE` with `%` (Starts with 'A'):**
    ```sql
```sql
    SELECT FirstName, LastName
    FROM Customers
    WHERE FirstName LIKE 'A%';
```
```text
    -- Scenario 1: Finding first names starting with 'A'
    -- Output:
    -- FirstName | LastName
    -- --------- | --------
    -- Alice     | Smith
    -- Retrieves 'Alice Smith'.
```

3.  **`LIKE` with `%` (Contains 'john'):**
    ```sql
```sql
    SELECT FirstName, LastName
    FROM Customers
    WHERE LastName LIKE '%john%';
```
```text
    -- Scenario 1: Finding last names containing 'john' (case-insensitive depends on DBMS)
    -- Output:
    -- FirstName | LastName
    -- --------- | --------
    -- Bob       | Johnson
    -- Retrieves 'Bob Johnson'.
```

4.  **`LIKE` with `_` (Specific pattern, e.g., third character 'e'):**
    ```sql
```sql
    SELECT FirstName, Email
    FROM Customers
    WHERE Email LIKE '__e%'; -- Third character is 'e'
```
```text
    -- Scenario 1: Finding emails where the third character is 'e'
    -- Output:
    -- FirstName | Email
    -- --------- | -----------------------
    -- Alice     | alice.smith@example.com
    -- Retrieves 'Alice', as 'l' is the third char in 'alice'. (Note: this is a tricky one for 'alice.smith', 'a' is 1st, 'l' is 2nd, 'i' is 3rd. Let's adjust to `WHERE Email LIKE 'a_i%'` or similar to avoid confusion in explanation.)
    -- Let's re-evaluate: `__e%` would mean the 3rd character is 'e'.
    -- 'alice.smith...' (a-l-i)
    -- 'bob.j...' (b-o-b)
    -- 'charlie.b...' (c-h-a)
    -- 'david_d...' (d-a-v)
    -- 'eve@example.com' (e-v-e) -> This matches.
    --
    -- Corrected output for '__e%':
    -- FirstName | Email
    -- --------- | ---------------
    -- Eve       | eve@example.com
```

5.  **`LIKE` with combined wildcards (Starts with 'New' and has exactly two characters after, then ends with 's'):**
    ```sql
```sql
    SELECT City
    FROM Customers
    WHERE City LIKE 'New__s';
```
```text
    -- Scenario 1: Finding cities matching 'New__s'
    -- Output:
    -- City
    -- -----------
    -- New Orleans
    -- Retrieves 'New Orleans', as 'Orlean' has exactly two characters between 'New' and 's'. This is also a tricky example.
    -- Let's stick to simpler examples to avoid confusing the user with the example.
    -- 'New York' (N-e-w_Y-o-r-k) -- No, ends with 'k' not 's'
    -- 'Newark' (N-e-w-a-r-k) -- No, ends with 'k' not 's'
    -- 'New Orleans' (N-e-w_O-r-l-e-a-n-s) -- Yes, 'Orlean' has 6 characters, not 2.
    -- This specific pattern 'New__s' would mean 'New' followed by two characters, then 's'.
    -- E.g., 'News' -> 'New' + 's' (2 chars)
    -- E.g., 'Newas'
    --
    -- Let's use simpler cities or a more precise pattern.
    -- Let's simplify the example to make the _ clear.
    -- Example 5: Find emails that have exactly one character before '@'
    -- SELECT Email FROM Customers WHERE Email LIKE '_@%';
    --- END_CODE:sql ---
```
```text
    -- Scenario 1: Finding emails with exactly one character before '@'
    -- Output:
    -- Email
    -- -------------------------
    -- bob.j@sample.net
    -- eve@example.com
    -- Retrieves emails like 'bob.j@sample.net' (where 'j' is the single char before '@') and 'eve@example.com' (where 'e' is the single char before '@').
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What is the primary purpose of the `LIKE` operator in SQL, and what do the two wildcard characters `%` and `_` represent?
> **Solution:** The primary purpose of the `LIKE` operator is to perform **pattern matching** on string data. The `%` wildcard represents **zero, one, or multiple characters**, while the `_` wildcard represents **a single arbitrary character**.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a `Products` table with a `ProductName` column. You need to find all products that contain the word "pro" anywhere in their name, but specifically *not* if "pro" is at the very beginning of the name. Examples: "Processor" (match), "Laptop Pro" (match), "Productivity Tool" (no match - starts with 'Pro').
**The Question:** Write an SQL query using the `LIKE` operator and logical operators to achieve this precise pattern matching. Explain why a simple `WHERE ProductName LIKE '%pro%'` would be insufficient.
> **Solution:** A simple `WHERE ProductName LIKE '%pro%'` would be insufficient because it would match any product name containing "pro", including those that start with "pro" (e.g., "Processor"), which the requirement specifically excludes.
>
> The correct SQL query to achieve this precise pattern matching is:
> ```sql
> SELECT ProductName
> FROM Products
> WHERE ProductName LIKE '%pro%' -- Contains "pro" anywhere
>   AND ProductName NOT LIKE 'pro%'; -- But does NOT start with "pro"
> ```
> This query uses a combination of `LIKE` and `NOT LIKE` with the `%` wildcard. The first condition (`ProductName LIKE '%pro%'`) broadly selects all products that contain "pro". The second condition (`ProductName NOT LIKE 'pro%'`) then filters out any of those results that *start* with "pro", satisfying the precise requirement. (Note: Case sensitivity of `LIKE` depends on the database collation; assume case-insensitive for this example.)

# Key Takeaways
*   `LIKE` enables pattern matching for string data in `WHERE` clauses.
*   `%` matches zero or more characters; `_` matches exactly one character.
*   `LIKE` is less efficient than exact matches or indexed searches, especially with leading wildcards.
*   Combine `LIKE` with `NOT LIKE` and logical operators for complex patterns.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[SQL_Retrieval_Queries_(SELECT)]]| `LIKE` is a comparison operator used within the `WHERE` clause of `SELECT` statements.  |
| [[SQL_Data_Types]]          | `LIKE` is specifically used for pattern matching against string data types.                 |
| [[SQL_NULL_Values_and_Comparison]]| `LIKE` comparisons with `NULL` values will result in `UNKNOWN`, thus filtering them out. |
| [[Aliases_and_Wildcards_in_SQL]]| The concept of wildcards in `LIKE` extends `*` for selecting all columns.                |
| [[Arithmetic_Operations_in_SQL]]| `LIKE` is a string operator, fundamentally different from arithmetic operations on numbers. |
---