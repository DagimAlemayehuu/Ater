---

title: Data_Definition_Language
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: '6'
hub: "[[6_Database_Design_Hub]]"
source: "[[Chapter_6.pdf]]"
source_pages:
- 4
mode: CS-DB
read: false
generated: true
prerequisites:
- "[[Sql_Definition]]"

---

# 1. Mental Model

A database's structure can be thought of as a library's cataloging system. Just as a library uses a cataloging system to organize and maintain information about its books, a database uses a schema to organize and maintain information about its data. The schema serves as a blueprint for the database, defining the relationships between different pieces of data, much like the cataloging system defines the relationships between books and authors.

# 2. Schema & Query Mechanics

The [[Data_Definition_Language]] is used to create, modify, and manage the schema of a database. This includes commands such as [[Create_Table]], [[Alter_Table]], and [[Drop_Table]], which allow users to define the structure of their data. When creating a table, users can specify [[Constraint_Definition]]s, such as primary and foreign keys, to ensure data consistency. The [[System_Catalog]] is a critical component of the database, as it stores metadata about the database's schema. Users can modify the schema using [[Data_Definition_Language]] commands, and then use [[Sql_Sub_Languages]] such as [[Sql_Definition]] to perform various operations.

# 3. ACID Violations & Scaling Limits

When using [[Data_Definition_Language]] commands, it's essential to consider the potential for ACID violations. For example, if a [[Create_Table]] command fails, the database may be left in an inconsistent state. Additionally, as the database scales, [[Data_Definition_Language]] commands can become a bottleneck. 

| Error Type | Description | 
| --- | --- | 
| Inconsistent State | Failure to execute DDL command leaves database in inconsistent state | 
| Bottlenecks | DDL commands can become bottleneck as database scales | 

DDL commands must be carefully executed to avoid these issues.

## 4. Entity-Relationship Model

```mermaid

erDiagram
    Gene ||--o{ Sequence : contains
    Sequence }|..|> Genome : part_of
    Genome ||--o{ Variant : has
    Variant ||--o{ Sample : appears_in

```

In this Mermaid entity-relationship diagram, the entities (tables) are represented as boxes, and the relationships between them are represented as lines. 
- A `Gene` can contain multiple `Sequence`s (one-to-many), 
- A `Sequence` is part of one `Genome` (many-to-one), 
- A `Genome` can have multiple `Variant`s (one-to-many), 
- A `Variant` can appear in multiple `Sample`s (many-to-many).

## 5. Walkthrough

Here are the steps to create and manage a database schema for bioinformatics and genomic sequencing data:

1. **Define the Gene entity**: Create a `Gene` table with attributes such as `gene_id`, `name`, and `description` to store information about genes.
2. **Establish the Sequence relationship**: Create a `Sequence` table with attributes such as `sequence_id`, `gene_id`, and `sequence_data` to store sequence data for each gene, establishing a one-to-many relationship with the `Gene` table.
3. **Define the Genome entity**: Create a `Genome` table with attributes such as `genome_id`, `name`, and `description` to store information about genomes.
4. **Establish the Variant relationship**: Create a `Variant` table with attributes such as `variant_id`, `genome_id`, and `variant_data` to store variant data for each genome, establishing a one-to-many relationship with the `Genome` table.
5. **Define the Sample entity**: Create a `Sample` table with attributes such as `sample_id`, `sample_data`, and `variant_id` to store sample data for each variant, establishing a many-to-many relationship with the `Variant` table through a junction table (not shown).
6. **Populate the schema with data**: Use data definition language (DDL) statements to populate the schema with sample data, such as gene sequences, genome information, variant data, and sample data.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A database schema is used to organize and maintain information about its data.",
    "answer": true,
    "explanation": "This statement is true. A database schema serves as a blueprint for the database, defining the relationships between different pieces of data."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given that a database has two tables, 'orders' and 'customers', with a foreign key in 'orders' referencing the 'customer_id' in 'customers', what happens when a customer is deleted?",
    "answer": "The corresponding orders for that customer may need to be updated or deleted, depending on the cascade delete or update rules defined in the schema.",
    "explanation": "When a customer is deleted, the database needs to handle the related orders. The schema defines the relationships and constraints, such as cascade delete or update rules, to ensure data consistency."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error.",
    "content": "CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(255));\nCREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, FOREIGN KEY (customer_id) REFERENCES orders(id));",
    "answer": "The bug is in the foreign key constraint. The 'orders' table is referencing its own 'id' column instead of the 'id' column in the 'customers' table. The correct foreign key constraint should be FOREIGN KEY (customer_id) REFERENCES customers(id).",
    "explanation": "The foreign key constraint in the 'orders' table is incorrectly referencing the 'id' column in the same 'orders' table, instead of the 'id' column in the 'customers' table. This would cause a logical error and potentially allow orphaned records."
  }
]

```