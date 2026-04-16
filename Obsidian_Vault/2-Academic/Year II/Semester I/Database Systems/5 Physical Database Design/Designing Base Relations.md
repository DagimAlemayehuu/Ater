---
title: "Designing_Base_Relations"
type: "Core"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "5 Physical Database Design"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.028814"
last_edited_time: "2026-04-16T13:47:45.028815"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Relational_Data_Model]] and Data_Types_And_Domains because `Designing_Base_Relations` fundamentally involves defining tables and their attributes according to these principles.
`Designing_Base_Relations` is the process of deciding how to represent the core tables (relations) identified in the logical data model within the specific target Database Management System (DBMS). For each relation, this involves defining its name, a list of simple attributes (columns) with their data types, lengths, and nullability, as well as specifying primary keys (PKs), alternate keys (AKs), foreign keys (FKs), and their associated referential integrity constraints. A simpler way to think about it is meticulously crafting the foundational building blocks of your database, defining each table's structure down to every column and its rules.

# The Mental Model
Imagine you're organizing a large, complex filing cabinet system. `Designing_Base_Relations` is like setting up each individual folder (relation/table) in that cabinet. For each folder, you decide its exact name, what type of information each paperclip will hold (attributes), whether certain papers are mandatory (NOT NULL), which paper is the unique identifier for the folder (PK), and how folders relate to each other (FKs) for cross-referencing. It's about ensuring every piece of information has its proper, well-defined place.

# Context & Framework
### System Architecture & Dependencies
`Designing_Base_Relations` is a foundational step within the `Translating_Logical_Data_Model_for_DBMS` phase. It takes the output of the `Logical_Database_Design` (the normalized relational schema) and translates it into the concrete `CREATE TABLE` statements for the `DBMS_Implementation`. The decisions made here directly impact `Data_Integrity` through the definition of keys and constraints, and they lay the groundwork for `Performance_Optimization` by establishing the columns upon which `file organizations` and `indexes` will later be built. This process is essentially constructing the schema that the DBMS will use to store and manage data.

# The Mastery Deep Dive
### Opening the Hood: Constructing the Fundamental Tables
When `Designing_Base_Relations`, the goal is to define each table with precision, ensuring it accurately reflects the logical model and the capabilities of the target DBMS. For each relation, several critical elements must be defined:
*   **Relation Name:** The chosen name should be clear, concise, and adhere to naming conventions.
*   **Attributes (Columns):** A list of simple attributes, typically enclosed in brackets in a conceptual representation. Each attribute needs:
    *   **Domain:** This includes the `data type` (e.g., `INT`, `VARCHAR(255)`, `DATE`), `length` (where applicable), and any specific `constraints on the domain` (e.g., allowed ranges, formats).
    *   **Nullability:** Whether the attribute `can hold nulls` (`NULL` or `NOT NULL`), indicating if a value is optional or mandatory.
    *   **Default Value:** An `optional default value` for the attribute, which the DBMS will automatically assign if no value is explicitly provided during insertion.
    *   **Derived Status:** Whether the attribute is `derived`, and if so, how it `should be computed`. (This leads into the `Designing_Derived_Data_Representation` phase).
*   **Primary Keys (PKs), Alternate Keys (AKs), and Foreign Keys (FKs):** Define which attributes (or combinations of attributes) serve as unique identifiers for the relation and which link to other relations.
*   **Referential Integrity Constraints:** For all `FKs identified`, precise `referential integrity constraints` must be specified (e.g., `ON UPDATE CASCADE`, `ON DELETE SET NULL`, `ON DELETE RESTRICT`) to manage how changes in the referenced parent table affect the child table. This meticulous definition ensures the structural integrity and semantic correctness of the database.

# Constraints & Limitations
### The Engineering Trade-off: Simplicity vs. Granularity
A key trade-off in `Designing_Base_Relations` lies between striving for simplicity and achieving sufficient granularity. Over-simplifying attribute definitions (e.g., using generic `VARCHAR` for everything) can lead to a loss of `Data_Integrity` and make `data validation` more difficult later. Conversely, excessive granularity (e.g., defining highly restrictive domains for every minor attribute) can increase the complexity of the DDL and make the schema harder to maintain or adapt to future requirements. The challenge is to define attributes with enough detail to enforce necessary business rules and optimize storage, without creating an overly rigid or cumbersome schema. Additionally, the specific features of the chosen DBMS (e.g., advanced data types, custom domain support) can impose limitations or offer opportunities for greater precision.

# Significance & Application
`Designing_Base_Relations` is fundamental because it establishes the concrete, persistent structure of the data within the database. Academically, it demonstrates the practical application of relational theory and data modeling principles. In real-world scenarios, it ensures that:
*   **Data is Stored Correctly:** Each piece of information has a defined type, length, and constraints, preventing garbage-in/garbage-out scenarios.
*   **Data Integrity is Maintained:** PKs, AKs, and FKs, along with referential integrity rules, enforce the relationships and uniqueness required by the business logic.
*   **Queries are Efficient:** Well-defined attributes with appropriate data types form the basis for efficient `indexing` and `file organizations`, contributing significantly to overall `Performance_Optimization`.
*   **Development is Streamlined:** A clear and well-defined schema reduces ambiguity for application developers, speeding up the development process. Any flaw here can cascade into significant problems during development and operation.

# The Worked Example
### Example: DBDL for a PropertyForRent Relation
Consider the `PropertyForRent` relation from a real estate database. We need to define its attributes, keys, and constraints.

**Attributes and Domains:**
*   `propertyNo`: Variable length character string, length 5 (e.g., 'PA14'). Not null. PRIMARY KEY.
*   `street`: Variable length character string, length 25. Not null.
*   `city`: Variable length character string, length 15. Not null.
*   `postcode`: Variable length character string, length 8.
*   `type`: Single character, must be one of 'B', 'C', 'D', 'E', 'F', 'H', 'M', 'S'. Not null, default 'F'.
*   `rooms`: Integer, in the range 1-15. Not null, default 4.
*   `rent`: Monetary value, in the range 0.00-9999.99. Not null, default 600.
*   `ownerNo`: Variable length character string, length 5. Not null. FOREIGN KEY (references `PrivateOwner` and `BusinessOwner`).
*   `staffNo`: Variable length character string, length 5. Not null. FOREIGN KEY (references `Staff`).
*   `branchNo`: Fixed length character string, length 4. Not null. FOREIGN KEY (references `Branch`).

**Referential Integrity Constraints:**
*   `staffNo`: `ON UPDATE CASCADE`, `ON DELETE SET NULL`.
*   `ownerNo`: `ON UPDATE CASCADE`, `ON DELETE NO ACTION`.
*   `branchNo`: `ON UPDATE CASCADE`, `ON DELETE NO ACTION`.

**Translating to SQL DDL (`CREATE TABLE`):**

```sql
CREATE TABLE PropertyForRent (
    propertyNo      VARCHAR(5) PRIMARY KEY,
    street          VARCHAR(25) NOT NULL,
    city            VARCHAR(15) NOT NULL,
    postcode        VARCHAR(8),
    type            CHAR(1) DEFAULT 'F' NOT NULL
                    CHECK (type IN ('B', 'C', 'D', 'E', 'F', 'H', 'M', 'S')),
    rooms           INT DEFAULT 4 NOT NULL
                    CHECK (rooms >= 1 AND rooms <= 15),
    rent            DECIMAL(6, 2) DEFAULT 600.00 NOT NULL
                    CHECK (rent >= 0.00 AND rent <= 9999.99),
    ownerNo         VARCHAR(5) NOT NULL,
    staffNo         VARCHAR(5) NOT NULL,
    branchNo        VARCHAR(4) NOT NULL,

    FOREIGN KEY (staffNo) REFERENCES Staff(staffNo)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (ownerNo) REFERENCES PrivateOwner(ownerNo) -- Assuming PrivateOwner and BusinessOwner are merged/handled for FK
        ON UPDATE CASCADE ON DELETE NO ACTION,
    FOREIGN KEY (branchNo) REFERENCES Branch(branchNo)
        ON UPDATE CASCADE ON DELETE NO ACTION
);
```
```text
// Scenario 1: Defining a Real Estate Property Table
// Output:
// The `PropertyForRent` table is created with `propertyNo` as `PRIMARY KEY` (VARCHAR(5)).
// `street`, `city`, `postcode` are defined with their respective VARCHAR lengths.
// `type` is a `CHAR(1)` with a `DEFAULT 'F'`, `NOT NULL`, and a `CHECK` constraint for allowed values.
// `rooms` is an `INT` with `DEFAULT 4`, `NOT NULL`, and a `CHECK` constraint for range 1-15.
// `rent` is a `DECIMAL(6,2)` with `DEFAULT 600.00`, `NOT NULL`, and a `CHECK` constraint for range 0.00-9999.99.
// `ownerNo`, `staffNo`, `branchNo` are defined as `VARCHAR` and `CHAR` respectively, all `NOT NULL`.
// Three `FOREIGN KEY` constraints are defined:
// - `staffNo` references `Staff(staffNo)` with `ON UPDATE CASCADE ON DELETE SET NULL`.
// - `ownerNo` references `PrivateOwner(ownerNo)` with `ON UPDATE CASCADE ON DELETE NO ACTION`.
// - `branchNo` references `Branch(branchNo)` with `ON UPDATE CASCADE ON DELETE NO ACTION`.
```
*Note: The actual implementation for `ownerNo` referencing two parent tables (`PrivateOwner` and `BusinessOwner`) would typically involve a supertype/subtype relationship or careful management in the application layer if the DBMS doesn't directly support multiple parent references for a single FK.*

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What are the four main components that must be defined for each base relation during the design process?
> **Solution:** The four main components are: the name of the relation, a list of simple attributes with their properties (domain, nullability, default values, derived status), primary keys (PKs), alternate keys (AKs), foreign keys (FKs), and their associated referential integrity constraints.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You are designing a `StudentEnrollment` table. The logical model specifies `StudentID` (PK, FK to `Students`), `CourseID` (PK, FK to `Courses`), `EnrollmentDate` (required), and `Grade` (optional, can be 'A', 'B', 'C', 'D', 'F', 'P' for pass, 'NP' for no pass). `EnrollmentDate` should automatically record the date of enrollment if not provided.
**The Constraint:** The DBMS strictly prohibits `ON DELETE CASCADE` for `FOREIGN KEY` constraints on tables with multiple primary key components.
**The Challenge:** Write the SQL `CREATE TABLE` statement for `StudentEnrollment`, ensuring `StudentID` and `CourseID` form a composite `PRIMARY KEY`. Define all attributes with appropriate data types, `NOT NULL` constraints, and default values. Implement referential integrity such that deleting a `Student` or `Course` will *prevent* the deletion if there are existing enrollments (`RESTRICT`). Include a `CHECK` constraint for the `Grade` field.
> **Solution:**
> ```sql
> CREATE TABLE StudentEnrollment (
>     StudentID       INT NOT NULL,
>     CourseID        INT NOT NULL,
>     EnrollmentDate  DATE DEFAULT CURRENT_DATE NOT NULL,
>     Grade           CHAR(2)
>                     CHECK (Grade IN ('A', 'B', 'C', 'D', 'F', 'P', 'NP')),
>     PRIMARY KEY (StudentID, CourseID),
>     FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
>         ON UPDATE CASCADE ON DELETE RESTRICT,
>     FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
>         ON UPDATE CASCADE ON DELETE RESTRICT
> );
> ```

### Level 3: Mastery (The Crucible)
**The Scenario:** A `ProductInventory` table needs to track `ProductID` (PK), `WarehouseID` (PK), `StockQuantity` (required, non-negative), and `LastUpdated` (required, defaults to current timestamp). The `ProductID` refers to a `Products` table, and `WarehouseID` refers to `Warehouses`.
**The Constraint:** The business rule dictates that if a `Product` is deleted, all its entries in `ProductInventory` should also be deleted (`CASCADE`). However, if a `Warehouse` is deleted, its inventory records should have their `WarehouseID` set to a special `NULL` (or a designated 'Unknown' warehouse ID if `NULL` is not desired) because products might still exist in other warehouses.
**The Challenge:** Write the SQL `CREATE TABLE` statement for `ProductInventory` that implements these specific referential integrity actions for both `ProductID` and `WarehouseID`. Ensure `StockQuantity` is non-negative and `LastUpdated` defaults to the current timestamp.
> **Solution:**
> ```sql
> CREATE TABLE ProductInventory (
>     ProductID       INT NOT NULL,
>     WarehouseID     INT NOT NULL,
>     StockQuantity   INT DEFAULT 0 NOT NULL
>                     CHECK (StockQuantity >= 0),
>     LastUpdated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
>     PRIMARY KEY (ProductID, WarehouseID),
>     FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
>         ON UPDATE CASCADE ON DELETE CASCADE, -- If product deleted, delete inventory records
>     FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID)
>         ON UPDATE CASCADE ON DELETE SET NULL -- If warehouse deleted, set WarehouseID to NULL
> );
> ```
> *Note:* If `WarehouseID` could not be `NULL` due to a `NOT NULL` constraint, then `ON DELETE SET NULL` would not be allowed. In that case, an `ON DELETE SET DEFAULT` or `ON DELETE NO ACTION` coupled with application logic to reassign items to an 'Unknown' warehouse would be necessary.

# Key Takeaways
*   `Designing_Base_Relations` defines the name, attributes (with `data types`, `lengths`, `nullability`, `defaults`), and `keys` for each table.
*   It includes specifying `primary`, `alternate`, and `foreign keys`, along with their `referential integrity constraints`.
*   This process ensures `data integrity` and provides the structural foundation for `performance optimization` and efficient `DBMS` operation.

# Knowledge Graph Connections
| Concept                            | Connection / Relationship                                                                                      |
| :
--------------------------------- | :
------------------------------------------------------------------------------------------------------------- |
| [[Relational_Data_Model]]          | Base relations are the fundamental building blocks of the relational data model.                                 |
| Data_Types_And_Domains         | Each attribute in a base relation is assigned a specific data type and conforms to a defined domain.           |
| [[Primary_Key]]                    | Uniquely identifies each tuple (row) within a base relation, crucial for entity integrity.                     |
| Foreign_Key                    | Links a base relation to another, enforcing referential integrity and establishing relationships.              |
| [[Referential_Integrity_Constraints]] | Rules applied to foreign keys to manage consistency when related data is updated or deleted.                   |
| Data_Definition_Language       | SQL DDL statements (like CREATE TABLE) are used to physically define base relations in the DBMS.               |
---