---
title: Conceptual_Database_Design_Relational_Model_Possible_Questions
created_at: '2026-04-12T07:09:26Z'
last_modified: '2026-04-12T07:09:30Z'
uid: PLACEHOLDER_UID
type: Questions
course: Conceptual Database Design
unit: Relational Model
ai_refinement_log: '2026-04-12T07:09:30Z: AI updated note'
---

# Part I: The Elite Crucible
*Each question below represents Level 3 (Mastery) for its respective concept. These require solving complex scenarios, navigating traps, or explaining hard trade-offs.*

## [[Database_Development_Methodology]]
**The Challenge:** 
A retail company wants to implement a new database system to manage its inventory, sales, and customer information. The company has multiple warehouses and stores across different regions. Describe how you would approach the database planning phase, including the activities involved and the deliverables expected.

## [[Phases_of_Database_Design]]
**The Challenge:** 
Compare and contrast the different phases of database design (conceptual, logical, and physical). Provide a scenario where a specific phase might be more critical than the others.

## [[Entity-Relationship_Modelling]]
**The Challenge:** 
Design an Entity-Relationship (ER) diagram for a university database that includes entities such as students, courses, and instructors. Include attributes and relationships, and specify the degree of relationships.

## [[Basic_Concepts_of_ER_Model]]
**The Challenge:** 
Explain the difference between entity types and relationship types in the context of the ER model. Provide examples to illustrate your points.

## [[Entity_Types]]
**The Challenge:** 
Distinguish between strong and weak entity types. Provide a real-world scenario where each type would be applicable.

## [[Relationship_Types]]
**The Challenge:** 
Describe a scenario that requires a ternary relationship. Explain why a binary relationship would not be sufficient.

## [[Attributes]]
**The Challenge:** 
Compare and contrast simple, composite, single-valued, and multi-valued attributes. Provide examples of each.

## [[ER_Diagrams_and_Design]]
**The Challenge:** 
Walk through the steps involved in developing an ER diagram for a given scenario. Explain how you would validate the ER diagram with users.

## [[Structural_Constraints]]
**The Challenge:** 
Explain the concepts of cardinality and participation in the context of multiplicity. Provide examples to illustrate your points.

## [[Multiplicity]]
**The Challenge:** 
Design a relationship between two entities with a many-to-many (*:*) multiplicity. Explain the implications of this relationship on the database design.

# Part II: Unit Synthesis
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: University Database
**The Setup:** 
A university needs a database to manage information about its students, courses, and faculty. The database should track student enrollments, course offerings, and faculty assignments.

**The Constraints:** 
- Each student can enroll in multiple courses.
- Each course can have multiple students and multiple instructors.
- Each faculty member can teach multiple courses.

**The Challenge:**
(a) Design a high-level ER diagram for this scenario.
(b) Explain the trade-offs involved in your design choices.
(c) Predict potential data inconsistencies or issues that might arise from this design.

### Integrated Scenario: E-Commerce Platform
**The Setup:** 
An e-commerce platform needs a database to manage products, orders, and customers. The platform should track product inventory, order status, and customer information.

**The Constraints:** 
- Each product can have multiple variants (e.g., different sizes, colors).
- Each order can have multiple products.
- Each customer can place multiple orders.

**The Challenge:**
(a) Design a high-level ER diagram for this scenario.
(b) Explain the trade-offs involved in your design choices.
(c) Predict potential data inconsistencies or issues that might arise from this design.
