---
title: "CS1241_5_Physical_Database_Design_Possible_Questions"
type: "Questions"
course: "[[Database Systems]]"
semester: "[[Semester I]]"
unit: "5 Physical Database Design"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.028186"
last_edited_time: "2026-04-16T13:47:45.028187"
last_edited_by: "LifeOs AI Agent"
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Physical_Database_Design]]
### Level 1: Understanding (The Basics)
1.  **The Component Check:** What is the primary output generated during the physical database design process?
### Level 2: Competence (Application)
2.  **The Clean Build:** Outline the six main phases typically involved in a comprehensive physical database design methodology.
### Level 3: Mastery (The Crucible)
3.  **The Broken System:** A logical database model has been approved, but the physical design team decided to proceed with implementation without a detailed analysis of expected transaction types or frequencies. Describe three specific performance bottlenecks or operational inefficiencies that could predictably arise from this omission.

## [[Translating_Logical_Data_Model_for_DBMS]]
### Level 1: Understanding (The Basics)
4.  **The Component Check:** List three distinct types of constraints that a target DBMS should ideally support to accurately translate a logical data model.
### Level 2: Competence (Application)
5.  **The Clean Build:** Explain how to translate a composite primary key, a foreign key, and an attribute that must always have a value (not null) from a logical model into generic SQL Data Definition Language (DDL) syntax.
### Level 3: Mastery (The Crucible)
6.  **The Broken System:** Imagine a legacy DBMS that *only* supports primary key definitions, lacking native support for foreign keys or `CHECK` constraints. Given a logical model with `Orders(OrderID PK, CustomerID FK)` and `Customers(CustomerID PK, CustomerType NOT NULL)`, describe how you would simulate the referential integrity for `CustomerID` and the `NOT NULL` constraint for `CustomerType` within this restrictive environment.

## [[Designing_Base_Relations]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** What are the four essential elements that must be defined for each base relation (table) when designing base relations?
### Level 2: Competence (Application)
8.  **The Clean Build:** Given a logical relation `Books` with attributes `ISBN` (Primary Key), `Title`, `AuthorID` (Foreign Key referencing an `Authors` table), `PublicationYear`, and `Price`, write the complete SQL `CREATE TABLE` statement for `Books`, ensuring all primary key, foreign key, and appropriate data type constraints are included.
### Level 3: Mastery (The Crucible)
9.  **The Broken System:** A `LibraryHoldings` table contains `BookID` (PK), `CopyNumber` (PK), `Status` (`'Available'`, `'On Loan'`), and `LastCheckedOutDate`. Due to initial design oversight, `Status` can currently be `NULL`. Design the SQL `CREATE TABLE` statement for `LibraryHoldings` such that `Status` defaults to `'Available'` if not specified, can never be `NULL`, and `LastCheckedOutDate` can be `NULL` but defaults to the current date if a copy is newly acquired and has never been checked out.

## [[Designing_Derived_Data_Representation]]
### Level 1: Understanding (The Basics)
10. **The Fact Check:** What are the two primary approaches for representing a derived attribute in a physical database design, and when might each be preferred?
### Level 2: Competence (Application)
11. **The Trade-off:** A `Product` table has `StockQuantity` and `MinimumOrderQuantity`. A derived attribute, `AvailableForSale`, is true if `StockQuantity > MinimumOrderQuantity`. For an inventory system with high transaction volume (many updates to `StockQuantity`) but also frequent queries for `AvailableForSale`, discuss the advantages and disadvantages of storing `AvailableForSale` as a physical column versus calculating it dynamically.
### Level 3: Mastery (The Crucible)
12. **The Lose-Lose Scenario:** A critical analytical dashboard requires `Daily_Revenue_Total`, derived from summing millions of individual `Sales` records. Storing this derived data risks displaying stale information, which is unacceptable for real-time decision-making. However, calculating it on-demand for every dashboard load causes significant performance delays, leading to poor user experience. Propose a "least bad" strategy to handle `Daily_Revenue_Total`, justifying your choice and outlining the explicit trade-offs you are making.

## [[Designing_General_Constraints]]
### Level 1: Understanding (The Basics)
13. **The Component Check:** What is the fundamental purpose of incorporating a "general constraint" into a target DBMS?
### Level 2: Competence (Application)
14. **The Clean Build:** Write a SQL `CHECK` constraint for a `Flight` table to ensure that `DepartureTime` is always strictly before `ArrivalTime`.
### Level 3: Mastery (The Crucible)
15. **The Broken System:** Consider a `Registration` table with `StudentID`, `CourseID`, and `EnrollmentDate`. Design a `CONSTRAINT` using SQL that ensures no student can register for the *same course more than once*. Provide the SQL statement to implement this.

## [[Designing_File_Organizations_and_Indexes]]
### Level 1: Understanding (The Basics)
16. **The Component Check:** What is the overarching objective when making decisions about `file organizations` and `indexes` during physical database design?
### Level 2: Competence (Application)
17. **The Clean Build:** Explain how the concept of database `workload` (including frequently executed transactions and query patterns) directly influences the choices made for file organizations and indexing strategies.
### Level 3: Mastery (The Crucible)
18. **The Broken System:** A large `EmployeeRecords` table (millions of rows) currently uses a simple heap file organization. This design was chosen for ease of initial implementation. However, the most frequent operation is retrieving employee details by `EmployeeID` (which is unique) or listing employees within a specific `Department` in alphabetical order. Explain why the heap file organization is highly inefficient for these common operations and what immediate performance problems it would cause.

## [[Analyzing_Transactions]]
### Level 1: Understanding (The Basics)
19. **The Tool Check:** Name two specific types of diagrams or matrices that can be employed to identify which relations are most heavily used or accessed by various transactions.
### Level 2: Competence (Application)
20. **The Routine Run:** Outline a three-step process for effectively analyzing database transactions to pinpoint areas that might lead to performance problems.
### Level 3: Mastery (The Crucible)
21. **The Disaster Drill:** A critical online retail application experiences intermittent but severe performance degradation during off-peak hours, specifically affecting checkout processes. Initial logs show high `CPU utilization` on the database server during these periods, but not a significant increase in overall transaction volume. Based on transaction analysis principles, describe your immediate diagnostic steps to identify the root cause, focusing on factors other than peak load.

## [[Choosing_File_Organizations]]
### Level 1: Understanding (The Basics)
22. **The Neighbor Check:** List three common types of file organizations used to store base relations in a database.
### Level 2: Competence (Application)
23. **The Sort:** Categorize `Indexed Sequential Access Method (ISAM)`, `B+-Tree`, and `Heap` file organizations based on their strengths in handling `high-volume random record retrieval`, `efficient sequential processing`, and `rapid insertion/deletion of records (without strict order)`.
### Level 3: Mastery (The Crucible)
24. **The Impostor:** A database administrator suggests using a `Heap` file organization for a `ProductCatalog` table, arguing it's efficient because new products are constantly added. Explain why this approach is a "false friend" for a catalog that also experiences frequent searches by product name and category, and propose a more suitable file organization.

## [[Choosing_Indexes]]
### Level 1: Understanding (The Basics)
25. **The Neighbor Check:** What is the primary benefit of strategically adding indexes to a database relation?
### Level 2: Competence (Application)
26. **The Sort:** Distinguish between a `primary index` and a `secondary index`, explaining the key differences in how they store data pointers and their implications for search performance.
### Level 3: Mastery (The Crucible)
27. **The Impostor:** A junior developer proposes adding a secondary index to the `OrderID` column of a `SalesOrders` table, even though `OrderID` is already the primary key. Explain why this specific index type might be an "impostor" in this scenario, providing a more appropriate indexing strategy for the primary key.

## [[Index_Guidelines]]
### Level 1: Understanding (The Basics)
28. **The Tool Check:** Name two general guidelines that recommend *against* indexing a particular attribute or relation.
### Level 2: Competence (Application)
29. **The Routine Run:** Outline three best practices or recommended scenarios for when to add a secondary index to a database attribute.
### Level 3: Mastery (The Crucible)
30. **The Disaster Drill:** A database for a social media platform frequently updates user profile information (e.g., status, last login). A new secondary index was recently added to the `LastLoggedInDateTime` column to speed up queries identifying active users. However, overall database write performance has significantly degraded since the index was added. Explain two specific reasons, based on indexing guidelines, why this particular index might be causing the performance issues.

## [[Estimating_Disk_Space_Requirements]]
### Level 1: Understanding (The Basics)
31. **The Variable ID:** List three crucial factors that must be considered when attempting to estimate the amount of disk space a database will require.
### Level 2: Competence (Application)
32. **The Standard Solver:** A database table is projected to have 50,000 records. Each record consists of the following attributes: `ProductID` (integer, 4 bytes), `ProductName` (varchar(100), average 30 bytes), `Description` (text, average 150 bytes), `CreationDate` (date, 3 bytes). Calculate the approximate total disk space required for the data in this table, ignoring any overhead for indexes or metadata.
### Level 3: Mastery (The Crucible)
33. **The Impossible Case:** A company initially estimates its database will require 200 GB of storage, projecting a consistent 5% annual data growth. However, due to unexpected business expansion, the actual growth rate unexpectedly jumps to 15% annually after the first year. Explain how this discrepancy would severely impact capacity planning and lead to an "impossible case" scenario where the initial projections become critically insufficient much faster than anticipated.

## [[Designing_User_Views]]
### Level 1: Understanding (The Basics)
34. **The Element ID:** What is the primary function of a `user view` in the context of database design?
### Level 2: Competence (Application)
35. **The Flow Chart:** Describe a common user scenario where a `user view` would provide significant benefits for data access, contrasting it with direct access to underlying base tables.
### Level 3: Mastery (The Crucible)
36. **The Friction Point:** A complex `SalesPerformanceReport_View` is defined by joining five large tables, involving aggregation and filtering. Users complain that running this report view is extremely slow, often timing out. Identify two distinct "friction points" in this view's design that could cause such performance issues and suggest a strategy to mitigate each.

## [[Designing_Security_Measures]]
### Level 1: Understanding (The Basics)
37. **The Component Check:** Any robust database access control mechanism must explicitly specify three fundamental aspects. What are they?
### Level 2: Competence (Application)
38. **The Clean Build:** Write generic SQL DDL commands to `GRANT` `SELECT` and `UPDATE` privileges on an `Inventory` table to a specific user role named `WarehouseManager`, and then `REVOKE` only the `UPDATE` privilege from that role.
### Level 3: Mastery (The Crucible)
39. **The Broken System:** A large application has a single `Users` table and initially grants `DELETE` privileges on this table to *all* application users for simplicity, assuming application-level logic would prevent misuse. This is a severe security flaw. Design a more secure privilege structure using generic SQL `GRANT`/`REVOKE` statements that ensures only a dedicated `DBAdmin` role can `DELETE` from the `Users` table, while standard `ApplicationUser` roles can only `SELECT`.

## [[Controlled_Redundancy_and_Denormalization]]
### Level 1: Understanding (The Basics)
40. **The Fact Check:** Define `denormalization` within the context of refining a relational schema, specifically highlighting its relationship to the degree of normalization.
### Level 2: Competence (Application)
41. **The Trade-off:** Explain a practical scenario in a database where `controlled redundancy` (denormalization) could be introduced to improve the performance of a frequently executed read query, outlining both the performance gain and the potential drawbacks introduced.
### Level 3: Mastery (The Crucible)
42. **The Lose-Lose Scenario:** A critical analytical report frequently joins a high-volume `EventsLog` table with a `UserProfiles` table to retrieve user details. Denormalizing by embedding a few key user profile attributes into `EventsLog` dramatically speeds up the report. However, `UserProfiles` are updated regularly, and maintaining consistency with the denormalized `EventsLog` becomes complex and resource-intensive, slowing down user profile updates. If both the report performance and user profile update speed are paramount, propose a "least bad" compromise strategy, justifying your choice between read speed and write consistency.

## [[Monitoring_and_Tuning_Operational_Systems]]
### Level 1: Understanding (The Basics)
43. **The Tool Check:** Name two quantitative metrics commonly used to measure the efficiency and performance of an operational database system.
### Level 2: Competence (Application)
44. **The Routine Run:** Outline a general, iterative process for monitoring and tuning an operational database system to maintain or improve its performance over time.
### Level 3: Mastery (The Crucible)
45. **The Disaster Drill:** An operational database begins to exhibit consistently high `response time` for user queries, even though `transaction throughput` appears stable and `disk storage` remains well within limits. This issue is not correlated with `peak load` times. Based on database tuning principles, identify two initial areas of investigation you would prioritize to diagnose the root cause of this performance degradation.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Optimizing an E-commerce Product Catalog
**The Setup:** You are designing the physical schema for a new e-commerce product catalog database. This system needs to support extremely fast product lookups by `ProductID` and `CategoryName`, frequent updates to product inventory, and periodic complex reports on product sales performance. The `Product` table initially holds `ProductID`, `ProductName`, `Description`, `CategoryID`, `InventoryCount`, `Price`. A separate `Categories` table holds `CategoryID`, `CategoryName`, `CategoryDescription`.
**The Constraints:** You have limited disk I/O budget for reads during peak hours, but updates must be consistent. Your DBMS supports `B+-Tree` indexes and can implement `CHECK` constraints but is not very efficient with complex `JOIN` operations in real-time queries.
**The Challenge:**
(a) Based on the given requirements and constraints, design the `CREATE TABLE` statements for `Product` and `Categories`, including appropriate primary keys, foreign keys, `NOT NULL` constraints, and an initial suggestion for a suitable `file organization` for the `Product` table.
(b) Propose an `indexing strategy` for the `Product` table that optimizes for fast lookups by `ProductID` and `CategoryName`, explaining your choices for `primary`, `clustering`, and `secondary` indexes.
(c) A critical report requires `ProductName`, `CategoryName`, and `TotalSales` (derived from an `Orders` table not shown). Given the `JOIN` inefficiency, discuss a potential `denormalization` strategy to optimize this specific report's performance. Explain the trade-offs involved in terms of data consistency and update complexity.