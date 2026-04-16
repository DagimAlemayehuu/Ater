---
title: "UNION_Operation"
type: "Core"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "7 The Relational Algebra And The Relational Calculus"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.005748"
last_edited_time: "2026-04-16T13:47:45.005749"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master Set_Theory and Type_Compatibility because the UNION operation fundamentally relies on the principles of set theory for combining elements and strict type compatibility for its operands.
The UNION operation in Relational Algebra, denoted by the symbol $U$, is a binary set operation that combines all tuples from two relations (R and S) into a single new relation. This new relation includes all tuples that are present in R, or in S, or in both R and S, with duplicate tuples being automatically eliminated. Think of it like merging two contact lists: you want all unique contacts from both lists, without any duplicates.

# The Mental Model
Imagine you have two separate lists of students: one for students enrolled in "Database Systems" (Relation R) and another for students enrolled in "Advanced Algorithms" (Relation S). If you perform a UNION operation on these two lists, the result is a single comprehensive list containing every student who is enrolled in *either* Database Systems, *or* Advanced Algorithms, or *both*. Crucially, if a student is on both lists, they only appear once in the final merged list.

# Context & Framework
### The Foundation: What We Already Know
The UNION operation is directly inherited from fundamental concepts in set theory. In mathematics, the union of two sets A and B, denoted $A \cup B$, is the set containing all elements that are in A, or in B, or in both. Relational Algebra applies this principle to relations, where each relation is considered a set of tuples. This means that like mathematical sets, the resulting relation from a UNION operation will not contain duplicate tuples, ensuring data integrity and uniqueness.

# The Mastery Deep Dive
### The "Duh!" Moment (Intuitive Proof)
Intuitively, if we have two groups of items, and we want to create a single group that includes *all* items from both original groups without repeating any, the concept of union naturally emerges. For instance, if a student is in class A and also in class B, they are still just one student in the larger school population. The UNION operation in relational algebra simply formalizes this intuitive idea for database tuples.

### The Translator: Converting English to Math
The process of translating a natural language request involving "either/or" or "all distinct elements from both" into a Relational Algebra UNION operation requires careful mapping. For example, a query asking for "all social security numbers of employees who either work in department 5 OR directly supervise an employee who works in department 5" clearly indicates the need for a UNION, as it combines results from two separate conditions. Each condition forms a distinct relation, which are then combined.

Consider retrieving the social security numbers (SSN) of all employees who either work in department 5 or directly supervise an employee who works in department 5.

**Step 1: Identify employees working in department 5.**
$$ \boxed{\displaystyle DEP5\_EMPS \leftarrow \sigma_{DNO=5}(EMPLOYEE)} $$
**Step 2: Project their SSNs to form RESULT1.**
$$ \boxed{\displaystyle RESULT1 \leftarrow \pi_{SSN}(DEP5\_EMPS)} $$
**Step 3: Identify employees who supervise an employee in department 5.**
$$ \boxed{\displaystyle RESULT2\_TEMP \leftarrow \sigma_{DNO=5}(EMPLOYEE)} $$
$$ \boxed{\displaystyle RESULT2 \leftarrow \pi_{SUPERSSN}(RESULT2\_TEMP)} $$
**Step 4: Combine the SSNs from RESULT1 and RESULT2 using UNION.**
$$ \boxed{\displaystyle FINAL\_RESULT \leftarrow RESULT1 \cup RESULT2} $$

This sequence first identifies employees in department 5 and extracts their SSNs. Then, it identifies the supervisors of employees in department 5 and extracts their supervisor SSNs. Finally, it uses the UNION operation to combine these two sets of SSNs, ensuring no duplicates.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
The most common pitfall with the `UNION` operation is violating the **type compatibility** rule. For two relations R and S to be union-compatible, they **must have the same number of attributes**, and **each corresponding pair of attributes must have compatible domains** (i.e., the same or compatible data types). Failing this will result in a runtime error, as the database system cannot meaningfully merge tuples with differing structures or incompatible data.

# Significance & Application
The `UNION` operation is fundamental for queries that require combining data from multiple sources or different conditions where the structure of the combined data is consistent. It's heavily used in reporting, data warehousing, and scenarios where a comprehensive list of distinct entities is needed from various logical partitions of a database. For example, generating a unified customer list from separate regional customer tables.

# The Worked Example
Let's consider two hypothetical relations, `PROGRAMMERS` and `DESIGNERS`, both having `(Name, Department, Salary)` attributes. We want to find all distinct names of individuals who are either programmers or designers.

**`PROGRAMMERS` Relation:**
| Name    | Department  | Salary |
| :
------ | :
---------- | :
----- |
| Alice   | Engineering | 80000  |
| Bob     | Engineering | 75000  |
| Charlie | Engineering | 90000  |

**`DESIGNERS` Relation:**
| Name    | Department  | Salary |
| :
------ | :
---------- | :
----- |
| Charlie | Design      | 85000  |
| David   | Design      | 70000  |
| Alice   | Engineering | 80000  |
**Relational Algebra Expression:**
```text
RESULT_NAMES <- π_Name(PROGRAMMERS) U π_Name(DESIGNERS)
```
```text
// Scenario 1: Executing the UNION operation on the Name attribute after projection
// Input: PROGRAMMERS table (Alice, Bob, Charlie), DESIGNERS table (Charlie, David, Alice)
// Output:
// The PROJECT operation (π_Name) on PROGRAMMERS yields: {Alice, Bob, Charlie}
// The PROJECT operation (π_Name) on DESIGNERS yields: {Charlie, David, Alice}
// The UNION operation combines these two sets, eliminating duplicates:
// {Alice, Bob, Charlie, David}
```
In this example, we first project the `Name` attribute from both the `PROGRAMMERS` and `DESIGNERS` relations. This creates two temporary relations, each containing only the names. Then, the `UNION` operation combines these two sets of names, automatically eliminating the duplicate 'Alice' and 'Charlie', resulting in a list of all unique individuals.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: Understanding (The Basics)
**The Fact Check:** If Relation A has 10 tuples and Relation B has 15 tuples, and 3 tuples are common to both, how many tuples will `A U B` produce?
> **Solution:** `A U B` will produce `10 + 15 - 3 = 22` tuples.

### Level 2: Competence (Application)
**The Trade-off:** You have two relations: `STUDENTS(ID, Name, Major)` and `FACULTY(ID, Name, Department)`. Can you directly apply the `UNION` operation to these two relations? If not, what preliminary step(s) would be required to make them union-compatible for a query that seeks all distinct IDs and Names, regardless of being a student or faculty?
> **Solution:** No, you cannot directly apply `UNION` because the relations are not type-compatible (different attribute names: `Major` vs. `Department`). To make them union-compatible, you would need to `PROJECT` both relations to `(ID, Name)` first.
> Example: `(π_ID,Name(STUDENTS)) U (π_ID,Name(FACULTY))`

### Level 3: Mastery (The Crucible)
**The Broken System:** A developer attempts to combine two tables, `EMPLOYEES_A (EmpID, Name, Dept)` and `EMPLOYEES_B (EmpID, EmployeeName, DepartmentName)`, using a `UNION` operation to get a comprehensive list of all employees. The operation fails with a "type incompatibility" error. Explain precisely why this error occurred, referencing the specific `UNION` rule that was violated, and propose a relational algebra expression (using `RENAME` and `UNION`) to correctly achieve the desired result.
> **Solution:** The error occurred because the `EMPLOYEES_A` and `EMPLOYEES_B` relations are not **type compatible**. Specifically, the attribute names (`Name` vs. `EmployeeName`, `Dept` vs. `DepartmentName`) for the corresponding positions are different, violating the `UNION` rule that requires corresponding attributes to have compatible domains and names (or at least compatible domains if `RENAME` is used).
>
> To correct this, `RENAME` operations must be applied to `EMPLOYEES_B` to align its attribute names with `EMPLOYEES_A` before performing the `UNION`:
> $$ \boxed{\displaystyle Corrected\_EMPLOYEES\_B \leftarrow \rho_{EmpID,Name,Dept}(EMPLOYEES\_B)} $$
> $$ \boxed{\displaystyle All\_Employees \leftarrow EMPLOYEES\_A \cup Corrected\_EMPLOYEES\_B} $$
> This ensures that both relations have the same number of attributes and identical attribute names for their corresponding positions, satisfying the type compatibility requirement for `UNION`.

# Key Takeaways
*   The `UNION` operation combines tuples from two relations into a single new relation, automatically eliminating duplicates.
*   Relations involved in a `UNION` operation must be "type compatible," meaning they have the same number of attributes and corresponding attributes have compatible domains.
*   `UNION` is a fundamental set-theoretic operation crucial for combining data from different sources or conditions in relational databases.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Relational_Algebra]]      | `UNION` is a fundamental binary operation within Relational Algebra.                        |
| Set_Theory              | The `UNION` operation in Relational Algebra is based on the mathematical concept of set union. |
| Type_Compatibility      | Relations must have type compatibility (same number of attributes, compatible domains) to perform `UNION`. |
| Duplicate_Elimination   | A key feature of `UNION` is the automatic elimination of duplicate tuples in the result.        |
---