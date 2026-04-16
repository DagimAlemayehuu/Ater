---
title: "Chromatic_Number"
type: "Supporting"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "3 Elements Of Graph Theory"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.080934"
last_edited_time: "2026-04-16T13:47:45.080935"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Graph_Coloring]] and [[Advanced_Graph_Properties]] because the chromatic number is the most critical quantitative measure in graph coloring, representing the absolute minimum colors required for a valid coloring.
The **chromatic number of a graph `G`**, denoted `χ(G)` (chi of G), is the minimum number of colors needed to paint (or color) `G` so that no two adjacent vertices receive the same color. It is the smallest integer `K` for which a graph is `K`-colorable. Determining the chromatic number is a central problem in graph theory and combinatorial optimization. Think of it as the ultimate puzzle challenge: what's the absolute fewest number of unique crayons you need to color a map correctly?

# The Mental Model
Imagine you have a jigsaw puzzle (a graph) where pieces that touch (adjacent vertices) must be different colors. The **chromatic number** is the smallest number of distinct colored pens you would need to fill in all the pieces correctly. If you try with fewer pens, you'll inevitably end up with touching pieces of the same color, violating the rule.

# Context & Framework
### Let's Plug in Numbers (Watch it Work)
Calculating the chromatic number involves trying to color the graph with the fewest possible colors. This often begins with identifying a subgraph that requires a certain number of colors. For instance, if a graph contains a triangle (`K_3`), its chromatic number must be at least 3, because the three vertices of the triangle must all have different colors. This "plugging in numbers" or systematically assigning colors helps to find this minimum value.

# The Mastery Deep Dive
### The "Oops!" List: Where Everyone Fails
A common error in determining the chromatic number is incorrectly assuming a smaller number of colors is possible. This often happens by overlooking a critical cycle (especially an odd-length cycle, which immediately requires at least 3 colors) or failing to consider all adjacencies. Another trap is getting stuck in a local optimal coloring that uses more colors than necessary. Since finding the chromatic number is NP-hard, simple greedy algorithms don't always yield the true minimum.

# Constraints & Limitations
### The "Grandma Test"
The idea of a "minimum" number of colors can be hard to grasp if a non-technical person thinks "why not just use all the colors?" The "trap" is that the constraint (adjacent vertices different colors) makes minimizing the colors a non-trivial puzzle. For simple cases, visual intuition works, but for complex graphs, proving a specific number is minimal is a rigorous mathematical task that is far from intuitive. Moreover, the Four-Color Theorem (stating that any planar graph can be 4-colored) is famously difficult to prove, highlighting the complexity of this "simple" concept.

# Significance & Application
The chromatic number is highly significant for practical and theoretical reasons:
*   **Optimal Resource Allocation:** In scheduling problems, it directly gives the minimum number of time slots, channels, or resources required.
    *   **Exam Scheduling:** If `χ(G) = 3`, then 3 time slots are the absolute minimum needed for non-conflicting exams.
    *   **Register Allocation:** Minimum CPU registers for compiler optimization.
*   **Network Design:** Assigning non-interfering frequencies in wireless networks.
*   **Bipartiteness Check:** A graph is bipartite if and only if its chromatic number is `χ(G) ≤ 2`.
*   **Academic Relevance:** A central concept in graph theory, combinatorial optimization, and computational complexity (it's an NP-hard problem). The "Four-Color Theorem" (planar graphs are 4-colorable) is one of the most famous theorems in mathematics.

# The Worked Example
Consider the graphs G and H shown on page 58 of the source and find their chromatic numbers.

1.  **Graph G:**
    *   Vertices: `A, B, C, D, E, F` (a 2x3 grid graph)
    *   Edges: Standard grid connections.
    *   **Analysis:** This is a rectangular grid graph. We can color it like a chessboard.
        *   `A`: Color 1. `B`: Color 2. `C`: Color 1.
        *   `D`: Color 2. `E`: Color 1. `F`: Color 2.
    *   No two adjacent vertices have the same color.
    *   Since it can be colored with 2 colors, and it's not 1-colorable (it has edges, so it's not an empty graph), `χ(G) = 2`.
    *   This is a [[Bipartite_Graphs]].

2.  **Graph H:**
    *   Vertices: `A, B, C, D, E, F` (two triangles connected by a shared vertex or edge, making it into 6 vertex graph)
    *   Let's trace: Left part forms a triangle `A-B-C-A`. Right part forms a triangle `D-E-F-D`. `C` and `E` are connected, `B` and `E` are connected. `A` is connected to `B` and `C`. `B` is connected to `A` and `C`. `C` is connected to `A` and `B`. This forms a `K3` triangle (A,B,C).
    *   `D` is connected to `E` and `F`. `E` is connected to `D` and `F`. `F` is connected to `D` and `E`. This forms another `K3` triangle (D,E,F).
    *   From image, `A-B-C` is a triangle. `D-E-F` is another triangle. The connection is `C-E` (from original source diagram).
    *   Let's analyze the new image of H:
        *   `A,B,C` form a triangle.
        *   `D,E,F` form a triangle.
        *   `C` is connected to `E`. (From image in source)
    *   **Analysis:**
        *   Since `A-B-C-A` is a triangle (`K_3`), at least 3 colors are needed for these vertices.
            *   `A`: Color 1
            *   `B`: Color 2
            *   `C`: Color 3
        *   Now for the second triangle `D-E-F-D`.
        *   `E` is adjacent to `C` (Color 3). So `E` cannot be Color 3.
        *   Let `E`: Color 1 (OK, not adjacent to `A` or `B`)
        *   `D`: Conflicts with `E` (Color 1). So `D` can be Color 2.
        *   `F`: Conflicts with `E` (Color 1) and `D` (Color 2). So `F` can be Color 3.
        *   This uses **3 colors**. For example: `(A,D,E)` as Color 1, `(B,D)` as Color 2, `(C,F)` as Color 3.
    *   So, `χ(H) = 3`.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** If a graph `G` contains a cycle of length 5 (`C_5`), what is the minimum possible value for `χ(G)`?
> **Solution:** If a graph `G` contains a cycle of length 5 (`C_5`), it is an odd-length cycle. Any graph with an odd-length cycle is not bipartite and thus requires at least 3 colors. Therefore, the minimum possible value for `χ(G)` is **3**.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A telecom company is assigning frequency channels to 5 cellular towers (`T1, T2, T3, T4, T5`). Towers that are geographically close (`adjacent`) interfere with each other and must use different frequency channels.
*   `T1` is close to `T2`, `T3`, `T5`.
*   `T2` is close to `T1`, `T3`, `T4`.
*   `T3` is close to `T1`, `T2`, `T4`.
*   `T4` is close to `T2`, `T3`, `T5`.
*   `T5` is close to `T1`, `T4`.
**The Challenge:**
(a) What is the formal name for this type of problem in graph theory?
(b) Determine the chromatic number of this graph. What is the minimum number of frequency channels required?
(c) If `T3` and `T5` were *not* close, how would the chromatic number change?
> **Solution:**
> (a) This is a **graph coloring problem**, specifically determining the **chromatic number** of the graph.
>
> (b) Let's model the graph and try to color it.
>     *   Vertices: `T1, T2, T3, T4, T5`
>     *   Edges:
>         *   `T1`: `(T1,T2), (T1,T3), (T1,T5)`
>         *   `T2`: `(T2,T1), (T2,T3), (T2,T4)`
>         *   `T3`: `(T3,T1), (T3,T2), (T3,T4)`
>         *   `T4`: `(T4,T2), (T4,T3), (T4,T5)`
>         *   `T5`: `(T5,T1), (T5,T4)`
>     *   This graph forms a [[Complete_Graphs]] `K_5`. Each vertex has a degree of 4, and each is connected to every other.
>     *   The chromatic number of `K_n` is `n`. For `K_5`, `χ(G) = 5`.
>     *   Therefore, the minimum number of frequency channels required is **5**.
>
> (c) If `T3` and `T5` were *not* close, then the graph would no longer be `K_5`. The edges `(T3,T5)` would be removed.
>     *   Let's check for cycles. The graph would now be `K_5` minus one edge.
>     *   This modified graph still contains `K_4` as a subgraph (e.g., `T1,T2,T3,T4` are all mutually connected except `T1-T4`).
>     *   A graph containing `K_4` as a subgraph needs at least 4 colors.
>     *   Let's try to 4-color `K_5` minus `(T3,T5)`:
>         *   `T1`: C1
>         *   `T2`: C2
>         *   `T3`: C3 (Not adjacent to T5)
>         *   `T4`: C4
>         *   `T5`: Adjacent to `T1`(C1), `T4`(C4). Not adjacent to `T2`(C2), `T3`(C3). So `T5` can be C2 or C3.
>         *   Let `T5`: C2.
>         *   This works! `T1:C1, T2:C2, T3:C3, T4:C4, T5:C2`.
>     *   The chromatic number would change from 5 to **4**.

# Key Takeaways
*   The chromatic number (`χ(G)`) is the minimum number of colors required for a valid vertex coloring.
*   It is a crucial metric for optimal resource allocation and scheduling problems.
*   Identifying cliques and odd-length cycles can help determine a lower bound for the chromatic number.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Graph_Coloring]]          | The chromatic number is the optimal outcome of a graph coloring problem. |
| [[Advanced_Graph_Properties]] | Chromatic number is a key advanced structural property related to graph partitioning. |
| [[Vertex_and_Edge_Properties]] | The calculation of chromatic number is entirely based on vertex adjacency. |
| [[Bipartite_Graphs]]        | Bipartite graphs have a chromatic number of 1 or 2.             |
| [[Complete_Graphs]]         | The chromatic number of a complete graph `K_n` is `n`.          |
| [[Cycles_and_Circuits_in_Graphs]] | Odd-length cycles imply a chromatic number of at least 3.       |
---