---

title: Constraint_Definition
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '6'
hub: "[[6_Database_Design_Hub]]"
source: "[[Chapter_6.pdf]]"
source_pages:
- 5
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Create_Table]]"

---

# 1. Mental Model

A constraint definition in a relational database can be thought of as a set of rules that are akin to a quality control checklist in a manufacturing process. Just as a quality control checklist ensures that each product meets certain standards, a constraint definition ensures that each piece of data entered into a table meets specific criteria. For example, a "NOT NULL" constraint is like a requirement that every product must have a product description, ensuring that no product is entered without this essential information.

# 2. Schema & Query Mechanics

A [[Constraint_Definition]] is a crucial aspect of [[Table_Definition]] in SQL, used to specify rules for the data in a [[Table_Definition]]. When creating a table using [[Create_Table]], you can define various constraints, such as [[Constraint_Definition|not_Null]], [[Constraint_Definition|primary_Key]], and [[Constraint_Definition|foreign_Key]], to ensure data consistency and integrity. The [[Data_Definition_Language|ddl]] is used to define and modify these constraints. For instance, you can use [[Alter_Table]] to add or modify a constraint after a table has been created. Additionally, [[Constraint_Definition|check]] constraints can be used to limit the range of values that can be entered for a particular attribute.

# 3. ACID Violations & Scaling Limits

When a [[Constraint_Definition]] is violated, it can lead to [[Acid]] violations, particularly affecting the consistency and integrity of the database. For example, if a [[Constraint_Definition|not_Null]] constraint is not properly enforced, it can result in null values being entered into a column, potentially causing inconsistencies in the data. As the database scales, the failure to enforce constraints can lead to increased errors and decreased data reliability. In a distributed database system, ensuring that constraints are properly enforced across all nodes is crucial to maintaining data consistency and preventing [[Acid]] violations. 

| Constraint Type | Description | Effect on Data |
| --- | --- | --- |
| NOT NULL | Ensures a column cannot have a NULL value | Prevents null values |
| PRIMARY KEY | Uniquely identifies each record in a table | Ensures data uniqueness |
| FOREIGN KEY | Ensures referential integrity between tables | Maintains relationships |
| CHECK | Ensures data meets a specific condition | Limits data range |

## 4. Entity-Relationship Model

```mermaid

erDiagram
    AIRCRAFT ||--o{ AVIONIC_SYSTEM : has
    AVIONIC_SYSTEM }|..|> SENSOR : uses
    SENSOR ||--o{ READING : generates

```

In this Mermaid `erDiagram`, the entities and their relationships are represented as follows: 
- `AIRCRAFT`, `AVIONIC_SYSTEM`, `SENSOR`, and `READING` are entities.
- `AIRCRAFT` has multiple `AVIONIC_SYSTEM`s (1:N), represented by `||--o{`.
- `AVIONIC_SYSTEM` uses one or more `SENSOR`s (M:N, but here simplified to 1:N for clarity), represented by `}|..|>`.
- `SENSOR` generates multiple `READING`s (1:N), represented by `||--o{`.

## 5. Walkthrough

Here are the steps to understand and apply constraint definition in the context of Aerospace Engineering & Avionics:

1. **Define Entity Relationships**: Identify the entities involved in the aerospace engineering domain, such as `AIRCRAFT`, `AVIONIC_SYSTEM`, `SENSOR`, and `READING`. Establish their relationships, e.g., an aircraft has multiple avionics systems.

2. **Apply NOT NULL Constraint**: Ensure that critical attributes, such as `AIRCRAFT_ID` and `SENSOR_TYPE`, cannot be null. This is akin to ensuring every product in a manufacturing line has a product description.

3. **Implement UNIQUE Constraint**: Apply a UNIQUE constraint on `SERIAL_NUMBER` for `AVIONIC_SYSTEM` to prevent duplicate serial numbers, ensuring each avionics system can be uniquely identified.

4. **Define CHECK Constraint**: Implement a CHECK constraint on `READING.VALUE` to ensure that sensor readings are within a valid range (e.g., -20 to 50 degrees Celsius), preventing erroneous data entry.

5. **Establish PRIMARY KEY and FOREIGN KEY Constraints**: Designate `AIRCRAFT_ID`, `AVIONIC_SYSTEM_ID`, `SENSOR_ID`, and `READING_ID` as primary keys. Establish foreign key relationships, such as `AVIONIC_SYSTEM.AIRCRAFT_ID` referencing `AIRCRAFT.AIRCRAFT_ID`, to maintain data consistency across tables.

6. **Test Constraints**: Verify that the defined constraints are enforced by attempting to insert invalid data (e.g., a null `AIRCRAFT_ID` or a `READING.VALUE` outside the valid range) and confirming that the database rejects such entries.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A NOT NULL constraint in a relational database ensures that a column can contain null values.",
    "answer": false,
    "explanation": "A NOT NULL constraint ensures that a column cannot contain null values, requiring every row to have a value for that column."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given a table 'employees' with a UNIQUE constraint on the 'email' column, what happens when you try to insert a duplicate email address?",
    "answer": "The insertion will be rejected, and an error will be raised, to prevent duplicate email addresses from being entered.",
    "explanation": "The UNIQUE constraint ensures data integrity by preventing duplicate values in the specified column(s), in this case, the 'email' column."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, CHECK (order_date > '2020-01-01'));",
    "answer": "The bug is that the CHECK constraint uses a hardcoded date. It should be a dynamic check or use a more flexible date comparison.",
    "explanation": "The CHECK constraint should ideally be flexible to accommodate changing business rules or date ranges. A hardcoded date may not be suitable for all scenarios."
  }
]

```