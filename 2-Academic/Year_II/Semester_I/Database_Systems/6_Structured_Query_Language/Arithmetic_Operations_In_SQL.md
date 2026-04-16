---
title: Arithmetic_Operations_In_SQL
created_at: '2026-01-30T11:51:44Z'
last_modified: '2026-01-30T11:51:44Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: d1d43c96-057c-4400-b42b-213a730a409f
type: Core
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides
aliases: 
- SQL_Arithmetic
- Numeric_Operations
unit: 6_Structured_Query_Language
parent: SQL_Retrieval_Queries_SELECT
---

# Definition
Before proceeding, ensure you master [[SQL_Retrieval_Queries_(SELECT)]] and [[SQL_Data_Types]] because arithmetic operations in SQL allow mathematical calculations to be performed on numeric columns within a `SELECT` statement, deriving new values from existing data.
Arithmetic operations in SQL are mathematical calculations performed on numeric `SQL_Data_Types` (like `INT`, `DECIMAL`, `FLOAT`) within `SQL_Retrieval_Queries_(SELECT)` statements. The standard operators include addition (`+`), subtraction (`-`), multiplication (`*`), and division (`/`). These operations enable the derivation of new calculated values from existing data, such as computing total costs, discounts, or employee raises, directly within the query result. A simpler way to think about it is like using a calculator directly within your data: you can instantly calculate "price minus discount" or "salary times 1.1 (for a 10% raise)" as you retrieve the data.

# The Mental Model
Imagine you have a list of product prices and quantities. `Arithmetic_Operations_in_SQL` is like telling your assistant: "For each product, multiply its `Price` by its `Quantity` to give me the `TotalCost`." The assistant doesn't change the original data but presents a new, calculated column in the report.

# Context & Framework
### The "Duh!" Moment (Intuitive Proof)
Arithmetic operations are a natural extension of `SQL_Retrieval_Queries_(SELECT)`, allowing data to be transformed and presented in a more meaningful way without modifying the underlying stored values. They are typically used in the `SELECT` list to generate computed columns or within `WHERE` clauses to filter rows based on calculated values. This capability prevents the need for client-side application logic to perform simple calculations, improving efficiency and ensuring consistent calculations across all data interactions.

# The Mastery Deep Dive
### Let's Plug in Numbers (Watch it Work)
Arithmetic operators can be used directly within the `SELECT` clause to create computed columns, or within the `WHERE` clause for filtering.

**Standard Operators:**
*   `+`: Addition
*   `-`: Subtraction
*   `*`: Multiplication
*   `/`: Division

**Syntax in `SELECT` clause:**
```sql
```sql
SELECT ProductName, Price, Quantity,
       Price * Quantity AS TotalValue,
       (Price * Quantity) - 50 AS DiscountedValue
FROM Products;
```
```text
-- Scenario 1: Calculating new columns using arithmetic operations
-- Example (assuming Products: {('Laptop', 1000, 5), ('Mouse', 20, 10)})
-- Output:
-- ProductName | Price | Quantity | TotalValue | DiscountedValue
-- ----------- | ----- | -------- | ---------- | ---------------
-- Laptop      | 1000  | 5        | 5000       | 4950
-- Mouse       | 20    | 10       | 200        | 150
-- New columns 'TotalValue' and 'DiscountedValue' are computed.
```

**Operator Precedence:** Standard mathematical operator precedence applies (multiplication and division before addition and subtraction). Parentheses `()` can be used to override precedence.

**Division by Zero:** Division by zero (`/ 0`) is an important consideration. In most SQL databases, attempting to divide by zero will result in an error or `SQL_NULL_Values_and_Comparison` for the result of that specific calculation, depending on the database system's configuration.

### Edge Case Analysis
*   **Division by Zero**: Explicitly ask: "What happens if a `Quantity` is 0 and you calculate `Price / Quantity`?" The result will often be an error or `NULL`. You would need to handle this with a `CASE` statement or `NULLIF` (e.g., `Price / NULLIF(Quantity, 0)` to prevent errors.
*   **Data Type Promotion**: When performing arithmetic operations, SQL might implicitly convert (promote) data types to a higher precision type to avoid loss of data. For example, multiplying an `INT` by a `DECIMAL` usually results in a `DECIMAL`.

# Constraints & Limitations
### The "Unseen Crack": Common Structural Flaws
The primary structural flaw and limitation with `Arithmetic_Operations_in_SQL` is the risk of **division by zero errors**. If a divisor column can contain `0`, the query will either terminate with an error or produce `NULL` results for the affected rows, leading to incomplete or incorrect output. This requires explicit handling (e.g., using `NULLIF` or a `CASE` statement to check for zero before dividing). Another limitation is precision loss with floating-point numbers (`FLOAT`), which can sometimes lead to tiny inaccuracies in calculations due to how computers represent decimals. For financial data, `DECIMAL` or `NUMERIC` types are always preferred.

# Significance & Application
Arithmetic operations are fundamental to data analysis, reporting, and business logic within a database. They enable applications to perform calculations and present derived information without burdening the application layer. Academically, they demonstrate the processing capabilities of SQL beyond simple data retrieval. In industry, they are used daily for tasks like calculating employee bonuses, computing sales commissions, determining profit margins, converting units, or adjusting values based on various factors. Mastery of these operations allows for powerful in-database data transformation.

# The Worked Example
This example demonstrates arithmetic operations on an `Order_Items` table to calculate total price and apply a discount.

1.  **Initial `Order_Items` Table Creation and Data:**
    ```sql
```sql
    CREATE TABLE Order_Items (
        ItemID INT PRIMARY KEY,
        OrderID INT,
        ProductID INT,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(10, 2) NOT NULL,
        ItemDiscount DECIMAL(4, 2) DEFAULT 0.00 -- Discount percentage
    );

    INSERT INTO Order_Items (ItemID, OrderID, ProductID, Quantity, UnitPrice, ItemDiscount)
    VALUES (1, 101, 1001, 2, 50.00, 0.10),
           (2, 101, 1002, 1, 120.00, 0.00), -- No discount
           (3, 102, 1001, 3, 50.00, 0.05),
           (4, 103, 1003, 1, 250.00, NULL); -- Unknown discount, treat as 0
```
```text
    -- Scenario 1: Successful table creation and initial data insertion
    -- Output:
    -- 'Table created.'
    -- '4 row(s) affected.'
    --
    -- Scenario 2: Initial table content
    -- ItemID | OrderID | ProductID | Quantity | UnitPrice | ItemDiscount
    -- ------ | ------- | --------- | -------- | ----------- | ------------
    -- 1      | 101     | 1001      | 2        | 50.00       | 0.10
    -- 2      | 101     | 1002      | 1        | 120.00      | 0.00
    -- 3      | 102     | 1001      | 3        | 50.00       | 0.05
    -- 4      | 103     | 1003      | 1        | 250.00      | NULL
```

2.  **Calculate Total Price (Quantity * UnitPrice):**
    ```sql
```sql
    SELECT ItemID,
           Quantity * UnitPrice AS LineTotal
    FROM Order_Items;
```
```text
    -- Scenario 1: Calculating line total for each item
    -- Output:
    -- ItemID | LineTotal
    -- ------ | ---------
    -- 1      | 100.00
    -- 2      | 120.00
    -- 3      | 150.00
    -- 4      | 250.00
```

3.  **Calculate Discounted Price (Handling `NULL` discounts):**
    ```sql
```sql
    SELECT ItemID,
           UnitPrice * Quantity AS FullPrice,
           COALESCE(ItemDiscount, 0) AS ActualDiscountRate,
           (UnitPrice * Quantity) * (1 - COALESCE(ItemDiscount, 0)) AS DiscountedPrice
    FROM Order_Items;
```
```text
    -- Scenario 1: Calculating discounted price, treating NULL discount as 0
    -- Output:
    -- ItemID | FullPrice | ActualDiscountRate | DiscountedPrice
    -- ------ | --------- | ------------------ | ---------------
    -- 1      | 100.00    | 0.10               | 90.00
    -- 2      | 120.00    | 0.00               | 120.00
    -- 3      | 150.00    | 0.05               | 142.50
    -- 4      | 250.00    | 0.00               | 250.00
    -- For ItemID 4, NULL discount is treated as 0 due to COALESCE.
```

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** List the four standard arithmetic operators available in SQL for numeric calculations.
> **Solution:** The four standard arithmetic operators are: `+` (addition), `-` (subtraction), `*` (multiplication), and `/` (division).

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a `ProductCosts` table with columns `ProductID`, `PurchasePrice`, and `UnitsSold`. You need to calculate the average `ProfitPerUnit` for each product, defined as (`PurchasePrice` - `ManufacturingCost`) / `UnitsSold`. However, some products might have `UnitsSold` as `0`.
**The Question:** Write an SQL `SELECT` query to calculate `ProfitPerUnit` for each product. Crucially, explain how you would prevent a "division by zero" error in this query, explicitly showing the SQL function used to handle this edge case.
> **Solution:** The SQL `SELECT` query to calculate `ProfitPerUnit` while preventing division by zero (assuming `ManufacturingCost` is another column in `ProductCosts`):
> ```sql
> SELECT ProductID,
>        (PurchasePrice - ManufacturingCost) / NULLIF(UnitsSold, 0) AS ProfitPerUnit
> FROM ProductCosts;
> ```
> To prevent a "division by zero" error, the `NULLIF(UnitsSold, 0)` function is used. `NULLIF` takes two arguments; if the first argument is equal to the second argument, it returns `NULL`. Otherwise, it returns the first argument. In this case, if `UnitsSold` is `0`, `NULLIF(UnitsSold, 0)` will return `NULL`. Since division by `NULL` in SQL results in `NULL` (rather than an error), this effectively bypasses the division by zero error, and `ProfitPerUnit` will simply be `NULL` for any product where `UnitsSold` is `0`.

# Key Takeaways
*   Standard arithmetic operators (`+`, `-`, `*`, `/`) perform calculations on numeric data.
*   They are primarily used in the `SELECT` list for computed columns and `WHERE` for filtering.
*   Division by zero is a critical edge case, requiring explicit handling with functions like `NULLIF` or `CASE` statements.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[SQL_Retrieval_Queries_(SELECT)]]| Arithmetic operations are performed within the `SELECT` clause to derive new values.    |
| [[SQL_Data_Types]]          | Arithmetic operations are applied to numeric data types.                                    |
| [[SQL_NULL_Values_and_Comparison]]| Division by `NULL` results in `NULL`; explicit handling needed for division by zero.  |
| [[SQL_Aggregate_Functions]] | Aggregate functions often perform arithmetic operations internally (e.g., `SUM`, `AVG`).    |
| [[Updating_Data_in_SQL]]    | `UPDATE` statements can use arithmetic expressions in the `SET` clause to modify values.    |
---