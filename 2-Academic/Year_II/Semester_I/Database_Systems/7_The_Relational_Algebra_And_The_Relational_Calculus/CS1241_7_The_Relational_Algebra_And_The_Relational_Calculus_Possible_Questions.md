---
title: CS1241_7_The_Relational_Algebra_And_The_Relational_Calculus_Possible_Questions
created_at: '2026-02-03T05:40:18Z'
last_modified: '2026-02-03T05:40:18Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: b67edac1-8e69-4502-b43f-0118772780fc
type: Questions
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides_-_Relational_Algebra_and_Calculus_Chapter_7
aliases: []
unit: 7_The_Relational_Algebra_And_The_Relational_Calculus
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Relational_Algebra]]
### Level 1: Understanding (The Basics)
1.  **The Fact Check:** What is the primary characteristic that makes Relational Algebra a "procedural" language for database queries?
### Level 2: Competence (Application)
2.  **The Trade-off:** Explain a scenario where choosing to write a complex query using a sequence of intermediate relational algebra operations might be preferred over a single, nested expression. Justify your choice.
### Level 3: Mastery (The Crucible)
3.  **The Impossible Case:** Consider a Relational Algebra expression that attempts to combine two relations `R` and `S` using a `UNION` operation, where `R` has attributes `(A, B)` and `S` has attributes `(X, Y)`. Critically analyze why this operation would immediately fail from a theoretical perspective, referencing the core rules of set-theoretic operations in Relational Algebra.

## [[Relational_Calculus]]
### Level 1: Understanding (The Basics)
4.  **The Fact Check:** What is the fundamental difference in approach between Relational Algebra and Relational Calculus when formulating a database query?
### Level 2: Competence (Application)
5.  **The Trade-off:** Imagine you are explaining database querying to a non-technical manager. Would you use the concept of Relational Algebra or Relational Calculus to describe how data is retrieved, and why?
### Level 3: Mastery (The Crucible)
6.  **The Impostor:** A colleague argues that because SQL queries often involve `SELECT`, `FROM`, and `WHERE` clauses in a specific order, SQL is purely a procedural language, making it equivalent to Relational Algebra. Identify the flaw in this reasoning, and explain how SQL's underlying foundation relates more closely to Relational Calculus.

## [[SELECT_Operation]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** What is the primary purpose of the `SELECT` operation (σ) in Relational Algebra?
### Level 2: Competence (Application)
8.  **The Clean Build:** Using the COMPANY database schema (EMPLOYEE table with attributes like `Fname`, `Lname`, `Salary`, `Dno`, `Sex`), write a Relational Algebra `SELECT` expression to retrieve all male employees who earn more than $50,000.
### Level 3: Mastery (The Crucible)
9.  **The Broken System:** You are given the Relational Algebra expression: `σ Dno=5 (σ Salary>40000 (EMPLOYEE))`. A developer mistakenly argues that changing this to `σ Salary>40000 (σ Dno=5 (EMPLOYEE))` might lead to different results or an error. Explain why this assertion is incorrect by referencing a key property of the `SELECT` operation.

## [[PROJECT_Operation]]
### Level 1: Understanding (The Basics)
10. **The Component Check:** What is the fundamental effect of the `PROJECT` operation (π) on a relation's schema and its tuples?
### Level 2: Competence (Application)
11. **The Clean Build:** Using the COMPANY database (EMPLOYEE table), write a Relational Algebra `PROJECT` expression to retrieve the `Fname` and `Lname` of all employees.
### Level 3: Mastery (The Crucible)
12. **The Impossible Case:** Consider an `EMPLOYEE` table with `(Fname, Lname, Ssn)` where `Ssn` is the primary key. If you apply `π Fname, Lname (EMPLOYEE)`, is it possible for the result to have fewer tuples than the original `EMPLOYEE` table? Justify your answer based on the properties of the `PROJECT` operation.

## [[RENAME_Operation]]
### Level 1: Understanding (The Basics)
13. **The Component Check:** What is the primary function of the `RENAME` operation (ρ) in Relational Algebra?
### Level 2: Competence (Application)
14. **The Clean Build:** You have a relation `EMPLOYEE_SALARIES` with attributes `(Employee_ID, Monthly_Salary)`. Write a `RENAME` operation that renames the relation to `EMP_PAY` and the attributes to `ID` and `Salary`.
### Level 3: Mastery (The Crucible)
15. **The Broken System:** A complex query involves joining `EMPLOYEE` with `DEPARTMENT` and then `PROJECTING` certain attributes. During this process, an intermediate relation `TEMP_EMP_DEPT` is created. If you need to rename attributes within `TEMP_EMP_DEPT` for clarity, but accidentally use a `RENAME` operation that only changes the relation name to `FINAL_RESULT` without specifying new attribute names, what would be the impact on the attributes of `FINAL_RESULT`?

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: University Course Management
**The Setup:** A university database has two relations:
*   `STUDENTS` (<u>StudentID</u>, StudentName, Major, EnrolledYear)
*   `COURSES_TAKEN` (<u>StudentID</u>, <u>CourseID</u>, Grade)

**The Constraints:**
*   You must identify students who have taken *all* courses offered by the 'Computer Science' department.
*   You cannot directly access a `COURSES` table to list all CS courses; you must derive this information from existing student enrollments.

**The Challenge:**
(a) Design a Relational Algebra expression that identifies the `StudentID` and `StudentName` of all students who have taken *every* 'Computer Science' course that *any* student has ever enrolled in.
(b) Explain the step-by-step logic of your Relational Algebra expression, detailing what each operation achieves and why it's necessary.
(c) Discuss the challenges or limitations of using this derived approach versus having a dedicated `COURSES` table.

---