---
title: CS1241_6_Structured_Query_Language_Possible_Questions
created_at: '2026-01-30T11:39:07Z'
last_modified: '2026-01-30T11:39:07Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 989149a4-4f90-41d1-bd44-4c7b39f10129
type: Questions
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides
aliases: []
unit: 6_Structured_Query_Language
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Structured_Query_Language_Overview]]
### Level 1: Understanding (The Basics)
1.  **The Fact Check:** Identify the four primary sublanguages of SQL and briefly describe the main purpose of each.
### Level 2: Competence (Application)
2.  **The Trade-off:** Explain why SQL is considered a versatile language for both schema definition and data manipulation, outlining the benefits of having these capabilities integrated into a single language.
### Level 3: Mastery (The Crucible)
3.  **The Impostor:** You encounter a database system that uses a proprietary language for defining tables but standard SQL for querying data. Explain why this setup, while functional, might lead to "vendor lock-in" and hinder portability, referencing the core concepts of SQL.

## [[SQL_Schema_Definition_Language_(DDL)]]
### Level 1: Understanding (The Basics)
4.  **The Component Check:** What is the primary role of Data Definition Language (DDL) in SQL, and name three common DDL commands.
### Level 2: Competence (Application)
5.  **The Clean Build:** Describe a scenario where a `CREATE SCHEMA` statement would be beneficial before defining individual tables.
### Level 3: Mastery (The Crucible)
6.  **The Broken System:** A junior developer attempts to create a new schema named `sales-data` in a production database. What is the most likely outcome of this action, and why would it lead to an error?

## [[SQL_Data_Types]]
### Level 1: Understanding (The Basics)
7.  **The Neighbor Check:** List the three main categories of SQL data types discussed in this unit and provide one example for each.
### Level 2: Competence (Application)
8.  **The Sort:** Given a list of attributes (`CustomerID`, `OrderDate`, `ProductName`, `UnitPrice`, `IsAvailable`), suggest an appropriate SQL data type for each and justify your choices.
### Level 3: Mastery (The Crucible)
9.  **The Impostor:** A legacy system uses a `LONG` data type for storing user comments. Explain why, despite appearing to handle large text, this might be a "false friend" compared to `VARCHAR(n)` for modern database design, specifically in terms of flexibility and potential limitations.

## [[Table_Creation_in_SQL]]
### Level 1: Understanding (The Basics)
10. **The Component Check:** What is the SQL command used to create a new base relation, and what are the two essential elements specified within this command?
### Level 2: Competence (Application)
11. **The Clean Build:** Write an SQL `CREATE TABLE` statement for a `Customers` table with `customer_id` (integer, cannot be null), `first_name` (variable characters, max 50), and `email` (variable characters, max 100, must be unique).
### Level 3: Mastery (The Crucible)
12. **The Broken System:** A `CREATE TABLE` statement fails because one of the columns attempts to specify `DECIMAL(i,j)` but the provided values for `i` and `j` are invalid. Describe the typical meaning of `i` and `j` in the `DECIMAL` data type and how incorrect usage leads to a creation error.

## [[Key_Constraints_in_SQL]]
### Level 1: Understanding (The Basics)
13. **The Component Check:** Name the two key constraints that can be specified using the `CREATE TABLE` command to enforce uniqueness.
### Level 2: Competence (Application)
14. **The Clean Build:** Modify the `Customers` table `CREATE TABLE` statement from the previous question to include `customer_id` as the primary key and `email` as a unique key.
### Level 3: Mastery (The Crucible)
15. **The Impossible Case:** Explain why it's generally not advisable to define a `PRIMARY KEY` on an attribute that might change frequently (e.g., a username), even if it's currently unique. What negative impacts could this have on the database's integrity and performance?

## [[Referential_Integrity_Constraints]]
### Level 1: Understanding (The Basics)
16. **The Element ID:** What is the purpose of a `FOREIGN KEY` constraint, and which clause is used with it to define behavior on `DELETE` or `UPDATE` operations?
### Level 2: Competence (Application)
17. **The Clean Build:** Create two tables, `Departments` (`dept_id` PK, `dept_name`) and `Employees` (`emp_id` PK, `emp_name`, `dept_id` FK). Ensure that when a department is deleted, all employees in that department have their `dept_id` set to `NULL`.
```sql
-- Create Departments table
CREATE TABLE Departments (
    dept_id INTEGER PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL
);

-- Create Employees table with foreign key constraint
CREATE TABLE Employees (
    emp_id INTEGER PRIMARY KEY,
    emp_name VARCHAR(100) NOT NULL,
    dept_id INTEGER,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);
```
```text
-- Scenario 1: Deleting a department
-- Expected outcome: Employees in the deleted department will have their dept_id set to NULL.
-- Example:
-- INSERT INTO Departments VALUES (1, 'Sales');
-- INSERT INTO Employees VALUES (101, 'Alice', 1);
-- DELETE FROM Departments WHERE dept_id = 1;
-- SELECT * FROM Employees;
-- Result:
-- supplier_id | supplier_name | phone_number
-- ----------- | ------------- | ------------
-- 1           | ABC Corp      | NULL
-- 2           | XYZ Ltd       | NULL
```
### Level 3: Mastery (The Crucible)
18. **The Broken System:** You are tasked with designing a database for an online forum where users can create posts. If a user account is deleted, all their posts should also be deleted. However, you discover that a `FOREIGN KEY` with `ON DELETE RESTRICT` was initially used. Explain why this specific referential action would prevent user deletion and what change is necessary to achieve the desired cascading deletion.

## [[Altering_SQL_Tables]]
### Level 1: Understanding (The Basics)
19. **The Tool Check:** What SQL command is used to add an attribute to an existing base relation?
### Level 2: Competence (Application)
20. **The Routine Run:** Write an `ALTER TABLE` statement to add a new column `phone_number` of type `VARCHAR(15)` to an existing table named `Suppliers`.
```sql
ALTER TABLE Suppliers
ADD phone_number VARCHAR(15);
```
```text
-- Scenario 1: After adding the column
-- Expected outcome: The 'Suppliers' table will now have a 'phone_number' column. All existing rows will have NULL in this new column.
-- Example:
-- SELECT * FROM Suppliers;
-- Result:
-- supplier_id | supplier_name | phone_number
-- ----------- | ------------- | ------------
-- 1           | ABC Corp      | NULL
-- 2           | XYZ Ltd       | NULL
```
### Level 3: Mastery (The Crucible)
21. **The Disaster Drill:** A database administrator attempts to `ALTER TABLE` to `ADD` a new `NOT NULL` column `creation_date` to a `Products` table that already contains thousands of existing records. What error will likely occur, and what is the proper sequence of steps to add a mandatory non-nullable column to an existing table with data?

## [[Dropping_SQL_Objects]]
### Level 1: Understanding (The Basics)
22. **The Tool Check:** What SQL command is used to completely remove a table and its definition from the database?
### Level 2: Competence (Application)
23. **The Routine Run:** Explain the key difference between `DROP TABLE` and `TRUNCATE TABLE` in terms of their effect on data and allocated space.
### Level 3: Mastery (The Crucible)
24. **The Disaster Drill:** A new intern accidentally executes `DROP TABLE Financial_Transactions;` in a production environment. Explain why this action is catastrophic and virtually irreversible, highlighting the fundamental difference between `DROP` and `DELETE` in terms of transaction control.

## [[SQL_Data_Manipulation_Language_(DML)]]
### Level 1: Understanding (The Basics)
25. **The Fact Check:** What is the main purpose of Data Manipulation Language (DML) in SQL, and name two primary DML commands.
### Level 2: Competence (Application)
26. **The Trade-off:** Explain why DML commands are designed to operate on individual records or sets of records rather than the schema itself.
### Level 3: Mastery (The Crucible)
27. **The Impostor:** You are told that a specific database operation "changes the structure of the database but also affects data." Is this statement describing a DDL or DML operation, and why? Justify your answer by clarifying the distinct roles of each.

## [[Inserting_Data_in_SQL]]
### Level 1: Understanding (The Basics)
28. **The Component Check:** What is the basic SQL command used to add new data (tuples) into a table?
### Level 2: Competence (Application)
29. **The Clean Build:** Write an SQL `INSERT INTO` statement to add a new order to an `Orders` table, specifying `order_id` (101), `customer_id` (5), and `order_date` ('2026-01-30').
```sql
INSERT INTO Orders (order_id, customer_id, order_date)
VALUES (101, 5, '2026-01-30');
```
```text
-- Scenario 1: Successful insertion
-- Expected outcome: A new row for order 101, customer 5, and date 2026-01-30 is added to the 'Orders' table.
-- Example:
-- SELECT * FROM Orders WHERE order_id = 101;
-- Result:
-- order_id | customer_id | order_date
-- -------- | ----------- | ----------
-- 101      | 5           | 2026-01-30
```
### Level 3: Mastery (The Crucible)
30. **The Broken System:** A user attempts to `INSERT` a new row into a table, omitting a column that has a `NOT NULL` constraint and no `DEFAULT` value. What error will occur, and what are two ways to resolve this insertion failure?

## [[Updating_Data_in_SQL]]
### Level 1: Understanding (The Basics)
31. **The Component Check:** Which SQL DML command is used to modify existing attribute values in one or more selected tuples?
### Level 2: Competence (Application)
32. **The Clean Build:** Write an SQL `UPDATE` statement to change the `status` of `Order_ID` 101 in the `Orders` table to 'Shipped'.
```sql
UPDATE Orders
SET status = 'Shipped'
WHERE order_id = 101;
```
```text
-- Scenario 1: Successful update
-- Expected outcome: The 'status' column for order_id 101 is changed to 'Shipped'.
-- Example:
-- INSERT INTO Orders (order_id, customer_id, order_date, status) VALUES (101, 5, '2026-01-30', 'Pending');
-- UPDATE Orders SET status = 'Shipped' WHERE order_id = 101;
-- SELECT status FROM Orders WHERE order_id = 101;
-- Result:
-- status
-- --------
-- Shipped
```
### Level 3: Mastery (The Crucible)
33. **The Impossible Case:** An `UPDATE` statement is executed without a `WHERE` clause. Describe the devastating effect this would have on the entire table and explain why a `WHERE` clause is crucial for targeted modifications.

## [[Deleting_Data_in_SQL]]
### Level 1: Understanding (The Basics)
34. **The Component Check:** What is the SQL DML command used to remove tuples from a relation?
### Level 2: Competence (Application)
35. **The Clean Build:** Write an SQL `DELETE` statement to remove all orders from the `Orders` table that were placed before '2026-01-01'.
```sql
DELETE FROM Orders
WHERE order_date < '2026-01-01';
```
```text
-- Scenario 1: Deleting old orders
-- Expected outcome: All rows in the 'Orders' table with an order_date earlier than 2026-01-01 will be removed.
-- Example:
-- INSERT INTO Orders (order_id, order_date) VALUES (1, '2025-12-25');
-- INSERT INTO Orders (order_id, order_date) VALUES (2, '2026-01-15');
-- DELETE FROM Orders WHERE order_date < '2026-01-01';
-- SELECT COUNT(*) FROM Orders;
-- Result:
-- count(*)
-- --------
-- 1        (Only order 2 remains)
```
### Level 3: Mastery (The Crucible)
36. **The Impossible Case:** A `DELETE` statement is used on a `Products` table to remove a product that is referenced by a `FOREIGN KEY` in an `Order_Items` table, where the `FOREIGN KEY` has an `ON DELETE RESTRICT` clause. Explain why the `DELETE` statement will fail and what action is required to successfully remove the product.

## [[SQL_Transaction_Control_(Commit_Rollback)]]
### Level 1: Understanding (The Basics)
37. **The Tool Check:** Name the two SQL commands used for transaction control, defining their respective purposes.
### Level 2: Competence (Application)
38. **The Routine Run:** Describe a scenario where `ROLLBACK` would be essential after a series of `INSERT` and `UPDATE` statements have been executed.
### Level 3: Mastery (The Crucible)
39. **The Disaster Drill:** A complex series of DML operations (inserts, updates, deletes) are performed, but due to an unexpected power outage, the database system crashes before a `COMMIT` statement is executed. Explain what happens to the changes made during this transaction and why.

## [[SQL_Retrieval_Queries_(SELECT)]]
### Level 1: Understanding (The Basics)
40. **The Component Check:** What is the basic SQL statement used for retrieving information from a database, and what are its three mandatory clauses?
### Level 2: Competence (Application)
41. **The Clean Build:** Write a `SELECT` query to retrieve the `first_name` and `last_name` of all employees from an `Employees` table where their `salary` is greater than 50000.
```sql
SELECT first_name, last_name
FROM Employees
WHERE salary > 50000;
```
```text
-- Scenario 1: Retrieving employees with high salary
-- Expected outcome: Lists first and last names of employees whose salary exceeds 50000.
-- Example:
-- INSERT INTO Employees (first_name, last_name, salary) VALUES ('Alice', 'Smith', 60000);
-- INSERT INTO Employees (first_name, last_name, salary) VALUES ('Bob', 'Johnson', 45000);
-- SELECT first_name, last_name FROM Employees WHERE salary > 50000;
-- Result:
-- first_name | last_name
-- ---------- | ---------
-- Alice      | Smith
```
### Level 3: Mastery (The Crucible)
42. **The Impossible Case:** You are asked to retrieve all employee names and their department names. You write a query with `SELECT Employees.name, Departments.name FROM Employees, Departments;`. Explain why this query will produce an incorrect and excessively large result set, and what crucial clause is missing.

## [[Aliases_and_Wildcards_in_SQL]]
### Level 1: Understanding (The Basics)
43. **The Component Check:** Explain the purpose of aliases in SQL queries and give an example of a wildcard character used to retrieve all attributes.
### Level 2: Competence (Application)
44. **The Clean Build:** Write a `SELECT` query that retrieves the `title` and `author` from a `Books` table. Alias the `title` column as `Book_Title` and the `author` column as `Book_Author`.
```sql
SELECT title AS Book_Title, author AS Book_Author
FROM Books;
```
```text
-- Scenario 1: Applying aliases to columns
-- Expected outcome: Returns a result set with columns named 'Book_Title' and 'Book_Author'.
-- Example:
-- INSERT INTO Books (title, author) VALUES ('The Great Gatsby', 'F. Scott Fitzgerald');
-- SELECT title AS Book_Title, author AS Book_Author FROM Books;
-- Result:
-- Book_Title       | Book_Author
-- ---------------- | -------------------
-- The Great Gatsby | F. Scott Fitzgerald
```
### Level 3: Mastery (The Crucible)
45. **The Broken System:** A query attempts to join `Employees` (aliased as `E`) and `Departments` (aliased as `D`), but within the `SELECT` clause, it refers to `Employees.EmployeeName` instead of `E.EmployeeName`. Explain why this would cause a parsing error and why using aliases consistently is critical.

## [[Eliminating_Duplicates_(DISTINCT)]]
### Level 1: Understanding (The Basics)
46. **The Component Check:** What SQL keyword is used to eliminate duplicate tuples from a query result?
### Level 2: Competence (Application)
47. **The Clean Build:** Write a `SELECT` query to retrieve the unique `city` values from a `Customers` table.
```sql
SELECT DISTINCT city
FROM Customers;
```
```text
-- Scenario 1: Retrieving unique cities
-- Expected outcome: Returns a list of cities with no duplicates.
-- Example:
-- INSERT INTO Customers (city) VALUES ('New York');
-- INSERT INTO Customers (city) VALUES ('London');
-- INSERT INTO Customers (city) VALUES ('New York');
-- SELECT DISTINCT city FROM Customers;
-- Result:
-- city
-- --------
-- New York
-- London
```
### Level 3: Mastery (The Crucible)
48. **The Impossible Case:** You execute a `SELECT DISTINCT country, city FROM Addresses;` query. Explain why, even if there are multiple rows with the same `city` but different `country` values, those rows will *not* be considered duplicates and will both appear in the result.

## [[SQL_Set_Operations]]
### Level 1: Understanding (The Basics)
49. **The Component Check:** Name two common set operations directly incorporated into SQL.
### Level 2: Competence (Application)
50. **The Clean Build:** Write an SQL query using `UNION` to combine the `employee_id`s from a `FullTime_Employees` table and a `PartTime_Employees` table.
```sql
SELECT employee_id FROM FullTime_Employees
UNION
SELECT employee_id FROM PartTime_Employees;
```
```text
-- Scenario 1: Combining employee IDs
-- Expected outcome: A single list of unique employee_ids from both tables.
-- Example:
-- INSERT INTO FullTime_Employees (employee_id) VALUES (1), (2);
-- INSERT INTO PartTime_Employees (employee_id) VALUES (2), (3);
-- SELECT employee_id FROM FullTime_Employees UNION SELECT employee_id FROM PartTime_Employees;
-- Result:
-- employee_id
-- -----------
-- 1
-- 2
-- 3
```
### Level 3: Mastery (The Crucible)
51. **The Impossible Case:** You attempt to use the `UNION` operator between two `SELECT` statements: one selecting `name` (VARCHAR) and `age` (INTEGER), and the other selecting `product_name` (VARCHAR) and `price` (DECIMAL). Explain why this query will fail due to "union compatibility" rules.

## [[Nested_SQL_Queries]]
### Level 1: Understanding (The Basics)
52. **The Component Check:** What is a nested query in SQL, and where is it typically specified within another query?
### Level 2: Competence (Application)
53. **The Clean Build:** Write a nested SQL query to find the names of employees who work in the 'IT' department. (Assume `Employees` table has `emp_name`, `dept_id`; `Departments` table has `dept_id`, `dept_name`).
```sql
SELECT emp_name
FROM Employees
WHERE dept_id IN (SELECT dept_id FROM Departments WHERE dept_name = 'IT');
```
```text
-- Scenario 1: Finding employees in a specific department
-- Expected outcome: Lists the names of employees who belong to the 'IT' department.
-- Example:
-- INSERT INTO Departments (dept_id, dept_name) VALUES (10, 'IT');
-- INSERT INTO Employees (emp_name, dept_id) VALUES ('Alice', 10);
-- INSERT INTO Employees (emp_name, dept_id) VALUES ('Bob', 20);
-- SELECT emp_name FROM Employees WHERE dept_id IN (SELECT dept_id FROM Departments WHERE dept_name = 'IT');
-- Result:
-- emp_name
-- --------
-- Alice
```
### Level 3: Mastery (The Crucible)
54. **The Broken System:** A nested query is written where the inner query refers to a column (`Employees.salary`) from the outer query's `FROM` clause, but the outer query's `WHERE` clause does not refer to the inner query. What kind of nested query is this, and why might it lead to unexpected behavior if not carefully constructed?

## [[Correlated_Nested_Queries]]
### Level 1: Understanding (The Basics)
55. **The Component Check:** What makes a nested query "correlated" with its outer query?
### Level 2: Competence (Application)
56. **The Clean Build:** Write a correlated nested query to retrieve the names of all employees who earn more than the average salary in their respective departments. (Assume `Employees` table has `emp_name`, `salary`, `dept_id`).
```sql
SELECT E.emp_name
FROM Employees E
WHERE E.salary > (SELECT AVG(E2.salary) FROM Employees E2 WHERE E2.dept_id = E.dept_id);
```
```text
-- Scenario 1: Employees earning above department average
-- Expected outcome: Lists names of employees whose salary is greater than the average salary of their own department.
-- Example:
-- INSERT INTO Employees (emp_name, salary, dept_id) VALUES ('Alice', 70000, 10), ('Bob', 50000, 10), ('Charlie', 60000, 20);
-- SELECT E.emp_name FROM Employees E WHERE E.salary > (SELECT AVG(E2.salary) FROM Employees E2 WHERE E2.dept_id = E.dept_id);
-- Result:
-- emp_name
-- --------
-- Alice
```
### Level 3: Mastery (The Crucible)
57. **The Impossible Case:** Explain why a correlated nested query is often less efficient than a non-correlated nested query or a `JOIN` operation. Focus on how the execution flow differs for each tuple of the outer query.

## [[EXISTS_and_NOT_EXISTS]]
### Level 1: Understanding (The Basics)
58. **The Component Check:** What is the primary purpose of the `EXISTS` function in SQL queries?
### Level 2: Competence (Application)
59. **The Clean Build:** Write an SQL query using `EXISTS` to find the names of departments that have at least one employee. (Assume `Departments` table has `dept_name`, `dept_id`; `Employees` table has `emp_name`, `dept_id`).
```sql
SELECT dept_name
FROM Departments D
WHERE EXISTS (SELECT * FROM Employees E WHERE E.dept_id = D.dept_id);
```
```text
-- Scenario 1: Departments with employees
-- Expected outcome: Lists department names that have at least one employee.
-- Example:
-- INSERT INTO Departments (dept_id, dept_name) VALUES (10, 'HR'), (20, 'Finance');
-- INSERT INTO Employees (emp_name, dept_id) VALUES ('Sarah', 10);
-- SELECT dept_name FROM Departments D WHERE EXISTS (SELECT * FROM Employees E WHERE E.dept_id = D.dept_id);
-- Result:
-- dept_name
-- ---------
-- HR
```
### Level 3: Mastery (The Crucible)
60. **The Impossible Case:** Explain the fundamental difference in how `EXISTS` and `IN` operators handle subqueries that return `NULL` values. Why might `EXISTS` be preferred in certain situations to avoid unexpected results related to `NULL`s?

## [[SQL_NULL_Values_and_Comparison]]
### Level 1: Understanding (The Basics)
61. **The Variable ID:** How does SQL compare `NULL` values, and what specific operators are used for checking if a value is `NULL` or `NOT NULL`?
### Level 2: Competence (Application)
62. **The Standard Solver:** Write a `SELECT` query to retrieve the names of all employees from an `Employees` table who do not have an assigned manager (assume `manager_id` column can be `NULL`).
```sql
SELECT emp_name
FROM Employees
WHERE manager_id IS NULL;
```
```text
-- Scenario 1: Employees without a manager
-- Expected outcome: Lists names of employees whose manager_id is NULL.
-- Example:
-- INSERT INTO Employees (emp_name, manager_id) VALUES ('Alice', 100), ('Bob', NULL);
-- SELECT emp_name FROM Employees WHERE manager_id IS NULL;
-- Result:
-- emp_name
-- --------
-- Bob
```
### Level 3: Mastery (The Crucible)
63. **The Impossible Case:** Explain why the condition `salary = NULL` will never return any rows in SQL, even for employees whose salary is indeed `NULL`. What is the underlying logical reason for this behavior?

## [[SQL_Aggregate_Functions]]
### Level 1: Understanding (The Basics)
64. **The Variable ID:** Name three common aggregate functions in SQL and briefly describe what each calculates.
### Level 2: Competence (Application)
65. **The Standard Solver:** Write an SQL query to find the total number of employees, their average salary, and the maximum salary in the `Employees` table.
```sql
SELECT COUNT(emp_id), AVG(salary), MAX(salary)
FROM Employees;
```
```text
-- Scenario 1: Calculating overall statistics
-- Expected outcome: Returns a single row with the total count, average salary, and maximum salary of all employees.
-- Example:
-- INSERT INTO Employees (emp_id, salary) VALUES (1, 50000), (2, 60000), (3, 70000);
-- SELECT COUNT(emp_id), AVG(salary), MAX(salary) FROM Employees;
-- Result:
-- count | avg    | max
-- ----- | ------ | ----
-- 3     | 60000.0| 70000
```
### Level 3: Mastery (The Crucible)
66. **The Impossible Case:** Explain what happens to `NULL` values when aggregate functions like `AVG()` or `SUM()` are applied to a column containing them. How does this behavior differ from `COUNT(*)`?

## [[Grouping_Data_in_SQL_(GROUP_BY)]]
### Level 1: Understanding (The Basics)
67. **The Component Check:** What SQL clause is used to apply aggregate functions to subgroups of tuples in a relation?
### Level 2: Competence (Application)
68. **The Clean Build:** Write an SQL query to retrieve the `department_id` and the number of employees in each department from the `Employees` table.
```sql
SELECT department_id, COUNT(emp_id)
FROM Employees
GROUP BY department_id;
```
```text
-- Scenario 1: Counting employees per department
-- Expected outcome: Returns the count of employees for each unique department_id.
-- Example:
-- INSERT INTO Employees (emp_id, department_id) VALUES (1, 10), (2, 20), (3, 10), (4, 30);
-- SELECT department_id, COUNT(emp_id) FROM Employees GROUP BY department_id;
-- Result:
-- department_id | count
-- ------------- | -----
-- 10            | 2
-- 20            | 1
-- 30            | 1
```
### Level 3: Mastery (The Crucible)
69. **The Broken System:** A `SELECT` statement includes both a non-aggregate column (`employee_name`) and an aggregate function (`COUNT(*)`), but it is missing a `GROUP BY` clause. Explain why this query will produce an error and what the rule is for including non-aggregate columns in a `SELECT` list when using aggregate functions.

## [[Filtering_Groups_(HAVING_Clause)]]
### Level 1: Understanding (The Basics)
70. **The Component Check:** What SQL clause is used to specify a selection condition on groups (rather than on individual tuples)?
### Level 2: Competence (Application)
71. **The Clean Build:** Write an SQL query to find the `department_id`s that have more than 5 employees.
```sql
SELECT department_id, COUNT(emp_id)
FROM Employees
GROUP BY department_id
HAVING COUNT(emp_id) > 5;
```
```text
-- Scenario 1: Departments with more than 5 employees
-- Expected outcome: Returns department IDs where the employee count exceeds 5.
-- Example:
-- INSERT INTO Employees (emp_id, department_id) VALUES (1, 10), (2, 10), (3, 10), (4, 10), (5, 10), (6, 10), (7, 20);
-- SELECT department_id, COUNT(emp_id) FROM Employees GROUP BY department_id HAVING COUNT(emp_id) > 5;
-- Result:
-- department_id | count
-- ------------- | -----
-- 10            | 6
```
### Level 3: Mastery (The Crucible)
72. **The Impossible Case:** Explain the fundamental difference between the `WHERE` clause and the `HAVING` clause in terms of when they are applied during query execution and what kind of conditions they can filter on.

## [[Substring_Comparison_with_LIKE]]
### Level 1: Understanding (The Basics)
73. **The Variable ID:** Which SQL comparison operator is used to compare partial strings, and what are the two reserved wildcard characters it commonly employs?
### Level 2: Competence (Application)
74. **The Clean Build:** Write an SQL query to retrieve the names of all products from a `Products` table whose names start with 'Eco'.
```sql
SELECT product_name
FROM Products
WHERE product_name LIKE 'Eco%';
```
```text
-- Scenario 1: Products starting with 'Eco'
-- Expected outcome: Lists names of products that begin with the 'Eco' prefix.
-- Example:
-- INSERT INTO Products (product_name) VALUES ('EcoWidget'), ('Economy_Size'), ('LuxuryItem');
-- SELECT product_name FROM Products WHERE product_name LIKE 'Eco%';
-- Result:
-- product_name
-- ------------
-- EcoWidget
-- Economy_Size
```
### Level 3: Mastery (The Crucible)
75. **The Impossible Case:** A database stores product codes in the format 'XXX-YYY-ZZZ'. You want to find all products where the second group of three characters (YYY) is 'ABC'. Write a `LIKE` pattern for this and explain why simply using `'%ABC%'` would be insufficient.

## [[Arithmetic_Operations_in_SQL]]
### Level 1: Understanding (The Basics)
76. **The Variable ID:** List the four standard arithmetic operators that can be applied to numeric values in an SQL query result.
### Level 2: Competence (Application)
77. **The Standard Solver:** Write an SQL query to calculate a 5% bonus for all employees in the `Employees` table, displaying their `emp_name` and the `bonus_amount`.
```sql
SELECT emp_name, salary * 0.05 AS bonus_amount
FROM Employees;
```
```text
-- Scenario 1: Calculating employee bonuses
-- Expected outcome: Lists employee names and their calculated 5% bonus.
-- Example:
-- INSERT INTO Employees (emp_name, salary) VALUES ('Alice', 60000), ('Bob', 40000);
-- SELECT emp_name, salary * 0.05 AS bonus_amount FROM Employees;
-- Result:
-- emp_name | bonus_amount
-- -------- | ------------
-- Alice    | 3000.00
-- Bob      | 2000.00
```
### Level 3: Mastery (The Crucible)
78. **The Impossible Case:** You write a query `SELECT total_sales / number_of_units FROM Sales;` where `number_of_units` can sometimes be `0`. Explain the mathematical error this query will encounter and how SQL typically handles division by zero.

## [[Ordering_Query_Results_(ORDER_BY)]]
### Level 1: Understanding (The Basics)
79. **The Component Check:** What SQL clause is used to sort the tuples in a query result, and what are the two keywords for specifying sort order?
### Level 2: Competence (Application)
80. **The Clean Build:** Write an SQL query to retrieve all products from a `Products` table, ordered by `price` in descending order.
```sql
SELECT product_name, price
FROM Products
ORDER BY price DESC;
```
```text
-- Scenario 1: Ordering products by price
-- Expected outcome: Lists product names and prices, sorted from highest to lowest price.
-- Example:
-- INSERT INTO Products (product_name, price) VALUES ('Laptop', 1200.00), ('Keyboard', 75.00), ('Monitor', 300.00);
-- SELECT product_name, price FROM Products ORDER BY price DESC;
-- Result:
-- product_name | price
-- ------------ | -------
-- Laptop       | 1200.00
-- Monitor      | 300.00
-- Keyboard     | 75.00
```
### Level 3: Mastery (The Crucible)
81. **The Impossible Case:** You sort a list of `item_name` values using `ORDER BY item_name ASC` and notice that 'apple' appears before 'Apple'. Explain why this happens, considering SQL's default collation behavior.

## [[SQL_Join_Operations]]
### Level 1: Understanding (The Basics)
82. **The Component Check:** In SQL, how can you combine columns from two or more tables based on a related column between them?
### Level 2: Competence (Application)
83. **The Clean Build:** Write an SQL query using an `INNER JOIN` to retrieve the `employee_name` and their corresponding `department_name` from `Employees` and `Departments` tables.
```sql
SELECT E.employee_name, D.department_name
FROM Employees E
INNER JOIN Departments D ON E.department_id = D.department_id;
```
```text
-- Scenario 1: Joining employees with their departments
-- Expected outcome: Lists employee names matched with their department names.
-- Example:
-- INSERT INTO Departments (department_id, department_name) VALUES (10, 'Sales'), (20, 'HR');
-- INSERT INTO Employees (employee_name, department_id) VALUES ('John Doe', 10), ('Jane Smith', 20), ('Peter Jones', 30); -- Peter has no matching department
-- SELECT E.employee_name, D.department_name FROM Employees E INNER JOIN Departments D ON E.department_id = D.department_id;
-- Result:
-- employee_name | department_name
-- ------------- | ---------------
-- John Doe      | Sales
-- Jane Smith    | HR
```
### Level 3: Mastery (The Crucible)
84. **The Impossible Case:** You perform a `LEFT OUTER JOIN` between a `Customers` table (left) and an `Orders` table (right) on `customer_id`. Explain what kind of `customer_id` values will appear in the result from the `Customers` table even if they have no matching orders, and how the `Orders` table columns will appear for these customers.