---
title: "Euler_Formula_For_Planar_Graphs"
type: "Supporting"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "3 Elements Of Graph Theory"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.079059"
last_edited_time: "2026-04-16T13:47:45.079060"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Planar_Graph_Properties_and_Faces]] and [[Planar_Graphs]] because Euler's Formula provides a fundamental numerical relationship between the key components (vertices, edges, and faces) of any connected planar graph.
**Euler's Formula for Planar Graphs** states that for any connected planar graph `G`, the following relationship holds true: `$$ \boxed{|V| - |E| + |F| = 2} $$` where:
*   `|V|` denotes the number of vertices.
*   `|E|` denotes the number of edges.
*   `|F|` denotes the number of faces (including the infinite face).
This formula is a fundamental topological invariant, meaning it holds true for any way a connected planar graph is drawn, regardless of its specific embedding or geometric distortions. Think of it as a universal checksum for any perfectly drawn 2D map.

# The Mental Model
Imagine you're building a complex structure using only sticks (edges), connectors (vertices), and flat panels (faces). If your structure is perfectly flat (planar) and all parts are connected, Euler's Formula is like a hidden rule that guarantees a specific mathematical relationship between how many connectors, sticks, and panels you've used. It doesn't matter how you arrange them, as long as it's connected and flat, the count will always work out to 2.

# Context & Framework
### The Foundation: What We Already Know
Euler's Formula for planar graphs is a beautiful and foundational result that connects three basic graph invariants: vertices, edges, and faces. It builds upon the definition of [[Planar_Graphs]] (graphs that can be drawn without edge crossings) and [[Planar_Graph_Properties_and_Faces]] (the regions formed by such a drawing). This formula provides a powerful consistency check for any planar embedding and is a cornerstone for many proofs and theorems in topological graph theory.

# The Mastery Deep Dive
### Step-by-Step Derivation
**Theorem (Euler's Formula):** For any connected planar graph `G`, `|V| - |E| + |F| = 2`.

**Proof (by induction on the number of edges):**

**Base Case:** Let `|E| = 0`.
*   If `|E| = 0` and `G` is connected, then `G` must consist of a single vertex.
*   So, `|V| = 1`.
*   The plane is not divided by any edges, so there is only one face (the infinite face). `|F| = 1`.
*   Check the formula: `|V| - |E| + |F| = 1 - 0 + 1 = 2`. (Formula holds)

**Inductive Hypothesis:** Assume the formula `|V| - |E| + |F| = 2` holds for all connected planar graphs with `k` edges.

**Inductive Step:** Consider a connected planar graph `G` with `k+1` edges.
We consider two cases for an edge `e` in `G`:

**Case 1: `e` is part of a cycle.**
*   If `e` is part of a cycle, then removing `e` will not disconnect the graph.
*   Let `G' = G - e` (the graph `G` with edge `e` removed).
*   `G'` is still connected and planar, and has `k` edges.
*   By the inductive hypothesis, `|V(G')| - |E(G')| + |F(G')| = 2`.
*   When `e` is removed, the number of vertices `|V|` remains the same. `|V(G')| = |V(G)|`.
*   The number of edges `|E|` decreases by 1. `|E(G')| = |E(G)| - 1`.
*   Since `e` was part of a cycle, its removal merges two faces into one. So, `|F|` decreases by 1. `|F(G')| = |F(G)| - 1`.
*   Substitute these into the hypothesis: `|V(G)| - (|E(G)| - 1) + (|F(G)| - 1) = 2`.
*   `|V(G)| - |E(G)| + 1 + |F(G)| - 1 = 2`.
*   `|V(G)| - |E(G)| + |F(G)| = 2`. (Formula holds for Case 1)

**Case 2: `e` is a bridge (not part of any cycle).**
*   If `e` is a bridge, removing `e` disconnects the graph into two connected components. This case is often handled by extending the formula or by showing that in a connected graph, any bridge must belong to the infinite face or that `e` connects two distinct components which means it cannot be part of a cycle. More simply, consider the effect on faces. If `e` is a bridge, it must be on the boundary of exactly one face (the infinite face) and its removal would not merge two distinct faces. Instead, it would affect the degree of the infinite face. This case requires a more careful inductive argument, often involving the graph becoming a forest or considering a slightly different hypothesis.
*   A simpler approach for connected graphs is to prove it by reduction to a tree. If `G` is a connected planar graph, we can remove edges that are part of cycles until `G` becomes a spanning tree `T`.
    *   For a tree `T` with `|V|` vertices, `|E| = |V| - 1`.
    *   A tree in a plane has only one face (the infinite face). So, `|F| = 1`.
    *   Thus, `|V| - (|V|-1) + 1 = 2`. This holds for any tree.
    *   Now, consider adding edges back to form `G`. Each time an edge is added that creates a cycle, it splits an existing face into two, increasing `|E|` by 1 and `|F|` by 1. The value `|V| - |E| + |F|` remains invariant.
    *   Therefore, the formula holds for any connected planar graph.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A critical mistake is applying Euler's Formula to graphs that are **not connected** or **not planar**. For disconnected planar graphs, the formula becomes `|V| - |E| + |F| = 1 + c`, where `c` is the number of connected components. For non-planar graphs, the formula simply doesn't hold. Many students forget the crucial preconditions of "connected" and "planar," leading to incorrect calculations and conclusions. Always ensure the graph meets these criteria before applying the formula.

# Significance & Application
Euler's Formula is profoundly significant:
*   **Consistency Check:** It provides a simple way to check the consistency of a planar graph drawing. If you've drawn a connected planar graph and `|V| - |E| + |F|` does not equal 2, you know there's an error in your count or your drawing is not truly planar.
*   **Proof Technique:** It is a powerful tool for proving other theorems about planar graphs, such as bounds on the number of edges for planar graphs (e.g., for a simple connected planar graph with `|V| >= 3`, `|E| <= 3|V| - 6`).
*   **Graph Non-Planarity:** It can be used to prove that certain graphs (like [[Complete_Graphs]] `K_5` and [[Complete_Bipartite_Graphs]] `K_{3,3}`) are non-planar by showing they violate the edge bounds implied by the formula.
*   **Academic Relevance:** A cornerstone of topological graph theory, demonstrating a deep relationship between combinatorial and geometric properties of graphs.

# The Worked Example
**Question:** Verify Euler's formula for the planar graph `K4`. (from page 56 of the source)

**Step-by-Step Verification for `K4`:**

1.  **Identify Graph Properties:**
    *   `K4` is a [[Complete_Graphs]] with 4 vertices.
    *   It is a **connected** graph.
    *   It is a **planar graph** (as shown in [[Planar_Graphs]] - it can be drawn without crossings).

2.  **Count Vertices (`|V|`):**
    *   `|V| = 4`

3.  **Count Edges (`|E|`):**
    *   For `K_n`, `|E| = n(n-1)/2`.
    *   For `K4`, `|E| = 4(4-1)/2 = 4*3/2 = 6`.
    *   `|E| = 6`

4.  **Count Faces (`|F|`):**
    *   As determined in [[Planar_Graph_Properties_and_Faces]], a planar drawing of `K4` (e.g., triangle with central vertex) has:
        *   3 internal triangular faces.
        *   1 infinite (outer) face.
    *   Total faces `|F| = 3 + 1 = 4`.

5.  **Apply Euler's Formula:**
    *   `|V| - |E| + |F| = 2`
    *   `4 - 6 + 4 = 2`
    *   `8 - 6 = 2`
    *   `2 = 2`

**Conclusion:** Euler's formula holds true for `K4`, verifying its planar graph properties.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** If a connected planar graph has 5 vertices and 6 edges, how many faces does it have?
> **Solution:** Using Euler's Formula: `|V| - |E| + |F| = 2`
> `5 - 6 + |F| = 2`
> `-1 + |F| = 2`
> `|F| = 3`.
> The graph has **3 faces** (including the infinite face).

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A new city layout is proposed as a connected planar graph. The plan has 10 intersections (vertices) and 15 roads (edges).
**The Challenge:**
(a) How many distinct regions (faces) does this city layout divide the plane into?
(b) If the city planners realize one of the roads must be elevated to cross another, would Euler's formula still directly apply to the number of regions created if we only consider the planar parts? Justify your answer.
> **Solution:**
> (a) Using Euler's Formula: `|V| - |E| + |F| = 2`
>     *   `10 - 15 + |F| = 2`
>     *   `-5 + |F| = 2`
>     *   `|F| = 7`.
>     The city layout divides the plane into **7 distinct regions** (faces, including the infinite region).
>
> (b) If one road must be elevated to cross another, and this crossing is *not* at an intersection (vertex), then the graph becomes **non-planar**. Euler's Formula, in its basic form `|V| - |E| + |F| = 2`, **would no longer directly apply** to the *entire* graph's components. The formula specifically requires the graph to be planar. While the non-planar graph could be embedded in a higher dimension or analyzed with modified formulas, the simple Euler's formula is violated by non-planarity.

# Key Takeaways
*   Euler's Formula (`|V| - |E| + |F| = 2`) is a fundamental theorem for any connected planar graph.
*   It provides a powerful relationship between the number of vertices, edges, and faces.
*   The formula serves as a consistency check and a tool for proving other graph properties, including non-planarity.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Planar_Graph_Properties_and_Faces]] | Euler's formula formalizes the relationship between the number of faces, vertices, and edges. |
| [[Planar_Graphs]]           | The formula is strictly applicable only to planar graphs.       |
| [[Advanced_Graph_Properties]] | Euler's formula is a cornerstone of advanced graph theory, linking combinatorial and topological aspects. |
| [[Vertex_and_Edge_Properties]] | The formula relies on the count of vertices and edges as fundamental graph components. |
| [[Connected_Graphs]]        | A crucial precondition for Euler's formula is that the graph must be connected. |
---