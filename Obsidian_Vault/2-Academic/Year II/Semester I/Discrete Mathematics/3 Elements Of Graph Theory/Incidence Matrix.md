---
title: "Incidence_Matrix"
type: "Core"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "3 Elements Of Graph Theory"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.080271"
last_edited_time: "2026-04-16T13:47:45.080273"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Graph_Matrices]] and [[Vertex_and_Edge_Properties]] because the incidence matrix is a specific type of graph matrix that captures the relationship between vertices and edges, indicating which vertices an edge connects.
The **incidence matrix** `I = (bij)` of a graph `G` with `m` vertices (`v1, v2, ..., vm`) and `n` edges (`e1, e2, ..., en`) is an `m x n` matrix. Its entries are defined as:
*   `bij = 1`, if edge `ej` is incident on vertex `vi`.
*   `bij = 0`, otherwise.
For undirected graphs, each column of the incidence matrix will contain exactly two `1`s, unless the edge is a loop, in which case it will contain only one `1` (because it's incident to only one unique vertex, but counted twice for degree). Think of it as a table where each row is a person, each column is a conversation, and a '1' means that person is part of that conversation.

# The Mental Model
Imagine a theater play where actors are **vertices** and scenes are **edges**. The **incidence matrix** would be a spreadsheet where each row is an actor and each column is a scene. You'd put a '1' in a cell if that actor appears in that scene. If Actor A and Actor B are in Scene 1, then Row A, Column 1 would have a '1', and Row B, Column 1 would also have a '1'. This way, you can easily see which actors are in which scenes, and which scenes involve which actors.

# Context & Framework
### The Translator: From "Lego" to "Jargon"
While the adjacency matrix describes relationships between vertices, the incidence matrix offers a different "jargon" perspective by focusing on the relationship between vertices and edges. It explicitly maps which vertex is an "endpoint" to which edge. This is particularly useful for certain algorithms and analyses where the connection itself (the edge) is as important as the nodes it connects. For example, in network flow problems, understanding which pipes (edges) are connected to which junctions (vertices) is paramount, and the incidence matrix directly provides this information.

# The Mastery Deep Dive
### The "Benchmark Comparison" Code Pair
Representing a graph using an incidence matrix is crucial for certain graph algorithms.

```python
# --- START_CODE:python ---
# Scenario 1: Simple undirected graph without loops or multiple edges
# Vertices: 0, 1, 2, 3
# Edges: e0=(0,1), e1=(0,2), e2=(1,2), e3=(2,3)

inc_matrix_simple = [
    # e0 e1 e2 e3
    [1, 1, 0, 0],  # Vertex 0 incident with e0, e1
    [1, 0, 1, 0],  # Vertex 1 incident with e0, e2
    [0, 1, 1, 1],  # Vertex 2 incident with e1, e2, e3
    [0, 0, 0, 1]   # Vertex 3 incident with e3
]

print("Incidence Matrix (Simple Graph):")
for row in inc_matrix_simple:
    print(row)

print("\n---")

# Scenario 2: Graph with multiple edges and a loop
# Vertices: A(0), B(1), C(2)
# Edges: e0=(A,B), e1=(A,B), e2=(B,C), e3=(C,C)

inc_matrix_complex = [
    # e0 e1 e2 e3
    [1, 1, 0, 0],  # Vertex A incident with e0, e1
    [1, 1, 1, 0],  # Vertex B incident with e0, e1, e2
    [0, 0, 1, 1]   # Vertex C incident with e2, e3 (loop)
]

print("Incidence Matrix (Complex Graph):")
for row in inc_matrix_complex:
    print(row)
# --- END_CODE:python ---
``````text
```text
Incidence Matrix (Simple Graph):
[1, 1, 0, 0]
[1, 0, 1, 0]
[0, 1, 1, 1]
[0, 0, 0, 1]

---
Incidence Matrix (Complex Graph):
[1, 1, 0, 0]
[1, 1, 1, 0]
[0, 0, 1, 1]
```
*Note: This Python code illustrates how incidence matrices are constructed for both simple graphs and graphs with multiple edges and loops.*

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A common pitfall with incidence matrices is interpreting loops. In an undirected graph, a non-loop edge will have exactly two `1`s in its column (one for each endpoint vertex). However, a loop `(v, v)` will only have *one* `1` in its column (at row `v`), because it's only incident to itself. This can be counter-intuitive if you expect two `1`s per column based on the "two endpoints" idea. Another limitation is that for dense graphs (many edges), the incidence matrix can be very large, potentially `m x n` (vertices x edges), which can be memory-intensive.

# Significance & Application
The incidence matrix is particularly useful for:
*   **Circuit Theory:** In electrical engineering, incidence matrices are fundamental for analyzing circuits. Kirchhoff's laws can be expressed elegantly using these matrices.
*   **Network Flow Problems:** Used to represent the flow capacity between nodes and the constraints at each node.
*   **Determining Connectivity:** The rank of the incidence matrix is related to the connectivity of the graph.
*   **Graph Isomorphism:** While complex, the incidence matrix can sometimes be used to compare the structural equivalence of two graphs.
*   **Academic Relevance:** It offers an alternative algebraic perspective to the adjacency matrix, providing different insights into graph structure.

# The Worked Example
Consider the graph `G` below from page 21 of the source:
Vertices: `V1, V2, V3, V4`
Edges: `e1=(V1,V2)`, `e2=(V1,V3)`, `e3=(V2,V3)`, `e4=(V3,V4)`

**Step-by-Step Determination of the Incidence Matrix:**

1.  **Determine the dimensions of the matrix:**
    *   There are 4 vertices (`V1, V2, V3, V4`) and 4 edges (`e1, e2, e3, e4`). So, the incidence matrix will be `4x4` (rows for vertices, columns for edges).

2.  **Populate the matrix entries (bij):**
    *   **Column `e1` (V1-V2):** `e1` is incident on `V1` and `V2`.
        *   `b11 = 1`
        *   `b21 = 1`
        *   `b31 = 0`
        *   `b41 = 0`
    *   **Column `e2` (V1-V3):** `e2` is incident on `V1` and `V3`.
        *   `b12 = 1`
        *   `b22 = 0`
        *   `b32 = 1`
        *   `b42 = 0`
    *   **Column `e3` (V2-V3):** `e3` is incident on `V2` and `V3`.
        *   `b13 = 0`
        *   `b23 = 1`
        *   `b33 = 1`
        *   `b43 = 0`
    *   **Column `e4` (V3-V4):** `e4` is incident on `V3` and `V4`.
        *   `b14 = 0`
        *   `b24 = 0`
        *   `b34 = 1`
        *   `b44 = 1`

3.  **Construct the Incidence Matrix I:**
    `$$ \boxed{I = \begin{pmatrix} 1 & 1 & 0 & 0 \\ 1 & 0 & 1 & 0 \\ 0 & 1 & 1 & 1 \\ 0 & 0 & 0 & 1 \end{pmatrix}} $$`

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** In an incidence matrix for an undirected graph without loops, how many '1's will each column contain?
> **Solution:** Each column will contain exactly **two '1's**, corresponding to the two distinct vertices that the edge connects.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You receive an incidence matrix `M` for a graph with 3 vertices and 3 edges:
`$$ M = \begin{pmatrix} 1 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 1 & 1 \end{pmatrix} $$`
**The Challenge:**
(a) Describe the graph (list vertices and edges).
(b) Explain if any edges are loops or if there are multiple edges based on `M`.
(c) How can you determine the degree of each vertex directly from the incidence matrix?
> **Solution:**
> (a) **Graph Description:**
>     *   Vertices: `v1, v2, v3` (rows)
>     *   Edges: `e1, e2, e3` (columns)
>     *   `e1` connects `v1` and `v2`.
>     *   `e2` connects `v1` and `v3`.
>     *   `e3` connects `v3` to itself (it's a loop).
>
> (b) **Loops or multiple edges:**
>     *   Column `e1` has two `1`s (v1, v2) - regular edge.
>     *   Column `e2` has two `1`s (v1, v3) - regular edge.
>     *   Column `e3` has only one `1` (v3) - this indicates a **loop** at vertex `v3`.
>     *   There are no multiple edges between the same pair of vertices, as no two columns are identical.
>
> (c) **Degree of each vertex:** The degree of each vertex `vi` can be found by summing the entries in its corresponding row `i`.
>     *   `deg(v1) = 1 + 1 + 0 = 2`
>     *   `deg(v2) = 1 + 0 + 0 = 1`
>     *   `deg(v3) = 0 + 1 + 1 = 2`

# Key Takeaways
*   The incidence matrix maps the direct relationship between vertices and edges.
*   Each column typically has two '1's for non-loop edges, but only one '1' for loops.
*   It provides a different perspective on graph structure compared to the adjacency matrix, particularly useful in network flow and circuit analysis.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Graph_Matrices]]          | Incidence matrix is a primary type of graph matrix.               |
| [[Vertex_and_Edge_Properties]] | Entries directly indicate which vertices are incident to which edges. |
| [[Degree_of_a_Vertex]]      | Vertex degrees can be determined by summing the '1's in each row of the incidence matrix. |
| [[Adjacency_Matrix]]        | Provides an alternative matrix representation, focusing on vertex-vertex connections. |
---