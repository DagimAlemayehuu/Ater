---
title: Complete_Graphs
created_at: '2026-01-22T09:21:37Z'
last_modified: '2026-01-22T09:21:37Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 638c813a-69ba-4f31-9af7-810fc8fad39f
type: Core
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture 3 - Elements_of_Graph_Theory
aliases: 
- Kn_Graphs
- Fully_Connected_Graphs
unit: 3_Elements_Of_Graph_Theory
parent: Types_Of_Graphs
---

# Definition
Before proceeding, ensure you master [[Types_of_Graphs]] and [[Vertex_and_Edge_Properties]] because a complete graph is a specific type of simple graph where every possible unique connection between distinct vertices exists.
A graph `G` is said to be **complete** if every vertex in `G` is connected to every other vertex in `G`. By definition, a complete graph is always a Simple_Graphs (meaning it has no loops and no multiple edges). The complete graph with `n` vertices is denoted by `K_n`. Think of it as a social network where every single person is friends with every other person.

# The Mental Model
Imagine a group of best friends who all know each other extremely well. In a **complete graph**, if you have 5 friends, each friend is directly connected (knows) all 4 other friends. There are no strangers, and no one-sided friendships. This creates the densest possible set of connections for that number of people, almost like a perfect, tightly-knit social circle.

# Context & Framework
### Where Does it Live? (The Map)
Complete graphs (`K_n`) represent the maximal possible connectivity for a given number of vertices in a simple graph. They are the "densest" simple graphs. Understanding `K_n` is crucial because many graph theory problems involve analyzing the *absence* or *presence* of complete subgraphs (cliques) within larger networks. They serve as a benchmark for connectivity, sitting at one extreme of the connectivity spectrum, opposite to null graphs (no edges) or path graphs (minimal connectivity).

# The Mastery Deep Dive
### Mindmap
```mermaid
mindmap
  root((Complete Graphs (K_n)))
    --- Definition ---
      ("Every Vertex Connected to Every Other")
      - "No Loops"
      - "No Multiple Edges"
      - "Always a Simple Graph"
    
--- Notation ---
      ("K_n")
      - "n = Number of Vertices"
    
--- Properties ---
      ((Edges))
        - "Formula: n(n-1)/2"
        - "Each edge contributes to 2 degrees"
      ((Degree of Each Vertex))
        - "Each vertex has degree n-1"
        - "Always a Regular Graph"
      ((Adjacency))
        - "All vertices are mutually adjacent"
```
```text
// Scenario 1: Visualizing Complete Graph Properties
// Output:
// A mindmap centered on "Complete Graphs (K_n)".
// Main branches would be "Definition", "Notation", and "Properties".
// Sub-branches under "Definition" would include "Every Vertex Connected to Every Other", "No Loops", "No Multiple Edges", and "Always a Simple Graph".
// "Notation" would have "K_n" and "n = Number of Vertices".
// "Properties" would have sub-branches for "Edges" (with its formula and explanation), "Degree of Each Vertex" (with its value and implication), and "Adjacency" (with its characteristic).
// This mindmap clearly outlines the key attributes of complete graphs.
```
*Note: This `mindmap` visually summarizes the definition, notation, and key properties of complete graphs, emphasizing their maximal connectivity.*

# Constraints & Limitations
### The "Grandma Test"
When discussing `K_n`, a common confusion for the "Grandma Test" is distinguishing it from simply "connected." While a complete graph is always connected, a connected graph is not necessarily complete (e.g., a simple line of friends is connected, but not everyone knows everyone else). The trap is in thinking "connected" implies "complete." The distinction lies in the *every* pair aspect of `K_n`. Furthermore, drawing `K_n` for large `n` becomes visually complex and computationally intensive, highlighting its practical limitations for visualization.

# Significance & Application
Complete graphs are significant because they:
*   **Represent Max Connectivity:** Serve as a theoretical upper bound for connectivity in graphs, useful for comparing the density of other graphs.
*   **Clique Detection:** Finding complete subgraphs (cliques) within larger, more complex networks is a critical problem in social network analysis, bioinformatics (protein-protein interaction networks), and data mining.
*   **Fundamental Building Blocks:** Used in various proofs and theorems as foundational structures.
*   **Academic Relevance:** They are often studied as base cases or examples for general graph properties.

# The Worked Example
**Question:** How many edges are there in `K_n`?

**Step-by-Step Derivation:**

1.  **Consider `n` vertices:** Let there be `n` vertices in the complete graph.
2.  **Each vertex connects to `n-1` others:** Since every vertex is connected to every other distinct vertex, each vertex has a degree of `n-1`.
3.  **Sum of degrees:** The sum of all degrees is `n * (n-1)`.
4.  **Apply Handshaking Lemma:** We know that the sum of degrees is `2 * |E|`.
    *   So, `n * (n-1) = 2 * |E|`.
5.  **Solve for `|E|`:**
    *   `|E| = n * (n-1) / 2`.

Alternatively, think about selecting two vertices to form an edge. Since order doesn't matter and you can't pick the same vertex twice for a simple edge, this is a combination problem: "n choose 2".
*   `$$ \boxed{\displaystyle \binom{n}{2} = \frac{n(n-1)}{2}} $$` edges.

**Example for `K4` (from page 33 of the source):**
*   `n = 4`
*   `|E| = 4 * (4-1) / 2 = 4 * 3 / 2 = 12 / 2 = 6` edges.
    (Visually, K4 has 6 edges: connect all pairs of 4 vertices, e.g., in a square with diagonals).

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What is the degree of each vertex in a complete graph `K_n`?
> **Solution:** The degree of each vertex in a complete graph `K_n` is `n-1`.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A new social platform launches with 7 users. To promote interaction, the platform initially connects every new user to every other existing user.
**The Challenge:**
(a) What type of graph does this social platform initially form, and what is its standard notation?
(b) How many direct connections (edges) are there among these 7 users?
(c) If one user leaves, how many connections are removed from the network?
> **Solution:**
> (a) This platform initially forms a **complete graph**, denoted as `K_7`.
>
> (b) For `K_7`, the number of edges is `n(n-1)/2`.
>     *   `|E| = 7 * (7-1) / 2 = 7 * 6 / 2 = 42 / 2 = 21` direct connections.
>
> (c) If one user leaves, the graph effectively becomes `K_6` (assuming no new connections are added or removed for the remaining users).
>     *   The number of connections the leaving user had was their degree, which is `n-1 = 7-1 = 6`.
>     *   So, `6` connections are removed from the network.
>     *   Alternatively, `|E(K6)| = 6 * (6-1) / 2 = 6 * 5 / 2 = 15`.
>     *   Connections removed: `21 - 15 = 6`.

# Key Takeaways
*   Complete graphs (`K_n`) are simple graphs where every pair of distinct vertices is connected by an edge.
*   They represent maximum connectivity for a given number of vertices.
*   The number of edges in `K_n` is `n(n-1)/2`, and each vertex has a degree of `n-1`.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Types_of_Graphs]]         | Complete graphs are a specific type of simple graph.            |
| [[Vertex_and_Edge_Properties]] | Defined by the property that all vertices are mutually adjacent. |
| [[Degree_of_a_Vertex]]      | All vertices in a complete graph have the same degree (`n-1`), making it a regular graph. |
| [[Handshaking_Lemma]]       | The formula for the number of edges in `K_n` can be derived from the Handshaking Lemma. |
| [[Adjacency_Matrix]]        | The adjacency matrix of `K_n` (for `n>1`) consists of all '1's except for '0's on the main diagonal. |
---