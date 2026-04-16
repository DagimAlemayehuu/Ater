---
title: CS1241_3_Conceptual_Database_Design_Possible_Questions
created_at: '2025-11-30T21:00:17Z'
last_modified: '2025-11-30T21:00:17Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 569a0a05-3546-47ad-91d3-630d2ebe36d2
type: Questions
course: Database_Systems
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides_Database_Systems_Chapter_Three
aliases: []
unit: 3_Conceptual_Database_Design
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Database_Development_Methodology]]
### Level 1: Understanding (The Basics)
1.  **The Fact Check:** List the main phases of the Database System Development Life Cycle in their correct order.
### Level 2: Competence (Application)
2.  **The Trade-off:** Imagine a small startup decides to skip the "Requirements Collection and Analysis" phase for their new application's database. Explain one significant problem that is likely to arise from this decision, and propose a specific counter-measure.
### Level 3: Mastery (The Crucible)
3.  **The Lose-Lose Scenario:** A project manager is forced to choose between either severely cutting the "Database Planning" phase or the "Testing" phase due to budget constraints. Both options have significant negative consequences. Justify which 'least bad' choice the project manager should make, explaining the primary risks of each.

## [[Conceptual_Database_Design]]
### Level 1: Understanding (The Basics)
4.  **The Fact Check:** Define conceptual database design, emphasizing its independence from physical considerations.
### Level 2: Competence (Application)
5.  **The Trade-off:** Explain why it is crucial for conceptual database design to be independent of specific DBMS technologies. What benefits does this independence provide during the initial design phases?
### Level 3: Mastery (The Crucible)
6.  **The Impostor:** You are presented with a document describing a database model. It includes details about specific SQL data types (e.g., `VARCHAR(255)`), indexing strategies, and table partitioning. Is this a conceptual database design document? Explain why or why not.

## [[Logical_Database_Design]]
### Level 1: Understanding (The Basics)
7.  **The Fact Check:** What is the primary characteristic that differentiates logical database design from conceptual database design?
### Level 2: Competence (Application)
8.  **The Trade-off:** A team has completed their conceptual design and is moving to logical design. They are considering two different data models: the relational model and the hierarchical model. For a university student information system, justify why the relational model would generally be a better choice, considering its flexibility and query capabilities.
### Level 3: Mastery (The Crucible)
9.  **The Impostor:** You observe a database designer discussing the creation of views and stored procedures. Is this activity primarily part of the logical database design phase? Justify your answer.

## [[Physical_Database_Design]]
### Level 1: Understanding (The Basics)
10. **The Fact Check:** What is the main objective of physical database design?
### Level 2: Competence (Application)
11. **The Trade-off:** A database administrator is debating whether to create an index on a specific column in a large `Orders` table. Explain the performance trade-off involved in adding an index, considering both read and write operations.
### Level 3: Mastery (The Crucible)
12. **The Impostor:** During a meeting, a developer suggests denormalizing a table to improve query performance. Is this a decision typically made during the conceptual or physical database design phase? Explain your reasoning.

## [[Entity_Relationship_ER_Model]]
### Level 1: Understanding (The Basics)
13. **The Fact Check:** Name the three fundamental components of the Entity-Relationship (ER) model.
### Level 2: Competence (Application)
14. **The Sort:** You are given a list of real-world items: `Customer`, `Order_Date`, `Places_Order`, `Product_ID`, `Supplier`. Categorize each item as either an `Entity`, `Attribute`, or `Relationship` in the context of an e-commerce database.
### Level 3: Mastery (The Crucible)
15. **The Impostor:** An ER diagram shows a direct relationship between `Customer` and `Invoice_Number`. Identify the flaw in this design and suggest a more appropriate representation according to ER modeling principles.

## [[Entity_Types]]
### Level 1: Understanding (The Basics)
16. **The Fact Check:** Distinguish between an entity type and an entity occurrence.
### Level 2: Competence (Application)
17. **The Sort:** Given the entity types `Student`, `Course`, `Enrollment`, and `Dependent`, where `Dependent` cannot exist without a `Student`, categorize each as either a `Strong_Entity_Type` or a `Weak_Entity_Type`.
### Level 3: Mastery (The Crucible)
18. **The Impostor:** You are designing a database for a library system. Is `Book_Copy` (a specific physical copy of a book, identified by a barcode) a strong or weak entity type if `Book` (the abstract title) already exists? Justify your answer.

## [[Strong_Entity_Type]]
### Level 1: Understanding (The Basics)
19. **The Fact Check:** What characteristic makes an entity type "strong"?
### Level 2: Competence (Application)
20. **The Sort:** Consider a database for a car dealership. Would `Car_Model` (e.g., "Toyota Camry") or `Specific_Car_Inventory` (e.g., "VIN: 123ABC...") be considered a strong entity type? Justify your choice.
### Level 3: Mastery (The Crucible)
21. **The Impostor:** An ER diagram depicts `Department` as a strong entity. However, its primary key is `Department_Name` combined with `Company_ID`, and `Company` is another strong entity. Is `Department` truly a strong entity in this context? Explain.

## [[Weak_Entity_Type]]
### Level 1: Understanding (The Basics)
22. **The Fact Check:** Explain the concept of existence dependence in relation to a weak entity type.
### Level 2: Competence (Application)
23. **The Sort:** In a university database, `Course_Section` (e.g., "CS101 - Fall 2025, Section A") typically has a `Section_ID` which is unique only within a given `Course`. Is `Course_Section` a strong or weak entity type? Explain.
### Level 3: Mastery (The Crucible)
24. **The Impostor:** A database for a music streaming service contains `Song_Version` (e.g., "Acoustic Remix" of a song), which has a `Version_Number` that is only unique within the context of a `Song` entity. If `Song_Version` also has its own `Version_ID` (a globally unique identifier), is it still a weak entity type? Justify.

## [[Relationship_Types]]
### Level 1: Understanding (The Basics)
25. **The Fact Check:** Define a relationship type in the context of the ER model.
### Level 2: Competence (Application)
26. **The Sort:** Consider the relationships: `Employee_Manages_Employee`, `Student_Enrolls_in_Course`, and `Supplier_Provides_Part_to_Project`. For each, determine its degree (unary, binary, or ternary).
### Level 3: Mastery (The Crucible)
27. **The Impostor:** You find a relationship type in an ER diagram labeled "Works_For" connecting `Employee` to `Department` and `Project`. The designer claims it's a binary relationship between `Employee` and `Department` with `Project` as an attribute. Is this claim accurate? Explain the typical representation for this scenario.

## [[Degree_of_a_Relationship]]
### Level 1: Understanding (The Basics)
28. **The Fact Check:** What does the "degree" of a relationship refer to?
### Level 2: Competence (Application)
29. **The Sort:** Identify the degree of the following relationship occurrences:
    (a) `John` supervises `Mary`.
    (b) `Alice` rents `Apartment_101` from `Landlord_Bob`.
    (c) `Sarah` buys `Book_X` using `Payment_Method_Y` from `Seller_Z`.
### Level 3: Mastery (The Crucible)
30. **The Impostor:** A relationship is drawn with three lines connecting to a single diamond. The designer labels it as two separate binary relationships. Is this necessarily incorrect, or could it be a valid (though potentially confusing) representation? Explain.

## [[Recursive_Relationship]]
### Level 1: Understanding (The Basics)
31. **The Fact Check:** Describe a recursive relationship and provide a simple real-world example.
### Level 2: Competence (Application)
32. **The Clean Build:** You need to model a "parent-child" relationship within an `Employee` entity type (where an employee can be a parent to another employee, representing a hierarchy). Sketch out how this would look in a simplified ER diagram, including role names.
### Level 3: Mastery (The Crucible)
33. **The Broken System:** An ER diagram shows a `Person` entity type with two distinct recursive relationships: `Knows` (symmetric) and `Supervises` (asymmetric). A new designer attempts to combine these into a single recursive relationship with multiple role names. Explain why this approach is problematic and what conceptual integrity issues it introduces.