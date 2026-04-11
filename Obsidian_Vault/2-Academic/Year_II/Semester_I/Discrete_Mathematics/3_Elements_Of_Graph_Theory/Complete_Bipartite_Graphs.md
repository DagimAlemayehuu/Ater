---
title: Complete_Bipartite_Graphs
created_at: '2026-01-22T09:21:37Z'
last_modified: '2026-01-22T09:21:37Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 1e47ac42-e065-4dc6-8070-ea77133f0e62
type: Supporting
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture 3 - Elements_of_Graph_Theory
aliases: 
- K_m_n_Graphs
- Fully_Connected_Bipartite_Graphs
unit: 3_Elements_Of_Graph_Theory
parent: Bipartite_Graphs
---

# Definition
Before proceeding, ensure you master [[Bipartite_Graphs]] and [[Complete_Graphs]] because complete bipartite graphs combine the partitioning property of bipartite graphs with the maximal connectivity property of complete graphs, but only *between* the two sets.
A **complete bipartite graph** is a graph for which its vertices `V` are partitioned into two disjoint and independent subsets, `M` and `N`, and *every vertex in `M` is connected to every vertex in `N`*. It is denoted by `K_{m,n}`, where `m` is the number of vertices in set `M` (`|M| = m`) and `n` is the number of vertices in set `N` (`|N| = n`). Conventionally, `m ≤ n`. Think of it as a perfect match-making service where every single person in one group is matched with every single person in the other group, but no one within the same group is matched.

# The Mental Model
Imagine a classroom where boys (set M) and girls (set N) are doing a group project, and the rule is that every single boy *must* collaborate with every single girl. There are no collaborations *between* boys, and none *between* girls. This creates a dense, specific pattern of cross-group interaction. If you have 3 boys and 4 girls, it's a `K_{3,4}`.

# Context & Framework
### Spot the Impostor (Don't be Fooled)
A critical "impostor" test for complete bipartite graphs is to distinguish them from merely [[Bipartite_Graphs]] or [[Complete_Graphs]]. A graph can be bipartite without being *complete bipartite* (e.g., a path of length 3 is bipartite but not complete bipartite). Similarly, a complete bipartite graph is *never* a complete graph unless one of the sets `M` or `N` has only one vertex, or it's just `K_{1,1}`. The key is the "every vertex in M connected to every vertex in N" clause, which is stricter than simply "edges only between sets."

# The Mastery Deep Dive
### The "Kill Sheet" Comparison Table
To master complete bipartite graphs, it's crucial to highlight their unique characteristics compared to related graph types.

| Feature                    | Complete Bipartite Graph (`K_{m,n}`)                       | Bipartite Graph                                          | Complete Graph (`K_n`)                                | "The Gotcha" Difference                                      |
| :
------------------------- | :
----------------------------------------------------------- | :
------------------------------------------------------- | :
---------------------------------------------------- | :
----------------------------------------------------------- |
| **Vertex Partition**       | `V = M ∪ N`, `M ∩ N = {}`                                  | `V = M ∪ N`, `M ∩ N = {}`                                | Not applicable (all vertices are undifferentiated)    | Shared property with general bipartite graphs.             |
| **Edge Connectivity**      | Every vertex in `M` connected to *every* vertex in `N`.    | Edges *only* between `M` and `N` (not necessarily all). | Every vertex connected to *every other* vertex.       | `K_{m,n}` requires maximal cross-set connectivity.         |
| **Edges Within Sets**      | No edges within `M`, no edges within `N`.                    | No edges within `M`, no edges within `N`.                | Edges within sets are explicitly allowed/required.    | Shared property with general bipartite graphs.             |
| **Number of Edges**        | `m * n`                                                      | `≤ m * n` (for partition size m, n)                      | `n(n-1)/2`                                            | `K_{m,n}` has a simple multiplicative edge count.         |
| **Degree of Vertices**     | Vertices in `M` have degree `n`. Vertices in `N` have degree `m`. | Can vary, but degrees `≤ n` for `M` and `≤ m` for `N`. | All vertices have degree `n-1`.                       | Degrees reflect connections *across* the partition.        |
| **Is it a `K_n`?**         | Only if `m=1, n=1` (i.e., `K_{1,1}` which is `K_2`).          | Never (unless `K_{1,1}`).                               | Always (by definition).                               | Distinct concepts unless very trivial.                      |
| **"The Gotcha" Difference** | Maximally dense between partitions, but sparse overall.      | Just partitions, not necessarily dense connections.      | Maximally dense overall.                              | Focus on where the density occurs.                           |

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A common error is miscalculating the number of edges in `K_{m,n}`. People often mistakenly apply the `n(n-1)/2` formula from [[Complete_Graphs]] or get confused by the two different partition sizes. Another trap is failing to correctly draw `K_{m,n}` for specific `m` and `n`, leading to missing edges or incorrect connections within partitions. The definition explicitly states "every vertex in M is connected to every vertex in N," which requires careful execution.

# Significance & Application
Complete bipartite graphs are especially important in:
*   **Modeling Relations:** Effectively model relationships where two distinct types of entities interact exhaustively (e.g., users and movies they've all rated, employees and projects they all work on).
*   **Assignment Problems:** They form the basis for many network flow and matching algorithms, particularly in Matching_In_Graphs, which seek to find optimal assignments between two sets.
*   **Graph Theory Theory:** They are fundamental examples and counterexamples in various graph theory proofs, particularly concerning connectivity, planarity, and Hamiltonian cycles.
*   **Academic Relevance:** They are a well-understood class of graphs with predictable properties, making them valuable for illustrating concepts and testing hypotheses.

# The Worked Example
**Question:** What will be the number of edges of a complete bipartite graph `K_{m,n}`?

**Step-by-Step Derivation:**

1.  **Understand the structure:** In a complete bipartite graph `K_{m,n}`, there are two disjoint sets of vertices, `M` with `m` vertices and `N` with `n` vertices.
2.  **Definition of "complete":** Every single vertex in set `M` is connected to *every single* vertex in set `N`.
3.  **Count connections from one side:**
    *   Consider a single vertex in set `M`. It is connected to all `n` vertices in set `N`.
    *   Since there are `m` such vertices in set `M`, and each connects to `n` vertices in `N`, the total number of connections (edges) is `m * n`.
4.  **No double counting:** Because edges only exist *between* the two sets, and not within them, there is no double-counting of edges (unlike in a complete graph `K_n` where each edge is counted twice when summing degrees).

Therefore, the number of edges in `K_{m,n}` is `m * n`.

**Example:** Draw the Complete bipartite graphs `K_{1,5}, K_{2,4}, K_{3,3}`. (from page 38 of the source)
*   **`K_{1,5}`:** One vertex in `M`, five in `N`. The single vertex in `M` connects to all 5 vertices in `N`. Total edges: `1 * 5 = 5`.
*   **`K_{2,4}`:** Two vertices in `M`, four in `N`. Each of the 2 vertices in `M` connects to all 4 vertices in `N`. Total edges: `2 * 4 = 8`.
*   **`K_{3,3}`:** Three vertices in `M`, three in `N`. Each of the 3 vertices in `M` connects to all 3 vertices in `N`. Total edges: `3 * 3 = 9`.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** In a complete bipartite graph `K_{3,5}`, what is the degree of a vertex in the set with 3 vertices?
> **Solution:** The degree of a vertex in the set with 3 vertices (set `M`) is equal to the number of vertices in the other set (set `N`), which is **5**.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A new online game connects players (type P) with game servers (type S). Every player must have a direct connection to every available game server, but players cannot connect to other players, and servers cannot connect to other servers. There are 4 players and 3 game servers.
**The Challenge:**
(a) What is the specific notation for this graph?
(b) How many direct connections (edges) are there in this game network?
(c) Is it possible for this network to have a cycle of length 5? Justify your answer.
> **Solution:**
> (a) This network forms a **complete bipartite graph**, denoted as `K_{4,3}` (or `K_{3,4}` by convention, if `m <= n`).
>
> (b) The number of direct connections (edges) is `m * n`.
>     *   `|E| = 4 * 3 = 12` direct connections.
>
> (c) No, it is **not possible** for this network to have a cycle of length 5. Complete bipartite graphs, like all bipartite graphs, **cannot contain any odd-length cycles**. All cycles in a bipartite graph must have an even length.

# Key Takeaways
*   Complete bipartite graphs (`K_{m,n}`) partition vertices into two sets and connect every vertex in one set to every vertex in the other.
*   The number of edges in `K_{m,n}` is `m * n`.
*   They are a specialized type of bipartite graph with maximal cross-partition connectivity and no odd-length cycles.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Bipartite_Graphs]]        | Complete bipartite graphs are a specialized and maximally connected form of bipartite graphs. |
| [[Complete_Graphs]]         | Contrasts with complete graphs, where all vertices are connected regardless of partition. |
| [[Vertex_and_Edge_Properties]] | Defined by specific rules for how vertices in two distinct sets are connected by edges. |
| [[Paths_and_Connectivity_in_Graphs]] | Understanding connectivity in `K_{m,n}` involves paths strictly alternating between partitions. |
| [[Cycles_and_Circuits_in_Graphs]] | `K_{m,n}` (like all bipartite graphs) contains no odd-length cycles. |
---