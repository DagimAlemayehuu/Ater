---
title: "Mapping_Attributes_To_Relations"
type: "Core"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "4 Logical Database Design"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.037764"
last_edited_time: "2026-04-16T13:47:45.037765"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master Attribute_Types and Relational_Columns.
Mapping attributes to relations is the process of converting the descriptive properties of entities (attributes from the E-R model) into columns within the corresponding relational tables. This step requires careful consideration of the attribute's type (simple, composite, multi-valued, derived, stored) to ensure data atomicity and avoid redundancy. Each attribute is designated as a column, but composite and multi-valued attributes require special handling to maintain the integrity of the relational model. Think of it as detailing the specific data points that will be stored within each table, ensuring each piece of information has its own, appropriate slot.

# The Mental Model
Imagine you're cataloging books in a library. Each book has properties (`Attributes`) like `Title`, `Author`, `Publication_Date`, and `Keywords`. Mapping these to a relation (`Table`) means that for a `BOOK` table, `Title` would be a simple column. `Author` might be a `composite attribute` (First Name, Last Name), so it breaks down into two columns. `Keywords` might be `multi-valued` (many keywords per book), so it gets its own separate table. This process ensures that each piece of information fits neatly into the structured rows and columns of your database.

```mermaid
graph TD
    A[Attribute] --> B{Relational_Column}
    subgraph Attribute Mapping Checklist
        ("1. Identify each attribute type for an entity.") --> step2
        step2("2. For simple, single-valued attributes: Directly add as a column.") --> step3
        step3("3. For composite attributes: Decompose into constituent simple attributes, each becoming a column.") --> step4
        step4("4. For multi-valued attributes: Create a new separate relation.") --> step5
        step5("5. In the new relation for multi-valued attributes, include the primary key of the original entity as a foreign key.") --> step6
        step6("6. The primary key of the new relation will be the original entity's primary key combined with the multi-valued attribute.")
    end
    A --- step1
```
*Note: This `graph TD` diagram presents a "Pilot's Checklist" for mapping various attribute types to relational columns or new relations. It outlines the specific steps for handling simple, composite, and multi-valued attributes during the E-R to relational translation.*

# Context & Framework
### System Architecture & Dependencies
The precise mapping of attributes directly influences the granularity and structure of data within each relation. Simple attributes directly populate columns, forming the basic data points. Composite attributes necessitate a decomposition into their atomic components, ensuring that each column holds a single, indivisible value. Multi-valued attributes, being incompatible with the single-value-per-cell rule of relational tables, require the creation of a new, separate relation. This new relation becomes dependent on the original entity's primary key for identification, establishing a clear architectural dependency within the schema.

# The Mastery Deep Dive
### The "Pilot's Checklist" (Do Not Skip)
Mapping attributes is a critical step to ensure that the relational model adheres to atomicity and avoids repeating groups.
- [ ] **Simple Attributes:** These are the easiest. Directly add each simple, single-valued attribute as a column in the relation that corresponds to its entity. For example, `Name`, `Age`, `Salary`.
- [ ] **Composite Attributes:** An attribute composed of several other attributes (e.g., `Address` composed of `Street`, `City`, `PostalCode`). The composite attribute itself is ignored. Instead, each of its constituent simple attributes becomes a separate column in the relation. For example, `Address` becomes `Street`, `City`, `PostalCode` columns.
- [ ] **Multi-valued Attributes:** An attribute that can hold multiple values for a single entity instance (e.g., `Phone_Number` for an `EMPLOYEE`). These cannot be directly mapped as a single column.
    - [ ] Create a **new, separate relation** for the multi-valued attribute.
    - [ ] This new relation will have two columns:
        1.  The primary key of the original entity (as a foreign key).
        2.  The multi-valued attribute itself.
    - [ ] The primary key of this new relation will be the composite of these two columns.
        *Example*: `EMPLOYEE(EmployeeID, Name)` has multi-valued `Phone_Number`. Create `EMPLOYEE_PHONE(EmployeeID, PhoneNumber)`. `(EmployeeID, PhoneNumber)` is the PK of `EMPLOYEE_PHONE`, `EmployeeID` is FK to `EMPLOYEE`.
- [ ] **Derived Attributes:** Attributes whose values can be calculated from other attributes (e.g., `Age` from `DateOfBirth`). These are typically **not** stored as columns to avoid redundancy, but can be generated when needed.
- [ ] **Stored Attributes:** Attributes that are explicitly maintained (opposite of derived). These become regular columns.

### Opening the Hood: What's Inside?
When dissecting an entity's attributes for mapping, we essentially "open the hood" to see how each property functions. A simple attribute like `ProductName` is a self-contained unit, directly translating to a `ProductName` column. A `CustomerAddress` (composite) requires breaking it down into `Street`, `City`, `ZipCode` columns to respect atomicity. A `CoursePrerequisites` (multi-valued) cannot fit into a single cell, so it spawns a new table (`COURSE_PREREQ`) to hold each prerequisite as a separate entry, linked back to the original `COURSE` by its ID. This granular approach ensures no information is lost and all data is structured correctly for the relational model.

# Constraints & Limitations
### The Engineering Trade-off
The critical engineering trade-off in attribute mapping concerns multi-valued attributes. While creating a separate table for each multi-valued attribute (as prescribed by normalization principles) ensures atomicity and avoids redundancy, it can lead to an increased number of tables and potentially more joins in complex queries. This might sometimes be perceived as a performance overhead. The decision to strictly normalize or to use a less normalized approach (e.g., storing comma-separated values, though generally discouraged) involves balancing data integrity and design purity against perceived query simplicity or performance in specific contexts.

# Significance & Application
Accurate attribute mapping is fundamental for achieving a well-structured and normalized database. It directly impacts data integrity, prevents update anomalies, and ensures efficient data storage. In education, it's a core concept in database design courses. In industry, developers and database administrators rely on these rules to build robust systems where data is consistently stored, easily queryable, and free from internal contradictions, forming the basis for reliable applications.

# The Worked Example
Let's map attributes for an `EMPLOYEE` entity:
*   `EmployeeID` (Simple, PK)
*   `FullName` (Composite: `FirstName`, `LastName`)
*   `SkillSet` (Multi-valued: e.g., 'Java', 'SQL', 'Python')
*   `DateOfBirth` (Simple, Stored)
*   `Age` (Derived from `DateOfBirth`)

**Mapping Steps:**

1.  **`EmployeeID`**: Becomes `EmployeeID` column, designated as Primary Key.
2.  **`FullName`**: Ignored. Its components `FirstName` and `LastName` become separate columns.
3.  **`SkillSet`**: Requires a new relation.
    *   Create `EMPLOYEE_SKILLS` relation.
    *   Columns: `EmployeeID` (FK to `EMPLOYEE`) and `Skill`.
    *   Primary Key: `(EmployeeID, Skill)` (composite).
4.  **`DateOfBirth`**: Becomes `DateOfBirth` column.
5.  **`Age`**: Typically not mapped as a column, as it can be derived from `DateOfBirth`.

**Resulting Relations:**
*   `EMPLOYEE(EmployeeID, FirstName, LastName, DateOfBirth)`
*   `EMPLOYEE_SKILLS(EmployeeID, Skill)`

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Tool Check (Verification)
**The Question:** How are atomic (single-valued) attributes typically mapped to a relation?
> **Solution:** They are directly added as columns in the corresponding relation.

### Level 2: The Routine Run (Mastery & Edge Cases)
**The Scenario:** Given a `BOOK` entity with a composite attribute `Author_Name` (composed of `FirstName` and `LastName`) and a multi-valued attribute `Keywords`, describe the mapping process for these attributes to a relational schema.
> **Solution:**
> 1.  **Composite Attribute (`Author_Name`):** The composite attribute `Author_Name` itself is ignored. Its constituent simple attributes, `FirstName` and `LastName`, are added as separate columns to the `BOOK` relation.
> 2.  **Multi-valued Attribute (`Keywords`):** A new relation, for example, `BOOK_KEYWORDS`, is created. This relation will have two columns: `ISBN` (the primary key of `BOOK`, acting as a foreign key) and `Keyword`. The primary key of `BOOK_KEYWORDS` will be the composite key `(ISBN, Keyword)`.

### Level 3: The Disaster Drill (Mastery & Edge Cases)
**The Scenario:** During attribute mapping, a multi-valued attribute `Phone_Number` for an `EMPLOYEE` entity was simply added as a new column in the `EMPLOYEE` relation. Explain the immediate data integrity and redundancy issues this creates and outline the correct mapping procedure to fix it.
> **Solution:**
> **Issues Created:**
> 1.  **Atomicity Violation:** A single column `Phone_Number` would have to store multiple values (e.g., "123-4567; 890-1234"), violating the first normal form (1NF) rule that each column should hold a single, atomic value.
> 2.  **Redundancy:** If an employee has multiple phone numbers, you might have to create multiple rows for the same employee, duplicating other employee information (e.g., `EmployeeName`, `Address`) for each phone number.
> 3.  **Querying Difficulty:** Retrieving, updating, or deleting specific phone numbers would be complex, requiring string parsing.
>
> **Correct Mapping Procedure to Fix It:**
> 1.  Create a **new relation**, for example, `EMPLOYEE_PHONE`.
> 2.  This new relation will contain two columns: `EmployeeID` (the primary key of the `EMPLOYEE` entity, acting as a foreign key) and `PhoneNumber`.
> 3.  The **primary key** of the `EMPLOYEE_PHONE` relation will be the composite key `(EmployeeID, PhoneNumber)`. This ensures each phone number is uniquely associated with an employee without redundancy in the `EMPLOYEE` table.

# Key Takeaways
*   Simple attributes map directly to columns.
*   Composite attributes are decomposed into their constituent simple attributes, each becoming a separate column.
*   Multi-valued attributes require the creation of a new, separate relation with a composite primary key formed by the original entity's primary key and the multi-valued attribute.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                                 |
| :
-------------------------- | :
---------------------------------------------------------------------------------------------------------------------- |
| [[Translating_E_R_to_Logical_Model]] | This is a fundamental component of the overall E-R to logical model translation process.                                                |
| Attribute_Types         | Understanding different attribute types is crucial for applying the correct mapping rules.                                |
| Relational_Columns      | Columns are the direct output of mapping attributes into the relational model.                                            |
| [[First_Normal_Form_1NF]]   | Correct attribute mapping, especially for multi-valued attributes, helps achieve 1NF by ensuring atomicity.               |
| Primary_Keys            | Involved in forming the composite primary key for relations created from multi-valued attributes.                         |
---