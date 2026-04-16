---
title: "CS1241_4_Logical_Database_Design_Possible_Questions"
type: "Questions"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "4 Logical Database Design"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.034793"
last_edited_time: "2026-04-16T13:47:45.034794"
last_edited_by: "LifeOs AI Agent"
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Translating_E_R_to_Logical_Model]]
### Level 1: Understanding (The Basics)
1.  **The Component Check:** What are the three basic rules for translating an E-R model into a logical data model as outlined in the lecture?
### Level 2: Competence (Application)
2.  **The Clean Build:** Imagine an E-R model with an entity `STUDENT` (attributes: `StudentID`, `Name`, `Address`) and a `COURSE` entity (attributes: `CourseID`, `Title`). How would you translate these into relations, specifically noting the primary keys and column names?
### Level 3: Mastery (The Broken System)
3.  **The Broken System:** You are given a partially translated logical model from an E-R diagram. The `STUDENT_ADDRESS` relation contains `StudentID`, `Street`, `City`, `PostalCode`, and `AddressID` as the primary key. If `Address` was a composite attribute in the E-R model with `Street`, `City`, and `PostalCode` as its components, identify the flaw in this translation and propose a correction.

## [[Mapping_Entities_to_Relations]]
### Level 1: Understanding (The Basics)
4.  **The Tool Check:** When mapping an entity from a conceptual E-R model to a logical data model, what is the direct equivalent in the relational model?
### Level 2: Competence (Application)
5.  **The Routine Run:** List the key steps involved in mapping a strong entity `DEPARTMENT` (with attributes `DepartmentID`, `DepartmentName`) to a relation, ensuring its primary key is correctly identified.
### Level 3: Mastery (The Disaster Drill)
6.  **The Disaster Drill:** A database designer forgot to assign a primary key during the mapping of the `PRODUCT` entity, instead only listing `ProductName` and `Description` as attributes. What immediate issues would arise if this design were implemented, and what is the crucial recovery step?

## [[Mapping_Attributes_to_Relations]]
### Level 1: Understanding (The Basics)
7.  **The Tool Check:** How are atomic (single-valued) attributes typically mapped to a relation?
### Level 2: Competence (Application)
8.  **The Routine Run:** Given a `BOOK` entity with a composite attribute `Author_Name` (composed of `FirstName` and `LastName`) and a multi-valued attribute `Keywords`, describe the mapping process for these attributes to a relational schema.
### Level 3: Mastery (The Disaster Drill)
9.  **The Disaster Drill:** During attribute mapping, a multi-valued attribute `Phone_Number` for an `EMPLOYEE` entity was simply added as a new column in the `EMPLOYEE` relation. Explain the immediate data integrity and redundancy issues this creates and outline the correct mapping procedure to fix it.

## [[Mapping_Relationships_to_Relations]]
### Level 1: Understanding (The Basics)
10. **The Tool Check:** What general principle guides the mapping of relationships between entities to relations in a logical data model?
### Level 2: Competence (Application)
11. **The Routine Run:** Outline the primary steps for mapping a 1:M (one-to-many) relationship named `WORKS_FOR` between `DEPARTMENT` (one side) and `EMPLOYEE` (many side). Include how primary and foreign keys are handled.
### Level 3: Mastery (The Disaster Drill)
12. **The Disaster Drill:** A database for a university mistakenly mapped a M:M (many-to-many) relationship between `STUDENT` and `COURSE` by simply posting the primary key of `STUDENT` into the `COURSE` relation. Describe why this is incorrect and what the correct mapping strategy should be, assuming the relationship itself has an attribute `Grade`.

## [[One_to_One_Binary_Relationships]]
### Level 1: Understanding (The Basics)
13. **The Tool Check:** What is the primary factor used to decide how to map a 1:1 binary relationship to relations?
### Level 2: Competence (Application)
14. **The Routine Run:** Describe the mapping strategy for a 1:1 relationship between `MANAGER` and `DEPARTMENT` where `MANAGER` has optional participation and `DEPARTMENT` has mandatory participation in the relationship.
### Level 3: Mastery (The Disaster Drill)
15. **The Disaster Drill:** Two entities, `EMPLOYEE` and `COMPANY_CAR`, have a 1:1 relationship with optional participation on both sides. A designer combined them into one relation `EMPLOYEE_CAR` with `EmployeeID` as PK and `CarID` as an alternate key. Explain why this might not be the most flexible solution and suggest an alternative mapping.

## [[One_to_Many_Binary_Relationships]]
### Level 1: Understanding (The Basics)
16. **The Tool Check:** Which entity in a 1:M relationship is designated as the 'parent entity'?
### Level 2: Competence (Application)
17. **The Routine Run:** Consider a 1:M relationship where `PUBLISHER` is on the 'one side' and `BOOK` is on the 'many side'. Detail the steps to map this relationship to relations, including where the foreign key will reside.
### Level 3: Mastery (The Disaster Drill)
18. **The Disaster Drill:** A `CUSTOMER` (one side) and `ORDER` (many side) relationship was mapped, but the `customerID` was added to the `CUSTOMER` table as a foreign key referencing the `ORDER` table. Explain the fundamental error and correct the mapping.

## [[Many_to_Many_Binary_Relationships]]
### Level 1: Understanding (The Basics)
19. **The Tool Check:** What is the standard approach for representing an M:M binary relationship in a relational schema?
### Level 2: Competence (Application)
20. **The Routine Run:** Given an M:M relationship between `STUDENT` and `PROJECT` with a relationship attribute `Role`, describe how you would map this to relations, including the primary key of the new relationship table.
### Level 3: Mastery (The Disaster Drill)
21. **The Disaster Drill:** A database tracks `AUTHOR`s and `BOOK`s with an M:M relationship. A junior designer created a new `AUTHOR_BOOK` table but made `AuthorID` its primary key. Explain why this is incorrect and what the correct composite primary key should be.

## [[Weak_Entity_Types]]
### Level 1: Understanding (The Basics)
22. **The Tool Check:** Why is the primary key of a weak entity often dependent on its owner entity?
### Level 2: Competence (Application)
23. **The Routine Run:** Consider a `DEPENDENT` entity that is weak with respect to `EMPLOYEE`. If `DEPENDENT` has attributes `DependentName` and `Relationship`, and `EMPLOYEE` has `EmployeeID` (PK), describe how to form the primary key for the `DEPENDENT` relation.
### Level 3: Mastery (The Disaster Drill)
24. **The Disaster Drill:** A weak entity `ORDER_ITEM` (attributes: `ItemNumber`, `Quantity`) is owned by `ORDER` (attributes: `OrderID`, `OrderDate`). A mapping was done such that `ORDER_ITEM`'s primary key is just `ItemNumber`. Explain why this creates an issue and how to correctly define the primary key.

## [[Recursive_Relationships]]
### Level 1: Understanding (The Basics)
25. **The Tool Check:** What is a recursive relationship in the context of an E-R model?
### Level 2: Competence (Application)
26. **The Routine Run:** Describe two different ways to represent a 1:1 recursive relationship where `EMPLOYEE` 'manages' `EMPLOYEE`, considering optional participation on both sides.
### Level 3: Mastery (The Disaster Drill)
27. **The Disaster Drill:** A 1:M recursive relationship `SUPERVISES` exists on the `EMPLOYEE` entity. A designer created a `SUPERVISOR` table and linked it back to `EMPLOYEE` with a foreign key. Identify the flaw and explain the simpler, more effective mapping strategy.

## [[Superclass_Subclass_Relationships]]
### Level 1: Understanding (The Basics)
28. **The Tool Check:** What are superclass/subclass relationships, and why are they complex to map to relations?
### Level 2: Competence (Application)
29. **The Routine Run:** Outline one common option for representing a superclass `PERSON` with subclasses `STUDENT` and `FACULTY` in a relational schema, assuming disjoint and mandatory participation.
### Level 3: Mastery (The Disaster Drill)
30. **The Disaster Drill:** A superclass `VEHICLE` has subclasses `CAR` and `TRUCK`. A designer decided to create separate tables for `CAR` and `TRUCK`, each duplicating common `VEHICLE` attributes like `VIN` and `Manufacturer`. Explain the potential redundancy and a better approach for this scenario.

## [[Normalization_in_Database_Design]]
### Level 1: Understanding (The Basics)
31. **The Fact Check:** What is the primary purpose of normalization in database design?
### Level 2: Competence (Application)
32. **The Trade-off:** Explain two distinct benefits of a well-normalized database design in terms of data management.
### Level 3: Mastery (The Lose-Lose Scenario)
33. **The Lose-Lose Scenario:** A project manager insists on a completely unnormalized database for a new application, arguing it simplifies development and speeds up reads. As a database designer, how would you counter this argument by highlighting the long-term "lose-lose" consequences, balancing development ease with data integrity and maintenance costs?

## [[Data_Redundancy_and_Update_Anomalies]]
### Level 1: Understanding (The Basics)
34. **The Fact Check:** Define data redundancy in the context of relational databases.
### Level 2: Competence (Application)
35. **The Trade-off:** Describe the three main types of update anomalies (insertion, deletion, modification) and provide a small example for each that illustrates the problem.
### Level 3: Mastery (The Lose-Lose Scenario)
36. **The Lose-Lose Scenario:** Your team has inherited an existing database with significant data redundancy. The lead developer suggests ignoring it to meet a tight deadline for a new feature. Explain how proceeding with this redundancy could lead to a "lose-lose" situation for future development and data reliability.

## [[Lossless_Join_and_Dependency_Preservation]]
### Level 1: Understanding (The Basics)
37. **The Variable ID:** Briefly explain the "lossless-join property" in database decomposition.
### Level 2: Competence (Application)
38. **The Standard Solver:** Why are both the lossless-join property and the dependency preservation property considered crucial when decomposing a relation during normalization?
### Level 3: Mastery (The Impossible Case)
39. **The Impossible Case:** You are given a relation `R(A, B, C)` with functional dependencies `A → B` and `B → C`. If you decompose `R` into `R1(A, B)` and `R2(A, C)`, would this decomposition be dependency-preserving? Justify your answer.

## [[Functional_Dependencies]]
### Level 1: Understanding (The Basics)
40. **The Variable ID:** Define functional dependency, denoted `A → B`.
### Level 2: Competence (Application)
41. **The Standard Solver:** Given a `STUDENT_COURSE` relation with attributes `StudentID`, `CourseID`, `StudentName`, `CourseTitle`, and `InstructorName`. If `StudentID` determines `StudentName`, and `CourseID` determines `CourseTitle`, `InstructorName`, identify the functional dependencies present.
### Level 3: Mastery (The Impossible Case)
42. **The Impossible Case:** Consider a relation `PRODUCT_SALE` with attributes `ProductID`, `SaleDate`, `CustomerID`, `CustomerName`. If `ProductID` and `SaleDate` together determine `CustomerID`, and `CustomerID` determines `CustomerName`, identify a transitive dependency that exists.

## [[Characteristics_of_Functional_Dependencies]]
### Level 1: Understanding (The Basics)
43. **The Fact Check:** What does "full functional dependency" imply about the determinant of a functional dependency?
### Level 2: Competence (Application)
44. **The Sort:** Distinguish between a partial functional dependency and a full functional dependency using a clear example for each.
### Level 3: Mastery (The Impostor)
45. **The Impostor:** You are analyzing a relation `ORDER_ITEM(OrderID, ItemID, OrderDate, ItemName, Price)`. A colleague claims that `OrderID, ItemID → Price` is a full functional dependency. Identify if this is a "False Friend" statement and explain why, considering that `ItemID` alone determines `ItemName` and `Price`.

## [[Transitive_Dependencies]]
### Level 1: Understanding (The Basics)
46. **The Fact Check:** Define a transitive dependency involving attributes A, B, and C.
### Level 2: Competence (Application)
47. **The Sort:** In a `STAFF_BRANCH` relation with attributes `StaffID`, `StaffName`, `BranchNo`, `BranchAddress`, `BranchNo → BranchAddress` and `StaffID → BranchNo`. Identify the transitive dependency.
### Level 3: Mastery (The Impostor)
48. **The Impostor:** Consider a relation `FLIGHT_DETAIL(FlightNo, DepartureCity, ArrivalCity, DepartureTime)`. A student states that `DepartureCity → DepartureTime` is a transitive dependency via `FlightNo → DepartureCity`. Identify if this statement is a "False Friend" and explain why, given that `DepartureCity` does not uniquely determine `DepartureTime` independently.

## [[Unnormalized_Form_UNF]]
### Level 1: Understanding (The Basics)
49. **The Neighbor Check:** What characteristic defines an unnormalized form (UNF) table?
### Level 2: Competence (Application)
50. **The Sort:** You have a form for `CUSTOMER_ORDER` that lists `CustomerID`, `CustomerName`, and then for each order, `OrderID`, `OrderDate`, and repeating `ProductID`, `ProductName`, `Quantity`. Represent this information in an unnormalized table structure.
### Level 3: Mastery (The Impostor)
51. **The Impostor:** A table contains `CourseID`, `CourseName`, and `StudentNames` (a comma-separated list of names). Is this table in UNF, and if so, what is the 'repeating group'?

## [[First_Normal_Form_1NF]]
### Level 1: Understanding (The Basics)
52. **The Tool Check:** What is the defining rule for a relation to be in First Normal Form (1NF)?
### Level 2: Competence (Application)
53. **The Routine Run:** Take the `CUSTOMER_ORDER` unnormalized table from question 50. Show the step-by-step process to convert it into 1NF.
### Level 3: Mastery (The Disaster Drill)
54. **The Disaster Drill:** A `PRODUCT_SUPPLIER` table has `ProductID`, `ProductName`, `SupplierName`, `SupplierAddress` (a composite attribute with `Street`, `City`, `Zip`). This table also has a `SupplierPhoneNumbers` column which contains multiple phone numbers separated by semicolons. Explain two distinct violations of 1NF in this table and describe the exact steps to rectify them.

## [[Second_Normal_Form_2NF]]
### Level 1: Understanding (The Basics)
55. **The Tool Check:** What two conditions must a relation satisfy to be in Second Normal Form (2NF)?
### Level 2: Competence (Application)
56. **The Routine Run:** Consider a 1NF relation `ORDER_DETAILS(OrderID, ProductID, CustomerID, CustomerName, Quantity, Price)`. Assume `OrderID, ProductID` is the primary key. If `CustomerID → CustomerName` and `ProductID → Price`, demonstrate the steps to convert this relation to 2NF.
### Level 3: Mastery (The Disaster Drill)
57. **The Disaster Drill:** A `PROJECT_ASSIGNMENT` table is in 1NF with `(ProjectID, EmployeeID)` as its primary key. It also contains `ProjectName`, `EmployeeName`, and `HourlyRate`. Functional dependencies are `ProjectID → ProjectName` and `EmployeeID → EmployeeName, HourlyRate`. Explain why this table is not in 2NF and precisely outline the decomposition required to achieve 2NF.

## [[Third_Normal_Form_3NF]]
### Level 1: Understanding (The Basics)
58. **The Tool Check:** What three conditions must a relation satisfy to be in Third Normal Form (3NF)?
### Level 2: Competence (Application)
59. **The Routine Run:** Take a 2NF relation `BOOK_PUBLISHER(BookID, Title, PublisherID, PublisherName, PublisherCity)`. Assume `BookID` is the primary key and `PublisherID → PublisherName, PublisherCity`. Demonstrate the steps to convert this relation to 3NF.
### Level 3: Mastery (The Disaster Drill)
60. **The Disaster Drill:** A `COURSE_SCHEDULE` table is in 2NF with `(CourseID, SectionNo)` as its primary key. It includes `CourseName`, `InstructorID`, `InstructorName`, `InstructorOffice`. Functional dependencies are `CourseID → CourseName` and `InstructorID → InstructorName, InstructorOffice`. Explain why this table violates 3NF and detail the decomposition steps to achieve 3NF.

## [[Boyce_Codd_Normal_Form_BCNF]]
### Level 1: Understanding (The Basics)
61. **The Fact Check:** What is the defining rule for a relation to be in Boyce-Codd Normal Form (BCNF)?
### Level 2: Competence (Application)
62. **The Sort:** Explain the key difference between a relation in 3NF and one in BCNF, providing a scenario where a 3NF relation might not be in BCNF.
### Level 3: Mastery (The Impostor)
63. **The Impostor:** You have a `STUDENT_ADVISOR` relation with attributes `StudentID`, `AdvisorID`, `CourseCode`. The candidate keys are `(StudentID, CourseCode)` and `(AdvisorID, CourseCode)`. There's also a dependency `AdvisorID → StudentID`. A colleague states this relation is in 3NF and therefore also in BCNF. Identify if this is a "False Friend" and explain why this 3NF relation is not in BCNF.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Designing a University Course Registration System
**The Setup:** You are tasked with designing a logical database for a simplified university course registration system. You need to manage students, courses, instructors, and registrations.
**Initial E-R Considerations:**
*   `STUDENT` (StudentID, StudentName, Major, DateOfBirth)
*   `COURSE` (CourseID, CourseName, Credits, Department)
*   `INSTRUCTOR` (InstructorID, InstructorName, OfficeNumber)
*   `REGISTRATION` (StudentID, CourseID, Semester, Grade) - This is a many-to-many relationship between STUDENT and COURSE, with additional attributes.
*   A `SECTION` of a `COURSE` is taught by an `INSTRUCTOR`. One instructor can teach multiple sections, but a section is taught by only one instructor.
**The Constraints:**
*   You must minimize data redundancy as much as possible, aiming for at least 3NF for all relations.
*   You need to handle composite and multi-valued attributes if you decide to introduce them.
*   The system must easily retrieve all courses a student is registered for, and all students registered in a particular course section.
**The Challenge:**
(a)  Derive a complete set of normalized relations (up to 3NF) for this scenario, clearly identifying primary and foreign keys for each relation.
(b)  Justify the normalization steps you took from an assumed Unnormalized Form (UNF) through 1NF, 2NF, and 3NF for at least one of your derived relations, specifically explaining how you addressed partial and transitive dependencies.
(c)  Identify one potential update anomaly that could occur if you *only* achieved 1NF for your `REGISTRATION` related tables and explain which type of anomaly it is.