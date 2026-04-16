---
title: Cycles_And_Circuits_In_Graphs
created_at: '2026-01-22T09:21:37Z'
last_modified: '2026-01-22T09:21:37Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: d1479283-bb5f-4222-9fac-da8a038e6503
type: Core
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture 3 - Elements_of_Graph_Theory
aliases: 
- Graph_Cycles
- Graph_Circuits
- Closed_Paths
unit: 3_Elements_Of_Graph_Theory
parent: Paths_And_Connectivity_In_Graphs
---

# Definition
Before proceeding, ensure you master [[Paths_and_Connectivity_in_Graphs]] and [[Walks_and_Paths_in_Graphs]] because cycles and circuits are specific types of closed walks or paths, relying on precise rules for vertex and edge repetition.
A **path** is said to be **closed** if its initial vertex `v0` is the same as its terminal vertex `vn` (`v0 = vn`). A path is said to be **open** if `v0 ≠ vn`.
A **cycle** is a closed simple path (i.e., all the vertices are distinct *except* the initial and terminal vertices, which are the same). It is a path of length `≥ 3` that starts and ends at the same vertex, with no other repeated vertices or edges. A **loop** is considered a cycle of length 1.
A **circuit** (or **closed trail**) is a walk that begins and ends at the same vertex, where all edges are distinct (i.e., a walk that does not traverse the same edge more than once), but it may revisit vertices.
Think of a path as a round trip that never doubles back, and a circuit as a round trip that might visit the same landmark multiple times but never uses the same road twice.

# The Mental Model
Imagine a tourist who wants to start and end their day at their hotel. A **cycle** is like a carefully planned round trip where they never visit the same landmark twice, other than the hotel. A **circuit** is a more relaxed round trip: they might visit the same landmark multiple times, but they'll always take a different route (never use the same road segment twice). A **loop** is like just going out your hotel door and immediately back in.

# Context & Framework
### The "Wikipedia One-Liner"
The fine distinctions between "cycle" and "circuit" are crucial for precise graph analysis. A "Wikipedia One-Liner" for a cycle is: "a closed path where all intermediate vertices are distinct." For a circuit, it's: "a closed walk where all edges are distinct (but vertices may repeat)." This emphasizes that a cycle is stricter (no repeated intermediate vertices), while a circuit is more forgiving (allows repeated intermediate vertices, as long as edges aren't reused). These definitions underpin the study of specific graph properties like bipartiteness (absence of odd cycles) and Eulerian circuits.

# The Mastery Deep Dive
### The "Kill Sheet" Comparison Table
Precisely distinguishing between cycles and circuits is critical for graph traversal analysis.

| Feature               | Path                                                         | Closed Path (or Cycle if simple)                             | Circuit (Closed Trail)                                       | "The Gotcha" Difference                                      |
| :
-------------------- | :
----------------------------------------------------------- | :
----------------------------------------------------------- | :
----------------------------------------------------------- | :
----------------------------------------------------------- |
| **Start/End Vertex**  | `v0 ≠ vn` (open)                                             | `v0 = vn` (closed)                                           | `v0 = vn` (closed)                                           | Cycles and circuits are closed traversals.                   |
| **Vertex Repetition** | Not Allowed (all `v_i` distinct)                             | Not Allowed (all `v_i` distinct, except `v0 = vn`)           | Allowed (intermediate `v_i` can be repeated)                 | Cycle is vertex-simple; circuit is not necessarily.          |
| **Edge Repetition**   | Not Allowed (all `e_i` distinct)                             | Not Allowed (all `e_i` distinct)                             | Not Allowed (all `e_i` distinct)                             | Both are edge-simple (no repeated edges).                    |
| **Definition**        | A walk with distinct vertices.                               | A closed path of length `≥ 3`. Loop is length 1.             | A closed walk with distinct edges.                           | Circuit is more general; allows vertex repetition.           |
| **"The Gotcha" Difference"** | A path is open; a cycle/circuit is closed. A cycle is a specific kind of circuit. | A cycle is a circuit that does not repeat any *intermediate* vertices. | The key is *what* is allowed to repeat (vertices for circuits, nothing for cycles). |

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A common error is confusing a **circuit** with a **cycle**. Students often assume that if a closed walk doesn't repeat edges, it must be a cycle. This is incorrect. A circuit, such as `A-B-C-B-D-A`, reuses vertex `B` (intermediate vertex) but not any edges, so it is a circuit but not a cycle. The "trap" is forgetting the strict "all intermediate vertices distinct" rule for cycles. This distinction is critical for graph properties like bipartiteness, which depends on the *absence* of odd-length cycles.

# Significance & Application
Cycles and circuits are fundamental to:
*   **Network Robustness:** The presence of cycles often implies redundancy and fault tolerance in networks; if one edge fails, there might still be an alternative path.
*   **Bipartiteness:** A graph is bipartite if and only if it contains no odd-length cycles.
*   **Graph Coloring:** Understanding cycles helps in determining the chromatic number of a graph.
*   **Eulerian and Hamiltonian Graph Theory:** These specialized paths and circuits are central to determining if a graph can be traversed in specific ways (e.g., visiting every edge exactly once, or every vertex exactly once).
*   **Academic Relevance:** Foundational for many algorithms (e.g., cycle detection for deadlock prevention, graph planarity testing) and theoretical results in graph theory.

# The Worked Example
Consider the graph `G` below:
(Diagram from page 30 of the source, Graph G: vertices V1-V6, a square with diagonal and middle horizontal line, forming two triangles and a square)
Vertices: `{V1, V2, V3, V4, V5, V6}`
Edges: `{(V1,V2), (V1,V4), (V2,V3), (V2,V5), (V3,V6), (V4,V5), (V5,V6)}`

Let's identify examples of cycles and circuits:

1.  **Example of a Cycle:**
    *   `C1 = V1 - V2 - V5 - V4 - V1`
    *   Length: 4
    *   Notes: Starts and ends at `V1`. All intermediate vertices (`V2, V5, V4`) are distinct. All edges are distinct. This is a valid cycle.
    *   Another example: `C2 = V2 - V3 - V6 - V5 - V2` (Length 4)

2.  **Example of a Circuit (that is NOT a Cycle):**
    *   Consider a starting point `V1`.
    *   `Circuit1 = V1 - V2 - V5 - V2 - V3 - V6 - V5 - V4 - V1`
    *   Length: 8
    *   Notes: Starts and ends at `V1`. All edges are distinct. However, intermediate vertices `V2` and `V5` are repeated. Therefore, this is a circuit but not a cycle. (It's a trial, and it's closed, so it's a circuit).

This example highlights the importance of checking both vertex and edge repetition to correctly classify closed traversals.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** Is every cycle also a circuit? Explain why or why not.
> **Solution:** Yes, every cycle is also a circuit. A cycle is defined as a closed simple path, meaning all its edges are distinct (no repeated edges) and all its intermediate vertices are distinct. Since a circuit is a closed walk with distinct edges (allowing for repeated intermediate vertices), a cycle perfectly fits this definition, simply with the added constraint of no repeated intermediate vertices.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a small computer network with routers (vertices) and direct cable connections (edges).
`V = {R1, R2, R3, R4, R5}`
`E = {(R1,R2), (R2,R3), (R3,R1), (R3,R4), (R4,R5), (R5,R3)}`
**The Challenge:**
(a) Identify all distinct cycles of length 3 in this network.
(b) Identify a circuit that is NOT a cycle, starting and ending at `R3`.
(c) Can this network be 2-colored (i.e., is it bipartite)? Justify your answer.
> **Solution:**
> (a) **Distinct cycles of length 3:**
>     *   `R1 - R2 - R3 - R1`
>     *   This is the only cycle of length 3.
>
> (b) **Circuit that is NOT a cycle (starting and ending at `R3`):**
>     *   `R3 - R1 - R2 - R3 - R4 - R5 - R3` (Edges `(R3,R1), (R1,R2), (R2,R3), (R3,R4), (R4,R5), (R5,R3)` are distinct, but `R3` is repeated as an intermediate vertex).
>     *   Length: 6
>
> (c) No, this network **cannot be 2-colored (it is not bipartite)**. A graph is bipartite if and only if it contains no odd-length cycles. This network contains a cycle of length 3 (`R1 - R2 - R3 - R1`), which is an odd-length cycle. Therefore, it is not bipartite.

# Key Takeaways
*   Cycles are closed paths of length `≥ 3` with no repeated intermediate vertices.
*   Circuits are closed walks with no repeated edges, but they may revisit intermediate vertices.
*   Loops are cycles of length 1.
*   These concepts are fundamental to analyzing graph properties like bipartiteness and traversal algorithms.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Paths_and_Connectivity_in_Graphs]] | Cycles and circuits are specific forms of closed graph traversals. |
| [[Walks_and_Paths_in_Graphs]] | Builds upon the definitions of walks and paths, adding the constraint of closure. |
| [[Vertex_and_Edge_Properties]] | Defined by specific rules for how vertices and edges are used in closed sequences. |
| [[Bipartite_Graphs]]        | A graph is bipartite if and only if it contains no odd-length cycles. |
| [[Eulerian_Graphs]]         | Eulerian circuits are specific circuits that use every edge exactly once. |
| [[Hamiltonian_Graphs]]      | Hamiltonian cycles are specific cycles that visit every vertex exactly once. |
---