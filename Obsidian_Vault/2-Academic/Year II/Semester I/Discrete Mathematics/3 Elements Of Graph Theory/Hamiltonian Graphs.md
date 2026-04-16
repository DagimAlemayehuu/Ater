---
title: "Hamiltonian_Graphs"
type: "Core"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "3 Elements Of Graph Theory"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.081645"
last_edited_time: "2026-04-16T13:47:45.081646"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Paths_and_Connectivity_in_Graphs]] and [[Walks_and_Paths_in_Graphs]] because Hamiltonian graphs are defined by the existence of specific types of paths or cycles that visit every vertex exactly once.
A **Hamiltonian path** (or **Hamilton path**) is a path that visits every vertex in a graph `G` exactly once. A **Hamiltonian cycle** (or **Hamilton cycle/circuit**) is a closed Hamiltonian path, meaning it visits every vertex exactly once and returns to its starting vertex. A graph `G` is called a **Hamiltonian graph** if it admits a Hamiltonian cycle.
Unlike Eulerian paths/cycles (which traverse every edge exactly once), Hamiltonian paths/cycles focus on visiting every *vertex* exactly once. Think of it as a traveling salesperson's route: they need to visit every city exactly once, either ending in a different city (path) or returning to their starting city (cycle).

# The Mental Model
Imagine you're an explorer trying to visit every single unique landmark in a foreign city. If you can plan a route that takes you to *every* landmark without ever revisiting one, that's a **Hamiltonian path**. If you can do that and also end up back at your starting landmark, that's a **Hamiltonian cycle**. The challenge is to hit every spot exactly once, making efficient use of your journey.

# Context & Framework
### The Hard Choice: Option A or Option B?
The problems of finding Eulerian and Hamiltonian paths/cycles are often compared, but they represent fundamentally different challenges and are solved by different strategies.

| Feature                    | Eulerian Path/Cycle                                            | Hamiltonian Path/Cycle                                        | "The Gotcha" Difference                                      |
| :
------------------------- | :
------------------------------------------------------------- | :
------------------------------------------------------------ | :
----------------------------------------------------------- |
| **Goal**                   | Traverse every **edge** exactly once.                          | Visit every **vertex** exactly once.                          | Focus on edges vs. focus on vertices.                        |
| **Edge Repetition**        | No                                                             | Allowed (edges may be repeated in a walk, but in a path, edges are distinct) | Hamiltonian *paths* and *cycles* by definition (as paths) do not repeat edges. |
| **Vertex Repetition**      | Allowed (in Eulerian paths/cycles, intermediate vertices can be repeated) | No (vertices are visited exactly once, except start/end for cycle) | Strict non-repetition of vertices.                           |
| **Conditions for Existence** | Simple conditions based on vertex degrees (Euler's Theorem).     | No simple necessary and sufficient conditions known.         | Computationally much harder.                                |
| **"The Gotcha" Difference"** | Easy to check if exists.                                       | Hard to check if exists (NP-complete problem).               | The complexity is vastly different.                          |

# The Mastery Deep Dive
### The "Decision Matrix" Table
Deciding whether a graph is Hamiltonian or Eulerian often involves a systematic comparison of their defining properties and known conditions.

| Property                               | Graph `G` is Eulerian if...                         | Graph `G` is Hamiltonian if...                      |
| :
------------------------------------- | :
-------------------------------------------------- | :
-------------------------------------------------- |
| **Primary Focus**                      | Every edge traversed exactly once.                  | Every vertex visited exactly once.                  |
| **Connectivity**                       | Must be connected (ignoring isolated vertices).  | Must be connected (though not explicitly required by some theorems, a path cannot exist in a disconnected graph). |
| **Vertex Degree Condition (Cycle)**    | All vertices have even degree.                      | No simple necessary & sufficient condition. (See Dirac's/Ore's) |
| **Vertex Degree Condition (Path)**     | Exactly two vertices have odd degree.               | No simple necessary & sufficient condition.         |
| **Computational Complexity**           | Relatively easy to check (polynomial time).         | NP-complete (computationally hard).                 |
| **"Winner" in Clarity/Predictability** | Eulerian (Clear conditions)                         | Neither (No clear conditions)                       |

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
The biggest trap with Hamiltonian graphs is assuming there's a simple "Euler-like" theorem to determine their existence. Unlike Eulerian circuits, there are no simple necessary *and* sufficient conditions to tell if a graph has a Hamiltonian path or cycle. Many students mistakenly try to apply degree parity rules. Another common error is thinking that if a graph has many edges, it *must* be Hamiltonian; this is not true. The problem of finding Hamiltonian cycles is famously NP-complete, meaning there's no known efficient algorithm for all graphs.

# Significance & Application
Hamiltonian graphs, despite the computational difficulty of finding them, have significant applications:
*   **Traveling Salesperson Problem (TSP):** A classic optimization problem to find the shortest possible route that visits a set of cities and returns to the origin city. This is directly a Hamiltonian cycle problem with weighted edges.
*   **Logistics and Routing:** Used in planning delivery routes, circuit board drilling, and optimizing manufacturing processes.
*   **Computer Science:** Applied in parallel processing, genome sequencing, and certain types of scheduling problems.
*   **Academic Relevance:** The Hamiltonian cycle problem is one of the most famous NP-complete problems, a fundamental concept in theoretical computer science.

# The Worked Example
Consider two graphs, `G1` and `G2`:
(Diagram from page 46 of the source - G1 is a 6-vertex rectangular grid with diagonals, G2 is a 4-vertex diamond with an internal edge)

**Graph G1:** (V1, V2, V3, V4, V5, V6) - A 2x2 grid with two central diagonals and an internal connecting edge.
Edges: `(V1,V2), (V2,V3), (V3,V4), (V4,V5), (V5,V6), (V6,V1), (V1,V5), (V2,V4), (V2,V6), (V3,V5)`

**Graph G2:** (A, B, C, D, E, F) - A graph that looks like a square with internal connections.
Edges: `(A,B), (B,C), (C,D), (D,A), (A,F), (B,F), (C,E), (D,E), (E,F)` (from context, it is a graph used to discuss Hamiltonian vs. Eulerian in the source)

Let's determine if `G1` is Hamiltonian and/or Eulerian.

1.  **Analyze `G1` for Hamiltonian Cycle:**
    *   `G1` has 6 vertices. We need to visit each vertex exactly once and return to the start.
    *   Consider the path `V1 - V2 - V3 - V4 - V5 - V6 - V1`. This visits all vertices once and returns to `V1`.
    *   This is a Hamiltonian cycle. Therefore, `G1` is a Hamiltonian graph.

2.  **Analyze `G1` for Eulerian Cycle:**
    *   Calculate degrees:
        *   `deg(V1) = 3` (V2, V6, V5)
        *   `deg(V2) = 4` (V1, V3, V4, V6)
        *   `deg(V3) = 3` (V2, V4, V5)
        *   `deg(V4) = 4` (V2, V3, V5, V6)
        *   `deg(V5) = 4` (V1, V3, V4, V6)
        *   `deg(V6) = 4` (V1, V2, V4, V5)
    *   `G1` has two vertices with odd degrees (`V1`, `V3`).
    *   By Euler's Theorem, since there are exactly two odd-degree vertices, `G1` has an Eulerian path (starting at `V1` and ending at `V3`, or vice-versa), but **no Eulerian cycle**.
    *   Therefore, `G1` is **not** an Eulerian graph.

**Conclusion for `G1`:** `G1` is Hamiltonian but not Eulerian.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What is the key difference in traversal between an Eulerian cycle and a Hamiltonian cycle?
> **Solution:** An **Eulerian cycle** traverses every **edge** exactly once, while a **Hamiltonian cycle** visits every **vertex** exactly once (except the starting/ending vertex, which is visited twice).

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You are optimizing a drone delivery route. The drone must visit every customer location (`C1` to `C5`) exactly once. All locations are connected in a circular fashion (`C1-C2-C3-C4-C5-C1`), and there's also a direct connection between `C1` and `C3`, and `C2` and `C4`.
**The Challenge:**
(a) Is it possible for the drone to start at `C1`, visit every customer location exactly once, and return to `C1`? If so, give one such route.
(b) Is it possible for the drone to start at `C1`, visit every customer location exactly once, and end at `C5`? If so, give one such route.
(c) Can this graph be an Eulerian graph? Justify your answer.
> **Solution:**
> (a) Yes, it is **possible** for the drone to complete a Hamiltonian cycle. The graph described is a cycle `C_5` with two additional "chords" (`C1-C3` and `C2-C4`).
>     *   One possible Hamiltonian cycle: `C1 - C2 - C4 - C3 - C5 - C1`.
>
> (b) Yes, it is **possible** for the drone to complete a Hamiltonian path.
>     *   One possible Hamiltonian path: `C1 - C2 - C3 - C4 - C5`. (Starts at C1, ends at C5, visits all vertices once).
>
> (c) We need to check the degrees of the vertices to determine if it can be an Eulerian graph.
>     *   `deg(C1)`: connected to `C2, C5, C3`. So, `deg(C1) = 3` (odd).
>     *   `deg(C2)`: connected to `C1, C3, C4`. So, `deg(C2) = 3` (odd).
>     *   `deg(C3)`: connected to `C2, C4, C1, C5`. So, `deg(C3) = 4` (even). (Note: C1-C3 and C2-C3 are edges. So C3 connects to C1, C2, C4, C5).
>     *   `deg(C4)`: connected to `C3, C5, C2`. So, `deg(C4) = 3` (odd).
>     *   `deg(C5)`: connected to `C4, C1, C3`. So, `deg(C5) = 3` (odd).
>     The graph has four vertices with odd degrees (`C1, C2, C4, C5`). Since there are more than two odd-degree vertices, by Euler's Theorem, this graph **cannot be an Eulerian graph** (it has neither an Eulerian path nor an Eulerian cycle).

# Key Takeaways
*   Hamiltonian paths visit every vertex exactly once; Hamiltonian cycles are closed Hamiltonian paths.
*   Finding Hamiltonian paths/cycles is generally a computationally difficult problem, lacking simple degree-based criteria like Eulerian graphs.
*   They are critical for problems like the Traveling Salesperson Problem and various routing applications.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Paths_and_Connectivity_in_Graphs]] | Hamiltonian paths and cycles are specific types of graph traversals focused on vertex visitation. |
| [[Walks_and_Paths_in_Graphs]] | Builds upon the definition of paths, adding the constraint of visiting all vertices. |
| [[Cycles_and_Circuits_in_Graphs]] | Hamiltonian cycles are a special type of cycle that spans all vertices. |
| [[Eulerian_Graphs]]         | Often contrasted with Eulerian graphs due to their different focus (edges vs. vertices) and computational complexity. |
| [[Connected_Graphs]]        | A Hamiltonian path or cycle can only exist in a connected graph. |
---