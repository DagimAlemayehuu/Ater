---
title: "Adjacency_Matrix"
type: "Core"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "3 Elements Of Graph Theory"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.082380"
last_edited_time: "2026-04-16T13:47:45.082381"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Graph_Matrices]] and [[Vertex_and_Edge_Properties]] because the adjacency matrix is a specific type of graph matrix that explicitly defines the relationships between pairs of vertices.
The **adjacency matrix** `A = (aij)` of a graph `G` with `m` vertices (ordered as `v1, v2, ..., vm`) is an `m x m` square matrix. Its entries are defined as:
*   `aij = n`, if there are `n` edges joining vertex `vi` and vertex `vj`.
*   `aij = 0`, otherwise.
For undirected graphs, the adjacency matrix is symmetric (`aij = aji`). For simple graphs (no loops or multiple edges), `aij` will only be 0 or 1, and all diagonal entries (`aii`) will be 0. Think of it as a direct lookup table for connections between any two points in a network.

# The Mental Model
Imagine a bus route map for a city. The **adjacency matrix** is like a giant spreadsheet where each row and column header is a bus stop (a vertex). If there's a direct bus route (an edge) between Stop A and Stop B, you'd put a '1' in the cell where Row A meets Column B. If there are two different bus lines connecting them, you'd put a '2'. If there's no direct route, you put a '0'. You can quickly see all direct connections from any stop to any other stop.

# Context & Framework
### How the Parts Talk to Each Other
The adjacency matrix provides a complete snapshot of how every vertex in a graph "talks" to every other vertex directly. The value `aij` explicitly states *how many* direct lines of communication (edges) exist between `vi` and `vj`. This systematic, pair-wise representation allows for powerful algebraic manipulation. For instance, multiplying the adjacency matrix by itself (`A^2`) gives a matrix where `(A^2)ij` represents the number of walks of length 2 between `vi` and `vj`. This demonstrates the matrix's utility in inferring indirect connections.

# The Mastery Deep Dive
### The "Benchmark Comparison" Code Pair
Representing a graph using an adjacency matrix is straightforward for computational systems. Here, we'll compare a simple adjacency matrix for a small graph.

```python
# --- START_CODE:python ---
# Scenario 1: Simple undirected graph without loops or multiple edges
# Vertices: 0, 1, 2, 3
# Edges: (0,1), (0,2), (1,2), (2,3)

adj_matrix_simple = [
    [0, 1, 1, 0],  # 0 is connected to 1, 2
    [1, 0, 1, 0],  # 1 is connected to 0, 2
    [1, 1, 0, 1],  # 2 is connected to 0, 1, 3
    [0, 0, 1, 0]   # 3 is connected to 2
]

print("Adjacency Matrix (Simple Graph):")
for row in adj_matrix_simple:
    print(row)

print("\n---")

# Scenario 2: Graph with multiple edges and a loop
# Vertices: A(0), B(1), C(2)
# Edges: (A,B), (A,B), (B,C), (C,C)
# (A,B) has 2 edges, (B,C) has 1 edge, (C,C) is a loop

adj_matrix_complex = [
    [0, 2, 0],  # A is connected to B with 2 edges
    [2, 0, 1],  # B is connected to A with 2 edges, C with 1 edge
    [0, 1, 1]   # C is connected to B with 1 edge, and has a loop (C,C)
]

print("Adjacency Matrix (Complex Graph):")
for row in adj_matrix_complex:
    print(row)
# --- END_CODE:python ---
``````text
```text
Adjacency Matrix (Simple Graph):
[0, 1, 1, 0]
[1, 0, 1, 0]
[1, 1, 0, 1]
[0, 0, 1, 0]

---
Adjacency Matrix (Complex Graph):
[0, 2, 0]
[2, 0, 1]
[0, 1, 1]
```
*Note: This Python code illustrates how adjacency matrices are constructed for both simple graphs and graphs with multiple edges and loops.*

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A significant limitation of the adjacency matrix is its space complexity. For a graph with `m` vertices, the matrix requires `m^2` storage, even if the graph is sparse (i.e., has relatively few edges). This means for a graph with 1,000 vertices, it needs 1,000,000 entries. For very large graphs (e.g., social networks with billions of users), this becomes impractical. Developers often fail to consider this quadratic growth when choosing graph representations, leading to memory inefficiencies.

# Significance & Application
The adjacency matrix is invaluable for:
*   **Pathfinding Algorithms:** Algorithms like Floyd-Warshall (for all-pairs shortest paths) and some implementations of breadth-first search (BFS) or depth-first search (DFS) can utilize adjacency matrices.
*   **Graph Traversals:** Easy to check if an edge exists between two vertices in `O(1)` time.
*   **Connectivity Analysis:** Used to determine reachability between vertices (e.g., `A^k` gives paths of length `k`).
*   **Eigenvalue Analysis:** The eigenvalues of the adjacency matrix provide crucial information about the graph's structure, such as its connectivity, bipartiteness, and spectral properties.
*   **Academic Relevance:** Forms a core component of algebraic graph theory, allowing researchers to apply powerful tools from linear algebra to graph problems.

# The Worked Example
Consider the graph `G` below:
(Diagram from page 18 of the source, Graph G)
Vertices: `V1, V2, V3, V4`
Edges: `e1=(V1,V2)`, `e2=(V1,V3)`, `e3=(V2,V3)`, `e4=(V3,V4)`

**Step-by-Step Determination of the Adjacency Matrix:**

1.  **Determine the order of the matrix:**
    *   Since there are 4 vertices, the adjacency matrix will be `4x4`. Let's order the vertices as `V1, V2, V3, V4`.

2.  **Populate the matrix entries (aij):**
    *   **`a11` (V1-V1):** No loop at V1. So, `a11 = 0`.
    *   **`a12` (V1-V2):** One edge `e1`. So, `a12 = 1`.
    *   **`a13` (V1-V3):** One edge `e2`. So, `a13 = 1`.
    *   **`a14` (V1-V4):** No direct edge. So, `a14 = 0`.

    *   **`a21` (V2-V1):** One edge `e1`. So, `a21 = 1`.
    *   **`a22` (V2-V2):** No loop. So, `a22 = 0`.
    *   **`a23` (V2-V3):** One edge `e3`. So, `a23 = 1`.
    *   **`a24` (V2-V4):** No direct edge. So, `a24 = 0`.

    *   **`a31` (V3-V1):** One edge `e2`. So, `a31 = 1`.
    *   **`a32` (V3-V2):** One edge `e3`. So, `a32 = 1`.
    *   **`a33` (V3-V3):** No loop. So, `a33 = 0`.
    *   **`a34` (V3-V4):** One edge `e4`. So, `a34 = 1`.

    *   **`a41` (V4-V1):** No direct edge. So, `a41 = 0`.
    *   **`a42` (V4-V2):** No direct edge. So, `a42 = 0`.
    *   **`a43` (V4-V3):** One edge `e4`. So, `a43 = 1`.
    *   **`a44` (V4-V4):** No loop. So, `a44 = 0`.

3.  **Construct the Adjacency Matrix A:**
$$ \boxed{A = \begin{pmatrix} 0 & 1 & 1 & 0 \\ 1 & 0 & 1 & 0 \\ 1 & 1 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{pmatrix}} $$`

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** For a simple undirected graph, what values can the entries of its adjacency matrix take, and what is the significance of the diagonal entries?
> **Solution:** Entries can only be **0 or 1**. The diagonal entries (where `i=j`) are always **0**, indicating no loops in a simple graph.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** An automated system generates the following adjacency matrix `M` for an undirected graph:
`$$ M = \begin{pmatrix} 0 & 2 & 0 & 1 \\ 2 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 \\ 1 & 1 & 0 & 0 \end{pmatrix} $$`
**The Challenge:**
(a) Determine the degree of each vertex.
(b) Determine the number of edges in the graph.
(c) Identify any loops or multiple edges present in the graph.
> **Solution:**
> (a) **Degree of each vertex:** The degree of `vi` is the sum of entries in its row (or column) if there are no loops. If there are loops (diagonal entry `>0`), add twice the number of loops.
>     *   `deg(v1) = 0 + 2 + 0 + 1 = 3`
>     *   `deg(v2) = 2 + 0 + 0 + 1 = 3`
>     *   `deg(v3) = 0 + 0 + 0 + 0 = 0` (isolated vertex)
>     *   `deg(v4) = 1 + 1 + 0 + 0 = 2`
>
> (b) **Number of edges:** Sum of degrees = `3 + 3 + 0 + 2 = 8`. By Handshaking Lemma, `2|E| = 8`, so `|E| = 4`.
>
> (c) **Loops or multiple edges:**
>     *   `a12 = 2` (and `a21 = 2` due to symmetry) indicates **two multiple edges** between `v1` and `v2`.
>     *   There are no loops, as all diagonal entries are 0.

# Key Takeaways
*   The adjacency matrix provides a direct, algebraic representation of connections between vertices.
*   It is symmetric for undirected graphs, and its entries indicate the number of edges between vertices.
*   Diagonal entries denote loops; values greater than 1 indicate multiple edges.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Graph_Matrices]]          | Adjacency matrix is a primary type of graph matrix.               |
| [[Vertex_and_Edge_Properties]] | Entries in the matrix directly reflect the presence and count of edges between vertices. |
| [[Degree_of_a_Vertex]]      | Vertex degrees can be derived by summing rows or columns of the adjacency matrix. |
| [[Isomorphic_Graphs]]       | Adjacency matrices can be used as a tool to check for graph isomorphism. |
| [[Connected_Graphs]]        | Powers of the adjacency matrix can reveal connectivity and paths in a graph. |
---