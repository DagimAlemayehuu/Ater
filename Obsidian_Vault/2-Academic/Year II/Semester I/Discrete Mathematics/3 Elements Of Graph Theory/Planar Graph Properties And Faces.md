---
title: "Planar_Graph_Properties_And_Faces"
type: "Core"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "3 Elements Of Graph Theory"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.075628"
last_edited_time: "2026-04-16T13:47:45.075629"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Planar_Graphs]] and [[Cycles_and_Circuits_in_Graphs]] because the properties and faces of planar graphs are defined by how a planar drawing divides the plane into regions, bounded by cycles.
If `G` is a [[Planar_Graphs]], then any plane representation of `G` splits the plane into regions called **faces** of `G`. The unbounded region outside the graph is called the **infinite face**.
The **degree of a face `f`**, denoted `deg(f)`, is the number of edges encountered in a walk (or path) that begins and ends at the same vertex around the boundaries of the face `f`. Each bridge (edge that is not part of any cycle) is counted twice in the degree of the infinite face. If all faces have the same degree `r`, then `G` is a **face-regular graph of degree `r`**.
Think of a planar graph drawing as a map with countries: each country is a face, and the outer "rest of the world" is the infinite face. The degree of a country is the number of borders it shares.

# The Mental Model
Imagine a stained-glass window (a planar drawing). Each distinct piece of colored glass is a **face**. The frame around the entire window is the boundary of the **infinite face**. The "degree" of a piece of glass is how many individual strips of lead (edges) form its boundary. If all pieces of glass have the same number of lead strips around them, the window is "face-regular."

# Context & Framework
### Step-by-Step Derivation
The concept of face degrees is a direct extension of vertex degrees. Just as vertex degrees sum to `2|E|` (Handshaking Lemma), face degrees also have a similar relationship.
The sum of all the degrees of the faces in a planar graph is twice the number of edges in the graph. That is, `$$ \boxed{\displaystyle \sum_{i=1}^{n} \deg(f_i) = 2|E|} $$` where `n` is the number of faces (including the infinite face) and `deg(fi)` is the degree of face `fi`. This theorem is crucial for consistency checks and proofs related to planar graphs, linking the topological properties (faces) to the combinatorial properties (edges).

# The Mastery Deep Dive
### The "Oops!" List: Where Everyone Fails
A common mistake is incorrectly calculating the degree of the **infinite face**. While internal faces have clear boundaries, the infinite face uses all edges on the outer perimeter of the graph, and any "bridges" (edges whose removal increases the number of connected components) are counted twice because they contribute to both sides of the infinite face's boundary. Another trap is forgetting to include the infinite face when counting the total number of faces. Many algorithms for planar graphs rely on correct face identification and degree calculation.

# Constraints & Limitations
### The "Grandma Test"
The idea of an "infinite face" can be abstract for someone without a topological background. A "Grandma Test" might understand bounded regions (like rooms in a house plan) but struggle with the "outside" being considered a face with a defined "degree." The "trap" is the counter-intuitive nature of this unbounded region having a measurable boundary length. Moreover, for non-simple planar graphs (with loops or multiple edges), the rules for calculating face degrees can become more intricate.

# Significance & Application
Understanding planar graph properties and faces is critical in:
*   **Euler's Formula:** These concepts are directly used in [[Euler_Formula_for_Planar_Graphs]], which relates the number of vertices, edges, and faces in any connected planar graph.
*   **Algorithm Design:** Planar embedding algorithms, which find a drawing of a planar graph without crossings, rely on the properties of faces.
*   **Circuit Design:** For multi-layered circuit boards, understanding faces helps in routing wires and ensuring that different layers can be used effectively without unintended connections.
*   **Graph Drawing:** Optimizing the visual layout of networks for clarity, especially in areas like data visualization and cartography.
*   **Academic Relevance:** The theory of faces is a cornerstone of topological graph theory, providing a link between discrete structures and continuous geometry.

# The Worked Example
Consider the graph `K4` below (as a planar drawing):
(Diagram from page 54 of the source, specifically figure 'a' or 'b', which is a K4 drawn planarly)
Let's use the drawing of `K4` as a triangle with one vertex inside, connected to all three.
Vertices: 4
Edges: 6

**Step-by-Step Determination of Faces and their Degrees:**

1.  **Identify Internal Faces:**
    *   In the common planar drawing of `K4` (a triangle with a central vertex connected to all three outer vertices), there are three small triangles formed around the central vertex.
    *   Let `f1, f2, f3` be these three internal triangular faces.
    *   `deg(f1) = 3` (3 edges form its boundary)
    *   `deg(f2) = 3` (3 edges form its boundary)
    *   `deg(f3) = 3` (3 edges form its boundary)

2.  **Identify the Infinite Face:**
    *   The outermost region, bounded by the perimeter of the outer triangle, is the infinite face `f_inf`.
    *   `deg(f_inf) = 3` (3 edges form its boundary, the edges of the outer triangle).

3.  **Total Number of Faces:** `|F| = 3 (internal) + 1 (infinite) = 4` faces.

4.  **Verify Sum of Face Degrees:**
    *   `Sum_of_deg(fi) = deg(f1) + deg(f2) + deg(f3) + deg(f_inf)`
    *   `Sum_of_deg(fi) = 3 + 3 + 3 + 3 = 12`

5.  **Verify against `2|E|`:**
    *   `2|E| = 2 * 6 = 12`
    *   Since `Sum_of_deg(fi) = 2|E|` (`12 = 12`), this confirms the theorem for the sum of face degrees.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** What is the specific name for the unbounded region outside a planar graph when it's drawn in a plane?
> **Solution:** It is called the **infinite face**.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** Consider a connected planar graph `G` drawn as a square with one diagonal (4 vertices, 5 edges).
**The Challenge:**
(a) Identify all the faces of this graph and their degrees.
(b) Verify that the sum of the degrees of all faces is twice the number of edges.
(c) If you were to add another diagonal to the square, would the graph still be planar? Justify.
> **Solution:**
> (a) **Faces and their degrees:**
>     *   Drawing the square `V1-V2-V3-V4-V1` with diagonal `V1-V3`:
>     *   Internal Face 1 (`f1`): The triangle `V1-V2-V3-V1`. `deg(f1) = 3`.
>     *   Internal Face 2 (`f2`): The triangle `V1-V3-V4-V1`. `deg(f2) = 3`.
>     *   Infinite Face (`f_inf`): Bounded by the square `V1-V2-V3-V4-V1`. `deg(f_inf) = 4`.
>     *   Total faces `|F| = 3`.
>
> (b) **Verify sum of face degrees:**
>     *   Number of edges `|E| = 5`.
>     *   Sum of `deg(f)` = `3 + 3 + 4 = 10`.
>     *   `2|E| = 2 * 5 = 10`.
>     *   Since `10 = 10`, the theorem holds.
>
> (c) If you add another diagonal (`V2-V4`) to the square (which already has `V1-V3`), it would become a [[Complete_Graphs]] `K4`. `K4` is a **planar graph**, as demonstrated in [[Planar_Graphs]]. The new diagonal would intersect the existing one, but a planar drawing can still be found (e.g., drawing it as a triangle with a central vertex connected to all three). So yes, it would still be planar.

# Key Takeaways
*   A planar drawing divides the plane into regions called faces, including an infinite outer face.
*   The degree of a face is the number of edges on its boundary.
*   The sum of the degrees of all faces in a planar graph is twice the number of edges.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Planar_Graphs]]           | Faces and their properties are fundamental characteristics of planar graphs. |
| [[Cycles_and_Circuits_in_Graphs]] | Faces are bounded by cycles or closed walks in the planar graph. |
| [[Advanced_Graph_Properties]] | Faces are a key advanced topological property of graphs.        |
| [[Euler_Formula_for_Planar_Graphs]] | Euler's formula directly relates the number of faces to vertices and edges. |
| [[Vertex_and_Edge_Properties]] | Face degrees are calculated based on the edges forming their boundaries. |
---