---
title: Vertex_And_Edge_Properties
created_at: '2026-01-22T09:18:55Z'
last_modified: '2026-01-22T09:18:55Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 8f1ce005-705a-4d2d-94c6-54984aca8ece
type: Foundational
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture 3 - Elements_of_Graph_Theory
aliases: 
- Graph_Components
- Nodes_and_Links
unit: 3_Elements_Of_Graph_Theory
parent: Graph_Definitions
---

# Definition
Before proceeding, ensure you master [[Graph_Definitions]] and Set_Theory because understanding vertices and edges requires a clear grasp of what a graph is and how its components are defined as sets.
The main elements of graph theory are **vertices** (also called nodes or points) and **edges** (also called links or lines), which are used to model relationships between objects. Two vertices `u` and `v` are **adjacent** if they are connected by an edge. The vertices `u` and `v` are then **incident** with that edge. Two edges are said to be **adjacent** if they share a common vertex. An edge joining a vertex to itself is called a **loop**. Two or more edges joining the same pair of vertices are called **multiple (parallel) edges**. Think of it as people (vertices) and their specific connections (edges), where adjacency and incidence describe how they relate.

# The Mental Model
Imagine a group of friends chatting at a party. Each person is a **vertex**. If two people are directly talking to each other, that's an **edge**. If Alice and Bob are talking, they are **adjacent vertices**, and their conversation is **incident** to both of them. If Alice suddenly starts talking to herself (a rare occurrence at parties!), that would be a **loop**. If two different conversations are happening between Bob and Charlie at the same time, those are **multiple (parallel) edges**.

# Context & Framework
### The Translator: From "Lego" to "Jargon"
Understanding graph theory often begins by translating intuitive concepts into formal terminology. The basic "Lego" pieces of any graph are its points and lines. These simple concepts are formally known as **vertices** and **edges**, respectively. When we say two points are "connected," in graph jargon, we mean their corresponding vertices are **adjacent**. Similarly, a line "touching" a point is formalized as an edge being **incident** to a vertex. This precise terminology ensures unambiguous communication in complex graph analysis.

# The Mastery Deep Dive
### Spot the Impostor (Don't be Fooled)
A common mistake is conflating "adjacency" with "incidence." While related, they describe different types of connections. **Adjacency** describes the relationship *between two vertices* (they are connected by an edge) or *between two edges* (they share a common vertex). **Incidence**, on the other hand, describes the relationship *between a vertex and an edge* (the vertex is one of the endpoints of the edge). An edge cannot be "adjacent" to a vertex, nor can a vertex be "incident" to another vertex.

### The "Kill Sheet" Comparison Table
Accurately distinguishing between various properties of vertices and edges is fundamental.

| Property          | Description                                                    | Example                                                   | "The Gotcha" Difference                                    |
| :
---------------- | :
------------------------------------------------------------- | :
-------------------------------------------------------- | :
--------------------------------------------------------- |
| **Adjacent Vertices** | Connected directly by an edge.                                 | `u` and `v` in `(u, v)`                                   | Describes a relationship *between two vertices*.           |
| **Incident (Vertex-Edge)** | A vertex is an endpoint of an edge.                          | `u` is incident with `(u, v)`                             | Describes a relationship *between a vertex and an edge*.   |
| **Adjacent Edges** | Share a common vertex.                                         | `(u, v)` and `(v, w)` share `v`                           | Describes a relationship *between two edges*.              |
| **Loop**          | An edge connecting a vertex to itself.                         | `(u, u)`                                                  | Connects a vertex to itself, contributes 2 to degree.      |
| **Multiple Edges** | Two or more edges joining the same pair of vertices.           | `(u, v)` and another `(u, v)`                             | Distinct edges between the same two vertices.              |

# Constraints & Limitations
### The "Grandma Test"
When explaining these concepts, it's easy to fall into circular definitions. For instance, explaining "adjacent vertices" as "vertices connected by an edge" and then defining an "edge" as "a connection between two vertices" can be confusing. The core `(V, E)` definition of a graph (defined in [[Graph_Definitions]]) breaks this circle. Another trap is assuming all connections are simple; the existence of `loops` and `multiple edges` demonstrates that real-world models can have complex, non-simple connections that must be precisely defined.

# Significance & Application
Understanding vertex and edge properties is the foundation for almost all graph algorithms and analyses. Whether determining connectivity, finding shortest paths, or optimizing networks, these basic properties dictate the behavior and structure of the entire graph. Academically, precise definitions are paramount to avoid ambiguity in theorems and proofs. In practice, misinterpreting these properties can lead to errors in system design, data modeling, and network analysis.

# The Worked Example
Consider a small road network between four towns: Town1, Town2, Town3, and Town4.

**Scenario:**
*   A highway connects Town1 and Town2 (Road A).
*   A local road also connects Town1 and Town2 (Road B).
*   A road connects Town2 and Town3 (Road C).
*   A scenic route connects Town3 and Town4 (Road D).
*   A circular bypass exists around Town1 (Road E).

**Step-by-Step Property Identification:**

1.  **Vertices:**
    *   `V = {Town1, Town2, Town3, Town4}`

2.  **Edges:**
    *   Road A: `(Town1, Town2)`
    *   Road B: `(Town1, Town2)`
    *   Road C: `(Town2, Town3)`
    *   Road D: `(Town3, Town4)`
    *   Road E: `(Town1, Town1)`

3.  **Identify Properties:**
    *   **Adjacent Vertices:**
        *   Town1 and Town2 (connected by Road A and Road B)
        *   Town2 and Town3 (connected by Road C)
        *   Town3 and Town4 (connected by Road D)
    *   **Incident (Vertex-Edge):**
        *   Town1 is incident with Road A, Road B, and Road E.
        *   Town2 is incident with Road A, Road B, and Road C.
        *   Town3 is incident with Road C and Road D.
        *   Town4 is incident with Road D.
    *   **Adjacent Edges:**
        *   Road A and Road C (share Town2)
        *   Road B and Road C (share Town2)
        *   Road C and Road D (share Town3)
    *   **Loop:**
        *   Road E `(Town1, Town1)` is a loop at Town1.
    *   **Multiple (Parallel) Edges:**
        *   Road A and Road B between Town1 and Town2 are multiple edges.

This example highlights how different properties coexist within a single graph, and how their precise definitions clarify complex connectivity.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** In a graph, if vertex `A` and vertex `B` are connected by an edge, are they considered incident or adjacent?
> **Solution:** They are considered **adjacent** vertices. The edge connecting them is **incident** with both vertex `A` and vertex `B`.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a graph `G` with vertices `{P, Q, R}`. There is an edge `e1` between `P` and `Q`, and another edge `e2` between `Q` and `R`. Additionally, there's a third edge `e3` also between `P` and `Q`. Finally, there's a loop `e4` at vertex `R`.
**The Challenge:** Based on this description, identify all pairs of adjacent vertices, all pairs of adjacent edges, all edges incident to vertex `Q`, and any loops or multiple edges.
> **Solution:**
> *   **Adjacent Vertices:** `(P, Q)` and `(Q, R)`. (Note: P and Q are connected by two edges, but are still a single pair of adjacent vertices).
> *   **Adjacent Edges:**
>     *   `(e1, e2)` (share vertex `Q`)
>     *   `(e3, e2)` (share vertex `Q`)
> *   **Edges Incident to Vertex Q:** `e1`, `e2`, `e3`.
> *   **Loops:** `e4` at vertex `R`.
> *   **Multiple Edges:** `e1` and `e3` between `P` and `Q`.

# Key Takeaways
*   Vertices are the fundamental entities, and edges are the connections between them.
*   Adjacency defines relationships between vertices or between edges, while incidence defines the relationship between a vertex and an edge.
*   Loops and multiple edges are specific types of connections that add complexity and detail to graph models.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                         |
| :
-------------------------- | :
---------------------------------------------------------------- |
| [[Graph_Definitions]]       | Vertex and edge properties are the building blocks of graph definitions. |
| [[Degree_of_a_Vertex]]      | The degree of a vertex is calculated based on its incident edges and loops. |
| [[Graph_Matrices]]          | The structure of adjacency and incidence matrices depends on vertex and edge properties. |
| [[Isomorphic_Graphs]]       | Isomorphism involves comparing the structural properties of vertices and edges between graphs. |
| [[Subgraph_Concepts]]       | Subgraphs are formed by selecting a subset of vertices and edges from a parent graph. |
| [[Complement_of_a_Graph]]   | The complement of a graph is defined by the absence of edges between non-adjacent vertices. |
---