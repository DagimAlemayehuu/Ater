---

title: Correlated_Nested_Queries
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '6'
hub: '[[6_Database_Design_Hub]]'
source: '[[Chapter_6.pdf]]'
source_pages:
- 52
mode: CS-DB
read: false
generated: true
prerequisites:
- '[[Data_Definition_Language]]'
- '[[Referential_Integrity_Options]]'

---


# 1. Mental Model

A correlated nested query can be thought of as a nested loop in programming, where the inner loop iterates over the results of the outer loop. Just as a nested loop's inner iteration depends on the outer loop's current iteration, a correlated nested query's inner query depends on the outer query's current row. The subquery's results are re-evaluated for each row in the outer query, much like the inner loop re-executes for each iteration of the outer loop.

# 2. Schema & Query Mechanics

In a correlated nested query, the subquery references an attribute of a relation declared in the outer query, allowing the subquery to be re-evaluated for each row in the outer query's result set. This is achieved through [[Sql_Sub_Languages]] that enable the subquery to access the outer query's columns. When a [[Where]] clause is used with a correlated subquery, it filters the rows in the outer query based on the subquery's results. The [[From]] clause of the outer query declares the relation that is being iterated over, and the [[Select]] clause specifies the columns to be retrieved. The [[Data_Definition_Language]] defines the structure of the relations involved.

# 3. ACID Violations & Scaling Limits

Correlated nested queries can lead to performance issues and potential [[Acid]] violations if not properly optimized, as the subquery is re-executed for each row in the outer query. This can result in slower query execution times and increased resource utilization. If the subquery is not properly correlated with the outer query, it may lead to incorrect results or [[Referential_Integrity_Options]] issues. As the size of the outer query's result set grows, the performance impact of correlated nested queries can become more pronounced, potentially leading to scaling limits.

## 4. Entity-Relationship Model

```mermaid

erDiagram
    AIRCRAFT ||--o{ AVIONIC_SYSTEM : has
    AIRCRAFT ||--o{ FLIGHT_DATA : records
    AVIONIC_SYSTEM }|..|> SENSOR : uses
    FLIGHT_DATA ||--o{ FLIGHT_PARAMETER : measures

```

In this Mermaid entity-relationship diagram, rectangles represent entities (e.g., AIRCRAFT, AVIONIC_SYSTEM), and lines represent relationships. The `||--o{` and `}|..|>` symbols denote 1:N and M:N relationships, respectively, showing how entities are connected (e.g., an AIRCRAFT has multiple AVIONIC_SYSTEMs, and an AVIONIC_SYSTEM uses one or more SENSORs).

## 5. Walkthrough

Here are the steps for a walkthrough on correlated nested queries in the context of Aerospace Engineering & Avionics:

1. **Identify Relevant Data**: Suppose we need to find all aircraft that have a flight data record with a speed greater than 500 km/h. We start with two tables: `AIRCRAFT` and `FLIGHT_DATA`.

2. **Formulate Outer Query**: The outer query selects aircraft based on certain conditions. Let's assume we want to select all aircraft with an ID greater than 100.

3. **Introduce Correlated Subquery**: For each aircraft selected by the outer query, we want to check if there exists a flight data record where the speed exceeds 500 km/h. This can be achieved with a correlated subquery that references the `AIRCRAFT_ID` from the outer query.

4. **Write Correlated Nested Query**: 

```sql

SELECT *
FROM AIRCRAFT a
WHERE EXISTS (
  SELECT 1
  FROM FLIGHT_DATA fd
  WHERE fd.AIRCRAFT_ID = a.AIRCRAFT_ID AND fd.SPEED > 500
);

```

This query selects all aircraft that have at least one flight data record with a speed greater than 500 km/h.

5. **Execution Mechanics**: The database iterates over each row in the `AIRCRAFT` table (outer query), and for each row, it executes the subquery. The subquery checks the `FLIGHT_DATA` table for matching records. If at least one match is found, the EXISTS condition is true, and the aircraft is included in the results.

6. **Optimization Consideration**: While correlated nested queries are powerful, they can be slow due to repeated subquery executions. Consider rewriting such queries using joins or applying indexing to improve performance, especially with large datasets.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A correlated nested query's subquery results are evaluated only once, before the outer query executes.",
    "answer": false,
    "explanation": "A correlated nested query's subquery results are re-evaluated for each row in the outer query."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given a table of employees with a column for department ID, and a table of departments with a column for department head ID, write a query to find the department head for each employee's department.",
    "answer": "Use a correlated nested query to select the department head's name for each employee, by matching the department ID in the employees table with the department ID in the departments table, and then matching the department head ID in the departments table with the employee ID in the employees table.",
    "explanation": "The correlated nested query will iterate over each row in the employees table, and for each row, it will execute a subquery to find the department head's name."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id GROUP BY e.department_id HAVING COUNT(*) > 10)",
    "answer": "The bug is in the subquery: it should not have the GROUP BY and HAVING clauses. The correct query should be: SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)",
    "explanation": "The subquery is supposed to find the average salary for each department, but the GROUP BY and HAVING clauses are not needed and are causing the subquery to return incorrect results."
  }
]

```