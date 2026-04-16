---
title: Matrix_Representations_Of_Digraphs
created_at: '2026-01-18T11:29:47Z'
last_modified: '2026-01-18T11:29:47Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 3e6f79f5-4b7b-4d09-97b2-8bfb56daed5e
type: Core
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Chapter_Four_Directed_Graphs_Slides
aliases: []
unit: 4_Directed_Graphs
parent: Directed_Graph_Fundamentals
---

# Definition
Before proceeding, ensure you master [[Vertex_Degrees_in_Digraphs]] because calculating matrix row and column sums directly yields vertex degrees.
Graphs are visual, but computers need numbers. We use matrices to represent digraphs computationally.
1.  **Adjacency Matrix ($A$):** A square matrix recording connectivity between vertices. $A_{ij} = n$ if there are $n$ edges from vertex $i$ to vertex $j$.
2.  **Incidence Matrix ($I$):** A matrix recording relationships between vertices and edges. Rows are vertices, columns are edges.

# The Mental Model
*   **Adjacency Matrix:** Like a "Flight Distance Table" in a magazine, but instead of miles, it shows "Flights per day" from City Row to City Column.
*   **Incidence Matrix:** A "Ticket" list. Each column is a Ticket (Edge). It has a "Departure" (Vertex = 1) and an "Arrival" (Vertex = -1).

```python
# Adjacency Matrix for a Digraph with vertices 0, 1, 2
# Edge 0->1, Edge 1->2, Edge 2->0 (A Cycle)

#      To 0  To 1  To 2
adj = [[0,    1,    0],   # From 0
       [0,    0,    1],   # From 1
       [1,    0,    0]]   # From 2
# A_ij = 1 means there is an edge FROM i TO j
```
```text
// Scenario: Interpreting the Adjacency Matrix
// Output:
// Row 0: [0, 1, 0] -> Edge from 0 to 1. (Out-degree of 0 is 1)
// Column 0: [0, 0, 1] -> Edge from 2 to 0. (In-degree of 0 is 1)
// The matrix represents a cycle 0 -> 1 -> 2 -> 0.
```
*Note: Read Rows for "From", Columns for "To".*

# Context & Framework
### Adjacency Matrix ($A_{ij}$) Structure
For a graph with $m$ vertices $v_1, ..., v_m$:
*   **Rows ($i$):** Represent the **Origin** (From). Sum of Row $i$ = $\text{outdeg}(v_i)$.
*   **Columns ($j$):** Represent the **Destination** (To). Sum of Column $j$ = $\text{indeg}(v_j)$.
*   **Values:** $0$ = No edge. $n$ = Number of parallel edges (or 1 if simple).

### Incidence Matrix ($B_{ij}$) Structure
Rows are Vertices ($m$), Columns are Edges ($n$).
*   $1$: Edge starts here (Incident From / Out).
*   $-1$: Edge ends here (Incident To / In).
*   $0$: No connection.
*   **Loop Rule:** Customarily, loops are tricky in incidence matrices; sometimes represented as $2$, $0$, or handled separately depending on convention (slides define loop-free for incidence).

# The Mastery Deep Dive
### The "Blueprint" of Connectivity
The **Adjacency Matrix** is the standard for dense graphs. It allows checking "Is there a road from A to B?" in $O(1)$ time—just look up coordinate $(A, B)$.
$$ A = (a_{ij}) \quad \text{where } a_{ij} = \text{count of edges } v_i \to v_j $$

### The "Blueprint" of Topology
The **Incidence Matrix** captures the exact identity of edges. It is useful for network flow problems (Kirchhoff's laws).
$$ B_{ij} = \begin{cases} 1 & \text{edge } j \text{ leaves vertex } i \\ -1 & \text{edge } j \text{ enters vertex } i \\ 0 & \text{otherwise} \end{cases} $$
*Note: Each column (edge) must sum to exactly 0 (one +1, one -1), unless it's a loop.*

# Constraints & Limitations
### The "Space" Trade-off (Space Complexity)
*   **Adjacency Matrix:** Uses $O(V^2)$ space. Good for dense graphs (lots of edges). Bad for sparse graphs (mostly zeros).
*   **Incidence Matrix:** Uses $O(V \times E)$ space.

# Significance & Application
*   **Social Networks:** Adjacency matrix of "follows". $A^2$ (Matrix multiplication) can find "Friends of Friends".
*   **Physics:** Incidence matrices describe circuits in electrical engineering.

# The Worked Example
**Graph:** Vertices $\{1, 2\}$, Edges: $e_1: 1 \to 2$, $e_2: 1 \to 1$ (Loop), $e_3: 2 \to 1$.
**Construct Adjacency Matrix:**
*   $1 \to 1$ (Yes, $e_2$): $A_{11} = 1$
*   $1 \to 2$ (Yes, $e_1$): $A_{12} = 1$
*   $2 \to 1$ (Yes, $e_3$): $A_{21} = 1$
*   $2 \to 2$ (No): $A_{22} = 0$
$$ A = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix} $$

**Construct Incidence Matrix (Assuming loop-free definition from source, or handling loops carefully):**
*   *Note: Standard Incidence definition ($1, -1$) fails for loops (1 to 1) because a cell cannot be both 1 and -1. The source slides specify "Loop-free digraph" for Incidence Matrix definition.*
*   So, consider subgraph without loop $e_2$: $e_1 (1 \to 2)$, $e_3 (2 \to 1)$.
*   Col 1 ($e_1$): Row 1 (+1), Row 2 (-1).
*   Col 2 ($e_3$): Row 1 (-1), Row 2 (+1).
$$ I = \begin{pmatrix} 1 & -1 \\ -1 & 1 \end{pmatrix} $$

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** In an Adjacency Matrix, if the sum of Row 3 is 5, what does that tell you about Vertex 3?
> **Solution:** The Out-Degree of Vertex 3 is 5.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have an incidence matrix where Column 4 has a '1' at Row A and a '-1' at Row B. All other entries in Column 4 are 0. (a) Describe Edge 4. (b) What is the sum of any column in a standard incidence matrix?
> **Solution:**
> (a) Edge 4 is a directed edge from Vertex A to Vertex B ($A \to B$).
> (b) The sum is 0 (since $1 + (-1) = 0$).

# Key Takeaways
*   **Adjacency Matrix:** $A_{ij}$ is From $i$ To $j$. Row Sum = Out-Degree. Col Sum = In-Degree.
*   **Incidence Matrix:** Columns are edges. entries are $+1$ (Start) and $-1$ (End).
*   **Loop Limitation:** Incidence matrices ($1/-1$) cannot standardly represent loops without modification.

# Knowledge Graph Connections
| Concept | Connection / Relationship |
| :
--- | :
--- |
| [[Directed_Graph_Fundamentals]] | Matrices are the digital translation of the fundamental graph components. |
| [[Vertex_Degrees_in_Digraphs]] | Matrix sums provide a computational method to verify degrees. |
| [[Connectivity_in_Directed_Graphs]] | Matrix multiplication ($A^n$) is used to determine path existence and connectivity. |

---